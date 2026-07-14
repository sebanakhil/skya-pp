export const PRO_ELEMENT_TEXT = {
  fire: "you're wired for momentum — you do your best work in roles that reward initiative, visible progress, and a bit of risk",
  earth: "you're wired for mastery — you do your best work when you can go deep on one thing and watch expertise compound",
  air: "you're wired for exchange — your best ideas surface in conversation, across people, not alone at a desk",
  water: "you're wired for meaning — you do your best work when you can feel its impact, not just measure it",
};

export const MODALITY_PRO_TEXT = {
  cardinal: "You're usually the one who starts things — first to raise a hand for something that doesn't exist yet.",
  fixed: "You're usually the one who sustains things — still building after the initial excitement has faded for everyone else.",
  mutable: "You're usually the one who adapts things — most valuable exactly when plans change and someone needs to recalibrate fast.",
};

export const WORK_CONTEXT_TEXT = {
  corporate: "Inside a structured, corporate-shaped career, that energy tends to show up as quiet ambition — pushing for more scope, not more noise.",
  entrepreneur: "Building something of your own, that energy is probably the whole engine behind it — likely why you started in the first place.",
  creative: "In creative work, that energy is your actual material — it's what makes the work read as yours and no one else's.",
  care: "In education, healthcare, or care work, that energy shows up as quiet reliability — the kind people don't notice until it's missing.",
  other: "",
};

export const PERSONAL_ELEMENT_TEXT = {
  fire: "you bring heat and spontaneity to the people close to you — you need others who can match your pace, not slow it down",
  earth: "you show love through consistency — showing up, remembering the small things, building routines that hold",
  air: "you need conversation and mental connection — closeness for you usually starts with being truly heard",
  water: "you feel your way through relationships — emotional depth and safety matter to you more than excitement",
};

export const RELATIONSHIP_CONTEXT_TEXT = {
  single: "Right now, without a partner setting a shared rhythm, that energy is probably steering how you spend your time and who you let close.",
  relationship: "Right now, that energy is likely shaping how you and your partner negotiate closeness versus independence.",
  married: "Right now, that energy is probably showing up in the rhythm you and your partner have built together, for better or worse.",
};

export const RITUAL_MESSAGES = [
  "Reading the sky at the exact moment you were born…",
  "Aligning your ascendant…",
  "Mapping your energy across the globe…",
  "Aligning the stars to your story…",
];

export function buildReadingText({ chart, profile, tagPhrase }) {
  const topCountryLine = `${profile.topCountry.name} feels like a strong match for this chapter of your life — especially if you want ${tagPhrase[profile.proTag] || "the right kind of stretch"} and ${tagPhrase[profile.persTag] || "a life that feels emotionally aligned"}.`;

  return [
    `Your chart starts with ${chart.sun.sign.name} sun, ${chart.moon.sign.name} moon, and ${chart.asc.sign.name} rising. That combination reads as ${profile.words.join(", ")}.`,
    profile.professionalInsight,
    profile.personalInsight,
    topCountryLine,
  ].join("\n\n");
}
