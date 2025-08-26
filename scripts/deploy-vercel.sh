#!/bin/bash

# Giggsi Digital Menu - Vercel Deployment Script

echo "🚀 Deploying Giggsi Digital Menu to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
fi

# Check if .vercel directory exists
if [ ! -d ".vercel" ]; then
    echo "🔗 Linking project to Vercel..."
    echo "Please follow the prompts to link your project:"
    echo "1. Select 'nioasoft's projects' team"
    echo "2. Link to existing project or create new"
    echo "3. Use the GitHub repository: nioasoft/giggsi-digital-menu"
    echo ""
    vercel link
fi

# Environment variables to set in Vercel
echo ""
echo "📝 Environment variables needed in Vercel:"
echo "   VITE_SUPABASE_URL"
echo "   VITE_SUPABASE_ANON_KEY"
echo ""
echo "These will be automatically set from your .env file"
echo ""

# Deploy options
echo "Select deployment type:"
echo "1) Preview deployment (for testing)"
echo "2) Production deployment"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo "🔄 Creating preview deployment..."
        vercel
        ;;
    2)
        echo "🚀 Creating production deployment..."
        vercel --prod
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Check the deployment URL provided above"
echo "2. Verify all features work correctly"
echo "3. Set up automatic deployments from GitHub if needed"