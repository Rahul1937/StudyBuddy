# Database Setup Guide for StudyBuddy

This guide will help you set up a PostgreSQL database for your StudyBuddy application.

## Option 1: Supabase (Recommended - Free & Easy) ⭐

Supabase offers a free PostgreSQL database that's perfect for development.

### Steps:

1. **Sign up for Supabase**
   - Go to https://supabase.com
   - Click "Start your project"
   - Sign up with GitHub (easiest) or email

2. **Create a New Project**
   - Click "New Project"
   - Choose your organization
   - Fill in:
     - **Project Name**: `studybuddy` (or any name)
     - **Database Password**: Create a strong password (save it!)
     - **Region**: Choose closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for setup

3. **Get Your Database URL**
   - Go to your project dashboard
   - Click on **Settings** (gear icon) in the sidebar
   - Click on **Database** in the settings menu
   - Scroll down to **Connection string**
   - Select **URI** tab
   - Copy the connection string
   - It will look like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with the password you created

4. **Update your .env file**
   ```env
   DATABASE_URL="postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres"
   ```

---

## Option 2: Vercel Postgres (If deploying to Vercel)

If you plan to deploy to Vercel, you can use their integrated Postgres.

### Steps:

1. **In Vercel Dashboard**
   - Go to your project
   - Click on **Storage** tab
   - Click **Create Database**
   - Select **Postgres**
   - Choose a name and region
   - Click **Create**

2. **Get Connection String**
   - After creation, go to **Storage** → Your database
   - Click on **.env.local** tab
   - Copy the `POSTGRES_URL` value
   - Use it as `DATABASE_URL` in your `.env` file

---

## Option 3: Local PostgreSQL

If you have PostgreSQL installed locally:

### Steps:

1. **Install PostgreSQL** (if not installed)
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql` or download installer
   - Linux: `sudo apt-get install postgresql` (Ubuntu/Debian)

2. **Create Database**
   ```bash
   # Start PostgreSQL service
   # Windows: Services → Start PostgreSQL
   # Mac/Linux: sudo service postgresql start

   # Connect to PostgreSQL
   psql -U postgres

   # Create database
   CREATE DATABASE studybuddy;

   # Create user (optional)
   CREATE USER studybuddy_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE studybuddy TO studybuddy_user;

   # Exit
   \q
   ```

3. **Connection String Format**
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/studybuddy?schema=public"
   ```
   Or with custom user:
   ```env
   DATABASE_URL="postgresql://studybuddy_user:your_password@localhost:5432/studybuddy?schema=public"
   ```

---

## Option 4: Other Cloud Providers

### Railway (Free tier available)
1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project → Add PostgreSQL
4. Copy the connection string from the Variables tab

### Neon (Free tier available)
1. Go to https://neon.tech
2. Sign up and create a project
3. Copy the connection string from dashboard

### Render (Free tier available)
1. Go to https://render.com
2. Create new PostgreSQL database
3. Copy the connection string

---

## After Getting Your Database URL

1. **Add to .env file:**
   ```env
   DATABASE_URL="your-connection-string-here"
   ```

2. **Push Prisma schema to database:**
   ```bash
   npx prisma db push
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Verify connection (optional):**
   ```bash
   npx prisma studio
   ```
   This opens a GUI to view your database.

---

## Quick Start Recommendation

**For beginners**: Use **Supabase** (Option 1)
- Free tier is generous
- Easy setup (5 minutes)
- No local installation needed
- Works great for development and production

**For production**: Use **Vercel Postgres** if deploying to Vercel
- Integrated with Vercel
- Automatic backups
- Easy scaling

---

## Troubleshooting

### Connection refused
- Check if database is running (for local)
- Verify connection string is correct
- Check firewall/network settings

### Authentication failed
- Verify username and password
- Check if user has proper permissions

### SSL required
Some cloud providers require SSL. Add `?sslmode=require` to your connection string:
```
DATABASE_URL="postgresql://...?sslmode=require"
```

