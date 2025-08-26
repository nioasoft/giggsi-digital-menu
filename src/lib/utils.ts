import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return `₪${price.toFixed(0)}`
}

export function getImageSizes(type: 'category' | 'item' | 'logo') {
  const sizes = {
    category: '(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw',
    item: '(max-width: 640px) 30vw, 20vw',
    logo: '(max-width: 640px) 25vw, 15vw'
  }
  return sizes[type]
}

export function setupImageLazyLoading(selector = '.img-lazy') {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src || ''
          img.classList.remove('img-loading')
          img.classList.add('img-loaded')
          imageObserver.unobserve(img)
        }
      })
    })

    document.querySelectorAll(selector).forEach(img => {
      imageObserver.observe(img)
    })
  }
}

export function isMobile(): boolean {
  return window.innerWidth < 768
}

export function getDirection(language: string): 'ltr' | 'rtl' {
  const rtlLanguages = ['he', 'ar']
  return rtlLanguages.includes(language) ? 'rtl' : 'ltr'
}

export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getLocalizedField(item: any, fieldBase: string, language: string): string {
  // Map language codes to field suffixes
  const langMap: Record<string, string> = {
    'he': 'he',
    'en': 'en',
    'ar': 'ar',
    'ru': 'ru'
  }
  
  const suffix = langMap[language] || 'he'
  const fieldName = `${fieldBase}_${suffix}`
  
  // Try requested language field first, then Hebrew as fallback (main language)
  return item[fieldName] || item[`${fieldBase}_he`] || item[fieldBase] || ''
}

export function getLocalizedContent(item: any, language: string) {
  return {
    name: getLocalizedField(item, 'name', language),
    description: getLocalizedField(item, 'description', language)
  }
}