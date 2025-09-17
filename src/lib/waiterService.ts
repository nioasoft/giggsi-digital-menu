import { supabase } from './supabase'
import type { Table, Order, OrderItem, MenuItem, AddOn } from './types'

const SERVICE_CHARGE_RATE = 0.125 // 12.5%

// Table management
export async function getAllTables(): Promise<Table[]> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('table_number', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getTableById(tableId: string): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .single()

  if (error) throw error
  return data
}

export async function getTableByNumber(tableNumber: number): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('table_number', tableNumber)
    .single()

  if (error) throw error
  return data
}

export async function updateTableStatus(
  tableId: string,
  status: 'available' | 'occupied' | 'reserved' | 'cleaning',
  orderId?: string
) {
  const { error } = await supabase
    .from('tables')
    .update({
      status,
      current_order_id: orderId || null
    })
    .eq('id', tableId)

  if (error) throw error
}

// Order management
export async function createOrder(tableId: string, waiterId: string): Promise<Order> {
  // First check if table is available
  const table = await getTableById(tableId)
  if (!table) throw new Error('Table not found')
  if (table.status !== 'available') throw new Error('Table is not available')

  // Create new order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_id: tableId,
      waiter_id: waiterId,
      status: 'open',
      subtotal: 0,
      service_charge: 0,
      total_amount: 0,
      paid: false
    })
    .select()
    .single()

  if (orderError) throw orderError

  // Update table status
  await updateTableStatus(tableId, 'occupied', order.id)

  return order
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error) throw error
  return data
}

export async function getOpenOrderByTable(tableId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('table_id', tableId)
    .eq('status', 'open')
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      *,
      menu_item:menu_items(*)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function addItemToOrder(
  orderId: string,
  menuItemId: string,
  quantity: number,
  notes?: string,
  addons?: AddOn[]
): Promise<OrderItem> {
  // Get menu item details
  const { data: menuItem, error: menuError } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', menuItemId)
    .single()

  if (menuError) throw menuError

  // Calculate price with addons
  const addonsPrice = addons?.reduce((sum, addon) => sum + addon.price, 0) || 0
  const unitPrice = menuItem.price + addonsPrice
  const totalPrice = unitPrice * quantity

  // Add item to order
  const { data: orderItem, error: itemError } = await supabase
    .from('order_items')
    .insert({
      order_id: orderId,
      menu_item_id: menuItemId,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      notes,
      addons: addons || null
    })
    .select()
    .single()

  if (itemError) throw itemError

  // Update order totals
  await updateOrderTotals(orderId)

  return orderItem
}

export async function updateOrderItem(
  itemId: string,
  quantity: number
): Promise<void> {
  // Get current item
  const { data: item, error: fetchError } = await supabase
    .from('order_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (fetchError) throw fetchError

  // Update quantity and total price
  const totalPrice = item.unit_price * quantity
  const { error: updateError } = await supabase
    .from('order_items')
    .update({
      quantity,
      total_price: totalPrice
    })
    .eq('id', itemId)

  if (updateError) throw updateError

  // Update order totals
  await updateOrderTotals(item.order_id)
}

export async function removeOrderItem(itemId: string): Promise<void> {
  // Get item details first
  const { data: item, error: fetchError } = await supabase
    .from('order_items')
    .select('order_id')
    .eq('id', itemId)
    .single()

  if (fetchError) throw fetchError

  // Delete item
  const { error: deleteError } = await supabase
    .from('order_items')
    .delete()
    .eq('id', itemId)

  if (deleteError) throw deleteError

  // Update order totals
  await updateOrderTotals(item.order_id)
}

async function updateOrderTotals(orderId: string): Promise<void> {
  // Get all items
  const items = await getOrderItems(orderId)

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)

  // Calculate service charge
  const serviceCharge = subtotal * SERVICE_CHARGE_RATE

  // Calculate total
  const totalAmount = subtotal + serviceCharge

  // Update order
  const { error } = await supabase
    .from('orders')
    .update({
      subtotal,
      service_charge: serviceCharge,
      total_amount: totalAmount
    })
    .eq('id', orderId)

  if (error) throw error
}

export async function markOrderAsPaid(
  orderId: string,
  paymentMethod: string = 'cash'
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      paid: true,
      payment_method: paymentMethod,
      status: 'closed',
      closed_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (error) throw error

  // Get order details to update table
  const order = await getOrderById(orderId)
  if (order) {
    await updateTableStatus(order.table_id, 'available')
  }
}

export async function closeOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (error) throw error

  // Get order details to update table
  const order = await getOrderById(orderId)
  if (order) {
    await updateTableStatus(order.table_id, 'available')
  }
}

export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      closed_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (error) throw error

  // Get order details to update table
  const order = await getOrderById(orderId)
  if (order) {
    await updateTableStatus(order.table_id, 'available')
  }
}

// Get order with all details for bill
export interface OrderWithDetails extends Order {
  table: Table
  items: OrderItem[]
  waiter_name: string
}

export async function getOrderWithDetails(orderId: string): Promise<OrderWithDetails | null> {
  // Get order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(*),
      waiter:waiter_users(name)
    `)
    .eq('id', orderId)
    .single()

  if (orderError) throw orderError
  if (!order) return null

  // Get items
  const items = await getOrderItems(orderId)

  return {
    ...order,
    items,
    waiter_name: order.waiter?.name || 'Unknown'
  }
}

// Get all open orders for waiter dashboard
export async function getOpenOrders(waiterId?: string) {
  let query = supabase
    .from('order_summary')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (waiterId) {
    query = query.eq('waiter_id', waiterId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// Calculate service charge
export function calculateServiceCharge(subtotal: number): number {
  return subtotal * SERVICE_CHARGE_RATE
}

export function calculateTotal(subtotal: number): number {
  return subtotal + calculateServiceCharge(subtotal)
}