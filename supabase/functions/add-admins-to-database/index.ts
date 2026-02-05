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

    // قائمة المديرين للإضافة
    const adminsToAdd = [
      {
        auth_id: '00000000-0000-0000-0000-000000000001',
        name: 'المدير الرئيسي',
        email: 'admin@fooddelivery.com',
        phone: '+966500000000',
        role: 'super_admin',
        permissions: {
          dashboard: true,
          restaurants: true,
          products: true,
          orders: true,
          users: true,
          drivers: true,
          analytics: true,
          settings: true
        },
        is_active: true
      },
      {
        auth_id: '00000000-0000-0000-0000-000000000002',
        name: 'أحمد محمد',
        email: 'ahmed@fooddelivery.com',
        phone: '+966501234567',
        role: 'admin',
        permissions: {
          dashboard: true,
          restaurants: true,
          products: true,
          orders: true,
          users: true,
          drivers: true,
          analytics: true,
          settings: false
        },
        is_active: true
      },
      {
        auth_id: '00000000-0000-0000-0000-000000000003',
        name: 'فاطمة علي',
        email: 'fatima@fooddelivery.com',
        phone: '+966507654321',
        role: 'manager',
        permissions: {
          dashboard: true,
          restaurants: true,
          products: false,
          orders: true,
          users: false,
          drivers: false,
          analytics: false,
          settings: false
        },
        is_active: true
      },
      {
        auth_id: '00000000-0000-0000-0000-000000000004',
        name: 'محمد السعيد',
        email: 'mohammed@fooddelivery.com',
        phone: '+966509876543',
        role: 'operations_manager',
        permissions: {
          dashboard: true,
          restaurants: false,
          products: true,
          orders: true,
          users: false,
          drivers: true,
          analytics: true,
          settings: false
        },
        is_active: true
      },
      {
        auth_id: '00000000-0000-0000-0000-000000000005',
        name: 'نورا خالد',
        email: 'nora@fooddelivery.com',
        phone: '+966502468135',
        role: 'supervisor',
        permissions: {
          dashboard: true,
          restaurants: false,
          products: false,
          orders: true,
          users: false,
          drivers: true,
          analytics: false,
          settings: false
        },
        is_active: true
      },
      {
        auth_id: '00000000-0000-0000-0000-000000000006',
        name: 'عبدالله أحمد',
        email: 'abdullah@fooddelivery.com',
        phone: '+966505551234',
        role: 'admin',
        permissions: {
          dashboard: true,
          restaurants: true,
          products: true,
          orders: true,
          users: true,
          drivers: true,
          analytics: true,
          settings: false
        },
        is_active: true
      }
    ]

    // التحقق من وجود المديرين مسبقاً
    const { data: existingAdmins } = await supabaseClient
      .from('admins')
      .select('email')

    const existingEmails = existingAdmins?.map(admin => admin.email) || []

    // فلترة المديرين الجدد فقط
    const newAdmins = adminsToAdd.filter(admin => !existingEmails.includes(admin.email))

    if (newAdmins.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'جميع المديرين موجودون مسبقاً في قاعدة البيانات',
          existing_count: existingAdmins?.length || 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // إضافة المديرين الجدد
    const { data, error } = await supabaseClient
      .from('admins')
      .insert(newAdmins)
      .select()

    if (error) {
      console.error('خطأ في إضافة المديرين:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'فشل في إضافة المديرين إلى قاعدة البيانات',
          details: error.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `تم إضافة ${newAdmins.length} مدير جديد بنجاح`,
        added_admins: data?.length || 0,
        total_admins: (existingAdmins?.length || 0) + (data?.length || 0),
        admins_info: newAdmins.map(admin => ({
          name: admin.name,
          email: admin.email,
          role: admin.role
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('خطأ عام:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'حدث خطأ في الخادم',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})