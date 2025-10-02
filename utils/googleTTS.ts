// Google Cloud Text-to-Speech integration
// https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize

import { GoogleAuth } from 'google-auth-library';

export async function generateGoogleTTS(
  text: string,
  voice: string = "sv-SE-Wavenet-A",
  rate: number = 1.0
): Promise<ArrayBuffer> {
  // Check for service account credentials
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!credentials) {
    throw new Error("Google TTS not configured. Please set GOOGLE_APPLICATION_CREDENTIALS environment variable with your service account JSON.");
  }
  
  // Parse credentials (expecting JSON string from environment variable)
  let credentialsObj;
  try {
    // Parse as JSON string from environment variable
    const cleanCredentials = credentials.trim().replace(/\n/g, '').replace(/\r/g, '');
    credentialsObj = JSON.parse(cleanCredentials);
  } catch (e) {
    console.error("Google TTS Credentials Error:", e);
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS must be a valid JSON string. Please paste your service account JSON content directly into the environment variable.");
  }
  
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

  // Map common voice names to Google voices
  const voiceMap: Record<string, string> = {
    // Bästa svenska WaveNet-röster
    "shimmer": "sv-SE-Wavenet-A", // Astrid - Kvinna, naturlig & varm (BÄST för sagor)
    "nova": "sv-SE-Wavenet-E",    // Erik - Man, varm & berättande (BÄST för sagor)
    "echo": "sv-SE-Wavenet-B",    // Elin - Kvinna, mjuk & lugn
    "alloy": "sv-SE-Wavenet-A",   // Astrid - Kvinna, naturlig (samma som shimmer)
    "fable": "sv-SE-Wavenet-C",   // Anna - Kvinna, ung & energisk
    "onyx": "sv-SE-Wavenet-D",    // Nils - Man, djup & lugn
    
    // Direkta Google-röstval
    "astrid": "sv-SE-Wavenet-A",  // Kvinna, naturlig & klar
    "elin": "sv-SE-Wavenet-B",    // Kvinna, mjuk & vänlig
    "anna": "sv-SE-Wavenet-C",    // Kvinna, ung & energisk
    "nils": "sv-SE-Wavenet-D",    // Man, djup & behaglig
    "erik": "sv-SE-Wavenet-E",    // Man, varm & berättande
    
    // Google-specific voices (direct mapping)
    "sv-SE-Wavenet-A": "sv-SE-Wavenet-A", // Astrid - Female, natural
    "sv-SE-Wavenet-B": "sv-SE-Wavenet-B", // Elin - Female, soft
    "sv-SE-Wavenet-C": "sv-SE-Wavenet-C", // Anna - Female, energetic
    "sv-SE-Wavenet-D": "sv-SE-Wavenet-D", // Nils - Male, deep
    "sv-SE-Wavenet-E": "sv-SE-Wavenet-E", // Erik - Male, warm
  };

  const googleVoice = voiceMap[voice] || "sv-SE-Wavenet-A";

  // Preprocess text for better TTS
  let processedText = text
    .replace(/\.\.\./g, '... ') // Add space after ellipsis
    .replace(/([.!?])\s*([A-ZÅÄÖ])/g, '$1 $2') // Ensure space after sentence end
    .replace(/,\s*/g, ', ') // Space after comma
    .trim();

  const requestBody = {
    input: {
      text: processedText
    },
    voice: {
      languageCode: "sv-SE",
      name: googleVoice
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: Math.max(0.25, Math.min(4.0, rate)),
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

  // Convert base64 to ArrayBuffer
  const base64Audio = data.audioContent;
  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

