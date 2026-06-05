UPDATE public.automation_drips
SET message_template = REPLACE(message_template, E'\\n', E'\n')
WHERE message_template LIKE '%' || E'\\' || 'n%';

UPDATE public.automation_drips
SET subject = REPLACE(subject, E'\\n', E'\n')
WHERE subject LIKE '%' || E'\\' || 'n%';