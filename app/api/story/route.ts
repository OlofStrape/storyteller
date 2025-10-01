import { NextResponse } from "next/server";
import { openai, ensureEnv } from "@/utils/openai";
import { generateLocalStory } from "@/utils/localStory";
import { rateLimit } from "@/utils/rateLimit";

function hasTitleFirstLine(text: string): boolean {
  const [first] = (text || "").split(/\r?\n/);
  return Boolean(first && first.trim().length > 0 && first.trim().length <= 120);
}
function hasParagraphs(text: string, min = 3): boolean {
  const parts = (text || "").trim().split(/\n\s*\n/).filter(Boolean);
  return parts.length >= min;
}
function noBullets(text: string): boolean {
  return !/(^|\n)\s*[-*\d+\.]/.test(text);
}
function noAiMeta(text: string): boolean {
  return !/(\bAI\b|som en AI|language model|ursäkta|förlåt)/i.test(text);
}
function hasSoftEnding(text: string): boolean {
  return /(sömn|sova|dröm|lug(n|nt)|mjukt|andas|tystnad)/i.test(text);
}
function hasGoodLength(text: string, targetWords: number): boolean {
  const words = text.split(/\s+/).length;
  return words >= targetWords * 0.8 && words <= targetWords * 1.2;
}

function hasEngagingStart(text: string): boolean {
  const firstSentence = text.split(/[.!?]/)[0]?.toLowerCase() || "";
  return firstSentence.includes("det var") || firstSentence.includes("en gång") || firstSentence.includes("det fanns");
}

function hasCharacterName(text: string, name: string): boolean {
  return text.toLowerCase().includes(name.toLowerCase());
}

function hasInterests(text: string, interests: string[]): boolean {
  if (!interests.length) return true;
  const textLower = text.toLowerCase();
  return interests.some(interest => textLower.includes(interest.toLowerCase()));
}

function qaScore(text: string, targetWords: number = 500, name: string = "", interests: string[] = []): number {
  let score = 0;
  if (hasTitleFirstLine(text)) score += 2;
  if (hasParagraphs(text, 3)) score += 2;
  if (noBullets(text)) score += 1;
  if (noAiMeta(text)) score += 2;
  if (hasSoftEnding(text)) score += 1;
  if (hasGoodLength(text, targetWords)) score += 1;
  if (hasEngagingStart(text)) score += 1;
  if (name && hasCharacterName(text, name)) score += 1;
  if (interests.length && hasInterests(text, interests)) score += 1;
  return score; // max 11
}

const FEWSHOTS = [
  {
    age: 4,
    interests: ["prinsessor", "djur"],
    story: `Prinsessan och den försvunna kronan\n\nDet var en dag när prinsessan Luna vaknade och upptäckte att hennes gyllene krona var borta! Hon letade överallt i slottet men kunde inte hitta den.\n\nDå kom hennes lilla katt Mjau springande. "Mjaaaau!" sa katten och pekade med tassen mot trädgården. Luna följde efter katten ut i trädgården, där de hittade en liten fågel som hade byggt bo av kronans guldtrådar.\n\n"Åh, stackars lilla fågel!" sa Luna. "Du behöver verkligen material till ditt bo." Hon lät fågeln behålla trådarna och gick tillbaka till slottet. Där hittade hon sin krona - den hade bara glidit ner under sängen!\n\nLuna log och lade sig ner. Mjau kröp ihop bredvid henne, och hon visste att hennes vän katten alltid skulle hjälpa henne när hon behövde det mest.`
  },
  {
    age: 6,
    interests: ["rymden", "drakar"],
    story: `Draken som räddade rymdstationen\n\nDet var en liten drake som hette Stjärna som bodde på en rymdstation. En dag började stationen att skaka och alla ljus blinkade rött. "Nödsituation!" ropade rymdpiloterna.\n\nStjärna flög ut i rymden för att se vad som var fel. Hon upptäckte att en stor asteroid var på väg att krascha in i stationen! Alla rymdpiloterna var för rädda för att flyga ut, men Stjärna var modig.\n\nHon flög rakt mot asteroiden och började andas eld på den. Elden smälte asteroiden till små bitar som bara flöt förbi stationen. Alla rymdpiloterna jublade när de såg Stjärna komma tillbaka, hel och ren.\n\n"Du är vår hjälte!" sa de. Stjärna log stolt och kröp ihop i sin lilla rymdkoja, nöjd med att ha räddat alla sina vänner.`
  },
  {
    age: 3,
    interests: ["bilar", "djuren"],
    story: `Den lilla bilen som hjälpte kon\n\nDet var en liten röd bil som hette Putt som körde genom landet. Plötsligt hörde han ett sorgset "Muuu!" från en ko som stod fast i leran vid vägkanten.\n\n"Jag kan inte komma loss!" ropade kon. Putt stannade och tittade på problemet. Kon hade fastnat med alla fyra hovarna i den mjuka leran.\n\nPutt hade en idé. Han körde fram och tillbaka och skapade små hjulspår i leran. Sedan körde han runt kon i en cirkel tills leran blev hårdare. "Nu kan du försöka!" sa Putt.\n\nKon tog ett steg framåt - och kom loss! "Tack så mycket!" sa hon glatt. Putt log och körde vidare, nöjd med att ha hjälpt sin nya vän.`
  },
  {
    age: 10,
    interests: ["mystik", "äventyr"],
    story: `Hemligheten i det gamla biblioteket\n\nDet var en kväll när Emma upptäckte att det gamla biblioteket i skolan hade en dörr som inte fanns där dagen innan. Dörren var gjord av mörkt trä och hade inget handtag, bara en liten nyckelhål i form av en stjärna.\n\nEmma hade alltid älskat mysterier, och denna dörr var definitivt mystisk. Hon letade efter en nyckel, men hittade ingenting. Då kom hon ihåg att hennes mormor hade gett henne en gammal nyckel när hon var liten. "Den här kommer att öppna dörrar du inte ens vet att de finns", hade mormor sagt.\n\nEmma tog fram nyckeln ur sin ficka. Den passade perfekt. När hon vred om den öppnades dörren med ett mjukt klick, och hon steg in i ett rum fullt av glödande böcker som flöt i luften. Varje bok innehöll en saga som aldrig hade berättats förut.\n\nEmma valde en bok som glödde i guld, och när hon öppnade den började orden dansa runt henne. Hon visste att hon hade hittat sin plats - bland sagorna som väntade på att bli berättade.`
  },
  {
    age: 8,
    interests: ["djur", "natur"],
    story: `Den lilla ekorren som räddade skogen\n\nDet var en liten ekorre som hette Nöt som bodde i en stor ek. En dag märkte hon att alla träden i skogen började vissna och tappa sina löv. "Vad är det som händer?" undrade Nöt.\n\nHon sprang genom skogen och frågade alla djur, men ingen visste svaret. Till slut hittade hon en gammal uggla som satt i sitt träd. "Det är en ond trollkarl som har stulit alla nötter från skogen", sa ugglan. "Utan nötter kan träden inte växa."\n\nNöt bestämde sig för att rädda skogen. Hon samlade alla sina vänner - kaniner, fåglar och andra ekorrar. Tillsammans gick de till trollkarlens slott och stal tillbaka alla nötter. De planterade nötterna i jorden runt varje träd.\n\nNästa dag började träden att blomma igen. Nöt och hennes vänner dansade glatt under de gröna löven, stolta över att ha räddat sin skog.`
  },
  {
    age: 12,
    interests: ["äventyr", "vänskap"],
    story: `Det försvunna äventyret\n\nDet var en dag när Alex och hennes bästa vän Sam upptäckte att deras favoritbok - "Stora äventyret" - hade försvunnit från biblioteket. Boken var magisk och innehöll riktiga äventyr som man kunde stiga in i.\n\nDe började leta överallt men hittade ingenting. Då kom de ihåg att bibliotekarien hade sagt att boken ibland "försvinner för att hitta nya läsare". Alex och Sam bestämde sig för att följa efter boken.\n\nDe hittade spår av magi genom staden - glittrande stjärnor som bara de kunde se. Spåren ledde till en gammal lada där de hittade boken, men den var låst med en komplicerad gåta. "Endast de som kan arbeta tillsammans kan öppna denna bok", stod det skrivet.\n\nAlex och Sam löste gåtan tillsammans genom att kombinera sina olika talanger. Boken öppnades och de steg in i det största äventyret någonsin - en resa genom tid och rum där de lärde sig att vänskap är den starkaste magin av allt.`
  },
  {
    age: 12,
    interests: ["vänskap", "natur"],
    story: `Skogens vänskap\n\nDet var en kväll när Alex gick ut i skogen bakom huset. Han hade haft en svår dag i skolan, och skogen var alltid den plats där han kunde tänka klart. Men denna kväll var annorlunda - skogen kändes levande på ett sätt den aldrig hade gjort förut.\n\nNär Alex satte sig vid den gamla eken hörde han en röst. "Du ser trött ut", sa trädet mjukt. Alex tittade upp och såg att trädets bark hade format sig till ett ansikte - varmt och vänligt.\n\n"Jag har haft en svår dag", erkände Alex. "Allt känns så komplicerat."\n\nTrädet nodade förstående. "Skogen har lärt mig att det viktigaste är att vara sig själv. Varje träd är unikt, precis som varje människa. Du behöver inte vara som alla andra."\n\nAlex kände hur en lugn spred sig genom kroppen. Han satte sig till rätta mot trädets stam och lyssnade på skogens ljud - vinden i löven, fåglarnas kvitter, det mjuka prasslet av små djur. Här, i skogens famn, kände han sig accepterad precis som han var.\n\nNär Alex gick hem senare den kvällen bar han med sig trädets visdom. Han visste att han alltid kunde komma tillbaka till skogen när livet kändes för tungt, och att naturen alltid skulle vara hans vän.`
  }
];

export async function POST(req: Request) {
  try {
    ensureEnv();
    
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!rateLimit(clientIP, 5, 60000)) { // 5 requests per minute
      return NextResponse.json({ error: "För många förfrågningar. Försök igen om en minut." }, { status: 429 });
    }
    
    const { name, age, interests = [], tone = "mysig", lengthMin = 3, mode, userPreferences, storyTheme = "standard", storySeries } = await req.json();

    const cookieHeader = (req.headers.get("cookie") || "").toLowerCase();
    const hasPremium = /(?:^|;\s*)premium=1(?:;|$)/.test(cookieHeader);
    
    // Check length limits based on premium tier
    if (lengthMin > 3 && !hasPremium) {
      return NextResponse.json({ error: "Premium krävs för längder över 3 minuter." }, { status: 402 });
    }
    
    if (hasPremium) {
      const tierMatch = cookieHeader.match(/premium_tier=([^;]+)/);
      const tier = tierMatch ? tierMatch[1] : "basic";
      
      if (tier === "basic" && lengthMin > 8) {
        return NextResponse.json({ error: "Basic-nivån stöder max 8 minuter. Uppgradera till Plus för längre sagor." }, { status: 402 });
      }
      if (tier === "plus" && lengthMin > 10) {
        return NextResponse.json({ error: "Plus-nivån stöder max 10 minuter. Uppgradera till Premium för längre sagor." }, { status: 402 });
      }
    }

    const maxWords = lengthMin <= 3 ? 450 : lengthMin <= 5 ? 700 : lengthMin <= 8 ? 1000 : lengthMin <= 12 ? 1500 : 2000;

    const ageGroup = age <= 5 ? "småbarn" : age <= 8 ? "barn" : age <= 11 ? "äldre barn" : "tonåringar";
    const languageLevel = age <= 5 ? "mycket enkelt språk, korta meningar" : 
                         age <= 8 ? "enkelt språk, korta-medellånga meningar" : 
                         age <= 11 ? "medelkomplicerat språk, längre meningar" : 
                         "mer sofistikerat språk, komplexa meningar och tankar";
    
    const formatRules = `
- Titel på första raden (ingen prefixtext).
- ${lengthMin <= 8 ? '3–6 stycken' : '6–12 stycken'} berättande prosa med RIKTIG HANDLING.
- KRITISKT: Skapa en äventyrlig berättelse med problem, utmaningar och lösningar - INTE bara beskrivningar!
- Struktur: Början (introduktion) → Problem/utmaning → Äventyr/upptäckt → Lösning → Trygg avslutning.
- Inkludera konkreta händelser: resor, upptäckter, möten med karaktärer, problem som löses.
- Vänlig, varm, trygg ton. ${languageLevel}. Sensoriska detaljer FÖR att stödja handlingen.
- Åldersanpassat språk för ${age} år (${ageGroup}). Inga läskiga motiv.
- Längd cirka ${maxWords} ord.
- ${lengthMin > 8 ? 'Episk berättelse med flera kapitel/akter. Djupare karaktärsutveckling och komplexare handling.' : ''}
- Avsluta med en mjuk, sövande känsla (utan att bli tråkig).
- Skriv på naturlig svenska. Ingen meta eller AI‑referenser.
- Börja med "Det var" eller liknande traditionell saga-start.
- Inkludera barnets namn (${name}) som huvudkaraktär i äventyret.
- Använd intressena (${Array.isArray(interests) ? interests.join(", ") : interests}) som centrala teman i handlingen.
- VIKTIGT: Varje saga måste ha en tydlig handling med början, mitt och slut - INTE bara beskrivningar!
- ${age >= 10 ? 'För äldre barn: Inkludera mer komplexa känslor och situationer, men håll det tryggt och hoppfullt.' : ''}
`;

    // Add personalization based on user preferences
    let personalizationPrompt = "";
    if (userPreferences?.topInterests?.length > 0) {
      personalizationPrompt += `\n\nPERSONALISERING: Användaren har tidigare gillat sagor med: ${userPreferences.topInterests.join(", ")}. Inkludera dessa teman naturligt i sagan.`;
    }
    if (userPreferences?.preferredTone) {
      personalizationPrompt += `\n\nFöredragen ton: ${userPreferences.preferredTone} (baserat på tidigare höga betyg).`;
    }

    // Add story theme
    let themePrompt = "";
    if (storyTheme !== "standard") {
      const themeMap: Record<string, string> = {
        // Plus & Premium themes
        "aventyr": "Tema: Äventyr - spännande upptäcktsresor, utmaningar att lösa, modig huvudkaraktär, och en känsla av spänning och utforskning",
        "rymd": "Tema: Rymd - rymdskepp, planeter, stjärnor, utomjordiska vänner, och fascinerande rymdäventyr",
        "djur": "Tema: Djurens värld - vilda djur, skogen, djurvänner, naturäventyr, och djurens perspektiv",
        "magi": "Tema: Magi & fantasi - trollkarlar, älvor, magiska föremål, förtrollning, och fantasifulla äventyr",
        // Premium author styles
        "astrid-lindgren": "Skriv i stil av Astrid Lindgren - levande karaktärer, naturliga och vänliga dialoger, äventyrlighet i vardagen, mjuk humor, och en varm berättarröst",
        "sven-nordqvist": "Skriv i stil av Sven Nordqvist - detaljrika beskrivningar, rolig humor, lekfulla och kreativa vardagssituationer, nära vänskap mellan karaktärerna",
        "gunilla-bergstrom": "Skriv i stil av Gunilla Bergström - enkelt språk, trygga och realistiska familjesituationer, barnets perspektiv och känslor i fokus, mild humor och värme",
        "martin-widmark": "Skriv i stil av Martin Widmark - mystik och spänning, pussel som barnet kan lösa, smart och modig huvudkaraktär, lagom takt och cliffhangers",
        "jk-rowling": "Skriv i stil av J.K. Rowling - rik fantasivärld, magiska element, tydlig konflikt mellan gott och ont, djupa karaktärer, och detaljrik världsbyggnad med mystik och äventyr"
      };
      const isAuthorStyle = ["astrid-lindgren", "sven-nordqvist", "gunilla-bergstrom", "martin-widmark", "jk-rowling"].includes(storyTheme);
      themePrompt = `\n\n${isAuthorStyle ? 'BERÄTTARSTIL' : 'SAGOTEMA'}: ${themeMap[storyTheme] || storyTheme}. ${isAuthorStyle ? 'Följ denna författares berättarstil genomgående.' : 'Inkludera detta tema genomgående i sagan.'}`;
    }

    // Add story series continuation
    let seriesPrompt = "";
    if (storySeries) {
      seriesPrompt = `\n\nKAPITEL-SERIE FORTSÄTTNING: Detta är kapitel ${storySeries.chapters + 1} av boken "${storySeries.title}". 
      Föregående kapitel slutade så här: "${storySeries.lastStory.slice(-200)}..."
      
      Skriv en fortsättning som:
      - Bygger naturligt på föregående kapitel
      - Behåller samma karaktärer och miljö
      - Skapar en ny utmaning eller utveckling
      - Slutar med en cliffhanger eller mjuk övergång till nästa kapitel
      - Behåller samma ton och stil som föregående kapitel`;
    }

    const basePrompt = `Skriv en godnattsaga på svenska.\n\nBarnets namn: ${name}\nÅlder: ${age} år\nIntressen/teman: ${Array.isArray(interests) ? interests.join(", ") : interests}\nTon: ${tone} (lugn, trygg, varm)${personalizationPrompt}${themePrompt}${seriesPrompt}\n\nFölj formatet strikt:\n${formatRules}`;

    // Debug logging
    console.log("Story generation mode:", mode);
    console.log("LOCAL_STORY env:", process.env.LOCAL_STORY);
    console.log("Using local story:", mode === "local" || process.env.LOCAL_STORY === "1");

    // Force OpenAI if mode is "openai" (override environment variables)
    if (mode === "openai") {
      console.log("Forcing OpenAI mode - ignoring LOCAL_STORY env");
    } else if (mode === "local" || process.env.LOCAL_STORY === "1") {
      console.log("Generating LOCAL story");
      const story = generateLocalStory({
        name,
        age,
        interests: Array.isArray(interests) ? interests : [String(interests)],
        tone,
        maxWords,
      });
      return NextResponse.json({ story });
    }

    console.log("Generating OpenAI story");

    // Select age-appropriate few-shot examples
    const relevantExamples = FEWSHOTS.filter(ex => Math.abs(ex.age - age) <= 2);
    const selectedExamples = relevantExamples.length >= 2 ? relevantExamples.slice(0, 2) : FEWSHOTS.slice(0, 2);

    async function generateOnce(instruction: string): Promise<string> {
      const messages: { role: "system"|"user"; content: string }[] = [
        { role: "system", content: "Du är en vänlig, trygg svensk sagoberättare som skapar engagerande sagor med RIKTIG HANDLING. Varje saga måste ha: 1) Ett problem eller utmaning, 2) En äventyrlig lösning, 3) En trygg avslutning. Fokusera på HÄNDELSER och ÄVENTYR, inte bara beskrivningar. Svara endast med sagan i önskat format. Använd naturligt svenskt språk som passar för barn." },
        { role: "user", content: selectedExamples[0].story },
        { role: "user", content: selectedExamples[1].story },
        { role: "user", content: instruction },
      ];
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: maxWords * 1.5, // Allow some buffer
        messages
      });
      return completion.choices?.[0]?.message?.content?.trim() || "";
    }

    const [a, b] = await Promise.all([generateOnce(basePrompt), generateOnce(basePrompt)]);
    const scored = [a, b].map((t) => ({ 
      text: t, 
      score: qaScore(t, maxWords, name, Array.isArray(interests) ? interests : [String(interests)]) 
    })).sort((x, y) => y.score - x.score);
    let best = scored[0];

    if ((best.score ?? 0) < 7) {
      const rewritePrompt = basePrompt + "\n\nSkriv om sagan strikt enligt formatet ovan. Undvik listor och meta. Avsluta mjukt. Inkludera barnets namn och intressen naturligt.";
      const rewritten = await generateOnce(rewritePrompt);
      const rScore = qaScore(rewritten, maxWords, name, Array.isArray(interests) ? interests : [String(interests)]);
      if (rScore > best.score) {
        best = { text: rewritten, score: rScore } as any;
      }
    }

    const story = (best.text || a || b || "Kunde inte generera saga.").trim();

    return NextResponse.json({ story });
  } catch (e: any) {
    console.error(e);
    if (process.env.DEMO_MODE === "1") {
      const demo = `Stjärnljus över ${new Date().toLocaleDateString("sv-SE")}\n\nEn mjuk och lugn saga för ikväll. ${
        typeof e?.message === "string" ? "(DEMO_MODE aktiv)" : ""
      }`;
      return NextResponse.json({ story: demo });
    }
    const status = typeof e?.status === "number" ? e.status : e?.code === "insufficient_quota" ? 429 : 500;
    const message =
      status === 429
        ? "OpenAI-kvoten är slut eller spärrad. Kolla plan/billing eller byt nyckel."
        : e?.message || "Okänt fel";
    return NextResponse.json({ error: message }, { status });
  }
}


