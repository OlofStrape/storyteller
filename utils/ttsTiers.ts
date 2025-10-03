// TTS Tier Management System
// Hanterar vilken TTS-provider som ska användas baserat på användarens tier och användningshistorik

export interface UserTTSInfo {
  tier: 'free' | 'basic' | 'pro' | 'premium';
  storiesGenerated: number;
  elevenLabsStoriesUsed: number;
  maxElevenLabsFree: number;
  weeklyStoriesGenerated: number;
  maxWeeklyStories: number;
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

  // Premium användare: 10 gratis ElevenLabs, sedan Google TTS
  if (tier === 'premium') {
    if (elevenLabsStoriesUsed < maxElevenLabsFree) {
      return {
        provider: 'elevenlabs',
        reason: `Du har ${maxElevenLabsFree - elevenLabsStoriesUsed} Magiska röster kvar (av ${maxElevenLabsFree} gratis)`,
        canUpgrade: false,
        upgradePrice: 0
      };
    } else {
      return {
        provider: 'google-wavenet',
        reason: 'Du har använt dina gratis Magiska röster. Uppgradera för fler Magiska röster.',
        canUpgrade: true,
        upgradePrice: 5
      };
    }
  }

  // Pro användare: 5 gratis ElevenLabs, sedan Google TTS
  if (tier === 'pro') {
    if (elevenLabsStoriesUsed < maxElevenLabsFree) {
      return {
        provider: 'elevenlabs',
        reason: `Du har ${maxElevenLabsFree - elevenLabsStoriesUsed} Magiska röster kvar (av ${maxElevenLabsFree} gratis)`,
        canUpgrade: false,
        upgradePrice: 0
      };
    } else {
      return {
        provider: 'google-wavenet',
        reason: 'Du har använt dina gratis Magiska röster. Uppgradera för fler Magiska röster.',
        canUpgrade: true,
        upgradePrice: 5
      };
    }
  }

  // Basic användare: 2 gratis ElevenLabs, sedan Google TTS
  if (tier === 'basic') {
    if (elevenLabsStoriesUsed < maxElevenLabsFree) {
      return {
        provider: 'elevenlabs',
        reason: `Du har ${maxElevenLabsFree - elevenLabsStoriesUsed} Magiska röster kvar (av ${maxElevenLabsFree} gratis)`,
        canUpgrade: false,
        upgradePrice: 0
      };
    } else {
      return {
        provider: 'google-wavenet',
        reason: 'Du har använt dina gratis Magiska röster. Uppgradera för fler Magiska röster.',
        canUpgrade: true,
        upgradePrice: 5
      };
    }
  }

  // Gratis användare: 1 gratis ElevenLabs, sedan Google Standard
  if (tier === 'free') {
    if (elevenLabsStoriesUsed < maxElevenLabsFree) {
      return {
        provider: 'elevenlabs',
        reason: `Du har ${maxElevenLabsFree - elevenLabsStoriesUsed} Magiska röst kvar (av ${maxElevenLabsFree} gratis)`,
        canUpgrade: false,
        upgradePrice: 0
      };
    } else {
      return {
        provider: 'google-standard',
        reason: 'Du har använt din gratis Magiska röst. Uppgradera för fler Magiska röster.',
        canUpgrade: true,
        upgradePrice: 5
      };
    }
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
  const tier = tierMatch ? tierMatch[1] as 'free' | 'basic' | 'pro' | 'premium' : 'free';
  
  // Hämta användningsstatistik från cookies (eller localStorage på frontend)
  const storiesGeneratedMatch = cookies.match(/stories_generated=(\d+)/);
  const storiesGenerated = storiesGeneratedMatch ? parseInt(storiesGeneratedMatch[1]) : 0;
  
  const elevenLabsUsedMatch = cookies.match(/elevenlabs_used=(\d+)/);
  const elevenLabsStoriesUsed = elevenLabsUsedMatch ? parseInt(elevenLabsUsedMatch[1]) : 0;
  
  const weeklyStoriesMatch = cookies.match(/weekly_stories=(\d+)/);
  const weeklyStoriesGenerated = weeklyStoriesMatch ? parseInt(weeklyStoriesMatch[1]) : 0;
  
  // Antal gratis ElevenLabs-sagor baserat på tier
  const maxElevenLabsFree = getMaxElevenLabsForTier(tier);
  const maxWeeklyStories = getMaxWeeklyStoriesForTier(tier);
  
  return {
    tier: hasPremium ? tier : 'free',
    storiesGenerated,
    elevenLabsStoriesUsed,
    maxElevenLabsFree,
    weeklyStoriesGenerated,
    maxWeeklyStories
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
    storiesGenerated: currentStats.storiesGenerated + 1,
    weeklyStoriesGenerated: currentStats.weeklyStoriesGenerated + 1
  };
  
  if (provider === 'elevenlabs') {
    newStats.elevenLabsStoriesUsed = currentStats.elevenLabsStoriesUsed + 1;
  }
  
  return newStats;
}

/**
 * Hämtar max antal ElevenLabs-sagor för en tier
 */
export function getMaxElevenLabsForTier(tier: 'free' | 'basic' | 'pro' | 'premium'): number {
  switch (tier) {
    case 'free': return 1;
    case 'basic': return 2;
    case 'pro': return 5;
    case 'premium': return 10;
    default: return 1;
  }
}

/**
 * Hämtar max antal veckosagor för en tier
 */
export function getMaxWeeklyStoriesForTier(tier: 'free' | 'basic' | 'pro' | 'premium'): number {
  switch (tier) {
    case 'free': return 5;
    case 'basic': return 10;
    case 'pro': return 50;
    case 'premium': return 100;
    default: return 5;
  }
}

/**
 * Hämtar max sagslängd för en tier (i minuter)
 */
export function getMaxStoryLengthForTier(tier: 'free' | 'basic' | 'pro' | 'premium'): { min: number; max: number } {
  switch (tier) {
    case 'free': return { min: 0, max: 3 };
    case 'basic': return { min: 0, max: 5 };
    case 'pro': return { min: 0, max: 10 };
    case 'premium': return { min: 0, max: 12 };
    default: return { min: 0, max: 3 };
  }
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
 * Alla magiska röster använder samma kvinnliga voiceID för konsistens
 */
export function getElevenLabsVoice(voice: string = 'shimmer'): string {
  // Alla magiska röster använder samma kvinnliga voiceID för konsistent ljud
  return "ede82cc18ed313de089998f323116e853b3a92c3f08bff70795fb3c7e0762eaa"; // Elin - female voice
}
