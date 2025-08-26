# Giggsi Digital Menu 🍔

A modern, mobile-first digital menu system for Giggsi Sports Bar Restaurant in Beer Sheva.

## Features

- 📱 **Mobile-First Design** - Optimized for 99% mobile traffic
- 🌍 **Multi-Language Support** - Hebrew, Arabic, Russian, and English with RTL support
- 🎨 **Dynamic Content** - Real-time menu updates via Supabase
- 🖼️ **Image Optimization** - AVIF format with lazy loading
- 🔒 **Secure Admin Panel** - Protected management interface
- ⚡ **Performance Optimized** - Sub-2 second load times

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **i18n:** react-i18next with 4 language support
- **Build:** Vite
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nioasoft/giggsi-digital-menu.git
cd giggsi-digital-menu
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. Run development server:
```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   ├── menu/        # Menu display components
│   ├── admin/       # Admin panel components
│   └── common/      # Shared components
├── lib/             # Utilities and configurations
├── pages/           # Page components
├── locales/         # Translation files
└── styles/          # Global styles
```

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ENV=development|production
```

## Admin Access

The admin panel is accessible at `/admin-giggsi-2024` with authentication required.

## Deployment

This project is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy!

## Performance

- Lazy loading for images
- Code splitting for routes
- AVIF image format with fallbacks
- Optimized bundle size with manual chunks

## License

Private - All rights reserved

## Contact

For issues or questions, please contact the development team.

---

Built with ❤️ for Giggsi Sports Bar