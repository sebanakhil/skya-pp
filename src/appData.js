export const C = {
  ink: "#14111F",
  ink2: "#1B1729",
  line: "#2C2640",
  parchment: "#F1E9DA",
  parchmentDim: "#B7AD9C",
  brass: "#C79A56",
  fire: "#C1502E",
  earth: "#6E7F52",
  air: "#6C93B0",
  water: "#4A6B84",
};

export const FONTS_LINK =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

export const ZODIAC = [
  { name: "Aries", glyph: "♈", element: "fire", modality: "cardinal", trait: "charge ahead, lead boldly, and thrive on a challenge" },
  { name: "Taurus", glyph: "♉", element: "earth", modality: "fixed", trait: "move at your own steady pace and build things that last" },
  { name: "Gemini", glyph: "♊", element: "air", modality: "mutable", trait: "chase ideas, ask questions, and keep more than one conversation going" },
  { name: "Cancer", glyph: "♋", element: "water", modality: "cardinal", trait: "protect the people and places that feel like home" },
  { name: "Leo", glyph: "♌", element: "fire", modality: "fixed", trait: "shine when you're seen, and bring warmth wherever you go" },
  { name: "Virgo", glyph: "♍", element: "earth", modality: "mutable", trait: "notice the details everyone else misses and quietly fix what's broken" },
  { name: "Libra", glyph: "♎", element: "air", modality: "cardinal", trait: "seek balance, beauty, and connection in almost everything" },
  { name: "Scorpio", glyph: "♏", element: "water", modality: "fixed", trait: "go deep, feel intensely, and don't do anything halfway" },
  { name: "Sagittarius", glyph: "♐", element: "fire", modality: "mutable", trait: "need room to roam, question things, and chase the horizon" },
  { name: "Capricorn", glyph: "♑", element: "earth", modality: "cardinal", trait: "climb methodically toward whatever you've decided matters" },
  { name: "Aquarius", glyph: "♒", element: "air", modality: "fixed", trait: "stand a little apart from the crowd and think in patterns others haven't noticed yet" },
  { name: "Pisces", glyph: "♓", element: "water", modality: "mutable", trait: "absorb the moods of a room and dream in currents, not straight lines" },
];

export const ELEMENT_LABEL = { fire: "Fire", earth: "Earth", air: "Air", water: "Water" };
export const ELEMENT_ADJ = {
  fire: ["bold", "passionate", "spontaneous", "magnetic"],
  earth: ["grounded", "dependable", "patient", "practical"],
  air: ["curious", "articulate", "sociable", "quick-witted"],
  water: ["intuitive", "empathetic", "reflective", "deep-feeling"],
};
export const MODALITY_ADJ = { cardinal: "initiating", fixed: "steadfast", mutable: "adaptable" };

export const COUNTRIES = [
  { name: "Portugal", element: "water", tags: ["slow-living", "creative", "romance", "digital-nomad"] },
  { name: "Spain", element: "fire", tags: ["romance", "creative", "social"] },
  { name: "Italy", element: "fire", tags: ["romance", "creative", "family"] },
  { name: "Greece", element: "water", tags: ["slow-living", "spiritual", "romance"] },
  { name: "France", element: "air", tags: ["creative", "romance", "career"] },
  { name: "Netherlands", element: "air", tags: ["career", "social", "digital-nomad"] },
  { name: "Germany", element: "earth", tags: ["career", "stability", "family"] },
  { name: "Switzerland", element: "earth", tags: ["stability", "career", "family"] },
  { name: "Norway", element: "water", tags: ["solo-growth", "spiritual", "slow-living"] },
  { name: "Iceland", element: "water", tags: ["solo-growth", "spiritual", "adventure"] },
  { name: "Ireland", element: "water", tags: ["creative", "social", "slow-living"] },
  { name: "United Kingdom", element: "air", tags: ["career", "social", "creative"] },
  { name: "Canada", element: "earth", tags: ["family", "stability", "career"] },
  { name: "United States", element: "fire", tags: ["career", "adventure", "ambition"] },
  { name: "Mexico", element: "fire", tags: ["adventure", "social", "creative"] },
  { name: "Costa Rica", element: "water", tags: ["slow-living", "spiritual", "adventure"] },
  { name: "Brazil", element: "fire", tags: ["social", "adventure", "creative"] },
  { name: "Argentina", element: "fire", tags: ["romance", "creative", "social"] },
  { name: "Japan", element: "earth", tags: ["stability", "creative", "solo-growth"] },
  { name: "South Korea", element: "fire", tags: ["ambition", "career", "social"] },
  { name: "Thailand", element: "water", tags: ["digital-nomad", "adventure", "slow-living"] },
  { name: "Vietnam", element: "earth", tags: ["digital-nomad", "adventure", "family"] },
  { name: "Singapore", element: "air", tags: ["career", "ambition", "stability"] },
  { name: "New Zealand", element: "earth", tags: ["family", "adventure", "slow-living"] },
  { name: "Australia", element: "fire", tags: ["adventure", "family", "social"] },
  { name: "UAE", element: "fire", tags: ["ambition", "career", "family"] },
  { name: "Morocco", element: "fire", tags: ["adventure", "spiritual", "creative"] },
  { name: "South Africa", element: "earth", tags: ["adventure", "family", "solo-growth"] },
];

export const QUIZ = [
  {
    q: "When you imagine your best life somewhere new, what pulls you most?",
    options: [
      { label: "Adventure and new experiences", el: "fire", tag: "adventure" },
      { label: "Stability and building something lasting", el: "earth", tag: "stability" },
      { label: "Meeting people and new ideas", el: "air", tag: "social" },
      { label: "Peace, nature, and emotional depth", el: "water", tag: "spiritual" },
    ],
  },
  {
    q: "What's your ideal pace of life?",
    options: [
      { label: "Fast-moving and ambitious", el: "fire", tag: "ambition" },
      { label: "Structured and dependable", el: "earth", tag: "stability" },
      { label: "Flexible and ever-changing", el: "air", tag: "digital-nomad" },
      { label: "Slow and unhurried", el: "water", tag: "slow-living" },
    ],
  },
  {
    q: "What role does creativity play in how you want to live?",
    options: [
      { label: "Central — I want to make things", el: "air", tag: "creative" },
      { label: "Quiet — I create for myself", el: "water", tag: "creative" },
      { label: "Practical — I build useful things", el: "earth", tag: "career" },
      { label: "Expressive — I want a stage", el: "fire", tag: "social" },
    ],
  },
  {
    q: "Right now, what are you craving most?",
    options: [
      { label: "Freedom to explore", el: "fire", tag: "adventure" },
      { label: "Roots and belonging", el: "earth", tag: "family" },
      { label: "Connection and conversation", el: "air", tag: "social" },
      { label: "Quiet and reflection", el: "water", tag: "spiritual" },
    ],
  },
];

export const PROFESSIONAL_TAGS = ["career", "ambition", "stability", "digital-nomad"];
export const PERSONAL_TAGS = ["family", "romance", "slow-living", "spiritual", "adventure", "social", "solo-growth", "creative"];
export const TAG_PHRASE = {
  career: "a culture built around career growth",
  ambition: "a fast-moving, ambitious culture",
  stability: "a strong sense of structure and stability",
  "digital-nomad": "a flexible, remote-friendly lifestyle",
  family: "a family-oriented culture",
  romance: "a romantic, expressive spirit",
  "slow-living": "a slower, unhurried pace of life",
  spiritual: "a reflective, spiritual undercurrent",
  adventure: "a real spirit of adventure",
  social: "a social, connection-driven culture",
  "solo-growth": "space for solo growth",
  creative: "a creative, expressive culture",
};
