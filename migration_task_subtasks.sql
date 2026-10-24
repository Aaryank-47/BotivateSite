-- ============================================================================
-- migration_task_subtasks.sql
-- Sub-tasks get their own table.
--
--   user_tasks      only MAIN tasks (TASK-00047)
--   task_subtasks   every rework / issue task raised on it (TASK-00047-1, -2 ...) with its full
--                   task details, linked to the main task by root_task_id. Replaces task_relations.
--   task_testing    task_id is always the main task; subtask_id is set when the delivery is a sub-task's.
--
-- Main task status:
--   developer completes it      -> 'In Testing'
--   a sub-task is raised on it  -> 'In Testing'
--   latest Frontend + Backend tests of its delivery are Done and no sub-task is open -> 'Completed'
--   (only then it shows in Approval For Delivery)
--
-- Run this file once in the Supabase SQL Editor, then run migration_task_subtasks_step2.sql
-- (a new enum value can only be used after the transaction that added it has committed).
-- If any statement fails, the whole file is rolled back.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. New main-task status
-- ---------------------------------------------------------------------------
alter type public.task_status_enum add value if not exists 'In Testing' after 'In Progress';


-- ---------------------------------------------------------------------------
-- 2. task_subtasks
--    Relation columns first, then the same task columns as user_tasks, so a sub-task
--    can be shown and edited by the same screens as a main task.
--    id shares user_tasks' sequence: a task id is unique across both tables.
-- ---------------------------------------------------------------------------
create table if not exists public.task_subtasks (
  id bigint primary key,
  root_task_id bigint not null references public.user_tasks(id) on delete cascade,
  -- the sub-task this one was raised on; null when it was raised on the main task itself
  parent_subtask_id bigint references public.task_subtasks(id) on delete set null,
  -- the task_testing row that raised it (its tester_type says Frontend / Backend)
  source_testing_id bigint references public.task_testing(id) on delete set null,
  relation_type text not null
    check (relation_type in ('Testing Issue', 'Approval Not Done', 'Inform Not Done', 'DB Correction')),
  -- what the tester / approver wrote when raising it
  issue_remarks text,
  created_by bigint references public.users(id) on delete set null,

  task_no text unique,
  given_date timestamptz not null default now(),
  posted_by bigint not null references public.users(id),
  taken_from bigint not null references public.users(id),
  company_id bigint not null references public.users(id) on delete restrict,
  type_of_work public.work_type_enum not null,
  expected_date_to_close timestamptz not null,
  description_of_work text not null,
  system_id bigint references public.systems(id) on delete set null,
  link_of_system text,
  github_link text,
  attachment_file text,
  priority public.priority_enum not null default 'Medium',
  notes text,
  time_required timestamptz,
  assigned_member_1 bigint references public.users(id),
  assigned_member_2 bigint references public.users(id),
  assigned_by bigint references public.users(id),
  remarks text,
  status public.task_status_enum not null default 'In Progress',
  assigned_at timestamptz,
  approved_by bigint references public.users(id),
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_subtasks_not_self check (parent_subtask_id <> id)
);

do $$
begin
  execute format('alter table public.task_subtasks alter column id set default nextval(%L)',
                 pg_get_serial_sequence('public.user_tasks', 'id'));
end $$;

create index if not exists task_subtasks_root_idx on public.task_subtasks (root_task_id);
create index if not exists task_subtasks_parent_idx on public.task_subtasks (parent_subtask_id);
create index if not exists task_subtasks_source_idx on public.task_subtasks (source_testing_id);
create index if not exists task_subtasks_member_idx on public.task_subtasks (assigned_member_1);

alter table public.task_subtasks disable row level security;
grant select, insert, update, delete on public.task_subtasks to anon, authenticated;

alter table public.task_testing
  add column if not exists subtask_id bigint references public.task_subtasks(id) on delete cascade,
  -- name of the member who saved the test result (also added by fix_submit_stage_result.sql)
  add column if not exists tested_by text;
create index if not exists task_testing_subtask_idx on public.task_testing (subtask_id);


-- ---------------------------------------------------------------------------
-- 3. Move existing rework tasks out of user_tasks
--    Every task_relations.child_task_id becomes a task_subtasks row with the SAME id
--    (so old links keep pointing at it). Old rows could store another sub-task as
--    root_task_id, so the real root is found by walking up the parents.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.task_relations') is null then
    return; -- already migrated
  end if;

  insert into public.task_subtasks (
    id, root_task_id, parent_subtask_id, source_testing_id, relation_type, issue_remarks, created_by,
    task_no, given_date, posted_by, taken_from, company_id, type_of_work, expected_date_to_close,
    description_of_work, system_id, link_of_system, github_link, attachment_file, priority, notes,
    time_required, assigned_member_1, assigned_member_2, assigned_by, remarks, status, assigned_at,
    approved_by, approved_at, completed_at, created_at, updated_at
  )
  with recursive up as (
    select child_task_id as sub_id, parent_task_id as anc, 0 as depth from public.task_relations
    union all
    select up.sub_id, r.parent_task_id, up.depth + 1
      from up join public.task_relations r on r.child_task_id = up.anc
     where up.depth < 100
  ),
  roots as (
    select distinct on (sub_id) sub_id, anc as root_id
      from up
     where not exists (select 1 from public.task_relations r where r.child_task_id = up.anc)
     order by sub_id, depth desc
  ),
  rel as (
    select distinct on (child_task_id) * from public.task_relations order by child_task_id, id
  )
  select
    t.id, roots.root_id,
    case when exists (select 1 from public.task_relations p where p.child_task_id = rel.parent_task_id)
         then rel.parent_task_id end,
    rel.source_testing_id, rel.relation_type, rel.remarks, rel.created_by,
    t.task_no, t.given_date, t.posted_by, t.taken_from, t.company_id, t.type_of_work, t.expected_date_to_close,
    t.description_of_work, t.system_id, t.link_of_system, t.github_link, t.attachment_file, t.priority, t.notes,
    t.time_required, t.assigned_member_1, t.assigned_member_2, t.assigned_by, t.remarks, t.status, t.assigned_at,
    t.approved_by, t.approved_at, t.completed_at, t.created_at, t.updated_at
  from rel
  join roots on roots.sub_id = rel.child_task_id
  join public.user_tasks t on t.id = rel.child_task_id
  on conflict (id) do nothing;

  -- deliveries of a sub-task: task_id -> main task, subtask_id -> the sub-task
  update public.task_testing tt
     set subtask_id = s.id, task_id = s.root_task_id
    from public.task_subtasks s
   where tt.task_id = s.id;

  -- old link columns (no longer written) must not block removing the rows below
  update public.task_testing set issue_task_id = null where issue_task_id in (select id from public.task_subtasks);
  update public.task_testing set approval_task_id = null where approval_task_id in (select id from public.task_subtasks);
  update public.task_testing set inform_task_id = null where inform_task_id in (select id from public.task_subtasks);
  update public.task_testing set db_task_id = null where db_task_id in (select id from public.task_subtasks);
  update public.cmp_task set converted_task_id = null where converted_task_id in (select id from public.task_subtasks);

  drop view if exists public.task_relations_full;
  drop table public.task_relations;

  delete from public.user_tasks where id in (select id from public.task_subtasks);
end $$;


-- ---------------------------------------------------------------------------
-- 4. View for filters / reports: each sub-task with its main / parent task numbers
--    and the Frontend/Backend side that raised it.
-- ---------------------------------------------------------------------------
create or replace view public.task_subtasks_full as
select
  s.*,
  root.task_no   as root_task_no,
  parent.task_no as parent_task_no,
  tt.tester_type as source_tester_type
from public.task_subtasks s
join public.user_tasks root        on root.id = s.root_task_id
left join public.task_subtasks parent on parent.id = s.parent_subtask_id
left join public.task_testing tt   on tt.id = s.source_testing_id;

grant select on public.task_subtasks_full to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 5. Is a delivery's testing finished? (same rule as testingDone in schemaApi.js)
--    Every assigned tester type (Frontend / Backend) must have its latest row Done.
-- ---------------------------------------------------------------------------
create or replace function public.delivery_testing_done(p_group bigint) returns boolean
language sql stable as $$
  with parts as (
    select * from public.task_testing where coalesce(delivery_group, id) = p_group
  ),
  latest as (
    select distinct on (tester_type) tester_id, test_status
      from parts where tester_type is not null
     order by tester_type, id desc
  )
  select case
    when exists (select 1 from parts where tester_type is not null)
      then not exists (select 1 from latest where tester_id is null or test_status is distinct from 'Done')
    -- old rows without tester_type
    else exists (select 1 from parts)
         and not exists (select 1 from parts where tester_id is null or test_status is distinct from 'Done')
  end;
$$;


-- ---------------------------------------------------------------------------
-- 6. RPC: Task Update -> Complete
--    Main task  -> 'In Testing'.  Sub-task -> 'Completed'.
--    Either way a new task_testing row is queued for Assign Tester. A sub-task raised by
--    a testing issue inherits tester_type and delivery_group from that issue's test row.
-- ---------------------------------------------------------------------------
create or replace function public.complete_task_with_delivery(
  p_task_id bigint,
  p_system_link text default null,
  p_github_link text default null,
  p_login_id text default null,
  p_password text default null,
  p_remarks text default null,
  p_made_by bigint default null,
  p_company_id bigint default null,
  p_system_id bigint default null,
  p_type_of_product text default null
) returns bigint
language plpgsql as $$
declare
  v_sub public.task_subtasks%rowtype;
  v_root_id bigint;
  v_testing_id bigint;
  v_tester_type text;
  v_delivery_group bigint;
begin
  select * into v_sub from public.task_subtasks where id = p_task_id for update;

  if found then
    update public.task_subtasks
       set status = 'Completed',
           completed_at = now(),
           updated_at = now(),
           link_of_system = coalesce(nullif(p_system_link, ''), link_of_system),
           github_link = coalesce(nullif(p_github_link, ''), github_link),
           remarks = coalesce(nullif(p_remarks, ''), remarks)
     where id = p_task_id;
    v_root_id := v_sub.root_task_id;

    if v_sub.relation_type = 'Testing Issue' then
      select tt.tester_type, coalesce(tt.delivery_group, tt.id)
        into v_tester_type, v_delivery_group
        from public.task_testing tt
       where tt.id = v_sub.source_testing_id;
    end if;
  else
    update public.user_tasks
       set status = 'In Testing',
           completed_at = now(),
           updated_at = now(),
           link_of_system = coalesce(nullif(p_system_link, ''), link_of_system),
           github_link = coalesce(nullif(p_github_link, ''), github_link),
           remarks = coalesce(nullif(p_remarks, ''), remarks)
     where id = p_task_id;
    if not found then
      raise exception 'Task % not found', p_task_id;
    end if;
    v_root_id := p_task_id; -- v_sub stays all-null, so subtask_id is null
  end if;

  insert into public.task_testing (
    task_id, subtask_id, made_by, company_id, system_id, type_of_product, date_of_delivery,
    system_link, github_link, system_login_id, system_password,
    tester_type, delivery_group, test_status, created_at, updated_at
  ) values (
    v_root_id, v_sub.id, p_made_by, p_company_id, p_system_id, p_type_of_product, now(),
    nullif(p_system_link, ''), nullif(p_github_link, ''), nullif(p_login_id, ''), nullif(p_password, ''),
    v_tester_type, v_delivery_group, 'Pending', now(), now()
  )
  returning id into v_testing_id;

  return v_testing_id;
end;
$$;


-- ---------------------------------------------------------------------------
-- 7. RPC: Assign Tester
--    Assign Frontend and/or Backend tester. If both testers are picked, a second
--    row is created in the same transaction. Either one or both can be selected.
-- ---------------------------------------------------------------------------
create or replace function public.assign_testers(
  p_testing_id bigint,
  p_frontend_tester_id bigint default null,
  p_backend_tester_id bigint default null,
  p_expected_date timestamptz default null,
  p_remarks text default null,
  p_assigned_by bigint default null
) returns void
language plpgsql as $$
declare
  r public.task_testing%rowtype;
  v_type text;
  v_other text;
  v_tester bigint;
  v_other_tester bigint;
begin
  -- lock the row so two people assigning at once cannot both split it
  select * into r from public.task_testing where id = p_testing_id for update;
  if not found then
    raise exception 'Testing row % not found', p_testing_id;
  end if;
  if r.tester_id is not null then
    raise exception 'A tester is already assigned to this row';
  end if;

  if p_frontend_tester_id is null and p_backend_tester_id is null then
    raise exception 'Select at least one tester';
  end if;

  if r.tester_type is not null then
    v_type := r.tester_type;
    v_tester := case v_type when 'Frontend' then p_frontend_tester_id else p_backend_tester_id end;
    if v_tester is null then
      raise exception 'Select the % tester', v_type;
    end if;

    update public.task_testing
       set tester_id = v_tester,
           delivery_group = coalesce(delivery_group, id),
           expected_testing_date = p_expected_date,
           assign_remarks = nullif(p_remarks, ''),
           assigned_by = p_assigned_by,
           assigned_at = now(),
           updated_at = now()
     where id = r.id;
  else
    v_type := case when p_frontend_tester_id is not null then 'Frontend' else 'Backend' end;
    v_tester := case v_type when 'Frontend' then p_frontend_tester_id else p_backend_tester_id end;

    update public.task_testing
       set tester_id = v_tester,
           tester_type = v_type,
           delivery_group = coalesce(delivery_group, id),
           expected_testing_date = p_expected_date,
           assign_remarks = nullif(p_remarks, ''),
           assigned_by = p_assigned_by,
           assigned_at = now(),
           updated_at = now()
     where id = r.id;

    v_other := case v_type when 'Frontend' then 'Backend' else 'Frontend' end;
    v_other_tester := case v_other when 'Frontend' then p_frontend_tester_id else p_backend_tester_id end;

    -- Only insert the second row if the other tester was also provided
    if v_other_tester is not null then
      insert into public.task_testing (
        task_id, subtask_id, made_by, company_id, system_id, type_of_product, date_of_delivery,
        system_link, github_link, system_login_id, system_password,
        tester_type, delivery_group, test_status,
        tester_id, expected_testing_date, assign_remarks, assigned_by, assigned_at,
        created_at, updated_at
      ) values (
        r.task_id, r.subtask_id, r.made_by, r.company_id, r.system_id, r.type_of_product, r.date_of_delivery,
        r.system_link, r.github_link, r.system_login_id, r.system_password,
        v_other, coalesce(r.delivery_group, r.id), 'Pending',
        v_other_tester,
        p_expected_date,
        nullif(p_remarks, ''),
        p_assigned_by,
        now(),
        now(), now()
      );
    end if;
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 8. RPC: Tester / Approval For Delivery / Inform to Customer result
--    p_stage = 'test' | 'approval' | 'inform'
--    Failing status (test: Issue, approval/inform: Not Done) creates, in ONE transaction:
--      a) the sub-task in task_subtasks, numbered from the main task
--         (TASK-00047 -> TASK-00047-1, TASK-00047-2 ...), main task back to 'In Testing',
--      b) the stage result on task_testing.
--    A test Done that finishes the delivery's testing marks the main task 'Completed'.
--    Returns the new sub-task id (or null).
-- ---------------------------------------------------------------------------
do $$
declare f regprocedure;
begin
  for f in select oid::regprocedure from pg_proc
            where proname = 'submit_stage_result' and pronamespace = 'public'::regnamespace
  loop
    execute 'drop function ' || f;
  end loop;
end $$;

create or replace function public.submit_stage_result(
  p_testing_id bigint,
  p_stage text,
  p_status text,
  p_remarks text default null,
  p_by_user_id bigint default null,
  p_by_name text default null
) returns bigint
language plpgsql as $$
declare
  r public.task_testing%rowtype;
  v_root public.user_tasks%rowtype;
  v_tested_no text;
  v_root_no text;
  v_next int;
  v_child_id bigint;
  v_fail text := case p_stage when 'test' then 'Issue' else 'Not Done' end;
  v_relation text := case p_stage when 'test' then 'Testing Issue'
                                  when 'approval' then 'Approval Not Done'
                                  else 'Inform Not Done' end;
  v_label text := case p_stage when 'test' then 'Testing issue'
                               when 'approval' then 'Delivery not approved'
                               else 'Customer not informed' end;
  v_source_no text;
  v_posted_by bigint;
  v_taken_from bigint;
  v_done_at timestamptz := case when p_status = 'Pending' then null else now() end;
  v_by_name text;
begin
  if p_stage not in ('test', 'approval', 'inform') then
    raise exception 'Unknown stage %', p_stage;
  end if;

  -- who marked it Done / raised the issue: the logged-in member (name from the app, else from users)
  v_by_name := coalesce(nullif(p_by_name, ''), (select u.name from public.users u where u.id = p_by_user_id));

  select * into r from public.task_testing where id = p_testing_id for update;
  if not found then
    raise exception 'Testing row % not found', p_testing_id;
  end if;

  if p_status = v_fail then
    select * into v_root from public.user_tasks where id = r.task_id;
    if not found then
      raise exception 'Task % of this delivery not found', r.task_id;
    end if;
    v_tested_no := coalesce((select s.task_no from public.task_subtasks s where s.id = r.subtask_id), v_root.task_no);
    v_root_no := coalesce(substring(v_root.task_no from '^TASK-[0-9]+'), v_root.task_no);

    -- one numbering at a time per main task, so two issues never get the same number
    perform pg_advisory_xact_lock(v_root.id);
    select coalesce(max(substring(task_no from length(v_root_no) + 2)::int), 0) + 1
      into v_next
      from public.task_subtasks
     where root_task_id = v_root.id
       and task_no like v_root_no || '-%'
       and substring(task_no from length(v_root_no) + 2) ~ '^[0-9]+$';

    v_source_no := case when p_stage = 'test' and r.tester_type is not null
                        then v_tested_no || '-' || left(r.tester_type, 1)
                        else v_tested_no end;

    v_posted_by := coalesce(p_by_user_id, 1);
    v_taken_from := r.made_by;
    if v_taken_from is null or v_taken_from = v_posted_by then
      v_taken_from := coalesce(r.company_id, case when v_posted_by = 1 then 2 else 1 end);
    end if;

    insert into public.task_subtasks (
      root_task_id, parent_subtask_id, source_testing_id, relation_type, issue_remarks, created_by,
      task_no, given_date, posted_by, taken_from, company_id, system_id, type_of_work,
      expected_date_to_close, description_of_work, link_of_system, priority,
      assigned_member_1, assigned_member_2, assigned_by, assigned_at, status
    ) values (
      v_root.id, r.subtask_id, r.id, v_relation, nullif(p_remarks, ''), p_by_user_id,
      v_root_no || '-' || v_next, now(), v_posted_by, v_taken_from, r.company_id, r.system_id,
      (case p_stage when 'test' then 'Error Received' else 'Existing System Edit & Update' end)::public.work_type_enum,
      now() + interval '1 day',
      '[' || v_label || ' on DSP-' || lpad(coalesce(r.delivery_group, r.id)::text, 4, '0') || ' / ' || v_source_no || '] '
        || coalesce(p_remarks, ''),
      r.system_link, 'High'::public.priority_enum,
      -- members are the main task's, set once when it was first assigned
      coalesce(v_root.assigned_member_1, r.made_by), v_root.assigned_member_2,
      v_posted_by, now(), 'In Progress'::public.task_status_enum
    )
    returning id into v_child_id;

    update public.user_tasks set status = 'In Testing', updated_at = now()
     where id = v_root.id and status is distinct from 'In Testing';
  end if;

  if p_stage = 'test' then
    update public.task_testing
       set test_status = p_status, tester_remarks = nullif(p_remarks, ''),
           tested_at = v_done_at, tested_by = v_by_name, updated_at = now()
     where id = r.id;

    -- last test of the delivery Done and nothing left to fix -> main task Completed
    if p_status = 'Done'
       and public.delivery_testing_done(coalesce(r.delivery_group, r.id))
       and not exists (select 1 from public.task_subtasks s
                        where s.root_task_id = r.task_id and s.status not in ('Completed', 'Cancelled')) then
      update public.user_tasks set status = 'Completed', updated_at = now()
       where id = r.task_id and status is distinct from 'Completed';
    end if;
  elsif p_stage = 'approval' then
    update public.task_testing
       set approval_status = p_status, approval_remarks = nullif(p_remarks, ''),
           approval_checked_at = v_done_at, approval_checked_by = v_by_name, updated_at = now()
     where id = r.id
        or (r.delivery_group is not null and delivery_group = r.delivery_group);
  else
    update public.task_testing
       set inform_status = p_status, inform_remarks = nullif(p_remarks, ''),
           inform_checked_at = v_done_at, inform_checked_by = v_by_name, updated_at = now()
     where id = r.id
        or (r.delivery_group is not null and delivery_group = r.delivery_group);
  end if;

  return v_child_id;
end;
$$;

grant execute on function public.delivery_testing_done(bigint) to anon, authenticated;
grant execute on function public.complete_task_with_delivery(bigint, text, text, text, text, text, bigint, bigint, bigint, text) to anon, authenticated;
grant execute on function public.assign_testers(bigint, bigint, bigint, timestamptz, text, bigint) to anon, authenticated;
grant execute on function public.submit_stage_result(bigint, text, text, text, bigint, text) to anon, authenticated;

-- let the Supabase API see the new table / view / functions right away
notify pgrst, 'reload schema';
