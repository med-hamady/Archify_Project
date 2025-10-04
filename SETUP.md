# Archify - Setup Instructions

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Docker (optional, for database)

## Quick Start

### 1. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL with Docker
docker compose up -d

# The database will be available at localhost:5432
# Database: archify
# Username: postgres
# Password: postgres
```

#### Option B: Local PostgreSQL
```bash
# Create database
createdb archify

# Or using psql
psql -U postgres -c "CREATE DATABASE archify;"
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your database URL
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/archify?schema=public"

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with initial data
npm run seed

# Start the backend server
npm run dev
```

The backend will be available at `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will be available at `http://localhost:4200`

## Default Accounts

After running the seed script, you can use these test accounts:

### Admin Account
- **Email**: admin@archify.ma
- **Password**: admin123
- **Role**: Super Admin

### Student Account
- **Email**: student@archify.ma
- **Password**: student123
- **Role**: Student (with Premium subscription)

## Features Implemented

### Backend APIs
- ✅ Authentication (JWT with cookies)
- ✅ User management
- ✅ Course management
- ✅ Lesson management
- ✅ Department management
- ✅ Subscription management
- ✅ Progress tracking
- ✅ Comments system

### Frontend Components
- ✅ Home page with featured courses
- ✅ Course catalog with search and filters
- ✅ Course details page
- ✅ Lesson viewer with video/PDF support
- ✅ User dashboard
- ✅ Authentication pages
- ✅ Content protection features

### Security Features
- ✅ JWT authentication
- ✅ Content protection (watermarks, disabled right-click)
- ✅ Premium content access control
- ✅ Rate limiting
- ✅ CORS protection

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/refresh` - Refresh token

### Courses
- `GET /api/courses` - List courses (with pagination and filters)
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (admin only)
- `PUT /api/courses/:id` - Update course (admin only)
- `DELETE /api/courses/:id` - Delete course (admin only)

### Lessons
- `GET /api/lessons/:id` - Get lesson details
- `POST /api/lessons` - Create lesson (admin only)
- `PUT /api/lessons/:id` - Update lesson (admin only)
- `DELETE /api/lessons/:id` - Delete lesson (admin only)
- `POST /api/lessons/:id/progress` - Update lesson progress
- `GET /api/lessons/:id/progress` - Get lesson progress

### Subscriptions
- `GET /api/subscriptions/plans` - Get subscription plans
- `GET /api/subscriptions/my-subscription` - Get user's subscription
- `POST /api/subscriptions/subscribe` - Create subscription
- `POST /api/subscriptions/cancel` - Cancel subscription

## Development

### Backend Development
```bash
cd backend
npm run dev  # Start with hot reload
npm run build  # Build for production
npm run prisma:studio  # Open Prisma Studio
```

### Frontend Development
```bash
cd frontend
npm start  # Start development server
npm run build  # Build for production
npm test  # Run tests
```

## Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

- **User**: User accounts with roles and subscriptions
- **Course**: Educational courses with metadata
- **Lesson**: Individual lessons within courses
- **Department**: Academic departments
- **Subscription**: User subscription plans
- **Progress**: User progress tracking
- **Comment**: Lesson comments

## Deployment

### Backend Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Run database migrations: `npm run prisma:migrate`
4. Start the application: `npm start`

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist/` folder to your hosting provider
3. Update API URLs in production

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/archify?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
CORS_ORIGINS="http://localhost:4200"
PORT=3000
NODE_ENV=development
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Verify database exists

2. **CORS Errors**
   - Add your frontend URL to CORS_ORIGINS
   - Check if backend is running on correct port

3. **Authentication Issues**
   - Clear browser cookies
   - Check JWT secrets in .env
   - Verify user exists in database

4. **Prisma Issues**
   - Run `npm run prisma:generate`
   - Check database connection
   - Verify schema is up to date

## Support

For issues and questions, please check the logs and ensure all prerequisites are installed correctly.
