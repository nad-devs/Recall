#!/usr/bin/env node

/**
 * Database Fix Script for Recall
 * Adds default userId to existing conversations and concepts
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDatabase() {
  console.log('🔧 Starting database fix...');
  
  try {
    // Check if we have conversations without userId
    const conversationsWithoutUser = await prisma.conversation.findMany({
      where: {
        OR: [
          { userId: null },
          { userId: undefined }
        ]
      }
    });
    
    console.log(`Found ${conversationsWithoutUser.length} conversations without userId`);
    
    // Update conversations to have a default userId
    if (conversationsWithoutUser.length > 0) {
      const updateResult = await prisma.conversation.updateMany({
        where: {
          OR: [
            { userId: null },
            { userId: undefined }
          ]
        },
        data: {
          userId: 'default-user' // Default user ID for open source version
        }
      });
      
      console.log(`✅ Updated ${updateResult.count} conversations with default userId`);
    }
    
    // Check if we have concepts without userId
    const conceptsWithoutUser = await prisma.concept.findMany({
      where: {
        OR: [
          { userId: null },
          { userId: undefined }
        ]
      }
    });
    
    console.log(`Found ${conceptsWithoutUser.length} concepts without userId`);
    
    // Update concepts to have a default userId
    if (conceptsWithoutUser.length > 0) {
      const updateResult = await prisma.concept.updateMany({
        where: {
          OR: [
            { userId: null },
            { userId: undefined }
          ]
        },
        data: {
          userId: 'default-user' // Default user ID for open source version
        }
      });
      
      console.log(`✅ Updated ${updateResult.count} concepts with default userId`);
    }
    
    // Create a default user if it doesn't exist
    try {
      await prisma.user.upsert({
        where: { id: 'default-user' },
        update: {},
        create: {
          id: 'default-user',
          email: 'user@localhost',
          name: 'Default User'
        }
      });
      console.log('✅ Default user created/updated');
    } catch (error) {
      console.log('ℹ️  Default user already exists or user table not needed');
    }
    
    console.log('🎉 Database fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    
    // If the error is about missing columns, it means the schema wasn't applied
    if (error.message.includes('does not exist')) {
      console.log('💡 Try running: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabase(); 