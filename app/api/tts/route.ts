import { NextResponse } from "next/server";
import { openai, ensureEnv } from "@/utils/openai";
import { generateAzureSpeech } from "@/utils/azureSpeech";
import { generateElevenLabsSpeech } from "@/utils/elevenLabs";
import { generateGoogleTTS } from "@/utils/googleTTS";
import { 
  getUserTTSInfoFromCookies, 
  determineTTSProvider, 
  updateUserUsageStats,
  getGoogleVoiceForProvider,
  getElevenLabsVoice,
  getMaxElevenLabsForTier,
  getMaxWeeklyStoriesForTier,
  TTSDecision
} from "@/utils/ttsTiers";

export async function POST(req: Request) {
  const { text, voice = "shimmer", rate = 1.0, pitch = 1.0, volume = 1.0, download = false, provider = "auto", upgradeToElevenLabs = false } = await req.json();
  
  try {
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

    // Enhanced text preprocessing for better TTS
    const processedText = text
      .replace(/([.!?])\s+/g, '$1 ') // Add slight pauses
      .replace(/\.\.\./g, '. . . ') // Slow down ellipses
      .replace(/([a-z])([A-Z])/g, '$1. $2') // Add pauses between sentences
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Get user's TTS info from cookies
    const cookieHeader = req.headers.get("cookie") || "";
    const userTTSInfo = getUserTTSInfoFromCookies(cookieHeader);
    
    // Determine which TTS provider to use
    let ttsDecision: TTSDecision;
    
    // Determine which TTS provider to use
    if (provider !== "auto") {
      // User specified a provider manually (for testing/development)
      let mappedProvider: 'elevenlabs' | 'google-wavenet' | 'google-standard';
      
      if (provider === "google") {
        mappedProvider = "google-wavenet"; // Default to high-quality Google TTS
      } else if (provider === "elevenlabs") {
        mappedProvider = "elevenlabs";
      } else {
        mappedProvider = provider as 'elevenlabs' | 'google-wavenet' | 'google-standard';
      }
      
      ttsDecision = {
        provider: mappedProvider,
        reason: 'Manuellt vald provider',
        canUpgrade: true,
        upgradePrice: 3
      };
    } else {
      // Auto-determine based on user tier and usage
      ttsDecision = determineTTSProvider(userTTSInfo);
    }
    
    // Override with upgrade if requested
    if (upgradeToElevenLabs && ttsDecision.canUpgrade) {
      ttsDecision = {
        provider: 'elevenlabs',
        reason: 'Användare valde att uppgradera till Magisk röst för 5 kr',
        canUpgrade: false,
        upgradePrice: 5
      };
    }

    let buffer: Buffer;
    let contentType = "audio/mpeg";

    // Generate TTS based on determined provider
    if (ttsDecision.provider === "elevenlabs") {
      // ElevenLabs API - Premium quality voices
      const elevenLabsConfig = {
        apiKey: process.env.ELEVENLABS_API_KEY || ""
      };
      
      if (!elevenLabsConfig.apiKey) {
        return NextResponse.json({ error: "ElevenLabs API not configured. Please add ELEVENLABS_API_KEY to environment variables." }, { status: 501 });
      }
      
      const elevenLabsVoice = getElevenLabsVoice(voice);
      
      try {
        buffer = await generateElevenLabsSpeech(processedText, elevenLabsVoice, elevenLabsConfig);
      } catch (error: any) {
        console.error("ElevenLabs Error:", error);
        return NextResponse.json({ error: error.message || "ElevenLabs TTS failed" }, { status: 500 });
      }
    } else if (ttsDecision.provider === "google-wavenet" || ttsDecision.provider === "google-standard") {
      // Google Cloud Text-to-Speech - Swedish voices with different quality levels
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return NextResponse.json({ error: "Google TTS not configured" }, { status: 501 });
      }
      
      try {
        const googleVoice = getGoogleVoiceForProvider(ttsDecision.provider, voice);
        const arrayBuffer = await generateGoogleTTS(processedText, googleVoice, rate);
        buffer = Buffer.from(arrayBuffer);
      } catch (error: any) {
        console.error("Google TTS Error:", error);
        return NextResponse.json({ error: error.message || "Google TTS failed" }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "Unknown TTS provider" }, { status: 400 });
    }

    // Update user usage statistics
    const updatedUserInfo = updateUserUsageStats(userTTSInfo, ttsDecision.provider);
    
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      // Add TTS decision info to headers for client-side processing
      "X-TTS-Provider": ttsDecision.provider,
      "X-TTS-Reason": ttsDecision.reason,
      "X-Can-Upgrade": ttsDecision.canUpgrade.toString(),
      "X-Upgrade-Price": ttsDecision.upgradePrice.toString(),
      "X-ElevenLabs-Remaining": (userTTSInfo.maxElevenLabsFree - updatedUserInfo.elevenLabsStoriesUsed).toString(),
      "X-Stories-Generated": updatedUserInfo.storiesGenerated.toString(),
      "X-Weekly-Stories-Remaining": (userTTSInfo.maxWeeklyStories - updatedUserInfo.weeklyStoriesGenerated).toString(),
      "X-User-Tier": userTTSInfo.tier,
      "X-Max-Weekly-Stories": userTTSInfo.maxWeeklyStories.toString()
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


