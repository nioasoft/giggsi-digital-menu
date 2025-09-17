import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, ShoppingCart, Receipt, Plus, Minus, Trash2 } from 'lucide-react'
import {
  getTableByNumber,
  getOpenOrderByTable,
  createOrder,
  getOrderItems,
  updateOrderItem,
  removeOrderItem
} from '@/lib/waiterService'
import { getCurrentWaiter } from '@/lib/waiterAuth'
import { useMenuCategories, useMenuItems } from '@/hooks/useMenu'
import type { Table, Order, OrderItem, MenuItem, WaiterUser } from '@/lib/types'
import { MenuCard } from '@/components/menu/MenuCard'
import { CategoryTabs } from '@/components/menu/CategoryTabs'
import { ItemDetailModal } from '@/components/menu/ItemDetailModal'
import { cn } from '@/lib/utils'

export const TableOrderPage: React.FC = () => {
  const { tableNumber } = useParams<{ tableNumber: string }>()
  const navigate = useNavigate()

  const [table, setTable] = useState<Table | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [currentWaiter, setCurrentWaiter] = useState<WaiterUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [showCart, setShowCart] = useState(false)

  const { data: categories } = useMenuCategories()
  const { data: menuItems } = useMenuItems(selectedCategoryId || undefined)

  useEffect(() => {
    loadTableData()
  }, [tableNumber])

  useEffect(() => {
    if (order) {
      loadOrderItems()
    }
  }, [order])

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

  const handleCreateOrder = async () => {
    if (!table || !currentWaiter) return

    setLoading(true)
    try {
      const newOrder = await createOrder(table.id, currentWaiter.id)
      setOrder(newOrder)
      setOrderItems([])
      setTable({ ...table, status: 'occupied', current_order_id: newOrder.id })
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת הזמנה')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      await handleRemoveItem(itemId)
      return
    }

    try {
      await updateOrderItem(itemId, newQuantity)
      await loadOrderItems()
      await loadTableData() // Refresh order totals
    } catch (err: any) {
      setError(err.message || 'שגיאה בעדכון כמות')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeOrderItem(itemId)
      await loadOrderItems()
      await loadTableData() // Refresh order totals
    } catch (err: any) {
      setError(err.message || 'שגיאה במחיקת פריט')
    }
  }

  const navigateToBill = () => {
    navigate(`/waiter/table/${tableNumber}/bill`)
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
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/waiter/tables')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">שולחן {tableNumber}</h1>
                {currentWaiter && (
                  <p className="text-sm text-muted-foreground">
                    {currentWaiter.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {order && orderItems.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowCart(!showCart)}
                    className="relative"
                  >
                    <ShoppingCart className="h-4 w-4 ml-2" />
                    עגלה ({orderItems.length})
                    {order.total_amount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-giggsi-gold">
                        ₪{order.total_amount.toFixed(2)}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    onClick={navigateToBill}
                    className="gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    חשבון
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="container mx-auto px-4 py-4">
        {!order ? (
          // No order - show create button
          <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
              <CardTitle>פתיחת הזמנה חדשה</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                השולחן פנוי. לחץ כדי לפתוח הזמנה חדשה
              </p>
              <Button
                onClick={handleCreateOrder}
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'פתח הזמנה חדשה'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Menu Section */}
            <div className={cn(
              "lg:col-span-2",
              showCart && "hidden lg:block"
            )}>
              {/* Category Tabs */}
              {categories && (
                <CategoryTabs
                  categories={categories}
                  selectedCategoryId={selectedCategoryId || ''}
                  onCategorySelect={setSelectedCategoryId}
                />
              )}

              {/* Menu Items */}
              {selectedCategoryId && (
                <div className="space-y-3 mt-4">
                  {menuItems?.map((item) => (
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

              {!selectedCategoryId && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      בחר קטגוריה כדי להתחיל להוסיף פריטים להזמנה
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Cart Section */}
            {(showCart || window.innerWidth >= 1024) && (
              <div className="lg:col-span-1">
                <Card className="sticky top-20">
                  <CardHeader>
                    <CardTitle className="flex justify-between">
                      <span>הזמנה נוכחית</span>
                      <Badge>{orderItems.length} פריטים</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orderItems.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        העגלה ריקה
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {orderItems.map((item) => (
                          <div key={item.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-medium">
                                  {item.menu_item?.name_he || 'פריט'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  ₪{item.unit_price.toFixed(2)} ליחידה
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="font-semibold">
                                ₪{item.total_price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}

                        <div className="border-t pt-3 space-y-2">
                          <div className="flex justify-between">
                            <span>סכום ביניים:</span>
                            <span>₪{order.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>שירות (12.5%):</span>
                            <span>₪{order.service_charge.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg">
                            <span>סה"כ לתשלום:</span>
                            <span className="text-giggsi-gold">
                              ₪{order.total_amount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={navigateToBill}
                          className="w-full mt-4"
                        >
                          <Receipt className="h-4 w-4 ml-2" />
                          עבור לחשבון
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Detail Modal for adding to order */}
      <ItemDetailModal
        item={selectedItem}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedItem(null)
        }}
        // Add custom handler for waiter to add to order
        onAddToOrder={async (item, quantity, addons) => {
          if (!order) return

          try {
            const { addItemToOrder } = await import('@/lib/waiterService')
            await addItemToOrder(order.id, item.id, quantity, '', addons)
            await loadOrderItems()
            await loadTableData()
            setDetailModalOpen(false)
            setSelectedItem(null)
          } catch (err: any) {
            setError(err.message || 'שגיאה בהוספת פריט')
          }
        }}
      />
    </div>
  )
}