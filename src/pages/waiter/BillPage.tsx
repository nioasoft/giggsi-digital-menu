import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  ArrowLeft,
  Printer,
  CreditCard,
  DollarSign,
  Check,
  X
} from 'lucide-react'
import {
  getTableByNumber,
  getOrderWithDetails,
  markOrderAsPaid,
  closeOrder,
  cancelOrder
} from '@/lib/waiterService'
import type { OrderWithDetails } from '@/lib/waiterService'

export const BillPage: React.FC = () => {
  const { tableNumber } = useParams<{ tableNumber: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBillData()
  }, [tableNumber])

  const loadBillData = async () => {
    if (!tableNumber) return

    setLoading(true)
    try {
      const table = await getTableByNumber(parseInt(tableNumber))
      if (!table || !table.current_order_id) {
        setError('לא נמצאה הזמנה פעילה לשולחן זה')
        return
      }

      const orderDetails = await getOrderWithDetails(table.current_order_id)
      if (!orderDetails) {
        setError('לא ניתן לטעון את פרטי ההזמנה')
        return
      }

      setOrder(orderDetails)
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת החשבון')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (method: string) => {
    if (!order) return

    setProcessing(true)
    try {
      await markOrderAsPaid(order.id, method)
      alert('התשלום התקבל בהצלחה!')
      navigate('/waiter/tables')
    } catch (err: any) {
      setError(err.message || 'שגיאה בעיבוד התשלום')
    } finally {
      setProcessing(false)
    }
  }

  const handleCloseWithoutPayment = async () => {
    if (!order) return

    if (!confirm('האם אתה בטוח שברצונך לסגור את ההזמנה ללא תשלום?')) return

    setProcessing(true)
    try {
      await closeOrder(order.id)
      navigate('/waiter/tables')
    } catch (err: any) {
      setError(err.message || 'שגיאה בסגירת ההזמנה')
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return

    if (!confirm('האם אתה בטוח שברצונך לבטל את ההזמנה? פעולה זו אינה ניתנת לביטול.')) return

    setProcessing(true)
    try {
      await cancelOrder(order.id)
      alert('ההזמנה בוטלה')
      navigate('/waiter/tables')
    } catch (err: any) {
      setError(err.message || 'שגיאה בביטול ההזמנה')
    } finally {
      setProcessing(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Card>
          <CardContent className="py-8">
            <p className="text-destructive">{error || 'לא נמצאה הזמנה'}</p>
            <Button
              onClick={() => navigate('/waiter/tables')}
              className="mt-4"
            >
              חזרה לשולחנות
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background print:bg-white" dir="rtl">
      {/* Header - Hide on print */}
      <header className="border-b sticky top-0 bg-background z-10 print:hidden text-right">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/waiter/table/${tableNumber}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">חשבון - שולחן {tableNumber}</h1>
            </div>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              הדפס
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="m-4 print:hidden">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="container mx-auto px-4 py-6 max-w-2xl text-right">
        {/* Bill Card */}
        <Card className="print:shadow-none">
          <CardHeader className="text-center border-b">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-giggsi-gold">Giggsi Sports Bar</h1>
              <p className="text-sm text-muted-foreground">חשבונית מס׳ {order.id.slice(0, 8)}</p>
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <span className="font-medium">שולחן:</span> {order.table.table_number}
              </div>
              <div>
                <span className="font-medium">מלצר:</span> {order.waiter_name}
              </div>
              <div>
                <span className="font-medium">תאריך:</span> {new Date(order.created_at).toLocaleDateString('he-IL')}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Items List */}
            <div className="space-y-2 mb-6">
              <h3 className="font-semibold mb-3">פירוט הזמנה:</h3>
              {order.items.map((item, index) => (
                <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-muted-foreground">{index + 1}.</span>
                      <div>
                        <p className="font-medium">{item.menu_item?.name_he || 'פריט'}</p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">{item.notes}</p>
                        )}
                        {item.addons && item.addons.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            תוספות: {item.addons.map(a => a.name_he).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {item.quantity} × ₪{item.unit_price.toFixed(2)}
                      </span>
                      <span className="font-medium">₪{item.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-lg">
                <span>סכום ביניים:</span>
                <span>₪{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>דמי שירות (12.5%):</span>
                <span>₪{order.service_charge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>סה"כ לתשלום:</span>
                <span className="text-giggsi-gold">₪{Math.ceil(order.total_amount)}</span>
              </div>
            </div>

            {/* Payment Status */}
            {order.paid && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                <Badge className="bg-green-500 text-white">
                  <Check className="h-4 w-4 mr-1" />
                  שולם
                </Badge>
                {order.payment_method && (
                  <p className="text-sm mt-2">אמצעי תשלום: {order.payment_method}</p>
                )}
              </div>
            )}

            {/* Payment Actions - Hide on print */}
            {!order.paid && (
              <div className="mt-6 space-y-4 print:hidden">
                <h3 className="font-semibold">אמצעי תשלום:</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handlePayment('cash')}
                    disabled={processing}
                    className="gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    מזומן
                  </Button>
                  <Button
                    onClick={() => handlePayment('credit')}
                    disabled={processing}
                    className="gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    אשראי
                  </Button>
                </div>

                <div className="border-t pt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCloseWithoutPayment}
                    disabled={processing}
                    className="flex-1"
                  >
                    סגור ללא תשלום
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelOrder}
                    disabled={processing}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    בטל הזמנה
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer - Show on print */}
        <div className="hidden print:block mt-8 text-center text-sm text-muted-foreground">
          <p>תודה על ביקורכם!</p>
          <p>Giggsi Sports Bar • Beer Sheva</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 20mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}