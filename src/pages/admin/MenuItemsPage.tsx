import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { ItemAddonsSection } from '@/components/admin/ItemAddonsSection'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Search } from 'lucide-react'

interface MenuItem {
  id: string
  category_id: string
  name_he: string
  name_en?: string
  name_ar?: string
  name_ru?: string
  description_he?: string
  description_en?: string
  description_ar?: string
  description_ru?: string
  price: number
  image_url?: string
  allergens?: string[]
  is_available: boolean
  display_order: number
}

interface Category {
  id: string
  name_he: string
}

const ALLERGENS = [
  'gluten', 'dairy', 'eggs', 'nuts', 
  'peanuts', 'soy', 'fish', 'shellfish', 'sesame'
]

export const MenuItemsPage: React.FC = () => {
  const navigate = useNavigate()
  const { categoryId } = useParams()
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState<Partial<MenuItem>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId || 'all')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(categoryId)
    }
  }, [categoryId])

  const loadData = async () => {
    try {
      // Load categories
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('id, name_he')
        .order('display_order')
      
      if (catError) throw catError
      setCategories(categoriesData || [])

      // Load items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .order('category_id, display_order')
      
      if (itemsError) throw itemsError
      setItems(itemsData || [])
    } catch (err: any) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item)
      setFormData(item)
    } else {
      setEditingItem(null)
      setFormData({
        name_he: '',
        name_en: '',
        name_ar: '',
        name_ru: '',
        description_he: '',
        description_en: '',
        description_ar: '',
        description_ru: '',
        price: 0,
        category_id: categories[0]?.id || '',
        allergens: [],
        is_available: true,
        display_order: 1
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      if (editingItem) {
        // Update existing
        const { error } = await supabase
          .from('menu_items')
          .update(formData)
          .eq('id', editingItem.id)
        
        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('menu_items')
          .insert([formData])
        
        if (error) throw error
      }

      await loadData()
      setDialogOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await loadData()
    } catch (err: any) {
      setError('Failed to delete item')
    }
  }

  const handleImageUpload = (urls: any) => {
    setFormData({ ...formData, image_url: urls.medium })
  }

  const toggleAllergen = (allergen: string) => {
    const current = formData.allergens || []
    if (current.includes(allergen)) {
      setFormData({
        ...formData,
        allergens: current.filter(a => a !== allergen)
      })
    } else {
      setFormData({
        ...formData,
        allergens: [...current, allergen]
      })
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name_he.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description_he?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

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
                <h1 className="text-2xl font-bold">Menu Items</h1>
                <p className="text-sm text-muted-foreground">Manage menu items</p>
              </div>
            </div>
            <Button onClick={() => openDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name_he}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {filteredItems.map((item) => {
            const category = categories.find(c => c.id === item.category_id)
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name_he}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{item.name_he}</h3>
                          <p className="text-sm text-muted-foreground">
                            {category?.name_he} • ₪{item.price}
                          </p>
                          {item.description_he && (
                            <p className="text-sm mt-1">{item.description_he}</p>
                          )}
                          {item.allergens && item.allergens.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {item.allergens.map(allergen => (
                                <Badge key={allergen} variant="secondary" className="text-xs">
                                  {allergen}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!item.is_available && (
                            <Badge variant="destructive">Unavailable</Badge>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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
              {editingItem ? 'Edit Item' : 'Add Item'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingItem ? 'Edit menu item details' : 'Add a new menu item to the category'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
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
              
              <div className="space-y-2">
                <Label htmlFor="price">Price (₪) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price || 0}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                />
              </div>
            </div>

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
              <Label>Allergens</Label>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map(allergen => (
                  <Button
                    key={allergen}
                    type="button"
                    variant={formData.allergens?.includes(allergen) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleAllergen(allergen)}
                  >
                    {allergen}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Item Image</Label>
              <ImageUpload
                onUpload={handleImageUpload}
                category={categories.find(c => c.id === formData.category_id)?.name_he || 'items'}
                itemName={formData.name_he || 'item'}
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Current"
                  className="w-32 h-32 object-cover rounded mt-2"
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_available"
                checked={formData.is_available !== false}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              />
              <Label htmlFor="is_available">Available</Label>
            </div>

            {/* Add-ons Management Section */}
            {formData.category_id && (
              <ItemAddonsSection
                itemId={editingItem?.id}
                categoryId={formData.category_id}
                onDataChange={() => {
                  // Optionally reload data after addon changes
                }}
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name_he || !formData.category_id}>
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