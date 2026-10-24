-- ============================================================================
-- migration_task_subtasks_step2.sql
-- Run AFTER migration_task_subtasks.sql has finished (it adds the 'In Testing' status).
--
-- Main tasks that were marked Completed when the developer finished them but whose
-- testing is not finished yet go back to 'In Testing':
--   - a sub-task of it is still open, or
--   - its latest delivery is neither approved nor fully tested (Frontend + Backend Done).
-- ============================================================================

update public.user_tasks u
   set status = 'In Testing', updated_at = now()
 where u.status = 'Completed'
   and (
     exists (select 1 from public.task_subtasks s
              where s.root_task_id = u.id and s.status not in ('Completed', 'Cancelled'))
     or exists (
       select 1
         from (select coalesce(tt.delivery_group, tt.id) as grp, tt.approval_status
                 from public.task_testing tt
                where tt.task_id = u.id
                order by tt.id desc
                limit 1) latest
        where latest.approval_status is distinct from 'Done'
          and not public.delivery_testing_done(latest.grp)
     )
   )
returning u.id, u.task_no;
