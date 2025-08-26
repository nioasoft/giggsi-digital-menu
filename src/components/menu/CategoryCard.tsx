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
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105",
        "touch-manipulation",
        onClick && "hover:bg-accent/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="aspect-square relative overflow-hidden rounded-t-lg">
          {category.image_url ? (
            <img
              src={category.image_url}
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
        
        <div className="p-4 text-center">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {localizedContent.name}
          </h3>
          {localizedContent.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
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