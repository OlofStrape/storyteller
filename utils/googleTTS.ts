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
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not configured");
  }
  
  // Parse credentials (they can be a file path or JSON string)
  let credentialsObj;
  try {
    // Clean up the credentials string - remove any extra whitespace or newlines
    const cleanCredentials = credentials.trim().replace(/\n/g, '').replace(/\r/g, '');
    credentialsObj = JSON.parse(cleanCredentials);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    console.error("Credentials string:", credentials.substring(0, 100) + "...");
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS must be a valid JSON string");
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
    "alloy": "sv-SE-Wavenet-A",
    "echo": "sv-SE-Wavenet-B",
    "fable": "sv-SE-Wavenet-C",
    "onyx": "sv-SE-Wavenet-D",
    "nova": "sv-SE-Wavenet-E",
    "shimmer": "sv-SE-Wavenet-A",
    // Google-specific voices
    "sv-SE-Wavenet-A": "sv-SE-Wavenet-A", // Female
    "sv-SE-Wavenet-B": "sv-SE-Wavenet-B", // Female
    "sv-SE-Wavenet-C": "sv-SE-Wavenet-C", // Female
    "sv-SE-Wavenet-D": "sv-SE-Wavenet-D", // Male
    "sv-SE-Wavenet-E": "sv-SE-Wavenet-E", // Male
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

