import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file')
  process.exit(1)
}

// Create Supabase client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'asaf@giggsi.co.il',
      password: 'Aa589525!',
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('User already exists in auth. Updating password...')
        
        // Update existing user's password
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          authData?.user?.id || '',
          { password: 'Aa589525!' }
        )
        
        if (updateError) {
          console.error('Error updating password:', updateError)
        } else {
          console.log('✅ Password updated successfully!')
        }
      } else {
        throw authError
      }
    } else {
      console.log('✅ Admin user created successfully!')
      console.log('User ID:', authData.user?.id)
    }

    // Ensure the user exists in admin_users table
    const { error: dbError } = await supabase
      .from('admin_users')
      .upsert({
        email: 'asaf@giggsi.co.il',
        is_active: true
      }, {
        onConflict: 'email'
      })

    if (dbError) {
      console.error('Error updating admin_users table:', dbError)
    } else {
      console.log('✅ Admin user record updated in database!')
    }

    console.log('\n📝 Admin Credentials:')
    console.log('Email: asaf@giggsi.co.il')
    console.log('Password: Aa589525!')
    console.log('Login URL: http://localhost:5173/admin-giggsi-2024/login')

  } catch (error) {
    console.error('Error creating admin user:', error)
  }
}

createAdminUser()