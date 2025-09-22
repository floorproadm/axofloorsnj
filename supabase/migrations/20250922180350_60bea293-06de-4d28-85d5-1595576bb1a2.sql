-- Fix search path issue for log_admin_access function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;