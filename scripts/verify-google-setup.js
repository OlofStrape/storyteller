#!/usr/bin/env node

/**
 * Google TTS Setup Verification Script
 * Run with: node scripts/verify-google-setup.js
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

function verifyGoogleSetup() {
  console.log('🔍 Verifying Google TTS setup...\n');

  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentials) {
    console.log('❌ GOOGLE_APPLICATION_CREDENTIALS not found');
    console.log('\n📋 Setup checklist:');
    console.log('   1. Create Google Cloud project');
    console.log('   2. Enable Text-to-Speech API');
    console.log('   3. Create service account with Text-to-Speech Client role');
    console.log('   4. Download JSON key file');
    console.log('   5. Add to .env.local as GOOGLE_APPLICATION_CREDENTIALS');
    console.log('\n📖 See GOOGLE_TTS_SETUP.md for detailed instructions');
    return false;
  }

  console.log('✅ GOOGLE_APPLICATION_CREDENTIALS found');

  try {
    const credentialsObj = JSON.parse(credentials);
    
    // Check required fields
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !credentialsObj[field]);
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }

    console.log('✅ All required fields present');
    console.log(`📋 Project ID: ${credentialsObj.project_id}`);
    console.log(`📧 Service Account: ${credentialsObj.client_email}`);
    console.log(`🔑 Key Type: ${credentialsObj.type}`);

    if (credentialsObj.type !== 'service_account') {
      console.log('⚠️  Warning: Expected type "service_account"');
    }

    console.log('\n🎉 Google TTS setup looks correct!');
    console.log('🧪 Run "node scripts/test-google-tts.js" to test the integration');
    return true;

  } catch (error) {
    console.log('❌ Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Make sure:');
    console.log('   - JSON is on a single line (no line breaks)');
    console.log('   - All quotes are correct (" not " or \')');
    console.log('   - JSON is properly formatted');
    return false;
  }
}

// Run verification
const isValid = verifyGoogleSetup();
process.exit(isValid ? 0 : 1);
