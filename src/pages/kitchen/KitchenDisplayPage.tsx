import React, { useState, useEffect } from 'react'
import { DisplayLayout } from '@/components/kitchen-bar/DisplayLayout'
import { OrderCard } from '@/components/kitchen-bar/OrderCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import {
  getKitchenOrders,
  updateKitchenItemStatus,
  subscribeToKitchenOrders,
  type KitchenBarOrder
} from '@/lib/kitchenBarService'
import { groupOrdersByTable } from '@/lib/stationUtils'

export const KitchenDisplayPage: React.FC = () => {
  const [orders, setOrders] = useState<KitchenBarOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToKitchenOrders((newOrders) => {
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
      const data = await getKitchenOrders()
      setOrders(data)
      setError(null)
    } catch (err: any) {
      console.error('Error loading orders:', err)
      setError('שגיאה בטעינת הזמנות')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderReady = async (tableNumber: number) => {
    try {
      // Get all orders for this table
      const tableOrders = orders.filter(o => o.table_number === tableNumber)

      // Mark all as ready
      for (const order of tableOrders) {
        await updateKitchenItemStatus(order.id, 'ready')
      }

      // Reload orders to refresh display
      await loadOrders()

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
      <DisplayLayout title="מטבח" subtitle="הזמנות פעילות">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-giggsi-gold" />
        </div>
      </DisplayLayout>
    )
  }

  return (
    <DisplayLayout
      title="מטבח"
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
            <div className="text-6xl mb-4">👨‍🍳</div>
            <h2 className="text-2xl font-bold text-gray-400 mb-2">אין הזמנות פעילות</h2>
            <p className="text-gray-500">הזמנות חדשות יופיעו כאן אוטומטית</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
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
                onOrderReady={handleOrderReady}
              />
            ))}
        </div>
      )}
    </DisplayLayout>
  )
}