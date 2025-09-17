import React, { useState, useEffect } from 'react'
import { DisplayLayout } from '@/components/kitchen-bar/DisplayLayout'
import { OrderCard } from '@/components/kitchen-bar/OrderCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import {
  getBarOrders,
  updateBarItemStatus,
  subscribeToBarOrders,
  type KitchenBarOrder
} from '@/lib/kitchenBarService'
import { groupOrdersByTable, type DisplayStatus } from '@/lib/stationUtils'

export const BarDisplayPage: React.FC = () => {
  const [orders, setOrders] = useState<KitchenBarOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToBarOrders((newOrders) => {
      setOrders(newOrders)
    })

    // Refresh every 30 seconds as backup
    const interval = setInterval(loadOrders, 30000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadOrders = async () => {
    try {
      const data = await getBarOrders()
      setOrders(data)
      setError(null)
    } catch (err: any) {
      console.error('Error loading orders:', err)
      setError('שגיאה בטעינת הזמנות')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (itemId: string, status: DisplayStatus) => {
    try {
      await updateBarItemStatus(itemId, status)
      // Update local state immediately for better UX
      setOrders(prev =>
        prev.map(order =>
          order.id === itemId ? { ...order, status } : order
        )
      )
      // Reload to get fresh data
      await loadOrders()
    } catch (err: any) {
      console.error('Error updating status:', err)
      setError('שגיאה בעדכון סטטוס')
    }
  }

  const handleOrderReady = async (tableNumber: number) => {
    try {
      // Get all orders for this table
      const tableOrders = orders.filter(o => o.table_number === tableNumber)

      // Mark all as ready/archived
      for (const order of tableOrders) {
        await updateBarItemStatus(order.id, 'archived')
      }

      // Remove from display
      setOrders(prev => prev.filter(o => o.table_number !== tableNumber))

      // Show success message
      const audio = new Audio('/notification.mp3')
      audio.play().catch(() => {})
    } catch (err: any) {
      console.error('Error marking order ready:', err)
      setError('שגיאה בסימון הזמנה כמוכנה')
    }
  }

  // Group orders by table
  const ordersByTable = groupOrdersByTable(orders)

  if (loading) {
    return (
      <DisplayLayout title="בר" subtitle="הזמנות פעילות">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-giggsi-gold" />
        </div>
      </DisplayLayout>
    )
  }

  return (
    <DisplayLayout
      title="בר"
      subtitle={`${ordersByTable.size} שולחנות פעילים`}
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {ordersByTable.size === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🍺</div>
            <h2 className="text-2xl font-bold text-gray-400 mb-2">אין הזמנות פעילות</h2>
            <p className="text-gray-500">הזמנות חדשות יופיעו כאן אוטומטית</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from(ordersByTable.entries())
            .sort(([, a], [, b]) => {
              // Sort by earliest order creation time
              const aTime = Math.min(...a.map(o => new Date(o.created_at).getTime()))
              const bTime = Math.min(...b.map(o => new Date(o.created_at).getTime()))
              return aTime - bTime
            })
            .map(([tableNumber, tableOrders]) => (
              <OrderCard
                key={tableNumber}
                tableNumber={tableNumber}
                orders={tableOrders}
                onStatusChange={handleStatusChange}
                onOrderReady={handleOrderReady}
              />
            ))}
        </div>
      )}
    </DisplayLayout>
  )
}