-- Update the existing admin user role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'axofloorsnj@gmail.com';