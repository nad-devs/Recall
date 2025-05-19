import { PrismaClient } from '@prisma/client'
import path from 'path'

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`
      }
    }
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = global.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma 