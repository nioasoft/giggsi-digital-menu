// Price utility functions for the waiter system

/**
 * Rounds up a price to the nearest whole shekel
 * Used for customer-facing bills and displays
 * @param amount - The amount in shekels (can have decimal)
 * @returns The amount rounded up to nearest whole number
 */
export function roundUpPrice(amount: number): number {
  return Math.ceil(amount)
}

/**
 * Formats a price for display with the shekel symbol
 * @param amount - The amount to format
 * @param roundUp - Whether to round up to nearest shekel (default: false)
 * @returns Formatted price string with ₪ symbol
 */
export function formatPriceILS(amount: number, roundUp: boolean = false): string {
  const finalAmount = roundUp ? roundUpPrice(amount) : amount
  return `₪${finalAmount.toFixed(roundUp ? 0 : 2)}`
}

/**
 * Calculates service charge (12.5%)
 * @param subtotal - The subtotal before service
 * @returns The service charge amount
 */
export function calculateServiceCharge(subtotal: number): number {
  return subtotal * 0.125
}

/**
 * Calculates total with service charge
 * @param subtotal - The subtotal before service
 * @param roundUp - Whether to round up the final amount
 * @returns The total amount including service
 */
export function calculateTotalWithService(subtotal: number, roundUp: boolean = false): number {
  const serviceCharge = calculateServiceCharge(subtotal)
  const total = subtotal + serviceCharge
  return roundUp ? roundUpPrice(total) : total
}