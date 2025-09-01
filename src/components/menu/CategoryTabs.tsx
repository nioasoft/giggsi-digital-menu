import React from 'react'
import { cn, getLocalizedField } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import type { MenuCategory } from '@/lib/types'

interface CategoryTabsProps {
  categories: MenuCategory[]
  selectedCategoryId: string | null
  onCategorySelect: (categoryId: string) => void
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
}) => {
  const { i18n } = useTranslation()
  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      <div className="container overflow-x-auto">
        <div className="flex gap-2 py-4 min-w-max">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategoryId === category.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onCategorySelect(category.id)}
              className={cn(
                "flex-shrink-0 rounded-full px-6",
                selectedCategoryId === category.id &&
                  "bg-giggsi-gold text-giggsi-dark hover:bg-giggsi-gold/90"
              )}
            >
              {getLocalizedField(category, 'name', i18n.language)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}