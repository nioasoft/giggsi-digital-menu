import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { formatPrice, cn, getLocalizedContent } from '@/lib/utils'
import type { MenuCardProps } from '@/lib/types'

export const MenuCard: React.FC<MenuCardProps> = ({ item, onClick }) => {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'he' || i18n.language === 'ar'
  const localizedContent = getLocalizedContent(item, i18n.language)

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        "touch-manipulation",
        !item.is_available && "opacity-60 cursor-not-allowed"
      )}
      onClick={item.is_available ? onClick : undefined}
    >
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          <div className="flex-1 min-w-0 order-2">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-base line-clamp-1 flex-1" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {localizedContent.name}
              </h3>
              <span className="text-lg font-bold text-giggsi-gold flex-shrink-0">
                {formatPrice(item.price)}
              </span>
            </div>

            {localizedContent.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {localizedContent.description}
              </p>
            )}

            {item.allergens && item.allergens.length > 0 && (
              <div className={`flex flex-wrap gap-1 mb-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {item.allergens.slice(0, 3).map((allergen) => (
                  <Badge
                    key={allergen}
                    variant="secondary"
                    className="text-xs px-2 py-0.5"
                  >
                    {t(`allergens.${allergen}`, allergen)}
                  </Badge>
                ))}
                {item.allergens.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    +{item.allergens.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {item.add_ons && item.add_ons.length > 0 && (
              <p className="text-xs text-giggsi-gold font-medium" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {t('menu.addOns')}
              </p>
            )}

            {!item.is_available && (
              <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
                <Badge variant="destructive" className="text-xs">
                  {t('menu.unavailable')}
                </Badge>
              </div>
            )}
          </div>

          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 order-1">
            {(item.image_urls || item.image_url) ? (
              <img
                src={
                  item.image_urls 
                    ? (window.innerWidth <= 640 ? item.image_urls.small : item.image_urls.medium) 
                    : item.image_url
                }
                srcSet={
                  item.image_urls 
                    ? `${item.image_urls.small} 400w, ${item.image_urls.medium} 800w, ${item.image_urls.large} 1200w`
                    : undefined
                }
                sizes="(max-width: 640px) 80px, 96px"
                alt={localizedContent.name}
                className="w-full h-full object-cover rounded-md"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-giggsi-gold/20 to-giggsi-accent/20 rounded-md flex items-center justify-center">
                <span className="text-sm font-bold text-giggsi-gold">
                  {localizedContent.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}