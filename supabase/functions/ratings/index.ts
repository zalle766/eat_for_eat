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
    const authHeader = req.headers.get('Authorization')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
        },
      }
    )

    const url = new URL(req.url)
    const method = req.method

    if (method === 'GET') {
      // جلب التقييمات - لا يتطلب مصادقة
      const restaurantId = url.searchParams.get('restaurant_id')
      const productId = url.searchParams.get('product_id')

      let query = supabaseClient
        .from('ratings')
        .select('*')
        .order('created_at', { ascending: false })

      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId)
      } else if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data: ratings, error } = await query

      if (error) {
        console.error('Error fetching ratings:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // التأكد من أن ratings هو array
      if (!ratings || !Array.isArray(ratings)) {
        return new Response(
          JSON.stringify({ 
            ratings: [], 
            average_rating: 0, 
            total_count: 0 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // جلب أسماء المستخدمين (user_id يشير إلى auth.users.id)
      const authIds = [...new Set(ratings.map(r => r.user_id).filter(Boolean))]
      let usersMap: Record<string, string> = {}

      const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      const supabaseAdmin = serviceRoleKey ? createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceRoleKey) : null

      if (authIds.length > 0) {
        // 1. جلب من جدول users باستخدام Service Role (لتجاوز RLS)
        const usersClient = supabaseAdmin || supabaseClient
        const { data: users } = await usersClient
          .from('users')
          .select('auth_id, full_name, name')
          .in('auth_id', authIds)

        if (users && users.length > 0) {
          users.forEach(u => {
            const name = u.full_name || u.name
            if (name) usersMap[u.auth_id] = name
          })
        }

        // 2. للمستخدمين غير الموجودين، جلب الاسم من auth.users
        const missingIds = authIds.filter(id => !usersMap[id])
        if (missingIds.length > 0 && supabaseAdmin) {
          for (const authId of missingIds) {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(authId)
            if (authUser?.user) {
              const u = authUser.user
              const name = u.user_metadata?.name || u.user_metadata?.full_name || 
                (u.email ? u.email.split('@')[0] : null)
              if (name) usersMap[authId] = name
            }
          }
        }
      }

      // حساب متوسط التقييم
      const validRatings = ratings.filter(r => r.rating != null && r.rating > 0)
      const averageRating = validRatings.length > 0 
        ? validRatings.reduce((sum, rating) => sum + (rating.rating || 0), 0) / validRatings.length
        : 0

      // تنسيق البيانات
      const formattedRatings = ratings.map(rating => ({
        id: rating.id,
        user_id: rating.user_id,
        rating: rating.rating || 0,
        comment: rating.comment || '',
        created_at: rating.created_at,
        user_name: usersMap[rating.user_id] || 'مستخدم'
      }))

      return new Response(
        JSON.stringify({
          ratings: formattedRatings,
          average_rating: averageRating,
          total_count: ratings.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // للعمليات الأخرى، نحتاج مصادقة
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST') {
      // إضافة تقييم جديد
      const { restaurant_id, product_id, rating, comment } = await req.json()

      console.log('POST rating request - user.id:', user.id, 'restaurant_id:', restaurant_id, 'product_id:', product_id)

      if (!rating || rating < 1 || rating > 5) {
        return new Response(
          JSON.stringify({ error: 'التقييم يجب أن يكون بين 1 و 5' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!restaurant_id && !product_id) {
        return new Response(
          JSON.stringify({ error: 'يجب تحديد المطعم أو المنتج' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // إنشاء عميل Supabase باستخدام Service Role Key لتجاوز RLS policies
      // ملاحظة: في Supabase Edge Functions، Service Role Key متوفر تلقائياً
      // لكن يمكن أيضاً استخدام SERVICE_ROLE_KEY كـ secret مخصص
      const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseAdmin = serviceRoleKey 
        ? createClient(supabaseUrl, serviceRoleKey)
        : null

      // استخدام user.id مباشرة (auth.users.id) - المراجع يشير إلى auth.users
      const userId = user.id
      console.log('Using auth user.id for rating:', userId)

      // إضافة/تحديث المستخدم في جدول users لعرض اسمه في التقييمات
      if (supabaseAdmin) {
        const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم'
        await supabaseAdmin.from('users').upsert({
          auth_id: userId,
          name: userName,
          email: user.email || '',
          phone: user.user_metadata?.phone || null
        }, { onConflict: 'auth_id' })
      }

      // التحقق من وجود تقييم سابق
      let existingQuery = supabaseClient
        .from('ratings')
        .select('id')
        .eq('user_id', userId)

      if (restaurant_id) {
        existingQuery = existingQuery.eq('restaurant_id', restaurant_id)
      } else {
        existingQuery = existingQuery.eq('product_id', product_id)
      }

      const { data: existing, error: existingError } = await existingQuery.maybeSingle()
      
      if (existingError && existingError.code !== 'PGRST116') {
        return new Response(
          JSON.stringify({ error: existingError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let result
      if (existing) {
        // تحديث التقييم الموجود
        if (!supabaseAdmin) {
          return new Response(
            JSON.stringify({ 
              error: 'خطأ في الإعدادات: Service Role Key غير متوفر. لا يمكن تحديث التقييم.',
              details: 'Service Role Key is required'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // تحديث التقييم
        const { data, error } = await supabaseAdmin
          .from('ratings')
          .update({
            rating,
            comment,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single()

        result = { data, error }
      } else {
        // إضافة تقييم جديد - استخدام user.id مباشرة (auth.users.id)
        const insertClient = supabaseAdmin || supabaseClient
        const { data, error } = await insertClient
          .from('ratings')
          .insert({
            user_id: userId,
            restaurant_id: restaurant_id || null,
            product_id: product_id || null,
            rating,
            comment: comment || null
          })
          .select()
          .single()

        result = { data, error }
      }

      if (result.error) {
        console.error('خطأ في إدراج/تحديث التقييم:', result.error)
        console.error('Error details:', JSON.stringify(result.error))
        
        // رسالة خطأ أكثر وضوحاً
        let errorMessage = result.error.message || 'حدث خطأ في إرسال التقييم'
        
        if (result.error.message?.includes('column') || result.error.message?.includes('does not exist')) {
          errorMessage = 'خطأ في بنية قاعدة البيانات: يبدو أن جدول ratings لا يحتوي على جميع الأعمدة المطلوبة. يرجى التحقق من بنية الجدول وإضافة الأعمدة التالية: rating (integer), comment (text), product_id (uuid).'
        } else if (result.error.message?.includes('foreign key') || result.error.message?.includes('fk_ratings_user_id') || result.error.code === '23503') {
          errorMessage = 'خطأ في البيانات: المستخدم غير موجود في قاعدة البيانات. يرجى التأكد من تسجيل الدخول بشكل صحيح أو إنشاء ملف المستخدم أولاً.'
        } else if (result.error.message?.includes('permission') || result.error.code === '42501') {
          errorMessage = 'خطأ في الصلاحيات: لا توجد صلاحيات كافية لحفظ التقييم. يرجى التحقق من RLS policies.'
        }
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            details: result.error.message,
            code: result.error.code
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, data: result.data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'DELETE') {
      // حذف التقييم
      const ratingId = url.searchParams.get('id')

      if (!ratingId) {
        return new Response(
          JSON.stringify({ error: 'معرف التقييم مطلوب' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabaseClient
        .from('ratings')
        .delete()
        .eq('id', ratingId)
        .eq('user_id', user.id)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'طريقة غير مدعومة' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})