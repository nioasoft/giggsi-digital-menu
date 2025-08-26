import { supabase } from './supabase'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  
  // Check if user is admin
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .single()
    
  if (adminError || !adminUser?.is_active) {
    await supabase.auth.signOut()
    throw new Error('Unauthorized access')
  }
  
  // Update last login
  await supabase
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('email', email)
  
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return null
  
  // Verify admin status
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', session.user.email)
    .single()
    
  if (!adminUser?.is_active) {
    await signOut()
    return null
  }
  
  return session
}

export async function isAuthenticated() {
  const session = await getSession()
  return !!session
}