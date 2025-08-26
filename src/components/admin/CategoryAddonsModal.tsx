import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AddOnGroup } from '@/lib/types'

interface CategoryAddonsModalProps {
  open: boolean
  onClose: () => void
  categoryId: string
  categoryName: string
}

export const CategoryAddonsModal: React.FC<CategoryAddonsModalProps> = ({
  open,
  onClose,
  categoryId,
  categoryName
}) => {
  const [addonGroups, setAddonGroups] = useState<AddOnGroup[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [addonCounts, setAddonCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (open && categoryId) {
      loadData()
    }
  }, [open, categoryId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load all addon groups
      const { data: groups, error: groupsError } = await supabase
        .from('addon_groups')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
      
      if (groupsError) throw groupsError
      setAddonGroups(groups || [])
      
      // Load addon counts for all groups
      const counts: Record<string, number> = {}
      for (const group of groups || []) {
        const { count } = await supabase
          .from('add_ons')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', group.id)
        counts[group.id] = count || 0
      }
      setAddonCounts(counts)

      // Load currently assigned groups for this category
      const { data: assignments, error: assignError } = await supabase
        .from('category_addon_groups')
        .select('addon_group_id')
        .eq('category_id', categoryId)
      
      if (assignError) throw assignError
      setSelectedGroups(assignments?.map(a => a.addon_group_id) || [])
      
    } catch (err: any) {
      setError('Failed to load addon groups')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      // First, delete all existing assignments for this category
      const { error: deleteError } = await supabase
        .from('category_addon_groups')
        .delete()
        .eq('category_id', categoryId)
      
      if (deleteError) throw deleteError

      // Then insert the new selections
      if (selectedGroups.length > 0) {
        const assignments = selectedGroups.map(groupId => ({
          category_id: categoryId,
          addon_group_id: groupId
        }))

        const { error: insertError } = await supabase
          .from('category_addon_groups')
          .insert(assignments)
        
        if (insertError) throw insertError
      }

      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save assignments')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            ניהול תוספות לקטגוריה: {categoryName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            בחר קבוצות תוספות שיהיו זמינות לכל הפריטים בקטגוריה {categoryName}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                בחר קבוצות תוספות שיהיו זמינות לכל הפריטים בקטגוריה זו:
              </p>
              
              {addonGroups.map(group => (
                  <div
                    key={group.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={group.id}
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={() => toggleGroup(group.id)}
                    />
                    <Label
                      htmlFor={group.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{group.name_he}</div>
                      {group.description_he && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {group.description_he}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {addonCounts[group.id] || 0} תוספות בקבוצה
                      </div>
                    </Label>
                  </div>
              ))}

              {addonGroups.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  אין קבוצות תוספות זמינות
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                שומר...
              </>
            ) : (
              'שמור'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}