# 🏨 Resort Booking System

A comprehensive private resort booking management system with admin panel, featuring automated booking intake from JotForm, payment tracking, and detailed reporting.

## ✨ Features

### Core Features
- **📱 Admin Dashboard** - Real-time overview of bookings, revenue, and occupancy
- **📅 Booking Management** - Create, edit, cancel, and manage bookings with ease
- **🗓️ Calendar View** - Visual availability calendar for all accommodations
- **🏨 Accommodation Management** - Manage 4 room types/villas with pricing and amenities
- **💰 Payment Tracking** - Record and track all payments with balance calculations
- **👥 Multi-User Support** - Role-based access (Admin, Manager, Staff)
- **📊 Reports & Analytics** - Revenue reports, booking trends, and occupancy statistics
- **📧 Email Notifications** - Automatic email alerts for new and cancelled bookings

### Integration Features
- **🔗 JotForm Webhook** - Automatically receive and process bookings from your website form
- **✉️ Gmail Integration** - Send email notifications using your Gmail account

## 🛠️ Technology Stack

### Backend
- **Node.js** with **Express.js** and **TypeScript**
- **PostgreSQL** database with **Sequelize ORM**
- **JWT Authentication** for secure access
- **Nodemailer** for email notifications

### Frontend
- **React 18** with **TypeScript**
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Recharts** for data visualization
- **React Calendar** for availability view

## 🚀 Quick Start (Recommended: Vercel)

The easiest way to deploy is using **Vercel** - serverless deployment with free hosting!

### Prerequisites
- Vercel account (free tier)
- PostgreSQL database (Vercel Postgres, Railway, Supabase, or Neon)
- Gmail account (for email notifications)
- JotForm account (for form integration)

### 1. One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thetz25/mcdonnellresortsbooking)

Or deploy manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed instructions.**

---

## 🐳 Alternative: Docker Deployment

If you prefer self-hosting on your own VPS, use Docker:

### Prerequisites
- Docker 20.10+ and Docker Compose 2.0+
- VPS/Server with 2GB+ RAM

### Deploy with Docker

```bash
# Upload to your VPS and run:
chmod +x docker-deploy.sh
sudo ./docker-deploy.sh
```

That's it! The script will automatically:
- ✅ Install Docker if not present
- ✅ Configure environment variables
- ✅ Build and start all containers
- ✅ Seed the database with sample data
- ✅ Configure firewall
- ✅ Verify deployment

**Access your app at:** http://your-vps-ip

### 2. Configure Environment

Edit `.env` file before or after running the deploy script:

```bash
# Edit configuration
nano .env

# Update these values:
DB_PASSWORD=your_secure_password
JWT_SECRET=your_random_secret_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 3. Restart with New Config

```bash
docker-compose down
docker-compose up -d
```

---

## 🐳 Docker Management Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Update after code changes
docker-compose down
docker-compose up -d --build

# Database backup
docker exec resort-postgres pg_dump -U postgres resort_booking > backup.sql
```

**For detailed Docker deployment guide, see:** [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)

---

## 🛠️ Manual Installation (Alternative)

If you prefer not to use Docker, follow the manual installation steps below.

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- Gmail account (for email notifications)
- JotForm account (for form integration)

### 1. Clone and Setup

```bash
cd resort-booking-system
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Important: Update DB_PASSWORD, JWT_SECRET, and EMAIL settings
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb resort_booking

# Run database migrations and seed data
npm run db:seed
```

### 4. Start Backend

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

Backend will run on `http://localhost:5000`

### 5. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run on `http://localhost:3000`

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resort_booking
DB_USER=postgres
DB_PASSWORD=your_password

# Security
JWT_SECRET=your_super_secret_key

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
CORS_ORIGIN=http://localhost:3000
```

### Gmail App Password Setup

1. Go to Google Account Settings → Security
2. Enable 2-Step Verification
3. Generate App Password for "Mail"
4. Use the 16-character password in EMAIL_PASS

### JotForm Webhook Setup

1. In your JotForm dashboard, go to your booking form
2. Click "Settings" → "Integrations" → "Webhooks"
3. Add webhook URL: `https://your-domain.com/api/webhook/jotform`
4. Save and test the integration

## 📖 Usage Guide

### Default Login Credentials
- **Email:** admin@resort.com
- **Password:** admin123

### Managing Bookings
1. **Dashboard** - View all key metrics at a glance
2. **Bookings** - List and search all bookings
3. **Calendar** - View availability by date
4. Click on any booking to view details and manage status

### Booking Status Flow
```
Pending → Confirmed → Checked In → Checked Out
    ↓
Cancelled
```

### Managing Accommodations
- Add/edit room details, pricing, and amenities
- Deactivate accommodations temporarily
- 4 sample accommodations are pre-loaded

### Recording Payments
- Navigate to Payments page
- Select booking and record payment
- Track deposits, full payments, partial payments, and refunds
- Automatic balance calculation

### Managing Users
- Create staff accounts with different roles
- Admin: Full access
- Manager: Can manage bookings and accommodations
- Staff: Can view and create bookings

## 🚀 Production Deployment

### VPS Deployment (Ubuntu/Debian)

1. **Install Node.js and PostgreSQL**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib nginx
```

2. **Setup PostgreSQL**
```bash
sudo -u postgres psql -c "CREATE DATABASE resort_booking;"
sudo -u postgres psql -c "CREATE USER resort_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE resort_booking TO resort_user;"
```

3. **Clone and Setup Application**
```bash
git clone <your-repo>
cd resort-booking-system/backend
npm install
npm run build
```

4. **Setup Environment**
```bash
cp .env.example .env
# Edit .env with production settings
```

5. **Setup PM2 for Process Management**
```bash
sudo npm install -g pm2
cd backend
pm2 start dist/server.js --name "resort-api"
pm2 startup
pm2 save
```

6. **Build Frontend**
```bash
cd ../frontend
npm install
npm run build
# Copy build folder to web server directory
sudo cp -r build/* /var/www/resort-booking/
```

7. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /var/www/resort-booking;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **Setup SSL with Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js for security headers

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - List all users
- `PUT /api/auth/users/:id` - Update user
- `DELETE /api/auth/users/:id` - Delete user

### Bookings
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/:id/confirm` - Confirm booking
- `POST /api/bookings/:id/checkin` - Check in guest
- `POST /api/bookings/:id/checkout` - Check out guest
- `DELETE /api/bookings/:id` - Delete booking

### Accommodations
- `GET /api/accommodations` - List accommodations
- `GET /api/accommodations/:id` - Get accommodation details
- `POST /api/accommodations` - Create accommodation
- `PUT /api/accommodations/:id` - Update accommodation
- `DELETE /api/accommodations/:id` - Delete accommodation

### Payments
- `GET /api/payments` - List payments
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/booking/:bookingId` - Get payments by booking
- `POST /api/payments` - Create payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/occupancy` - Occupancy report
- `GET /api/reports/trends` - Booking trends

### Webhooks
- `POST /api/webhook/jotform` - JotForm booking submission

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `sudo service postgresql status`
- Check database credentials in .env
- Ensure database exists: `sudo -u postgres psql -l`

### Email Not Sending
- Verify Gmail App Password is correct
- Check if less secure apps are enabled (for testing)
- Review spam folders
- Check server logs for errors

### JotForm Not Receiving
- Verify webhook URL is accessible from internet
- Check webhook is properly configured in JotForm
- Review server logs for webhook requests
- Test webhook with curl or Postman

### CORS Errors
- Verify CORS_ORIGIN matches your frontend URL
- Check for trailing slashes in URLs
- Ensure protocol (http/https) matches

## 📄 License

This project is private and proprietary.

## 🆘 Support

For support or questions, please contact the development team.

---

Built with ❤️ for Resort Management