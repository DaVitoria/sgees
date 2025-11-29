-- Create helper functions for role management

-- Function to assign admin role by email (for initial setup)
CREATE OR REPLACE FUNCTION public.assign_admin_role_by_email(admin_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user_id from profiles table
  SELECT id INTO target_user_id
  FROM profiles
  WHERE email = admin_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  -- Check if admin role already exists
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
    RETURN;
  END IF;
  
  -- Insert admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'admin');
END;
$$;

-- Helper function for admins to easily assign roles
CREATE OR REPLACE FUNCTION public.admin_assign_role(target_email TEXT, target_role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Verify current user is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;
  
  -- Get target user id
  SELECT id INTO target_user_id
  FROM profiles
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;
  
  -- Check if role already exists
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id AND role = target_role) THEN
    RETURN;
  END IF;
  
  -- Insert role
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, target_role);
END;
$$;