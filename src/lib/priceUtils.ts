// Price utility functions for the waiter system

import type { AddOn } from './types'

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

/**
 * Calculates the total price of selected addons
 * @param addons - Array of selected addons
 * @returns The total price of all addons
 */
export function getAddonsPrice(addons: AddOn[]): number {
  return addons.reduce((sum, addon) => sum + (addon.price || 0), 0)
}

/**
 * Calculates item price including selected addons
 * @param basePrice - The base price of the item
 * @param addons - Array of selected addons
 * @param quantity - Number of items (default: 1)
 * @returns The total price including addons multiplied by quantity
 */
export function calculateItemPriceWithAddons(
  basePrice: number,
  addons: AddOn[] = [],
  quantity: number = 1
): number {
  const addonsPrice = getAddonsPrice(addons)
  return (basePrice + addonsPrice) * quantity
}

/**
 * Formats addons for display with prices
 * @param addons - Array of addons to display
 * @param locale - Language locale for names (he, en, ar, ru)
 * @param showPrice - Whether to show prices (default: true)
 * @returns Formatted string of addons
 */
export function formatAddonsDisplay(
  addons: AddOn[],
  locale: string = 'he',
  showPrice: boolean = true
): string {
  if (!addons || addons.length === 0) return ''

  return addons.map(addon => {
    const nameKey = `name_${locale}` as keyof AddOn
    const name = (addon[nameKey] as string) || addon.name_he || 'תוספת'

    if (showPrice && addon.price > 0) {
      return `${name} (+₪${addon.price.toFixed(2)})`
    }
    return name
  }).join(', ')
}

/**
 * Formats addon for single display
 * @param addon - Single addon to format
 * @param locale - Language locale for names
 * @returns Formatted addon string with price
 */
export function formatSingleAddon(addon: AddOn, locale: string = 'he'): string {
  const nameKey = `name_${locale}` as keyof AddOn
  const name = (addon[nameKey] as string) || addon.name_he || 'תוספת'

  if (addon.price > 0) {
    return `${name} (+₪${addon.price})`
  }
  return name
}