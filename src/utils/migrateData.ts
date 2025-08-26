import { supabase } from '@/lib/supabase'
import menuData from '@/assets/giggsi_menu.json'

interface MenuItemRaw {
  שם_מנה: string
  פירוט_מנה?: string
  מחיר: string
}

interface MenuDataRaw {
  מסעדה: string
  קטגוריות: {
    [key: string]: MenuItemRaw[]
  }
}

// Category name translations
const categoryTranslations: Record<string, { en: string, ar: string, ru: string }> = {
  'מנות_ראשונות': { en: 'Appetizers', ar: 'المقبلات', ru: 'Закуски' },
  'תוספות_למרכז_המגרש': { en: 'Sides', ar: 'الأطباق الجانبية', ru: 'Гарниры' },
  'המבורגרים_של_נבחרת': { en: 'Premium Burgers', ar: 'برجر بريميوم', ru: 'Премиум бургеры' },
  'המבורגרים': { en: 'Burgers', ar: 'البرجر', ru: 'Бургеры' },
  'מהגריל': { en: 'From the Grill', ar: 'من الشواية', ru: 'С гриля' },
  'כריכים_ופינגר_פוד': { en: 'Sandwiches & Finger Food', ar: 'السندويشات والأطباق الخفيفة', ru: 'Сэндвичи и закуски' },
  'הסלטים_האולימפיים': { en: 'Olympic Salads', ar: 'السلطات الأولمبية', ru: 'Олимпийские салаты' },
  'מוקפצים': { en: 'Stir Fry', ar: 'القلي السريع', ru: 'Стир-фрай' },
  'טבעוני': { en: 'Vegan', ar: 'نباتي', ru: 'Веганское' },
  'קינוחים': { en: 'Desserts', ar: 'الحلويات', ru: 'Десерты' },
  'מנות_ילדים': { en: 'Kids Menu', ar: 'قائمة الأطفال', ru: 'Детское меню' },
  'שתייה_קלה': { en: 'Soft Drinks', ar: 'المشروبات الغازية', ru: 'Безалкогольные напитки' },
  'בירות_מהחבית': { en: 'Draft Beer', ar: 'البيرة من الصنبور', ru: 'Разливное пиво' },
  'שייקים': { en: 'Shakes', ar: 'الشيك', ru: 'Коктейли' },
  'בירות_בבקבוק': { en: 'Bottled Beer', ar: 'البيرة المعبأة', ru: 'Бутылочное пиво' },
  'קוקטיילים': { en: 'Cocktails', ar: 'الكوكتيلات', ru: 'Коктейли' },
  'יין': { en: 'Wine', ar: 'النبيذ', ru: 'Вино' },
  'מבעבעים': { en: 'Sparkling', ar: 'المشروبات الفوارة', ru: 'Игристые вина' }
}

// Parse price from Hebrew format
function parsePrice(priceStr: string): number {
  const cleanPrice = priceStr.replace(/[^\d.]/g, '')
  return parseFloat(cleanPrice) || 0
}

// Format Hebrew category name
function formatCategoryName(name: string): string {
  return name.replace(/_/g, ' ')
}

export async function migrateMenuData() {
  const data = menuData as MenuDataRaw
  
  console.log('Starting menu data migration...')
  
  try {
    // Clear existing data (optional - remove in production)
    console.log('Clearing existing data...')
    await supabase.from('add_ons').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    let categoryOrder = 1
    
    // Process each category
    for (const [categoryKey, items] of Object.entries(data.קטגוריות)) {
      const hebrewName = formatCategoryName(categoryKey)
      const translations = categoryTranslations[categoryKey] || {
        en: hebrewName,
        ar: hebrewName,
        ru: hebrewName
      }
      
      console.log(`Processing category: ${hebrewName}`)
      
      // Insert category
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .insert({
          name_he: hebrewName,
          name_en: translations.en,
          name_ar: translations.ar,
          name_ru: translations.ru,
          description_he: `מבחר ${hebrewName} מעולים`,
          description_en: `Excellent selection of ${translations.en}`,
          description_ar: `مجموعة ممتازة من ${translations.ar}`,
          description_ru: `Отличный выбор ${translations.ru}`,
          display_order: categoryOrder,
          is_active: true
        })
        .select()
        .single()
      
      if (categoryError) {
        console.error(`Error inserting category ${hebrewName}:`, categoryError)
        continue
      }
      
      console.log(`Category inserted: ${categoryData.id}`)
      
      // Process items in this category
      let itemOrder = 1
      for (const item of items) {
        const price = parsePrice(item.מחיר)
        
        // Detect allergens from description (basic implementation)
        const allergens = []
        const description = item.פירוט_מנה || ''
        
        if (description.includes('גלוטן') || description.includes('לחם') || description.includes('בצק')) {
          allergens.push('gluten')
        }
        if (description.includes('חלב') || description.includes('גבינה') || description.includes('שמנת')) {
          allergens.push('dairy')
        }
        if (description.includes('ביצה') || description.includes('ביצת')) {
          allergens.push('eggs')
        }
        if (description.includes('אגוז') || description.includes('שקדים') || description.includes('קשיו')) {
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
        
        // Insert menu item
        const { data: itemData, error: itemError } = await supabase
          .from('menu_items')
          .insert({
            category_id: categoryData.id,
            name_he: item.שם_מנה,
            name_en: item.שם_מנה, // Will be translated later
            name_ar: item.שם_מנה, // Will be translated later
            name_ru: item.שם_מנה, // Will be translated later
            description_he: item.פירוט_מנה || '',
            description_en: item.פירוט_מנה || '', // Will be translated later
            description_ar: item.פירוט_מנה || '', // Will be translated later
            description_ru: item.פירוט_מנה || '', // Will be translated later
            price: price,
            allergens: allergens,
            is_available: true,
            display_order: itemOrder
          })
          .select()
          .single()
        
        if (itemError) {
          console.error(`Error inserting item ${item.שם_מנה}:`, itemError)
        } else {
          console.log(`Item inserted: ${item.שם_מנה}`)
        }
        
        itemOrder++
      }
      
      categoryOrder++
    }
    
    console.log('Migration completed successfully!')
    return { success: true }
    
  } catch (error) {
    console.error('Migration failed:', error)
    return { success: false, error }
  }
}

// Function to run migration (can be called from admin panel or CLI)
export async function runMigration() {
  try {
    const result = await migrateMenuData()
    if (result.success) {
      console.log('✅ Menu data migrated successfully!')
    } else {
      console.error('❌ Migration failed:', result.error)
    }
    return result
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}