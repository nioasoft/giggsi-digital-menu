import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle } from 'lucide-react'
import { getElapsedTime } from '@/lib/stationUtils'
import type { KitchenBarOrder } from '@/lib/kitchenBarService'

interface OrderCardProps {
  tableNumber: number
  orders: KitchenBarOrder[]
  onOrderReady: (tableNumber: number) => void
}

export const OrderCard: React.FC<OrderCardProps> = ({
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

      <CardContent className="space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-3 bg-gray-700 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium text-white">
                {order.quantity}x
              </span>
              <span className="text-white">{order.item_name}</span>
            </div>
            {order.addons && order.addons.length > 0 && (
              <div className="text-sm text-blue-400 mt-1 mr-8">
                תוספות: {order.addons.map(addon => addon.name_he || addon.name || 'תוספת').join(', ')}
              </div>
            )}
            {order.notes && (
              <p className="text-sm text-gray-400 mt-1 mr-8">
                הערה: {order.notes}
              </p>
            )}
          </div>
        ))}

        {/* Ready button - always visible */}
        <Button
          className="w-full mt-4 bg-green-600 hover:bg-green-700"
          size="lg"
          onClick={() => onOrderReady(tableNumber)}
        >
          <CheckCircle className="h-5 w-5 ml-2" />
          הזמנה מוכנה
        </Button>
      </CardContent>
    </Card>
  )
}