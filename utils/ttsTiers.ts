// TTS Tier Management System
// Hanterar vilken TTS-provider som ska användas baserat på användarens tier och användningshistorik

export interface UserTTSInfo {
  tier: 'free' | 'plus' | 'premium';
  storiesGenerated: number;
  elevenLabsStoriesUsed: number;
  maxElevenLabsFree: number;
}

export interface TTSDecision {
  provider: 'elevenlabs' | 'google-wavenet' | 'google-standard';
  reason: string;
  canUpgrade: boolean;
  upgradePrice: number;
}

/**
 * Bestämmer vilken TTS-provider som ska användas baserat på användarens tier och användning
 */
export function determineTTSProvider(userInfo: UserTTSInfo): TTSDecision {
  const { tier, storiesGenerated, elevenLabsStoriesUsed, maxElevenLabsFree } = userInfo;

  // Premium användare får alltid ElevenLabs
  if (tier === 'premium') {
    return {
      provider: 'elevenlabs',
      reason: 'Premium tier inkluderar ElevenLabs för alla sagor',
      canUpgrade: false,
      upgradePrice: 0
    };
  }

  // Gratis användare: 3 första sagorna med ElevenLabs, sedan Google Standard
  if (tier === 'free') {
    if (elevenLabsStoriesUsed < maxElevenLabsFree) {
      return {
        provider: 'elevenlabs',
        reason: `Du har ${maxElevenLabsFree - elevenLabsStoriesUsed} Magiska röster kvar (av ${maxElevenLabsFree} gratis)`,
        canUpgrade: false,
        upgradePrice: 0
      };
    } else {
      return {
        provider: 'google-standard',
        reason: 'Du har använt dina gratis Magiska röster. Uppgradera för Magisk röst.',
        canUpgrade: true,
        upgradePrice: 5
      };
    }
  }

  // Plus användare: Google Wavenet (högre kvalitet än Standard)
  if (tier === 'plus') {
    return {
      provider: 'google-wavenet',
      reason: 'Plus tier inkluderar Premiumröst (högre kvalitet)',
      canUpgrade: true,
      upgradePrice: 5
    };
  }

  // Fallback
  return {
    provider: 'google-standard',
    reason: 'Standardröst',
    canUpgrade: true,
    upgradePrice: 5
  };
}

/**
 * Hämtar användarens TTS-info från cookies
 */
export function getUserTTSInfoFromCookies(cookieHeader: string): UserTTSInfo {
  const cookies = cookieHeader.toLowerCase();
  
  // Kontrollera premium status
  const hasPremium = /(?:^|;\s*)premium=1(?:;|$)/.test(cookies);
  const tierMatch = cookies.match(/premium_tier=([^;]+)/);
  const tier = tierMatch ? tierMatch[1] as 'free' | 'plus' | 'premium' : 'free';
  
  // Hämta användningsstatistik från cookies (eller localStorage på frontend)
  const storiesGeneratedMatch = cookies.match(/stories_generated=(\d+)/);
  const storiesGenerated = storiesGeneratedMatch ? parseInt(storiesGeneratedMatch[1]) : 0;
  
  const elevenLabsUsedMatch = cookies.match(/elevenlabs_used=(\d+)/);
  const elevenLabsStoriesUsed = elevenLabsUsedMatch ? parseInt(elevenLabsUsedMatch[1]) : 0;
  
  // Antal gratis ElevenLabs-sagor
  const maxElevenLabsFree = 3;
  
  return {
    tier: hasPremium ? tier : 'free',
    storiesGenerated,
    elevenLabsStoriesUsed,
    maxElevenLabsFree
  };
}

/**
 * Uppdaterar användarens användningsstatistik
 */
export function updateUserUsageStats(
  currentStats: UserTTSInfo, 
  provider: 'elevenlabs' | 'google-wavenet' | 'google-standard'
): UserTTSInfo {
  const newStats = {
    ...currentStats,
    storiesGenerated: currentStats.storiesGenerated + 1
  };
  
  if (provider === 'elevenlabs') {
    newStats.elevenLabsStoriesUsed = currentStats.elevenLabsStoriesUsed + 1;
  }
  
  return newStats;
}

/**
 * Mappar TTS-provider till Google TTS voice
 */
export function getGoogleVoiceForProvider(provider: 'google-wavenet' | 'google-standard', voice: string = 'shimmer'): string {
  const voiceMap: Record<string, string> = {
    // Bästa svenska WaveNet-röster
    "shimmer": "sv-SE-Wavenet-A", // Kvinna, naturlig & varm (BÄST för sagor)
    "nova": "sv-SE-Wavenet-E",    // Man, varm & berättande (BÄST för sagor)
    "echo": "sv-SE-Wavenet-B",    // Kvinna, mjuk & lugn
    "alloy": "sv-SE-Wavenet-A",   // Kvinna, naturlig (samma som shimmer)
    "fable": "sv-SE-Wavenet-C",   // Kvinna, ung & energisk
    "onyx": "sv-SE-Wavenet-D",    // Man, djup & lugn
    
    // Direkta Google-röstval
    "astrid": "sv-SE-Wavenet-A",  // Kvinna, naturlig & klar
    "elin": "sv-SE-Wavenet-B",    // Kvinna, mjuk & vänlig
    "anna": "sv-SE-Wavenet-C",    // Kvinna, ung & energisk
    "nils": "sv-SE-Wavenet-D",    // Man, djup & behaglig
    "erik": "sv-SE-Wavenet-E"     // Man, varm & berättande
  };
  
  const wavenetVoice = voiceMap[voice] || "sv-SE-Wavenet-A";
  
  if (provider === 'google-standard') {
    // Konvertera Wavenet-voices till Standard-voices
    return wavenetVoice.replace('-Wavenet-', '-Standard-');
  }
  
  return wavenetVoice;
}

/**
 * Hämtar ElevenLabs voice baserat på vald röst
 */
export function getElevenLabsVoice(voice: string = 'shimmer'): string {
  const voiceMap: Record<string, string> = {
    "shimmer": "4Ct5uMEndw4cJ7q0Jx0l", // Swedish voice 1 - Soft & warm
    "nova": "kkwvaJeTPw4KK0sBdyvD",    // Swedish voice 2 - Young & gentle
    "echo": "aSLKtNoVBZlxQEMsnGL2",    // Swedish voice 3 - Natural & calm
    "alloy": "4Ct5uMEndw4cJ7q0Jx0l",   // Default to voice 1
    "fable": "aSLKtNoVBZlxQEMsnGL2",   // Natural storytelling
    "onyx": "aSLKtNoVBZlxQEMsnGL2"     // Deep & soothing
  };
  
  return voiceMap[voice] || "4Ct5uMEndw4cJ7q0Jx0l";
}
