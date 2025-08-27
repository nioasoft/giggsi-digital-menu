import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import https from 'https'

// Read environment variables
const envFile = readFileSync('.env', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    env[key.trim()] = value.trim().replace(/["']/g, '')
  }
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Note: This script is for reference - actual recompression needs to happen in browser
// because we need Canvas API for image processing
console.log(`
================================================================
  Image Recompression Instructions
================================================================

The new compression algorithm requires browser Canvas API.
To recompress existing images:

1. Go to the admin panel: /admin-giggsi-2024
2. For each category with large images:
   - Click Edit
   - Re-upload the same image (it will use new compression)
   - Save

3. For each menu item with large images:
   - Click Edit  
   - Re-upload the same image
   - Save

The new compression will automatically:
- Limit originals to 2000x2000px max
- Target sizes:
  * Original: max 1MB
  * Large (1200px): max 300KB
  * Medium (800px): max 150KB
  * Small (400px): max 100KB
  
================================================================
  Checking Current Image Sizes...
================================================================
`)

async function checkImageSizes() {
  try {
    // Check category images
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name_he, name_en, image_urls')
      .not('image_urls', 'is', null)

    console.log('\n📁 CATEGORIES WITH IMAGES:')
    console.log('─'.repeat(50))
    
    for (const category of categories || []) {
      // Get file sizes from storage
      if (category.image_urls?.original) {
        const fileName = category.image_urls.original.split('/').pop()
        const { data: files } = await supabase.storage
          .from('menu-images')
          .list('categories', {
            search: fileName.split('_')[1] // Search by timestamp part
          })
        
        if (files && files.length > 0) {
          const largeFile = files.find(f => f.name.includes('_large'))
          const originalFile = files.find(f => f.name.includes('_original'))
          
          if (originalFile && originalFile.metadata?.size > 1024 * 1024) {
            console.log(`\n❌ ${category.name_en || category.name_he}:`)
            console.log(`   Original: ${(originalFile.metadata.size / 1024 / 1024).toFixed(1)}MB (should be <1MB)`)
            if (largeFile) {
              console.log(`   Large: ${(largeFile.metadata.size / 1024 / 1024).toFixed(1)}MB (should be <0.3MB)`)
            }
            console.log(`   → Needs recompression!`)
          } else {
            console.log(`✅ ${category.name_en || category.name_he}: Already optimized`)
          }
        }
      }
    }

    // Check menu items  
    console.log('\n\n📁 CHECKING MENU ITEMS:')
    console.log('─'.repeat(50))
    
    const { data: items } = await supabase
      .from('menu_items')
      .select('id, name_he, name_en, image_urls')
      .not('image_urls', 'is', null)
      .limit(10) // Check first 10 items

    for (const item of items || []) {
      if (item.image_urls?.original) {
        const fileName = item.image_urls.original.split('/').pop()
        const folderPath = item.image_urls.original.includes('/items/') ? 'items' : 
                          item.image_urls.original.split('/')[4] // Get folder from URL
        
        const { data: files } = await supabase.storage
          .from('menu-images')
          .list(folderPath, {
            limit: 100,
            search: fileName.split('_').slice(-2)[0] // Search by timestamp
          })
        
        if (files && files.length > 0) {
          const originalFile = files.find(f => f.name.includes('_original'))
          
          if (originalFile && originalFile.metadata?.size > 1024 * 1024) {
            console.log(`\n❌ ${item.name_en || item.name_he}:`)
            console.log(`   Original: ${(originalFile.metadata.size / 1024 / 1024).toFixed(1)}MB`)
            console.log(`   → Needs recompression!`)
          } else if (originalFile) {
            console.log(`✅ ${item.name_en || item.name_he}: Optimized (${(originalFile.metadata.size / 1024).toFixed(0)}KB)`)
          }
        }
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('To fix large images, re-upload them in the admin panel.')
    console.log('The new compression will automatically optimize them.')
    console.log('='.repeat(50) + '\n')

  } catch (error) {
    console.error('Error checking images:', error)
  }
}

// Run the check
checkImageSizes()