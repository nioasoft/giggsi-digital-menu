import { supabase } from './supabase'
import type { WaiterUser } from './types'

export async function signInWaiter(email: string, password: string) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) throw authError

  // Check if user is a waiter
  const { data: waiterUser, error: waiterError } = await supabase
    .from('waiter_users')
    .select('*')
    .eq('email', email)
    .single()

  if (waiterError || !waiterUser?.is_active) {
    await supabase.auth.signOut()
    throw new Error('Unauthorized access - Not a valid waiter account')
  }

  // Update last login
  await supabase
    .from('waiter_users')
    .update({ last_login: new Date().toISOString() })
    .eq('email', email)

  return { user: authData.user, waiter: waiterUser }
}

export async function signOutWaiter() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getWaiterSession() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return null

  // Verify waiter status
  const { data: waiterUser } = await supabase
    .from('waiter_users')
    .select('*')
    .eq('email', session.user.email)
    .single()

  if (!waiterUser?.is_active) {
    await signOutWaiter()
    return null
  }

  return { session, waiter: waiterUser }
}

export async function isWaiterAuthenticated() {
  const waiterSession = await getWaiterSession()
  return !!waiterSession
}

export async function getCurrentWaiter(): Promise<WaiterUser | null> {
  const waiterSession = await getWaiterSession()
  return waiterSession?.waiter || null
}

// Admin functions for managing waiters
export async function createWaiter(email: string, name: string, password: string) {
  // First create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError) throw authError

  // Then create waiter record
  const { data: waiterData, error: waiterError } = await supabase
    .from('waiter_users')
    .insert({
      email,
      name,
      password_hash: 'managed_by_supabase_auth',
      is_active: true
    })
    .select()
    .single()

  if (waiterError) {
    // Rollback auth user if waiter creation fails
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw waiterError
  }

  return waiterData
}

export async function updateWaiter(id: string, updates: Partial<WaiterUser>) {
  const { data, error } = await supabase
    .from('waiter_users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteWaiter(id: string) {
  // First get waiter email
  const { data: waiter, error: fetchError } = await supabase
    .from('waiter_users')
    .select('email')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  // Delete from waiter_users table
  const { error: deleteError } = await supabase
    .from('waiter_users')
    .delete()
    .eq('id', id)

  if (deleteError) throw deleteError

  // Also delete auth user
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const authUser = users.find(u => u.email === waiter.email)
  if (authUser) {
    await supabase.auth.admin.deleteUser(authUser.id)
  }
}

export async function getAllWaiters() {
  const { data, error } = await supabase
    .from('waiter_users')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}