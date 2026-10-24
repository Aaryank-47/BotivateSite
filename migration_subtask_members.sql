-- ============================================================================
-- migration_subtask_members.sql
-- Sub-tasks keep the main task's members.
--
--   Members (assigned_member_1 / assigned_member_2) are set once, when the main task in
--   user_tasks is first assigned from the Tasks Table. Every sub-task raised on it
--   (TASK-00047-1, -2 ...) now gets those same two members instead of the delivery's maker.
--
--   Triggers (section 3) keep it that way whatever screen writes the members:
--     - a sub-task's members are always overwritten with its main task's
--     - changing a main task's members (Forward / Reassign) changes all its sub-tasks too
--
-- Run this file in the Supabase SQL Editor (after migration_task_subtasks.sql).
-- Safe to run again.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. submit_stage_result: same as migration_task_subtasks.sql, except the new sub-task
--    takes assigned_member_1 / assigned_member_2 from the main task.
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

grant execute on function public.submit_stage_result(bigint, text, text, text, bigint, text) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 2. Existing sub-tasks: copy the main task's members onto them
--    (only where the main task has been assigned).
-- ---------------------------------------------------------------------------
update public.task_subtasks s
   set assigned_member_1 = t.assigned_member_1,
       assigned_member_2 = t.assigned_member_2,
       updated_at = now()
  from public.user_tasks t
 where t.id = s.root_task_id
   and t.assigned_member_1 is not null
   and (s.assigned_member_1 is distinct from t.assigned_member_1
        or s.assigned_member_2 is distinct from t.assigned_member_2);


-- ---------------------------------------------------------------------------
-- 3. Triggers: sub-task members always equal the main task's.
-- ---------------------------------------------------------------------------

-- a) any insert / member change on a sub-task -> take the main task's members
--    (only once the main task is assigned; until then the sub-task keeps what it was given)
create or replace function public.subtask_members_from_root()
returns trigger
language plpgsql as $$
declare
  v_m1 bigint;
  v_m2 bigint;
begin
  select assigned_member_1, assigned_member_2 into v_m1, v_m2
    from public.user_tasks where id = new.root_task_id;
  if v_m1 is not null then
    new.assigned_member_1 := v_m1;
    new.assigned_member_2 := v_m2;
  end if;
  return new;
end;
$$;

drop trigger if exists task_subtasks_members_from_root on public.task_subtasks;
create trigger task_subtasks_members_from_root
  before insert or update of assigned_member_1, assigned_member_2, root_task_id
  on public.task_subtasks
  for each row execute function public.subtask_members_from_root();

-- b) main task's members change -> copy them onto all its sub-tasks
create or replace function public.root_members_to_subtasks()
returns trigger
language plpgsql as $$
begin
  if new.assigned_member_1 is not null then
    update public.task_subtasks
       set assigned_member_1 = new.assigned_member_1,
           assigned_member_2 = new.assigned_member_2,
           updated_at = now()
     where root_task_id = new.id
       and (assigned_member_1 is distinct from new.assigned_member_1
            or assigned_member_2 is distinct from new.assigned_member_2);
  end if;
  return null;
end;
$$;

drop trigger if exists user_tasks_members_to_subtasks on public.user_tasks;
create trigger user_tasks_members_to_subtasks
  after update of assigned_member_1, assigned_member_2
  on public.user_tasks
  for each row
  when (old.assigned_member_1 is distinct from new.assigned_member_1
        or old.assigned_member_2 is distinct from new.assigned_member_2)
  execute function public.root_members_to_subtasks();

notify pgrst, 'reload schema';
