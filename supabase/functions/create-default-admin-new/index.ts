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
      
      // إذا كان المستخدم موجود، نحصل على بياناته
      if (authError.message.includes('already registered')) {
        const { data: existingUser } = await supabaseClient.auth.admin.listUsers()
        const user = existingUser.users.find(u => u.email === 'admin@fooddelivery.com')
        
        if (user) {
          // التحقق من وجوده في جدول المديرين
          const { data: existingAdmin } = await supabaseClient
            .from('admins')
            .select('*')
            .eq('auth_id', user.id)
            .single()

          if (existingAdmin) {
            return new Response(
              JSON.stringify({ 
                success: true, 
                message: 'المدير الافتراضي موجود بالفعل',
                admin: existingAdmin 
              }),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          // إضافة المستخدم الموجود إلى جدول المديرين
          const { data: adminData, error: adminError } = await supabaseClient
            .from('admins')
            .insert({
              auth_id: user.id,
              name: 'المدير الرئيسي',
              email: 'admin@fooddelivery.com',
              role: 'admin',
              permissions: { all: true },
              is_active: true
            })
            .select()

          if (adminError) {
            throw adminError
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'تم إضافة المدير الافتراضي بنجاح',
              admin: adminData[0] 
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }
      
      return new Response(
        JSON.stringify({ error: 'فشل في إنشاء المستخدم في المصادقة: ' + authError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // إضافة المستخدم إلى جدول المديرين
    const { data: adminData, error: adminError } = await supabaseClient
      .from('admins')
      .insert({
        auth_id: authData.user.id,
        name: 'المدير الرئيسي',
        email: 'admin@fooddelivery.com',
        role: 'admin',
        permissions: { all: true },
        is_active: true
      })
      .select()

    if (adminError) {
      console.error('Admin table error:', adminError)
      return new Response(
        JSON.stringify({ error: 'فشل في إضافة المدير إلى قاعدة البيانات: ' + adminError.message }),
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
        admin: adminData[0] 
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