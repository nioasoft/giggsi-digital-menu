import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export async function getMenuCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data
}

export async function getMenuItems(categoryId?: string) {
  let query = supabase
    .from('menu_items')
    .select(`
      *,
      categories (
        id,
        name_he,
        name_en,
        name_ar,
        name_ru
      )
    `)
    .eq('is_available', true)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query.order('display_order', { ascending: true })

  if (error) throw error
  return data
}

export async function getRestaurantInfo() {
  const { data, error } = await supabase
    .from('restaurant_info')
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function getActivePopups(categoryId?: string) {
  let query = supabase
    .from('popups')
    .select('*')
    .eq('is_active', true)
    .or(`display_from.is.null,display_from.lte.${new Date().toISOString()}`)
    .or(`display_until.is.null,display_until.gte.${new Date().toISOString()}`)

  if (categoryId) {
    query = query.or(`type.eq.site_wide,and(type.eq.category_specific,category_id.eq.${categoryId})`)
  } else {
    query = query.in('type', ['site_wide', 'banner'])
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function uploadImage(file: File, bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)
    
  return publicUrlData.publicUrl
}