import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { CategoryAddonsModal } from '@/components/admin/CategoryAddonsModal'
import { supabase } from '@/lib/supabase'
import { deleteOldImages } from '@/lib/imageProcessor'
import { ArrowLeft, Plus, Edit, Trash2, Loader2, GripVertical, UtensilsCrossed, Package } from 'lucide-react'

interface Category {
  id: string
  name_he: string
  name_en?: string
  name_ar?: string
  name_ru?: string
  description_he?: string
  description_en?: string
  description_ar?: string
  description_ru?: string
  image_url?: string
  image_urls?: {
    original: string
    small: string
    medium: string
    large: string
  }
  display_order: number
  is_active: boolean
}

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<Partial<Category>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [addonsModalOpen, setAddonsModalOpen] = useState(false)
  const [selectedCategoryForAddons, setSelectedCategoryForAddons] = useState<Category | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order')
      
      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData(category)
    } else {
      setEditingCategory(null)
      setFormData({
        name_he: '',
        name_en: '',
        name_ar: '',
        name_ru: '',
        description_he: '',
        description_en: '',
        description_ar: '',
        description_ru: '',
        display_order: categories.length + 1,
        is_active: true
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      if (editingCategory) {
        // Delete old images if new ones were uploaded
        if (formData.image_urls && editingCategory.image_urls) {
          const oldUrls = Object.values(editingCategory.image_urls)
          await deleteOldImages(oldUrls)
        } else if (formData.image_url && editingCategory.image_url && formData.image_url !== editingCategory.image_url) {
          // Handle legacy single image URL
          await deleteOldImages([editingCategory.image_url])
        }
        
        // Update existing
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id)
        
        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('categories')
          .insert([formData])
        
        if (error) throw error
      }

      await loadCategories()
      setDialogOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await loadCategories()
    } catch (err: any) {
      setError('Failed to delete category')
    }
  }

  const handleImageUpload = (urls: any) => {
    setFormData({ 
      ...formData, 
      image_url: urls.medium,  // Keep for backward compatibility
      image_urls: urls  // Store all image sizes
    })
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
                <h1 className="text-2xl font-bold">Categories</h1>
                <p className="text-sm text-muted-foreground">Manage menu categories</p>
              </div>
            </div>
            <Button onClick={() => openDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
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
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  
                  {category.image_url && (
                    <img
                      src={category.image_url}
                      alt={category.name_he}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{category.name_he}</h3>
                    {category.description_he && (
                      <p className="text-sm text-muted-foreground">
                        {category.description_he}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/admin-giggsi-2024/items/${category.id}`)}
                      title="View Items"
                    >
                      <UtensilsCrossed className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedCategoryForAddons(category)
                        setAddonsModalOpen(true)
                      }}
                      title="Manage Add-ons"
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDialog(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingCategory ? 'Edit category details' : 'Add a new menu category'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_he">Name (Hebrew) *</Label>
                <Input
                  id="name_he"
                  value={formData.name_he || ''}
                  onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name_en">Name (English)</Label>
                <Input
                  id="name_en"
                  value={formData.name_en || ''}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name_ar">Name (Arabic)</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar || ''}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name_ru">Name (Russian)</Label>
                <Input
                  id="name_ru"
                  value={formData.name_ru || ''}
                  onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_he">Description (Hebrew)</Label>
              <Textarea
                id="description_he"
                value={formData.description_he || ''}
                onChange={(e) => setFormData({ ...formData, description_he: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Category Image</Label>
              <ImageUpload
                onUpload={handleImageUpload}
                category="categories"
                categoryEn="categories"
                itemName={formData.name_he || 'category'}
                itemNameEn={formData.name_en || formData.name_he || 'category'}
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Current"
                  className="w-32 h-32 object-cover rounded mt-2"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name_he}>
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

      {/* Add-ons Management Modal */}
      {selectedCategoryForAddons && (
        <CategoryAddonsModal
          open={addonsModalOpen}
          onClose={() => {
            setAddonsModalOpen(false)
            setSelectedCategoryForAddons(null)
          }}
          categoryId={selectedCategoryForAddons.id}
          categoryName={selectedCategoryForAddons.name_he}
        />
      )}
    </div>
  )
}