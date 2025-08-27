import { supabase } from '../lib/supabase'

async function cleanupOldJPEGImages() {
  console.log('Starting cleanup of old JPEG images...')
  
  // List of old JPEG files to delete
  const oldJPEGFiles = [
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
    '-/-_1756211365927_small.jpg',
  ]
  
  try {
    // Delete in batches to avoid overwhelming the API
    const batchSize = 10
    for (let i = 0; i < oldJPEGFiles.length; i += batchSize) {
      const batch = oldJPEGFiles.slice(i, i + batchSize)
      
      const { data, error } = await supabase.storage
        .from('menu-images')
        .remove(batch)
      
      if (error) {
        console.error(`Error deleting batch ${i / batchSize + 1}:`, error)
      } else {
        console.log(`✅ Deleted batch ${i / batchSize + 1} (${batch.length} files)`)
      }
    }
    
    console.log(`🎉 Cleanup complete! Removed ${oldJPEGFiles.length} old JPEG files.`)
  } catch (error) {
    console.error('Failed to cleanup old images:', error)
  }
}

// Run the cleanup
cleanupOldJPEGImages()