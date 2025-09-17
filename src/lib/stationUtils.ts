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
  const created = new Date(createdAt)
  const diffMs = now.getTime() - created.getTime()
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