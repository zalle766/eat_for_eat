import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const adminsData = [
      {
        email: 'admin@fooddelivery.com',
        password: 'admin123456',
        name: 'المدير الرئيسي',
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
        }
      },
      {
        email: 'ahmed@fooddelivery.com',
        password: 'admin123456',
        name: 'أحمد محمد',
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
        }
      },
      {
        email: 'fatima@fooddelivery.com',
        password: 'admin123456',
        name: 'فاطمة علي',
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
        }
      },
      {
        email: 'mohammed@fooddelivery.com',
        password: 'admin123456',
        name: 'محمد السعيد',
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
        }
      },
      {
        email: 'nora@fooddelivery.com',
        password: 'admin123456',
        name: 'نورا خالد',
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
        }
      },
      {
        email: 'abdullah@fooddelivery.com',
        password: 'admin123456',
        name: 'عبدالله أحمد',
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
        }
      }
    ];

    const results = [];
    const errors = [];

    for (const admin of adminsData) {
      try {
        // التحقق من وجود المدير في جدول admins
        const { data: existingAdmin } = await supabase
          .from('admins')
          .select('id')
          .eq('email', admin.email)
          .single();

        if (existingAdmin) {
          results.push({ email: admin.email, status: 'already_exists' });
          continue;
        }

        // إنشاء المستخدم في نظام المصادقة
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
          user_metadata: {
            name: admin.name,
            phone: admin.phone,
            role: 'admin'
          }
        });

        if (authError) {
          // إذا كان المستخدم موجود في Auth، نحاول الحصول على معرفه
          if (authError.message.includes('already registered')) {
            const { data: users } = await supabase.auth.admin.listUsers();
            const existingUser = users.users.find(u => u.email === admin.email);
            
            if (existingUser) {
              // إضافة المدير إلى جدول admins
              const { error: insertError } = await supabase
                .from('admins')
                .insert({
                  auth_id: existingUser.id,
                  name: admin.name,
                  email: admin.email,
                  phone: admin.phone,
                  role: admin.role,
                  permissions: admin.permissions,
                  is_active: true
                });

              if (insertError) {
                errors.push({ email: admin.email, error: insertError.message });
              } else {
                results.push({ email: admin.email, status: 'added_to_admins_table' });
              }
            }
          } else {
            errors.push({ email: admin.email, error: authError.message });
          }
          continue;
        }

        // إضافة المدير إلى جدول admins
        const { error: insertError } = await supabase
          .from('admins')
          .insert({
            auth_id: authData.user.id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            role: admin.role,
            permissions: admin.permissions,
            is_active: true
          });

        if (insertError) {
          errors.push({ email: admin.email, error: insertError.message });
        } else {
          results.push({ email: admin.email, status: 'created_successfully' });
        }

      } catch (error) {
        errors.push({ email: admin.email, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تمت معالجة المديرين',
        results,
        errors,
        total: adminsData.length,
        successful: results.length,
        failed: errors.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});