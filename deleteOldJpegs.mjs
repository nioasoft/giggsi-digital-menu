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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// List of all old JPEG files to delete (from our SQL query)
const oldJpegFiles = [
  '-/-_1756138971792_large.jpg',
  '-/-_1756138971792_medium.jpg',
  '-/-_1756138971792_original.jpg',
  '-/-_1756138971792_small.jpg',
  '-/-_1756139190385_large.jpg',
  '-/-_1756139190385_medium.jpg',
  '-/-_1756139190385_original.jpg',
  '-/-_1756139190385_small.jpg',
  '-/-_1756204473454_large.jpg',
  '-/-_1756204473454_medium.jpg',
  '-/-_1756204473454_original.jpg',
  '-/-_1756204473454_small.jpg',
  '-/-_1756204614833_large.jpg',
  '-/-_1756204614833_medium.jpg',
  '-/-_1756204614833_original.jpg',
  '-/-_1756204614833_small.jpg',
  '-/-_1756204624938_large.jpg',
  '-/-_1756204624938_medium.jpg',
  '-/-_1756204624938_original.jpg',
  '-/-_1756204624938_small.jpg',
  '-/-_1756204636573_large.jpg',
  '-/-_1756204636573_medium.jpg',
  '-/-_1756204636573_original.jpg',
  '-/-_1756204636573_small.jpg',
  '-/-_1756204643087_large.jpg',
  '-/-_1756204643087_medium.jpg',
  '-/-_1756204643087_original.jpg',
  '-/-_1756204643087_small.jpg',
  '-/-_1756204696532_large.jpg',
  '-/-_1756204696532_medium.jpg',
  '-/-_1756204696532_original.jpg',
  '-/-_1756204696532_small.jpg',
  '-/-_1756204703408_large.jpg',
  '-/-_1756204703408_medium.jpg',
  '-/-_1756204703408_original.jpg',
  '-/-_1756204703408_small.jpg',
  '-/-_1756204710797_large.jpg',
  '-/-_1756204710797_medium.jpg',
  '-/-_1756204710797_original.jpg',
  '-/-_1756204710797_small.jpg',
  '-/-_1756206119086_large.jpg',
  '-/-_1756206119086_medium.jpg',
  '-/-_1756206119086_original.jpg',
  '-/-_1756206119086_small.jpg',
  '-/-_1756206240632_large.jpg',
  '-/-_1756206240632_medium.jpg',
  '-/-_1756206240632_original.jpg',
  '-/-_1756206240632_small.jpg',
  '-/-_1756211365927_large.jpg',
  '-/-_1756211365927_original.jpg',
  '-/-_1756211365927_small.jpg'
]

async function deleteOldJpegs() {
  console.log('🗑️  Deleting old JPEG files...')
  console.log(`Total files to delete: ${oldJpegFiles.length}`)
  
  const batchSize = 10
  let totalDeleted = 0
  let failedFiles = []
  
  for (let i = 0; i < oldJpegFiles.length; i += batchSize) {
    const batch = oldJpegFiles.slice(i, i + batchSize)
    
    const { data, error } = await supabase.storage
      .from('menu-images')
      .remove(batch)
    
    if (error) {
      console.error(`Error deleting batch ${Math.floor(i / batchSize) + 1}:`, error)
      failedFiles.push(...batch)
    } else {
      totalDeleted += batch.length
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Deleted ${batch.length} files`)
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`✅ Successfully deleted: ${totalDeleted} files`)
  if (failedFiles.length > 0) {
    console.log(`❌ Failed to delete: ${failedFiles.length} files`)
    console.log('Failed files:', failedFiles)
  } else {
    console.log('🎉 All old JPEG files have been deleted!')
  }
}

deleteOldJpegs()