const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSessions() {
  try {
    console.log('🔍 Testing session storage...');
    
    // Get all sessions
    const sessions = await prisma.session.findMany({
      include: {
        onlineAccessInfo: {
          include: {
            associatedUser: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${sessions.length} sessions in database:`);
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session.id}`);
      console.log(`   Shop: ${session.shop}`);
      console.log(`   Online: ${session.isOnline}`);
      console.log(`   Has Access Token: ${!!session.accessToken}`);
      console.log(`   Scope: ${session.scope}`);
      console.log(`   Expires: ${session.expires}`);
      console.log(`   Created: ${session.createdAt}`);
      console.log('   ---');
    });
    
    // Check for offline sessions specifically
    const offlineSessions = sessions.filter(s => !s.isOnline);
    console.log(`🔑 Offline sessions: ${offlineSessions.length}`);
    
    const onlineSessions = sessions.filter(s => s.isOnline);
    console.log(`🌐 Online sessions: ${onlineSessions.length}`);
    
  } catch (error) {
    console.error('❌ Error testing sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSessions(); 