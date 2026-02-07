-- Add address and city columns to users table for checkout auto-fill
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;
