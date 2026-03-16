begin;

-- Follow-up state lives on candidates so the grid can suppress and resurface
-- rows without introducing a separate scheduler table.
alter table if exists public.candidates
  add column if not exists next_touch_due date,
  add column if not exists followup_reason text;

create or replace function public.set_followup(
  p_candidate_id uuid,
  p_due_date date,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reason text;
begin
  if p_candidate_id is null then
    raise exception 'p_candidate_id is required' using errcode = '22004';
  end if;

  if p_due_date is null then
    raise exception 'p_due_date is required' using errcode = '22004';
  end if;

  if p_due_date < current_date then
    raise exception 'p_due_date must be today or later' using errcode = '22007';
  end if;

  v_reason := left(trim(coalesce(p_reason, '')), 220);
  if v_reason = '' then
    raise exception 'p_reason is required' using errcode = '22004';
  end if;

  update public.candidates
  set
    next_touch_due = p_due_date,
    followup_reason = v_reason
  where candidate_id = p_candidate_id;

  if not found then
    raise exception 'Candidate not found for p_candidate_id %', p_candidate_id
      using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.set_followup(uuid, date, text)
to anon, authenticated, service_role;

comment on function public.set_followup(uuid, date, text) is
  'Sets candidate follow-up due date and reason for snooze workflow.';

commit;
