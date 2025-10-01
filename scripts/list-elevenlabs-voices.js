// Script to list all available ElevenLabs voices
// Usage: node scripts/list-elevenlabs-voices.js

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
  console.error('❌ ELEVENLABS_API_KEY not found in .env.local');
  process.exit(1);
}

async function listVoices() {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    console.log('\n🎙️  Available ElevenLabs Voices:\n');
    console.log('═'.repeat(80));
    
    data.voices.forEach(voice => {
      console.log(`\n📢 ${voice.name}`);
      console.log(`   ID: ${voice.voice_id}`);
      console.log(`   Labels: ${JSON.stringify(voice.labels)}`);
      console.log(`   Category: ${voice.category || 'N/A'}`);
      console.log(`   Description: ${voice.description || 'N/A'}`);
      
      // Check if voice supports Swedish
      if (voice.labels && (
        voice.labels.language?.toLowerCase().includes('swedish') ||
        voice.labels.accent?.toLowerCase().includes('swedish') ||
        voice.labels.description?.toLowerCase().includes('swedish')
      )) {
        console.log('   🇸🇪 SUPPORTS SWEDISH!');
      }
      
      console.log('─'.repeat(80));
    });
    
    console.log('\n\n🔍 How to use a voice:');
    console.log('Copy the voice_id and update the elevenLabsVoiceMap in:');
    console.log('  app/api/tts/route.ts\n');
    
    console.log('💡 Recommended for Swedish stories:');
    console.log('Look for voices with:');
    console.log('  - Swedish language support');
    console.log('  - "narrative" or "storytelling" in labels');
    console.log('  - Female voices with warm, gentle characteristics');
    console.log('  - Male voices with calm, soothing characteristics\n');
    
  } catch (error) {
    console.error('❌ Error fetching voices:', error.message);
    process.exit(1);
  }
}

listVoices();

