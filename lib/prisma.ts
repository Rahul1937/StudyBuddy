import { PrismaClient } from '@prisma/client'

// Global singleton pattern to prevent multiple Prisma Client instances
// This is critical for connection pooling and preventing "too many clients" errors
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Get database URL - prefer connection pooler if available
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  // Check if pooler URL is provided separately (recommended for Supabase)
  const poolerUrl = process.env.DATABASE_POOLER_URL
  if (poolerUrl) {
    return poolerUrl
  }
  
  // If using Supabase and no pooler URL, try to use pooler port
  if (dbUrl.includes('supabase.co') && !dbUrl.includes('?pgbouncer=true')) {
    // Replace port 5432 with 6543 (Supabase connection pooler)
    const poolerUrl = dbUrl.replace(':5432/', ':6543/')
    // Add pgbouncer parameter if not present
    return poolerUrl.includes('?') 
      ? poolerUrl + '&pgbouncer=true'
      : poolerUrl + '?pgbouncer=true'
  }
  
  // For other providers, use as-is
  // Connection pooling is handled by Prisma Client internally
  return dbUrl
}

// Create or reuse Prisma Client instance
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

// Store in global to reuse across all environments (dev, production, serverless)
// This ensures only ONE Prisma Client instance exists
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

// Handle graceful shutdown to properly close connections
if (typeof process !== 'undefined') {
  const disconnect = async () => {
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('Error disconnecting Prisma:', error)
    }
  }

  process.on('beforeExit', disconnect)
  process.on('SIGINT', async () => {
    await disconnect()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await disconnect()
    process.exit(0)
  })
}

