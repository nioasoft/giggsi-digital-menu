import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

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

async function cleanupAllOldImages() {
  console.log('🧹 Starting comprehensive cleanup of old images...')
  console.log('=' .repeat(60))
  
  try {
    // Step 1: Get all old JPEG files directly from database
    console.log('\n📋 Fetching list of old JPEG files from database...')
    const { data: oldJpegs, error: listError } = await supabase
      .rpc('get_storage_files', { 
        bucket: 'menu-images',
        pattern: '%.jpg'
      })
      .catch(() => {
        // If RPC doesn't exist, query directly
        return supabase
          .from('storage.objects')
          .select('name')
          .eq('bucket_id', 'menu-images')
          .like('name', '%.jpg')
      })
    
    if (listError) {
      console.error('Error listing files:', listError)
      // Fallback: List files with Supabase Storage API
      const { data: storageFiles } = await supabase.storage
        .from('menu-images')
        .list('-', { limit: 1000 })
      
      const jpegFiles = storageFiles?.filter(f => f.name.endsWith('.jpg')) || []
      console.log(`Found ${jpegFiles.length} JPEG files via storage API`)
      
      if (jpegFiles.length === 0) {
        console.log('No JPEG files found to delete')
        return
      }
      
      // Use these files instead
      oldJpegs.push(...jpegFiles.map(f => ({ name: `-/${f.name}` })))
    }
    
    console.log(`Found ${oldJpegs.length} old JPEG files to delete`)
    
    if (oldJpegs.length > 0) {
      // Step 2: Delete old files in batches
      console.log('\n🗑️  Deleting old JPEG files...')
      const batchSize = 10
      let totalDeleted = 0
      
      for (let i = 0; i < oldJpegs.length; i += batchSize) {
        const batch = oldJpegs.slice(i, i + batchSize).map(f => f.name)
        
        const { error } = await supabase.storage
          .from('menu-images')
          .remove(batch)
        
        if (error) {
          console.error(`Error deleting batch ${Math.floor(i / batchSize) + 1}:`, error)
        } else {
          totalDeleted += batch.length
          console.log(`  Batch ${Math.floor(i / batchSize) + 1}: Deleted ${batch.length} files`)
        }
      }
      
      console.log(`✅ Deleted ${totalDeleted} old JPEG files from storage`)
    }
    
    // Step 3: Clean database references
    console.log('\n🔧 Cleaning database references to old images...')
    
    // Update menu_items table
    const { data: itemsToClean, error: selectError } = await supabase
      .from('menu_items')
      .select('id, name_he, image_url')
      .or('image_url.like.%-/-%,image_url.like.%.jpg')
    
    if (!selectError && itemsToClean) {
      console.log(`Found ${itemsToClean.length} menu items with old image references`)
      
      for (const item of itemsToClean) {
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({ 
            image_url: null,
            image_urls: null 
          })
          .eq('id', item.id)
        
        if (updateError) {
          console.error(`Error updating item ${item.name_he}:`, updateError)
        } else {
          console.log(`  Cleaned: ${item.name_he}`)
        }
      }
    }
    
    // Update categories table
    const { data: categoriesToClean, error: catSelectError } = await supabase
      .from('categories')
      .select('id, name_he, image_url')
      .or('image_url.like.%-/-%,image_url.like.%.jpg')
    
    if (!catSelectError && categoriesToClean) {
      console.log(`\nFound ${categoriesToClean.length} categories with old image references`)
      
      for (const category of categoriesToClean) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ 
            image_url: null,
            image_urls: null 
          })
          .eq('id', category.id)
        
        if (updateError) {
          console.error(`Error updating category ${category.name_he}:`, updateError)
        } else {
          console.log(`  Cleaned: ${category.name_he}`)
        }
      }
    }
    
    // Step 4: Verify cleanup
    console.log('\n✨ Verifying cleanup...')
    
    // Check for remaining JPEG files
    const { data: remainingFiles } = await supabase.storage
      .from('menu-images')
      .list('', {
        limit: 1000,
        search: '.jpg'
      })
    
    const remainingJpegs = remainingFiles?.filter(f => 
      f.name.endsWith('.jpg')
    ) || []
    
    // Check database for old references
    const { count: itemsWithOldRefs } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .or('image_url.like.%-/-%,image_url.like.%.jpg')
    
    const { count: categoriesWithOldRefs } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .or('image_url.like.%-/-%,image_url.like.%.jpg')
    
    console.log('\n' + '=' .repeat(60))
    console.log('📊 CLEANUP SUMMARY:')
    console.log('─' .repeat(60))
    console.log(`Storage: ${remainingJpegs.length} JPEG files remaining`)
    console.log(`Database: ${itemsWithOldRefs || 0} items with old references`)
    console.log(`Database: ${categoriesWithOldRefs || 0} categories with old references`)
    
    if (remainingJpegs.length === 0 && !itemsWithOldRefs && !categoriesWithOldRefs) {
      console.log('\n🎉 SUCCESS! All old images and references have been cleaned.')
    } else {
      console.log('\n⚠️  Some old images or references may still remain.')
    }
    
    console.log('\n📝 Next Steps:')
    console.log('1. Go to admin panel: /admin-giggsi-2024')
    console.log('2. Re-upload images for items that now have no image')
    console.log('3. New uploads will use optimized compression')
    console.log('=' .repeat(60))
    
  } catch (error) {
    console.error('Unexpected error during cleanup:', error)
  }
}

// Run the cleanup
cleanupAllOldImages()