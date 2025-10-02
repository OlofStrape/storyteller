#!/usr/bin/env node

/**
 * Simple test script for Google TTS integration
 * Run with: node scripts/test-google-tts.js
 */

import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGoogleTTS() {
  console.log('🧪 Testing Google TTS integration...\n');

  // Check if credentials are configured
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not found in environment variables');
    console.log('📝 Please add your service account JSON to .env.local:');
    console.log('   GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}');
    process.exit(1);
  }

  console.log('✅ Google TTS credentials found');

  try {
    // Parse credentials
    const credentialsObj = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    
    // Create auth client
    const auth = new GoogleAuth({
      credentials: credentialsObj,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error("Failed to get access token from Google");
    }

    // Test with a simple Swedish text
    const testText = "Hej! Detta är en test av Google Text-to-Speech. Drömlyktan fungerar bra!";
    const testVoice = "sv-SE-Wavenet-A";
    const testRate = 1.0;

    console.log(`📝 Test text: "${testText}"`);
    console.log(`🎵 Test voice: ${testVoice}`);
    console.log(`⚡ Test rate: ${testRate}`);
    console.log('\n🔄 Generating audio...');

    const startTime = Date.now();

    // Preprocess text for better TTS
    const processedText = testText
      .replace(/\.\.\./g, '... ')
      .replace(/([.!?])\s*([A-ZÅÄÖ])/g, '$1 $2')
      .replace(/,\s*/g, ', ')
      .trim();

    const requestBody = {
      input: {
        text: processedText
      },
      voice: {
        languageCode: "sv-SE",
        name: testVoice
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: Math.max(0.25, Math.min(4.0, testRate)),
        pitch: 0,
        volumeGainDb: 0
      }
    };

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken.token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google TTS API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.audioContent) {
      throw new Error("No audio content in Google TTS response");
    }

    // Convert base64 to Buffer
    const base64Audio = data.audioContent;
    const binaryString = Buffer.from(base64Audio, 'base64');
    const endTime = Date.now();

    console.log(`✅ Audio generated successfully!`);
    console.log(`📊 Audio size: ${binaryString.length} bytes`);
    console.log(`⏱️  Generation time: ${endTime - startTime}ms`);

    // Save test audio file
    const testFileName = `test-google-tts-${Date.now()}.mp3`;
    fs.writeFileSync(testFileName, binaryString);
    console.log(`💾 Test audio saved as: ${testFileName}`);

    console.log('\n🎉 Google TTS integration test completed successfully!');
    console.log('🔊 You can play the generated audio file to verify quality.');

  } catch (error) {
    console.error('❌ Google TTS test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('Credentials')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   - Make sure your JSON is valid (no line breaks)');
      console.log('   - Check that all quotes are correct (" not " or \')');
      console.log('   - Verify the service account has Text-to-Speech permissions');
    }
    
    process.exit(1);
  }
}

// Run the test
testGoogleTTS().catch(console.error);
