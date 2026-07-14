import {
  ZODIAC,
  COUNTRIES,
  ELEMENT_ADJ,
  MODALITY_ADJ,
  PROFESSIONAL_TAGS,
  PERSONAL_TAGS,
} from "./appData";
import {
  PRO_ELEMENT_TEXT,
  MODALITY_PRO_TEXT,
  WORK_CONTEXT_TEXT,
  PERSONAL_ELEMENT_TEXT,
  RELATIONSHIP_CONTEXT_TEXT,
} from "./appText";

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;
const norm360 = (d) => {
  d = d % 360;
  if (d < 0) d += 360;
  return d;
};

function julianDay(y, m, d, hourUT) {
  let Y = y,
    M = m;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    d +
    hourUT / 24 +
    B -
    1524.5
  );
}

function sunLongitude(T) {
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Cc =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(toRad(M)) +
    (0.019993 - 0.000101 * T) * Math.sin(toRad(2 * M)) +
    0.000289 * Math.sin(toRad(3 * M));
  return norm360(L0 + Cc);
}

function moonLongitude(T) {
  const Lp = norm360(218.3164477 + 481267.88123421 * T);
  const D = norm360(297.8501921 + 445267.1114034 * T);
  const M = norm360(357.5291092 + 35999.0502909 * T);
  const Mp = norm360(134.9633964 + 477198.8675055 * T);
  const F = norm360(93.272095 + 483202.0175233 * T);
  const r = toRad;
  const lon =
    Lp +
    6.288774 * Math.sin(r(Mp)) -
    1.274027 * Math.sin(r(2 * D - Mp)) +
    0.658314 * Math.sin(r(2 * D)) -
    0.213618 * Math.sin(r(2 * Mp)) -
    0.185116 * Math.sin(r(M)) -
    0.114332 * Math.sin(r(2 * F)) +
    0.058793 * Math.sin(r(2 * D - 2 * Mp)) +
    0.057066 * Math.sin(r(2 * D - M - Mp)) +
    0.053322 * Math.sin(r(2 * D + Mp)) +
    0.045758 * Math.sin(r(2 * D - M)) -
    0.04092 * Math.sin(r(M - Mp)) -
    0.03432 * Math.sin(r(D)) -
    0.030383 * Math.sin(r(M + Mp));
  return norm360(lon);
}

function ascendant(jd, T, lonEast, latDeg) {
  const GMST = norm360(
    280.46061837 +
      360.98564736629 * (jd - 2451545) +
      0.000387933 * T * T -
      (T * T * T) / 38710000
  );
  const LST = norm360(GMST + lonEast);
  const eps = 23.4392911 - 0.0130042 * T;
  const ramc = toRad(LST);
  const phi = toRad(latDeg);
  const e = toRad(eps);
  const y = -Math.cos(ramc);
  const x = Math.sin(ramc) * Math.cos(e) + Math.tan(phi) * Math.sin(e);
  return norm360(toDeg(Math.atan2(y, x)));
}

function signOf(lon) {
  return ZODIAC[Math.floor(norm360(lon) / 30) % 12];
}

export function getUtcOffsetHours(year, month, day, hour, minute, timeZone) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(guess).reduce((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  const asIfUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asIfUTC - guess.getTime()) / 3600000;
}

export function computeChart({ year, month, day, hour, minute, utcOffset, lat, lon }) {
  const localAsUTCms = Date.UTC(year, month - 1, day, hour, minute);
  const utcMs = localAsUTCms - utcOffset * 3600000;
  const utcDate = new Date(utcMs);
  const y = utcDate.getUTCFullYear();
  const m = utcDate.getUTCMonth() + 1;
  const d = utcDate.getUTCDate();
  const hourUT = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60;

  const jd = julianDay(y, m, d, hourUT);
  const T = (jd - 2451545.0) / 36525;
  const sunLon = sunLongitude(T);
  const moonLon = moonLongitude(T);
  const ascLon = ascendant(jd, T, lon, lat);

  return {
    sun: { lon: sunLon, sign: signOf(sunLon) },
    moon: { lon: moonLon, sign: signOf(moonLon) },
    asc: { lon: ascLon, sign: signOf(ascLon) },
  };
}

export function buildProfile(chart, answers) {
  const elementScores = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalityScores = { cardinal: 0, fixed: 0, mutable: 0 };
  const tagScores = {};
  const bump = (obj, k, v) => (obj[k] = (obj[k] || 0) + v);

  bump(elementScores, chart.sun.sign.element, 3);
  bump(modalityScores, chart.sun.sign.modality, 3);
  bump(elementScores, chart.asc.sign.element, 2);
  bump(modalityScores, chart.asc.sign.modality, 2);
  bump(elementScores, chart.moon.sign.element, 2);
  bump(modalityScores, chart.moon.sign.modality, 2);

  (answers.quiz || []).forEach((opt) => {
    if (!opt) return;
    bump(elementScores, opt.el, 1);
    bump(tagScores, opt.tag, 1);
  });

  if (answers.relationship === "married" || answers.relationship === "relationship") {
    bump(tagScores, "family", 1);
    bump(tagScores, "romance", 1);
  }
  if (answers.relationship === "single") {
    bump(tagScores, "adventure", 1);
    bump(tagScores, "solo-growth", 1);
  }
  if (answers.work === "entrepreneur") {
    bump(tagScores, "ambition", 1);
    bump(tagScores, "career", 1);
  }
  if (answers.work === "corporate") {
    bump(tagScores, "career", 1);
    bump(tagScores, "stability", 1);
  }
  if (answers.work === "creative") bump(tagScores, "creative", 1);
  if (answers.work === "care") {
    bump(tagScores, "stability", 1);
    bump(tagScores, "family", 1);
  }

  const age = answers.age;
  if (age) {
    if (age < 28) {
      bump(tagScores, "adventure", 1);
      bump(tagScores, "solo-growth", 1);
    } else if (age < 42) {
      bump(tagScores, "career", 1);
      bump(tagScores, "ambition", 1);
    } else {
      bump(tagScores, "stability", 1);
      bump(tagScores, "family", 1);
    }
  }

  const sortedElements = Object.entries(elementScores).sort((a, b) => b[1] - a[1]);
  const dominantElement = sortedElements[0][0];
  const secondElement = sortedElements[1][0];
  const dominantModality = Object.entries(modalityScores).sort((a, b) => b[1] - a[1])[0][0];

  const scored = COUNTRIES.map((c) => {
    const elementFit = elementScores[c.element] * 1.5;
    const tagFit = c.tags.reduce((s, t) => s + (tagScores[t] || 0), 0);
    return { ...c, score: elementFit + tagFit };
  }).sort((a, b) => b.score - a.score);

  const topCountryRaw = scored[0];
  const sortByTagScore = (t1, t2) => (tagScores[t2] || 0) - (tagScores[t1] || 0);
  const proTag = topCountryRaw.tags
    .filter((t) => PROFESSIONAL_TAGS.includes(t))
    .sort(sortByTagScore)[0];
  const persTag = topCountryRaw.tags
    .filter((t) => PERSONAL_TAGS.includes(t))
    .sort(sortByTagScore)[0];

  const words = [
    ...ELEMENT_ADJ[dominantElement].slice(0, 2),
    ELEMENT_ADJ[secondElement][0],
    MODALITY_ADJ[dominantModality],
  ];

  const professionalInsight = [
    `At work, ${PRO_ELEMENT_TEXT[dominantElement]}.`,
    MODALITY_PRO_TEXT[dominantModality],
    WORK_CONTEXT_TEXT[answers.work] || "",
  ]
    .filter(Boolean)
    .join(" ");

  const personalInsight = [
    `In your personal life, ${PERSONAL_ELEMENT_TEXT[dominantElement]}.`,
    RELATIONSHIP_CONTEXT_TEXT[answers.relationship] || "",
  ]
    .filter(Boolean)
    .join(" ");

  const topCountry = {
    ...topCountryRaw,
    why: `This place scores highest for your ${dominantElement}-leaning chart and the life themes most active for you right now.`,
  };

  return {
    elementScores,
    modalityScores,
    tagScores,
    dominantElement,
    secondElement,
    dominantModality,
    topCountry,
    proTag,
    persTag,
    words,
    professionalInsight,
    personalInsight,
  };
}