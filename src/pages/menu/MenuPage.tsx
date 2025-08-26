import React from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryCard } from '@/components/menu/CategoryCard'
import { MenuCard } from '@/components/menu/MenuCard'
import { CategoryTabs } from '@/components/menu/CategoryTabs'
import { ItemDetailModal } from '@/components/menu/ItemDetailModal'
import { PopupManager } from '@/components/promotions/PopupManager'
import { Button } from '@/components/ui/button'
import { useMenuCategories, useMenuItems } from '@/hooks/useMenu'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuItem } from '@/lib/types'

export const MenuPage: React.FC = () => {
  const { t } = useTranslation()
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null)
  const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null)
  const [detailModalOpen, setDetailModalOpen] = React.useState(false)
  
  const { data: categories, loading: categoriesLoading, error: categoriesError } = useMenuCategories()
  const { data: items, loading: itemsLoading, error: itemsError } = useMenuItems(selectedCategoryId || undefined)

  const selectedCategory = categories?.find(cat => cat.id === selectedCategoryId)

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
  }


  if (categoriesError) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{categoriesError}</p>
          <Button onClick={() => window.location.reload()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {selectedCategoryId && categories && (
        <CategoryTabs
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={handleCategorySelect}
        />
      )}
      
      <div className="container py-6 space-y-6 flex-1">
        {/* Promotional Popups */}
        <PopupManager categoryId={selectedCategoryId || undefined} showBanners={false} />
        
        {!selectedCategoryId && (
        <>
          <div className="text-center space-y-2">
            <div className="space-y-1">
              <p className="text-2xl text-foreground">
                {t('restaurant.welcomeOnly')}
              </p>
              <h1 className="text-3xl font-bold text-giggsi-gold">
                {t('restaurant.name')}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {t('menu.selectCategory')}
            </p>
          </div>

          {categoriesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
            </div>
          ) : (
            <div className="menu-grid">
              {categories?.map((category) => {
                const categoryItemCount = items?.filter(
                  item => item.category_id === category.id
                ).length || 0
                
                return (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    itemCount={categoryItemCount}
                    onClick={() => handleCategorySelect(category.id)}
                  />
                )
              })}
            </div>
          )}
        </>
      )}

        {selectedCategoryId && selectedCategory && (
          <>
            <div className="mb-6 text-start">
              <h1 className="text-2xl font-bold text-giggsi-gold mb-2">
                {selectedCategory.name}
              </h1>
              {selectedCategory.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedCategory.description}
                </p>
              )}
            </div>

            {itemsError && (
              <div className="text-center">
                <p className="text-destructive">{itemsError}</p>
              </div>
            )}

            {itemsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
              </div>
            ) : items && items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No items available in this category
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Show banners between items */}
                <PopupManager categoryId={selectedCategoryId} showBanners={true} />
                
                {items?.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    onClick={() => {
                      setSelectedItem(item)
                      setDetailModalOpen(true)
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedItem(null)
        }}
      />
    </div>
  )
}