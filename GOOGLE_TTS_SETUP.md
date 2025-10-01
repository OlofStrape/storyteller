# 🎙️ Google Cloud Text-to-Speech Setup Guide

## Varför Google TTS?

- ✨ **Bästa svenska rösterna** (WaveNet-teknologi)
- 💰 **1 miljon tecken gratis/månad** (räcker till ~100+ sagor!)
- 🚀 **Snabb och pålitlig**
- 🇸🇪 **5 svenska WaveNet-röster** att välja mellan

---

## 📝 Steg-för-steg instruktioner

### 1. Skapa Google Cloud-konto

1. Gå till: https://console.cloud.google.com/
2. Klicka på **"Get started for free"**
3. Logga in med ditt Google-konto
4. Fyll i betalningsinfo (krävs men du får $300 i gratis credits + gratis tier)

### 2. Skapa ett nytt projekt

1. I Google Cloud Console, klicka på projekt-dropdownen högst upp
2. Klicka **"NEW PROJECT"**
3. Namnge projektet: `Drömlyktan` (eller valfritt namn)
4. Klicka **"CREATE"**

### 3. Aktivera Text-to-Speech API

1. Gå till: https://console.cloud.google.com/apis/library
2. Sök efter **"Cloud Text-to-Speech API"**
3. Klicka på API:et
4. Klicka **"ENABLE"**

### 4. Skapa API-nyckel

1. Gå till: https://console.cloud.google.com/apis/credentials
2. Klicka **"+ CREATE CREDENTIALS"**
3. Välj **"API key"**
4. Din API-nyckel visas nu! Kopiera den

**Säkerhet (Viktigt!):**
- Klicka **"RESTRICT KEY"**
- Under **"API restrictions"**, välj **"Restrict key"**
- Välj endast **"Cloud Text-to-Speech API"**
- Under **"Application restrictions"**, kan du välja **"HTTP referrers"** och lägga till din domän
- Klicka **"SAVE"**

### 5. Lägg till i ditt projekt

1. Öppna `.env.local` (eller skapa filen om den inte finns)
2. Lägg till:
   ```
   GOOGLE_TTS_API_KEY=AIzaSy...din_api_nyckel_här
   ```
3. Spara filen
4. Starta om dev-servern: `npm run dev`

### 6. Lägg till i Vercel (Production)

1. Gå till: https://vercel.com/dashboard
2. Välj ditt projekt
3. Gå till **Settings** → **Environment Variables**
4. Lägg till:
   - **Key**: `GOOGLE_TTS_API_KEY`
   - **Value**: Din API-nyckel
   - **Environment**: Production, Preview, Development (välj alla)
5. Klicka **"Save"**
6. Redeploya projektet

---

## 🎵 Tillgängliga svenska röster

Google TTS har 5 WaveNet-röster för svenska:

| Voice ID | Typ | Beskrivning |
|----------|-----|-------------|
| `sv-SE-Wavenet-A` | Kvinna | Varm & naturlig (Standard) |
| `sv-SE-Wavenet-B` | Kvinna | Mjuk & lugn |
| `sv-SE-Wavenet-C` | Kvinna | Ung & energisk |
| `sv-SE-Wavenet-D` | Man | Djup & lugn |
| `sv-SE-Wavenet-E` | Man | Varm & berättande |

**Röstmappning i appen:**
- `shimmer` / `alloy` → Wavenet-A (Kvinna, varm)
- `nova` → Wavenet-E (Man, varm)
- `echo` → Wavenet-B (Kvinna, mjuk)
- `fable` → Wavenet-C (Kvinna, energisk)
- `onyx` → Wavenet-D (Man, djup)

---

## 💰 Prissättning

### Gratis Tier (Alltid!)
- **1 miljon tecken/månad** gratis
- **~100-150 sagor** (varje saga ~7,000-10,000 tecken)

### Efter gratis tier
- **WaveNet-röster**: $16 per miljon tecken
- **Standard-röster**: $4 per miljon tecken

**Exempel:**
Om du genererar 200 sagor/månad (2 miljoner tecken):
- Första 1M tecken: **$0** (gratis)
- Nästa 1M tecken: **$16**
- **Total kostnad: $16/månad**

---

## 🧪 Testa din setup

1. Starta dev-servern: `npm run dev`
2. Gå till http://localhost:3000
3. Generera en saga
4. Du ska se: **"Använder Google Cloud TTS"** i en toast
5. Lyssna på ljudet – mycket bättre kvalitet än Web Speech API!

---

## ❓ Felsökning

### "Google TTS not configured"
- Kontrollera att `GOOGLE_TTS_API_KEY` finns i `.env.local`
- Starta om dev-servern

### "API key not valid"
- Kontrollera att API-nyckeln är kopierad korrekt (ingen extra whitespace)
- Kontrollera att Text-to-Speech API är aktiverat
- Vänta några minuter efter att ha skapat nyckeln

### "Quota exceeded"
- Du har använt upp 1M tecken för månaden
- Vänta till nästa månad eller uppgradera till betald plan
- Eller växla till OpenAI TTS som backup

---

## 🔄 Fallback-ordning

Appen försöker TTS-tjänster i denna ordning:

1. **Google Cloud TTS** (Standard - gratis & bäst)
2. **Web Speech API** (Browser fallback - sämre kvalitet)
3. **OpenAI TTS** (Om Google misslyckas och OpenAI är konfigurerad)

---

## 📚 Mer information

- [Google Cloud TTS Dokumentation](https://cloud.google.com/text-to-speech/docs)
- [Prissättning](https://cloud.google.com/text-to-speech/pricing)
- [Alla svenska röster](https://cloud.google.com/text-to-speech/docs/voices)
- [API Reference](https://cloud.google.com/text-to-speech/docs/reference/rest)

---

**Lycka till! 🚀**

