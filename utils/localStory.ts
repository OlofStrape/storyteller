type StoryInput = {
  name: string;
  age: number;
  interests: string[];
  tone: string;
  maxWords: number;
};

const openings = [
  "Det var en gång en stilla kväll när stjärnorna blinkade mjukt över byn.",
  "I skymningens lugn dansade dammkorn i fönsterljuset och allt kändes tryggt.",
  "Natten var mild och doftade nytvättade lakan och sommarluft.",
];

const closings = [
  "Och med ett sista mjukt andetag gled ögonlocken ihop och drömmen tog vid.",
  "Till slut var allt tyst och mjukt, och sömnen kom som en varm filt.",
  "När månen log i fönstret kändes världen lugn, och det blev lätt att sova.",
];

const senses = [
  "en viskning som nästan gick att höra",
  "ljuset som ritade mjuka mönster på väggen",
  "doften av kvällsluft och rena kuddar",
  "en stilla skugga som såg ut som ett leende",
];

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function clamp(min: number, v: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function estimateParagraphs(maxWords: number): { paragraphs: number; sentencesPerParagraph: number } {
  // Target gentle pacing. ~12 words/sentence average.
  // 3 min ≈ 360–450 words, 5 min ≈ 650–800, 8 min ≈ 1000–1200 (rough for local demo)
  const words = maxWords;
  const sentencesTotal = clamp(8, Math.round(words / 12), 90);
  const paragraphs = clamp(3, Math.round(sentencesTotal / 4), 8);
  const sentencesPerParagraph = clamp(3, Math.round(sentencesTotal / paragraphs), 6);
  return { paragraphs, sentencesPerParagraph };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickInterest(interests: string[]): string {
  if (!interests || interests.length === 0) return "stjärnljus";
  return interests[Math.floor(Math.random() * interests.length)].trim();
}

function gentleSentence(childName: string, interest: string): string {
  const verbs = ["viskade", "svävade", "vaggade", "glimmade", "smög", "dök fram" ];
  const places = ["i rummet", "vid fönstret", "över täcket", "runt kudden", "i fantasin" ];
  const connector = ["lugn och nyfiken", "med ett litet leende", "med varma kinder", "i egen takt" ];
  return `${capitalize(interest)} ${pick(verbs)} ${pick(places)} som en vän, och ${childName} följde ${pick(connector)}.`;
}

function windDownSentence(childName: string): string {
  const cues = [
    "Ett långsamt andetag in... och ut...",
    "Kroppen blev tung som en sandpåse som vilade tryggt",
    "Tankarna gled som små båtar på stilla vatten",
    "Tystnaden lade sig som en mjuk filt över axlarna",
  ];
  return `${pick(cues)} ${childName} kände hur kvällen bar allt varsamt.`;
}

export function generateLocalStory(input: StoryInput): string {
  const { name, age, interests, tone, maxWords } = input;
  const childName = capitalize(name || "Barnet");
  const themeList = interests && interests.length ? interests.join(", ") : "stjärnor och drömmar";
  const toneWord = tone || "mysig";

  const title = `${childName}s ${toneWord} kvällsäventyr`;

  // pacing
  const { paragraphs, sentencesPerParagraph } = estimateParagraphs(maxWords);

  const out: string[] = [];

  // Intro
  const opening = pick(openings);
  out.push(
    `${opening} ${childName}, som var ${age} år, tyckte om ${themeList}.` +
    ` Ikväll väntade något extra ${toneWord}, lugnt och tryggt.`
  );

  // Middle paragraphs
  for (let i = 0; i < Math.max(1, paragraphs - 2); i++) {
    const p: string[] = [];
    // Start each middle paragraph with a soft sensory cue
    p.push(`I dunklet anades ${pick(senses)}.`);
    for (let s = 0; s < sentencesPerParagraph - 1; s++) {
      const interest = pickInterest(interests);
      p.push(gentleSentence(childName, interest));
    }
    // Add a gentle stabilizer sentence
    p.push(`Allt gick i stilla takt, som när man lyssnar till regn mot rutan.`);
    out.push(p.join(" "));
  }

  // Closing
  const closing = pick(closings);
  const windDown: string[] = [];
  windDown.push(windDownSentence(childName));
  windDown.push(`När äventyret nådde sin mjuka slutpunkt log ${childName}. ${closing}`);
  out.push(windDown.join(" "));

  return [title, "", ...out].join("\n\n");
}


