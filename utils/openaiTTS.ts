// OpenAI TTS Integration
import OpenAI from "openai";

export interface OpenAITTSConfig {
  apiKey: string;
}

export async function generateOpenAITTS(
  text: string,
  voice: string = "alloy", // alloy, echo, fable, onyx, nova, shimmer
  config: OpenAITTSConfig
): Promise<Buffer> {
  if (!config.apiKey) {
    throw new Error("OpenAI API key is required");
  }

  const openai = new OpenAI({ apiKey: config.apiKey });

  try {
    const response = await openai.audio.speech.create({
      model: "tts-1", // or "tts-1-hd" for higher quality
      voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
      response_format: "mp3",
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    throw new Error(`OpenAI TTS error: ${error.message}`);
  }
}

// Available OpenAI TTS voices:
// - alloy: Neutral, clear voice
// - echo: Warm, friendly voice  
// - fable: Expressive, storytelling voice
// - onyx: Deep, authoritative voice
// - nova: Young, energetic voice
// - shimmer: Soft, gentle voice (good for stories)
