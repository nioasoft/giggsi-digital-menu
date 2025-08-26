#!/bin/bash

# Giggsi Digital Menu - Vercel Environment Variables Setup

echo "🔧 Setting up Vercel Environment Variables"
echo ""
echo "This script will guide you through adding the required environment variables to your Vercel project."
echo ""

# Environment variables
SUPABASE_URL="https://bsivfdyxjdmosxlbouue.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzaXZmZHl4amRtb3N4bGJvdXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDI0NjUsImV4cCI6MjA3MTY3ODQ2NX0.H152Ot0LOubgH2Mh2RNnfIByKO9CbSQzXfHOHYaFOQE"

echo "📝 Variables to be added:"
echo "   VITE_SUPABASE_URL = $SUPABASE_URL"
echo "   VITE_SUPABASE_ANON_KEY = [key hidden for security]"
echo ""

echo "Choose an option:"
echo "1) Add via Vercel CLI (requires vercel login)"
echo "2) Show manual instructions for Vercel Dashboard"
echo "3) Generate .env.production file for manual upload"
read -p "Enter choice (1, 2, or 3): " choice

case $choice in
    1)
        echo ""
        echo "🔑 Adding environment variables via CLI..."
        echo ""
        
        # Check if logged in
        if ! vercel whoami &>/dev/null; then
            echo "Please login to Vercel first:"
            vercel login
        fi
        
        echo "Adding VITE_SUPABASE_URL..."
        echo "$SUPABASE_URL" | vercel env add VITE_SUPABASE_URL production
        echo "$SUPABASE_URL" | vercel env add VITE_SUPABASE_URL preview
        echo "$SUPABASE_URL" | vercel env add VITE_SUPABASE_URL development
        
        echo "Adding VITE_SUPABASE_ANON_KEY..."
        echo "$SUPABASE_ANON_KEY" | vercel env add VITE_SUPABASE_ANON_KEY production
        echo "$SUPABASE_ANON_KEY" | vercel env add VITE_SUPABASE_ANON_KEY preview
        echo "$SUPABASE_ANON_KEY" | vercel env add VITE_SUPABASE_ANON_KEY development
        
        echo ""
        echo "✅ Environment variables added!"
        echo ""
        echo "🔄 Triggering redeployment..."
        vercel --prod
        ;;
        
    2)
        echo ""
        echo "📋 Manual Instructions for Vercel Dashboard:"
        echo ""
        echo "1. Go to your Vercel Dashboard"
        echo "2. Select your 'giggsi-digital-menu' project"
        echo "3. Click on 'Settings' tab"
        echo "4. Click on 'Environment Variables' in the left sidebar"
        echo "5. Add the following variables:"
        echo ""
        echo "Variable 1:"
        echo "  Name: VITE_SUPABASE_URL"
        echo "  Value: $SUPABASE_URL"
        echo "  Environment: ✓ Production, ✓ Preview, ✓ Development"
        echo ""
        echo "Variable 2:"
        echo "  Name: VITE_SUPABASE_ANON_KEY"
        echo "  Value: $SUPABASE_ANON_KEY"
        echo "  Environment: ✓ Production, ✓ Preview, ✓ Development"
        echo ""
        echo "6. After adding both variables, go to 'Deployments' tab"
        echo "7. Click on the three dots (...) next to your latest deployment"
        echo "8. Click 'Redeploy'"
        echo ""
        echo "Direct link to your project settings:"
        echo "https://vercel.com/nioasofts-projects/giggsi-digital-menu/settings/environment-variables"
        ;;
        
    3)
        echo ""
        echo "📄 Creating .env.production file..."
        cat > .env.production <<EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF
        echo "✅ Created .env.production file"
        echo ""
        echo "To use this file:"
        echo "1. Go to Vercel Dashboard → Project Settings → Environment Variables"
        echo "2. Click 'Import .env' button"
        echo "3. Upload the .env.production file"
        echo "4. Redeploy your project"
        ;;
        
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete!"
echo "Your deployed site should now connect to Supabase correctly."