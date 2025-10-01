// ElevenLabs TTS
export interface ElevenLabsConfig {
  apiKey: string;
}

export async function generateElevenLabsSpeech(
  text: string,
  voiceId: string = "pNInz6obpgDQGcFmaJgB", // Adam (good for stories)
  config: ElevenLabsConfig
): Promise<Buffer> {
  if (!config.apiKey) {
    throw new Error("ElevenLabs API key is required");
  }

  // ElevenLabs API endpoint
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": config.apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2", // Supports Swedish
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Best ElevenLabs voices for children's stories:
// pNInz6obpgDQGcFmaJgB - Adam (male, natural, warm)
// EXAVITQu4vr4xnSDxMaL - Bella (female, warm, soothing)
// VR6AewLTigWG4xSOukaG - Arnold (male, deep, storyteller)
// 2EiwWnXFnvU5JabPnv8n - Clyde (male, friendly, young)
// ThT5KcBeYPX3keUQqHPh - Dorothy (female, gentle, wise)
// XrExE9yKIg1WjnnlVkGX - Matilda (female, warm, nurturing)
