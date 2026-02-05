# 🐳 Docker Deployment Guide

Deploy your Resort Booking System with Docker - no manual installation required!

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- VPS/Server with at least:
  - 2GB RAM
  - 10GB disk space
  - Ubuntu 20.04+ / Debian 11+ / CentOS 8+

## 🚀 Quick Deployment

### Option 1: One-Command Deploy

```bash
# 1. Upload your project to VPS
scp -r resort-booking-system user@your-vps-ip:/home/user/

# 2. SSH into your VPS
ssh user@your-vps-ip

# 3. Run Docker deployment
cd resort-booking-system
chmod +x docker-deploy.sh
sudo ./docker-deploy.sh
```

### Option 2: Manual Docker Deploy

```bash
# 1. Navigate to project directory
cd resort-booking-system

# 2. Configure environment
cp .env.docker .env
nano .env  # Edit with your settings

# 3. Build and start containers
docker-compose up -d --build

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f
```

## ⚙️ Configuration

### 1. Environment Variables

Edit `.env` file:

```env
# Database (change to secure password)
DB_PASSWORD=your_secure_password

# JWT Secret (generate strong random string)
JWT_SECRET=your_random_secret_key_min_32_chars

# Gmail Settings
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Resort Booking <your_gmail@gmail.com>
```

### 2. Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com)
2. Navigate to **Security**
3. Enable **2-Step Verification** (if not already enabled)
4. Go to **App passwords**
5. Select "Mail" and your device
6. Copy the 16-character password
7. Paste it in `EMAIL_PASS`

## 📊 Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f frontend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Database Backup
```bash
# Create backup
docker exec resort-postgres pg_dump -U postgres resort_booking > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i resort-postgres psql -U postgres resort_booking < backup_file.sql
```

### Access Containers
```bash
# Backend shell
docker exec -it resort-backend sh

# Database shell
docker exec -it resort-postgres psql -U postgres resort_booking

# View database
docker exec -it resort-postgres psql -U postgres resort_booking -c "SELECT * FROM bookings;"
```

## 🔧 Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker-compose logs

# Check port conflicts
sudo netstat -tulpn | grep -E '(:80|:5000|:5432)'

# Free up ports
sudo systemctl stop apache2
sudo systemctl stop nginx
```

### Database Connection Issues

```bash
# Check if postgres is running
docker-compose ps

# Restart postgres
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Email Not Sending

```bash
# Check backend logs
docker-compose logs backend | grep -i email

# Verify environment variables
docker exec resort-backend env | grep EMAIL
```

### Reset Everything

```bash
# WARNING: This will delete all data!
docker-compose down -v
docker-compose up -d --build
```

## 🌐 Domain & SSL Setup

### With Nginx Reverse Proxy

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  nginx-proxy:
    image: jwilder/nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - nginx-certs:/etc/nginx/certs
      - nginx-vhost:/etc/nginx/vhost.d
      - nginx-html:/usr/share/nginx/html
    restart: unless-stopped

  letsencrypt:
    image: jrcs/letsencrypt-nginx-proxy-companion
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - nginx-certs:/etc/nginx/certs
      - nginx-vhost:/etc/nginx/vhost.d
      - nginx-html:/usr/share/nginx/html
    environment:
      - NGINX_PROXY_CONTAINER=nginx-proxy
    restart: unless-stopped

  # ... your other services ...

volumes:
  nginx-certs:
  nginx-vhost:
  nginx-html:
```

Add to your services:
```yaml
environment:
  - VIRTUAL_HOST=yourdomain.com
  - LETSENCRYPT_HOST=yourdomain.com
  - LETSENCRYPT_EMAIL=your@email.com
```

### Without Reverse Proxy (Manual SSL)

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to project
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/

# Update docker-compose to mount SSL certificates
```

## 📈 Production Optimization

### 1. Enable Auto-Restart

Already configured in `docker-compose.yml` with `restart: unless-stopped`

### 2. Set Resource Limits

Add to services in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 3. Log Rotation

Create `/etc/logrotate.d/docker-container`:

```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    delaycompress
    missingok
    copytruncate
}
```

### 4. Monitoring

Install Docker monitoring:
```bash
docker run -d --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 3600
```

## 🔒 Security Best Practices

1. **Change all default passwords** in `.env`
2. **Use strong JWT secret** (min 32 characters)
3. **Enable firewall**:
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```
4. **Keep Docker updated**:
   ```bash
   sudo apt update
   sudo apt upgrade docker-ce docker-compose
   ```
5. **Regular backups** of database volume

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify `.env` configuration
3. Ensure ports are not in use
4. Check Docker daemon is running: `sudo systemctl status docker`
5. Review Docker documentation: https://docs.docker.com

## 🎉 Success!

Once deployed, access your application at:
- **Frontend**: http://your-vps-ip
- **Backend API**: http://your-vps-ip:5000
- **Default Login**: admin@resort.com / admin123

Your Resort Booking System is now running in Docker containers! 🐳✨