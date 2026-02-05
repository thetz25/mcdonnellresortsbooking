# 📋 JotForm Integration Guide

This guide explains how to integrate your JotForm booking form with the Resort Booking System.

## 🔗 Webhook Configuration

### Step 1: Get Your Webhook URL

Once your application is deployed, your webhook URL will be:
```
https://your-domain.com/api/webhook/jotform
```

For local testing, use ngrok:
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok (from backend directory)
cd backend
npm run dev

# In another terminal
ngrok http 5000

# Use the HTTPS URL provided by ngrok
# Example: https://abc123.ngrok.io/api/webhook/jotform
```

### Step 2: Configure JotForm Webhook

1. Log in to your JotForm account
2. Open your booking form
3. Click **Settings** (gear icon) in the top menu
4. Go to **Integrations** on the left sidebar
5. Search for and click on **Webhooks**
6. Enter your webhook URL:
   ```
   https://your-domain.com/api/webhook/jotform
   ```
7. Click **Complete Integration**
8. Save your form

### Step 3: Test the Integration

1. Submit a test booking through your JotForm
2. Check your Resort Booking System dashboard
3. The booking should appear automatically within seconds
4. Check your email for the notification

## 📊 Field Mapping

The system automatically maps common JotForm field types. However, you should verify your form field names match these patterns:

### Required Fields

| Field | JotForm Field Name | Example | Description |
|-------|-------------------|---------|-------------|
| Guest Name | `guestName`, `name` | "John Smith" | Full name or first/last name fields |
| Email | `email`, `guestEmail` | "john@example.com" | Guest email address |
| Check-in Date | `checkInDate`, `checkIn`, `arrivalDate` | "2024-03-15" | Arrival date |
| Check-out Date | `checkOutDate`, `checkOut`, `departureDate` | "2024-03-20" | Departure date |
| Accommodation | `accommodations`, `room`, `villa` | "Ocean View Villa" | Selected accommodation |

### Optional Fields

| Field | JotForm Field Name | Description |
|-------|-------------------|-------------|
| Phone | `phone`, `guestPhone` | Contact phone number |
| Number of Guests | `numberOfGuests`, `guests` | Total guests |
| Special Requests | `specialRequests`, `requests` | Guest special requests |

## 🛠️ Custom Field Mapping

If your JotForm uses different field names, you can customize the mapping in:

**File:** `backend/src/controllers/webhook.controller.ts`

```typescript
// Example: Customize field extraction
function extractGuestName(submission: any): string {
  // Try your custom field names
  if (submission.q5_yourFieldName) return submission.q5_yourFieldName;
  if (submission.fullName) return submission.fullName;
  
  // Default extraction
  return '';
}
```

## 🔍 Troubleshooting

### Webhook Not Receiving Data

1. **Verify URL is accessible:**
   ```bash
   curl -X POST https://your-domain.com/api/webhook/jotform \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

2. **Check server logs:**
   ```bash
   pm2 logs resort-api
   # or
   tail -f backend/logs/app.log
   ```

3. **Test with JotForm webhook tester:**
   - In JotForm, go to Settings → Integrations → Webhooks
   - Click on your webhook
   - Click "Test Integration"

### Bookings Not Appearing

1. **Check accommodation name matches:**
   - The accommodation name in JotForm must match (or partially match) the name in your system
   - Example: "Ocean View Villa" in JotForm matches "Ocean View Villa" in system

2. **Verify dates are valid:**
   - Check-in date must be before check-out date
   - Dates should be in YYYY-MM-DD format

3. **Check for overlapping bookings:**
   - If dates overlap with existing confirmed bookings, the webhook will reject the submission
   - Check your calendar view for availability

### Email Notifications Not Sending

1. **Verify Gmail settings:**
   - Check EMAIL_USER and EMAIL_PASS in .env
   - Ensure App Password is correct (not your regular password)

2. **Check spam folders:**
   - Notifications might be filtered as spam
   - Add sender to safe senders list

## 📧 Testing Your Integration

### Quick Test Script

Create a test file to verify webhook processing:

```bash
# backend/test-webhook.sh

curl -X POST http://localhost:5000/api/webhook/jotform \
  -H "Content-Type: application/json" \
  -d '{
    "q1_guestName": "Test User",
    "q3_guestEmail": "test@example.com",
    "q4_guestPhone": "123-456-7890",
    "q5_accommodations": "Ocean View Villa",
    "q7_checkInDate": "2024-12-01",
    "q8_checkOutDate": "2024-12-05",
    "q9_numberOfGuests": "2",
    "q10_specialRequests": "Late check-in please"
  }'
```

Run it:
```bash
chmod +x test-webhook.sh
./test-webhook.sh
```

## 🔒 Security Considerations

### Webhook Security

1. **Use HTTPS only** - Never use HTTP in production
2. **IP Whitelisting** - Configure JotForm to only send from known IPs
3. **Secret Verification** - Add webhook secret verification:

```typescript
// In webhook.controller.ts
const secret = req.headers['x-jotform-secret'];
if (secret !== process.env.JOTFORM_WEBHOOK_SECRET) {
  return res.status(401).json({ message: 'Unauthorized' });
}
```

### Rate Limiting

The webhook endpoint is protected by rate limiting:
- 100 requests per 15 minutes per IP
- Prevents spam and abuse

## 📊 Monitoring

### View Webhook Logs

```bash
# Real-time logs
pm2 logs resort-api --lines 100

# Search for webhook entries
grep "webhook" backend/logs/app.log
```

### Failed Webhook Handling

Failed webhooks are logged but not automatically retried. To handle failures:

1. Check logs for error messages
2. Verify form configuration
3. Manually create bookings if needed via admin panel

## 🎯 Best Practices

1. **Always test in development first** using ngrok
2. **Keep form fields consistent** - Don't change field names frequently
3. **Monitor webhook logs** regularly
4. **Set up alerts** for webhook failures
5. **Backup your data** regularly
6. **Use descriptive field names** in JotForm for easier debugging

## 🆘 Need Help?

If you encounter issues:

1. Check the server logs first
2. Verify your JotForm field names
3. Test the webhook manually with curl
4. Review this guide for common issues
5. Check the main README.md for general troubleshooting

---

**Note:** After making any changes to the webhook controller, remember to restart the backend server:
```bash
pm2 restart resort-api
```