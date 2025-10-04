# Archify Setup - Without Docker

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher) - **Install locally**

## Step 1: Install PostgreSQL

### Windows Installation:

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 16 for Windows
   - Run the installer

2. **During Installation:**
   - Set password for `postgres` user (remember this password!)
   - Default port: 5432
   - Default database: postgres

3. **Verify Installation:**
   ```bash
   psql --version
   ```

## Step 2: Create Database

1. **Open Command Prompt as Administrator**
2. **Connect to PostgreSQL:**
   ```bash
   psql -U postgres
   ```

3. **Create the database:**
   ```sql
   CREATE DATABASE archify;
   \q
   ```

## Step 3: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
copy .env.example .env
```

4. **Edit the .env file:**
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/archify?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
   CORS_ORIGINS="http://localhost:4200,http://127.0.0.1:4200"
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=info
   ```

5. **Run database setup:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate

   # Seed the database
   npm run seed

   # Start the backend
   npm run dev
   ```

## Step 4: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend
npm start
```

## Step 5: Access the Application

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

## Test Accounts

After running the seed script:

- **Admin**: admin@archify.ma / admin123
- **Student**: student@archify.ma / student123

## Troubleshooting

### If you get "psql is not recognized":
1. Add PostgreSQL to your PATH:
   - Find PostgreSQL installation (usually `C:\Program Files\PostgreSQL\16\bin`)
   - Add this path to your Windows PATH environment variable
   - Restart Command Prompt

### If you get database connection errors:
1. Check if PostgreSQL service is running:
   - Open Services (services.msc)
   - Find "postgresql" service
   - Make sure it's running

2. Verify your DATABASE_URL in .env file
3. Check if the password is correct

### Alternative: Use pgAdmin
If command line doesn't work, use pgAdmin (installed with PostgreSQL):
1. Open pgAdmin
2. Connect to localhost
3. Right-click "Databases" → "Create" → "Database"
4. Name it "archify"
