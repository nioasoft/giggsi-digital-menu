import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getMenuCategories, getMenuItems, supabase } from '@/lib/supabase'
import type { MenuCategory, MenuItem, ApiResponse } from '@/lib/types'

export const useMenuCategories = (): ApiResponse<MenuCategory[]> => {
  const [data, setData] = useState<MenuCategory[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { i18n } = useTranslation()

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        const categories = await getMenuCategories()
        setData(categories as MenuCategory[])
        setError(null)
      } catch (err) {
        console.error('Failed to load categories:', err)
        setError('Failed to load categories')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadCategories()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [i18n.language])

  return { data, error, loading }
}

export const useMenuItems = (categoryId?: string): ApiResponse<MenuItem[]> => {
  const [data, setData] = useState<MenuItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { i18n } = useTranslation()

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true)
        const items = await getMenuItems(categoryId)
        setData(items as MenuItem[])
        setError(null)
      } catch (err) {
        console.error('Failed to load menu items:', err)
        setError('Failed to load menu items')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    loadItems()

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('menu-items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        loadItems()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [categoryId, i18n.language])

  return { data, error, loading }
}

export const useMenuItem = (itemId: string): ApiResponse<MenuItem> => {
  const [data, setData] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { i18n } = useTranslation()

  useEffect(() => {
    const loadItem = async () => {
      if (!itemId) return
      
      try {
        setLoading(true)
        const { data: item, error: fetchError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('id', itemId)
          .single()
        
        if (fetchError) throw fetchError
        if (!item) throw new Error('Item not found')

        setData(item as MenuItem)
        setError(null)
      } catch (err) {
        console.error('Failed to load item:', err)
        setError(err instanceof Error ? err.message : 'Failed to load item')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    loadItem()
  }, [itemId, i18n.language])

  return { data, error, loading }
}