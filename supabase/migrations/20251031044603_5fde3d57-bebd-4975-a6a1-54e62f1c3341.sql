-- CRITICAL SECURITY FIX: Move roles to separate table using existing user_role enum

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles;

-- Add soft delete to books
ALTER TABLE public.books ADD COLUMN is_deleted BOOLEAN DEFAULT false;

-- Add issued_by_admin_id and fine_amount to issued_books
ALTER TABLE public.issued_books ADD COLUMN issued_by_admin_id UUID REFERENCES auth.users(id);
ALTER TABLE public.issued_books ADD COLUMN fine_amount NUMERIC DEFAULT 0;

-- Update RLS policies to use new role system

-- Books policies
DROP POLICY IF EXISTS "Only admins can delete books" ON public.books;
DROP POLICY IF EXISTS "Only admins can insert books" ON public.books;
DROP POLICY IF EXISTS "Only admins can update books" ON public.books;

CREATE POLICY "Only admins can delete books" ON public.books
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert books" ON public.books
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update books" ON public.books
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update books view policy to hide deleted books
DROP POLICY IF EXISTS "Anyone can view books" ON public.books;
CREATE POLICY "Anyone can view non-deleted books" ON public.books
FOR SELECT TO authenticated
USING (is_deleted = false);

-- Issued books policies
DROP POLICY IF EXISTS "Only admins can insert issued books" ON public.issued_books;
DROP POLICY IF EXISTS "Only admins can update issued books" ON public.issued_books;

CREATE POLICY "Only admins can insert issued books" ON public.issued_books
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update issued books" ON public.issued_books
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own role" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Only admins can insert roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update handle_new_user function to use user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles (without role)
  INSERT INTO public.profiles (id, full_name, class_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'class_level')::INTEGER, 5)
  );
  
  -- Insert role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  
  RETURN NEW;
END;
$$;