// Google Cloud Text-to-Speech integration
// https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize

export async function generateGoogleTTS(
  text: string,
  voice: string = "sv-SE-Wavenet-A",
  rate: number = 1.0
): Promise<ArrayBuffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  
  if (!apiKey) {
    throw new Error("GOOGLE_TTS_API_KEY is not configured");
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

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

