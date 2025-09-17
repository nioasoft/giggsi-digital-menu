import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle } from 'lucide-react'
import { getElapsedTime, getStatusColor, formatDisplayStatus } from '@/lib/stationUtils'
import type { KitchenBarOrder } from '@/lib/kitchenBarService'
import type { DisplayStatus } from '@/lib/stationUtils'

interface OrderCardProps {
  tableNumber: number
  orders: KitchenBarOrder[]
  onStatusChange: (orderId: string, status: DisplayStatus) => void
  onOrderReady: (tableNumber: number) => void
}

export const OrderCard: React.FC<OrderCardProps> = ({
  tableNumber,
  orders,
  onStatusChange,
  onOrderReady
}) => {
  // Calculate overall status
  const allInProgress = orders.every(o => o.status === 'in_progress')
  const hasInProgress = orders.some(o => o.status === 'in_progress')
  const hasPending = orders.some(o => o.status === 'pending')

  // Get earliest creation time
  const earliestOrder = orders.reduce((earliest, current) => {
    return new Date(current.created_at) < new Date(earliest.created_at) ? current : earliest
  }, orders[0])

  const elapsedTime = getElapsedTime(earliestOrder.created_at)

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-giggsi-gold transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-white">שולחן {tableNumber}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">{elapsedTime}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {hasPending && !hasInProgress && (
              <Badge className="bg-yellow-500">ממתין</Badge>
            )}
            {hasInProgress && !allInProgress && (
              <Badge className="bg-blue-500">בהכנה</Badge>
            )}
            {allInProgress && (
              <Badge className="bg-green-500">כמעט מוכן</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex justify-between items-center p-3 bg-gray-700 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium text-white">
                  {order.quantity}x
                </span>
                <span className="text-white">{order.item_name}</span>
              </div>
              {order.notes && (
                <p className="text-sm text-gray-400 mt-1 mr-8">
                  הערה: {order.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(order.status)} text-white`}>
                {formatDisplayStatus(order.status)}
              </Badge>

              {order.status === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(order.id, 'in_progress')}
                  className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
                >
                  התחל
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Ready button - shows when all items are in progress */}
        {allInProgress && (
          <Button
            className="w-full mt-4 bg-green-600 hover:bg-green-700"
            size="lg"
            onClick={() => onOrderReady(tableNumber)}
          >
            <CheckCircle className="h-5 w-5 ml-2" />
            הזמנה מוכנה
          </Button>
        )}

        {/* Start all button - shows when there are pending items */}
        {hasPending && !hasInProgress && (
          <Button
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
            size="lg"
            onClick={() => {
              orders.forEach(order => {
                if (order.status === 'pending') {
                  onStatusChange(order.id, 'in_progress')
                }
              })
            }}
          >
            התחל הכנה
          </Button>
        )}
      </CardContent>
    </Card>
  )
}