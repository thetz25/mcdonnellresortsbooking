#!/bin/bash

echo "🚀 Resort Booking System - VPS Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="resort-booking"
APP_DIR="/var/www/$APP_NAME"
API_PORT=5000

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting deployment...${NC}"

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js
echo -e "${YELLOW}Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo -e "${GREEN}Node.js version: $(node -v)${NC}"

# Install PM2
echo -e "${YELLOW}Installing PM2...${NC}"
npm install -g pm2

# Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
apt install -y nginx

# Setup application directory
echo -e "${YELLOW}Setting up application directory...${NC}"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/api
mkdir -p $APP_DIR/frontend

# Copy files
echo -e "${YELLOW}Copying application files...${NC}"
# Note: You need to manually copy your files or use git clone
echo -e "${YELLOW}Please ensure your application files are in place${NC}"

# Backend setup
echo -e "${YELLOW}Setting up backend...${NC}"
cd $APP_DIR/api
npm install
npm run build

# Create environment file if not exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${RED}Please edit $APP_DIR/api/.env with your production settings${NC}"
fi

# Frontend setup
echo -e "${YELLOW}Setting up frontend...${NC}"
cd $APP_DIR/frontend
npm install
npm run build

# Copy frontend build to web directory
rm -rf /var/www/html/*
cp -r build/* /var/www/html/

# Setup PM2
echo -e "${YELLOW}Setting up PM2...${NC}"
cd $APP_DIR/api
pm2 delete $APP_NAME-api 2>/dev/null || true
pm2 start dist/server.js --name "$APP_NAME-api"
pm2 startup systemd
pm2 save

# Setup Nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/$APP_NAME << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# Enable site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Setup firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit the environment file:"
echo "   nano $APP_DIR/api/.env"
echo ""
echo "2. Setup your domain and SSL:"
echo "   apt install certbot python3-certbot-nginx"
echo "   certbot --nginx -d yourdomain.com"
echo ""
echo "3. Check application status:"
echo "   pm2 status"
echo "   pm2 logs $APP_NAME-api"
echo ""
echo -e "${GREEN}Your application should now be accessible at your server IP${NC}"
echo ""