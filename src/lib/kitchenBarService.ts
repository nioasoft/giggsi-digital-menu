import { supabase } from './supabase'
import type { DisplayStatus } from './stationUtils'

export interface KitchenBarOrder {
  id: string
  order_id: string
  quantity: number
  notes: string | null
  addons: any[] | null  // Array of addon objects from the view
  batch_number: number  // Batch number for grouping
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
  const updateData: any = {
    kitchen_status: status
  }

  // Add timestamps based on status
  if (status === 'in_progress') {
    updateData.kitchen_started_at = new Date().toISOString()
  } else if (status === 'ready' || status === 'archived') {
    updateData.kitchen_ready_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('order_items')
    .update(updateData)
    .eq('id', itemId)

  if (error) throw error
}

// Update bar item status
export async function updateBarItemStatus(
  itemId: string,
  status: DisplayStatus
): Promise<void> {
  const updateData: any = {
    bar_status: status
  }

  // Add timestamps based on status
  if (status === 'in_progress') {
    updateData.bar_started_at = new Date().toISOString()
  } else if (status === 'ready' || status === 'archived') {
    updateData.bar_ready_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('order_items')
    .update(updateData)
    .eq('id', itemId)

  if (error) throw error
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