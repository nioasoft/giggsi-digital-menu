import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Table, Order, OrderItem, MenuItem, AddOn, WaiterUser } from '@/lib/types'
import * as waiterService from '@/lib/waiterService'
import { getCurrentWaiter } from '@/lib/waiterAuth'

interface WaiterOrderContextType {
  currentWaiter: WaiterUser | null
  currentTable: Table | null
  currentOrder: Order | null
  orderItems: OrderItem[]
  loading: boolean
  error: string | null

  // Actions
  selectTable: (table: Table) => Promise<void>
  createNewOrder: () => Promise<void>
  addItemToCart: (menuItem: MenuItem, quantity: number, notes?: string, addons?: AddOn[]) => Promise<void>
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearTable: () => void
  refreshOrder: () => Promise<void>
  markAsPaid: (paymentMethod?: string) => Promise<void>
  closeOrder: () => Promise<void>

  // Calculations
  getSubtotal: () => number
  getServiceCharge: () => number
  getTotal: () => number
}

const WaiterOrderContext = createContext<WaiterOrderContextType | undefined>(undefined)

export function useWaiterOrder() {
  const context = useContext(WaiterOrderContext)
  if (!context) {
    throw new Error('useWaiterOrder must be used within a WaiterOrderProvider')
  }
  return context
}

interface WaiterOrderProviderProps {
  children: ReactNode
}

export function WaiterOrderProvider({ children }: WaiterOrderProviderProps) {
  const [currentWaiter, setCurrentWaiter] = useState<WaiterUser | null>(null)
  const [currentTable, setCurrentTable] = useState<Table | null>(null)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load current waiter on mount
  useEffect(() => {
    loadCurrentWaiter()
  }, [])

  const loadCurrentWaiter = async () => {
    try {
      const waiter = await getCurrentWaiter()
      setCurrentWaiter(waiter)
    } catch (err) {
      console.error('Failed to load waiter:', err)
    }
  }

  const selectTable = async (table: Table) => {
    setLoading(true)
    setError(null)

    try {
      setCurrentTable(table)

      // Check if table has an open order
      if (table.current_order_id) {
        const order = await waiterService.getOrderById(table.current_order_id)
        if (order && order.status === 'open') {
          setCurrentOrder(order)
          const items = await waiterService.getOrderItems(order.id)
          setOrderItems(items)
        }
      } else {
        setCurrentOrder(null)
        setOrderItems([])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load table')
    } finally {
      setLoading(false)
    }
  }

  const createNewOrder = async () => {
    if (!currentTable || !currentWaiter) {
      setError('No table or waiter selected')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const order = await waiterService.createOrder(currentTable.id, currentWaiter.id)
      setCurrentOrder(order)
      setOrderItems([])

      // Update table status locally
      setCurrentTable({
        ...currentTable,
        status: 'occupied',
        current_order_id: order.id
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const addItemToCart = async (
    menuItem: MenuItem,
    quantity: number,
    notes?: string,
    addons?: AddOn[]
  ) => {
    if (!currentOrder) {
      setError('No active order')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const newItem = await waiterService.addItemToOrder(
        currentOrder.id,
        menuItem.id,
        quantity,
        notes,
        addons
      )

      // Add menu item details to the new item
      newItem.menu_item = menuItem

      setOrderItems([...orderItems, newItem])

      // Refresh order to get updated totals
      await refreshOrder()
    } catch (err: any) {
      setError(err.message || 'Failed to add item')
    } finally {
      setLoading(false)
    }
  }

  const updateItemQuantity = async (itemId: string, quantity: number) => {
    setLoading(true)
    setError(null)

    try {
      if (quantity === 0) {
        await removeItem(itemId)
        return
      }

      await waiterService.updateOrderItem(itemId, quantity)

      // Update local state
      setOrderItems(orderItems.map(item =>
        item.id === itemId
          ? { ...item, quantity, total_price: item.unit_price * quantity }
          : item
      ))

      // Refresh order to get updated totals
      await refreshOrder()
    } catch (err: any) {
      setError(err.message || 'Failed to update item quantity')
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (itemId: string) => {
    setLoading(true)
    setError(null)

    try {
      await waiterService.removeOrderItem(itemId)
      setOrderItems(orderItems.filter(item => item.id !== itemId))

      // Refresh order to get updated totals
      await refreshOrder()
    } catch (err: any) {
      setError(err.message || 'Failed to remove item')
    } finally {
      setLoading(false)
    }
  }

  const refreshOrder = async () => {
    if (!currentOrder) return

    try {
      const order = await waiterService.getOrderById(currentOrder.id)
      if (order) {
        setCurrentOrder(order)
      }
    } catch (err) {
      console.error('Failed to refresh order:', err)
    }
  }

  const markAsPaid = async (paymentMethod: string = 'cash') => {
    if (!currentOrder) {
      setError('No active order')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await waiterService.markOrderAsPaid(currentOrder.id, paymentMethod)

      // Clear current state
      clearTable()
    } catch (err: any) {
      setError(err.message || 'Failed to mark as paid')
    } finally {
      setLoading(false)
    }
  }

  const closeOrder = async () => {
    if (!currentOrder) {
      setError('No active order')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await waiterService.closeOrder(currentOrder.id)

      // Clear current state
      clearTable()
    } catch (err: any) {
      setError(err.message || 'Failed to close order')
    } finally {
      setLoading(false)
    }
  }

  const clearTable = () => {
    setCurrentTable(null)
    setCurrentOrder(null)
    setOrderItems([])
    setError(null)
  }

  const getSubtotal = () => {
    return currentOrder?.subtotal || 0
  }

  const getServiceCharge = () => {
    return currentOrder?.service_charge || 0
  }

  const getTotal = () => {
    return currentOrder?.total_amount || 0
  }

  const value: WaiterOrderContextType = {
    currentWaiter,
    currentTable,
    currentOrder,
    orderItems,
    loading,
    error,
    selectTable,
    createNewOrder,
    addItemToCart,
    updateItemQuantity,
    removeItem,
    clearTable,
    refreshOrder,
    markAsPaid,
    closeOrder,
    getSubtotal,
    getServiceCharge,
    getTotal
  }

  return (
    <WaiterOrderContext.Provider value={value}>
      {children}
    </WaiterOrderContext.Provider>
  )
}