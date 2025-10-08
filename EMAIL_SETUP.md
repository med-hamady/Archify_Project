# 📧 Email Setup Guide for Archify

## Current Status
The email service is configured but needs SMTP credentials to actually send emails. Currently, reset codes are logged to the console for testing.

## 🔧 Setup Real Email Sending

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Set Environment Variables**:
   ```bash
   # In your backend/.env file or system environment
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   EMAIL_FROM=noreply@archify.com
   ```

### Option 2: Other Email Providers

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-user
SMTP_PASS=your-mailgun-smtp-password
```

## 🧪 Testing Email Service

### Current Behavior (Without SMTP)
- Reset codes are logged to console
- Email content is displayed in console
- No actual emails are sent

### With SMTP Configured
- Real emails are sent to user's inbox
- Reset codes are delivered via email
- Full password reset flow works

## 🔍 Console Output Example

When you request a password reset, you'll see:
```
🔐 PASSWORD RESET CODE FOR TESTING:
📧 Email: user@example.com
🔑 Reset Code: abc123def456ghi789
🔗 Reset URL: http://localhost:4200/forgot-password?token=abc123def456ghi789
⏰ Expires in 1 hour
=====================================
```

## 🚀 Quick Setup for Gmail

1. **Create a new Gmail account** (or use existing)
2. **Enable 2FA** in Google Account settings
3. **Generate App Password**:
   - Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
4. **Add to your environment**:
   ```bash
   export SMTP_USER=your-email@gmail.com
   export SMTP_PASS=your-16-char-app-password
   ```
5. **Restart your backend server**

## ✅ Verification

After setup, when you test password reset:
- Check your email inbox for the reset email
- The email will contain the reset code
- You can use the code in the password reset form

## 🛠️ Troubleshooting

### "Authentication failed"
- Check your Gmail app password
- Ensure 2FA is enabled
- Verify SMTP credentials

### "Connection timeout"
- Check your internet connection
- Verify SMTP_HOST and SMTP_PORT
- Try different port (465 with secure: true)

### "Email not received"
- Check spam folder
- Verify email address is correct
- Check SMTP logs in console
