import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AddOnGroup } from '@/lib/types'

export const AddOnGroupsPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [groups, setGroups] = useState<AddOnGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<AddOnGroup | null>(null)
  const [formData, setFormData] = useState<Partial<AddOnGroup>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('addon_groups')
        .select('*')
        .order('display_order')
      
      if (error) throw error
      setGroups(data || [])
    } catch (err: any) {
      setError('Failed to load addon groups')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (group?: AddOnGroup) => {
    if (group) {
      setEditingGroup(group)
      setFormData(group)
    } else {
      setEditingGroup(null)
      setFormData({
        name_he: '',
        name_en: '',
        name_ar: '',
        name_ru: '',
        description_he: '',
        description_en: '',
        description_ar: '',
        description_ru: '',
        display_order: groups.length + 1,
        is_active: true
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      if (editingGroup) {
        const { error } = await supabase
          .from('addon_groups')
          .update(formData)
          .eq('id', editingGroup.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('addon_groups')
          .insert([formData])
        
        if (error) throw error
      }

      await loadGroups()
      setDialogOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save addon group')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this addon group?')) return

    try {
      const { error } = await supabase
        .from('addon_groups')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await loadGroups()
    } catch (err: any) {
      setError('Failed to delete addon group')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
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
                onClick={() => navigate('/admin-giggsi-2024')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="text-center flex-1">
                <h1 className="text-2xl font-bold">קבוצות תוספות</h1>
                <p className="text-sm text-muted-foreground">נהל קבוצות תוספות למנות</p>
              </div>
            </div>
            <Button onClick={() => openDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              הוסף קבוצה
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
          {groups.map((group) => (
            <Card key={group.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{group.name_he}</h3>
                      {!group.is_active && (
                        <Badge variant="secondary">לא פעיל</Badge>
                      )}
                    </div>
                    {group.description_he && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {group.description_he}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      סדר תצוגה: {group.display_order}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/admin-giggsi-2024/addon-groups/${group.id}/addons`)}
                      title="נהל תוספות"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDialog(group)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(group.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'ערוך קבוצת תוספות' : 'הוסף קבוצת תוספות'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingGroup ? 'ערוך פרטי קבוצת תוספות' : 'הוסף קבוצה חדשה לתוספות'}
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

            <div className="space-y-2">
              <Label htmlFor="description_he">תיאור (עברית)</Label>
              <Textarea
                id="description_he"
                value={formData.description_he || ''}
                onChange={(e) => setFormData({ ...formData, description_he: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_en">תיאור (אנגלית)</Label>
              <Textarea
                id="description_en"
                value={formData.description_en || ''}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_order">סדר תצוגה</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order || 1}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center gap-2 mt-8">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active !== false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">פעיל</Label>
              </div>
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