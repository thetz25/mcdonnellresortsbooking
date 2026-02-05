# Vercel Deployment Guide

Deploy your Resort Booking System to Vercel with serverless functions and managed PostgreSQL.

## 🚀 Quick Deploy (One Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thetz25/mcdonnellresortsbooking)

## 📋 Prerequisites

- Vercel account (free tier works)
- GitHub account
- PostgreSQL database (Vercel Postgres, Railway, Supabase, or Neon)
- Gmail account (for email notifications)

## 🎯 Deployment Steps

### Step 1: Fork/Clone Repository

```bash
# Fork the repository on GitHub first, then clone your fork
git clone https://github.com/YOUR_USERNAME/mcdonnellresortsbooking.git
cd mcdonnellresortsbooking
```

### Step 2: Set Up Database

#### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **Storage** tab
3. Click **Create Database** → **Postgres**
4. Select your project or create new
5. Copy the connection string

#### Option B: Railway

1. Go to [Railway](https://railway.app)
2. Create new project → Add PostgreSQL
3. Go to **Connect** tab
4. Copy **Database URL**

#### Option C: Supabase

1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Go to **Settings** → **Database**
4. Copy connection string under **URI**

### Step 3: Configure Environment Variables

Create `.env.local` file:

```env
# Database Connection (from your provider)
DATABASE_URL=postgres://username:password@host:port/database

# Or individual credentials
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=resort_booking
DB_USER=your-username
DB_PASSWORD=your-password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
JWT_EXPIRES_IN=24h

# Email Configuration (Gmail)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password_here
EMAIL_FROM=your_gmail@gmail.com

# JotForm Integration (Optional)
JOTFORM_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 4: Deploy to Vercel

#### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Add environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add EMAIL_USER
vercel env add EMAIL_PASS
vercel env add EMAIL_FROM

# Redeploy with env vars
vercel --prod
```

#### Option B: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **Add New Project**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Other
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `cd backend && npm install`
6. Add Environment Variables (see below)
7. Click **Deploy**

### Step 5: Add Environment Variables in Vercel Dashboard

1. Go to your project settings
2. Click **Environment Variables**
3. Add the following:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | Your database URL | Production, Preview, Development |
| `JWT_SECRET` | Your JWT secret | Production, Preview, Development |
| `EMAIL_USER` | Gmail address | Production, Preview |
| `EMAIL_PASS` | Gmail app password | Production, Preview |
| `EMAIL_FROM` | Sender email | Production, Preview |
| `JOTFORM_WEBHOOK_SECRET` | Webhook secret | Production, Preview |
| `NODE_ENV` | production | Production |

### Step 6: Seed Database

After deployment, seed your database:

```bash
# Using Vercel CLI
vercel --prod

# Then run seed endpoint (you'll need to add this endpoint first)
# Or use a local script with your database URL
```

Or create a seed API endpoint temporarily:

Add to `backend/src/routes/auth.routes.ts`:
```typescript
import { seedDatabase } from '../database/seed';

router.post('/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Seeding failed', error });
  }
});
```

Then call: `POST https://your-app.vercel.app/api/auth/seed`

**Remove this endpoint after seeding!**

## 🔧 Post-Deployment Configuration

### 1. Configure JotForm Webhook

Update your JotForm webhook URL to:
```
https://your-app.vercel.app/api/webhook/jotform
```

### 2. Set Up Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### 3. Configure Gmail App Password

1. Go to [Google Account Settings](https://myaccount.google.com)
2. Security → 2-Step Verification → App Passwords
3. Generate app password for "Mail"
4. Update `EMAIL_PASS` environment variable

## 📊 Monitoring & Logs

### View Logs
```bash
# Using Vercel CLI
vercel logs --prod

# Or use Vercel Dashboard
# Go to your project → Deployments → Select deployment → Logs
```

### Analytics
- Enable Vercel Analytics in project settings
- Monitor performance and errors

## 🔄 Updating Your App

### Automatic Deployments
Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update features"
git push origin main

# Vercel automatically deploys
```

### Manual Deploy
```bash
vercel --prod
```

## 🗄️ Database Management

### Backup
```bash
# Using pg_dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Migrations
Database schema updates happen automatically on deploy via Sequelize sync.

For manual migrations:
```bash
# Connect to database
psql $DATABASE_URL

# Or use a migration tool
```

## 🚨 Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
1. Check DATABASE_URL is correct
2. Ensure database allows connections from Vercel IPs
3. For Vercel Postgres: Whitelist all IPs or use connection pooling

### Issue: "Build failed"

**Solution:**
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in package.json
3. Verify build command is correct

### Issue: "API routes return 404"

**Solution:**
1. Check `vercel.json` routes configuration
2. Ensure server.ts exports the app
3. Verify routes are registered before export

### Issue: "Cold start slow"

**Solution:**
1. Enable Vercel's "Zero Config" for faster cold starts
2. Consider using Edge Functions for simple routes
3. Use connection pooling (already configured)

## 💰 Pricing

### Vercel Free Tier Includes:
- 100GB bandwidth/month
- 6,000 execution hours/month
- 1TB data transfer/month
- 1,000 GB-Hours of Serverless Functions

### Database Options:
- **Vercel Postgres**: Free tier with limits
- **Railway**: $5/month starter
- **Supabase**: Free tier with limits
- **Neon**: Free tier with limits

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Sequelize with Serverless](https://sequelize.org/docs/v6/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

## 🎯 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Configure custom domain (optional)
3. ✅ Set up JotForm webhook
4. ✅ Test booking flow
5. ✅ Configure email notifications
6. ✅ Invite team members
7. ✅ Monitor analytics

## 🆘 Support

For issues specific to:
- **Vercel**: [Vercel Support](https://vercel.com/help)
- **Database**: Contact your database provider
- **Application**: Check logs and documentation

---

**Your Resort Booking System is now live on Vercel! 🚀**