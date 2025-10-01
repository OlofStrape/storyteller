# Storyteller.AI — MVP

Enkel Next.js-app som genererar svenska godnattsagor med TTS + Sleep Mode.

## Snabbstart (lokalt i Cursor)
1. Skapa mapp `storyteller-mvp` och klistra in dessa filer.
2. `npm install`
3. Lägg `OPENAI_API_KEY` i `.env.local`
4. Lägg in temporära filer i `public/audio/` (white-noise.mp3, rain.mp3, waves.mp3)
5. `npm run dev` och öppna http://localhost:3000

## Deploy till Vercel
1. Skapa GitHub-repo och pusha koden.
2. Importera repo i Vercel → välj **Next.js**.
3. Lägg till `OPENAI_API_KEY` under Project → Settings → Environment Variables.
4. Deploy. Klart.

## Tips
- Byt TTS-modell/voice i `/app/api/tts/route.ts` om din region kräver annat namn.
- Cacha svar senare (S3/Supabase) för lägre kostnad och snabbare uppspelning.
- Lägg Premium-paywall i vecka 2: Apple/Google in-app purchases.


