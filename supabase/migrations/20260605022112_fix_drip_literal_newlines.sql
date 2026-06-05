-- Fix automation drips that have literal "\n" (backslash-n) instead of real newlines.
-- These were stored as escape sequences and render as raw text in previews/emails.
UPDATE public.automation_drips
SET message_template = REPLACE(message_template, E'\\n', E'\n')
WHERE message_template LIKE '%\\n%';

UPDATE public.automation_drips
SET subject = REPLACE(subject, E'\\n', E'\n')
WHERE subject LIKE '%\\n%';
