import { supabase } from './supabase'
import type { WaiterUser } from './types'
import { config } from './config'

// פתרון פשוט - מלצר נרשם בעצמו
export async function signUpWaiter(email: string, password: string, name: string) {
  // 1. Create auth user using regular signup with correct redirect URL
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'waiter'
      },
      emailRedirectTo: config.getEmailRedirectUrl()
    }
  })

  if (authError) throw authError

  // 2. Create waiter record
  const { data: waiterData, error: waiterError } = await supabase
    .from('waiter_users')
    .insert({
      email,
      name,
      password_hash: 'managed_by_supabase_auth',
      is_active: false // Admin needs to approve
    })
    .select()
    .single()

  if (waiterError) {
    console.error('Failed to create waiter record:', waiterError)
  }

  return {
    user: authData.user,
    waiter: waiterData,
    message: 'נרשמת בהצלחה! המתן לאישור מנהל'
  }
}

// Admin approves waiter
export async function approveWaiter(waiterId: string) {
  const { data, error } = await supabase
    .from('waiter_users')
    .update({ is_active: true })
    .eq('id', waiterId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Create waiter with invite link (simpler approach)
export async function createWaiterInvite(email: string, name: string) {
  // Just create the waiter record
  const { data: waiterData, error: waiterError } = await supabase
    .from('waiter_users')
    .insert({
      email,
      name,
      password_hash: 'pending_registration',
      is_active: true
    })
    .select()
    .single()

  if (waiterError) throw waiterError

  // Return invite link
  const inviteLink = `${window.location.origin}/waiter/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`

  return {
    waiter: waiterData,
    inviteLink,
    instructions: `שלח למלצר את הלינק הזה: ${inviteLink}`
  }
}