# 🎙️ ElevenLabs TTS Setup Guide

## Varför ElevenLabs?

- 🏆 **Bästa röstkvalitet** - Mycket mer naturligt än Google TTS
- 🎭 **Emotionella röster** - Kan uttrycka känslor och tonfall
- 🇸🇪 **Svenska support** - Fungerar bra med svenska text
- 🎵 **Berättarröster** - Perfekt för sagor

---

## 📝 Snabb setup

### 1. Skapa ElevenLabs-konto
1. Gå till: https://elevenlabs.io/
2. Klicka **"Sign Up"**
3. Verifiera din email

### 2. Hämta API-nyckel
1. Gå till: https://elevenlabs.io/app/settings/api-keys
2. Klicka **"Create API Key"**
3. Kopiera nyckeln

### 3. Lägg till i projektet
1. Öppna `.env.local`
2. Lägg till:
   ```
   ELEVENLABS_API_KEY=sk_...din_nyckel_här
   ```
3. Spara filen
4. Starta om: `npm run dev`

---

## 🎵 Bästa röster för sagor

| Röst | Beskrivning | Bra för |
|------|-------------|---------|
| **Adam** | Varm, berättande | Sagor, berättelser |
| **Antoni** | Djup, lugn | Mystiska sagor |
| **Arnold** | Kraftfull | Äventyrssagor |
| **Bella** | Mjuk, vänlig | Barnsagor |
| **Elli** | Ung, energisk | Roliga sagor |

---

## 💰 Prissättning

- **Gratis**: 10,000 tecken/månad (~1-2 sagor)
- **Starter**: $5/månad - 30,000 tecken
- **Creator**: $22/månad - 100,000 tecken

---

## 🧪 Testa ElevenLabs

När du har lagt till API-nyckeln:

1. Starta appen: `npm run dev`
2. Välj **ElevenLabs** som TTS-provider
3. Testa olika röster

**ElevenLabs är mycket bättre än Google TTS för sagor!** 🚀