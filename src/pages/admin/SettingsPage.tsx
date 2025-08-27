import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Loader2, Phone, MapPin, Clock, Globe } from 'lucide-react'

interface RestaurantInfo {
  id?: string
  name_he: string
  name_en?: string
  name_ar?: string
  name_ru?: string
  description_he?: string
  description_en?: string
  description_ar?: string
  description_ru?: string
  logo_url?: string
  phone?: string
  phone2?: string
  whatsapp?: string
  address_he?: string
  address_en?: string
  address_ar?: string
  address_ru?: string
  hours_he?: string
  hours_en?: string
  hours_ar?: string
  hours_ru?: string
  email?: string
  website?: string
  facebook?: string
  instagram?: string
  waze_link?: string
  google_maps_link?: string
  delivery_fee?: number
  minimum_order?: number
  delivery_time?: string
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
    name_he: 'Giggsi Sports Bar'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadRestaurantInfo()
  }, [])

  const loadRestaurantInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_info')
        .select('*')
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setRestaurantInfo(data)
      }
    } catch (err: any) {
      setError('Failed to load restaurant information')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (restaurantInfo.id) {
        // Update existing
        const { error } = await supabase
          .from('restaurant_info')
          .update(restaurantInfo)
          .eq('id', restaurantInfo.id)
        
        if (error) throw error
      } else {
        // Create new
        const { data, error } = await supabase
          .from('restaurant_info')
          .insert([restaurantInfo])
          .select()
          .single()
        
        if (error) throw error
        if (data) setRestaurantInfo(data)
      }
      
      setSuccess('Restaurant information saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save restaurant information')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (urls: any) => {
    setRestaurantInfo({ ...restaurantInfo, logo_url: urls.medium })
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
                <h1 className="text-2xl font-bold">Restaurant Settings</h1>
                <p className="text-sm text-muted-foreground">Manage restaurant information</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-500">
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_he">Restaurant Name (Hebrew) *</Label>
                  <Input
                    id="name_he"
                    value={restaurantInfo.name_he}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, name_he: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">Restaurant Name (English)</Label>
                  <Input
                    id="name_en"
                    value={restaurantInfo.name_en || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, name_en: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_he">Description (Hebrew)</Label>
                <Textarea
                  id="description_he"
                  value={restaurantInfo.description_he || ''}
                  onChange={(e) => setRestaurantInfo({ ...restaurantInfo, description_he: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_en">Description (English)</Label>
                <Textarea
                  id="description_en"
                  value={restaurantInfo.description_en || ''}
                  onChange={(e) => setRestaurantInfo({ ...restaurantInfo, description_en: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Restaurant Logo</Label>
                <ImageUpload
                  onUpload={handleImageUpload}
                  category="restaurant"
                  categoryEn="restaurant"
                  itemName="logo"
                  itemNameEn="logo"
                />
                {restaurantInfo.logo_url && (
                  <img
                    src={restaurantInfo.logo_url}
                    alt="Restaurant Logo"
                    className="w-32 h-32 object-contain rounded mt-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={restaurantInfo.phone || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, phone: e.target.value })}
                    placeholder="052-123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={restaurantInfo.whatsapp || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, whatsapp: e.target.value })}
                    placeholder="972521234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={restaurantInfo.email || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={restaurantInfo.website || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, website: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_he">Address (Hebrew)</Label>
                  <Textarea
                    id="address_he"
                    value={restaurantInfo.address_he || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address_he: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_en">Address (English)</Label>
                  <Textarea
                    id="address_en"
                    value={restaurantInfo.address_en || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address_en: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours_he">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Opening Hours (Hebrew)
                  </Label>
                  <Textarea
                    id="hours_he"
                    value={restaurantInfo.hours_he || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, hours_he: e.target.value })}
                    rows={3}
                    placeholder="ראשון-חמישי: 12:00-23:00&#10;שישי: 12:00-24:00&#10;שבת: סגור"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours_en">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Opening Hours (English)
                  </Label>
                  <Textarea
                    id="hours_en"
                    value={restaurantInfo.hours_en || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, hours_en: e.target.value })}
                    rows={3}
                    placeholder="Sun-Thu: 12:00-23:00&#10;Fri: 12:00-24:00&#10;Sat: Closed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="waze_link">Waze Link</Label>
                  <Input
                    id="waze_link"
                    type="url"
                    value={restaurantInfo.waze_link || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, waze_link: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google_maps_link">Google Maps Link</Label>
                  <Input
                    id="google_maps_link"
                    type="url"
                    value={restaurantInfo.google_maps_link || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, google_maps_link: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook URL</Label>
                  <Input
                    id="facebook"
                    type="url"
                    value={restaurantInfo.facebook || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, facebook: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram URL</Label>
                  <Input
                    id="instagram"
                    type="url"
                    value={restaurantInfo.instagram || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, instagram: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_fee">Delivery Fee (₪)</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    step="0.01"
                    value={restaurantInfo.delivery_fee || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, delivery_fee: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_order">Minimum Order (₪)</Label>
                  <Input
                    id="minimum_order"
                    type="number"
                    step="0.01"
                    value={restaurantInfo.minimum_order || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, minimum_order: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_time">Delivery Time</Label>
                  <Input
                    id="delivery_time"
                    value={restaurantInfo.delivery_time || ''}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, delivery_time: e.target.value })}
                    placeholder="30-45 minutes"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}