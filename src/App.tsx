import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/common/Layout'
import { Analytics } from '@/components/common/Analytics'
import { MenuPage } from '@/pages/menu/MenuPage'
import { LoginPage } from '@/pages/admin/LoginPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { CategoriesPage } from '@/pages/admin/CategoriesPage'
import { MenuItemsPage } from '@/pages/admin/MenuItemsPage'
import { PromotionsPage } from '@/pages/admin/PromotionsPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { AddOnGroupsPage } from '@/pages/admin/AddOnGroupsPage'
import { AddOnsPage } from '@/pages/admin/AddOnsPage'
import { WaitersPage } from '@/pages/admin/WaitersPage'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
import { WaiterLoginPage } from '@/pages/waiter/WaiterLoginPage'
import { TableSelectionPage } from '@/pages/waiter/TableSelectionPage'
import { TableOrderPage } from '@/pages/waiter/TableOrderPage'
import { BillPage } from '@/pages/waiter/BillPage'
import { WaiterProtectedRoute } from '@/components/waiter/WaiterProtectedRoute'
import { WaiterOrderProvider } from '@/contexts/WaiterOrderContext'
import { PrivacyPolicy } from '@/pages/legal/PrivacyPolicy'
import { TermsOfService } from '@/pages/legal/TermsOfService'
import MigrateData from '@/pages/MigrateData'
import FullMigrate from '@/pages/FullMigrate'
import EnvCheck from '@/pages/EnvCheck'
import { useTranslation } from 'react-i18next'

function App() {
  const { ready } = useTranslation()

  // Don't render until i18n is ready
  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-giggsi-gold" />
      </div>
    )
  }

  return (
    <>
      <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <Routes>
          {/* Admin Routes - No Layout */}
          <Route path="/admin-giggsi-2024/login" element={<LoginPage />} />
          <Route
            path="/admin-giggsi-2024"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-giggsi-2024/categories"
            element={
              <ProtectedRoute>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-giggsi-2024/items"
            element={
              <ProtectedRoute>
                <MenuItemsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-giggsi-2024/items/:categoryId"
            element={
              <ProtectedRoute>
                <MenuItemsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-giggsi-2024/promotions"
            element={
              <ProtectedRoute>
                <PromotionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-giggsi-2024/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-giggsi-2024/addon-groups"
            element={
              <ProtectedRoute>
                <AddOnGroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-giggsi-2024/addon-groups/:groupId/addons"
            element={
              <ProtectedRoute>
                <AddOnsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-giggsi-2024/waiters"
            element={
              <ProtectedRoute>
                <WaitersPage />
              </ProtectedRoute>
            }
          />

          {/* Waiter Routes - No Layout */}
          <Route path="/waiter/login" element={<WaiterLoginPage />} />
          <Route
            path="/waiter/tables"
            element={
              <WaiterProtectedRoute>
                <WaiterOrderProvider>
                  <TableSelectionPage />
                </WaiterOrderProvider>
              </WaiterProtectedRoute>
            }
          />
          <Route
            path="/waiter/table/:tableNumber"
            element={
              <WaiterProtectedRoute>
                <WaiterOrderProvider>
                  <TableOrderPage />
                </WaiterOrderProvider>
              </WaiterProtectedRoute>
            }
          />
          <Route
            path="/waiter/table/:tableNumber/bill"
            element={
              <WaiterProtectedRoute>
                <WaiterOrderProvider>
                  <BillPage />
                </WaiterOrderProvider>
              </WaiterProtectedRoute>
            }
          />

          {/* Public Routes with Layout */}
          <Route
            path="*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/menu" replace />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/migrate" element={<MigrateData />} />
                  <Route path="/fullmigrate" element={<FullMigrate />} />
                  <Route path="/env-check" element={<EnvCheck />} />
                  <Route path="*" element={<Navigate to="/menu" replace />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
        <Analytics />
      </Router>
    </>
  )
}

export default App