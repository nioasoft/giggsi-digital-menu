import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supabase configuration
const supabaseUrl = 'https://bsivfdyxjdmosxlbouue.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzaXZmZHl4amRtb3N4bGJvdXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDI0NjUsImV4cCI6MjA3MTY3ODQ2NX0.H152Ot0LOubgH2Mh2RNnfIByKO9CbSQzXfHOHYaFOQE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function uploadLogo() {
  try {
    console.log('📤 Uploading logo to Supabase Storage...')
    
    // Read the logo file
    const logoPath = path.join(__dirname, '..', 'src', 'assets', 'logo_giggsi.png')
    const logoFile = fs.readFileSync(logoPath)
    
    // Use the existing menu-images bucket
    console.log('📁 Using menu-images bucket...')
    
    // Upload the logo to a specific assets folder
    const { data, error } = await supabase.storage
      .from('menu-images')
      .upload('assets/logo_giggsi.png', logoFile, {
        contentType: 'image/png',
        upsert: true // Replace if exists
      })
    
    if (error) {
      console.error('Error uploading logo:', error)
      return
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('menu-images')
      .getPublicUrl('assets/logo_giggsi.png')
    
    console.log('✅ Logo uploaded successfully!')
    console.log('🔗 Public URL:', publicUrl)
    console.log('\n📝 Use this URL in your components:')
    console.log(`const LOGO_URL = '${publicUrl}'`)
    
    return publicUrl
  } catch (error) {
    console.error('Error:', error)
  }
}

uploadLogo()