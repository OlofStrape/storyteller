# 🎨 Bildkrav för Drömlyktan

## App-ikoner & Favicon

### Favicon
- **Format**: `.ico`, `.svg`
- **Storlekar**: 32x32px, 16x16px
- **Motiv**: Stiliserad lykta eller "D" med stjärnor
- **Färger**: Gradient lavender (#c8b5ff) till guld (#ffdf8a)

### PWA-ikoner
- **Format**: `.png`, `.svg` (helst SVG för skalbarhet)
- **Storlekar**: 
  - 72x72px
  - 96x96px
  - 128x128px
  - 144x144px
  - 152x152px
  - 192x192px (viktigast för Android)
  - 384x384px
  - 512x512px (viktigast för Android)
- **Motiv**: Drömlyktan-logotyp med runda hörn
- **Bakgrund**: Mörkblå (#0b1020) eller transparent
- **Stil**: Flat design med gradient

### Apple Touch Icon
- **Format**: `.png`
- **Storlek**: 180x180px
- **Motiv**: Samma som PWA men utan rundade hörn (iOS lägger till automatiskt)

---

## Bakgrundsbilder

### Hero-bakgrund (huvudsida)
- **Desktop**: 1920x1080px
- **Mobil**: 1080x1920px
- **Format**: `.webp` (fallback `.jpg`)
- **Motiv**: 
  - Nattlig stjärnhimmel
  - Måne i övre högra hörnet
  - Mjuka moln
  - Subtila stjärnor
- **Färger**: 
  - Bas: #0b1020
  - Gradient: #15213a
  - Accenter: #c8b5ff (lavender), #ffdf8a (guld)
- **Stil**: Mjuk, drömsk, lugn
- **Filstorlek**: Max 200KB (komprimerad)

### Textur/Noise overlay
- **Storlek**: 1400x1400px (seamless pattern)
- **Format**: `.svg` eller `.png`
- **Motiv**: Subtil noise/grain för att ge djup
- **Opacity**: 4-6%
- **Färg**: Vit eller ljusblå

### Sleep Mode bakgrunder
Separata bakgrundsbilder för varje Sleep Mode:
- **Storlek**: 1920x1080px
- **Format**: `.webp`
- **Motiv**:
  - **White Noise**: Abstrakt vågmönster
  - **Rain**: Regndroppar på fönster
  - **Waves**: Ocean vid natt
  - **Fireplace**: Mysig eldstad
  - **Forest**: Nattlig skog
- **Filstorlek**: Max 150KB vardera

---

## Illustrationer för Stories

### Karaktärsbilder
- **Storlek**: 400x400px (square för enkel visning)
- **Format**: `.webp`, `.png`
- **Motiv**: 
  - Barn (olika åldrar, etniciteter)
  - Djur (katter, hundar, rävar, björnar, uggla)
  - Prinsessor & riddare
  - Astronauter
  - Pirater
  - Enhörningar
- **Stil**: 
  - Mjuk, barn-vänlig illustration
  - Rundade former
  - Pastellfärger
  - Glad och trygg känsla
- **Antal**: Minst 20-30 olika karaktärer

### Scene-bakgrunder
- **Storlek**: 800x600px (4:3 ratio)
- **Format**: `.webp`
- **Motiv**:
  - Skog vid skymning
  - Slott
  - Rymden med planeter
  - Hav med båt
  - By med hus
  - Berg och sjö
  - Strand vid solnedgång
- **Antal**: 10-15 olika scener
- **Filstorlek**: Max 100KB vardera

### Story covers (thumbnail i bibliotek)
- **Storlek**: 300x400px (3:4 ratio, bokformat)
- **Format**: `.webp`
- **Motiv**: Auto-genererad baserat på story-innehåll
- **Stil**: Bokstil med titel och bild

---

## UI-element & Ikoner

### Dekorativa ikoner
- **Storlek**: 64x64px
- **Format**: `.svg` (skalbart)
- **Motiv**:
  - 🌙 Måne (olika faser)
  - ⭐ Stjärnor (olika storlekar)
  - 🏮 Lykta (Drömlyktan-symbol)
  - 📖 Bok
  - 😴 Sömn-symbol
  - 🎵 Musik/ljudvågor
  - 🔒 Lås (Premium)
  - 👑 Krona (Premium)
- **Färger**: Använd app-färgpaletten

### Premium-badge
- **Storlek**: 120x40px
- **Format**: `.svg` eller `.png`
- **Motiv**: 
  - Guldigt lås-ikon
  - Text: "Premium" eller "🔒 Premium"
- **Färger**: Guld-gradient (#ffdf8a → #f7d97a)

### Avatars för sparade karaktärer
- **Storlek**: 80x80px (cirkulär)
- **Format**: `.png`
- **Motiv**: Emoji eller enkel illustration
- **Antal**: 10-15 olika

---

## Marknadsföring & Screenshots

### App Store Screenshots (iOS)
- **iPhone 14 Pro Max**: 1290x2796px
- **iPhone 14**: 1170x2532px
- **iPad Pro 12.9"**: 2048x2732px
- **Antal**: 5-8 screenshots som visar:
  1. Huvudsida med story-generering
  2. Story-playback med TTS
  3. Sleep Mode
  4. Bibliotek
  5. Premium-features
  6. Saved characters

### Google Play Screenshots (Android)
- **Phone**: 1080x1920px
- **Tablet**: 1920x1200px
- **Feature Graphic**: 1024x500px
- **Antal**: 8 screenshots

### Social Media
- **Facebook/LinkedIn share**: 1200x630px
- **Instagram post**: 1080x1080px
- **Instagram story**: 1080x1920px
- **Twitter/X header**: 1500x500px
- **Twitter/X card**: 1200x628px

---

## Bildoptimering

### Format
1. **Förstaprioritetet**: `.webp` (modern, komprimerad)
2. **Fallback**: `.jpg` för foton, `.png` för logotyper/ikoner
3. **Ikoner**: `.svg` (skalbart, perfekt för UI)

### Komprimering
- **Hero-bilder**: Max 200KB
- **Scene-bakgrunder**: Max 100KB
- **Karaktärer**: Max 80KB
- **UI-ikoner**: Max 20KB

### Lazy Loading
- Implementera lazy loading för alla bilder utom above-the-fold
- Använd blur-up placeholder för bättre UX

### Responsive Images
```html
<picture>
  <source srcset="image-1920.webp" media="(min-width: 1200px)" type="image/webp">
  <source srcset="image-1080.webp" media="(min-width: 768px)" type="image/webp">
  <source srcset="image-640.webp" type="image/webp">
  <img src="image-640.jpg" alt="Description">
</picture>
```

---

## Designriktlinjer

### Färgpalett
- **Primär mörk**: #0b1020
- **Sekundär mörk**: #121833, #15213a
- **Text ljus**: #e9f2ff
- **Text muted**: #9fb3d1
- **Accent lavender**: #c8b5ff
- **Accent guld**: #ffdf8a

### Typografi
- **Heading**: Nunito (600, 700, 800)
- **Body**: Inter

### Stil-principer
- **Mjuka rundade hörn** (12-16px border-radius)
- **Subtila skuggor** för djup
- **Gradient-accenter** för premium-känsla
- **Pastell-färger** för barn-vänlighet
- **Minimalism** - inte för mycket visuellt brus

---

## Implementationsplan

### Fas 1: Grundläggande (Prioritet 1)
- [ ] Favicon & PWA-ikoner
- [ ] Hero-bakgrund (desktop & mobil)
- [ ] Noise overlay
- [ ] Dekorativa UI-ikoner (SVG)

### Fas 2: Innehåll (Prioritet 2)
- [ ] 10 karaktärsbilder
- [ ] 5 scene-bakgrunder
- [ ] Sleep Mode bakgrunder

### Fas 3: Polish (Prioritet 3)
- [ ] Premium-badge
- [ ] Avatar-ikoner
- [ ] Story covers (template)

### Fas 4: Marknadsföring (Prioritet 4)
- [ ] App Store screenshots
- [ ] Social media assets
- [ ] Marketing material

---

## AI-genererade bilder

För att spara tid och kostnader kan ni använda AI för att generera bilder:

### Rekommenderade verktyg
1. **Midjourney** - Bäst för illustrationer
2. **DALL-E 3** - Bra för varierande stilar
3. **Stable Diffusion** - Gratis, körs lokalt

### Prompt-exempel för Midjourney
```
A cozy magical lantern glowing with warm light, surrounded by soft stars 
and clouds, dreamy night sky, pastel colors, children's book illustration 
style, soft gradients, lavender and gold tones --ar 1:1 --v 6
```

```
Swedish forest at twilight, soft pastel colors, children's book illustration, 
cozy and safe atmosphere, stars beginning to appear, warm glow --ar 4:3 --v 6
```

---

## Licens & Copyright

- Alla bilder måste vara **royalty-free** eller egenproducerade
- Om ni använder stock-bilder: **Unsplash**, **Pexels**, **Pixabay**
- AI-genererade bilder: Kontrollera plattformens licensvillkor
- Spara alla bildkällor och licenser i en separat fil

---

## Kontakt för bildproduktion

Om ni behöver hjälp med bildproduktion:
- Anlita en illustratör på **Fiverr** eller **Upwork**
- Använd **Canva** för enklare grafik
- Kontakta svenska illustratörer för lokal stil

