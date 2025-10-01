# 🎙️ ElevenLabs Setup Guide för Drömlyktan

## Steg 1: Skapa ElevenLabs-konto

1. Gå till [elevenlabs.io](https://elevenlabs.io)
2. Skapa ett konto (gratis eller betald plan)
3. Logga in

---

## Steg 2: Få din API-nyckel

1. Gå till **Profile** (klicka på din profil uppe till höger)
2. Gå till **API Keys**
3. Klicka **Create New Key** eller kopiera befintlig nyckel
4. Spara nyckeln (den visas bara en gång!)

---

## Steg 3: Hitta svenska röster

### Alternativ A: Använd vårt script (Rekommenderat)

```bash
# Kör scriptet för att lista alla tillgängliga röster
node scripts/list-elevenlabs-voices.js
```

Detta visar alla dina tillgängliga röster med:
- Namn
- Voice ID
- Språkstöd
- Beskrivning
- Märkning om rösten stöder svenska 🇸🇪

### Alternativ B: Manuellt via ElevenLabs website

1. Gå till [elevenlabs.io/voice-library](https://elevenlabs.io/voice-library)
2. Filtrera på:
   - **Language**: Swedish
   - **Use case**: Narration / Storytelling
   - **Gender**: Female (för mjukare röst) eller Male (för djupare röst)
3. Lyssna på röster och hitta en du gillar
4. Klicka på rösten och kopiera **Voice ID** (längst ner)

---

## Steg 4: Lägg till röster i appen

### Öppna `app/api/tts/route.ts`

Hitta `elevenLabsVoiceMap` (rad ~65) och uppdatera med dina svenska röster:

```typescript
const elevenLabsVoiceMap: Record<string, string> = {
  "shimmer": "DIN_SVENSKA_ROST_ID_1", // T.ex. kvinnlig, varm röst
  "nova": "DIN_SVENSKA_ROST_ID_2",    // T.ex. kvinnlig, ung röst
  "echo": "DIN_SVENSKA_ROST_ID_3",    // T.ex. manlig, naturlig röst
  "alloy": "DIN_SVENSKA_ROST_ID_1",   // Default
  "fable": "DIN_SVENSKA_ROST_ID_4",   // T.ex. manlig berättarröst
  "onyx": "DIN_SVENSKA_ROST_ID_5"     // T.ex. manlig, djup röst
};
```

**Exempel med riktiga Voice IDs:**
```typescript
const elevenLabsVoiceMap: Record<string, string> = {
  "shimmer": "abc123xyz", // Din svenska kvinnliga röst
  "nova": "def456uvw",    // Din svenska unga röst
  "echo": "ghi789rst",    // Din svenska manliga röst
  "alloy": "abc123xyz",   // Default till samma som shimmer
  "fable": "ghi789rst",   // Samma som echo
  "onyx": "jkl012mno"     // Din djupa röst
};
```

---

## Steg 5: Konfigurera API-nyckel

### Lokalt (för utveckling)

Öppna `.env.local` och lägg till:
```env
ELEVENLABS_API_KEY=sk_dinhemliganyckelhar
```

### På Vercel (för production)

1. Gå till Vercel Dashboard → ditt projekt
2. **Settings** → **Environment Variables**
3. Klicka **Add New**
4. Name: `ELEVENLABS_API_KEY`
5. Value: Din API-nyckel
6. Environment: ✅ Production, ✅ Preview, ✅ Development
7. Klicka **Save**
8. Redeploya (sker automatiskt)

---

## Rekommenderade svenska röster för godnattsagor

### ElevenLabs Professional Voices (Betalt konto)

**Kvinnliga röster:**
- **Saga** - Svensk, varm, berättande (om tillgänglig)
- **Astrid** - Svensk, lugn, mjuk (om tillgänglig)

**Manliga röster:**
- **Erik** - Svensk, trygg, djup (om tillgänglig)
- **Oscar** - Svensk, vänlig, naturlig (om tillgänglig)

### ElevenLabs Multilingual Voices (Fungerar på svenska)

Om inga svenska röster finns direkt, använd dessa multilinguala röster som fungerar BRA på svenska:

**Rekommenderade:**
- **Rachel** (Voice ID: `21m00Tcm4TlvDq8ikWAM`) - Female, calm, storytelling
- **Domi** (Voice ID: `AZnzlk1XvdvUeBnXmlld`) - Female, warm, nurturing
- **Bella** (Voice ID: `EXAVITQu4vr4xnSDxMaL`) - Female, soft, gentle
- **Adam** (Voice ID: `pNInz6obpgDQGcFmaJgB`) - Male, natural, warm
- **Antoni** (Voice ID: `ErXwobaYiN019PkySvjV`) - Male, calm, deep

---

## Steg 6: Testa rösterna

1. Kör scriptet: `node scripts/list-elevenlabs-voices.js`
2. Hitta röster märkta med 🇸🇪 eller med "swedish" i labels
3. Kopiera Voice ID
4. Uppdatera `elevenLabsVoiceMap` i `app/api/tts/route.ts`
5. Commit och pusha: 
   ```bash
   git add app/api/tts/route.ts
   git commit -m "Update ElevenLabs voices to Swedish"
   git push
   ```
6. Testa på Vercel!

---

## Felsökning

### "ElevenLabs API not configured"
- ✅ Kolla att `ELEVENLABS_API_KEY` finns i Vercel environment variables
- ✅ Redeploya appen

### "Invalid API key"
- ✅ Kontrollera att nyckeln är korrekt kopierad (inga extra spaces)
- ✅ Kolla att nyckeln inte har gått ut

### "Quota exceeded"
- ✅ Kolla din quota på elevenlabs.io
- ✅ Uppgradera till betald plan om nödvändigt

### "Voice not found"
- ✅ Kontrollera att Voice ID är korrekt
- ✅ Vissa röster kräver premium-konto

### "Language not supported"
- ✅ Använd `eleven_multilingual_v2` modellen (redan konfigurerad)
- ✅ Testa med multilingual voices som Rachel, Bella, Adam

---

## Voice Settings (Redan optimerade)

Nuvarande inställningar i `utils/elevenLabs.ts`:

```typescript
voice_settings: {
  stability: 0.5,        // Balanserat (0-1)
  similarity_boost: 0.75, // Naturligt (0-1)
  style: 0.0,            // Mindre dramatiskt (0-1)
  use_speaker_boost: true // Förbättrad klarhet
}
```

**För godnattsagor kan du justera:**
- `stability: 0.7` - Lugnare, mer konsistent
- `similarity_boost: 0.8` - Mer naturlig röst
- `style: 0.1` - Lite mer uttrycksfull

---

## Kostnader

**ElevenLabs Free Tier:**
- 10,000 tecken/månad (~5-10 korta sagor)
- Tillgång till alla röster
- Kommersiell licens

**ElevenLabs Starter ($5/månad):**
- 30,000 tecken/månad (~15-30 sagor)
- Alla röster + voice cloning
- Kommersiell licens

**ElevenLabs Creator ($22/månad):**
- 100,000 tecken/månad (~50-100 sagor)
- Alla premium features
- Perfekt för Drömlyktan!

---

## Nästa steg

1. **Kör script**: `node scripts/list-elevenlabs-voices.js`
2. **Hitta svenska röster** eller välj multilingual voices
3. **Uppdatera röst-mapping** i `app/api/tts/route.ts`
4. **Commit & pusha** till GitHub
5. **Testa** på Vercel!

Berätta vilka röster du hittar så kan jag hjälpa dig konfigurera dem! 🎙️

