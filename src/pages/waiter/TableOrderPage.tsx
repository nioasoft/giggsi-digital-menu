import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowRight, ShoppingCart, Receipt, Plus, Minus, Trash2, LogOut } from 'lucide-react'
import {
  getTableByNumber,
  getOpenOrderByTable,
  createOrder,
  getOrderItems,
  updateOrderItem,
  removeOrderItem,
  addItemToOrder
} from '@/lib/waiterService'
import { getCurrentWaiter, signOutWaiter } from '@/lib/waiterAuth'
import { MobileCart, DesktopCart } from '@/components/waiter/MobileCart'
import type { Table, Order, OrderItem, MenuItem, WaiterUser } from '@/lib/types'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export const TableOrderPage: React.FC = () => {
  const { tableNumber } = useParams<{ tableNumber: string }>()
  const navigate = useNavigate()

  const [table, setTable] = useState<Table | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [currentWaiter, setCurrentWaiter] = useState<WaiterUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([])

  useEffect(() => {
    loadTableData()
    loadMenuData()
  }, [tableNumber])

  useEffect(() => {
    if (order) {
      loadOrderItems()
    }
  }, [order])

  useEffect(() => {
    if (selectedCategory) {
      setMenuItems(allMenuItems.filter(item => item.category_id === selectedCategory))
    }
  }, [selectedCategory, allMenuItems])

  const loadMenuData = async () => {
    try {
      // Load categories
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (catError) throw catError
      setCategories(categoriesData || [])

      // Load all menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('display_order')

      if (itemsError) throw itemsError
      setAllMenuItems(itemsData || [])

      // Set first category as selected by default
      if (categoriesData && categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id)
        setMenuItems(itemsData?.filter(item => item.category_id === categoriesData[0].id) || [])
      }
    } catch (err) {
      console.error('Failed to load menu data:', err)
    }
  }

  const loadTableData = async () => {
    if (!tableNumber) return

    setLoading(true)
    try {
      const [waiter, tableData] = await Promise.all([
        getCurrentWaiter(),
        getTableByNumber(parseInt(tableNumber))
      ])

      if (!waiter) {
        navigate('/waiter/login')
        return
      }

      if (!tableData) {
        setError('שולחן לא נמצא')
        return
      }

      setCurrentWaiter(waiter)
      setTable(tableData)

      // Check for existing order
      if (tableData.current_order_id) {
        const existingOrder = await getOpenOrderByTable(tableData.id)
        setOrder(existingOrder)
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת נתוני השולחן')
    } finally {
      setLoading(false)
    }
  }

  const loadOrderItems = async () => {
    if (!order) return

    try {
      const items = await getOrderItems(order.id)
      setOrderItems(items)
    } catch (err) {
      console.error('Failed to load order items:', err)
    }
  }

  const handleLogout = async () => {
    await signOutWaiter()
    navigate('/waiter/login')
  }

  const handleAddToOrder = async (itemId: string) => {
    if (!order) {
      // Create order first if doesn't exist
      if (!table || !currentWaiter) return

      try {
        const newOrder = await createOrder(table.id, currentWaiter.id)
        setOrder(newOrder)
        setTable({ ...table, status: 'occupied', current_order_id: newOrder.id })

        // Now add the item
        await addItemToOrder(newOrder.id, itemId, 1)
        await loadOrderItems()
        // Reload order to get updated totals
        const updatedOrder = await getOpenOrderByTable(table.id)
        if (updatedOrder) setOrder(updatedOrder)
      } catch (err: any) {
        setError(err.message || 'שגיאה בהוספת פריט')
      }
    } else {
      // Add to existing order
      try {
        await addItemToOrder(order.id, itemId, 1)
        await loadOrderItems()
        // Reload order to get updated totals
        if (table) {
          const updatedOrder = await getOpenOrderByTable(table.id)
          if (updatedOrder) setOrder(updatedOrder)
        }
      } catch (err: any) {
        setError(err.message || 'שגיאה בהוספת פריט')
      }
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      await handleRemoveFromOrder(itemId)
      return
    }

    try {
      await updateOrderItem(itemId, newQuantity)
      await loadOrderItems()
      // Reload order to get updated totals
      if (table) {
        const updatedOrder = await getOpenOrderByTable(table.id)
        if (updatedOrder) setOrder(updatedOrder)
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בעדכון כמות')
    }
  }

  const handleRemoveFromOrder = async (itemId: string) => {
    try {
      await removeOrderItem(itemId)
      await loadOrderItems()
      // Reload order to get updated totals
      if (table) {
        const updatedOrder = await getOpenOrderByTable(table.id)
        if (updatedOrder) setOrder(updatedOrder)
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה במחיקת פריט')
    }
  }

  const handleNavigateToBill = () => {
    navigate(`/waiter/table/${tableNumber}/bill`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Link to="/waiter/tables">
              <Button variant="ghost" size="icon">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">שולחן {table?.table_number}</h1>
              <p className="text-sm text-muted-foreground">הוספת פריטים להזמנה</p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            {order && orderItems.length > 0 && (
              <Badge className="bg-giggsi-gold text-white">
                {orderItems.reduce((sum, item) => sum + item.quantity, 0)} פריטים
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="container mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Menu Categories and Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Categories Grid - Optimized for mobile */}
            <div>
              <h2 className="text-lg font-semibold mb-3">קטגוריות</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "p-3 sm:p-4 rounded-lg border transition-colors text-right min-h-[80px]",
                      selectedCategory === category.id
                        ? "bg-giggsi-gold text-white border-giggsi-gold"
                        : "bg-card hover:bg-accent active:bg-accent"
                    )}
                  >
                    <h3 className="font-medium text-sm sm:text-base">{category.name_he}</h3>
                    <p className="text-xs sm:text-sm opacity-80 mt-1">
                      {allMenuItems.filter(item => item.category_id === category.id).length} פריטים
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items - Mobile optimized */}
            {selectedCategory && (
              <div>
                <h2 className="text-lg font-semibold mb-3">
                  {categories.find(c => c.id === selectedCategory)?.name_he}
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {menuItems
                    .filter(item => item.is_available !== false)
                    .map((item) => (
                      <Card
                        key={item.id}
                        className="active:scale-[0.98] transition-transform"
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-right text-sm sm:text-base">{item.name_he}</h3>
                              {item.description_he && (
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1 text-right line-clamp-2">
                                  {item.description_he}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end mr-3 sm:mr-4">
                              <span className="text-base sm:text-lg font-bold text-giggsi-gold">
                                ₪{item.price.toFixed(2)}
                              </span>
                              <Button
                                size="sm"
                                className="mt-2 h-9 px-4"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddToOrder(item.id)
                                }}
                              >
                                <Plus className="h-4 w-4 ml-1" />
                                הוסף
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Order Summary Sidebar - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <DesktopCart
              order={order}
              orderItems={orderItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveFromOrder}
              onNavigateToBill={handleNavigateToBill}
            />
          </div>
        </div>
      </div>

      {/* Mobile Cart - Fixed at bottom */}
      <MobileCart
        order={order}
        orderItems={orderItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromOrder}
        onNavigateToBill={handleNavigateToBill}
      />
    </div>
  )
}