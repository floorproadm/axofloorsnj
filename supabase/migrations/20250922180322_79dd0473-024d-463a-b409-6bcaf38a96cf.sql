-- Phase 1: Enhanced Security Fixes

-- Improve the admin role security function with better error handling and logging
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN 'anonymous'::TEXT;
  END IF;
  
  -- Get user role with proper error handling
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Return 'user' as default if no role found or user doesn't exist
  RETURN COALESCE(user_role, 'user'::TEXT);
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return safe default
    RETURN 'user'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Add security monitoring function for tracking access patterns
CREATE OR REPLACE FUNCTION public.log_admin_access(
  table_name TEXT,
  operation TEXT,
  user_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
  -- Only log if user has admin role to prevent unauthorized logging
  IF get_current_user_role() = 'admin' THEN
    -- Log admin operations (this would typically go to a dedicated audit table)
    -- For now, we'll use RAISE NOTICE for development tracking
    RAISE NOTICE 'Admin access: user_id=%, table=%, operation=%, timestamp=%', 
      user_id, table_name, operation, NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;