-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Funcionarios can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate as PERMISSIVE policies (default behavior, properly OR'd together)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins and secretarios can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'secretario'::app_role));

CREATE POLICY "Funcionarios can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'funcionario'::app_role));