import React, { useState, useEffect } from 'react'
import { DisplayLayout } from '@/components/kitchen-bar/DisplayLayout'
import { OrderCard } from '@/components/kitchen-bar/OrderCard'
import { ArchivedOrdersModal } from '@/components/kitchen-bar/ArchivedOrdersModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, History } from 'lucide-react'
import {
  getKitchenOrders,
  updateKitchenItemStatus,
  subscribeToKitchenOrders,
  type KitchenBarOrder
} from '@/lib/kitchenBarService'
import { groupOrdersByBatch } from '@/lib/stationUtils'

export const KitchenDisplayPage: React.FC = () => {
  const [orders, setOrders] = useState<KitchenBarOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showArchivedOrders, setShowArchivedOrders] = useState(false)

  useEffect(() => {
    loadOrders()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToKitchenOrders((newOrders) => {
      setOrders(newOrders)
    })

    // Refresh every 2 seconds for real-time updates
    const interval = setInterval(loadOrders, 2000)

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

  const handleOrderReady = async (batchKey: string) => {
    console.log('handleOrderReady called for batch:', batchKey)
    try {
      // Extract orderId and batchNumber from batchKey
      const [orderId, batchPart] = batchKey.split('_batch_')
      const batchNumber = parseInt(batchPart)
      console.log('Processing batch:', { orderId, batchNumber })

      // Get only items for this specific batch
      const batchItems = orders.filter(o =>
        o.order_id === orderId && o.batch_number === batchNumber
      )
      console.log('Found items for this batch:', batchItems)

      // Mark all items in this batch as archived
      for (const order of batchItems) {
        console.log('Updating order:', order.id, 'current status:', order.status)
        await updateKitchenItemStatus(order.id, 'archived')
        console.log('Order updated successfully:', order.id)
      }

      // Reload orders to refresh display
      console.log('Reloading orders...')
      await loadOrders()
      console.log('Orders reloaded')

      // Show success message
      const audio = new Audio('/notification.mp3')
      audio.play().catch(() => {})
    } catch (err: any) {
      console.error('Error marking order ready - Full error:', err)
      setError('שגיאה בסימון הזמנה כמוכנה')
    }
  }

  // Group orders by batch
  const ordersByBatch = groupOrdersByBatch(orders)

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
    <>
      <DisplayLayout
        title="מטבח"
        subtitle={`${ordersByBatch.size} הזמנות פעילות`}
        headerActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchivedOrders(true)}
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            <History className="h-4 w-4 ml-2" />
            הזמנות שנסגרו
          </Button>
        }
      >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {ordersByBatch.size === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">👨‍🍳</div>
            <h2 className="text-2xl font-bold text-gray-400 mb-2">אין הזמנות פעילות</h2>
            <p className="text-gray-500">הזמנות חדשות יופיעו כאן אוטומטית</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
          {Array.from(ordersByBatch.entries())
            .sort(([, a], [, b]) => {
              // Sort by earliest order creation time
              const aTime = Math.min(...a.items.map(o => new Date(o.created_at).getTime()))
              const bTime = Math.min(...b.items.map(o => new Date(o.created_at).getTime()))
              return aTime - bTime
            })
            .map(([batchKey, { tableNumber, orderId, batchNumber, items }]) => (
              <OrderCard
                key={batchKey}
                orderId={orderId}
                batchNumber={batchNumber}
                tableNumber={tableNumber}
                orders={items}
                onOrderReady={() => handleOrderReady(batchKey)}
              />
            ))}
        </div>
      )}
      </DisplayLayout>

      <ArchivedOrdersModal
        open={showArchivedOrders}
        onClose={() => setShowArchivedOrders(false)}
      />
    </>
  )
}