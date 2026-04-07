#!/bin/bash

# ============================================
# TenderPro Supabase Setup Script
# ============================================
# Run this script after setting up your .env file
# with Supabase credentials

echo "🚀 Setting up TenderPro with Supabase..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and fill in your Supabase credentials"
    echo ""
    echo "  cp .env.example .env"
    echo ""
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=.*supabase" .env 2>/dev/null; then
    echo "⚠️  Warning: DATABASE_URL doesn't appear to be set for Supabase"
    echo "Please update your .env file with Supabase connection strings"
    exit 1
fi

echo "📦 Generating Prisma Client..."
bun run db:generate

echo ""
echo "🗄️  Pushing database schema to Supabase..."
bun run db:push

echo ""
echo "🌱 Seeding database with demo data..."
bun run db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "Demo accounts:"
echo "  Contractor: info@ptbangunpermai.co.id / password123"
echo "  Owner: andriansyah@gmail.com / password123"
echo ""
echo "Now you can run: bun run dev"
