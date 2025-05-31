const { PrismaClient } = require('@prisma/client');

// Since this is a CommonJS file, let's test directly with our database
async function testSessionStorage() {
  console.log('🔍 Testing session storage with direct database approach...');
  
  try {
    const prisma = new PrismaClient();
    
    // Test basic database connectivity
    console.log('🔍 Testing database connection...');
    const testConnection = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection works:', testConnection);
    
    // Get the API key from environment
    const apiKey = process.env.SHOPIFY_API_KEY || '49e6ec7fb69ed11a4e11f2d7231d6ea5';
    console.log('🔍 Using API key:', apiKey);
    
    // Try to create a session directly in the database
    console.log('🔍 Creating test session directly in database...');
    const testSession = await prisma.session.create({
      data: {
        id: 'test_session_direct',
        shop: 'petcocolulu.myshopify.com',
        state: 'test_state',
        isOnline: false,
        accessToken: 'test_token_123',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        scope: 'read_customers,read_products,write_orders',
        apiKey: apiKey,
      }
    });
    
    console.log('✅ Test session created:', testSession);
    
    // Check if session was stored
    const sessions = await prisma.session.findMany();
    console.log(`📊 Found ${sessions.length} sessions in database after test`);
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session.id}`);
      console.log(`   Shop: ${session.shop}`);
      console.log(`   Online: ${session.isOnline}`);
      console.log(`   Has Access Token: ${!!session.accessToken}`);
      console.log(`   API Key: ${session.apiKey}`);
    });
    
    // Clean up test session
    await prisma.session.delete({
      where: { id: 'test_session_direct' }
    });
    console.log('🧹 Test session cleaned up');
    
    await prisma.$disconnect();
    
    console.log('✅ Direct database session storage test completed successfully!');
    
  } catch (error) {
    console.error('❌ Direct session storage test failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

testSessionStorage(); 