export const ECO_KEYWORDS: string[] = [
  "sustainable", "sustainability",
  "eco", "green",
  "renewable", "solar", "wind", "hydroelectric",
  "energy", "efficient", "efficiency",
  "conserve", "conservation", "insulation",
  "bicycle", "cycling", "bike",
  "walking", "pedestrian", "walk",
  "transit", "bus", "metro", "train",
  "commute", "carpool",
  "electric", "ev", "hybrid",
  "emission", "emissions", "carbon",
  "footprint", "neutral", "offset",
  "decarbonize", "decarbonization",
  "recycle", "recycling", "recycled",
  "compost", "composting",
  "waste", "landfill",
  "plastic", "reusable", "biodegradable",
  "upcycle", "upcycling",
  "reduce", "reuse", "repurpose",
  "circular",
  "vegan", "vegetarian",
  "organic", "local",
  "regenerative",
  "forest", "reforestation", "afforestation",
  "tree", "plant",
  "biodiversity", "wildlife", "habitat",
  "ocean", "river", "water", "rainwater",
  "climate", "environment", "environmental",
  "nature", "natural", "ecosystem",
  "pollution", "pollutant", "pollute",
  "preserve", "restoration",
  "planet", "earth",
  "mindful", "conscious", "ethical",
  "activist", "advocacy",
  "responsible", "greenhouse",
];

export const isMeaningful = (text: string): boolean => {
  const words = text.toLowerCase().trim().split(/\s+/).filter(Boolean);
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

  const keywordSet = new Set(ECO_KEYWORDS);
  const keywordCount = words.filter((w) => keywordSet.has(w)).length;
  if (keywordCount / words.length > 0.7) return false;

  const nonKeywordCount = words.filter((w) => !keywordSet.has(w)).length;
  if (nonKeywordCount < 2) return false;

  return true;
};

export const findMatchingKeywords = (text: string): string[] => {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const keywordSet = new Set(ECO_KEYWORDS);
  return [...new Set(words.filter((w) => keywordSet.has(w)))];
};
