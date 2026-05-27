-- 1a. Convert 4 SMS drips to email
UPDATE automation_drips SET
  channel = 'email',
  subject = 'We got your quote request, {{first_name}}!',
  message_template = 'Hi {{first_name}},

Thanks for reaching out to {{company_name}} — we just received your request for {{services}} and we''re on it.

My name is {{salesperson_name}} and I''ll personally make sure you get a clear, no-pressure quote. The next step is a quick in-home visit so we can measure, talk through options, and give you an accurate number.

{{view_request_button}}

Prefer to talk? Call or text me directly at {{company_phone}}.

Talk soon,
{{salesperson_name}}
{{company_name}}'
WHERE id = '9237ede4-65d7-47fd-893b-9c8d7a0dfd4f';

UPDATE automation_drips SET
  channel = 'email',
  subject = 'Still need help with your project, {{first_name}}?',
  message_template = 'Hi {{first_name}},

Just a quick check-in — are you still looking to move forward with your {{services}} project?

If now isn''t the right time, no problem. If it is, the fastest next step is locking in a quick in-home estimate:

{{view_request_button}}

Or call me directly at {{company_phone}}.

{{salesperson_name}}
{{company_name}}'
WHERE id = '7cd4f2f6-0568-47d8-8a9d-b2dd703d4a5e';

UPDATE automation_drips SET
  channel = 'email',
  subject = 'Any questions about your proposal, {{first_name}}?',
  message_template = 'Hi {{first_name}},

It''s {{salesperson_name}} with {{company_name}} — checking in on the proposal we sent over a few days ago.

If anything is unclear — scope, materials, timeline, pricing — I''m happy to walk through it. No pressure, just want to make sure you have what you need to make the right call.

{{view_quote_button}}

Or call me directly at {{company_phone}}.

Talk soon,
{{salesperson_name}}'
WHERE id = '10822afb-7907-4e57-97d9-880edddfd9a8';

UPDATE automation_drips SET
  channel = 'email',
  subject = 'Sorry we missed you, {{first_name}} — let''s reschedule',
  message_template = 'Hi {{first_name}},

Sorry we weren''t able to connect for your appointment. These things happen — let''s find a time that works better for you.

{{view_request_button}}

Or call me directly at {{company_phone}} and we''ll get it back on the calendar.

{{salesperson_name}}
{{company_name}}'
WHERE id = '0ec04612-816d-490c-8765-7080b05f60a4';

-- 1b. Append opt-out footer to every email drip (idempotent)
UPDATE automation_drips
SET message_template = message_template || E'\n\n<br><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="font-size:12px;color:#999;text-align:center">To unsubscribe from these emails, <a href="{{unsubscribe_url}}">click here</a>.</p>'
WHERE channel = 'email'
  AND message_template NOT LIKE '%{{unsubscribe_url}}%';