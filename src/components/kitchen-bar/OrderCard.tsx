import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle } from 'lucide-react'
import { getElapsedTime } from '@/lib/stationUtils'
import type { KitchenBarOrder } from '@/lib/kitchenBarService'

interface OrderCardProps {
  orderId?: string
  batchNumber?: number
  tableNumber: number
  orders: KitchenBarOrder[]
  onOrderReady: () => void
}

export const OrderCard: React.FC<OrderCardProps> = ({
  orderId,
  batchNumber,
  tableNumber,
  orders,
  onOrderReady
}) => {
  // Get earliest sent time (or creation time as fallback)
  const earliestOrder = orders.reduce((earliest, current) => {
    const currentTime = current.sent_to_kitchen_at || current.created_at
    const earliestTime = earliest.sent_to_kitchen_at || earliest.created_at
    return new Date(currentTime) < new Date(earliestTime) ? current : earliest
  }, orders[0])

  const timeToUse = earliestOrder.sent_to_kitchen_at || earliestOrder.created_at
  const elapsedTime = getElapsedTime(timeToUse)

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-giggsi-gold transition-colors w-80 flex-shrink-0">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-white">שולחן {tableNumber}</h3>
            {orderId && (
              <p className="text-xs text-gray-500 mt-0.5">
                הזמנה #{orderId.slice(0, 8)}
                {batchNumber && batchNumber > 1 && (
                  <span className="mr-2 bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs">
                    שליחה #{batchNumber}
                  </span>
                )}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">{elapsedTime}</span>
              {earliestOrder.sent_to_kitchen_at && (
                <span className="text-xs text-gray-500">
                  (נשלח {new Date(earliestOrder.sent_to_kitchen_at).toLocaleTimeString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })})
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-1.5">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-2 bg-gray-700 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium text-white">
                {order.quantity}x
              </span>
              <span className="text-white">{order.item_name}</span>
              {order.cooking_preference && (
                <span className="mr-2 px-2 py-0.5 bg-red-600 text-white text-sm font-bold rounded">
                  {order.cooking_preference}
                </span>
              )}
            </div>
            {order.addons && order.addons.length > 0 && (
              <div className="mt-0.5 mr-8">
                <div className="text-xs text-gray-400">תוספות:</div>
                <div className="mr-3">
                  {order.addons.map((addon, idx) => (
                    <div key={idx} className="text-xs text-blue-400">
                      • {addon.name_he || addon.name || 'תוספת'}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {order.notes && (
              <p className="text-xs text-gray-400 mt-0.5 mr-8">
                הערה: {order.notes}
              </p>
            )}
          </div>
        ))}

        {/* Ready button - always visible */}
        <Button
          className="w-full mt-4 bg-green-600 hover:bg-green-700"
          size="lg"
          onClick={onOrderReady}
        >
          <CheckCircle className="h-5 w-5 ml-2" />
          הזמנה מוכנה
        </Button>
      </CardContent>
    </Card>
  )
}