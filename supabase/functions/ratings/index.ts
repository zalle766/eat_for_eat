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

      // جلب معلومات المستخدمين
      const userIds = [...new Set(ratings.map(r => r.user_id).filter(Boolean))]
      let usersMap: Record<string, any> = {}

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabaseClient
          .from('users')
          .select('id, full_name, name')
          .in('id', userIds)

        if (usersError) {
          console.error('Error fetching users:', usersError)
        } else if (users) {
          usersMap = users.reduce((acc, user) => {
            acc[user.id] = user
            return acc
          }, {} as Record<string, any>)
        }
      }

      // حساب متوسط التقييم - التأكد من وجود rating في كل تقييم
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
        user_name: usersMap[rating.user_id]?.full_name || usersMap[rating.user_id]?.name || 'مستخدم'
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

      // التحقق من وجود المستخدم في جدول users باستخدام auth_id
      let userExists = false
      let userId: string | null = null // users.id (primary key)
      
      // محاولة التحقق باستخدام Service Role Key أولاً (إذا كان متوفراً)
      if (supabaseAdmin) {
        const { data: adminCheck } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle()
        
        if (adminCheck) {
          userExists = true
          userId = adminCheck.id
        }
      }

      // إذا لم يكن موجوداً، محاولة التحقق باستخدام العميل العادي
      if (!userExists) {
        const { data: userCheck } = await supabaseClient
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle()
        
        if (userCheck) {
          userExists = true
          userId = userCheck.id
        }
      }

      // إذا لم يكن المستخدم موجوداً، محاولة إنشائه
      if (!userExists) {
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'مستخدم'
        
        // محاولة استخدام Edge Function create-user أولاً
        if (supabaseAdmin) {
          try {
            const createUserResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-user`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                auth_id: user.id,
                name: userName,
                email: user.email || '',
                phone: user.user_metadata?.phone || null
              })
            })

            if (createUserResponse.ok) {
              const result = await createUserResponse.json().catch(() => ({}))
              if (result.data?.id) {
                userExists = true
                userId = result.data.id
              } else {
                // إذا تم إنشاء المستخدم، نحصل على id من قاعدة البيانات
                const { data: newUserCheck } = await supabaseAdmin
                  .from('users')
                  .select('id')
                  .eq('auth_id', user.id)
                  .maybeSingle()
                if (newUserCheck) {
                  userExists = true
                  userId = newUserCheck.id
                }
              }
            } else {
              const errorData = await createUserResponse.json().catch(() => ({}))
              if (errorData.message?.includes('already exists') || errorData.message?.includes('duplicate')) {
                // المستخدم موجود بالفعل، نحصل على id
                const { data: existingUserCheck } = await supabaseAdmin
                  .from('users')
                  .select('id')
                  .eq('auth_id', user.id)
                  .maybeSingle()
                if (existingUserCheck) {
                  userExists = true
                  userId = existingUserCheck.id
                }
              } else {
                console.error('خطأ في create-user function:', errorData)
              }
            }
          } catch (fetchError) {
            console.error('خطأ في استدعاء create-user:', fetchError)
          }
        }

        // إذا لم ينجح، محاولة الإنشاء مباشرة
        if (!userExists && supabaseAdmin) {
          // محاولة الإنشاء باستخدام Service Role Key
          const { data: newUser, error: userError } = await supabaseAdmin
            .from('users')
            .insert({
              auth_id: user.id,
              name: userName,
              email: user.email || '',
              phone: user.user_metadata?.phone || null
            })
            .select()
            .single()

          if (userError) {
            // إذا كان الخطأ بسبب duplicate key، المستخدم موجود بالفعل
            if (userError.message.includes('duplicate') || userError.message.includes('already exists') || userError.code === '23505') {
              const { data: existingUser } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('auth_id', user.id)
                .maybeSingle()
              if (existingUser) {
                userExists = true
                userId = existingUser.id
              }
            } else {
              console.error('خطأ في إنشاء المستخدم باستخدام Service Role Key:', userError)
            }
          } else if (newUser) {
            userExists = true
            userId = newUser.id
          }
        }

        // إذا لم ينجح، محاولة الإنشاء باستخدام العميل العادي
        if (!userExists) {
          const { data: newUser, error: userError } = await supabaseClient
            .from('users')
            .insert({
              auth_id: user.id,
              name: userName,
              email: user.email || '',
              phone: user.user_metadata?.phone || null
            })
            .select()
            .single()

          if (userError) {
            if (userError.message.includes('duplicate') || userError.message.includes('already exists') || userError.code === '23505') {
              const { data: existingUser } = await supabaseClient
                .from('users')
                .select('id')
                .eq('auth_id', user.id)
                .maybeSingle()
              if (existingUser) {
                userExists = true
                userId = existingUser.id
              }
            } else {
              console.error('خطأ في إنشاء المستخدم:', userError)
              return new Response(
                JSON.stringify({ error: 'فشل في إنشاء ملف المستخدم. يرجى التأكد من أنك مسجل الدخول بشكل صحيح.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          } else if (newUser) {
            userExists = true
            userId = newUser.id
          }
        }
      }

      // التحقق النهائي من وجود المستخدم والحصول على userId
      // هذه خطوة حرجة: يجب أن يكون userId موجوداً وصحيحاً قبل إدراج التقييم
      if (!userExists || !userId) {
        console.log('User not found, attempting final check. userExists:', userExists, 'userId:', userId)
        
        // محاولة التحقق النهائية باستخدام Service Role Key أولاً
        const finalCheck = supabaseAdmin || supabaseClient
        const { data: finalUserCheck, error: finalCheckError } = await finalCheck
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle()

        if (finalCheckError) {
          console.error('Error in final user check:', finalCheckError)
        }

        if (!finalUserCheck) {
          console.error('User not found in database. auth_id:', user.id)
          return new Response(
            JSON.stringify({ 
              error: 'المستخدم غير موجود في النظام. يرجى التأكد من أنك مسجل الدخول بشكل صحيح أو استخدم Edge Function "create-user" لإنشاء ملف المستخدم أولاً.' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        userId = finalUserCheck.id
        userExists = true
        console.log('User found in final check. userId:', userId)
      }

      // التحقق الحاسم: userId يجب أن يكون موجوداً وليس null أو undefined
      if (!userId || userId === null || userId === undefined || userId === '') {
        console.error('CRITICAL: userId is null, undefined, or empty. user.id:', user.id, 'userExists:', userExists)
        return new Response(
          JSON.stringify({ 
            error: 'فشل في الحصول على معرف المستخدم. لا يمكن إدراج التقييم بدون معرف مستخدم صحيح. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Final verification - Using userId for rating:', userId, 'auth_id:', user.id, 'userId type:', typeof userId)

      // التحقق النهائي المطلق: التأكد من أن userId موجود فعلاً في قاعدة البيانات
      const verifyClient = supabaseAdmin || supabaseClient
      const { data: verifyUser, error: verifyError } = await verifyClient
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (verifyError) {
        console.error('Error verifying user existence:', verifyError, 'userId:', userId)
        return new Response(
          JSON.stringify({ error: 'حدث خطأ في التحقق من وجود المستخدم في قاعدة البيانات.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!verifyUser) {
        console.error('CRITICAL: User with userId does not exist in database. userId:', userId, 'auth_id:', user.id)
        
        // محاولة إنشاء المستخدم مرة أخرى باستخدام Service Role Key
        if (supabaseAdmin) {
          try {
            const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'مستخدم'
            
            // محاولة الإنشاء مباشرة باستخدام Service Role Key
            const { data: newUser, error: createError } = await supabaseAdmin
              .from('users')
              .insert({
                auth_id: user.id,
                name: userName,
                email: user.email || '',
                phone: user.user_metadata?.phone || null
              })
              .select('id')
              .single()
            
            if (createError) {
              // إذا كان الخطأ بسبب duplicate، نحاول الحصول على المستخدم
              if (createError.code === '23505' || createError.message?.includes('duplicate')) {
                const { data: existingUser } = await supabaseAdmin
                  .from('users')
                  .select('id')
                  .eq('auth_id', user.id)
                  .maybeSingle()
                
                if (existingUser) {
                  userId = existingUser.id
                  console.log('User found after duplicate error. userId:', userId)
                } else {
                  return new Response(
                    JSON.stringify({ 
                      error: 'المستخدم غير موجود في قاعدة البيانات ولا يمكن إنشاؤه. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.',
                      details: createError.message
                    }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                  )
                }
              } else {
                return new Response(
                  JSON.stringify({ 
                    error: 'فشل في إنشاء ملف المستخدم. يرجى المحاولة مرة أخرى.',
                    details: createError.message
                  }),
                  { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
              }
            } else if (newUser) {
              userId = newUser.id
              console.log('User created successfully. New userId:', userId)
            }
          } catch (createErr) {
            console.error('Error creating user:', createErr)
            return new Response(
              JSON.stringify({ 
                error: 'فشل في إنشاء ملف المستخدم. يرجى المحاولة مرة أخرى.',
                details: createErr.message
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        } else {
          return new Response(
            JSON.stringify({ 
              error: 'المستخدم غير موجود في قاعدة البيانات. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // التحقق النهائي مرة أخرى بعد محاولة الإنشاء
      if (!userId || userId === null || userId === undefined || userId === '') {
        return new Response(
          JSON.stringify({ 
            error: 'فشل في الحصول على معرف مستخدم صحيح. لا يمكن إدراج التقييم.',
            details: 'Invalid user ID after creation attempt'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('User verified successfully. Proceeding with rating insertion. userId:', userId)

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
        // تحديث التقييم الموجود - استخدام Service Role Key دائماً
        if (!supabaseAdmin) {
          return new Response(
            JSON.stringify({ 
              error: 'خطأ في الإعدادات: Service Role Key غير متوفر. لا يمكن تحديث التقييم.',
              details: 'Service Role Key is required'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // التحقق من أن userId موجود قبل التحديث
        const { data: userVerify } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
        
        if (!userVerify) {
          return new Response(
            JSON.stringify({ 
              error: 'المستخدم غير موجود في قاعدة البيانات. لا يمكن تحديث التقييم.',
              details: 'User not found'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // تحديث التقييم باستخدام Service Role Key
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
        // إضافة تقييم جديد
        // التحقق النهائي قبل الإدراج: userId يجب أن يكون موجوداً وليس null
        if (!userId || userId === null || userId === undefined || userId === '') {
          console.error('CRITICAL ERROR: Attempting to insert rating with invalid userId. userId:', userId, 'auth_id:', user.id)
          return new Response(
            JSON.stringify({ 
              error: 'خطأ حرج: لا يمكن إدراج التقييم بدون معرف مستخدم صحيح. يرجى المحاولة مرة أخرى.' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // محاولة استخدام Service Role Key أولاً إذا كان متوفراً
        const insertClient = supabaseAdmin || supabaseClient
        
        console.log('Inserting rating - userId:', userId, 'type:', typeof userId, 'restaurant_id:', restaurant_id, 'product_id:', product_id)
        
        // التحقق مرة أخرى من أن userId موجود في قاعدة البيانات قبل الإدراج
        const { data: preInsertCheck } = await insertClient
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle()

        if (!preInsertCheck) {
          console.error('CRITICAL: User does not exist before rating insertion. userId:', userId)
          return new Response(
            JSON.stringify({ 
              error: 'المستخدم غير موجود في قاعدة البيانات. لا يمكن إدراج التقييم.' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Pre-insert check passed. User exists. Proceeding with rating insertion.')
        
        // التحقق النهائي من أن userId موجود في قاعدة البيانات باستخدام Service Role Key
        // يجب استخدام Service Role Key دائماً للإدراج لتجنب مشاكل RLS
        if (!supabaseAdmin) {
          return new Response(
            JSON.stringify({ 
              error: 'خطأ في الإعدادات: Service Role Key غير متوفر. لا يمكن إدراج التقييم.',
              details: 'Service Role Key is required'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // التحقق النهائي من أن userId موجود في قاعدة البيانات
        const { data: finalUserCheck, error: finalCheckError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
        
        if (finalCheckError) {
          console.error('Error in final user verification:', finalCheckError)
          return new Response(
            JSON.stringify({ 
              error: 'حدث خطأ في التحقق من وجود المستخدم.',
              details: finalCheckError.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        let finalUserId = userId
        
        if (!finalUserCheck) {
          console.error('CRITICAL: User does not exist in database. userId:', userId, 'auth_id:', user.id)
          
          // محاولة إنشاء المستخدم مباشرة باستخدام Service Role Key
          try {
            const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'مستخدم'
            
            const { data: newUser, error: createError } = await supabaseAdmin
              .from('users')
              .insert({
                auth_id: user.id,
                name: userName,
                email: user.email || '',
                phone: user.user_metadata?.phone || null
              })
              .select('id')
              .single()
            
            if (createError) {
              // إذا كان الخطأ بسبب duplicate، نحاول الحصول على المستخدم
              if (createError.code === '23505' || createError.message?.includes('duplicate')) {
                const { data: existingUser } = await supabaseAdmin
                  .from('users')
                  .select('id')
                  .eq('auth_id', user.id)
                  .maybeSingle()
                
                if (existingUser) {
                  finalUserId = existingUser.id
                  console.log('User found after duplicate error. userId:', finalUserId)
                } else {
                  return new Response(
                    JSON.stringify({ 
                      error: 'المستخدم غير موجود في قاعدة البيانات ولا يمكن إنشاؤه. يرجى المحاولة مرة أخرى.',
                      details: createError.message
                    }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                  )
                }
              } else {
                return new Response(
                  JSON.stringify({ 
                    error: 'فشل في إنشاء ملف المستخدم. يرجى المحاولة مرة أخرى.',
                    details: createError.message
                  }),
                  { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
              }
            } else if (newUser) {
              finalUserId = newUser.id
              console.log('User created successfully. New userId:', finalUserId)
            }
          } catch (createErr) {
            console.error('Error creating user:', createErr)
            return new Response(
              JSON.stringify({ 
                error: 'فشل في إنشاء ملف المستخدم. يرجى المحاولة مرة أخرى.',
                details: createErr.message
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        } else {
          finalUserId = finalUserCheck.id
        }
        
        // التحقق النهائي من أن finalUserId موجود
        if (!finalUserId || finalUserId === null || finalUserId === undefined || finalUserId === '') {
          console.error('CRITICAL: finalUserId is invalid. userId:', userId, 'finalUserId:', finalUserId)
          return new Response(
            JSON.stringify({ 
              error: 'فشل في الحصول على معرف مستخدم صحيح. لا يمكن إدراج التقييم.',
              details: 'Invalid user ID'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // التحقق النهائي مرة أخرى قبل الإدراج - مع إعادة المحاولة
        let preInsertVerify = null
        let retryCount = 0
        const maxRetries = 3
        
        while (!preInsertVerify && retryCount < maxRetries) {
          const { data: verifyData, error: verifyErr } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', finalUserId)
            .maybeSingle()
          
          if (verifyData) {
            preInsertVerify = verifyData
            break
          }
          
          // إذا لم يكن موجوداً، محاولة إنشائه مرة أخرى
          if (retryCount < maxRetries - 1) {
            console.log(`User not found, retrying creation (attempt ${retryCount + 1}/${maxRetries})...`)
            const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'مستخدم'
            
            const { data: retryUser, error: retryError } = await supabaseAdmin
              .from('users')
              .insert({
                auth_id: user.id,
                name: userName,
                email: user.email || '',
                phone: user.user_metadata?.phone || null
              })
              .select('id')
              .single()
            
            if (retryError && retryError.code !== '23505') {
              console.error('Error retrying user creation:', retryError)
            } else if (retryUser) {
              finalUserId = retryUser.id
              preInsertVerify = { id: retryUser.id }
              break
            } else if (retryError && retryError.code === '23505') {
              // المستخدم موجود بالفعل، نحصل عليه
              const { data: existingUser } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('auth_id', user.id)
                .maybeSingle()
              
              if (existingUser) {
                finalUserId = existingUser.id
                preInsertVerify = { id: existingUser.id }
                break
              }
            }
          }
          
          retryCount++
          // انتظار قصير قبل إعادة المحاولة
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        if (!preInsertVerify) {
          console.error('CRITICAL: User does not exist after all retries. finalUserId:', finalUserId, 'auth_id:', user.id)
          return new Response(
            JSON.stringify({ 
              error: 'المستخدم غير موجود في قاعدة البيانات. يرجى التأكد من تسجيل الدخول بشكل صحيح أو إنشاء ملف المستخدم أولاً.',
              details: 'User verification failed after retries',
              auth_id: user.id,
              attempted_user_id: finalUserId
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        console.log('Using finalUserId for rating insertion:', finalUserId, 'Verified:', preInsertVerify.id)
        
        // استخدام Service Role Key دائماً للإدراج لتجنب مشاكل RLS
        const { data, error } = await supabaseAdmin
          .from('ratings')
          .insert({
            user_id: preInsertVerify.id, // استخدام preInsertVerify.id المؤكد وجوده
            restaurant_id: restaurant_id || null,
            product_id: product_id || null,
            rating,
            comment: comment || null
          })
          .select()
          .single()

        result = { data, error }
        
        if (error) {
          console.error('Error inserting rating:', error.message, 'finalUserId:', finalUserId, 'error code:', error.code, 'error details:', JSON.stringify(error))
          
          // إذا كان الخطأ بسبب foreign key constraint
          if (error.message?.includes('foreign key constraint') || error.message?.includes('fk_ratings_user_id') || error.code === '23503') {
            return new Response(
              JSON.stringify({ 
                error: 'خطأ في البيانات: المستخدم غير موجود في قاعدة البيانات. يرجى التأكد من تسجيل الدخول بشكل صحيح.',
                details: error.message,
                code: error.code
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          // إذا كان الخطأ بسبب عدم وجود عمود في الجدول
          if (error.message?.includes('column') || error.message?.includes('does not exist')) {
            return new Response(
              JSON.stringify({ 
                error: 'خطأ في بنية قاعدة البيانات: يبدو أن جدول ratings لا يحتوي على جميع الأعمدة المطلوبة (rating, comment, product_id). يرجى التحقق من بنية الجدول.',
                details: error.message
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
        
        // إذا فشل الإدراج، محاولة استخدام Service Role Key إذا لم يكن مستخدماً
        if (result.error && supabaseAdmin && insertClient !== supabaseAdmin) {
          console.log('Retrying with Service Role Key due to error:', result.error.message)
          
          // التحقق مرة أخرى من وجود المستخدم باستخدام Service Role Key
          const { data: finalUserVerify } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', userId)
            .maybeSingle()
          
          if (!finalUserVerify) {
            console.error('User not found with userId:', userId)
            return new Response(
              JSON.stringify({ error: 'المستخدم غير موجود في النظام. يرجى استخدام Edge Function "create-user" لإنشاء ملف المستخدم أولاً.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          // التحقق مرة أخرى من أن المستخدم موجود قبل الإدراج
          const { data: adminUserVerify } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', finalUserVerify.id)
            .maybeSingle()
          
          if (!adminUserVerify) {
            console.error('User not found with Service Role Key. userId:', finalUserVerify.id)
            return new Response(
              JSON.stringify({ 
                error: 'المستخدم غير موجود في قاعدة البيانات. يرجى التأكد من تسجيل الدخول بشكل صحيح.',
                details: 'User not found in database'
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          // محاولة الإدراج باستخدام Service Role Key
          const { data: adminData, error: adminError } = await supabaseAdmin
            .from('ratings')
            .insert({
              user_id: adminUserVerify.id, // استخدام adminUserVerify.id المؤكد وجوده
              restaurant_id: restaurant_id || null,
              product_id: product_id || null,
              rating,
              comment: comment || null
            })
            .select()
            .single()
          
          result = { data: adminData, error: adminError }
          
          if (adminError) {
            console.error('Error inserting rating with Service Role Key:', adminError.message, 'userId:', adminUserVerify.id, 'error code:', adminError.code)
            
            // إذا كان الخطأ بسبب foreign key constraint
            if (adminError.message?.includes('foreign key constraint') || adminError.message?.includes('fk_ratings_user_id') || adminError.code === '23503') {
              return new Response(
                JSON.stringify({ 
                  error: 'خطأ في البيانات: المستخدم غير موجود في قاعدة البيانات. يرجى التأكد من تسجيل الدخول بشكل صحيح.',
                  details: adminError.message,
                  code: adminError.code
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          }
        }
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