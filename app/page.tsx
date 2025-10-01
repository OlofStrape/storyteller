"use client";
import { useMemo, useState, useEffect } from "react";

export default function HomePage() {
  const [name, setName] = useState("Victor");
  const [age, setAge] = useState(7);
  const [interests, setInterests] = useState("");
  const [characters, setCharacters] = useState<string[]>([]); // Chip-based characters
  const [characterDraft, setCharacterDraft] = useState("");
  const [tone, setTone] = useState("mysig");
  const [lengthMin, setLengthMin] = useState<3 | 5 | 8>(3);
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
  const [ttsProvider, setTtsProvider] = useState<string>("elevenlabs"); // Default to ElevenLabs for testing
  const [ttsRate, setTtsRate] = useState<number>(0.9);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  const [ttsVolume, setTtsVolume] = useState<number>(1.0);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [sleepVolume, setSleepVolume] = useState<number>(0.25);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [storyTheme, setStoryTheme] = useState<string>("standard");
  const [dailyUsage, setDailyUsage] = useState<number>(0);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [storySeries, setStorySeries] = useState<{ id: string; title: string; chapters: number; lastStory: string } | null>(null);
  const [librarySearch, setLibrarySearch] = useState<string>("");
  const [libraryFilter, setLibraryFilter] = useState<string>("all");
  const [sleepTimer, setSleepTimer] = useState<number>(0);
  const [sleepTimerActive, setSleepTimerActive] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [showDevControls, setShowDevControls] = useState<boolean>(false); // Dev controls hidden by default
  const [isClient, setIsClient] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check if premium features are required
  const premiumRequired = useMemo(() => {
    if (lengthMin > 3) return true; // Any length > 3 min requires premium
    if (savedCharacters.length > 0) return true; // Saved characters require premium
    return false;
  }, [lengthMin, savedCharacters.length]);

  // Calculate daily limits based on premium tier
  const getDailyLimit = () => {
    if (!hasPremium) return 1; // Free users
    // Get premium tier from cookie (SSR-safe)
    if (typeof window === 'undefined') return 10; // Default to premium tier during SSR
    const cookie = document.cookie || "";
    const tierMatch = cookie.match(/premium_tier=([^;]+)/);
    const tier = tierMatch ? tierMatch[1] : "basic";
    
    switch (tier) {
      case "basic": return 3;
      case "plus": return 5;
      case "premium": return 10;
      default: return 3;
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

  const isOverDailyLimit = dailyUsage >= getDailyLimit();

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
      // read premium cookie
      const cookie = document.cookie || "";
      const hasPremiumCookie = /((^|;\s*)premium=1)(;|$)/.test(cookie);
      setHasPremium(hasPremiumCookie);
      
      // Load story series
      const savedSeries = localStorage.getItem("story.series");
      if (savedSeries) {
        setStorySeries(JSON.parse(savedSeries));
      }
      
      // Always use ElevenLabs for testing
      setTtsProvider("elevenlabs");
      localStorage.setItem("tts.provider", "elevenlabs");
      
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

    // Set client-side flag
    setIsClient(true);

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
        generateStory();
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

  const generateStory = async () => {
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
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
        userPreferences,
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
        
        // Update daily usage
        const newUsage = dailyUsage + 1;
        setDailyUsage(newUsage);
        try {
          localStorage.setItem("daily.usage", JSON.stringify({ count: newUsage, date: new Date().toDateString() }));
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

  async function tts() {
    setLoading(true);
    setError("");
    
    // Premium TTS is available for testing
    try {
      if (ttsProvider === 'web-speech') {
        // Web Speech API - free and natural
        if ('speechSynthesis' in window) {
          const synth = (window as any).speechSynthesis;
          const voices = synth.getVoices();
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
          
          if (selectedVoice) {
            utter.voice = selectedVoice;
            synth.cancel();
            synth.speak(utter);
            showToast(`Använder ${selectedVoice.name} (Web Speech API)`, "success");
            setLoading(false);
            return;
          }
        }
        throw new Error("Web Speech API inte tillgänglig");
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
            provider: ttsProvider
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
        setTimeout(() => {
          const el = document.getElementById("story-audio") as HTMLAudioElement | null;
          if (el) {
            el.playbackRate = ttsRate;
            el.play().catch(() => {});
            setAudioEl(el);
          }
        }, 50);
        
        const providerNames = {
          'openai': 'OpenAI TTS',
          'azure': 'Azure Speech',
          'elevenlabs': 'ElevenLabs'
        };
        showToast(`Använder ${providerNames[ttsProvider as keyof typeof providerNames]}`, "success");
      }
    } catch (e: any) {
      console.error("TTS Error:", e);
      const errorMessage = e?.message || e?.toString() || "Unknown error";
      setError(`TTS misslyckades (${ttsProvider}): ${errorMessage}`);
      
      // Fallback to Web Speech API
      if (ttsProvider !== 'web-speech' && 'speechSynthesis' in window) {
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
    } finally {
      setLoading(false);
    }
  }

  const startSleepMode = () => {
    // Auto-enabled for testing (no tier check needed)
    const src = `/audio/${sleepChoice}.mp3`;
    const el = new Audio(src);
    el.loop = true;
    el.volume = sleepVolume;
    setSleepEl(el);
    setPlayingSleep(true);
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
    localStorage.setItem("daily.usage", JSON.stringify({ count: 0, date: new Date().toDateString() }));
    showToast("📊 Daglig användning återställd", "success");
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
              Status: {hasPremium ? "✅ Premium" : "❌ Free"} | Mode: {mode === "openai" ? "🤖 OpenAI" : "🏠 Local"} | TTS: {ttsProvider === "elevenlabs" ? "👑 ElevenLabs" : "🆓 Web Speech"} | Usage: {dailyUsage}/{getDailyLimit()}
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
              min={3}
              max={15}
              step={1}
              value={lengthMin}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (v > 3 && !hasPremium) {
                  setShowPaywall(true);
                  setLengthMin(3 as any);
                } else {
                  setLengthMin(v as any);
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
            <label style={{ textAlign: "center" }}>Sagotema {storyTheme !== "standard" && <span className="badge">🔒 Premium</span>}</label>
            <select value={storyTheme} onChange={(e) => {
              const theme = e.target.value;
              if (theme !== "standard" && !hasPremium) {
                setShowPaywall(true);
                return;
              }
              setStoryTheme(theme);
            }}>
              <option value="standard">Standard (Alltid tillgängligt)</option>
              <option value="magisk">Magisk äventyr ✨</option>
              <option value="djur">Djurens värld 🐾</option>
              <option value="prinsessa">Prinsessor & riddare 👑</option>
              <option value="rymden">Rymdäventyr 🚀</option>
              <option value="natur">Natur & skog 🌲</option>
              <option value="mystik">Mystik & gåtor 🔮</option>
              <option value="äventyr">Äventyr & utforskning 🗺️</option>
              <option value="vänskap">Vänskap & gemenskap 🤝</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <button 
            className="button" 
            onClick={generateStory} 
            disabled={loading}
            aria-label="Generera en ny saga"
            style={{ 
              fontSize: "16px", 
              padding: "16px 32px",
              minWidth: "240px"
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
              {premiumRequired ? "Premium vald" : 
               isOverDailyLimit ? "Gräns nådd" : 
               `Gratis (${dailyUsage}/${getDailyLimit()} idag)`}
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

        <hr />
        <div>
          <label style={{ textAlign: "center" }}>Sleep Mode (efter sagan)</label>
          <div className="row">
            <div>
              <label style={{ textAlign: "center", fontSize: "14px", marginBottom: "6px" }}>Ljudtyp</label>
              <select value={sleepChoice} onChange={(e) => setSleepChoice(e.target.value)}>
                <option value="white-noise">White noise</option>
                <option value="rain">Regn</option>
                <option value="waves">Vågor</option>
                <option value="fireplace">Eldsprak</option>
                <option value="forest">Skogsnatt</option>
              </select>
            </div>
            <div>
              <label style={{ textAlign: "center", fontSize: "14px", marginBottom: "6px" }}>Sleep Timer</label>
              <select 
                value={sleepTimer} 
                onChange={(e) => setSleepTimer(Number(e.target.value))}
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
              {sleepTimerActive && (
                <span className="small" style={{ color: "var(--accent-gold)", display: "block", marginTop: "4px", textAlign: "center" }}>
                  ⏰ Timer aktiv: {sleepTimer} min
                </span>
              )}
            </div>
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
                      onClick={generateStory}
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
                            🚀 Starta serie
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
                <button className="button" onClick={tts} disabled={loading || !story}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ 
                        width: "14px", 
                        height: "14px", 
                        border: "2px solid rgba(255,255,255,0.3)", 
                        borderTop: "2px solid var(--accent)", 
                        borderRadius: "50%", 
                        animation: "spin 1s linear infinite" 
                      }} />
                      Skapar ljud...
                    </span>
                  ) : "🎵 Läs upp (TTS)"}
                </button>
                <select value={ttsVoice} onChange={(e) => {
                  const voice = e.target.value;
                  if (['echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(voice) && !hasPremium) {
                    setShowPaywall(true);
                    return;
                  }
                  setTtsVoice(voice);
                }}>
                  <option value="shimmer">Shimmer (Lugn & mjuk) ⭐</option>
                  <option value="nova">Nova (Varm & mysig) ⭐</option>
                  <option value="alloy">Alloy (Standard)</option>
                  <option value="echo">Echo (Djup & trygg) 🔒</option>
                  <option value="fable">Fable (Berättarröst) 🔒</option>
                  <option value="onyx">Onyx (Mogen & mystisk) 🔒</option>
                </select>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                  <div>
                    <span className="small">Hastighet: {ttsRate.toFixed(1)}x</span>
                    <input type="range" min={0.6} max={1.3} step={0.1} value={ttsRate} onChange={(e) => setTtsRate(parseFloat(e.target.value))} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <span className="small">Ton: {ttsPitch.toFixed(1)}x</span>
                    <input type="range" min={0.5} max={2.0} step={0.1} value={ttsPitch} onChange={(e) => setTtsPitch(parseFloat(e.target.value))} style={{ width: "100%" }} />
                  </div>
                  <div>
                    <span className="small">Volym: {Math.round(ttsVolume * 100)}%</span>
                    <input type="range" min={0.1} max={1.0} step={0.1} value={ttsVolume} onChange={(e) => setTtsVolume(parseFloat(e.target.value))} style={{ width: "100%" }} />
                  </div>
                </div>
              </div>
              {audioUrl && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <audio id="story-audio" className="audio" src={audioUrl} controls />
                  <div className="controls">
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
                        } catch {}
                      }}
                    >Ladda ner ljudfil (MP3)</button>
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
                  {filteredHistory.map((h, idx) => (
                    <li key={h.id} style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="badge">{new Date(h.createdAt).toLocaleTimeString()}</span>
                      <span style={{ flex: 1, opacity: idx === 0 ? 1 : 0.6 }}>
                        {idx > 0 ? `🔒 ${h.title}` : h.title}
                      </span>
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
                    </li>
                  ))}
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
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>Basic</strong>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>29 kr/mån</div>
                    <div style={{ fontSize: "12px", color: "var(--accent-gold)" }}>299 kr/år (2 mån gratis)</div>
                  </div>
                </div>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  <li>3-8 min sagor</li>
                  <li>3 sagor/dag</li>
                  <li>1 sparad karaktär</li>
                  <li>Standard-röster</li>
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
                  <strong>Plus</strong>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>39 kr/mån</div>
                    <div style={{ fontSize: "12px", color: "var(--accent-gold)" }}>399 kr/år (2 mån gratis)</div>
                  </div>
                </div>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  <li>Allt i Basic</li>
                  <li>3-10 min sagor</li>
                  <li>5 sagor/dag</li>
                  <li>Sleep Mode</li>
                  <li>Obegränsade karaktärer</li>
                  <li>Premium-röster (OpenAI HD, Azure Svenska, ElevenLabs AI)</li>
                  <li>Sagoteman</li>
                  <li>📄 Export som PDF/TXT</li>
                  <li>⏰ Sleep Timer</li>
                  <li>🎵 Avancerade röstkontroller</li>
                </ul>
                <div className="modal-actions" style={{ justifyContent: "space-between" }}>
                  <button className="button" onClick={async () => {
                    try {
                      const res = await fetch("/api/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tier: "plus", period: "yearly" })
                      });
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      }
                    } catch (error) {
                      showToast("Kunde inte starta betalning", "error");
                    }
                  }}>Årsplan (399 kr)</button>
                  <button className="button" onClick={async () => {
                    try {
                      const res = await fetch("/api/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tier: "plus", period: "monthly" })
                      });
                      const data = await res.json();
                      if (data.url) {
                        window.location.href = data.url;
                      }
                    } catch (error) {
                      showToast("Kunde inte starta betalning", "error");
                    }
                  }}>Månadsplan (39 kr)</button>
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,223,138,0.35)", background: "rgba(255,223,138,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>Premium</strong>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>79 kr/mån</div>
                    <div style={{ fontSize: "12px", color: "var(--accent-gold)" }}>799 kr/år (2 mån gratis)</div>
                  </div>
                </div>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  <li>Allt i Plus</li>
                  <li>3-15 min sagor</li>
                  <li>10 sagor/dag</li>
                  <li>Kapitel-serie (flera kapitel)</li>
                  <li>Rabatt på böcker</li>
                  <li>Familjeprofil</li>
                  <li>📄 Export som PDF/TXT</li>
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
                  }}>Årsplan (799 kr)</button>
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
                  }}>Månadsplan (79 kr)</button>
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


