-- Add RLS policies for professor_disciplinas table

-- Policy for SELECT: Allow admin, secretario, and professors to view
CREATE POLICY "Admins and secretarios can view all professor_disciplinas"
ON public.professor_disciplinas
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'secretario') OR
  public.has_role(auth.uid(), 'professor')
);

-- Policy for INSERT: Allow admin and secretario to insert
CREATE POLICY "Admins and secretarios can insert professor_disciplinas"
ON public.professor_disciplinas
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'secretario')
);

-- Policy for UPDATE: Allow admin and secretario to update
CREATE POLICY "Admins and secretarios can update professor_disciplinas"
ON public.professor_disciplinas
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'secretario')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'secretario')
);

-- Policy for DELETE: Allow admin and secretario to delete
CREATE POLICY "Admins and secretarios can delete professor_disciplinas"
ON public.professor_disciplinas
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'secretario')
);