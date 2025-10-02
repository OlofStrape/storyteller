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

### 4. Skapa Service Account (för server-side användning)

1. Gå till: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Klicka **"+ CREATE SERVICE ACCOUNT"**
3. Fyll i:
   - **Service account name**: `dromlyktan-tts`
   - **Service account ID**: `dromlyktan-tts` (genereras automatiskt)
   - **Description**: `Text-to-Speech service for Drömlyktan`
4. Klicka **"CREATE AND CONTINUE"**
5. Under **"Grant this service account access to project"**:
   - **Role**: Välj **"Cloud Text-to-Speech Client"**
6. Klicka **"CONTINUE"** → **"DONE"**

### 5. Skapa och ladda ner nyckel

1. Klicka på din nya service account i listan
2. Gå till **"KEYS"**-fliken
3. Klicka **"ADD KEY"** → **"Create new key"**
4. Välj **"JSON"** format
5. Klicka **"CREATE"** - filen laddas ner automatiskt
6. **VIKTIGT**: Spara denna fil säkert - den innehåller din privata nyckel!

### 6. Lägg till i ditt projekt

1. Öppna `.env.local` (eller skapa filen om den inte finns)
2. Öppna den nedladdade JSON-filen i en textredigerare
3. Kopiera **hela innehållet** av JSON-filen (från `{` till `}`)
4. Lägg till i `.env.local`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"dromlyktan",...}
   ```
   **VIKTIGT**: Klistra in hela JSON-innehållet på en rad, utan radbrytningar!
5. Spara filen
6. Starta om dev-servern: `npm run dev`

### 7. Lägg till i Vercel (Production)

1. Gå till: https://vercel.com/dashboard
2. Välj ditt projekt
3. Gå till **Settings** → **Environment Variables**
4. Lägg till:
   - **Key**: `GOOGLE_APPLICATION_CREDENTIALS`
   - **Value**: Hela innehållet av din JSON-fil (på en rad)
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
- Kontrollera att `GOOGLE_APPLICATION_CREDENTIALS` finns i `.env.local`
- Starta om dev-servern

### "Credentials Error" eller "JSON parse error"
- Kontrollera att hela JSON-innehållet är kopierat korrekt
- Se till att det inte finns radbrytningar i JSON-strängen
- Kontrollera att alla citattecken är korrekta (`"` inte `"` eller `'`)

### "Failed to get access token"
- Kontrollera att Text-to-Speech API är aktiverat i Google Cloud Console
- Kontrollera att service account har rätt behörigheter
- Vänta några minuter efter att ha skapat service account

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

