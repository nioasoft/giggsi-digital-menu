import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, getLocalizedContent } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import type { CategoryCardProps } from '@/lib/types'

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  itemCount = 0,
  onClick
}) => {
  const { t, i18n } = useTranslation()
  const localizedContent = getLocalizedContent(category, i18n.language)
  const [showTooltip, setShowTooltip] = React.useState(false)
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105",
        "touch-manipulation",
        onClick && "hover:bg-accent/50"
      )}
      onClick={onClick}
      onTouchStart={() => setShowTooltip(true)}
      onTouchEnd={() => setTimeout(() => setShowTooltip(false), 2000)}
    >
      <CardContent className="p-0">
        <div className="aspect-[4/3] sm:aspect-square relative overflow-hidden rounded-t-lg">
          {(category.image_urls || category.image_url) ? (
            <img
              src={
                category.image_urls 
                  ? (window.innerWidth <= 640 ? category.image_urls.small : 
                     window.innerWidth <= 1024 ? category.image_urls.medium : 
                     category.image_urls.large)
                  : category.image_url
              }
              srcSet={
                category.image_urls 
                  ? `${category.image_urls.small} 400w, ${category.image_urls.medium} 800w, ${category.image_urls.large} 1200w`
                  : undefined
              }
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 300px"
              alt={localizedContent.name}
              className="w-full h-full object-cover transition-opacity duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-giggsi-gold/20 to-giggsi-accent/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-giggsi-gold">
                {localizedContent.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        
        <div className="p-3 sm:p-4 text-center relative">
          {showTooltip && localizedContent.name.length > 15 && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-2 py-1 rounded text-sm whitespace-nowrap z-10">
              {localizedContent.name}
            </div>
          )}
          <h3 className="font-semibold text-base sm:text-lg mb-1.5 line-clamp-2">
            {localizedContent.name}
          </h3>
          {localizedContent.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-1">
              {localizedContent.description}
            </p>
          )}
          {itemCount > 0 && (
            <p className="text-xs text-giggsi-gold font-medium">
              {t ? t('menu.itemCount', { count: itemCount }) : `${itemCount} items`}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}