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
Create `.env` files in both `backend/` and `frontend/` directories:

**Backend (.env):**
```
DATABASE_URL="postgresql://username:password@localhost:5432/archify"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
CORS_ORIGINS="https://yourdomain.com"
PORT=3000
NODE_ENV=production
```

**Frontend (.env):**
```
VITE_API_URL="https://your-api-domain.com"
```

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
