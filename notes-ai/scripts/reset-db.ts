import { PrismaClient } from '@prisma/client'

async function resetDatabase() {
  try {
    const prisma = new PrismaClient()
    
    console.log('🗑️  Deleting all data from the database...')
    
    // Delete in reverse order to avoid foreign key constraints
    console.log('Deleting code snippets...')
    await prisma.codeSnippet.deleteMany({})
    
    console.log('Deleting occurrences...')
    await prisma.occurrence.deleteMany({})
    
    console.log('Deleting concepts...')
    await prisma.concept.deleteMany({})
    
    console.log('Deleting conversations...')
    await prisma.conversation.deleteMany({})
    
    console.log('Deleting categories...')
    await prisma.category.deleteMany({})
    
    console.log('✅ Database reset completed successfully!')
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Error resetting database:', error)
    process.exit(1)
  }
}

resetDatabase() 