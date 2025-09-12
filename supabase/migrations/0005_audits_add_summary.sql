-- Add summary JSON to audits for consolidated site report

alter table public.audits
  add column if not exists summary jsonb;

