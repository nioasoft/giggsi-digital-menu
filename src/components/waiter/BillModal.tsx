import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'
import { getOrderWithDetails, type OrderWithDetails } from '@/lib/waiterService'
import type { Table } from '@/lib/types'

interface BillModalProps {
  open: boolean
  onClose: () => void
  table: Table | null
}

export const BillModal: React.FC<BillModalProps> = ({ open, onClose, table }) => {
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && table?.current_order_id) {
      loadOrderData()
    }
  }, [open, table])

  const loadOrderData = async () => {
    if (!table?.current_order_id) return

    setLoading(true)
    setError(null)
    try {
      const orderDetails = await getOrderWithDetails(table.current_order_id)
      setOrder(orderDetails)
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת החשבון')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setOrder(null)
    setError(null)
    onClose()
  }

  if (!table) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>חשבון - שולחן {table.table_number}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-4 text-red-500">
              {error}
            </div>
          )}

          {order && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="border-b pb-3 text-sm">
                <div className="flex justify-between">
                  <span>מלצר: {order.waiter_name}</span>
                  <span>{new Date(order.created_at).toLocaleDateString('he-IL')}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">פריטים:</h4>
                {order.items.map((item, index) => (
                  <div key={item.id} className="border-b pb-2 last:border-b-0">
                    <div className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium">
                          {index + 1}. {item.menu_item?.name_he || 'פריט'}
                        </div>
                        {item.notes && (
                          <div className="text-gray-600 text-xs mt-1">
                            {item.notes}
                          </div>
                        )}
                        {item.addons && item.addons.length > 0 && (
                          <div className="text-gray-600 text-xs mt-1">
                            {item.addons.map((addon, idx) => (
                              <div key={idx}>
                                • {addon.name_he || 'תוספת'}
                                {addon.price > 0 && ` (+₪${addon.price})`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-gray-500">
                          {item.quantity} × ₪{item.unit_price.toFixed(2)}
                        </div>
                        <div className="font-medium">₪{item.total_price.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>סכום ביניים:</span>
                  <span>₪{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>דמי שירות (12.5%):</span>
                  <span>₪{order.service_charge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>סה"כ:</span>
                  <span className="text-giggsi-gold">₪{Math.ceil(order.total_amount)}</span>
                </div>
              </div>

              {/* Payment Status */}
              {order.paid && (
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded text-center">
                  <div className="text-green-700 dark:text-green-300 font-medium">✓ שולם</div>
                  {order.payment_method && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {order.payment_method}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}