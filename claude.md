# Giggsi Restaurant Menu System - Claude Code Rules

## Project Overview
Building a mobile-first digital menu system for Giggsi Sports Bar Restaurant in Beer Sheva. The system displays menu items with categories, allergen information, add-ons, and admin management capabilities.

**Business Context:** Modern sports bar with dynamic atmosphere, requires fast-loading mobile menu for 99% mobile users.

**📋 For Complete Requirements:** See `PRD.md` for detailed product requirements, business context, user personas, and project phases.

**Project Directory:** DIGITALMENU

## Project Assets Available
- **logo_giggsi.png** - Official Giggsi Sports Bar logo for branding
- **giggsi_menu.json** - Complete menu data structure with categories, items, prices, and descriptions

## Sub Agents Usage

### Available Sub Agents
Use the following specialized agents for different development tasks:

- **react-frontend-developer** - React 19 specialist, mobile-first UI, shadcn/ui components
- **i18n-specialist** - Internationalization expert for 4-language support + RTL
- **supabase-developer** - Database design, RLS policies, performance optimization  
- **image-optimizer** - AVIF conversion, responsive images, performance
- **code-reviewer** - Quality assurance, security, best practices

### Agent Usage Examples
```bash
# Use specific agents for tasks
claude "use react-frontend-developer to create the menu category grid component"
claude "use i18n-specialist to set up Hebrew RTL support"  
claude "use supabase-developer to create restaurant menu schema"
claude "use image-optimizer to implement AVIF conversion"
claude "use code-reviewer to check security of admin panel"
```

## MCP Servers Available
The following MCP servers are configured and ready:
- ✅ **Supabase MCP** - Full database access
- ✅ **Filesystem MCP** - Project files access  
- ✅ **Puppeteer MCP** - Browser automation for testing
- ✅ **Sequential Thinking MCP** - Complex problem solving

## Core Architecture Rules

### MUST Rules (Enforced)
- **React 19 + TypeScript** - Latest React with strict TypeScript
- **Supabase Backend** - Database, Auth, Storage for all data
- **shadcn/ui Components** - UI component library only
- **Mobile First Design** - 99% traffic is mobile, responsive secondary
- **AVIF Image Optimization** - Convert all uploads to AVIF with multiple sizes
- **Performance First** - Sub-2s load times mandatory
- **Security** - Admin access via separate URL, no admin links in menu
- **Clean Architecture** - Clear separation of concerns

### SHOULD Rules (Strongly Recommended)
- **Zero External Dependencies** - Minimize package installations
- **Short Function Names** - `loadMenu()` not `loadMenuFromDatabase()`
- **Clear File Structure** - Intuitive folder organization
- **Consistent Naming** - camelCase for variables, PascalCase for components
- **Single Responsibility** - Each component/function does one thing

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn components
│   ├── menu/         # Menu display components
│   ├── admin/        # Admin panel components
│   └── common/       # Shared components
├── lib/
│   ├── supabase.ts   # Supabase client
│   ├── utils.ts      # Utility functions
│   └── types.ts      # TypeScript definitions
├── styles/
│   ├── globals.css   # CSS variables for theming
│   └── components/   # Component-specific styles
├── pages/
│   ├── menu/         # Public menu pages
│   └── admin/        # Admin pages (separate route)
└── hooks/            # Custom React hooks
```

## Database Schema Requirements

### Core Tables
- **categories** - Menu categories with images and order
- **menu_items** - Individual dishes with allergens and descriptions  
- **add_ons** - Toppings and extras (up to 2 types per item)
- **restaurant_info** - Logo, hours, contact details
- **popups** - Site-wide, category-specific, and banner popups
- **users** - Admin authentication

### Image Storage
- **Supabase Storage** - Organized by category folders
- **AVIF Conversion** - Automatic conversion with small/large variants
- **Lazy Loading** - Images load only when needed

## UI/UX Requirements

### Menu Display Flow
1. **Category Grid** - Visual categories with images and names
2. **Item List** - Dishes in selected category with images and descriptions
3. **Item Details** - Image left, name/description right (mobile optimized)
4. **Add-ons Modal** - Overlay for toppings selection
5. **Allergen Icons** - Clear visual indicators

### Design System
- **CSS Variables** - All colors, fonts, spacing as variables in globals.css
- **Dark Elegant Theme** - Professional sports bar aesthetic
- **Responsive Grid** - Mobile-first with desktop adaptation
- **Touch-Friendly** - Large tap targets for mobile

### Performance Optimization
- **Image Lazy Loading** - Intersection Observer API
- **AVIF with Fallback** - Modern format with JPG backup
- **Component Splitting** - Code splitting for faster initial load
- **Caching Strategy** - Cache menu data appropriately

## Admin Panel Requirements

### Admin Features
- **Secure Access** - Separate URL path (/admin-giggsi-2024)
- **Menu Management** - CRUD operations for categories/items
- **Image Upload** - Drag-drop with AVIF conversion
- **Popup Manager** - Create/manage site and category popups
- **Restaurant Info** - Update hours, contact, logo
- **User Management** - Admin user authentication only

### Admin Security Rules
- **No Admin Links** - Zero references to admin in public menu
- **Environment Auth** - Admin credentials not hardcoded
- **Session Management** - Supabase Auth with secure tokens
- **Input Validation** - Sanitize all admin inputs

## Code Quality Standards

### Component Design
```typescript
// ✅ GOOD - Short, clear, typed
const MenuCard = ({ item }: { item: MenuItem }) => {
  return <Card>{item.name}</Card>
}

// ❌ BAD - Verbose, unclear
const MenuItemDisplayCardWithImageAndDescription = (props: any) => {
  // Complex nested logic
}
```

### Function Naming
```typescript
// ✅ GOOD
loadMenu()
saveItem()
deleteCategory()

// ❌ BAD  
loadMenuDataFromSupabaseDatabase()
saveMenuItemToBackendWithValidation()
```

### File Naming
```
MenuCard.tsx          # ✅ Component files
useMenu.ts           # ✅ Custom hooks  
menu-utils.ts        # ✅ Utility files
MenuItemWithLongName.tsx  # ❌ Too verbose
```

## Technical Implementation Rules

### React Patterns
- **Functional Components Only** - No class components
- **Custom Hooks** - Extract reusable logic
- **Context for Global State** - Avoid prop drilling
- **Error Boundaries** - Graceful error handling
- **Suspense** - Loading states for async components

### 🗄️ Database Commands Integration
- **Row Level Security** - Secure data access
- **Real-time Updates** - Live admin changes
- **Optimistic Updates** - Fast UI responses
- **Error Handling** - Supabase error management
- **Type Generation** - Generate types from schema

### Image Optimization Module
```typescript
// Required: AVIF conversion utility
const convertToAVIF = async (file: File) => {
  // Convert to AVIF format
  // Generate small (400px) and large (800px) versions
  // Return optimized files
}
```

## Development Workflow

### Commit Standards
- **Conventional Commits** - feat:, fix:, refactor:
- **Small Commits** - Single responsibility changes
- **Clear Messages** - Describe what and why

### Testing Requirements
- **Component Tests** - React Testing Library
- **E2E Tests** - Critical user journeys
- **Performance Tests** - Load time validation
- **Mobile Testing** - Touch and responsive behavior

## Performance Targets

### Loading Requirements
- **First Contentful Paint** - Under 1.5 seconds
- **Largest Contentful Paint** - Under 2 seconds  
- **Cumulative Layout Shift** - Under 0.1
- **Time to Interactive** - Under 2.5 seconds

### Image Optimization
- **AVIF Primary** - Modern efficient format
- **Progressive Loading** - Blur-up technique
- **Responsive Images** - Appropriate sizes for screen
- **Compression** - Quality 80-85 for optimal balance

## Business Logic

### Restaurant Context (See PRD.md for full details)
- **Name:** Giggsi Sports Bar Restaurant
- **Location:** Beer Sheva, Israel  
- **Atmosphere:** Modern sports bar, dynamic environment
- **Target:** Sports fans, young adults, families (99% mobile users)
- **Peak Hours:** Evening matches and weekends

### Menu Structure (Full spec in PRD.md Section 3.1)
- **Categories:** Visual grid with appealing images
- **Items:** Image RIGHT, text LEFT (RTL: opposite)  
- **Allergens:** Clear, international symbols
- **Add-ons:** Up to 2 types (e.g., sauces, sides)
- **Descriptions:** Appetizing, concise copy in 4 languages

## Deployment & Maintenance

### Environment Setup
- **Development** - Local with Supabase local instance
- **Staging** - Preview deployments
- **Production** - Optimized build with CDN

### Monitoring Requirements
- **Performance Monitoring** - Core Web Vitals tracking
- **Error Tracking** - Runtime error collection
- **User Analytics** - Menu usage patterns
- **Admin Activity** - Change logging

---

## Quick Start Commands

### 🚀 Initialize Project
```bash
# Start DIGITALMENU project development
claude "Initialize the DIGITALMENU project using react-frontend-developer agent. Set up React 19 + TypeScript + shadcn/ui with mobile-first architecture. Use the logo_giggsi.png and giggsi_menu.json files in the project directory."
```

### 📊 Load Menu Data
```bash
# Import and structure menu data
claude "use supabase-developer to analyze giggsi_menu.json and create the database schema with proper relationships for categories, items, allergens, and add-ons"
```

### 🌐 Setup Internationalization  
```bash
# Configure 4-language support
claude "use i18n-specialist to set up react-i18next with Hebrew (RTL), Arabic (RTL), Russian (LTR), and English (LTR) support"
```

### 🎨 Create Base Components
```bash  
# Build core UI components
claude "use react-frontend-developer to create the category grid and menu item display components with image RIGHT, text LEFT layout (RTL: opposite)"
```

### 🔧 Development Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run test suite
npm run lint         # Code quality check
```

### Supabase
```bash
npx supabase start   # Local Supabase
npx supabase db push # Deploy schema changes  
npx supabase gen types # Generate TypeScript types
```

**Remember:** This is a high-performance mobile menu for a busy sports bar. Every millisecond of load time and every touch interaction matters for customer experience.

**📖 Complete Project Context:** All business requirements, user personas, launch phases, and deployment strategy are detailed in `PRD.md`.