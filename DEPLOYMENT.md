# Giggsi Digital Menu - Vercel Deployment Guide

## Prerequisites
- GitHub repository connected (✅ Already set up: nioasoft/giggsi-digital-menu)
- Vercel account with MCP authentication (✅ Connected)
- Supabase project with environment variables

## Quick Deploy

### Option 1: Using Deployment Script (Recommended)
```bash
./scripts/deploy-vercel.sh
```

### Option 2: Manual Deployment

#### Step 1: Install Vercel CLI (if not installed)
```bash
npm i -g vercel
```

#### Step 2: Link Project to Vercel
```bash
vercel link
```
- Select team: **nioasoft's projects**
- Link to GitHub repo: **nioasoft/giggsi-digital-menu**

#### Step 3: Set Environment Variables
The following variables need to be set in Vercel Dashboard:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can set them via:
1. Vercel Dashboard → Project Settings → Environment Variables
2. Or during deployment when prompted

#### Step 4: Deploy
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

## Automatic Deployments

### GitHub Integration
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Git
4. Connect GitHub repository
5. Configure:
   - Production Branch: `main`
   - Enable automatic deployments on push
   - Enable preview deployments for pull requests

## Project Configuration

### vercel.json Configuration
Already configured with:
- ✅ Vite framework settings
- ✅ SPA routing with rewrites
- ✅ Cache headers for assets
- ✅ AVIF image support

### Build Settings
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Framework: Vite

## Environment Variables

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |

### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_ENV` | Environment (development/production) | `production` |
| `VITE_APP_NAME` | Application name | `Giggsi Digital Menu` |

## Deployment Checklist

### Pre-Deployment
- [ ] All code committed and pushed to GitHub
- [ ] Build passes locally: `npm run build`
- [ ] TypeScript check passes: `npm run type-check`
- [ ] Environment variables ready

### Post-Deployment
- [ ] Check deployment URL works
- [ ] Test menu loading
- [ ] Verify images load (AVIF with fallback)
- [ ] Test language switching (Hebrew RTL, Arabic RTL, Russian, English)
- [ ] Verify admin panel access at `/admin-giggsi-2024`
- [ ] Test mobile responsiveness

## Troubleshooting

### Build Failures
```bash
# Check build locally
npm run build

# Check TypeScript errors
npm run type-check

# View Vercel logs
vercel logs
```

### Environment Variables Not Working
1. Ensure variables are set for correct environment (Preview/Production)
2. Variables must start with `VITE_` to be available in client
3. Redeploy after adding variables

### 404 Errors on Routes
- Verify `vercel.json` has SPA rewrites configured
- Check that `"source": "/(.*)"` rewrites to `"destination": "/"`

## Domains

### Custom Domain Setup
1. Go to Vercel Dashboard → Project Settings → Domains
2. Add domain: `menu.giggsi.com` (or desired domain)
3. Configure DNS:
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel nameservers for full DNS management

### SSL Certificate
- Automatically provisioned by Vercel
- Auto-renewal enabled
- Force HTTPS enabled by default

## Performance Monitoring

### Vercel Analytics
Enable in Dashboard → Analytics to track:
- Core Web Vitals
- Real User Metrics
- Performance scores

### Expected Performance Targets
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2s
- Time to Interactive: < 2.5s

## Support

### Vercel Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)
- [Environment Variables](https://vercel.com/docs/environment-variables)

### Project Specific
- Admin Panel: `/admin-giggsi-2024`
- GitHub Repo: https://github.com/nioasoft/giggsi-digital-menu
- Supabase Dashboard: Check your Supabase project settings