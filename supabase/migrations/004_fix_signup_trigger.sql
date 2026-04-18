-- Fix the handle_new_user function to include the role field
-- This ensures that when users sign up, their role is properly saved to the profiles table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'individual')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to explain the function
COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a profile when a new user signs up, including their role';
