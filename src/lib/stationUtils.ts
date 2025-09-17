// Station type definitions
export type StationType = 'kitchen' | 'bar'
export type DisplayStatus = 'pending' | 'in_progress' | 'ready' | 'archived'

// Bar category identifiers (Hebrew names)
const BAR_CATEGORIES = [
  'שתייה קלה',
  'בירות מהחבית',
  'שייקים',
  'בירות בבקבוק',
  'קוקטיילים',
  'יין',
  'מבעבעים'
]

// English bar category identifiers (as fallback)
const BAR_CATEGORIES_EN = [
  'Soft Drinks',
  'Draft Beer',
  'Shakes',
  'Bottled Beer',
  'Cocktails',
  'Wine',
  'Sparkling'
]

/**
 * Determines if a category belongs to the bar or kitchen
 */
export function getCategoryStation(categoryName: string, categoryNameEn?: string): StationType {
  // Check Hebrew names first
  if (BAR_CATEGORIES.includes(categoryName)) {
    return 'bar'
  }

  // Check English names as fallback
  if (categoryNameEn && BAR_CATEGORIES_EN.includes(categoryNameEn)) {
    return 'bar'
  }

  // Default to kitchen for all food items
  return 'kitchen'
}

/**
 * Formats display status for UI
 */
export function formatDisplayStatus(status: DisplayStatus): string {
  switch (status) {
    case 'pending':
      return 'ממתין'
    case 'in_progress':
      return 'בהכנה'
    case 'ready':
      return 'מוכן'
    case 'archived':
      return 'הושלם'
    default:
      return status
  }
}

/**
 * Gets status badge color based on status
 */
export function getStatusColor(status: DisplayStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500'
    case 'in_progress':
      return 'bg-blue-500'
    case 'ready':
      return 'bg-green-500'
    case 'archived':
      return 'bg-gray-500'
    default:
      return 'bg-gray-400'
  }
}

/**
 * Calculates time elapsed since order creation
 */
export function getElapsedTime(createdAt: string): string {
  const now = new Date()
  // Parse the UTC time from the server
  const created = new Date(createdAt)

  // If the created date doesn't have timezone info, treat it as UTC
  // and adjust for Israel timezone (UTC+2 or UTC+3 depending on DST)
  const israelOffset = 3 * 60 * 60 * 1000 // 3 hours in milliseconds
  const adjustedCreated = new Date(created.getTime() - israelOffset)

  const diffMs = now.getTime() - adjustedCreated.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) {
    return 'כרגע'
  } else if (diffMins === 1) {
    return 'דקה אחת'
  } else if (diffMins < 60) {
    return `${diffMins} דקות`
  } else {
    const hours = Math.floor(diffMins / 60)
    return hours === 1 ? 'שעה אחת' : `${hours} שעות`
  }
}

/**
 * Groups order items by table number
 */
export function groupOrdersByTable<T extends { table_number: number }>(orders: T[]): Map<number, T[]> {
  const grouped = new Map<number, T[]>()

  for (const order of orders) {
    const tableOrders = grouped.get(order.table_number) || []
    tableOrders.push(order)
    grouped.set(order.table_number, tableOrders)
  }

  return grouped
}

/**
 * Groups order items by order_id (each order gets its own card)
 */
export function groupOrdersByOrderId<T extends { order_id: string, table_number: number }>(
  orders: T[]
): Map<string, { tableNumber: number; items: T[] }> {
  const grouped = new Map<string, { tableNumber: number; items: T[] }>()

  for (const order of orders) {
    const existingGroup = grouped.get(order.order_id)
    if (existingGroup) {
      existingGroup.items.push(order)
    } else {
      grouped.set(order.order_id, {
        tableNumber: order.table_number,
        items: [order]
      })
    }
  }

  return grouped
}

/**
 * Groups order items by order_id + batch_number (each batch gets its own card)
 */
export function groupOrdersByBatch<T extends { order_id: string, table_number: number, batch_number: number }>(
  orders: T[]
): Map<string, { tableNumber: number; orderId: string; batchNumber: number; items: T[] }> {
  const grouped = new Map<string, { tableNumber: number; orderId: string; batchNumber: number; items: T[] }>()

  for (const order of orders) {
    const batchKey = `${order.order_id}_batch_${order.batch_number}`
    const existingGroup = grouped.get(batchKey)
    if (existingGroup) {
      existingGroup.items.push(order)
    } else {
      grouped.set(batchKey, {
        tableNumber: order.table_number,
        orderId: order.order_id,
        batchNumber: order.batch_number,
        items: [order]
      })
    }
  }

  return grouped
}