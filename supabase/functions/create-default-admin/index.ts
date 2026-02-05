import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // إنشاء المستخدم في Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: 'admin@fooddelivery.com',
      password: 'admin123456',
      email_confirm: true
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'فشل في إنشاء المستخدم في المصادقة: ' + authError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // إضافة المستخدم إلى جدول users
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .upsert({
        auth_id: authData.user.id,
        name: 'المدير الرئيسي',
        email: 'admin@fooddelivery.com',
        role: 'admin'
      })
      .select()

    if (userError) {
      console.error('User table error:', userError)
      return new Response(
        JSON.stringify({ error: 'فشل في إضافة المستخدم إلى قاعدة البيانات: ' + userError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم إنشاء المدير الافتراضي بنجاح',
        user: userData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'خطأ غير متوقع: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})