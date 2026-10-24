-- !! SUPERSEDED by migration_task_subtasks.sql — do not run again: it would bring back
-- !! the old submit_stage_result that puts sub-tasks into user_tasks.
-- Run the whole file once in the Supabase SQL editor.
-- 1) Fixes: "column department_id of relation user_tasks does not exist"
--    The live submit_stage_result had been overwritten with a version that inserts department_id;
--    user_tasks has no such column and doesn't need one, so this restores the repo version.
-- 2) Saves who marked a test Done / raised an Issue (task_testing.tested_by), like
--    approval_checked_by / inform_checked_by already do for the later stages.

alter table public.task_testing add column if not exists tested_by text;

-- drop every existing version (including any stray overloads)
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
  v_parent public.user_tasks%rowtype;
  v_root_id bigint;
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
    select * into v_parent from public.user_tasks where id = r.task_id;
    if not found then
      raise exception 'Task % of this delivery not found', r.task_id;
    end if;

    -- root = top of the chain (a rework of a rework still counts under TASK-00047)
    select coalesce(
             (select tr.root_task_id from public.task_relations tr where tr.child_task_id = v_parent.id limit 1),
             v_parent.id)
      into v_root_id;
    select substring(task_no from '^TASK-[0-9]+') into v_root_no from public.user_tasks where id = v_root_id;
    v_root_no := coalesce(v_root_no, (select task_no from public.user_tasks where id = v_root_id));

    -- one numbering at a time per root task, so two issues never get the same number
    perform pg_advisory_xact_lock(v_root_id);
    select coalesce(max(substring(task_no from length(v_root_no) + 2)::int), 0) + 1
      into v_next
      from public.user_tasks
     where task_no like v_root_no || '-%'
       and substring(task_no from length(v_root_no) + 2) ~ '^[0-9]+$';

    v_source_no := case when p_stage = 'test' and r.tester_type is not null
                        then v_parent.task_no || '-' || left(r.tester_type, 1)
                        else v_parent.task_no end;

    v_posted_by := coalesce(p_by_user_id, 1);
    v_taken_from := r.made_by;
    if v_taken_from is null or v_taken_from = v_posted_by then
      v_taken_from := coalesce(r.company_id, case when v_posted_by = 1 then 2 else 1 end);
    end if;

    insert into public.user_tasks (
      task_no, given_date, posted_by, taken_from, company_id, system_id, type_of_work,
      expected_date_to_close, description_of_work, link_of_system, priority,
      assigned_member_1, assigned_by, assigned_at, status, is_testing_issue
    ) values (
      v_root_no || '-' || v_next, now(), v_posted_by, v_taken_from, r.company_id, r.system_id,
      (case p_stage when 'test' then 'Error Received' else 'Existing System Edit & Update' end)::public.work_type_enum,
      now() + interval '1 day',
      '[' || v_label || ' on DSP-' || lpad(coalesce(r.delivery_group, r.id)::text, 4, '0') || ' / ' || v_source_no || '] '
        || coalesce(p_remarks, ''),
      r.system_link, 'High'::public.priority_enum,
      r.made_by, v_posted_by, now(), 'In Progress'::public.task_status_enum, true
    )
    returning id into v_child_id;

    insert into public.task_relations (
      root_task_id, parent_task_id, child_task_id, source_testing_id, relation_type, remarks, created_by
    ) values (
      v_root_id, v_parent.id, v_child_id, r.id, v_relation, nullif(p_remarks, ''), p_by_user_id
    );
  end if;

  if p_stage = 'test' then
    update public.task_testing
       set test_status = p_status, tester_remarks = nullif(p_remarks, ''),
           tested_at = v_done_at, tested_by = v_by_name, updated_at = now()
     where id = r.id;
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

notify pgrst, 'reload schema';

-- check: should return no rows
select proname from pg_proc where prosrc ilike '%department_id%';
