-- Create quiz_responses table to store customer quiz submissions
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  room_size TEXT NOT NULL,
  services JSONB NOT NULL DEFAULT '[]',
  budget INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'quiz',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (public quiz)
CREATE POLICY "Anyone can submit quiz responses" 
ON public.quiz_responses 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admins to view all responses
CREATE POLICY "Admin users can view all quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_quiz_responses_updated_at
BEFORE UPDATE ON public.quiz_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();