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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // قائمة المديرين الجدد
    const adminsToCreate = [
      {
        email: 'ahmed@fooddelivery.com',
        password: 'admin123456',
        name: 'أحمد محمد',
        phone: '+966501234567',
        role: 'admin',
        permissions: { all: true }
      },
      {
        email: 'fatima@fooddelivery.com',
        password: 'admin123456',
        name: 'فاطمة علي',
        phone: '+966507654321',
        role: 'admin',
        permissions: { orders: true, restaurants: true, users: false }
      },
      {
        email: 'mohammed@fooddelivery.com',
        password: 'admin123456',
        name: 'محمد السعيد',
        phone: '+966509876543',
        role: 'manager',
        permissions: { orders: true, products: true, analytics: true }
      },
      {
        email: 'nora@fooddelivery.com',
        password: 'admin123456',
        name: 'نورا خالد',
        phone: '+966502468135',
        role: 'supervisor',
        permissions: { drivers: true, orders: true }
      },
      {
        email: 'abdullah@fooddelivery.com',
        password: 'admin123456',
        name: 'عبدالله أحمد',
        phone: '+966505551234',
        role: 'admin',
        permissions: { all: true }
      }
    ]

    const results = []

    for (const adminData of adminsToCreate) {
      try {
        // التحقق من وجود المدير مسبقاً
        const { data: existingAdmin } = await supabaseAdmin
          .from('admins')
          .select('id')
          .eq('email', adminData.email)
          .single()

        if (existingAdmin) {
          results.push({
            email: adminData.email,
            status: 'exists',
            message: 'المدير موجود مسبقاً'
          })
          continue
        }

        // إنشاء المستخدم في نظام المصادقة
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: adminData.email,
          password: adminData.password,
          email_confirm: true
        })

        if (authError) {
          results.push({
            email: adminData.email,
            status: 'error',
            message: `خطأ في إنشاء المصادقة: ${authError.message}`
          })
          continue
        }

        // إضافة المدير إلى جدول المديرين
        const { error: insertError } = await supabaseAdmin
          .from('admins')
          .insert({
            auth_id: authUser.user.id,
            name: adminData.name,
            email: adminData.email,
            phone: adminData.phone,
            role: adminData.role,
            permissions: adminData.permissions,
            is_active: true
          })

        if (insertError) {
          results.push({
            email: adminData.email,
            status: 'error',
            message: `خطأ في إضافة المدير: ${insertError.message}`
          })
        } else {
          results.push({
            email: adminData.email,
            status: 'success',
            message: 'تم إنشاء المدير بنجاح'
          })
        }

      } catch (error) {
        results.push({
          email: adminData.email,
          status: 'error',
          message: `خطأ عام: ${error.message}`
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم معالجة جميع المديرين',
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})