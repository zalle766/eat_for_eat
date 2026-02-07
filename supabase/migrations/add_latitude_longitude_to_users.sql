-- Add latitude and longitude for exact user location (for delivery)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
