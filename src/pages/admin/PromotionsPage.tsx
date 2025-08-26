import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Eye, EyeOff } from 'lucide-react'

interface Popup {
  id: string
  title_he: string
  title_en?: string
  title_ar?: string
  title_ru?: string
  content_he: string
  content_en?: string
  content_ar?: string
  content_ru?: string
  type: 'site_wide' | 'category_specific' | 'banner'
  category_id?: string
  position?: 'top' | 'middle' | 'bottom'
  is_active: boolean
  display_from?: string
  display_until?: string
  image_url?: string
  button_text?: string
  button_link?: string
}

interface Category {
  id: string
  name_he: string
}

export const PromotionsPage: React.FC = () => {
  const navigate = useNavigate()
  const [popups, setPopups] = useState<Popup[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null)
  const [formData, setFormData] = useState<Partial<Popup>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load categories
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('id, name_he')
        .order('display_order')
      
      if (catError) throw catError
      setCategories(categoriesData || [])

      // Load popups
      const { data: popupsData, error: popupsError } = await supabase
        .from('popups')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (popupsError) throw popupsError
      setPopups(popupsData || [])
    } catch (err: any) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (popup?: Popup) => {
    if (popup) {
      setEditingPopup(popup)
      setFormData(popup)
    } else {
      setEditingPopup(null)
      setFormData({
        title_he: '',
        title_en: '',
        title_ar: '',
        title_ru: '',
        content_he: '',
        content_en: '',
        content_ar: '',
        content_ru: '',
        type: 'site_wide',
        position: 'middle',
        is_active: true
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      if (editingPopup) {
        const { error } = await supabase
          .from('popups')
          .update(formData)
          .eq('id', editingPopup.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('popups')
          .insert([formData])
        
        if (error) throw error
      }

      await loadData()
      setDialogOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save popup')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this popup?')) return

    try {
      const { error } = await supabase
        .from('popups')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await loadData()
    } catch (err: any) {
      setError('Failed to delete popup')
    }
  }

  const toggleActive = async (popup: Popup) => {
    try {
      const { error } = await supabase
        .from('popups')
        .update({ is_active: !popup.is_active })
        .eq('id', popup.id)
      
      if (error) throw error
      await loadData()
    } catch (err: any) {
      setError('Failed to update status')
    }
  }

  const filteredPopups = popups.filter(popup => {
    if (filter === 'active') return popup.is_active
    if (filter === 'inactive') return !popup.is_active
    return true
  })

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'site_wide': return 'Site Wide'
      case 'category_specific': return 'Category'
      case 'banner': return 'Banner'
      default: return type
    }
  }

  const getPositionLabel = (position?: string) => {
    switch (position) {
      case 'top': return 'Top'
      case 'middle': return 'Middle'
      case 'bottom': return 'Bottom'
      default: return 'Default'
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
                <h1 className="text-2xl font-bold">Promotions & Popups</h1>
                <p className="text-sm text-muted-foreground">Manage popups and banners</p>
              </div>
            </div>
            <Button onClick={() => openDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Popup
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

        <div className="flex gap-4 mb-6">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Popups</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {filteredPopups.map((popup) => {
            const category = categories.find(c => c.id === popup.category_id)
            return (
              <Card key={popup.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{popup.title_he}</h3>
                        <Badge variant={popup.type === 'banner' ? 'default' : 'outline'}>
                          {getTypeLabel(popup.type)}
                        </Badge>
                        {popup.type === 'banner' && (
                          <Badge variant="secondary">
                            {getPositionLabel(popup.position)}
                          </Badge>
                        )}
                        {popup.type === 'category_specific' && category && (
                          <Badge variant="secondary">{category.name_he}</Badge>
                        )}
                        <Badge variant={popup.is_active ? 'default' : 'secondary'}>
                          {popup.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {popup.content_he}
                      </p>
                      {(popup.display_from || popup.display_until) && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {popup.display_from && `From: ${new Date(popup.display_from).toLocaleDateString()}`}
                          {popup.display_from && popup.display_until && ' • '}
                          {popup.display_until && `Until: ${new Date(popup.display_until).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(popup)}
                      >
                        {popup.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDialog(popup)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(popup.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPopup ? 'Edit Popup' : 'Add Popup'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingPopup ? 'Edit popup or banner details' : 'Create a new popup or banner'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="site_wide">Site Wide Popup</SelectItem>
                    <SelectItem value="category_specific">Category Specific</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'banner' && (
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Select
                    value={formData.position || 'middle'}
                    onValueChange={(value) => setFormData({ ...formData, position: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top of Page</SelectItem>
                      <SelectItem value="middle">Middle of Items</SelectItem>
                      <SelectItem value="bottom">Bottom of Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.type === 'category_specific' && (
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name_he}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title_he">Title (Hebrew) *</Label>
                <Input
                  id="title_he"
                  value={formData.title_he || ''}
                  onChange={(e) => setFormData({ ...formData, title_he: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title_en">Title (English)</Label>
                <Input
                  id="title_en"
                  value={formData.title_en || ''}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_he">Content (Hebrew) *</Label>
              <Textarea
                id="content_he"
                value={formData.content_he || ''}
                onChange={(e) => setFormData({ ...formData, content_he: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_en">Content (English)</Label>
              <Textarea
                id="content_en"
                value={formData.content_en || ''}
                onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_from">Display From</Label>
                <Input
                  id="display_from"
                  type="datetime-local"
                  value={formData.display_from || ''}
                  onChange={(e) => setFormData({ ...formData, display_from: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="display_until">Display Until</Label>
                <Input
                  id="display_until"
                  type="datetime-local"
                  value={formData.display_until || ''}
                  onChange={(e) => setFormData({ ...formData, display_until: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active !== false}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.title_he || !formData.content_he}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}