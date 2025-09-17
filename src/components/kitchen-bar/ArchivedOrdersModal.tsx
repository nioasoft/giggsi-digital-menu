import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock, X } from 'lucide-react'
import { getArchivedKitchenOrders, type KitchenBarOrder } from '@/lib/kitchenBarService'
import { groupOrdersByBatch } from '@/lib/stationUtils'

interface ArchivedOrdersModalProps {
  open: boolean
  onClose: () => void
}

export const ArchivedOrdersModal: React.FC<ArchivedOrdersModalProps> = ({ open, onClose }) => {
  const [orders, setOrders] = useState<KitchenBarOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadArchivedOrders()
    }
  }, [open])

  const loadArchivedOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getArchivedKitchenOrders()
      setOrders(data)
    } catch (err: any) {
      setError('שגיאה בטעינת הזמנות שנסגרו')
      console.error('Error loading archived orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const ordersByBatch = groupOrdersByBatch(orders)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-gray-900 text-white border-gray-700">
        <DialogHeader className="border-b border-gray-700 pb-4">
          <DialogTitle className="text-xl font-bold text-giggsi-gold flex items-center justify-between">
            <span>הזמנות שנסגרו (24 שעות אחרונות)</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
          <DialogDescription className="sr-only">
            רשימת הזמנות שהושלמו ב-24 השעות האחרונות
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(80vh-8rem)] p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">{error}</div>
          ) : ordersByBatch.size === 0 ? (
            <div className="text-center py-8 text-gray-400">
              אין הזמנות שנסגרו ב-24 השעות האחרונות
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(ordersByBatch.entries()).map(([batchKey, { tableNumber, orderId, batchNumber, items }]) => {
                const latestTime = items[0]?.ready_at
                return (
                  <div key={batchKey} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">שולחן {tableNumber}</h3>
                        <p className="text-xs text-gray-500">
                          הזמנה #{orderId?.slice(0, 8)}
                          {batchNumber && batchNumber > 1 && (
                            <Badge className="mr-2 bg-blue-600 text-white">
                              שליחה #{batchNumber}
                            </Badge>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>
                          הושלם {latestTime && new Date(latestTime).toLocaleTimeString('he-IL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {items.map((order) => (
                        <div key={order.id} className="flex items-start gap-3 text-sm">
                          <span className="text-gray-400 font-medium">{order.quantity}x</span>
                          <div className="flex-1">
                            <span className="text-white">{order.item_name}</span>
                            {order.cooking_preference && (
                              <Badge className="mr-2 bg-red-600 text-white text-xs">
                                {order.cooking_preference}
                              </Badge>
                            )}
                            {order.addons && order.addons.length > 0 && (
                              <div className="text-xs text-gray-400 mt-1">
                                תוספות: {order.addons.map((addon: any) =>
                                  addon.name_he || addon.name || 'תוספת'
                                ).join(', ')}
                              </div>
                            )}
                            {order.notes && (
                              <div className="text-xs text-gray-400 mt-1">
                                הערה: {order.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}