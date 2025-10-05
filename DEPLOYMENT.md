# Archify - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🌐 Production Deployment

### Environment Variables

**Required Environment Variables:**

```bash
# Database Configuration
DB_USER=your-db-user
DB_PASSWORD=your-secure-db-password
DB_NAME=archify_prod
DB_PORT=5432

# Backend Configuration
BACKEND_PORT=3000
NODE_ENV=production
LOG_LEVEL=warn

# JWT Configuration (Generate secure random 256-bit keys)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# CORS Configuration (Update with your actual domain)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API Configuration
API_BASE_URL=https://yourdomain.com/api

# Frontend Configuration
FRONTEND_PORT=80
FRONTEND_SSL_PORT=443

# File Storage Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=archify-prod-content

# Cloudinary Configuration (for images and PDFs)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Video Services (Vimeo)
VIMEO_ACCESS_TOKEN=your-vimeo-access-token
VIMEO_CLIENT_ID=your-vimeo-client-id
VIMEO_CLIENT_SECRET=your-vimeo-client-secret

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourdomain.com

# Payment Provider Webhook Secrets
BANKILY_WEBHOOK_SECRET=your-bankily-webhook-secret
MASRIVI_WEBHOOK_SECRET=your-masrivi-webhook-secret
SEDAD_WEBHOOK_SECRET=your-sedad-webhook-secret

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=GA-YOUR-ANALYTICS-ID
```

**Setup Steps:**
1. Copy `.env.prod` to `.env` in the project root
2. Update all values with your actual configuration
3. Generate secure JWT secrets (256-bit hex strings)
4. Configure your payment provider webhook endpoints

### Build Commands
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve the dist/ folder with your web server
```

## 🐳 Docker Deployment

### Using Docker Compose
```bash
docker-compose up -d
```

### Manual Docker
```bash
# Build backend
cd backend
docker build -t archify-backend .

# Build frontend
cd frontend
docker build -t archify-frontend .

# Run with PostgreSQL
docker run -d --name archify-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:16
docker run -d --name archify-backend -p 3000:3000 --link archify-postgres archify-backend
docker run -d --name archify-frontend -p 80:80 archify-frontend
```

## 📊 Database Management

### Reset Database
```bash
cd backend
npx prisma migrate reset --force
npm run seed
```

### View Database
```bash
cd backend
npx prisma studio
```

## 🔧 Troubleshooting

### Common Issues
1. **Database Connection Failed**: Check PostgreSQL is running and credentials are correct
2. **CORS Errors**: Update CORS_ORIGINS in backend .env
3. **Build Errors**: Ensure all dependencies are installed with `npm install`

### Logs
- Backend logs: Check console output
- Frontend logs: Check browser developer tools
- Database logs: Check PostgreSQL logs

## 📱 Features

- ✅ User Authentication & Authorization
- ✅ Course Management System
- ✅ Video/PDF Lesson Viewer
- ✅ Content Protection (Anti-Screenshot/Recording)
- ✅ Search & Filtering
- ✅ Progress Tracking
- ✅ Subscription Management
- ✅ Admin Panel
- ✅ Mobile Responsive Design

## 🛡️ Security Features

- JWT Authentication
- Content Protection
- CORS Configuration
- Rate Limiting
- Input Validation
- SQL Injection Protection (Prisma ORM)

## 📞 Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.
