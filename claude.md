# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Mobile-first digital menu system for Giggsi Sports Bar Restaurant in Beer Sheva. Features multilingual support, real-time updates, and comprehensive admin management.

**Tech Stack:** React 18 + TypeScript + Vite + Supabase + shadcn/ui + Tailwind CSS
**Key Focus:** 99% mobile traffic, sub-2s load times, RTL support
**Documentation:** See `PRD.md` for complete product requirements and business context

## Development Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build with code splitting
npm run preview      # Preview production build
npm run lint         # ESLint check (max-warnings 0)
npm run type-check   # TypeScript type checking
npm run deploy       # Deploy to Vercel (uses scripts/deploy-vercel.sh)
npm run deploy:preview # Deploy preview to Vercel
npm run deploy:prod  # Deploy production to Vercel
```

## High-Level Architecture

### Core System Design
- **Frontend:** React 18 SPA with client-side routing (react-router-dom)
- **State Management:** React hooks + Context API (no Redux/Zustand)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Styling:** Tailwind CSS + shadcn/ui components + CSS variables
- **i18n:** react-i18next with 4 languages (Hebrew/Arabic RTL, Russian/English LTR)
- **Build:** Vite with manual chunking for optimal performance
- **Image Processing:** Custom AVIF conversion with responsive variants

### Key Architectural Patterns
- **Component Organization:** Separation by domain (menu/, admin/, common/, ui/)
- **Data Flow:** Supabase → Custom hooks → Components
- **Auth:** Supabase Auth with protected routes for admin (/admin-giggsi-2024)
- **Image Strategy:** AVIF primary with WebP/JPEG fallbacks, lazy loading
- **Error Handling:** Try-catch blocks with user-friendly error messages
- **Type Safety:** Strict TypeScript with generated Supabase types

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components (button, card, dialog, etc.)
│   ├── menu/         # Menu display components (CategoryCard, MenuCard, ItemDetailModal)
│   ├── admin/        # Admin components (ImageUpload, ProtectedRoute, CategoryAddonsModal)
│   ├── common/       # Shared components (Layout, LanguageSwitcher, Analytics)
│   └── promotions/   # Popup and promotion components
├── pages/
│   ├── menu/         # Public menu page
│   └── admin/        # Admin pages (Dashboard, Categories, MenuItems, etc.)
├── lib/
│   ├── supabase.ts   # Supabase client configuration
│   ├── auth.ts       # Authentication utilities
│   ├── imageProcessor.ts # AVIF conversion and image optimization
│   ├── types.ts      # TypeScript type definitions
│   └── utils.ts      # Utility functions (cn, formatters)
├── hooks/
│   └── useMenu.ts    # Custom hook for menu data fetching
├── i18n/
│   ├── index.ts      # i18n configuration
│   └── locales/      # Translation JSON files (ar, en, he, ru)
├── styles/
│   └── globals.css   # Tailwind directives + CSS variables
└── assets/           # Static assets (logo, menu JSON)
```

## Database Schema

### Supabase Tables
- **categories** - Menu categories (id, name_*, description_*, image_url, display_order, is_active)
- **menu_items** - Items (id, category_id, name_*, description_*, price, image_url, allergens, is_active)
- **addon_groups** - Add-on groups (id, name_*, type, category_ids[], is_active)
- **addon_items** - Individual add-ons (id, group_id, name_*, price, is_active)
- **menu_item_addon_groups** - M2M relationship for items and addon groups
- **restaurant_info** - Restaurant details (hours, contact, social links)
- **popups** - Promotional popups (id, type, content_*, image_url, is_active)

*Note: _* suffix indicates multilingual fields (name_en, name_he, name_ar, name_ru)

### Storage Buckets
- **menu-images** - Category and item images
- **popup-images** - Promotional popup images
- **restaurant-assets** - Logo and other assets

## Key Routes

### Public Routes
- `/` - Main menu page
- `/menu` - Alias for main menu

### Admin Routes (Protected)
- `/admin-giggsi-2024/login` - Admin login
- `/admin-giggsi-2024` - Dashboard
- `/admin-giggsi-2024/categories` - Manage categories
- `/admin-giggsi-2024/menu-items` - Manage menu items
- `/admin-giggsi-2024/addon-groups` - Manage add-on groups
- `/admin-giggsi-2024/addons` - Manage individual add-ons
- `/admin-giggsi-2024/promotions` - Manage popups
- `/admin-giggsi-2024/settings` - Restaurant settings

## Important Implementation Details

### Image Optimization Strategy
- **AVIF Conversion:** Custom implementation in `lib/imageProcessor.ts`
- **Responsive Sizes:** Small (400px) and large (800px) variants
- **Smart Compression:** Preserves quality while minimizing file size
- **Storage:** Supabase Storage with organized folder structure
- **Lazy Loading:** Intersection Observer for performance

### Multilingual Implementation
- **i18n Setup:** Configured in `src/i18n/index.ts`
- **Language Detection:** Browser preference with localStorage override
- **RTL Support:** Automatic direction switching for Hebrew/Arabic
- **Translation Keys:** Nested JSON structure in `locales/` folder

### Authentication Flow
- **Supabase Auth:** Email/password authentication
- **Protected Routes:** HOC pattern with `ProtectedRoute` component
- **Session Management:** Persistent sessions with auto-refresh
- **Admin Access:** Single route prefix `/admin-giggsi-2024`

### Performance Optimizations
- **Code Splitting:** Manual chunks for vendor, router, supabase, i18n
- **Image Loading:** Progressive enhancement with blur-up placeholder
- **Bundle Size:** Optimized imports, tree-shaking enabled
- **Caching:** Browser caching for static assets

### Environment Variables
```bash
VITE_SUPABASE_URL=           # Supabase project URL
VITE_SUPABASE_ANON_KEY=      # Supabase anonymous key
VITE_APP_ENV=                 # development | production
```

### Deployment Configuration
- **Platform:** Vercel
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Node Version:** 18.x
- **Environment Variables:** Set in Vercel dashboard

## RTL and Localization Rules

### Critical RTL Requirements
- **ALL components must have `dir="rtl"` by default** - This is essential for Hebrew UI
- **All pages must be right-aligned** - Use `text-right` class on main containers
- **Hebrew is the primary language** - All UI elements default to RTL layout
- **Component wrapper structure**:
  ```tsx
  <div dir="rtl" className="text-right">
    <!-- All content here is RTL by default -->
  </div>
  ```

### Input Field Exceptions
- **Email/Password fields only** - These should be LTR within RTL context:
  ```tsx
  <Input
    type="email"
    dir="ltr"
    className="text-left"
  />
  ```

### Price Display Rules
- **Customer bills (waiter system)**:
  - Round UP to whole shekels: `Math.ceil(amount)`
  - Display format: `₪50` (no decimals)
  - Service charge: Always 12.5% before rounding
- **Internal calculations**:
  - Keep decimals for accuracy
  - Round only for final display
- **Example**:
  ```tsx
  // Bill display
  const finalAmount = Math.ceil(order.total_amount)
  return <span>₪{finalAmount}</span>
  ```

### Development Checklist
- [ ] Every new page has `dir="rtl"` on root element
- [ ] Every container has `text-right` class
- [ ] Email/password inputs have `dir="ltr" className="text-left"`
- [ ] Prices in bills are rounded up using `Math.ceil()`
- [ ] No decimals shown in customer-facing prices