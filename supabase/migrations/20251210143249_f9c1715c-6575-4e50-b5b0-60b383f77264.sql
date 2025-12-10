-- Create function to notify user when a role is assigned
CREATE OR REPLACE FUNCTION public.notify_role_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_label text;
BEGIN
  -- Map role to Portuguese label
  v_role_label := CASE NEW.role
    WHEN 'admin' THEN 'Administrador'
    WHEN 'professor' THEN 'Professor'
    WHEN 'aluno' THEN 'Aluno'
    WHEN 'funcionario' THEN 'Funcionário'
    WHEN 'secretario' THEN 'Secretário'
    WHEN 'tesoureiro' THEN 'Tesoureiro'
    ELSE NEW.role::text
  END;
  
  -- Create in-app notification
  INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link)
  VALUES (
    NEW.user_id,
    'Perfil Atribuído',
    'O seu perfil foi definido como "' || v_role_label || '". Agora pode aceder às funcionalidades do sistema.',
    'info',
    '/dashboard'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles table
DROP TRIGGER IF EXISTS on_role_assigned ON public.user_roles;
CREATE TRIGGER on_role_assigned
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_role_assigned();