import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Package, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import type { AddOnGroup, AddOn } from '@/lib/types'

interface ItemAddonsSectionProps {
  itemId?: string  // undefined for new items
  categoryId: string
  onDataChange?: () => void
}

interface GroupWithAddons extends AddOnGroup {
  addons: AddOn[]
  isFromCategory: boolean
  isDisabledForItem?: boolean
}

export const ItemAddonsSection: React.FC<ItemAddonsSectionProps> = ({
  itemId,
  categoryId,
  onDataChange
}) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [groupsWithAddons, setGroupsWithAddons] = useState<GroupWithAddons[]>([])
  const [disabledGroups, setDisabledGroups] = useState<string[]>([])
  const [excludedAddons, setExcludedAddons] = useState<string[]>([])

  useEffect(() => {
    if (categoryId) {
      loadAddons()
    }
  }, [categoryId, itemId])

  const loadAddons = async () => {
    try {
      setLoading(true)
      
      // Get addon groups assigned to this category
      const { data: categoryGroups } = await supabase
        .from('category_addon_groups')
        .select('addon_group_id')
        .eq('category_id', categoryId)

      const categoryGroupIds = categoryGroups?.map(g => g.addon_group_id) || []

      // Get addon groups directly assigned to this item (if editing)
      let itemGroupIds: string[] = []
      if (itemId) {
        const { data: itemGroups } = await supabase
          .from('menu_item_addon_groups')
          .select('addon_group_id')
          .eq('menu_item_id', itemId)
          .eq('is_active', true)

        itemGroupIds = itemGroups?.map(g => g.addon_group_id) || []
      }

      // Combine unique group IDs
      const allGroupIds = [...new Set([...categoryGroupIds, ...itemGroupIds])]

      if (allGroupIds.length === 0) {
        setGroupsWithAddons([])
        return
      }

      // Load the groups with their addons
      const { data: groups } = await supabase
        .from('addon_groups')
        .select('*')
        .in('id', allGroupIds)
        .order('display_order')

      // Load addons for each group
      const groupsData: GroupWithAddons[] = []
      for (const group of groups || []) {
        const { data: addons } = await supabase
          .from('add_ons')
          .select('*')
          .eq('group_id', group.id)
          .eq('is_available', true)
          .order('display_order')

        groupsData.push({
          ...group,
          addons: addons || [],
          isFromCategory: categoryGroupIds.includes(group.id),
          isDisabledForItem: false
        })
      }

      // If editing, load disabled groups and excluded addons
      if (itemId) {
        // Check which groups are disabled for this item
        const { data: disabledData } = await supabase
          .from('menu_item_addon_groups')
          .select('addon_group_id')
          .eq('menu_item_id', itemId)
          .eq('is_active', false)

        const disabled = disabledData?.map(d => d.addon_group_id) || []
        setDisabledGroups(disabled)

        // Load excluded addons
        const { data: exclusions } = await supabase
          .from('menu_item_addon_exclusions')
          .select('addon_id')
          .eq('menu_item_id', itemId)

        setExcludedAddons(exclusions?.map(e => e.addon_id) || [])

        // Mark groups as disabled
        groupsData.forEach(group => {
          if (disabled.includes(group.id)) {
            group.isDisabledForItem = true
          }
        })
      }

      setGroupsWithAddons(groupsData)
      
    } catch (err: any) {
      setError('Failed to load addons')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleGroupDisabled = (groupId: string) => {
    setDisabledGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const toggleAddonExclusion = (addonId: string) => {
    setExcludedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    )
  }

  const saveChanges = async () => {
    if (!itemId) return // Can't save for new items

    setSaving(true)
    setError('')

    try {
      // Update disabled groups
      // First, remove all existing group overrides
      await supabase
        .from('menu_item_addon_groups')
        .delete()
        .eq('menu_item_id', itemId)

      // Then insert disabled groups
      if (disabledGroups.length > 0) {
        const disabledRecords = disabledGroups.map(groupId => ({
          menu_item_id: itemId,
          addon_group_id: groupId,
          is_active: false
        }))

        await supabase
          .from('menu_item_addon_groups')
          .insert(disabledRecords)
      }

      // Update excluded addons
      // First, remove all existing exclusions
      await supabase
        .from('menu_item_addon_exclusions')
        .delete()
        .eq('menu_item_id', itemId)

      // Then insert new exclusions
      if (excludedAddons.length > 0) {
        const exclusionRecords = excludedAddons.map(addonId => ({
          menu_item_id: itemId,
          addon_id: addonId
        }))

        await supabase
          .from('menu_item_addon_exclusions')
          .insert(exclusionRecords)
      }

      if (onDataChange) onDataChange()
    } catch (err: any) {
      setError(err.message || 'Failed to save addon settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-giggsi-gold" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          ניהול תוספות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {groupsWithAddons.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            אין תוספות מוגדרות לקטגוריה זו
          </p>
        ) : (
          <>
            <div className="space-y-4">
              {groupsWithAddons.map(group => (
                <div key={group.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{group.name_he}</h4>
                      {group.isFromCategory && (
                        <Badge variant="secondary" className="text-xs">
                          מהקטגוריה
                        </Badge>
                      )}
                    </div>
                    {itemId && group.isFromCategory && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`disable-${group.id}`}
                          checked={disabledGroups.includes(group.id)}
                          onCheckedChange={() => toggleGroupDisabled(group.id)}
                        />
                        <Label htmlFor={`disable-${group.id}`} className="text-sm">
                          הסתר קבוצה זו
                        </Label>
                      </div>
                    )}
                  </div>

                  {!disabledGroups.includes(group.id) && (
                    <div className="space-y-2 pl-4">
                      {group.addons.map(addon => (
                        <div
                          key={addon.id}
                          className={`flex items-center justify-between py-1 ${
                            excludedAddons.includes(addon.id) ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{addon.name_he}</span>
                            <Badge variant="outline" className="text-xs">
                              {formatPrice(addon.price)}
                            </Badge>
                          </div>
                          {itemId && (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`exclude-${addon.id}`}
                                checked={excludedAddons.includes(addon.id)}
                                onCheckedChange={() => toggleAddonExclusion(addon.id)}
                              />
                              <Label htmlFor={`exclude-${addon.id}`} className="text-sm">
                                הסתר
                              </Label>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {itemId && (
              <button
                onClick={saveChanges}
                disabled={saving}
                className="w-full px-4 py-2 bg-giggsi-gold text-black rounded-md hover:bg-giggsi-gold/90 disabled:opacity-50"
              >
                {saving ? 'שומר...' : 'שמור שינויים בתוספות'}
              </button>
            )}

            {!itemId && (
              <p className="text-xs text-muted-foreground text-center">
                ניתן לערוך תוספות לאחר יצירת הפריט
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}