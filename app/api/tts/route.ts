import { NextResponse } from "next/server";
import { openai, ensureEnv } from "@/utils/openai";
import { generateAzureSpeech } from "@/utils/azureSpeech";
import { generateElevenLabsSpeech } from "@/utils/elevenLabs";

export async function POST(req: Request) {
  try {
    const { text, voice = "shimmer", rate = 1.0, pitch = 1.0, volume = 1.0, download = false, provider = "openai" } = await req.json();
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

    // Enhanced text preprocessing for better TTS
    const processedText = text
      .replace(/([.!?])\s+/g, '$1 ') // Add slight pauses
      .replace(/\.\.\./g, '. . . ') // Slow down ellipses
      .replace(/([a-z])([A-Z])/g, '$1. $2') // Add pauses between sentences
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    let buffer: Buffer;
    let contentType = "audio/mpeg";

    if (provider === "openai") {
      ensureEnv();
      const speech = await openai.audio.speech.create({
        model: "tts-1-hd", // Use HD model for better quality
        voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
        input: processedText,
        speed: Math.max(0.25, Math.min(4.0, rate)), // Clamp speed between 0.25x and 4.0x
      });
      buffer = Buffer.from(await speech.arrayBuffer());
    } else if (provider === "azure") {
      // Azure Speech Service
      const azureConfig = {
        apiKey: process.env.AZURE_SPEECH_KEY || "",
        region: process.env.AZURE_SPEECH_REGION || "swedencentral"
      };
      
      if (!azureConfig.apiKey) {
        return NextResponse.json({ error: "Azure Speech Service not configured" }, { status: 501 });
      }
      
      // Map OpenAI voices to Azure voices
      const azureVoiceMap: Record<string, string> = {
        "shimmer": "sv-SE-HedvigNeural", // Swedish female, natural
        "nova": "sv-SE-SofieNeural",     // Swedish female, young
        "echo": "sv-SE-MattiasNeural",   // Swedish male, natural
        "alloy": "sv-SE-HedvigNeural",   // Default to Swedish
        "fable": "sv-SE-MattiasNeural",  // Male for storytelling
        "onyx": "sv-SE-MattiasNeural"    // Male, deep
      };
      
      const azureVoice = azureVoiceMap[voice] || "sv-SE-HedvigNeural";
      buffer = await generateAzureSpeech(processedText, azureVoice, rate, azureConfig);
    } else if (provider === "elevenlabs") {
      // ElevenLabs API
      const elevenLabsConfig = {
        apiKey: process.env.ELEVENLABS_API_KEY || ""
      };
      
      if (!elevenLabsConfig.apiKey) {
        return NextResponse.json({ error: "ElevenLabs API not configured" }, { status: 501 });
      }
      
      // Map OpenAI voices to ElevenLabs voices
      const elevenLabsVoiceMap: Record<string, string> = {
        "shimmer": "EXAVITQu4vr4xnSDxMaL", // Bella (female, warm)
        "nova": "EXAVITQu4vr4xnSDxMaL",    // Bella (female, warm)
        "echo": "pNInz6obpgDQGcFmaJgB",    // Adam (male, natural)
        "alloy": "EXAVITQu4vr4xnSDxMaL",   // Default to Bella
        "fable": "pNInz6obpgDQGcFmaJgB",   // Adam for storytelling
        "onyx": "VR6AewLTigWG4xSOukaG"     // Arnold (male, deep)
      };
      
      const elevenLabsVoice = elevenLabsVoiceMap[voice] || "EXAVITQu4vr4xnSDxMaL";
      buffer = await generateElevenLabsSpeech(processedText, elevenLabsVoice, elevenLabsConfig);
    } else {
      return NextResponse.json({ error: "Unknown TTS provider" }, { status: 400 });
    }

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable"
    };
    if (download) {
      headers["Content-Disposition"] = `attachment; filename="dromlyktan-${Date.now()}.mp3"`;
    }
    return new NextResponse(buffer, { headers });
  } catch (e: any) {
    console.error("TTS Error:", e);
    return NextResponse.json({ error: e?.message || "TTS generation failed" }, { status: 500 });
  }
}


