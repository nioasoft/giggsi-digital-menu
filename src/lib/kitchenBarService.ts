import { supabase } from './supabase'
import type { DisplayStatus } from './stationUtils'

export interface KitchenBarOrder {
  id: string
  order_id: string
  quantity: number
  notes: string | null
  addons: any[] | null  // Array of addon objects from the view
  batch_number: number  // Batch number for grouping
  cooking_preference?: string | null  // Cooking preference for grill/burger items
  status: DisplayStatus
  created_at: string
  sent_to_kitchen_at: string | null  // Exact time when sent to kitchen
  started_at: string | null
  ready_at: string | null
  item_name: string
  item_name_en: string
  table_number: number
  waiter_name: string | null
}

// Get kitchen orders
export async function getKitchenOrders(): Promise<KitchenBarOrder[]> {
  const { data, error } = await supabase
    .from('kitchen_orders')
    .select('*')
    .order('created_at', { ascending: true })

  console.log('Kitchen orders from DB:', data)
  if (error) {
    console.error('Error fetching kitchen orders:', error)
    throw error
  }
  return data || []
}

// Get archived kitchen orders (last 24 hours)
export async function getArchivedKitchenOrders(): Promise<KitchenBarOrder[]> {
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  // First get the archived items with basic info
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select(`
      id,
      order_id,
      quantity,
      notes,
      addons,
      batch_number,
      cooking_preference,
      sent_to_kitchen_at,
      created_at,
      kitchen_ready_at,
      menu_items!inner(name_he)
    `)
    .eq('kitchen_status', 'archived')
    .gte('kitchen_ready_at', twentyFourHoursAgo.toISOString())
    .order('kitchen_ready_at', { ascending: false })
    .limit(100)

  if (itemsError) {
    console.error('Error fetching archived orders:', itemsError)
    throw itemsError
  }

  if (!items || items.length === 0) {
    return []
  }

  // Get unique order IDs
  const orderIds = [...new Set(items.map(item => item.order_id))]

  // Fetch orders to get table_id
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, table_id')
    .in('id', orderIds)

  if (ordersError) {
    console.error('Error fetching order details:', ordersError)
    throw ordersError
  }

  if (!orders || orders.length === 0) {
    // If no orders found, return items with table_number 0
    const transformedData = items.map((item: any) => ({
      id: item.id,
      order_id: item.order_id,
      quantity: item.quantity,
      notes: item.notes,
      addons: item.addons,
      batch_number: item.batch_number,
      cooking_preference: item.cooking_preference,
      status: 'archived' as DisplayStatus,
      created_at: item.created_at,
      sent_to_kitchen_at: item.sent_to_kitchen_at,
      started_at: null,
      ready_at: item.kitchen_ready_at,
      item_name: item.menu_items?.name_he || '',
      item_name_en: '',
      table_number: 0,
      waiter_name: null
    }))
    return transformedData
  }

  // Get unique table IDs
  const tableIds = [...new Set(orders.map(order => order.table_id).filter(Boolean))]

  // Fetch tables
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('id, table_number')
    .in('id', tableIds)

  if (tablesError) {
    console.error('Error fetching table details:', tablesError)
    throw tablesError
  }

  // Create a map of table_id to table_number
  const tableMap = new Map(
    tables?.map(table => [table.id, table.table_number]) || []
  )

  // Create a map of order_id to table_number
  const orderTableMap = new Map(
    orders.map(order => [
      order.id,
      order.table_id ? (tableMap.get(order.table_id) || 0) : 0
    ])
  )

  // Transform data to match KitchenBarOrder interface
  const transformedData = items.map((item: any) => ({
    id: item.id,
    order_id: item.order_id,
    quantity: item.quantity,
    notes: item.notes,
    addons: item.addons,
    batch_number: item.batch_number,
    cooking_preference: item.cooking_preference,
    status: 'archived' as DisplayStatus,
    created_at: item.created_at,
    sent_to_kitchen_at: item.sent_to_kitchen_at,
    started_at: null,
    ready_at: item.kitchen_ready_at,
    item_name: item.menu_items?.name_he || '',
    item_name_en: '',
    table_number: orderTableMap.get(item.order_id) || 0,
    waiter_name: null
  }))

  return transformedData
}

// Get bar orders
export async function getBarOrders(): Promise<KitchenBarOrder[]> {
  const { data, error } = await supabase
    .from('bar_orders')
    .select('*')
    .order('created_at', { ascending: true })

  console.log('Bar orders from DB:', data)
  if (error) {
    console.error('Error fetching bar orders:', error)
    throw error
  }
  return data || []
}

// Update kitchen item status
export async function updateKitchenItemStatus(
  itemId: string,
  status: DisplayStatus
): Promise<void> {
  console.log('updateKitchenItemStatus called:', { itemId, status })

  const updateData: any = {
    kitchen_status: status
  }

  // Add timestamps based on status
  if (status === 'in_progress') {
    updateData.kitchen_started_at = new Date().toISOString()
  } else if (status === 'ready' || status === 'archived') {
    updateData.kitchen_ready_at = new Date().toISOString()
  }

  console.log('Update data to send:', updateData)

  const { data, error, count } = await supabase
    .from('order_items')
    .update(updateData)
    .eq('id', itemId)
    .select()

  console.log('Supabase update result:', { data, error, count, affectedRows: data?.length || 0 })

  if (error) {
    console.error('Supabase update error:', error)
    throw error
  }

  if (!data || data.length === 0) {
    console.error('No rows were updated! Item ID might not exist:', itemId)
    throw new Error(`No order item found with ID: ${itemId}`)
  }

  console.log('Successfully updated item:', data[0])
}

// Update bar item status
export async function updateBarItemStatus(
  itemId: string,
  status: DisplayStatus
): Promise<void> {
  console.log('updateBarItemStatus called:', { itemId, status })

  const updateData: any = {
    bar_status: status
  }

  // Add timestamps based on status
  if (status === 'in_progress') {
    updateData.bar_started_at = new Date().toISOString()
  } else if (status === 'ready' || status === 'archived') {
    updateData.bar_ready_at = new Date().toISOString()
  }

  console.log('Update data to send:', updateData)

  const { data, error, count } = await supabase
    .from('order_items')
    .update(updateData)
    .eq('id', itemId)
    .select()

  console.log('Supabase update result:', { data, error, count, affectedRows: data?.length || 0 })

  if (error) {
    console.error('Supabase update error:', error)
    throw error
  }

  if (!data || data.length === 0) {
    console.error('No rows were updated! Item ID might not exist:', itemId)
    throw new Error(`No order item found with ID: ${itemId}`)
  }

  console.log('Successfully updated item:', data[0])
}

// Mark kitchen order as ready
export async function markKitchenOrderReady(orderId: string): Promise<void> {
  // Get all items for this order that are for kitchen
  const { data: items, error: fetchError } = await supabase
    .from('order_items')
    .select(`
      id,
      menu_item:menu_items(
        category:categories(
          station_type
        )
      )
    `)
    .eq('order_id', orderId)
    .eq('kitchen_status', 'in_progress')

  if (fetchError) throw fetchError

  // Update all kitchen items to ready
  const kitchenItems = items?.filter(item =>
    (item.menu_item as any)?.category?.station_type === 'kitchen'
  ) || []

  for (const item of kitchenItems) {
    await updateKitchenItemStatus(item.id, 'ready')
  }
}

// Mark bar order as ready
export async function markBarOrderReady(orderId: string): Promise<void> {
  // Get all items for this order that are for bar
  const { data: items, error: fetchError } = await supabase
    .from('order_items')
    .select(`
      id,
      menu_item:menu_items(
        category:categories(
          station_type
        )
      )
    `)
    .eq('order_id', orderId)
    .eq('bar_status', 'in_progress')

  if (fetchError) throw fetchError

  // Update all bar items to ready
  const barItems = items?.filter(item =>
    (item.menu_item as any)?.category?.station_type === 'bar'
  ) || []

  for (const item of barItems) {
    await updateBarItemStatus(item.id, 'ready')
  }
}

// Subscribe to kitchen orders updates
export function subscribeToKitchenOrders(
  onUpdate: (orders: KitchenBarOrder[]) => void
) {
  const subscription = supabase
    .channel('kitchen-orders')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_items'
      },
      async () => {
        // Refetch all kitchen orders on any change
        const orders = await getKitchenOrders()
        onUpdate(orders)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

// Subscribe to bar orders updates
export function subscribeToBarOrders(
  onUpdate: (orders: KitchenBarOrder[]) => void
) {
  const subscription = supabase
    .channel('bar-orders')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_items'
      },
      async () => {
        // Refetch all bar orders on any change
        const orders = await getBarOrders()
        onUpdate(orders)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}