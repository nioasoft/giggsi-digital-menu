export interface MenuItem {
  id: string
  name: string
  name_he: string
  name_en?: string
  name_ar?: string
  name_ru?: string
  description?: string
  description_he?: string
  description_en?: string
  description_ar?: string
  description_ru?: string
  price: number
  image_url?: string
  category_id: string
  allergens: string[]
  add_ons?: AddOn[]
  is_available: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: string
  name: string
  name_he: string
  name_en?: string
  name_ar?: string
  name_ru?: string
  description?: string
  description_he?: string
  description_en?: string
  description_ar?: string
  description_ru?: string
  image_url?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AddOnGroup {
  id: string
  name_he: string
  name_en?: string
  name_ar?: string
  name_ru?: string
  description_he?: string
  description_en?: string
  description_ar?: string
  description_ru?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  addons?: AddOn[]
}

export interface AddOn {
  id: string
  group_id: string
  name_he: string
  name_en?: string
  name_ar?: string
  name_ru?: string
  price: number
  addon_type: 'sauce' | 'side' | 'topping' | 'extra'
  is_available: boolean
  display_order: number
  created_at?: string
  updated_at?: string
}

export interface RestaurantInfo {
  id: string
  name: string
  logo?: string
  phone?: string
  address?: string
  hours?: string
  description?: string
  updated_at: string
}

export interface Popup {
  id: string
  title: string
  content: string
  type: 'site_wide' | 'category_specific' | 'banner'
  category_id?: string
  is_active: boolean
  display_from?: string
  display_until?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  role: 'admin'
  created_at: string
  last_login?: string
}

export type SupportedLanguage = 'he' | 'ar' | 'ru' | 'en'
export type Direction = 'ltr' | 'rtl'

export interface OriginalMenuItem {
  שם_מנה: string
  פירוט_מנה?: string
  מחיר: string
}

export interface OriginalMenuData {
  [categoryName: string]: OriginalMenuItem[]
}

export interface MenuCardProps {
  item: MenuItem
  onClick?: () => void
}

export interface CategoryCardProps {
  category: MenuCategory
  itemCount?: number
  onClick?: () => void
}

export interface LanguageSwitcherProps {
  currentLanguage: SupportedLanguage
  onLanguageChange: (language: SupportedLanguage) => void
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}

export interface DatabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}