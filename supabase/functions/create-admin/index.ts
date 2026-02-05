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
    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      throw new Error('Missing required fields: email, password, name')
    }

    // Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true
    })

    if (authError) {
      console.error('Auth error:', authError)
      
      // Check if user already exists
      if (authError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'المدير موجود بالفعل',
            data: null 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
      
      throw authError
    }

    if (!authData.user) {
      throw new Error('Failed to create user')
    }

    // Insert user data with admin role using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          auth_id: authData.user.id,
          name: name.trim(),
          email: email.trim(),
          role: 'admin',
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Database error:', error)
      
      // Check if user profile already exists
      if (error.code === '23505') {
        // Update existing user to admin role
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('users')
          .update({ role: 'admin' })
          .eq('auth_id', authData.user.id)
          .select()

        if (updateError) {
          throw updateError
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'تم تحديث المستخدم إلى مدير بنجاح',
            data: updateData[0] 
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
        message: 'تم إنشاء حساب المدير بنجاح',
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