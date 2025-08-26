import type { OriginalMenuData, MenuCategory, MenuItem } from '@/lib/types'
import giggsiMenuData from './giggsi_menu.json'

const originalMenuData = giggsiMenuData as unknown as OriginalMenuData

export const transformMenuData = (): { categories: MenuCategory[], items: MenuItem[] } => {
  const categories: MenuCategory[] = []
  const items: MenuItem[] = []

  let categoryOrder = 1
  let itemOrder = 1

  const categoryMap: { [key: string]: string } = {
    'מנות_ראשונות': 'Appetizers',
    'תוספות_למרכז_המגרש': 'Sides',
    'המבורגרים_של_נבחרת': 'Premium Burgers',
    'המבורגרים': 'Burgers',
    'מהגריל': 'From the Grill',
    'כריכים_ופינגר_פוד': 'Sandwiches & Finger Food',
    'הסלטים_האולימפיים': 'Olympic Salads',
    'מוקפצים': 'Stir Fry',
    'טבעוני': 'Vegan',
    'קינוחים': 'Desserts',
    'מנות_ילדים': 'Kids Menu',
    'שתייה_קלה': 'Soft Drinks',
    'בירות_מהחבית': 'Draft Beer',
    'שייקים': 'Shakes',
    'בירות_בבקבוק': 'Bottled Beer',
    'קוקטיילים': 'Cocktails',
    'יין': 'Wine',
    'מבעבעים': 'Sparkling'
  }

  Object.entries(originalMenuData).forEach(([categoryKey, categoryItems]) => {
    if (!categoryItems || !Array.isArray(categoryItems)) return
    
    const categoryId = `cat-${categoryOrder}`
    const englishName = categoryMap[categoryKey] || categoryKey
    
    const category: MenuCategory = {
      id: categoryId,
      name: englishName,
      name_he: categoryKey,
      name_en: englishName,
      description: `Delicious ${englishName.toLowerCase()} from our kitchen`,
      description_he: `${categoryKey} טעימים מהמטבח שלנו`,
      description_en: `Delicious ${englishName.toLowerCase()} from our kitchen`,
      image_url: undefined,
      display_order: categoryOrder,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    categories.push(category)

    categoryItems.forEach((originalItem) => {
      if (!originalItem || typeof originalItem !== 'object') return
      
      const priceStr = originalItem['מחיר'] || '0'
      const price = typeof priceStr === 'string' 
        ? parseFloat(priceStr.replace(/[^ד.]/g, '')) 
        : priceStr

      const item: MenuItem = {
        id: `item-${itemOrder}`,
        name: originalItem['שם_מנה'] || 'Unknown Item',
        name_he: originalItem['שם_מנה'] || 'פריט לא ידוע',
        name_en: originalItem['שם_מנה'] || 'Unknown Item',
        description: originalItem['פירוט_מנה'] || '',
        description_he: originalItem['פירוט_מנה'] || '',
        description_en: originalItem['פירוט_מנה'] || '',
        price: price || 0,
        image_url: undefined,
        category_id: categoryId,
        allergens: [],
        add_ons: [],
        is_available: true,
        display_order: itemOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      items.push(item)
      itemOrder++
    })

    categoryOrder++
  })

  return { categories, items }
}

export const { categories: menuCategories, items: menuItems } = transformMenuData()

export const getCategoryById = (categoryId: string): MenuCategory | undefined => {
  return menuCategories.find(cat => cat.id === categoryId)
}

export const getItemsByCategory = (categoryId: string): MenuItem[] => {
  return menuItems.filter(item => item.category_id === categoryId && item.is_available)
}

export const getItemById = (itemId: string): MenuItem | undefined => {
  return menuItems.find(item => item.id === itemId)
}

export const getAllCategories = (): MenuCategory[] => {
  return menuCategories.filter(cat => cat.is_active)
}

export const getAllItems = (): MenuItem[] => {
  return menuItems.filter(item => item.is_available)
}