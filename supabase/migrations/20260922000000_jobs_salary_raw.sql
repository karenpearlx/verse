-- Store the salary exactly as the original listing wrote it, so Verse can
-- display it verbatim instead of a re-formatted guess. Parsed numeric columns
-- stay for sorting and the rate calculator.
alter table public.jobs add column if not exists salary_raw text;
