import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request body
    const { auth_id, name, email, phone } = await req.json()

    if (!auth_id || !name || !email) {
      throw new Error('Missing required fields: auth_id, name, email')
    }

    // Insert user data using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          auth_id: auth_id,
          name: name.trim(),
          email: email.trim(),
          phone: phone?.trim() || null,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Database error:', error)
      
      // Check if user already exists
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User already exists',
            data: null 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
      
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        data: data[0] 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})