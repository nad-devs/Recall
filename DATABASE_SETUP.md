# Database Setup Guide

## Quick Start (SQLite - Development)

The easiest way to get started is with SQLite (already configured):

```bash
# 1. Copy environment file
cp env.example .env

# 2. Add your OpenAI API key to .env
# DATABASE_URL is already set to SQLite

# 3. Generate Prisma client and create database
npm run db:generate
npx prisma db push

# 4. (Optional) View your database
npm run db:studio
```

## Production Setup (PostgreSQL)

For production or team use, PostgreSQL is recommended:

### Option 1: Local PostgreSQL

```bash
# 1. Install PostgreSQL locally
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt install postgresql

# 2. Create database
createdb recall_db

# 3. Update .env file
DATABASE_URL="postgresql://username:password@localhost:5432/recall_db"

# 4. Run migrations
npx prisma db push
```

### Option 2: Cloud PostgreSQL (Recommended)

**Free Options:**
- **Neon**: 500MB free tier
- **Supabase**: 500MB free tier  
- **Railway**: PostgreSQL included in free tier

**Paid Options:**
- **DigitalOcean**: $15/month managed database
- **AWS RDS**: $13+/month
- **Google Cloud SQL**: $10+/month

```bash
# 1. Get connection string from your provider
# 2. Update .env file
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# 3. Run migrations
npx prisma db push
```

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Apply schema changes
npx prisma db push

# View database in browser
npm run db:studio

# Reset database (⚠️ DELETES ALL DATA)
npx prisma db push --force-reset
```

## Troubleshooting

**"Database file not found"**
```bash
npx prisma db push
```

**"Prisma client not generated"**
```bash
npm run db:generate
```

**"Connection refused"**
- Check your DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify credentials and database exists

## Backup & Restore

**SQLite Backup:**
```bash
cp prisma/dev.db prisma/dev.db.backup
```

**PostgreSQL Backup:**
```bash
pg_dump $DATABASE_URL > backup.sql
psql $DATABASE_URL < backup.sql
``` 