#!/bin/bash

echo "🚀 Resort Booking System Setup"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. You'll need to install it manually."
    echo "   Ubuntu/Debian: sudo apt install postgresql"
    echo "   macOS: brew install postgresql"
    echo "   Windows: Download from postgresql.org"
fi

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend

if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your database and email settings"
fi

echo "📥 Installing backend dependencies..."
npm install

echo "🔨 Building backend..."
npm run build

cd ..

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd frontend

echo "📥 Installing frontend dependencies..."
npm install

cd ..

# Create database setup script
echo ""
echo "🗄️  Database Setup Instructions:"
echo "==============================="
echo "1. Start PostgreSQL service:"
echo "   sudo service postgresql start  (Linux)"
echo "   brew services start postgresql  (macOS)"
echo ""
echo "2. Create database:"
echo "   sudo -u postgres createdb resort_booking"
echo ""
echo "3. Update backend/.env with your database credentials"
echo ""
echo "4. Seed the database:"
echo "   cd backend && npm run db:seed"
echo ""

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "🌐 Access the application at: http://localhost:3000"
echo ""
echo "📧 Default Login:"
echo "  Email: admin@resort.com"
echo "  Password: admin123"
echo ""