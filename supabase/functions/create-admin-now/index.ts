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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // بيانات المدير الافتراضي
    const adminEmail = 'admin@fooddelivery.com'
    const adminPassword = 'admin123456'
    const adminName = 'المدير الرئيسي'

    console.log('بدء إنشاء المدير الافتراضي...')

    // التحقق من وجود المدير مسبقاً
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', adminEmail)
      .single()

    if (existingAdmin) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'المدير موجود مسبقاً! يمكنك تسجيل الدخول الآن.',
          admin: existingAdmin
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // إنشاء المستخدم في نظام المصادقة
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })

    if (authError) {
      console.error('خطأ في إنشاء المستخدم:', authError)
      throw new Error(`فشل في إنشاء المستخدم: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('لم يتم إنشاء المستخدم')
    }

    console.log('تم إنشاء المستخدم في نظام المصادقة:', authData.user.id)

    // إضافة المدير إلى جدول المديرين
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .insert({
        auth_id: authData.user.id,
        name: adminName,
        email: adminEmail,
        role: 'admin',
        permissions: { all: true },
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (adminError) {
      console.error('خطأ في إضافة المدير:', adminError)
      // حذف المستخدم من نظام المصادقة إذا فشل إنشاء المدير
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw new Error(`فشل في إضافة المدير: ${adminError.message}`)
    }

    console.log('تم إنشاء المدير بنجاح:', adminData)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إنشاء المدير الافتراضي بنجاح! يمكنك الآن تسجيل الدخول.',
        admin: adminData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('خطأ عام:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'حدث خطأ غير متوقع'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})