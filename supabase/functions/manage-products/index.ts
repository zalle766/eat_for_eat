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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { method } = req
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (method === 'GET') {
      // جلب منتجات المطعم
      const { data: restaurant } = await supabaseClient
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'approved')
        .single()

      if (!restaurant) {
        return new Response(JSON.stringify({ error: 'المطعم غير موجود أو غير مقبول' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ products }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (method === 'POST') {
      const body = await req.json()
      
      // التحقق من وجود المطعم
      const { data: restaurant } = await supabaseClient
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .eq('status', 'approved')
        .single()

      if (!restaurant) {
        return new Response(JSON.stringify({ error: 'المطعم غير موجود أو غير مقبول' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (action === 'add') {
        // إضافة منتج جديد
        const { name, price, category, description, image_url } = body

        // إنشاء صورة تلقائية إذا لم تكن موجودة
        const finalImageUrl = image_url || `https://readdy.ai/api/search-image?query=delicious ${category} food dish restaurant menu item with simple clean background professional food photography&width=400&height=300&seq=${Date.now()}&orientation=landscape`

        const { data: product, error } = await supabaseClient
          .from('products')
          .insert([{
            name,
            price: parseFloat(price),
            category,
            description: description || '',
            image_url: finalImageUrl,
            restaurant_id: restaurant.id,
            is_available: true
          }])
          .select()
          .single()

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({ product }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (action === 'update') {
        // تحديث منتج
        const { id, name, price, category, description, image_url, is_available } = body

        const { data: product, error } = await supabaseClient
          .from('products')
          .update({
            name,
            price: parseFloat(price),
            category,
            description,
            image_url,
            is_available
          })
          .eq('id', id)
          .eq('restaurant_id', restaurant.id)
          .select()
          .single()

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({ product }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (action === 'delete') {
        // حذف منتج
        const { id } = body

        const { error } = await supabaseClient
          .from('products')
          .delete()
          .eq('id', id)
          .eq('restaurant_id', restaurant.id)

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (action === 'toggle-availability') {
        // تبديل حالة التوفر
        const { id, is_available } = body

        const { data: product, error } = await supabaseClient
          .from('products')
          .update({ is_available })
          .eq('id', id)
          .eq('restaurant_id', restaurant.id)
          .select()
          .single()

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({ product }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ error: 'طريقة غير مدعومة' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})