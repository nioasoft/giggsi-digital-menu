import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import { getLocalizedField } from '@/lib/utils'

interface Popup {
  id: string
  type: 'site_wide' | 'category_specific' | 'banner'
  title_he: string
  title_en?: string
  title_ar?: string
  title_ru?: string
  content_he: string
  content_en?: string
  content_ar?: string
  content_ru?: string
  image?: string
  category_id?: string
  display_order: number
  is_active: boolean
  show_on_load: boolean
  dismiss_duration?: number // auto-dismiss after X seconds
  created_at: string
}

interface PopupManagerProps {
  categoryId?: string
  showBanners?: boolean
}

export const PopupManager: React.FC<PopupManagerProps> = ({ categoryId, showBanners = false }) => {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'he' || i18n.language === 'ar'
  const [popups, setPopups] = useState<Popup[]>([])
  const [currentPopup, setCurrentPopup] = useState<Popup | null>(null)
  const [dismissedPopups, setDismissedPopups] = useState<string[]>([])
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    loadPopups()
    // Load dismissed popups from localStorage
    const dismissed = localStorage.getItem('dismissedPopups')
    if (dismissed) {
      setDismissedPopups(JSON.parse(dismissed))
    }
  }, [categoryId])

  useEffect(() => {
    // Show first available popup
    if (popups.length > 0 && !currentPopup) {
      const nextPopup = popups.find(p => 
        p.type !== 'banner' && 
        !dismissedPopups.includes(p.id) &&
        p.show_on_load
      )
      if (nextPopup) {
        showPopupWithDelay(nextPopup)
      }
    }
  }, [popups, dismissedPopups])

  const loadPopups = async () => {
    try {
      let query = supabase
        .from('popups')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (categoryId) {
        // Get both site-wide and category-specific popups
        query = query.or(`type.eq.site_wide,and(type.eq.category_specific,category_id.eq.${categoryId})`)
      } else {
        // Only get site-wide popups for homepage
        query = query.eq('type', 'site_wide')
      }

      if (showBanners) {
        // Include banner type if requested
        query = query.or('type.eq.banner')
      }

      const { data, error } = await query

      if (error) throw error
      setPopups(data || [])
    } catch (error) {
      console.error('Failed to load popups:', error)
    }
  }

  const showPopupWithDelay = (popup: Popup, delay: number = 500) => {
    setTimeout(() => {
      setCurrentPopup(popup)
      setShowPopup(true)

      // Auto-dismiss if configured
      if (popup.dismiss_duration) {
        setTimeout(() => {
          dismissPopup(popup.id)
        }, popup.dismiss_duration * 1000)
      }
    }, delay)
  }

  const dismissPopup = (popupId: string) => {
    const newDismissed = [...dismissedPopups, popupId]
    setDismissedPopups(newDismissed)
    localStorage.setItem('dismissedPopups', JSON.stringify(newDismissed))
    setShowPopup(false)
    setCurrentPopup(null)

    // Show next popup if available
    const nextPopup = popups.find(p => 
      p.type !== 'banner' && 
      !newDismissed.includes(p.id) &&
      p.id !== popupId
    )
    if (nextPopup) {
      showPopupWithDelay(nextPopup, 300)
    }
  }

  const clearDismissedPopups = () => {
    setDismissedPopups([])
    localStorage.removeItem('dismissedPopups')
  }

  // Render banners inline
  const banners = popups.filter(p => p.type === 'banner')

  return (
    <>
      {/* Inline Banners */}
      {showBanners && banners.map((banner) => {
        if (dismissedPopups.includes(banner.id)) return null
        
        const title = getLocalizedField(banner, 'title', i18n.language)
        const content = getLocalizedField(banner, 'content', i18n.language)

        return (
          <div
            key={banner.id}
            className="relative bg-giggsi-gold/10 border border-giggsi-gold/30 rounded-lg p-4 mb-4"
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => dismissPopup(banner.id)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="text-start pr-10">
              {title && (
                <h3 className="font-semibold text-giggsi-gold mb-1">{title}</h3>
              )}
              {content && (
                <p className="text-sm text-muted-foreground">{content}</p>
              )}
              {banner.image && (
                <img
                  src={banner.image}
                  alt={title}
                  className="mt-3 rounded-md max-h-32 object-cover"
                />
              )}
            </div>
          </div>
        )
      })}

      {/* Popup Modal */}
      {currentPopup && currentPopup.type !== 'banner' && (
        <Dialog open={showPopup} onOpenChange={(open) => {
          if (!open && currentPopup) {
            dismissPopup(currentPopup.id)
          }
        }}>
          <DialogContent className="max-w-lg">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={() => currentPopup && dismissPopup(currentPopup.id)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="space-y-4 pt-2">
              {currentPopup.image && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <img
                    src={currentPopup.image}
                    alt={getLocalizedField(currentPopup, 'title', i18n.language)}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-2 text-start">
                <h2 className="text-xl font-bold text-giggsi-gold">
                  {getLocalizedField(currentPopup, 'title', i18n.language)}
                </h2>
                
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {getLocalizedField(currentPopup, 'content', i18n.language)}
                </div>
              </div>

              <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button
                  variant="outline"
                  onClick={() => currentPopup && dismissPopup(currentPopup.id)}
                  className="flex-1"
                >
                  {i18n.t('common.close')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}