-- Adicionar campo zip_code na tabela quiz_responses
ALTER TABLE public.quiz_responses 
ADD COLUMN IF NOT EXISTS zip_code TEXT;