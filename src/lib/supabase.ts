import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string;
  rating: number;
  delivery_time: string;
  delivery_fee: number;
  image_url: string;
  phone: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  is_open: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  created_at: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  rating: number;
  vehicle_type: string;
  license_plate: string;
  current_latitude: number;
  current_longitude: number;
  is_available: boolean;
  created_at: string;
}
