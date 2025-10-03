"use client";
import { useMemo, useState, useEffect } from "react";

export default function HomePage() {
  const [name, setName] = useState("Victor");
  const [age, setAge] = useState(7);
  const [interests, setInterests] = useState("");
  const [characters, setCharacters] = useState<string[]>([]); // Chip-based characters
  const [characterDraft, setCharacterDraft] = useState("");
  const [tone, setTone] = useState("mysig");
  const [lengthMin, setLengthMin] = useState<number>(3);
  const [story, setStory] = useState("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [playingSleep, setPlayingSleep] = useState(false);
  const [sleepChoice, setSleepChoice] = useState("white-noise");
  const [sleepMinutes, setSleepMinutes] = useState(20);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [sleepEl, setSleepEl] = useState<HTMLAudioElement | null>(null);
  const [mode, setMode] = useState<"openai" | "local">("openai");
  const [history, setHistory] = useState<{ id: string; title: string; content: string; createdAt: number }[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("current");
  const [savedCharacters, setSavedCharacters] = useState<{ id: string; name: string; age: number; interests: string }[]>([]);
  const [showSaveCharacter, setShowSaveCharacter] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [interestDraft, setInterestDraft] = useState("");
  const [hasPremium, setHasPremium] = useState(true); // Auto-premium for testing
  const [ttsVoice, setTtsVoice] = useState<string>("shimmer");
  const [ttsProvider, setTtsProvider] = useState<string>("google"); // Default to Google Cloud TTS
  const [ttsRate, setTtsRate] = useState<number>(0.9);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  const [ttsVolume, setTtsVolume] = useState<number>(1.0);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [sleepVolume, setSleepVolume] = useState<number>(0.25);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [storyTheme, setStoryTheme] = useState<string>("standard");
  const [dailyUsage, setDailyUsage] = useState<number>(0);
  const [weeklyUsage, setWeeklyUsage] = useState<number>(0);
  const [elevenLabsUsed, setElevenLabsUsed] = useState<number>(0);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [storySeries, setStorySeries] = useState<{ id: string; title: string; chapters: number; lastStory: string } | null>(null);
  const [librarySearch, setLibrarySearch] = useState<string>("");
  const [libraryFilter, setLibraryFilter] = useState<string>("all");
  const [sleepTimer, setSleepTimer] = useState<number>(0);
  const [sleepTimerActive, setSleepTimerActive] = useState<boolean>(false);
  const [sleepModePaused, setSleepModePaused] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [showDevControls, setShowDevControls] = useState<boolean>(false); // Dev controls hidden by default
  const [isClient, setIsClient] = useState<boolean>(false);
  const [expandedLibraryItems, setExpandedLibraryItems] = useState<Set<string>>(new Set());

  // Fix hydration issues by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Check for purchased audio from magical voice purchase
    const purchasedAudioUrl = localStorage.getItem("purchasedAudioUrl");
    const purchasedStoryTitle = localStorage.getItem("purchasedStoryTitle");
    
    if (purchasedAudioUrl && purchasedStoryTitle) {
      setAudioUrl(purchasedAudioUrl);
      showToast(`Magisk röst genererad för "${purchasedStoryTitle}"!`, "success");
      
      // Clean up localStorage
      localStorage.removeItem("purchasedAudioUrl");
      localStorage.removeItem("purchasedStoryTitle");
      
      // Auto-play the audio
      setTimeout(() => {
        const el = document.getElementById("story-audio") as HTMLAudioElement | null;
        if (el) {
          el.playbackRate = ttsRate;
          el.play().catch(() => {});
          setAudioEl(el);
        }
      }, 100);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleLibraryItem = (storyId: string) => {
    setExpandedLibraryItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  // Helper function to get week number
  const getWeekNumber = (date: Date): string => {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return `${year}-${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
  };

  // Check if premium features are required
  const premiumRequired = useMemo(() => {
    if (lengthMin > 3) return true; // Any length > 3 min requires premium
    if (savedCharacters.length > 0) return true; // Saved characters require premium
    return false;
  }, [lengthMin, savedCharacters.length]);

  // Calculate weekly limits based on tier
  const getWeeklyLimit = () => {
    if (!hasPremium) return 5; // Free users: 5 sagor per vecka
    // Get premium tier from cookie (SSR-safe)
    if (typeof window === 'undefined') return 100; // Default to premium tier during SSR
    const cookie = document.cookie || "";
    const tierMatch = cookie.match(/premium_tier=([^;]+)/);
    const tier = tierMatch ? tierMatch[1] : "basic";
    
    switch (tier) {
      case "basic": return 10;   // Basic: 10 sagor per vecka
      case "pro": return 50;     // Pro: 50 sagor per vecka
      case "premium": return 100; // Premium: 100 sagor per vecka
      default: return 10;
    }
  };

  // Calculate ElevenLabs limits based on tier
  const getElevenLabsLimit = () => {
    if (!hasPremium) return 1; // Free users: 1 Magisk röst
    // Get premium tier from cookie (SSR-safe)
    if (typeof window === 'undefined') return 10; // Default to premium tier during SSR
    const cookie = document.cookie || "";
    const tierMatch = cookie.match(/premium_tier=([^;]+)/);
    const tier = tierMatch ? tierMatch[1] : "basic";
    
    switch (tier) {
      case "basic": return 2;    // Basic: 2 Magiska röster
      case "pro": return 5;      // Pro: 5 Magiska röster
      case "premium": return 10; // Premium: 10 Magiska röster
      default: return 2;
    }
  };

  // Calculate story length limits based on tier
  const getStoryLengthLimits = () => {
    if (!hasPremium) return { min: 3, max: 3 }; // Free: 3 minuter
    // Get premium tier from cookie (SSR-safe)
    if (typeof window === 'undefined') return { min: 3, max: 12 }; // Default to premium tier during SSR
    const cookie = document.cookie || "";
    const tierMatch = cookie.match(/premium_tier=([^;]+)/);
    const tier = tierMatch ? tierMatch[1] : "basic";
    
    switch (tier) {
      case "basic": return { min: 3, max: 5 };   // Basic: 3-5 minuter
      case "pro": return { min: 3, max: 10 };    // Pro: 3-10 minuter
      case "premium": return { min: 3, max: 12 }; // Premium: 3-12 minuter
      default: return { min: 3, max: 5 };
    }
  };

  // Calculate character limit based on premium tier
  const getCharacterLimit = () => {
    if (!hasPremium) return 1; // Free: 1 character
    // Get premium tier from cookie (SSR-safe)
    if (typeof window === 'undefined') return 4; // Default to premium tier during SSR
    const cookie = document.cookie || "";
    const tierMatch = cookie.match(/premium_tier=([^;]+)/);
    const tier = tierMatch ? tierMatch[1] : "basic";
    
    switch (tier) {
      case "basic": return 2;   // Basic: 2 characters
      case "plus": return 3;     // Plus: 3 characters
      case "premium": return 4;  // Premium: 4 characters
      default: return 2;
    }
  };

  const isOverWeeklyLimit = dailyUsage >= getWeeklyLimit();
  const elevenLabsLimit = getElevenLabsLimit();
  const storyLengthLimits = getStoryLengthLimits();

  // Cache story for offline access
  function cacheStoryForOffline(story: { id: string; title: string; content: string; createdAt: number }) {
    if ('serviceWorker' in navigator && 'caches' in window) {
      caches.open('dromlyktan-stories').then(cache => {
        const storyUrl = `/story/${story.id}`;
        const storyResponse = new Response(JSON.stringify(story), {
          headers: { 'Content-Type': 'application/json' }
        });
        cache.put(storyUrl, storyResponse);
      });
    }
  }

  // Load history, characters, and ratings from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("story.history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
      const savedChars = localStorage.getItem("saved.characters");
      if (savedChars) {
        setSavedCharacters(JSON.parse(savedChars));
      }
      const savedRatings = localStorage.getItem("story.ratings");
      if (savedRatings) {
        setUserRatings(JSON.parse(savedRatings));
      }
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        setIsDarkMode(savedTheme === "dark");
      }
      const savedUsage = localStorage.getItem("daily.usage");
      if (savedUsage) {
        const usage = JSON.parse(savedUsage);
        // Reset if new day
        if (usage.date !== new Date().toDateString()) {
          setDailyUsage(0);
          localStorage.setItem("daily.usage", JSON.stringify({ count: 0, date: new Date().toDateString() }));
        } else {
          setDailyUsage(usage.count);
        }
      }
      
      // Load weekly usage
      const savedWeeklyUsage = localStorage.getItem("weekly.usage");
      if (savedWeeklyUsage) {
        const usage = JSON.parse(savedWeeklyUsage);
        // Reset if new week
        const currentWeek = getWeekNumber(new Date());
        if (usage.week !== currentWeek) {
          setWeeklyUsage(0);
          localStorage.setItem("weekly.usage", JSON.stringify({ count: 0, week: currentWeek }));
        } else {
          setWeeklyUsage(usage.count);
        }
      }
      
      // Load ElevenLabs usage
      const savedElevenLabsUsage = localStorage.getItem("elevenlabs.usage");
      if (savedElevenLabsUsage) {
        const usage = JSON.parse(savedElevenLabsUsage);
        // Reset if new week
        const currentWeek = getWeekNumber(new Date());
        if (usage.week !== currentWeek) {
          setElevenLabsUsed(0);
          localStorage.setItem("elevenlabs.usage", JSON.stringify({ count: 0, week: currentWeek }));
        } else {
          setElevenLabsUsed(usage.count);
        }
      }
      // read premium cookie
      const cookie = document.cookie || "";
      const hasPremiumCookie = /((^|;\s*)premium=1)(;|$)/.test(cookie);
      setHasPremium(hasPremiumCookie);
      
      // Load story series
      const savedSeries = localStorage.getItem("story.series");
      if (savedSeries) {
        setStorySeries(JSON.parse(savedSeries));
      }
      
      // Always use Google TTS (free & high quality)
      setTtsProvider("google");
      localStorage.setItem("tts.provider", "google");
      
      // Load characters
      const savedCharsList = localStorage.getItem("story.characters");
      if (savedCharsList) {
        setCharacters(JSON.parse(savedCharsList));
      }
    } catch {}

    // PWA Installation
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      showToast("🎉 Drömlyktan är nu installerad!", "success");
    };

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Client-side flag is already set in the useEffect above

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', () => showToast("🌐 Du är online igen!", "success"));
    window.addEventListener('offline', () => showToast("📱 Du är offline - sparade sagor tillgängliga", "info"));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && showPaywall) {
        setShowPaywall(false);
      }
      if (e.key === "Enter" && e.ctrlKey && !loading && !story) {
        generateStory(false); // Default to standard voice
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showPaywall, loading, story]);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('SW registered'))
        .catch(() => console.log('SW registration failed'));
    }
  }, []);

  // Normalize and validate interests/teman
  const profanitySet = useMemo(() => new Set([
    "knulla", "kuk", "fitta", "hora", "jävel", "bög", "cp", "fit*", "jävla", "hora", "slampa",
    "n-ordet", "nigger", "neger", "fag", "fuck"
  ]), []);

  const correctionMap = useMemo(() => new Map<string, string>([
    ["cyckel", "cykel"],
    ["cykel", "cykel"],
    ["fotbool", "fotboll"],
    ["fotbåll", "fotboll"],
    ["fotboll", "fotboll"],
    ["sjärna", "stjärna"],
    ["stjarna", "stjärna"],
    ["stjärnor", "stjärnor"],
    ["spindelmannen", "Spindelmannen"],
    ["spiderman", "Spindelmannen"],
    ["legoset", "LEGO"],
    ["lego", "LEGO"],
    ["legobygge", "LEGO"],
    ["minecraft", "Minecraft"],
    ["roblox", "Roblox"],
    ["pokemon", "Pokémon"],
    ["pokémon", "Pokémon"],
    ["mcdonalds", "McDonald's"],
    ["mc donalds", "McDonald's"],
    ["mcDonalds", "McDonald's"],
  ]), []);

  const allowedThemes = useMemo(
    () => new Set([
      "cykel", "drakar", "glass", "rymd", "rymdraket", "robotar", "pirater", "dinosaurier", "tåg", "bilar",
      "hästar", "musik", "snö", "regn", "skog", "hav", "sommar", "vinter", "fåglar", "katter", "hundar",
      "fotboll", "stjärna", "stjärnor", "prinsessor", "prinsessor", "magi", "sagor"
    ]),
    []
  );

  const brandSet = useMemo(
    () => new Set(["lego", "pokémon", "pokemon", "minecraft", "roblox", "mcdonald's", "spindelmannen"]),
    []
  );

  function titleCase(word: string): string {
    if (!word) return word;
    if (/^[A-ZÄÖÅ]/.test(word)) return word; // keep brand casing
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function normalizeToken(raw: string): { token: string | null; correctedFrom?: string } {
    const base = raw.trim().toLowerCase();
    if (!base) return { token: null };
    if (profanitySet.has(base)) return { token: null };
    const corrected = correctionMap.get(base) || base;
    const pretty = corrected.split(" ").map(titleCase).join(" ");
    if (corrected !== base) {
      return { token: pretty, correctedFrom: raw.trim() };
    }
    // Accept any non-profane token (keep strict rejection only for profanity)
    return { token: pretty };
  }

  const interestsTokens = useMemo(() => {
    const raw = interests.split(",").map(s => s.trim()).filter(Boolean);
    const accepted: { value: string; correctedFrom?: string }[] = [];
    const rejected: string[] = [];
    const seen = new Set<string>();
    for (const r of raw) {
      const { token, correctedFrom } = normalizeToken(r);
      if (!token) {
        if (r && profanitySet.has(r.toLowerCase())) rejected.push(r);
        continue;
      }
      const key = token.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      accepted.push({ value: token, correctedFrom });
    }
    return { accepted, rejected };
  }, [interests]);

  function addInterestToken(raw: string) {
    const cleaned = raw.trim();
    if (!cleaned) return;
    const { token } = normalizeToken(cleaned);
    if (!token) {
      setInterestDraft("");
      return;
    }
    const list = interests.split(",").map(s => s.trim()).filter(Boolean);
    
    // Limit to maximum 4 interests
    if (list.length >= 4) {
      setInterestDraft("");
      return;
    }
    
    if (!list.map((s) => s.toLowerCase()).includes(token.toLowerCase())) {
      const next = [...list, token].join(", ");
      setInterests(next);
    }
    setInterestDraft("");
  }

  function handleInterestKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "," || e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      addInterestToken(interestDraft);
    } else if (e.key === "Backspace" && !interestDraft) {
      // quick remove last chip
      const list = interests.split(",").map(s => s.trim()).filter(Boolean);
      if (list.length > 0) {
        list.pop();
        setInterests(list.join(", "));
      }
    }
  }

  function handleInterestPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!text) return;
    const parts = text
      .split(/[,\n\t]/g)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      e.preventDefault();
      parts.forEach(addInterestToken);
    }
  }

  const generateStory = async (useMagicalVoice: boolean = false) => {
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      // Check weekly limits
      if (weeklyUsage >= getWeeklyLimit()) {
        setError(`Du har nått din veckolimit på ${getWeeklyLimit()} sagor. Uppgradera för fler sagor per vecka.`);
        return;
      }
      
      // Note: ElevenLabs limits are checked in TTS step, not story generation
      
      // Check story length limits
      if (lengthMin < storyLengthLimits.min || lengthMin > storyLengthLimits.max) {
        setError(`Din nivå stöder sagor mellan ${storyLengthLimits.min}-${storyLengthLimits.max} minuter.`);
        return;
      }
      
      // Check if characters or interests are empty
      const hasCharacters = characters.length > 0;
      const hasInterests = interestsTokens.accepted.length > 0;
      
      if (!hasCharacters || !hasInterests) {
        const missingFields = [];
        if (!hasCharacters) missingFields.push("karaktärer");
        if (!hasInterests) missingFields.push("intressen/tema");
        
        const confirmed = window.confirm(
          `⚠️ Du har inte fyllt i ${missingFields.join(" eller ")}.\n\nVill du fortsätta ändå? Sagan kommer bli mer generisk.`
        );
        
        if (!confirmed) {
          return; // User cancelled, don't generate
        }
      }
      
      // Auto-premium for testing - skip all checks
      setLoading(true);
      setGenerationProgress(0);
      setAudioUrl("");
      setError("");
      setStory("");
      
      // Simulate progress updates
      progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);
      // Debug: Log what we're sending
      const requestData = {
        name: characters.join(", "), // Join all characters as the name field
        characters: characters, // Send characters array separately
        age,
        interests: interestsTokens.accepted.map(t => t.value),
        tone,
        lengthMin,
        mode,
        userPreferences: userPreferences || null,
        storyTheme,
        storySeries: storySeries ? {
          id: storySeries.id,
          title: storySeries.title,
          chapters: storySeries.chapters,
          lastStory: storySeries.lastStory
        } : null
      };
      
      console.log("Sending to API:", requestData);
      
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Något gick fel");
      } else if (data?.story) {
        setStory(data.story);
        // save to local history
        const title = data.story.split("\n")[0]?.slice(0, 120) || "Saga";
        const item = { id: String(Date.now()), title, content: data.story, createdAt: Date.now() };
        const newHistory = [item, ...history].slice(0, 20);
      setHistory(newHistory);
      try {
        localStorage.setItem("story.history", JSON.stringify(newHistory));
        // Cache for offline access
        cacheStoryForOffline(item);
      } catch {}
        
        // Update story series if this is a continuation
        if (storySeries) {
          const updatedSeries = {
            ...storySeries,
            chapters: storySeries.chapters + 1,
            lastStory: data.story
          };
          setStorySeries(updatedSeries);
          try {
            localStorage.setItem("story.series", JSON.stringify(updatedSeries));
          } catch {}
          showToast(`📖 Kapitel ${updatedSeries.chapters} av "${updatedSeries.title}" är klart!`, "success");
        } else {
          showToast("✨ Din saga är klar!", "success");
        }
        
        // Update usage statistics (only story generation, not TTS)
        const newDailyUsage = dailyUsage + 1;
        const newWeeklyUsage = weeklyUsage + 1;
        
        setDailyUsage(newDailyUsage);
        setWeeklyUsage(newWeeklyUsage);
        
        try {
          localStorage.setItem("daily.usage", JSON.stringify({ count: newDailyUsage, date: new Date().toDateString() }));
          localStorage.setItem("weekly.usage", JSON.stringify({ count: newWeeklyUsage, week: getWeekNumber(new Date()) }));
        } catch {}
        
        showToast("✨ Din saga är klar!", "success");
      }
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setGenerationProgress(100);
      setTimeout(() => {
        setLoading(false);
        setGenerationProgress(0);
      }, 500);
    }
  };

  async function tts(useMagicalVoice: boolean = false) {
    setLoading(true);
    setError("");
    
    // Check ElevenLabs limits if using magical voice
    if (useMagicalVoice && elevenLabsUsed >= elevenLabsLimit) {
      setError(`Du har använt alla dina ${elevenLabsLimit} Magiska röster för denna vecka. Använd standardröst eller uppgradera för fler Magiska röster.`);
      setLoading(false);
      return;
    }
    
    // Premium TTS is available for testing
    try {
      if (ttsProvider === 'web-speech') {
        // Web Speech API - free and natural
        if ('speechSynthesis' in window) {
          const synth = (window as any).speechSynthesis;
          
          // Wait for voices to load if they're not available yet
          let voices = synth.getVoices();
          if (voices.length === 0) {
            // Voices might not be loaded yet, wait a bit
            await new Promise(resolve => {
              const checkVoices = () => {
                voices = synth.getVoices();
                if (voices.length > 0) {
                  resolve(void 0);
                } else {
                  setTimeout(checkVoices, 100);
                }
              };
              checkVoices();
            });
          }
          
          const utter = new SpeechSynthesisUtterance(story);
          utter.rate = ttsRate;
          utter.pitch = ttsPitch;
          utter.volume = ttsVolume;
          
          // Find the best available voice
          let selectedVoice = null;
          
          // Try Swedish voices first
          selectedVoice = voices.find((v: any) => 
            v.lang.startsWith('sv') || 
            v.name.toLowerCase().includes('swedish') ||
            v.name.toLowerCase().includes('svenska')
          );
          
          // Fallback to natural-sounding English voices
          if (!selectedVoice) {
            selectedVoice = voices.find((v: any) => 
              v.name.includes('Samantha') || // Very natural, good for stories
              v.name.includes('Alex') ||     // Clear and warm
              v.name.includes('Karen') ||    // Soft and gentle
              v.name.includes('Moira') ||    // Irish accent, very natural
              v.name.includes('Daniel') ||   // Clear male voice
              v.name.includes('Victoria') || // British accent, clear
              (v.name.includes('Google') && v.lang.startsWith('en')) ||
              (v.name.includes('Microsoft') && v.lang.startsWith('en'))
            );
          }
          
          // Use default voice if no specific voice found
          if (!selectedVoice && voices.length > 0) {
            selectedVoice = voices[0];
          }
          
          if (selectedVoice) {
            utter.voice = selectedVoice;
            synth.cancel();
            synth.speak(utter);
            showToast(`Använder ${selectedVoice.name} (Web Speech API)`, "success");
            setLoading(false);
            return;
          }
        }
        // Web Speech API not available, try TTS API
        console.log("Web Speech API not available, trying TTS API");
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              text: story, 
              voice: ttsVoice, 
              rate: ttsRate,
              pitch: ttsPitch,
              volume: ttsVolume,
              provider: useMagicalVoice ? "elevenlabs" : "google",
              upgradeToElevenLabs: useMagicalVoice
            })
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Google TTS misslyckades");
          }

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          
          // Update ElevenLabs usage if magical voice was used
          if (useMagicalVoice) {
            const newElevenLabsUsage = elevenLabsUsed + 1;
            setElevenLabsUsed(newElevenLabsUsage);
            try {
              localStorage.setItem("elevenlabs.usage", JSON.stringify({ count: newElevenLabsUsage, week: getWeekNumber(new Date()) }));
            } catch {}
          }
          
          setTimeout(() => {
            const el = document.getElementById("story-audio") as HTMLAudioElement | null;
            if (el) {
              el.playbackRate = ttsRate;
              el.play().catch(() => {});
              setAudioEl(el);
              
              // Auto-start sleep mode after story ends if enabled and user has access
              el.addEventListener('ended', () => {
                // Check if user has Pro or Premium tier for sleep mode
                if (hasPremium) {
                  const cookie = document.cookie || "";
                  const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                  const tier = tierMatch ? tierMatch[1] : "basic";
                  
                  if (tier === "pro" || tier === "premium") {
                    startSleepMode();
                  }
                }
              });
            }
          }, 50);
          
          showToast(useMagicalVoice ? "🎵 Magisk röst genererad!" : "🎵 Ljud genererat!", "success");
          setLoading(false);
          return;
        } catch (googleError: any) {
          throw new Error(`Web Speech API och Google TTS fungerar inte: ${googleError.message}`);
        }
      } else {
        // Premium TTS providers
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: story, 
            voice: ttsVoice, 
            rate: ttsRate,
            pitch: ttsPitch,
            volume: ttsVolume,
            provider: useMagicalVoice ? "elevenlabs" : ttsProvider,
            upgradeToElevenLabs: useMagicalVoice
          })
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("TTS API Error:", errorData);
          throw new Error(errorData.error || "TTS misslyckades");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Update ElevenLabs usage if magical voice was used
        if (useMagicalVoice) {
          const newElevenLabsUsage = elevenLabsUsed + 1;
          setElevenLabsUsed(newElevenLabsUsage);
          try {
            localStorage.setItem("elevenlabs.usage", JSON.stringify({ count: newElevenLabsUsage, week: getWeekNumber(new Date()) }));
          } catch {}
        }
        
        setTimeout(() => {
          const el = document.getElementById("story-audio") as HTMLAudioElement | null;
          if (el) {
            el.playbackRate = ttsRate;
            el.play().catch(() => {});
            setAudioEl(el);
            
            // Auto-start sleep mode after story ends if enabled and user has access
            el.addEventListener('ended', () => {
              // Check if user has Pro or Premium tier for sleep mode
              if (hasPremium) {
                const cookie = document.cookie || "";
                const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                const tier = tierMatch ? tierMatch[1] : "basic";
                
                if (tier === "pro" || tier === "premium") {
                  startSleepMode();
                }
              }
            });
          }
        }, 50);
        
        const providerNames = {
          'openai': 'OpenAI TTS',
          'azure': 'Azure Speech',
          'elevenlabs': 'ElevenLabs',
          'google': 'Google Cloud TTS'
        };
        showToast(useMagicalVoice ? "🎵 Magisk röst genererad!" : `Använder ${providerNames[ttsProvider as keyof typeof providerNames]}`, "success");
      }
    } catch (e: any) {
      console.error("TTS Error:", e);
      const errorMessage = e?.message || e?.toString() || "Unknown error";
      
      // If Web Speech API failed, try Google TTS as fallback
      if (ttsProvider === 'web-speech') {
        console.log("Web Speech API failed, trying Google TTS fallback");
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              text: story, 
              voice: ttsVoice, 
              rate: ttsRate,
              pitch: ttsPitch,
              volume: ttsVolume,
              provider: "google"
            })
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Google TTS fallback misslyckades");
          }

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setTimeout(() => {
            const el = document.getElementById("story-audio") as HTMLAudioElement | null;
            if (el) {
              el.playbackRate = ttsRate;
              el.play().catch(() => {});
              setAudioEl(el);
              
              // Auto-start sleep mode after story ends if enabled and user has access
              el.addEventListener('ended', () => {
                // Check if user has Pro or Premium tier for sleep mode
                if (hasPremium) {
                  const cookie = document.cookie || "";
                  const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                  const tier = tierMatch ? tierMatch[1] : "basic";
                  
                  if (tier === "pro" || tier === "premium") {
                    startSleepMode();
                  }
                }
              });
            }
          }, 50);
          
          showToast("Använder Google TTS (fallback från Web Speech)", "success");
          setLoading(false);
          return;
        } catch (fallbackError: any) {
          console.error("Google TTS fallback failed:", fallbackError);
          setError(`TTS misslyckades: Web Speech API och Google TTS fallback fungerar inte. Kontrollera att Google TTS är konfigurerat. ${errorMessage}`);
        }
      } else {
        setError(`TTS misslyckades (${ttsProvider}): ${errorMessage}`);
        
        // Fallback to Web Speech API for other providers
        if ('speechSynthesis' in window) {
          try {
            const synth = (window as any).speechSynthesis;
            const utter = new SpeechSynthesisUtterance(story);
            utter.rate = ttsRate;
            utter.pitch = ttsPitch;
            utter.volume = ttsVolume;
            synth.cancel();
            synth.speak(utter);
            showToast("Fallback till Web Speech API", "info");
          } catch (fallbackError) {
            setError("Alla TTS-tjänster misslyckades.");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const startSleepMode = () => {
    // Check if user has Pro or Premium tier
    if (!hasPremium) {
      setShowPaywall(true);
      return;
    }
    
    const cookie = document.cookie || "";
    const tierMatch = cookie.match(/premium_tier=([^;]+)/);
    const tier = tierMatch ? tierMatch[1] : "basic";
    
    if (tier !== "pro" && tier !== "premium") {
      setShowPaywall(true);
      return;
    }
    
    const src = `/audio/${sleepChoice}.mp3`;
    const el = new Audio(src);
    el.loop = true;
    el.volume = sleepVolume;
    setSleepEl(el);
    setPlayingSleep(true);
    setSleepModePaused(false);
    el.play();
    
    // Start sleep timer if set
    if (sleepTimer > 0) {
      setSleepTimerActive(true);
      setTimeout(() => {
        el.pause();
        setPlayingSleep(false);
        setSleepTimerActive(false);
        showToast("😴 Sleep timer avslutad", "info");
      }, sleepTimer * 60 * 1000);
    } else {
      // Original behavior for sleepMinutes
      setTimeout(() => {
        el.pause();
        setPlayingSleep(false);
      }, sleepMinutes * 60 * 1000);
    }
  };

  const stopSleepMode = () => {
    if (sleepEl) {
      sleepEl.pause();
      setPlayingSleep(false);
      setSleepTimerActive(false);
      setSleepModePaused(false);
    }
  };

  const pauseSleepMode = () => {
    if (sleepEl) {
      sleepEl.pause();
      setSleepModePaused(true);
    }
  };

  const resumeSleepMode = () => {
    if (sleepEl) {
      sleepEl.play();
      setSleepModePaused(false);
    }
  };

  const stopAll = () => {
    audioEl?.pause();
    sleepEl?.pause();
    setPlayingSleep(false);
  };

  async function upgradeToPremium() {
    try {
      await fetch("/api/premium", { method: "POST" });
      setHasPremium(true);
      setShowPaywall(false);
    } catch {}
  }

  function rateStory(storyId: string, rating: number) {
    const newRatings = { ...userRatings, [storyId]: rating };
    setUserRatings(newRatings);
    try {
      localStorage.setItem("story.ratings", JSON.stringify(newRatings));
    } catch {}
  }

  // Calculate user preferences from ratings
  const userPreferences = useMemo(() => {
    const ratedStories = history.filter(h => userRatings[h.id] && userRatings[h.id] >= 4);
    if (ratedStories.length === 0) return null;
    
    const topInterests = new Map<string, number>();
    const topTones = new Map<string, number>();
    
    ratedStories.forEach(story => {
      const rating = userRatings[story.id];
      // Parse interests from story content (simplified)
      const interests = story.content.toLowerCase().match(/\b(djur|prins|prinsessa|ryttare|fisk|fågel|katt|hund|häst|drake|troll|älva|viking|rymd|stjärna|måne|sol|regn|snö|hav|skog|blomma|träd|sten|guld|silver|magisk|trollkarl|förtrollad)\b/g) || [];
      interests.forEach(interest => {
        topInterests.set(interest, (topInterests.get(interest) || 0) + rating);
      });
    });
    
    return {
      topInterests: Array.from(topInterests.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k),
      preferredTone: "mysig" // Could be calculated from story analysis
    };
  }, [history, userRatings]);

  // Filtered history for library
  const filteredHistory = useMemo(() => {
    let filtered = history;
    
    // Search filter
    if (librarySearch) {
      filtered = filtered.filter(story => 
        story.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
        story.content.toLowerCase().includes(librarySearch.toLowerCase())
      );
    }
    
    // Category filter
    if (libraryFilter !== "all") {
      filtered = filtered.filter(story => {
        const content = story.content.toLowerCase();
        switch (libraryFilter) {
          case "magisk": return content.includes("magisk") || content.includes("trollkarl");
          case "djur": return content.includes("djur") || content.includes("katt") || content.includes("hund");
          case "prinsessa": return content.includes("prinsessa") || content.includes("slott");
          case "rymden": return content.includes("rymd") || content.includes("måne") || content.includes("stjärna");
          case "natur": return content.includes("skog") || content.includes("träd") || content.includes("natur");
          case "favoriter": return userRatings[story.id] >= 4;
          case "recent": return Date.now() - story.createdAt < 7 * 24 * 60 * 60 * 1000; // Last 7 days
          default: return true;
        }
      });
    }
    
    return filtered;
  }, [history, librarySearch, libraryFilter, userRatings]);

  function toggleTheme() {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      localStorage.setItem("theme", newTheme ? "dark" : "light");
    } catch {}
  }

  // PWA Installation
  async function installPWA() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast("🎉 Drömlyktan installeras...", "success");
      }
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  }

  // Push Notifications
  async function requestNotificationPermission() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        showToast("🔔 Notifikationer aktiverade!", "success");
        
        // Register for push notifications
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HI8g8V7VWtHl46B7fwmBPVgWOGt8cvJ1rVQyB5LkG8sSX8oJ0aA0xD2U'
          });
          
          // Send subscription to server (placeholder)
          console.log('Push subscription:', subscription);
        } catch (error) {
          console.error('Push subscription failed:', error);
        }
      } else {
        showToast("Notifikationer nekades", "error");
      }
    }
  }

  // Schedule daily reminder
  function scheduleDailyReminder() {
    if (notificationPermission === 'granted') {
      // Schedule for 19:00 (7 PM) daily
      const now = new Date();
      const reminder = new Date();
      reminder.setHours(19, 0, 0, 0);
      
      if (reminder <= now) {
        reminder.setDate(reminder.getDate() + 1);
      }
      
      const timeUntilReminder = reminder.getTime() - now.getTime();
      
      setTimeout(() => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Drömlyktan', {
              body: 'Dags för kvällens saga! 🌙',
              icon: '/icon-192.png',
              badge: '/icon-72.png',
              tag: 'daily-reminder'
            } as any);
          });
        }
      }, timeUntilReminder);
    }
  }

  // Offline support
  function checkOnlineStatus() {
    if (!navigator.onLine) {
      showToast("📱 Du är offline - sparade sagor är tillgängliga", "info");
    }
  }

  // Check premium status from cookies
  function checkPremiumStatus() {
    if (typeof window === 'undefined') return true; // Always premium during SSR
    const cookie = document.cookie || "";
    const hasPremiumCookie = /((^|;\s*)premium=1)(;|$)/.test(cookie);
    setHasPremium(hasPremiumCookie);
    return hasPremiumCookie;
  }

  // Developer functions
  async function activateDeveloperPremium() {
    try {
      const res = await fetch("/api/dev-premium", { method: "POST" });
      if (res.ok) {
        showToast("🚀 Developer Premium aktiverat!", "success");
        // Check premium status immediately
        setTimeout(() => {
          checkPremiumStatus();
        }, 100);
      } else {
        showToast("Kunde inte aktivera developer premium", "error");
      }
    } catch (error) {
      showToast("Kunde inte aktivera developer premium", "error");
    }
  }

  async function deactivateDeveloperPremium() {
    try {
      const res = await fetch("/api/dev-premium", { method: "DELETE" });
      if (res.ok) {
        showToast("Developer Premium avaktiverat", "info");
        // Check premium status immediately
        setTimeout(() => {
          checkPremiumStatus();
        }, 100);
      } else {
        showToast("Kunde inte avaktivera developer premium", "error");
      }
    } catch (error) {
      showToast("Kunde inte avaktivera developer premium", "error");
    }
  }

  function resetDailyUsage() {
    setDailyUsage(0);
    setWeeklyUsage(0);
    setElevenLabsUsed(0);
    try {
      localStorage.setItem("daily.usage", JSON.stringify({ count: 0, date: new Date().toDateString() }));
      localStorage.setItem("weekly.usage", JSON.stringify({ count: 0, week: getWeekNumber(new Date()) }));
      localStorage.setItem("elevenlabs.usage", JSON.stringify({ count: 0, week: getWeekNumber(new Date()) }));
    } catch {}
    showToast("📊 All användning återställd", "success");
  }

  function clearAllData() {
    if (confirm("Är du säker? Detta tar bort alla sparade sagor, karaktärer och inställningar.")) {
      localStorage.clear();
      setHistory([]);
      setSavedCharacters([]);
      setUserRatings({});
      setDailyUsage(0);
      setStorySeries(null);
      showToast("🗑️ All data rensad", "info");
    }
  }

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <main className="container">
        <div className="card">
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "18px", color: "var(--text-secondary)" }}>
              Laddar Drömlyktan...
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {showInstallPrompt && !isInstalled && (
              <button
                onClick={installPWA}
                className="button"
                style={{ fontSize: "12px", padding: "4px 8px" }}
              >
                📱 Installera
              </button>
            )}
            {notificationPermission === 'default' && (
              <button
                onClick={requestNotificationPermission}
                className="button"
                style={{ fontSize: "12px", padding: "4px 8px" }}
              >
                🔔 Notifikationer
              </button>
            )}
            <button
              onClick={() => setShowDevControls(!showDevControls)}
              className="button"
              style={{ fontSize: "12px", padding: "4px 8px", background: "rgba(255,255,255,0.1)" }}
            >
              🛠️ Dev
            </button>
          </div>
          <button 
            onClick={toggleTheme}
            style={{ 
              background: "none", 
              border: "1px solid rgba(255,255,255,0.2)", 
              borderRadius: "8px", 
              padding: "6px 10px", 
              color: "var(--fg)", 
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            {isDarkMode ? "🌙" : "☀️"}
          </button>
        </div>
        
        <div className="header-section">
          <img 
            src="/lantern.png" 
            alt="Drömlyktan" 
            style={{ 
              width: "80px", 
              height: "80px", 
              marginBottom: "16px",
              filter: "drop-shadow(0 8px 24px rgba(255,223,138,0.4))",
              animation: "pulse 4s ease-in-out infinite"
            }} 
          />
          <h1>Drömlyktan</h1>
          <p className="muted" style={{ fontSize: "18px", marginBottom: "8px", fontWeight: "500" }}>Skapa kvällens saga</p>
          <p className="muted" style={{ maxWidth: "520px", margin: "0 auto", fontSize: "15px" }}>
            Tänd Drömlyktan och gör kvällen magisk. Trygga, personliga godnattsagor – skräddarsydda efter namn, ålder och intressen.
          </p>
        </div>

        {showDevControls && (
          <div style={{ 
            background: "rgba(255,255,255,0.05)", 
            border: "1px solid rgba(255,255,255,0.1)", 
            borderRadius: "8px", 
            padding: "12px", 
            marginBottom: "16px" 
          }}>
            <h3 style={{ fontSize: "14px", margin: "0 0 8px", color: "var(--accent-gold)" }}>🛠️ Developer Controls</h3>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={() => setHasPremium(!hasPremium)} className="button" style={{ fontSize: "12px", padding: "4px 8px" }}>
                {hasPremium ? "🔒 Disable Premium" : "🚀 Enable Premium"}
              </button>
              <button onClick={() => setMode(mode === "openai" ? "local" : "openai")} className="button" style={{ fontSize: "12px", padding: "4px 8px" }}>
                {mode === "openai" ? "🏠 Switch to Local" : "🤖 Switch to OpenAI"}
              </button>
              <button onClick={() => setTtsProvider(ttsProvider === "elevenlabs" ? "web-speech" : "elevenlabs")} className="button" style={{ fontSize: "12px", padding: "4px 8px" }}>
                TTS: {ttsProvider === "elevenlabs" ? "ElevenLabs 👑" : "Web Speech 🆓"}
              </button>
              <button onClick={resetDailyUsage} className="button" style={{ fontSize: "12px", padding: "4px 8px" }}>
                📊 Reset Usage
              </button>
              <button onClick={clearAllData} className="button" style={{ fontSize: "12px", padding: "4px 8px", background: "rgba(255,100,100,0.2)" }}>
                🗑️ Clear Data
              </button>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "8px" }}>
              Status: {hasPremium ? "✅ Premium" : "❌ Free"} | Mode: {mode === "openai" ? "🤖 OpenAI" : "🏠 Local"} | TTS: {ttsProvider === "elevenlabs" ? "👑 ElevenLabs" : "🆓 Web Speech"} | Weekly: {weeklyUsage}/{getWeeklyLimit()} | Magisk: {elevenLabsUsed}/{elevenLabsLimit}
            </div>
          </div>
        )}

        <label style={{ textAlign: "center" }}>
          Karaktärer i sagan {characters.length > 0 && <span className="small" style={{ color: "var(--text-secondary)" }}>({characters.length}/{getCharacterLimit()})</span>}
        </label>
        <div className="chip-input">
          {characters.map((char, idx) => (
            <div key={idx} className="chip">
              {char}
              <span className="x" onClick={() => {
                setCharacters(characters.filter((_, i) => i !== idx));
              }}>×</span>
            </div>
          ))}
          <input
            type="text"
            value={characterDraft}
            onChange={(e) => setCharacterDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
                e.preventDefault();
                const trimmed = characterDraft.trim().replace(/,$/, '');
                if (trimmed && !characters.includes(trimmed)) {
                  if (characters.length >= getCharacterLimit()) {
                    showToast(`Max ${getCharacterLimit()} karaktärer för din tier`, "info");
                    return;
                  }
                  setCharacters([...characters, trimmed]);
                  setCharacterDraft("");
                  localStorage.setItem("story.characters", JSON.stringify([...characters, trimmed]));
                } else if (trimmed) {
                  setCharacterDraft("");
                }
              } else if (e.key === "Backspace" && !characterDraft && characters.length > 0) {
                setCharacters(characters.slice(0, -1));
              }
            }}
            placeholder={characters.length >= getCharacterLimit() ? `Max ${getCharacterLimit()} karaktärer` : "Lägg till karaktär (Enter/Tab/komma)"}
            disabled={characters.length >= getCharacterLimit()}
            style={{ flex: 1, minWidth: "120px" }}
          />
        </div>
        {characters.length >= getCharacterLimit() && (
          <p className="small" style={{ marginTop: "4px", color: "var(--accent-gold)" }}>
            ℹ️ Max {getCharacterLimit()} karaktärer. {!hasPremium ? "Uppgradera för fler!" : getCharacterLimit() < 4 ? "Uppgradera till Premium för 4 karaktärer!" : ""}
          </p>
        )}
        
        <div className="row" style={{ marginTop: "24px" }}>
          <div>
            <label style={{ textAlign: "center" }}>Ålder ({age} år)</label>
            <input 
              type="range" 
              min={3} 
              max={13} 
              value={age} 
              onChange={(e) => setAge(parseInt(e.target.value))} 
            />
          </div>
          <div>
            <label style={{ textAlign: "center" }}>Längd ({lengthMin} min) {lengthMin > 3 && <span className="badge">🔒 Premium</span>}</label>
            <input
              type="range"
              min={0}
              max={15}
              step={1}
              value={lengthMin}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (v > 3 && !hasPremium) {
                  setShowPaywall(true);
                  setLengthMin(3);
                } else {
                  setLengthMin(v);
                }
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 8, display: "none", gap: 8, alignItems: "center" }}>
          <button 
            className="button" 
            style={{ fontSize: "12px", padding: "6px 12px" }}
            onClick={() => setShowSaveCharacter(true)}
          >
            💾 Spara karaktär
          </button>
          {selectedCharacter !== "current" && (
            <button 
              className="button" 
              style={{ fontSize: "12px", padding: "6px 12px", background: "#ff6b6b" }}
              onClick={() => {
                const newChars = savedCharacters.filter(c => c.id !== selectedCharacter);
                setSavedCharacters(newChars);
                setSelectedCharacter("current");
                try {
                  localStorage.setItem("saved.characters", JSON.stringify(newChars));
                } catch {}
              }}
            >
              🗑️ Ta bort
            </button>
          )}
          {savedCharacters.length === 0 && (
            <span className="small" style={{ color: "var(--text-secondary)" }}>
              Premium-användare kan spara flera karaktärer
            </span>
          )}
        </div>
        
        {showSaveCharacter && (
          <div style={{ marginTop: 8, padding: 12, background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
            <p className="small">Spara aktuell karaktär som:</p>
            <input 
              placeholder="Namn för karaktären"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const newChar = {
                    id: String(Date.now()),
                    name: name,
                    age: age,
                    interests: interests
                  };
                  const newChars = [...savedCharacters, newChar];
                  setSavedCharacters(newChars);
                  setShowSaveCharacter(false);
                  try {
                    localStorage.setItem("saved.characters", JSON.stringify(newChars));
                  } catch {}
                }
              }}
            />
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button 
                className="button" 
                style={{ fontSize: "12px", padding: "6px 12px" }}
                onClick={() => {
                  const newChar = {
                    id: String(Date.now()),
                    name: name,
                    age: age,
                    interests: interests
                  };
                  const newChars = [...savedCharacters, newChar];
                  setSavedCharacters(newChars);
                  setShowSaveCharacter(false);
                  try {
                    localStorage.setItem("saved.characters", JSON.stringify(newChars));
                  } catch {}
                }}
              >
                Spara
              </button>
              <button 
                className="button" 
                style={{ fontSize: "12px", padding: "6px 12px", background: "#666" }}
                onClick={() => setShowSaveCharacter(false)}
              >
                Avbryt
              </button>
            </div>
          </div>
        )}

        <label style={{ marginTop: "28px", textAlign: "center" }}>Intressen/tema {interestsTokens.accepted.length > 0 && <span className="small" style={{ color: "var(--text-secondary)" }}>({interestsTokens.accepted.length}/4)</span>}</label>
        <div className="chip-input">
          {interestsTokens.accepted.map((t) => (
            <span key={t.value} className={`chip ${t.correctedFrom ? "corrected" : ""}`}>
              {t.value}
              {t.correctedFrom && <span className="small"> (från "{t.correctedFrom}")</span>}
              <span className="x" onClick={() => {
                const arr = interests.split(",").map(s => s.trim()).filter(Boolean);
                const next = arr.filter(a => a.toLowerCase() !== t.value.toLowerCase() && a.toLowerCase() !== (t.correctedFrom||"").toLowerCase());
                setInterests(next.join(", "));
              }}>×</span>
            </span>
          ))}
          <input
            value={interestDraft}
            onChange={(e) => setInterestDraft(e.target.value)}
            onKeyDown={handleInterestKeyDown}
            onPaste={handleInterestPaste}
            placeholder={interestsTokens.accepted.length >= 4 ? "Max 4 intressen" : "ex. drakar"}
            disabled={interestsTokens.accepted.length >= 4}
          />
        </div>
        {interestsTokens.accepted.length >= 4 && (
          <p className="small" style={{ marginTop: 4, color: "var(--accent-gold)" }}>
            💡 Max 4 intressen för fokuserade sagor. Ta bort ett intresse för att lägga till ett nytt.
          </p>
        )}
        

        <div className="row" style={{ marginTop: "28px" }}>
          <div>
            <label style={{ textAlign: "center" }}>Tonalitet</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="mysig">Mysig</option>
              <option value="magisk">Magisk</option>
              <option value="rolig">Rolig</option>
              <option value="spännande">Spännande (milt)</option>
            </select>
          </div>
          <div>
            <label style={{ textAlign: "center" }}>Sagotema</label>
            <select value={storyTheme} onChange={(e) => {
              const theme = e.target.value;
              const plusThemes = ["aventyr", "rymd", "djur", "magi"];
              const premiumThemes = ["astrid-lindgren", "sven-nordqvist", "gunilla-bergstrom", "martin-widmark", "jk-rowling"];
              
              // Check if theme requires premium
              if (theme !== "standard" && !hasPremium) {
                setShowPaywall(true);
                setStoryTheme("standard"); // Reset to standard
                return;
              }
              
              // Show lock icon if selecting premium theme
              if (premiumThemes.includes(theme) || plusThemes.includes(theme)) {
                showToast("🔓 Premium-tema valt!", "success");
              }
              
              setStoryTheme(theme);
            }}>
              <option value="standard">Standard</option>
              <optgroup label="Teman">
                <option value="aventyr">Äventyr</option>
                <option value="rymd">Rymd</option>
                <option value="djur">Djurens värld</option>
                <option value="magi">Magi & fantasi</option>
              </optgroup>
              <optgroup label="Författarstilar">
                <option value="astrid-lindgren">I stil av Astrid Lindgren</option>
                <option value="sven-nordqvist">I stil av Sven Nordqvist</option>
                <option value="gunilla-bergstrom">I stil av Gunilla Bergström</option>
                <option value="martin-widmark">I stil av Martin Widmark</option>
                <option value="jk-rowling">I stil av J.K. Rowling</option>
              </optgroup>
            </select>
            {storyTheme !== "standard" && (
              <span className="small" style={{ color: "var(--accent-gold)", marginTop: "4px", display: "block", textAlign: "center" }}>
                🔒 Premium-tema aktivt
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          {/* Enkel saga-genereringsknapp */}
          <button 
            className="button" 
            onClick={() => generateStory(false)} 
            disabled={loading || isOverWeeklyLimit}
            aria-label="Generera saga"
            style={{ 
              fontSize: "16px", 
              padding: "16px 32px",
              minWidth: "240px",
              background: isOverWeeklyLimit ? "var(--bg-secondary)" : "var(--accent)",
              opacity: isOverWeeklyLimit ? 0.6 : 1
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ 
                  width: "16px", 
                  height: "16px", 
                  border: "2px solid rgba(255,255,255,0.3)", 
                  borderTop: "2px solid var(--accent)", 
                  borderRadius: "50%", 
                  animation: "spin 1s linear infinite" 
                }} />
                <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
                  Skapar saga...
                </span>
              </span>
            ) : storySeries ? (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                📖 Fortsätt "{storySeries.title}" (Kapitel {storySeries.chapters + 1})
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                <img src="/lantern.png" alt="" style={{ width: "24px", height: "24px", filter: "drop-shadow(0 2px 8px rgba(255,223,138,0.6))" }} />
                Tänd Drömlyktan
              </span>
            )}
          </button>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <span className="badge">
              {isOverWeeklyLimit ? "Veckolimit nådd" : 
               `${weeklyUsage}/${getWeeklyLimit()} sagor denna vecka`}
            </span>
            {storySeries && (
              <button 
                className="button" 
                style={{ fontSize: "12px", padding: "6px 12px", background: "#ff6b6b" }}
                onClick={() => {
                  setStorySeries(null);
                  try {
                    localStorage.removeItem("story.series");
                  } catch {}
                  showToast("📖 Kapitel-serie avslutad", "info");
                }}
              >
                🛑 Avsluta serie
              </button>
            )}
          </div>
        </div>


        {loading && (
          <div style={{ marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <span style={{ 
                width: "20px", 
                height: "20px", 
                border: "2px solid rgba(255,255,255,0.3)", 
                borderTop: "2px solid var(--accent)", 
                borderRadius: "50%", 
                animation: "spin 1s linear infinite" 
              }} />
              <span style={{ fontWeight: "600" }}>Skapar din saga...</span>
            </div>
            <div style={{ 
              width: "100%", 
              height: "4px", 
              background: "rgba(255,255,255,0.1)", 
              borderRadius: "2px", 
              overflow: "hidden" 
            }}>
              <div style={{ 
                width: `${generationProgress}%`, 
                height: "100%", 
                background: "linear-gradient(90deg, var(--accent), var(--accent-gold))", 
                borderRadius: "2px", 
                transition: "width 0.3s ease" 
              }} />
            </div>
            <p className="small" style={{ marginTop: "8px", color: "var(--text-secondary)" }}>
              {generationProgress < 30 ? "Förbereder berättelsen..." :
               generationProgress < 60 ? "Skriver din personliga saga..." :
               generationProgress < 90 ? "Finjusterar detaljerna..." :
               "Nästan klar!"}
            </p>
            
            {/* Skeleton loader for story preview */}
            <div style={{ marginTop: "16px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
              <div style={{ 
                height: "20px", 
                background: "linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%)",
                borderRadius: "4px",
                marginBottom: "8px",
                animation: "pulse 2s ease-in-out infinite"
              }} />
              <div style={{ 
                height: "16px", 
                background: "linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%)",
                borderRadius: "4px",
                marginBottom: "8px",
                width: "80%",
                animation: "pulse 2s ease-in-out infinite 0.5s"
              }} />
              <div style={{ 
                height: "16px", 
                background: "linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%)",
                borderRadius: "4px",
                width: "60%",
                animation: "pulse 2s ease-in-out infinite 1s"
              }} />
            </div>
          </div>
        )}

        {(error || story) && (
          <>
            <hr />
            <div>
              <label>Saga</label>
              {error ? (
                <div style={{ 
                  padding: "16px", 
                  background: "rgba(255,107,107,0.08)", 
                  border: "1px solid rgba(255,107,107,0.2)", 
                  borderRadius: "12px",
                  color: "#ff9a9a"
                }}>
                  <div style={{ fontWeight: "600", marginBottom: "8px", color: "#ff6b6b" }}>⚠️ Ett fel uppstod</div>
                  <div style={{ fontSize: "14px", lineHeight: "1.4", marginBottom: "12px" }}>{error}</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      className="button" 
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                      onClick={() => generateStory(false)}
                      disabled={loading}
                    >
                      🔄 Försök igen
                    </button>
                    {error.includes("kvot") && (
                      <button 
                        className="button" 
                        style={{ fontSize: "12px", padding: "6px 12px", background: "var(--accent-gold)" }}
                        onClick={() => setMode("local")}
                      >
                        🆓 Använd lokal version
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ position: "relative" }}>
                    <textarea 
                    value={story} 
                    readOnly 
                    rows={10}
                    onSelect={(e) => {
                      e.preventDefault();
                      showToast("📖 Kopiering är inte tillåten för Premium-innehåll", "info");
                    }}
                    onCopy={(e) => {
                      e.preventDefault();
                      showToast("📖 Kopiering är inte tillåten för Premium-innehåll", "info");
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      showToast("📖 Högerklick är inte tillåtet för Premium-innehåll", "info");
                    }}
                    onDragStart={(e) => {
                      e.preventDefault();
                      showToast("📖 Dra och släpp är inte tillåtet för Premium-innehåll", "info");
                    }}
                    onDrag={(e) => {
                      e.preventDefault();
                    }}
                    onKeyDown={(e) => {
                      // Block common copy shortcuts
                      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'a' || e.key === 'x')) {
                        e.preventDefault();
                        showToast("📖 Kopiering är inte tillåten för Premium-innehåll", "info");
                      }
                      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                        e.preventDefault();
                        showToast("📖 Utvecklarverktyg är inte tillåtet för Premium-innehåll", "info");
                      }
                    }}
                    style={{
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      MozUserSelect: "none",
                      msUserSelect: "none"
                    } as React.CSSProperties}
                  />
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "rgba(0,0,0,0.7)",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "600",
                    pointerEvents: "none"
                  }}>
                    🔒 Skyddad text
                  </div>
                  </div>
                  {story && (
                    <div style={{ marginTop: "12px", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                      {!storySeries && hasPremium && (
                        <div style={{ marginBottom: "12px", padding: "8px", background: "rgba(255,223,138,0.1)", borderRadius: "6px", border: "1px solid rgba(255,223,138,0.2)" }}>
                          <div style={{ fontSize: "14px", marginBottom: "8px", color: "var(--accent-gold)", fontWeight: "600" }}>
                            📖 Premium: Starta kapitel-serie
                          </div>
                          <p className="small" style={{ marginBottom: "8px", color: "var(--text-secondary)" }}>
                            Skapa flera kapitel av denna saga för en bok-känsla!
                          </p>
                          <button 
                            className="button" 
                            style={{ fontSize: "12px", padding: "6px 12px", background: "var(--accent-gold)", color: "#0a0620" }}
                            onClick={() => {
                              const title = story.split("\n")[0]?.slice(0, 50) || "Min saga";
                              const newSeries = {
                                id: String(Date.now()),
                                title: title,
                                chapters: 1,
                                lastStory: story
                              };
                              setStorySeries(newSeries);
                              try {
                                localStorage.setItem("story.series", JSON.stringify(newSeries));
                              } catch {}
                              showToast(`📖 Kapitel-serie "${title}" startad!`, "success");
                            }}
                          >
                            Starta serie
                          </button>
                        </div>
                      )}
                      <div style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-secondary)" }}>
                        Vad tyckte du om denna saga?
                      </div>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => {
                              const storyId = history[0]?.id;
                              if (storyId) rateStory(storyId, star);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: "20px",
                              cursor: "pointer",
                              color: history[0]?.id && userRatings[history[0].id] >= star ? "#ffd700" : "rgba(255,255,255,0.3)",
                              transition: "color 0.2s ease"
                            }}
                          >
                            ⭐
                          </button>
                        ))}
                        {history[0]?.id && userRatings[history[0].id] && (
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "8px" }}>
                            Tack! ({userRatings[history[0].id]}/5)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="controls">
                {/* Main TTS Section - Full Width with All Controls */}
                <div style={{ 
                  background: "rgba(255,255,255,0.05)", 
                  border: "1px solid rgba(255,255,255,0.1)", 
                  borderRadius: "16px", 
                  padding: "24px",
                  marginBottom: "20px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  width: "100%"
                }}>
                  <h3 style={{ 
                    margin: "0 0 20px 0", 
                    fontSize: "20px", 
                    color: "var(--accent)",
                    textAlign: "center",
                    fontWeight: "600"
                  }}>
                    🎵 Välj hur du vill lyssna på sagan
                  </h3>
                  
                  {/* TTS Controls - Horizontal Layout */}
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr 1fr 1fr", 
                    gap: "16px",
                    alignItems: "end",
                    marginBottom: "20px"
                  }}>
                    {/* Voice Selection */}
                    <div>
                      <label style={{ 
                        display: "block", 
                        fontSize: "14px", 
                        marginBottom: "8px", 
                        color: "var(--text-secondary)",
                        fontWeight: "500"
                      }}>
                        Röst
                      </label>
                      <select 
                        value={ttsVoice} 
                        onChange={(e) => {
                          const voice = e.target.value;
                          if (['echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(voice) && !hasPremium) {
                            setShowPaywall(true);
                            return;
                          }
                          setTtsVoice(voice);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "var(--text-primary)",
                          fontSize: "14px"
                        }}
                      >
                        <optgroup label="🏆 Bästa för sagor">
                          <option value="shimmer">Astrid - Kvinna, naturlig & varm ⭐⭐⭐</option>
                          <option value="nova">Erik - Man, varm & berättande ⭐⭐⭐</option>
                        </optgroup>
                        <optgroup label="👩 Kvinnliga röster">
                          <option value="echo">Elin - Mjuk & lugn ⭐⭐</option>
                          <option value="fable">Anna - Ung & energisk ⭐⭐</option>
                          <option value="alloy">Astrid (alt) - Naturlig & klar ⭐⭐</option>
                        </optgroup>
                        <optgroup label="👨 Manliga röster">
                          <option value="onyx">Nils - Djup & behaglig ⭐⭐</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Speed Control */}
                    <div>
                      <label style={{ 
                        display: "block", 
                        fontSize: "14px", 
                        marginBottom: "8px", 
                        color: "var(--text-secondary)",
                        fontWeight: "500"
                      }}>
                        Hastighet: {ttsRate.toFixed(1)}x
                      </label>
                      <input 
                        type="range" 
                        min={0.6} 
                        max={1.3} 
                        step={0.1} 
                        value={ttsRate} 
                        onChange={(e) => setTtsRate(parseFloat(e.target.value))} 
                        style={{ 
                          width: "100%",
                          accentColor: "var(--accent)"
                        }} 
                      />
                    </div>

                    {/* Pitch Control */}
                    <div>
                      <label style={{ 
                        display: "block", 
                        fontSize: "14px", 
                        marginBottom: "8px", 
                        color: "var(--text-secondary)",
                        fontWeight: "500"
                      }}>
                        Ton: {ttsPitch.toFixed(1)}x
                      </label>
                      <input 
                        type="range" 
                        min={0.5} 
                        max={2.0} 
                        step={0.1} 
                        value={ttsPitch} 
                        onChange={(e) => setTtsPitch(parseFloat(e.target.value))} 
                        style={{ 
                          width: "100%",
                          accentColor: "var(--accent)"
                        }} 
                      />
                    </div>

                    {/* Volume Control */}
                    <div>
                      <label style={{ 
                        display: "block", 
                        fontSize: "14px", 
                        marginBottom: "8px", 
                        color: "var(--text-secondary)",
                        fontWeight: "500"
                      }}>
                        Volym: {Math.round(ttsVolume * 100)}%
                      </label>
                      <input 
                        type="range" 
                        min={0.1} 
                        max={1.0} 
                        step={0.1} 
                        value={ttsVolume} 
                        onChange={(e) => setTtsVolume(parseFloat(e.target.value))} 
                        style={{ 
                          width: "100%",
                          accentColor: "var(--accent)"
                        }} 
                      />
                    </div>
                  </div>
                  
                  {/* Sleep Mode Controls */}
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: "16px",
                    alignItems: "end",
                    marginBottom: "20px",
                    padding: "16px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "8px"
                  }}>
                    {/* Sleep Sound Selection */}
                    <div>
                      <label style={{ 
                        display: "block", 
                        fontSize: "14px", 
                        marginBottom: "8px", 
                        color: "var(--text-secondary)",
                        fontWeight: "500"
                      }}>
                        Sleep Mode Ljud
                        {(() => {
                          // Check if user has Pro or Premium tier
                          if (!hasPremium) return <span style={{ color: "var(--accent-gold)", marginLeft: "4px" }}>🔒</span>;
                          
                          const cookie = document.cookie || "";
                          const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                          const tier = tierMatch ? tierMatch[1] : "basic";
                          
                          if (tier !== "pro" && tier !== "premium") {
                            return <span style={{ color: "var(--accent-gold)", marginLeft: "4px" }}>🔒</span>;
                          }
                          return null;
                        })()}
                      </label>
                      <select 
                        value={sleepChoice} 
                        onChange={(e) => {
                          // Check tier before allowing change
                          if (!hasPremium) {
                            setShowPaywall(true);
                            return;
                          }
                          
                          const cookie = document.cookie || "";
                          const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                          const tier = tierMatch ? tierMatch[1] : "basic";
                          
                          if (tier !== "pro" && tier !== "premium") {
                            setShowPaywall(true);
                            return;
                          }
                          
                          setSleepChoice(e.target.value);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "var(--text-primary)",
                          fontSize: "14px",
                          opacity: (() => {
                            if (!hasPremium) return 0.6;
                            const cookie = document.cookie || "";
                            const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                            const tier = tierMatch ? tierMatch[1] : "basic";
                            return (tier === "pro" || tier === "premium") ? 1 : 0.6;
                          })()
                        }}
                      >
                        <option value="white-noise">White noise</option>
                        <option value="rain">Regn</option>
                        <option value="waves">Vågor</option>
                        <option value="fireplace">Eldsprak</option>
                        <option value="forest">Skogsnatt</option>
                      </select>
                    </div>

                    {/* Sleep Timer */}
                    <div>
                      <label style={{ 
                        display: "block", 
                        fontSize: "14px", 
                        marginBottom: "8px", 
                        color: "var(--text-secondary)",
                        fontWeight: "500"
                      }}>
                        Sleep Timer
                        {(() => {
                          // Check if user has Pro or Premium tier
                          if (!hasPremium) return <span style={{ color: "var(--accent-gold)", marginLeft: "4px" }}>🔒</span>;
                          
                          const cookie = document.cookie || "";
                          const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                          const tier = tierMatch ? tierMatch[1] : "basic";
                          
                          if (tier !== "pro" && tier !== "premium") {
                            return <span style={{ color: "var(--accent-gold)", marginLeft: "4px" }}>🔒</span>;
                          }
                          return null;
                        })()}
                      </label>
                      <select 
                        value={sleepTimer} 
                        onChange={(e) => {
                          // Check tier before allowing change
                          if (!hasPremium) {
                            setShowPaywall(true);
                            return;
                          }
                          
                          const cookie = document.cookie || "";
                          const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                          const tier = tierMatch ? tierMatch[1] : "basic";
                          
                          if (tier !== "pro" && tier !== "premium") {
                            setShowPaywall(true);
                            return;
                          }
                          
                          setSleepTimer(Number(e.target.value));
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "var(--text-primary)",
                          fontSize: "14px",
                          opacity: (() => {
                            if (!hasPremium) return 0.6;
                            const cookie = document.cookie || "";
                            const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                            const tier = tierMatch ? tierMatch[1] : "basic";
                            return (tier === "pro" || tier === "premium") ? 1 : 0.6;
                          })()
                        }}
                      >
                        <option value={0}>Av</option>
                        <option value={10}>10 min</option>
                        <option value={20}>20 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                        <option value={90}>90 min</option>
                        <option value={120}>120 min</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* TTS Buttons */}
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: "20px",
                    maxWidth: "600px",
                    margin: "0 auto"
                  }}>
                    <button 
                      className="button" 
                      onClick={() => tts(false)} 
                      disabled={loading || !story}
                      style={{ 
                        fontSize: "16px", 
                        padding: "18px 28px",
                        background: "var(--accent)",
                        border: "2px solid var(--accent)",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                        transform: "translateY(0)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }}
                    >
                      {loading ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ 
                            width: "16px", 
                            height: "16px", 
                            border: "2px solid rgba(255,255,255,0.3)", 
                            borderTop: "2px solid var(--accent)", 
                            borderRadius: "50%", 
                            animation: "spin 1s linear infinite" 
                          }} />
                          Skapar ljud...
                        </span>
                      ) : (
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <img src="/lantern.png" alt="Lykt" style={{ width: "20px", height: "20px" }} />
                          Standardröst
                        </span>
                      )}
                    </button>
                    
                    <button 
                      className="button" 
                      onClick={() => tts(true)} 
                      disabled={loading || !story || elevenLabsUsed >= elevenLabsLimit}
                      style={{ 
                        fontSize: "16px", 
                        padding: "18px 28px",
                        background: elevenLabsUsed >= elevenLabsLimit ? "var(--bg-secondary)" : "linear-gradient(135deg, #ff6b6b, #ffa500)",
                        opacity: elevenLabsUsed >= elevenLabsLimit ? 0.6 : 1,
                        border: "2px solid #ffa500",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                        transform: "translateY(0)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }}
                    >
                      {loading ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ 
                            width: "16px", 
                            height: "16px", 
                            border: "2px solid rgba(255,255,255,0.3)", 
                            borderTop: "2px solid #ffa500", 
                            borderRadius: "50%", 
                            animation: "spin 1s linear infinite" 
                          }} />
                          Skapar ljud...
                        </span>
                      ) : (
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <img src="/lantern.png" alt="Lykt" style={{ width: "20px", height: "20px" }} />
                          Magisk röst
                        </span>
                      )}
                    </button>
                  </div>
                  
                  <div style={{ 
                    marginTop: "16px", 
                    padding: "12px 16px", 
                    background: "rgba(255,165,0,0.1)", 
                    border: "1px solid rgba(255,165,0,0.3)", 
                    borderRadius: "8px",
                    fontSize: "14px",
                    maxWidth: "600px",
                    margin: "16px auto 0 auto"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Magiska röster kvar:</span>
                      <span style={{ 
                        fontWeight: "bold", 
                        color: elevenLabsUsed >= elevenLabsLimit ? "#ff6b6b" : "#ffa500" 
                      }}>
                        {elevenLabsUsed >= elevenLabsLimit ? "Inga kvar" : `${elevenLabsLimit - elevenLabsUsed} av ${elevenLabsLimit}`}
                      </span>
                    </div>
                    {elevenLabsUsed >= elevenLabsLimit && (
                      <div style={{ fontSize: "12px", color: "#ff6b6b", marginTop: "4px" }}>
                        Uppgradera för fler Magiska röster
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {audioUrl && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <audio id="story-audio" className="audio" src={audioUrl} controls />
                  
                  {/* Sleep Mode Controls - Directly under player when active */}
                  {playingSleep && (
            <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "1fr 1fr", 
                      gap: "16px",
                      alignItems: "end",
                      padding: "16px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px"
                    }}>
                      {/* Sleep Sound Selection */}
                      <div>
                        <label style={{ 
                          display: "block", 
                          fontSize: "14px", 
                          marginBottom: "8px", 
                          color: "var(--text-secondary)",
                          fontWeight: "500"
                        }}>
                          Sleep Mode Ljud
                {(() => {
                  // Check if user has Pro or Premium tier
                            if (!hasPremium) return <span style={{ color: "var(--accent-gold)", marginLeft: "4px" }}>🔒</span>;
                  
                  const cookie = document.cookie || "";
                  const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                  const tier = tierMatch ? tierMatch[1] : "basic";
                  
                  if (tier !== "pro" && tier !== "premium") {
                              return <span style={{ color: "var(--accent-gold)", marginLeft: "4px" }}>🔒</span>;
                  }
                  return null;
                })()}
                  </label>
                  <select 
                    value={sleepChoice} 
                    onChange={(e) => {
                      // Check tier before allowing change
                      if (!hasPremium) {
                        setShowPaywall(true);
                        return;
                      }
                      
                      const cookie = document.cookie || "";
                      const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                      const tier = tierMatch ? tierMatch[1] : "basic";
                      
                      if (tier !== "pro" && tier !== "premium") {
                        setShowPaywall(true);
                        return;
                      }
                      
                      setSleepChoice(e.target.value);
                    }}
                    style={{ 
                      width: "100%",
                            padding: "8px 12px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                            fontSize: "14px",
                      opacity: (() => {
                        if (!hasPremium) return 0.6;
                        const cookie = document.cookie || "";
                        const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                        const tier = tierMatch ? tierMatch[1] : "basic";
                        return (tier === "pro" || tier === "premium") ? 1 : 0.6;
                      })()
                    }}
                  >
                          <option value="white-noise">White noise</option>
                          <option value="rain">Regn</option>
                          <option value="waves">Vågor</option>
                          <option value="fireplace">Eldsprak</option>
                          <option value="forest">Skogsnatt</option>
                  </select>
                </div>
                
                      {/* Sleep Timer */}
                <div>
                  <label style={{ 
                    display: "block", 
                    fontSize: "14px", 
                    marginBottom: "8px", 
                          color: "var(--text-secondary)",
                          fontWeight: "500"
                  }}>
                    Sleep Timer
                          {(() => {
                            // Check if user has Pro or Premium tier
                            if (!hasPremium) return <span style={{ color: "var(--accent-gold)", marginLeft: "4px" }}>🔒</span>;
                            
                            const cookie = document.cookie || "";
                            const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                            const tier = tierMatch ? tierMatch[1] : "basic";
                            
                            if (tier !== "pro" && tier !== "premium") {
                              return <span style={{ color: "var(--accent-gold)", marginLeft: "4px" }}>🔒</span>;
                            }
                            return null;
                          })()}
                  </label>
                  <select 
                    value={sleepTimer} 
                    onChange={(e) => {
                      // Check tier before allowing change
                      if (!hasPremium) {
                        setShowPaywall(true);
                        return;
                      }
                      
                      const cookie = document.cookie || "";
                      const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                      const tier = tierMatch ? tierMatch[1] : "basic";
                      
                      if (tier !== "pro" && tier !== "premium") {
                        setShowPaywall(true);
                        return;
                      }
                      
                      setSleepTimer(Number(e.target.value));
                    }}
                    style={{ 
                      width: "100%",
                            padding: "8px 12px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                            fontSize: "14px",
                      opacity: (() => {
                        if (!hasPremium) return 0.6;
                        const cookie = document.cookie || "";
                        const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                        const tier = tierMatch ? tierMatch[1] : "basic";
                        return (tier === "pro" || tier === "premium") ? 1 : 0.6;
                      })()
                    }}
                  >
                          <option value={0}>Av</option>
                          <option value={10}>10 min</option>
                          <option value={20}>20 min</option>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>60 min</option>
                          <option value={90}>90 min</option>
                          <option value={120}>120 min</option>
                        </select>
                      </div>
                      
                      {/* Sleep Mode Control Buttons */}
                      <div style={{
                display: "flex", 
                      gap: "8px", 
                      justifyContent: "center",
                      marginTop: "12px"
                    }}>
                      {sleepModePaused ? (
                        <button
                          className="button"
                          onClick={resumeSleepMode}
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            background: "var(--accent)",
                            border: "2px solid var(--accent)",
                            borderRadius: "8px"
                          }}
                        >
                          Resume
                        </button>
                      ) : (
                        <button
                          className="button"
                          onClick={pauseSleepMode}
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            background: "var(--accent-gold)",
                            border: "2px solid var(--accent-gold)",
                            borderRadius: "8px"
                          }}
                        >
                          Pause
                        </button>
                      )}
                      
                      <button
                        className="button"
                        onClick={stopSleepMode}
                        style={{
                          padding: "8px 16px",
                          fontSize: "14px",
                          background: "#ff6b6b",
                          border: "2px solid #ff6b6b",
                          borderRadius: "8px"
                        }}
                      >
                        Stoppa
                      </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="controls" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      className="button"
                      onClick={async () => {
                        // Check if user has Pro or Premium tier
                        if (!hasPremium) {
                          setShowPaywall(true);
                          return;
                        }
                        
                        // Get tier from cookie
                    const cookie = document.cookie || "";
                    const tierMatch = cookie.match(/premium_tier=([^;]+)/);
                    const tier = tierMatch ? tierMatch[1] : "basic";
                    
                    if (tier !== "pro" && tier !== "premium") {
                          setShowPaywall(true);
                          return;
                        }
                        
                        try {
                          // Save the already generated MP3
                          const audioElement = document.getElementById("story-audio") as HTMLAudioElement;
                          if (audioElement && audioElement.src) {
                            const response = await fetch(audioElement.src);
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `dromlyktan-${Date.now()}.mp3`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                            showToast("💾 MP3 sparad!", "success");
                          }
                        } catch (error) {
                          showToast("Kunde inte spara MP3", "error");
                        }
                      }}
                      style={{ 
                        background: "var(--accent-gold)", 
                        color: "var(--bg-primary)",
                        opacity: hasPremium ? 1 : 0.6
                      }}
                    >💾 Spara MP3 {!hasPremium && "🔒"}</button>
                    
                  <button
                    className="button"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/tts", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ text: story, voice: ttsVoice, rate: ttsRate, download: true })
                          });
                          if (!res.ok) throw new Error("Nedladdning misslyckades");
                          // Let browser handle Content-Disposition download
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `dromlyktan-${Date.now()}.mp3`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                          showToast("🔄 Ny MP3 genererad och nedladdad!", "success");
                        } catch (error) {
                          showToast("Kunde inte generera ny MP3", "error");
                        }
                      }}
                    >🔄 Generera ny MP3</button>
              </div>
                  
                </div>
              )}
            </div>
            
            
            <hr />
            <div>
              <label>Bibliotek {history.length > 0 && <span className="small" style={{ color: "var(--text-secondary)" }}>({filteredHistory.length} av {history.length})</span>}</label>
              
              {history.length > 0 && (
                <div style={{ marginBottom: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="Sök i sagor..."
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    style={{ 
                      flex: 1, 
                      minWidth: "200px",
                      padding: "8px 12px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "var(--text-primary)"
                    }}
                  />
                  <select
                    value={libraryFilter}
                    onChange={(e) => setLibraryFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "var(--text-primary)"
                    }}
                  >
                    <option value="all">Alla sagor</option>
                    <option value="recent">Senaste veckan</option>
                    <option value="favoriter">Favoriter (4+ stjärnor)</option>
                    <option value="magisk">Magisk</option>
                    <option value="djur">Djur</option>
                    <option value="prinsessa">Prinsessor</option>
                    <option value="rymden">Rymden</option>
                    <option value="natur">Natur</option>
                  </select>
                </div>
              )}
              
              {filteredHistory.length === 0 ? (
                <p className="small">
                  {history.length === 0 ? "Senaste sagan är fri. Tidigare sagor blir Premium i MVP." : "Inga sagor matchar dina filter."}
                </p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {filteredHistory.map((h, idx) => {
                    const isExpanded = expandedLibraryItems.has(h.id);
                    return (
                      <li key={h.id} style={{ 
                        marginBottom: 8, 
                        border: "1px solid rgba(255,255,255,0.1)", 
                        borderRadius: "8px",
                        overflow: "hidden"
                      }}>
                        {/* Compact header - always visible */}
                        <div 
                          style={{ 
                            display: "flex", 
                            gap: 8, 
                            alignItems: "center", 
                            padding: "12px",
                            cursor: "pointer",
                            background: isExpanded ? "rgba(255,255,255,0.02)" : "transparent",
                            transition: "background 0.2s ease"
                          }}
                          onClick={() => toggleLibraryItem(h.id)}
                        >
                      <span className="badge">{new Date(h.createdAt).toLocaleTimeString()}</span>
                      <span style={{ flex: 1, opacity: idx === 0 ? 1 : 0.6 }}>
                        {idx > 0 ? `🔒 ${h.title}` : h.title}
                      </span>
                          <span style={{ 
                            fontSize: "12px", 
                            color: "var(--text-secondary)",
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease"
                          }}>
                            ▼
                          </span>
                        </div>
                        
                        {/* Expanded content - only visible when expanded */}
                        {isExpanded && (
                          <div style={{ 
                            padding: "12px", 
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            background: "rgba(255,255,255,0.01)"
                          }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                      <button
                        className="button"
                        disabled={idx > 0}
                        onClick={() => {
                          if (idx > 0) {
                            alert("Premium krävs för att öppna äldre sagor.");
                            return;
                          }
                          setStory(h.content);
                          setError("");
                        }}
                      >Öppna</button>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => rateStory(h.id, star)}
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: "14px",
                              cursor: "pointer",
                              color: userRatings[h.id] >= star ? "#ffd700" : "rgba(255,255,255,0.3)",
                              transition: "color 0.2s ease"
                            }}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                            </div>
                            
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        <button
                          className="button"
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                          onClick={async () => {
                            if (!hasPremium) {
                              setShowPaywall(true);
                              return;
                            }
                            try {
                              const res = await fetch("/api/export", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  storyId: h.id, 
                                  format: "pdf", 
                                  title: h.title, 
                                  content: h.content 
                                })
                              });
                              if (res.ok) {
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `${h.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
                                a.click();
                                URL.revokeObjectURL(url);
                                showToast("📄 PDF exporterad!", "success");
                              } else {
                                showToast("Export misslyckades", "error");
                              }
                            } catch (error) {
                              showToast("Export misslyckades", "error");
                            }
                          }}
                        >📄 PDF</button>
                        <button
                          className="button"
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                          onClick={async () => {
                            if (!hasPremium) {
                              setShowPaywall(true);
                              return;
                            }
                            try {
                              const res = await fetch("/api/export", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  storyId: h.id, 
                                  format: "txt", 
                                  title: h.title, 
                                  content: h.content 
                                })
                              });
                              if (res.ok) {
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `${h.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                                showToast("📝 Textfil exporterad!", "success");
                              } else {
                                showToast("Export misslyckades", "error");
                              }
                            } catch (error) {
                              showToast("Export misslyckades", "error");
                            }
                          }}
                        >📝 TXT</button>
                              <button
                                className="button"
                                style={{ 
                                  fontSize: "12px", 
                                  padding: "4px 8px",
                                  background: "linear-gradient(135deg, #ff6b6b, #ffa500)",
                                  border: "2px solid #ffa500"
                                }}
                                onClick={async () => {
                                  // Confirm purchase
                                  const confirmed = confirm(`Generera magisk röst för "${h.title}"?\n\nKostnad: 5 kr`);
                                  if (!confirmed) return;
                                  
                                  try {
                                    // Process payment
                                    setLoading(true);
                                    const paymentRes = await fetch("/api/checkout", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        amount: 500, // 5 kr in öre
                                        description: `Magisk röst för sagan: ${h.title}`,
                                        storyId: h.id,
                                        type: "magical_voice"
                                      })
                                    });
                                    
                                    if (!paymentRes.ok) {
                                      const error = await paymentRes.json();
                                      throw new Error(error.error || "Betalning misslyckades");
                                    }
                                    
                                    const paymentData = await paymentRes.json();
                                    
                                    // Redirect to Stripe checkout
                                    window.location.href = paymentData.url;
                                    
                                  } catch (error: any) {
                                    console.error("Payment Error:", error);
                                    showToast(error.message || "Fel vid betalning", "error");
                                    setLoading(false);
                                  }
                                }}
                              ><img src="/lantern.png" alt="Lykt" style={{ width: "12px", height: "12px", marginRight: "4px" }} />Magisk röst (5 kr)</button>
                        <button
                          className="button"
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                          onClick={() => {
                            // Show pricing modal
                            const format = prompt("Välj format:\n1. Softcover (149kr)\n2. Hardcover (249kr)\n3. Premium med illustrationer (349kr)");
                            if (!format) return;
                            
                            const formatMap: Record<string, { type: string; price: number; pages: number }> = {
                              "1": { type: "softcover", price: hasPremium ? 119 : 149, pages: 24 },
                              "2": { type: "hardcover", price: hasPremium ? 199 : 249, pages: 32 },
                              "3": { type: "premium", price: hasPremium ? 279 : 349, pages: 40 }
                            };
                            
                            const selected = formatMap[format];
                            if (!selected) return;
                            
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.multiple = true;
                            input.onchange = async () => {
                              const files = Array.from(input.files || []);
                              const images: string[] = [];
                              for (const f of files.slice(0, 6)) {
                                const b = await f.arrayBuffer();
                                const base64 = btoa(String.fromCharCode(...new Uint8Array(b)));
                                images.push(`data:${f.type};base64,${base64}`);
                              }
                              fetch("/api/order", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  storyId: h.id, 
                                  title: h.title, 
                                  format: selected.type, 
                                  pages: selected.pages, 
                                  images,
                                  price: selected.price,
                                  hasPremium
                                })
                              }).then(async (r) => {
                                const j = await r.json();
                                if (!r.ok) return alert(j?.error || "Fel vid beställning");
                                alert(`Beställning skapad! Order-id: ${j.orderId}\nPris: ${selected.price}kr${hasPremium ? " (Premium-rabatt inkluderad)" : ""}`);
                              });
                            };
                            input.click();
                          }}
                        >📚 Beställ bok</button>
                      </div>
                          </div>
                        )}
                    </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
      {showPaywall && (
        <div className="modal-backdrop" onClick={() => setShowPaywall(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="badge premium" style={{ marginBottom: 12 }}>✨ Premium</div>
            <div className="modal-title">Välj din Drömlyktan-plan</div>
            <p className="modal-sub">Alltid gratis 3-minuters sagor. Lås upp mer med Premium.</p>

            <div style={{ display: "grid", gap: 12 }}>
              {/* Free tier - always visible */}
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>Gratis</strong>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", color: "var(--accent-gold)" }}>0 kr/mån</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Alltid gratis</div>
                  </div>
                </div>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  <li>3 minuters sagor</li>
                  <li>5 sagor per vecka</li>
                  <li>1 Magisk röst per vecka</li>
                  <li>Standardröst (Google TTS)</li>
                </ul>
                <div style={{ marginTop: "12px", padding: "8px 12px", background: "rgba(255,165,0,0.1)", borderRadius: "8px", fontSize: "14px", textAlign: "center" }}>
                  Du använder redan denna plan
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>Basic</strong>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>29 kr/mån</div>
                    <div style={{ fontSize: "12px", color: "var(--accent-gold)" }}>299 kr/år (2 mån gratis)</div>
                  </div>
                </div>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  <li>3-5 minuters sagor</li>
                  <li>10 sagor per vecka</li>
                  <li>2 Magiska röster per vecka</li>
                  <li>Standardröst (Google TTS)</li>
                </ul>
                <div className="modal-actions" style={{ justifyContent: "space-between" }}>
                  <button className="button" onClick={async () => {
                    try {
                      const res = await fetch("/api/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tier: "basic", period: "yearly" })
                      });
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      }
                    } catch (error) {
                      showToast("Kunde inte starta betalning", "error");
                    }
                  }}>Årsplan (299 kr)</button>
                  <button className="button" onClick={async () => {
                    try {
                      const res = await fetch("/api/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tier: "basic", period: "monthly" })
                      });
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      }
                    } catch (error) {
                      showToast("Kunde inte starta betalning", "error");
                    }
                  }}>Månadsplan (29 kr)</button>
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>Pro</strong>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>59 kr/mån</div>
                    <div style={{ fontSize: "12px", color: "var(--accent-gold)" }}>599 kr/år (2 mån gratis)</div>
                  </div>
                </div>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  <li>Allt i Basic</li>
                  <li>3-10 minuters sagor</li>
                  <li>50 sagor per vecka</li>
                  <li>5 Magiska röster per vecka</li>
                  <li>Sleep-timer & white noise</li>
                  <li>Obegränsade karaktärer</li>
                  <li>Sagoteman</li>
                  <li>📄 Export som PDF/TXT</li>
                  <li>💾 Spara MP3-filer</li>
                  <li>🎵 Avancerade röstkontroller</li>
                </ul>
                <div className="modal-actions" style={{ justifyContent: "space-between" }}>
                  <button className="button" onClick={async () => {
                    try {
                      const res = await fetch("/api/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tier: "pro", period: "yearly" })
                      });
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      }
                    } catch (error) {
                      showToast("Kunde inte starta betalning", "error");
                    }
                  }}>Årsplan (599 kr)</button>
                  <button className="button" onClick={async () => {
                    try {
                      const res = await fetch("/api/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tier: "pro", period: "monthly" })
                      });
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      }
                    } catch (error) {
                      showToast("Kunde inte starta betalning", "error");
                    }
                  }}>Månadsplan (59 kr)</button>
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,223,138,0.35)", background: "rgba(255,223,138,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>Premium</strong>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>99 kr/mån</div>
                    <div style={{ fontSize: "12px", color: "var(--accent-gold)" }}>999 kr/år (2 mån gratis)</div>
                  </div>
                </div>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  <li>Allt i Pro</li>
                  <li>3-12 minuters sagor</li>
                  <li>100 sagor per vecka</li>
                  <li>10 Magiska röster per vecka</li>
                  <li>Kapitel-serie (flera kapitel)</li>
                  <li>Familjeprofil</li>
                  <li>📄 Export som PDF/TXT</li>
                  <li>💾 Spara MP3-filer</li>
                  <li>⏰ Sleep Timer</li>
                  <li>🎵 Avancerade röstkontroller</li>
                </ul>
                <div className="modal-actions" style={{ justifyContent: "space-between" }}>
                  <button className="button" onClick={async () => {
                    try {
                      const res = await fetch("/api/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tier: "premium", period: "yearly" })
                      });
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      }
                    } catch (error) {
                      showToast("Kunde inte starta betalning", "error");
                    }
                  }}>Årsplan (999 kr)</button>
                  <button className="button" onClick={async () => {
                    try {
                      const res = await fetch("/api/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tier: "premium", period: "monthly" })
                      });
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      }
                    } catch (error) {
                      showToast("Kunde inte starta betalning", "error");
                    }
                  }}>Månadsplan (99 kr)</button>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="button" onClick={() => setShowPaywall(false)}>Inte nu</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast notifications */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          padding: "12px 16px",
          borderRadius: "8px",
          background: toast.type === 'success' ? "rgba(34, 197, 94, 0.9)" : 
                     toast.type === 'error' ? "rgba(239, 68, 68, 0.9)" : 
                     "rgba(59, 130, 246, 0.9)",
          color: "white",
          fontWeight: "600",
          fontSize: "14px",
          zIndex: 1000,
          animation: "slideIn 0.3s ease-out",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
        }}>
          {toast.message}
        </div>
      )}
    </main>
  );
}


