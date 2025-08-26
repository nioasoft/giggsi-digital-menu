import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { AddOn, AddOnGroup } from '@/lib/types'

export const AddOnsPage: React.FC = () => {
  const navigate = useNavigate()
  const { groupId } = useParams()
  const [group, setGroup] = useState<AddOnGroup | null>(null)
  const [addons, setAddons] = useState<AddOn[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState<AddOn | null>(null)
  const [formData, setFormData] = useState<Partial<AddOn>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (groupId) {
      loadData()
    }
  }, [groupId])

  const loadData = async () => {
    try {
      // Load group info
      const { data: groupData, error: groupError } = await supabase
        .from('addon_groups')
        .select('*')
        .eq('id', groupId)
        .single()
      
      if (groupError) throw groupError
      setGroup(groupData)

      // Load addons for this group
      const { data: addonsData, error: addonsError } = await supabase
        .from('add_ons')
        .select('*')
        .eq('group_id', groupId)
        .order('display_order')
      
      if (addonsError) throw addonsError
      setAddons(addonsData || [])
    } catch (err: any) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (addon?: AddOn) => {
    if (addon) {
      setEditingAddon(addon)
      setFormData(addon)
    } else {
      setEditingAddon(null)
      setFormData({
        group_id: groupId,
        name_he: '',
        name_en: '',
        name_ar: '',
        name_ru: '',
        price: 0,
        addon_type: 'topping',
        is_available: true,
        display_order: addons.length + 1
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      if (editingAddon) {
        const { error } = await supabase
          .from('add_ons')
          .update(formData)
          .eq('id', editingAddon.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('add_ons')
          .insert([formData])
        
        if (error) throw error
      }

      await loadData()
      setDialogOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save addon')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this addon?')) return

    try {
      const { error } = await supabase
        .from('add_ons')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await loadData()
    } catch (err: any) {
      setError('Failed to delete addon')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Group not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin-giggsi-2024/addon-groups')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="text-center flex-1">
                <h1 className="text-2xl font-bold">תוספות: {group.name_he}</h1>
                <p className="text-sm text-muted-foreground">נהל תוספות בקבוצה</p>
              </div>
            </div>
            <Button onClick={() => openDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              הוסף תוספת
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {addons.map((addon) => (
            <Card key={addon.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{addon.name_he}</h3>
                      <Badge variant="outline">{formatPrice(addon.price)}</Badge>
                      {!addon.is_available && (
                        <Badge variant="secondary">לא זמין</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      סוג: {addon.addon_type} • סדר: {addon.display_order}
                    </p>
                    {addon.name_en && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {addon.name_en}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDialog(addon)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(addon.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {addons.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">אין תוספות בקבוצה זו</p>
                <Button onClick={() => openDialog()} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  הוסף תוספת ראשונה
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddon ? 'ערוך תוספת' : 'הוסף תוספת'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingAddon ? 'ערוך פרטי תוספת' : 'הוסף תוספת חדשה לקבוצה'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_he">שם (עברית) *</Label>
                <Input
                  id="name_he"
                  value={formData.name_he || ''}
                  onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name_en">שם (אנגלית)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en || ''}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_ar">שם (ערבית)</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar || ''}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name_ru">שם (רוסית)</Label>
                <Input
                  id="name_ru"
                  value={formData.name_ru || ''}
                  onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">מחיר (₪) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price || 0}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addon_type">סוג התוספת</Label>
                <Select
                  value={formData.addon_type}
                  onValueChange={(value) => setFormData({ ...formData, addon_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="side">תוספת צד</SelectItem>
                    <SelectItem value="topping">תוספת מעל</SelectItem>
                    <SelectItem value="sauce">רוטב</SelectItem>
                    <SelectItem value="extra">תוספת נוספת</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">סדר תצוגה</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order || 1}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_available"
                checked={formData.is_available !== false}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              />
              <Label htmlFor="is_available">זמין</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name_he}>
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
    </div>
  )
}