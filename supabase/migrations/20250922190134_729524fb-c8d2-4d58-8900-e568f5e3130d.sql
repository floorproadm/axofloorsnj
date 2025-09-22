-- Create a unified leads table to manage all types of leads
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  lead_source TEXT NOT NULL DEFAULT 'contact_form', -- 'quiz', 'contact_form', 'phone_call', 'referral', etc.
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  services JSONB DEFAULT '[]'::jsonb,
  budget INTEGER,
  room_size TEXT,
  location TEXT,
  address TEXT,
  city TEXT,
  zip_code TEXT,
  message TEXT,
  assigned_to UUID, -- admin user id
  follow_up_date DATE,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  converted_to_project_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public lead submissions" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin users can manage all leads" 
ON public.leads 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_source ON public.leads(lead_source);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_leads_follow_up ON public.leads(follow_up_date);

-- Function to migrate existing quiz responses to leads table
CREATE OR REPLACE FUNCTION migrate_quiz_responses_to_leads()
RETURNS void AS $$
BEGIN
  INSERT INTO public.leads (
    name, email, phone, lead_source, services, budget, room_size, 
    city, zip_code, created_at, updated_at
  )
  SELECT 
    name, email, phone, 'quiz' as lead_source, services, budget, room_size,
    city, zip_code, created_at, updated_at
  FROM public.quiz_responses
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_quiz_responses_to_leads();