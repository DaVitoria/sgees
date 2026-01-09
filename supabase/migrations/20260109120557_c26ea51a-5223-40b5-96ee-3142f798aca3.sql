-- Add folder number field to professor_disciplinas table
ALTER TABLE public.professor_disciplinas 
ADD COLUMN nr_pasta integer NULL;