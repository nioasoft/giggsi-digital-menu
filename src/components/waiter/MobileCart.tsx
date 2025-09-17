import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, X, Plus, Minus, Trash2, Receipt, Send, CheckCircle } from 'lucide-react'
import type { Order, OrderItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatAddonsDisplay } from '@/lib/priceUtils'
import { sendItemsToKitchen } from '@/lib/waiterService'

interface MobileCartProps {
  order: Order | null
  orderItems: OrderItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>
  onRemoveItem: (itemId: string) => Promise<void>
  onNavigateToBill: () => void
  onItemsSent?: () => Promise<void>
  className?: string
}

export const MobileCart: React.FC<MobileCartProps> = ({
  order,
  orderItems,
  onUpdateQuantity,
  onRemoveItem,
  onNavigateToBill,
  onItemsSent,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sending, setSending] = useState(false)

  if (!order || orderItems.length === 0) {
    return null
  }

  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0)
  const unsentItems = orderItems.filter(item => !item.sent_to_kitchen)
  const hasUnsentItems = unsentItems.length > 0

  const handleSendToKitchen = async () => {
    if (!hasUnsentItems) return

    setSending(true)
    try {
      const unsentItemIds = unsentItems.map(item => item.id)
      await sendItemsToKitchen(unsentItemIds)
      if (onItemsSent) {
        await onItemsSent()
      }
    } catch (error) {
      console.error('Error sending items to kitchen:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Cart Toggle Button - Always visible on mobile */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-30 lg:hidden",
        "bg-background border-t shadow-lg",
        className
      )}>
        {!isExpanded ? (
          // Collapsed state - show summary bar
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full p-4 flex items-center justify-between text-right"
          >
            <div className="flex items-center gap-3">
              <Badge className="bg-giggsi-gold text-white">
                {itemCount} פריטים
              </Badge>
              {hasUnsentItems && (
                <Badge className="bg-orange-500 text-white animate-pulse">
                  {unsentItems.length} לא נשלח
                </Badge>
              )}
              <span className="font-semibold">
                ₪{Math.ceil(order.total_amount)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">הצג עגלה</span>
              <ShoppingCart className="h-5 w-5" />
            </div>
          </button>
        ) : (
          // Expanded state - show full cart
          <div className="max-h-[70vh] overflow-hidden flex flex-col">
            {/* Cart Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                עגלת הזמנה
              </h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {orderItems.map((item) => (
                <Card key={item.id} className={cn(
                  "p-3",
                  !item.sent_to_kitchen && "border-orange-500"
                )}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {item.menu_item?.name_he || 'פריט'}
                        </p>
                        {item.sent_to_kitchen ? (
                          <Badge className="bg-green-500 text-white text-xs">
                            <CheckCircle className="h-3 w-3 ml-1" />
                            נשלח
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-500 text-white text-xs">
                            ממתין
                          </Badge>
                        )}
                      </div>
                      {item.addons && item.addons.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatAddonsDisplay(item.addons, 'he', true)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        ₪{item.unit_price.toFixed(2)} ליחידה
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-semibold text-sm">
                      ₪{item.total_price.toFixed(2)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Cart Footer with Totals */}
            <div className="border-t p-4 space-y-3 bg-background">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>סכום ביניים:</span>
                  <span>₪{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>שירות (12.5%):</span>
                  <span>₪{order.service_charge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>סה"כ לתשלום:</span>
                  <span className="text-giggsi-gold">
                    ₪{Math.ceil(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Send to Kitchen button - shows when there are unsent items */}
              {hasUnsentItems && (
                <Button
                  onClick={handleSendToKitchen}
                  disabled={sending}
                  className="w-full h-12 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span className="mr-2">שולח...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 ml-2" />
                      שלח למטבח/בר ({unsentItems.length} פריטים)
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={onNavigateToBill}
                className="w-full h-12"
                size="lg"
                variant={hasUnsentItems ? "outline" : "default"}
              >
                <Receipt className="h-5 w-5 ml-2" />
                סגירת חשבון
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Desktop Cart Component - for larger screens
export const DesktopCart: React.FC<{
  order: Order | null
  orderItems: OrderItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>
  onRemoveItem: (itemId: string) => Promise<void>
  onNavigateToBill: () => void
  onItemsSent?: () => Promise<void>
}> = ({
  order,
  orderItems,
  onUpdateQuantity,
  onRemoveItem,
  onNavigateToBill,
  onItemsSent
}) => {
  const [sending, setSending] = useState(false)

  if (!order) return null

  const unsentItems = orderItems.filter(item => !item.sent_to_kitchen)
  const hasUnsentItems = unsentItems.length > 0

  const handleSendToKitchen = async () => {
    if (!hasUnsentItems) return

    setSending(true)
    try {
      const unsentItemIds = unsentItems.map(item => item.id)
      await sendItemsToKitchen(unsentItemIds)
      if (onItemsSent) {
        await onItemsSent()
      }
    } catch (error) {
      console.error('Error sending items to kitchen:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="sticky top-20">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center justify-between">
          <span>הזמנה נוכחית</span>
          <div className="flex items-center gap-2">
            <Badge>{orderItems.length} פריטים</Badge>
            {hasUnsentItems && (
              <Badge className="bg-orange-500 text-white animate-pulse">
                {unsentItems.length} לא נשלח
              </Badge>
            )}
          </div>
        </h3>
      </div>
      <div className="p-4">
        {orderItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            העגלה ריקה
          </p>
        ) : (
          <div className="space-y-3">
            {/* Items list */}
            <div className="max-h-[400px] overflow-y-auto space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className={cn(
                  "border rounded-lg p-3",
                  !item.sent_to_kitchen && "border-orange-500"
                )}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {item.menu_item?.name_he || 'פריט'}
                        </p>
                        {item.sent_to_kitchen ? (
                          <Badge className="bg-green-500 text-white text-xs">
                            <CheckCircle className="h-3 w-3 ml-1" />
                            נשלח
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-500 text-white text-xs">
                            ממתין
                          </Badge>
                        )}
                      </div>
                      {item.addons && item.addons.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatAddonsDisplay(item.addons, 'he', true)}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        ₪{item.unit_price.toFixed(2)} ליחידה
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
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
            </div>

            {/* Totals */}
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
                  ₪{Math.ceil(order.total_amount)}
                </span>
              </div>
            </div>

            {/* Send to Kitchen button - shows when there are unsent items */}
            {hasUnsentItems && (
              <Button
                onClick={handleSendToKitchen}
                disabled={sending}
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {sending ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span className="mr-2">שולח...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 ml-2" />
                    שלח למטבח/בר ({unsentItems.length} פריטים)
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={onNavigateToBill}
              className="w-full mt-4"
              size="lg"
              variant={hasUnsentItems ? "outline" : "default"}
            >
              <Receipt className="h-4 w-4 ml-2" />
              סגירת חשבון
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}