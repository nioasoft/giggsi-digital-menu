import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth'
import { 
  LogOut, 
  UtensilsCrossed, 
  FolderOpen, 
  Image, 
  Bell,
  Settings,
  Users,
  Package
} from 'lucide-react'

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleLogout = async () => {
    await signOut()
    navigate('/admin-giggsi-2024/login')
  }

  const menuItems = [
    {
      title: t('admin.categories'),
      description: t('admin.categoriesSubtitle'),
      icon: FolderOpen,
      path: '/admin-giggsi-2024/categories'
    },
    {
      title: t('admin.menuItems'),
      description: t('admin.menuItemsSubtitle'),
      icon: UtensilsCrossed,
      path: '/admin-giggsi-2024/items'
    },
    {
      title: 'קבוצות תוספות',
      description: 'נהל קבוצות תוספות ותוספות',
      icon: Package,
      path: '/admin-giggsi-2024/addon-groups'
    },
    {
      title: t('admin.images'),
      description: t('admin.imagesSubtitle'),
      icon: Image,
      path: '/admin-giggsi-2024/images'
    },
    {
      title: t('admin.promotions'),
      description: t('admin.promotionsSubtitle'),
      icon: Bell,
      path: '/admin-giggsi-2024/promotions'
    },
    {
      title: t('admin.restaurantInfo'),
      description: t('admin.restaurantInfoSubtitle'),
      icon: Settings,
      path: '/admin-giggsi-2024/settings'
    },
    {
      title: t('admin.adminUsers'),
      description: t('admin.adminUsersSubtitle'),
      icon: Users,
      path: '/admin-giggsi-2024/users'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-giggsi-gold">{t('admin.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('admin.subtitle')}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {t('admin.logout')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Card
                key={item.path}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(item.path)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-giggsi-gold" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}