const { EmailService } = require('./dist/services/email.service');

async function testEmail() {
  console.log('🧪 Testing email service...');
  
  const emailService = new EmailService();
  
  try {
    await emailService.sendPasswordResetEmail('test@example.com', 'test123456');
    console.log('✅ Email test completed');
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

testEmail();
