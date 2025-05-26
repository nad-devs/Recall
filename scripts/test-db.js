#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🔍 Testing database connectivity...');
  
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Check conversations
    const conversationCount = await prisma.conversation.count();
    console.log(`📚 Conversations: ${conversationCount}`);
    
    // Check concepts
    const conceptCount = await prisma.concept.count();
    console.log(`🧠 Concepts: ${conceptCount}`);
    
    // Check categories
    const categoryCount = await prisma.category.count();
    console.log(`📂 Categories: ${categoryCount}`);
    
    // Try to fetch a few conversations
    const conversations = await prisma.conversation.findMany({
      take: 3,
      include: {
        concepts: true
      }
    });
    console.log(`📖 Sample conversations: ${conversations.length}`);
    
    // Try to fetch a few concepts
    const concepts = await prisma.concept.findMany({
      take: 3
    });
    console.log(`🎯 Sample concepts: ${concepts.length}`);
    
    console.log('🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 