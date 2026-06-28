export const ECO_KEYWORDS: string[] = [
  // Energy & Conservation
  "sustainable", "sustainability", "sustainably",
  "eco", "green",
  "renewable", "renewables",
  "solar", "wind", "hydroelectric", "hydro", "hydel",
  "energy", "energies",
  "efficient", "efficiency", "efficiently",
  "conserve", "conservation", "conserving", "conserved",
  "insulation", "insulate", "insulating",
  "electricity", "power", "led",
  "thermostat", "appliance", "appliances",
  "vampire", "standby",
  "consumption", "consume", "consumerism",
  "minimalism", "minimalist", "frugal", "frugality",

  // Transport & Mobility
  "bicycle", "bicycling", "bike", "biking", "cyclist",
  "cycling", "cycle",
  "walking", "walk", "walks", "pedestrian",
  "transit", "transport", "transportation",
  "bus", "buses", "metro", "train", "trains", "rail", "railway",
  "commute", "commuting", "commuter", "commuters",
  "carpool", "carpooling",
  "electric", "ev", "evs", "hybrid", "hybrids",
  "emission", "emissions",
  "carbon", "footprint",
  "neutral", "offset", "offsets", "offsetting",
  "decarbonize", "decarbonization", "decarbonizing",
  "fuel", "fuels", "gasoline", "diesel",
  "drive", "drives", "driving", "driver", "drivers",
  "cruise", "acceleration",
  "tires", "inflation", "mileage",
  "fossil",

  // Waste & Recycling
  "recycle", "recycling", "recycled", "recycles",
  "compost", "composting", "composted",
  "waste", "wastes", "landfill", "landfills",
  "plastic", "plastics",
  "reusable", "reuse", "reusing", "reused",
  "biodegradable",
  "upcycle", "upcycling", "upcycled",
  "reduce", "reducing", "reduced", "reduces",
  "repurpose", "repurposing", "repurposed",
  "circular", "circularity",
  "scraps", "organic waste",
  "second-hand", "thrift", "thrifting",
  "repair", "repairing", "repaired",
  "borrow", "rent",

  // Food & Agriculture
  "vegan", "veganism", "vegetarian",
  "organic",
  "local", "locally", "seasonal",
  "regenerative", "regeneration",
  "diet", "diets",
  "plant", "plants",
  "meatless", "legumes",
  "livestock", "land clearing",
  "produce", "vegetables",

  // Nature & Environment
  "forest", "forests", "forestry",
  "reforestation", "afforestation",
  "tree", "trees", "planting", "planted", "plantations",
  "biodiversity", "wildlife", "habitat", "habitats",
  "ocean", "oceans", "river", "rivers", "water", "waters",
  "rainwater", "rainwater harvesting",
  "climate", "environment", "environmental", "environmentally",
  "nature", "natural", "naturally",
  "ecosystem", "ecosystems",
  "pollution", "pollutant", "pollutants",
  "pollute", "polluting", "polluted",
  "preserve", "preserving", "preserved", "preservation",
  "restoration", "restore", "restoring",
  "planet", "earth",

  // Lifestyle & General
  "mindful", "mindfulness",
  "conscious", "consciousness", "consciously",
  "ethical", "ethically",
  "activist", "activism", "advocacy", "advocate",
  "responsible", "responsibility", "responsibly",
  "greenhouse",
  "systemic", "systemically",
  "impact", "impacts",
  "awareness", "education",
].map((kw) => kw.toLowerCase());

const KEYWORD_SET = new Set(ECO_KEYWORDS);

const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .trim()
    .split(/[\s,;:.!?()\[\]{}"'\-–—/\\]+/)
    .filter(Boolean);
};

const hasKeyword = (word: string): boolean => {
  if (KEYWORD_SET.has(word)) return true;
  for (const kw of ECO_KEYWORDS) {
    if (word.includes(kw)) return true;
  }
  return false;
};

const findKeywordsInWord = (word: string): string[] => {
  const found: string[] = [];
  if (KEYWORD_SET.has(word)) found.push(word);
  for (const kw of ECO_KEYWORDS) {
    if (kw !== word && word.includes(kw)) found.push(kw);
  }
  return found;
};

export const isMeaningful = (text: string): boolean => {
  const words = tokenize(text);
  if (words.length < 5) return false;

  const uniqueWords = new Set(words);
  if (uniqueWords.size / words.length < 0.4) return false;

  const wordFreq = new Map<string, number>();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }
  for (const count of wordFreq.values()) {
    if (count > 3) return false;
  }
  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i - 1]) return false;
  }

  const keywordCount = words.filter((w) => hasKeyword(w)).length;
  if (keywordCount / words.length > 0.7) return false;

  const nonKeywordCount = words.filter((w) => !hasKeyword(w)).length;
  if (nonKeywordCount < 2) return false;

  return true;
};

export const findMatchingKeywords = (text: string): string[] => {
  const words = tokenize(text);
  const matched = new Set<string>();
  for (const word of words) {
    for (const kw of findKeywordsInWord(word)) {
      matched.add(kw);
    }
  }
  return [...matched];
};
