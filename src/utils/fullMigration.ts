import { supabase } from '@/lib/supabase'
import menuData from '@/assets/giggsi_menu.json'

interface MenuItemRaw {
  שם_מנה: string
  פירוט_מנה?: string
  מחיר: string
}

// Parse price from Hebrew format
function parsePrice(priceStr: string): number {
  const cleanPrice = priceStr.replace(/[^\d.]/g, '')
  return parseFloat(cleanPrice) || 0
}

export async function runFullMigration() {
  console.log('Starting full menu migration...')
  
  try {
    // Get all categories to map names to IDs
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name_he')
    
    if (catError) throw catError
    if (!categories) throw new Error('No categories found')
    
    // Create a map of Hebrew names to IDs
    const categoryMap: Record<string, string> = {}
    categories.forEach(cat => {
      // Map the JSON keys to category IDs
      if (cat.name_he === 'מנות ראשונות') categoryMap['מנות_ראשונות'] = cat.id
      if (cat.name_he === 'תוספות למרכז המגרש') categoryMap['תוספות_למרכז_המגרש'] = cat.id
      if (cat.name_he === 'המבורגרים של נבחרת') categoryMap['המבורגרים_של_נבחרת'] = cat.id
      if (cat.name_he === 'המבורגרים') categoryMap['המבורגרים'] = cat.id
      if (cat.name_he === 'מהגריל') categoryMap['מהגריל'] = cat.id
      if (cat.name_he === 'כריכים ופינגר פוד') categoryMap['כריכים_ופינגר_פוד'] = cat.id
      if (cat.name_he === 'הסלטים האולימפיים') categoryMap['הסלטים_האולימפיים'] = cat.id
      if (cat.name_he === 'מוקפצים') categoryMap['מוקפצים'] = cat.id
      if (cat.name_he === 'טבעוני') categoryMap['טבעוני'] = cat.id
      if (cat.name_he === 'קינוחים') categoryMap['קינוחים'] = cat.id
      if (cat.name_he === 'מנות ילדים') categoryMap['מנות_ילדים'] = cat.id
      if (cat.name_he === 'שתייה קלה') categoryMap['שתייה_קלה'] = cat.id
      if (cat.name_he === 'בירות מהחבית') categoryMap['בירות_מהחבית'] = cat.id
      if (cat.name_he === 'שייקים') categoryMap['שייקים'] = cat.id
      if (cat.name_he === 'בירות בבקבוק') categoryMap['בירות_בבקבוק'] = cat.id
      if (cat.name_he === 'קוקטיילים') categoryMap['קוקטיילים'] = cat.id
      if (cat.name_he === 'יין') categoryMap['יין'] = cat.id
      if (cat.name_he === 'מבעבעים') categoryMap['מבעבעים'] = cat.id
    })
    
    console.log('Category mapping created:', categoryMap)
    
    let totalInserted = 0
    let totalErrors = 0
    
    // Process each category from the JSON
    for (const [categoryKey, items] of Object.entries(menuData.קטגוריות)) {
      const categoryId = categoryMap[categoryKey]
      if (!categoryId) {
        console.warn(`Category not found for key: ${categoryKey}`)
        continue
      }
      
      console.log(`Processing ${items.length} items for category: ${categoryKey}`)
      
      // Process items in batches of 10
      const batchSize = 10
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        
        const menuItems = batch.map((item: MenuItemRaw, index: number) => ({
          category_id: categoryId,
          name_he: item.שם_מנה,
          name_en: item.שם_מנה, // Will be translated later
          description_he: item.פירוט_מנה || '',
          description_en: '', // Will be translated later
          price: parsePrice(item.מחיר),
          is_available: true,
          display_order: i + index + 1,
          allergens: detectAllergens(item.פירוט_מנה || '')
        }))
        
        const { data, error } = await supabase
          .from('menu_items')
          .insert(menuItems)
          .select()
        
        if (error) {
          console.error(`Error inserting batch for ${categoryKey}:`, error)
          totalErrors += batch.length
        } else {
          console.log(`Inserted ${data?.length || 0} items`)
          totalInserted += data?.length || 0
        }
      }
    }
    
    console.log(`Migration completed! Inserted: ${totalInserted}, Errors: ${totalErrors}`)
    return { success: true, inserted: totalInserted, errors: totalErrors }
    
  } catch (error) {
    console.error('Migration failed:', error)
    return { success: false, error }
  }
}

// Basic allergen detection from Hebrew description
function detectAllergens(description: string): string[] {
  const allergens = []
  
  if (description.includes('גלוטן') || description.includes('לחם') || description.includes('בצק') || description.includes('ג\'בטה')) {
    allergens.push('gluten')
  }
  if (description.includes('חלב') || description.includes('גבינה') || description.includes('שמנת') || description.includes('חמאה')) {
    allergens.push('dairy')
  }
  if (description.includes('ביצה') || description.includes('ביצת')) {
    allergens.push('eggs')
  }
  if (description.includes('אגוז') || description.includes('שקדים') || description.includes('קשיו') || description.includes('בוטנים')) {
    allergens.push('nuts')
  }
  if (description.includes('סויה')) {
    allergens.push('soy')
  }
  if (description.includes('דג') || description.includes('סלמון')) {
    allergens.push('fish')
  }
  if (description.includes('שומשום')) {
    allergens.push('sesame')
  }
  
  return allergens
}