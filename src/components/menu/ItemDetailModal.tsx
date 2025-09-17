import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { formatPrice, getLocalizedContent } from '@/lib/utils'
import { calculateItemPriceWithAddons, getAddonsPrice } from '@/lib/priceUtils'
import { supabase } from '@/lib/supabase'
import { Loader2, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react'
import type { MenuItem } from '@/lib/types'

interface AddOnWithGroup {
  id: string
  group_id: string
  name_he: string
  name_en?: string
  name_ar?: string
  name_ru?: string
  price: number
  addon_type: string
  is_available: boolean
  display_order: number
  group_name_he?: string
  group_name_en?: string
  group_name_ar?: string
  group_name_ru?: string
}

interface ItemDetailModalProps {
  item: MenuItem | null
  open: boolean
  onClose: () => void
  onAddToOrder?: (item: MenuItem, quantity: number, addons?: any[]) => void
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, open, onClose, onAddToOrder }) => {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'he' || i18n.language === 'ar'
  const [addOns, setAddOns] = useState<AddOnWithGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [quantity, setQuantity] = useState(1)
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (item) {
      loadAddOns()
      setQuantity(1)
      setSelectedAddOns(new Set())
    }
  }, [item])

  const loadAddOns = async () => {
    if (!item) return
    
    setLoading(true)
    try {
      // Get addon groups for this item's category
      const { data: categoryGroups } = await supabase
        .from('category_addon_groups')
        .select('addon_group_id')
        .eq('category_id', item.category_id)

      // Get addon groups directly assigned to this item
      const { data: itemGroups } = await supabase
        .from('menu_item_addon_groups')
        .select('addon_group_id')
        .eq('menu_item_id', item.id)
        .eq('is_active', true)

      // Combine group IDs
      const groupIds = [
        ...(categoryGroups?.map(g => g.addon_group_id) || []),
        ...(itemGroups?.map(g => g.addon_group_id) || [])
      ]

      if (groupIds.length === 0) {
        setAddOns([])
        return
      }

      // Get excluded addon IDs for this item
      const { data: exclusions } = await supabase
        .from('menu_item_addon_exclusions')
        .select('addon_id')
        .eq('menu_item_id', item.id)

      const excludedIds = exclusions?.map(e => e.addon_id) || []

      // Load addons with their group info
      let query = supabase
        .from('add_ons')
        .select(`
          *,
          addon_groups!group_id (
            name_he,
            name_en,
            name_ar,
            name_ru
          )
        `)
        .in('group_id', groupIds)
        .eq('is_available', true)
        .order('group_id')
        .order('display_order')
      
      // Only add exclusion filter if there are excluded items
      if (excludedIds.length > 0) {
        query = query.not('id', 'in', `(${excludedIds.join(',')})`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Transform data to include group names
      const transformedData = (data || []).map((addon: any) => ({
        ...addon,
        group_name_he: addon.addon_groups?.name_he,
        group_name_en: addon.addon_groups?.name_en,
        group_name_ar: addon.addon_groups?.name_ar,
        group_name_ru: addon.addon_groups?.name_ru,
      }))
      
      setAddOns(transformedData)
    } catch (error) {
      console.error('Failed to load add-ons:', error)
    } finally {
      setLoading(false)
    }
  }


  if (!item) return null

  const localizedContent = getLocalizedContent(item, i18n.language)

  // Group add-ons by their group
  const addOnsByGroup = addOns.reduce((acc, addOn) => {
    const groupName = addOn[`group_name_${i18n.language}` as keyof typeof addOn] as string || 
                      addOn.group_name_he || 
                      'תוספות'
    if (!acc[groupName]) acc[groupName] = []
    acc[groupName].push(addOn)
    return acc
  }, {} as Record<string, AddOnWithGroup[]>)

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupName)) {
        newSet.delete(groupName)
      } else {
        newSet.add(groupName)
      }
      return newSet
    })
  }

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(addOnId)) {
        newSet.delete(addOnId)
      } else {
        newSet.add(addOnId)
      }
      return newSet
    })
  }

  const handleAddToOrder = () => {
    if (!item || !onAddToOrder) return

    const selectedAddOnItems = addOns.filter(addon => selectedAddOns.has(addon.id))
    onAddToOrder(item, quantity, selectedAddOnItems)
    onClose()
  }

  // Calculate total price with selected addons
  const selectedAddOnItems = useMemo(() => {
    return addOns.filter(addon => selectedAddOns.has(addon.id))
  }, [addOns, selectedAddOns])

  const totalAddonsPrice = useMemo(() => {
    return getAddonsPrice(selectedAddOnItems as any[])
  }, [selectedAddOnItems])

  const totalPrice = useMemo(() => {
    return calculateItemPriceWithAddons(item?.price || 0, selectedAddOnItems as any[], quantity)
  }, [item?.price, selectedAddOnItems, quantity])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" isRTL={isRTL}>
        {/* Header with proper accessibility */}
        <DialogTitle className="mb-4 w-full text-start text-lg font-semibold leading-none tracking-tight">
          {localizedContent.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {localizedContent.description || localizedContent.name}
        </DialogDescription>

        <div className="space-y-6">
          {/* Item Image */}
          {(item.image_urls || item.image_url) && (
            <div className="relative w-full aspect-square max-w-md mx-auto rounded-lg overflow-hidden bg-muted">
              <img
                src={
                  item.image_urls 
                    ? (window.innerWidth <= 768 ? item.image_urls.medium : item.image_urls.large)
                    : item.image_url
                }
                srcSet={
                  item.image_urls 
                    ? `${item.image_urls.small} 400w, ${item.image_urls.medium} 800w, ${item.image_urls.large} 1200w`
                    : undefined
                }
                sizes="(max-width: 768px) 100vw, 800px"
                alt={localizedContent.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          {localizedContent.description && (
            <div className="w-full text-start">
              <p className="text-muted-foreground">
                {localizedContent.description}
              </p>
            </div>
          )}

          {/* Allergens */}
          {item.allergens && item.allergens.length > 0 && (
            <div className="space-y-2 text-start">
              <h3 className="font-semibold">{t('menu.allergens')}</h3>
              <div className="flex flex-wrap gap-2 justify-start">
                {item.allergens.map((allergen) => (
                  <Badge key={allergen} variant="secondary">
                    {t(`allergens.${allergen}`, allergen)}
                  </Badge>
                ))}
              </div>
            </div>
          )}


          {/* Add-ons */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-giggsi-gold" />
            </div>
          ) : Object.keys(addOnsByGroup).length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-start">
                {t('menu.addOns')}
              </h3>
              {Object.entries(addOnsByGroup).map(([groupName, groupAddOns]) => (
                <div key={groupName} className="border rounded-lg p-3">
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className="w-full flex items-center justify-between hover:bg-accent/10 transition-colors rounded p-2"
                  >
                    <h4 className="font-medium text-sm">
                      {groupName} ({groupAddOns.length})
                    </h4>
                    {expandedGroups.has(groupName) ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </button>
                  {expandedGroups.has(groupName) && (
                    <div className="mt-2 space-y-1">
                      {groupAddOns.map((addOn) => {
                        const addOnContent = getLocalizedContent(addOn, i18n.language)
                        return (
                          <div
                            key={addOn.id}
                            className="flex items-center justify-between p-2 rounded bg-accent/20 cursor-pointer hover:bg-accent/30"
                            onClick={() => toggleAddOn(addOn.id)}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedAddOns.has(addOn.id)}
                                onChange={() => toggleAddOn(addOn.id)}
                                className="w-4 h-4 text-giggsi-gold"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-start">
                                {addOnContent.name}
                              </span>
                            </div>
                            {addOn.price > 0 && (
                              <span className="text-giggsi-gold font-medium">
                                +{formatPrice(addOn.price)}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="pt-4 border-t space-y-2">
            {/* Base Price */}
            <div className="flex items-center justify-between text-sm">
              <span>מחיר בסיס:</span>
              <span>{formatPrice(item.price)}</span>
            </div>

            {/* Addons Price */}
            {totalAddonsPrice > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span>תוספות ({selectedAddOnItems.length}):</span>
                <span className="text-giggsi-gold">+{formatPrice(totalAddonsPrice)}</span>
              </div>
            )}

            {/* Quantity */}
            {quantity > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span>כמות:</span>
                <span>× {quantity}</span>
              </div>
            )}

            {/* Total Price */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-lg font-semibold">סה"כ:</span>
              <span className="text-2xl font-bold text-giggsi-gold">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>

          {/* Quantity selector for waiter mode */}
          {onAddToOrder && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">כמות:</span>
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              {t('common.close')}
            </Button>
            {onAddToOrder && (
              <Button
                onClick={handleAddToOrder}
                className="bg-giggsi-gold hover:bg-giggsi-gold/90"
              >
                הוסף להזמנה ({formatPrice(totalPrice)})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}