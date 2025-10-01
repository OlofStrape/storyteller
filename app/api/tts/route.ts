import { NextResponse } from "next/server";
import { openai, ensureEnv } from "@/utils/openai";
import { generateAzureSpeech } from "@/utils/azureSpeech";
import { generateElevenLabsSpeech } from "@/utils/elevenLabs";

export async function POST(req: Request) {
  const { text, voice = "shimmer", rate = 1.0, pitch = 1.0, volume = 1.0, download = false, provider = "openai" } = await req.json();
  
  try {
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
      // ElevenLabs API - Premium quality voices
      const elevenLabsConfig = {
        apiKey: process.env.ELEVENLABS_API_KEY || ""
      };
      
      if (!elevenLabsConfig.apiKey) {
        return NextResponse.json({ error: "ElevenLabs API not configured. Please add ELEVENLABS_API_KEY to environment variables." }, { status: 501 });
      }
      
      // Map OpenAI voices to ElevenLabs voices (Swedish voices)
      const elevenLabsVoiceMap: Record<string, string> = {
        "shimmer": "4Ct5uMEndw4cJ7q0Jx0l", // Swedish voice 1 - Soft & warm
        "nova": "kkwvaJeTPw4KK0sBdyvD",    // Swedish voice 2 - Young & gentle
        "echo": "aSLKtNoVBZlxQEMsnGL2",    // Swedish voice 3 - Natural & calm
        "alloy": "4Ct5uMEndw4cJ7q0Jx0l",   // Default to voice 1
        "fable": "aSLKtNoVBZlxQEMsnGL2",   // Natural storytelling
        "onyx": "aSLKtNoVBZlxQEMsnGL2"     // Deep & soothing
      };
      
      const elevenLabsVoice = elevenLabsVoiceMap[voice] || "4Ct5uMEndw4cJ7q0Jx0l";
      
      try {
        buffer = await generateElevenLabsSpeech(processedText, elevenLabsVoice, elevenLabsConfig);
      } catch (error: any) {
        console.error("ElevenLabs Error:", error);
        return NextResponse.json({ error: error.message || "ElevenLabs TTS failed" }, { status: 500 });
      }
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
    return NextResponse.json({ 
      error: e?.message || "TTS generation failed",
      provider: provider,
      voice: voice,
      details: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 });
  }
}


