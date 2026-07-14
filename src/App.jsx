console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("SUPABASE KEY:", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

import React, { useMemo, useState, useEffect } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  C,
  FONTS_LINK,
  ZODIAC,
  ELEMENT_LABEL,
  QUIZ,
  TAG_PHRASE,
} from "./appData";
import { RITUAL_MESSAGES, buildReadingText } from "./appText";
import { getUtcOffsetHours, computeChart, buildProfile } from "./appUtils";
import { supabase } from "./supabaseClient";

const sectionTitle = {
  fontFamily: "'Fraunces', serif",
  color: C.parchment,
  fontSize: 24,
  marginTop: 0,
  marginBottom: 18,
  fontWeight: 600,
  letterSpacing: -0.3,
};

const fieldLabel = {
  display: "block",
  color: C.parchmentDim,
  fontSize: 12,
  marginBottom: 8,
  letterSpacing: 0.4,
  textTransform: "uppercase",
};

const inputStyle = {
  width: "100%",
  background: C.ink,
  color: C.parchment,
  border: `1px solid ${C.line}`,
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: 14,
  marginBottom: 2,
};

const primaryBtn = {
  background: C.brass,
  color: C.ink,
  border: "none",
  padding: "10px 16px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const ghostBtn = {
  background: "transparent",
  color: C.parchment,
  border: `1px solid ${C.line}`,
  padding: "10px 16px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

async function saveSubmission(payload) {
  const { data, error } = await supabase
    .from("quiz_responses")
    .insert([payload])
    .select();

  console.log("SUPABASE INSERT DATA:", data);
  console.log("SUPABASE INSERT ERROR:", error);

  if (error) {
    console.error("Supabase insert failed:", error);
    throw error;
  }

  return data;
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

function NavRow({ back, next, nextDisabled, nextLabel = "Continue" }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 20,
      }}
    >
      <button onClick={back} style={ghostBtn} type="button">
        <ChevronLeft size={16} /> Back
      </button>
      <button
        onClick={next}
        disabled={nextDisabled}
        type="button"
        style={{
          ...primaryBtn,
          opacity: nextDisabled ? 0.45 : 1,
          cursor: nextDisabled ? "not-allowed" : "pointer",
        }}
      >
        {nextLabel} <ChevronRight size={16} />
      </button>
    </div>
  );
}

function MoonPhase({ index, active, done }) {
  const r = 8;
  const fill = active ? C.brass : done ? C.parchmentDim : "transparent";
  const stroke = active || done ? C.brass : C.line;

  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r={r} fill="none" stroke={stroke} strokeWidth="1.3" />
      {index === 0 && (
        <circle cx="9" cy="9" r={r} fill={fill} opacity={active || done ? 1 : 0} />
      )}
      {index === 1 && (
        <path
          d="M9,1 A8,8 0 0 1 9,17 Z"
          fill={fill}
          opacity={active || done ? 1 : 0}
        />
      )}
      {index === 2 && (
        <circle cx="9" cy="9" r={r} fill={fill} opacity={active || done ? 1 : 0} />
      )}
      {index === 3 && (
        <path
          d="M9,1 A8,8 0 0 0 9,17 Z"
          fill={fill}
          opacity={active || done ? 1 : 0}
        />
      )}
    </svg>
  );
}

function BirthWheel({ chart }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 130;
  const innerR = 96;
  const glyphR = 113;

  const toRad = (d) => (d * Math.PI) / 180;
  const angleFor = (lon) => toRad(lon - 90);

  const pt = (r, lon) => {
    const a = angleFor(lon);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const elColor = {
    fire: C.fire,
    earth: C.earth,
    air: C.air,
    water: C.water,
  };

  const markers = [
    { key: "sun", label: "☉", lon: chart.sun.lon, color: C.brass },
    { key: "moon", label: "☽", lon: chart.moon.lon, color: C.parchment },
    { key: "asc", label: "AC", lon: chart.asc.lon, color: C.fire },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {ZODIAC.map((z, i) => {
        const a0 = toRad(i * 30 - 90);
        const a1 = toRad((i + 1) * 30 - 90);
        const x0 = cx + outerR * Math.cos(a0);
        const y0 = cy + outerR * Math.sin(a0);
        const x1 = cx + outerR * Math.cos(a1);
        const y1 = cy + outerR * Math.sin(a1);
        const path = `M ${cx} ${cy} L ${x0} ${y0} A ${outerR} ${outerR} 0 0 1 ${x1} ${y1} Z`;
        const [gx, gy] = pt(glyphR, i * 30 + 15);

        return (
          <g key={z.name}>
            <path d={path} fill={elColor[z.element]} opacity={i % 2 === 0 ? 0.1 : 0.05} />
            <text
              x={gx}
              y={gy}
              fontSize="13"
              fill={C.parchmentDim}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {z.glyph}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={C.line} strokeWidth="1" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke={C.line} strokeWidth="1" />

      {markers.map((m) => {
        const [mx, my] = pt(innerR - 14, m.lon);
        const [lx, ly] = pt(innerR, m.lon);

        return (
          <g key={m.key}>
            <line
              x1={cx}
              y1={cy}
              x2={lx}
              y2={ly}
              stroke={m.color}
              strokeWidth="0.6"
              opacity="0.5"
            />
            <circle cx={mx} cy={my} r="12" fill={C.ink2} stroke={m.color} strokeWidth="1.3" />
            <text
              x={mx}
              y={my}
              fontSize="11"
              fill={m.color}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const markerIcon = L.divIcon({
  className: "custom-birth-pin",
  html: `
    <div style="display:flex;align-items:center;justify-content:center;transform:translate(-50%,-100%);">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 21s-6-5.33-6-11a6 6 0 1 1 12 0c0 5.67-6 11-6 11Z"
          fill="${C.brass}"
          stroke="${C.ink}"
          stroke-width="1.5"
        />
        <circle cx="12" cy="10" r="2.5" fill="${C.ink}" />
      </svg>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapClickHandler({ onPick, pin }) {
  const map = useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (pin) {
      map.flyTo([pin.lat, pin.lon], Math.max(map.getZoom(), 12), {
        duration: 0.8,
      });
    }
  }, [pin, map]);

  return pin ? <Marker position={[pin.lat, pin.lon]} icon={markerIcon} /> : null;
}

function WorldMapPicker({ onSelect }) {
  const [pin, setPin] = useState(null);
  const [label, setLabel] = useState("");
  const [timezone, setTimezone] = useState(null);
  const [manualUtc, setManualUtc] = useState("");
  const [loading, setLoading] = useState(false);
  const [tzFailed, setTzFailed] = useState(false);

  const resolvePin = (lat, lon) => {
    setPin({ lat, lon });
    setLoading(true);
    setTzFailed(false);
    setLabel("");
    setTimezone(null);

    Promise.allSettled([
      fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      ).then((r) => r.json()),
      fetch(
        `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lon}`
      ).then((r) => r.json()),
    ]).then(([geoRes, tzRes]) => {
      setLoading(false);

      if (geoRes.status === "fulfilled" && geoRes.value) {
        const d = geoRes.value;
        const name = [d.city || d.locality, d.principalSubdivision, d.countryName]
          .filter(Boolean)
          .join(", ");
        setLabel(name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      } else {
        setLabel(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      }

      if (tzRes.status === "fulfilled" && tzRes.value?.timeZone) {
        setTimezone(tzRes.value.timeZone);
      } else {
        setTzFailed(true);
      }
    });
  };

  const confirm = () => {
    if (!pin) return;

    if (timezone) {
      onSelect({
        name: label,
        lat: pin.lat,
        lon: pin.lon,
        timezone,
      });
    } else if (manualUtc !== "") {
      onSelect({
        name: label,
        lat: pin.lat,
        lon: pin.lon,
        timezone: null,
        utcOverride: parseFloat(manualUtc),
      });
    }
  };

  const canConfirm = pin && (timezone || (tzFailed && manualUtc !== ""));

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 11.5,
            color: C.parchmentDim,
            padding: "10px 12px",
            border: `1px solid ${C.line}`,
            borderRadius: 10,
          }}
        >
          Scroll to zoom, drag to pan, click to drop a pin
        </span>
      </div>

      <div
        style={{
          width: "100%",
          aspectRatio: "2 / 1",
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${C.line}`,
          marginBottom: 10,
          background: C.ink,
        }}
      >
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={19}
          zoomSnap={0}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={80}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            attribution="&copy; OpenStreetMap contributors"
          />
          <MapClickHandler onPick={resolvePin} pin={pin} />
        </MapContainer>
      </div>

      {pin && (
        <div
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: C.parchmentDim,
              marginBottom: 4,
            }}
          >
            {pin.lat.toFixed(5)}°, {pin.lon.toFixed(5)}°
          </div>

          {loading && (
            <p style={{ fontSize: 12.5, color: C.parchmentDim, margin: 0 }}>Locating…</p>
          )}

          {!loading && label && (
            <p style={{ fontSize: 13.5, color: C.parchment, margin: 0 }}>{label}</p>
          )}

          {!loading && tzFailed && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 12, color: C.parchmentDim, marginBottom: 6 }}>
                Couldn't detect the timezone automatically — enter the UTC offset at birth:
              </p>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 5.5"
                value={manualUtc}
                onChange={(e) => setManualUtc(e.target.value)}
                style={{ ...inputStyle, marginBottom: 0 }}
              />
            </div>
          )}
        </div>
      )}

      {pin && !loading && (
        <button
          onClick={confirm}
          disabled={!canConfirm}
          type="button"
          style={{
            background: canConfirm ? C.brass : C.line,
            color: canConfirm ? C.ink : C.parchmentDim,
            border: "none",
            padding: "9px 16px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: canConfirm ? "pointer" : "not-allowed",
            marginBottom: 10,
          }}
        >
          Use this location
        </button>
      )}
    </div>
  );
}

function RevealRitual({ onDone }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const stepper = setInterval(() => {
      setIdx((i) => Math.min(i + 1, RITUAL_MESSAGES.length - 1));
    }, 1000);

    const finish = setTimeout(() => {
      onDone();
    }, RITUAL_MESSAGES.length * 1000 + 500);

    return () => {
      clearInterval(stepper);
      clearTimeout(finish);
    };
  }, [onDone]);

  return (
    <div style={{ textAlign: "center", padding: "36px 0 24px" }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ margin: "0 auto", display: "block" }}>
        <g style={{ transformOrigin: "60px 60px" }} className="ritual-spin">
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x = 60 + 48 * Math.cos(a);
            const y = 60 + 48 * Math.sin(a);
            return <circle key={i} cx={x} cy={y} r="2" fill={C.brass} opacity={0.3 + (i % 4) * 0.15} />;
          })}
        </g>
        <circle cx="60" cy="60" r="14" fill="none" stroke={C.brass} strokeWidth="1.4" className="ritual-pulse" />
        <circle cx="60" cy="60" r="4" fill={C.brass} />
      </svg>

      <p
        key={idx}
        className="fade-in"
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 17,
          color: C.parchment,
          marginTop: 20,
          minHeight: 26,
        }}
      >
        {RITUAL_MESSAGES[idx]}
      </p>
    </div>
  );
}

function ResultsView({ result, onReset }) {
  const { chart, profile } = result;
  const radarData = Object.entries(profile.elementScores).map(([k, v]) => ({
    element: ELEMENT_LABEL[k],
    value: v,
  }));
  const reading = buildReadingText({ chart, profile, tagPhrase: TAG_PHRASE });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Sparkles size={18} color={C.brass} />
        <div
          style={{
            color: C.brass,
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Your reading
        </div>
      </div>

      <h2 style={sectionTitle}>A chart-shaped compass, not a verdict</h2>

      <div style={{ display: "grid", justifyItems: "center", marginBottom: 18 }}>
        <BirthWheel chart={chart} />
      </div>
      {profile.topCountry?.name && (
        <div
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 12,
            padding: 14,
            background: "rgba(199,154,86,0.10)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              color: C.parchmentDim,
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Suggested country
          </div>
          <div
            style={{
              color: C.parchment,
              fontFamily: "'Fraunces', serif",
              fontSize: 22,
              marginBottom: 6,
            }}
          >
            {profile.topCountry.name}
          </div>
          {profile.topCountry.why && (
            <div style={{ color: C.parchmentDim, fontSize: 13, lineHeight: 1.6 }}>
              {profile.topCountry.why}
            </div>
          )}
        </div>
      )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
        {[
          ["Sun", chart.sun.sign],
          ["Moon", chart.moon.sign],
          ["Asc", chart.asc.sign],
        ].map(([label, sign]) => (
          <div
            key={label}
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              padding: 12,
              textAlign: "center",
              background: C.ink,
            }}
          >
            <div
              style={{
                color: C.parchmentDim,
                fontSize: 11,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
            <div
              style={{
                color: C.parchment,
                fontFamily: "'Fraunces', serif",
                fontSize: 18,
                marginTop: 6,
              }}
            >
              {sign.glyph} {sign.name}
            </div>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", height: 240, marginBottom: 18 }}>
        <ResponsiveContainer>
          <RadarChart data={radarData} outerRadius="72%">
            <PolarGrid stroke={C.line} />
            <PolarAngleAxis
              dataKey="element"
              tick={{ fill: C.parchmentDim, fontSize: 12 }}
            />
            <Radar dataKey="value" stroke={C.brass} fill={C.brass} fillOpacity={0.28} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: 16,
          background: C.ink,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            color: C.parchment,
            fontSize: 14,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}
        >
          {reading}
        </div>
      </div>

      <button onClick={onReset} style={ghostBtn} type="button">
        <RotateCcw size={16} /> Start over
      </button>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState({ lat: "", lon: "", utc: "" });
  const [birth, setBirth] = useState({ date: "", time: "" });
  const [about, setAbout] = useState({ relationship: "", work: "" });
  const [quizAnswers, setQuizAnswers] = useState([null, null, null, null]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const canProceedStep0 =
    birth.date &&
    birth.time &&
    (manualMode
      ? manual.lat !== "" && manual.lon !== "" && manual.utc !== ""
      : location !== null);

  const canProceedStep1 = about.relationship && about.work;
  const canProceedStep2 = quizAnswers.every((a) => a !== null);
  const canProceedStep3 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const age = useMemo(() => {
    if (!birth.date) return null;
    const b = new Date(birth.date);
    const now = new Date();
    let a = now.getFullYear() - b.getFullYear();
    const notYet =
      now.getMonth() < b.getMonth() ||
      (now.getMonth() === b.getMonth() && now.getDate() < b.getDate());
    if (notYet) a -= 1;
    return a;
  }, [birth.date]);

  const result = useMemo(() => {
    if (step < 5) return null;

    try {
      const [y, m, d] = birth.date.split("-").map(Number);
      const [hh, mm] = birth.time.split(":").map(Number);

      let lat;
      let lon;
      let utc;

      if (manualMode) {
        lat = parseFloat(manual.lat);
        lon = parseFloat(manual.lon);
        utc = parseFloat(manual.utc);
      } else {
        lat = location?.lat;
        lon = location?.lon;
        utc = location?.timezone
          ? getUtcOffsetHours(y, m, d, hh, mm, location.timezone)
          : typeof location?.utcOverride === "number"
          ? location.utcOverride
          : NaN;
      }

      if ([lat, lon, utc].some((v) => Number.isNaN(v) || v == null)) {
        throw new Error("bad numbers");
      }

      const chart = computeChart({
        year: y,
        month: m,
        day: d,
        hour: hh,
        minute: mm,
        utcOffset: utc,
        lat,
        lon,
      });

      const profile = buildProfile(chart, {
        quiz: quizAnswers,
        ...about,
        age,
      });

      return { chart, profile };
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [step, birth, manualMode, manual, location, quizAnswers, about, age]);

  useEffect(() => {
    if (step === 5 && !result) {
      setError("Something in the birth details didn't compute — please check the date, time, and location.");
    } else {
      setError("");
    }
  }, [step, result]);

  useEffect(() => {
    async function persistResult() {
      if (!result || step !== 5 || saved) return;

      console.log("persistResult triggered");
      console.log("RESULT OBJECT:", result);
      console.log("QUIZ ANSWERS:", quizAnswers);

      try {
        let lat = null;
        let lon = null;
        let timezone = null;
        let birthLocationName = null;

        if (manualMode) {
          lat = parseFloat(manual.lat);
          lon = parseFloat(manual.lon);
          timezone = manual.utc || null;
        } else {
          lat = location?.lat ?? null;
          lon = location?.lon ?? null;
          timezone =
            location?.timezone ??
            (typeof location?.utcOverride === "number"
              ? String(location.utcOverride)
              : null);
          birthLocationName = location?.name ?? null;
        }

        const payload = {
          created_at: new Date().toISOString(),
          email: email || null,
          birth_date: birth.date || null,
          birth_time: birth.time || null,
          birth_location_name: birthLocationName,
          suggested_country: result.profile.topCountry?.name || null,
          suggested_country_reason: result.profile.topCountry?.why || null,
          dominant_element: result.profile.dominantElement || null,
          second_element: result.profile.secondElement || null,
          dominant_modality: result.profile.dominantModality || null,
          pro_tag: result.profile.proTag || null,
          pers_tag: result.profile.persTag || null,
          sun_sign: result.chart.sun.sign.name,
          moon_sign: result.chart.moon.sign.name,
          asc_sign: result.chart.asc.sign.name,
          relationship: about.relationship || null,
          work: about.work || null,
          quiz_1: quizAnswers[0]?.label || null,
          quiz_2: quizAnswers[1]?.label || null,
          quiz_3: quizAnswers[2]?.label || null,
          quiz_4: quizAnswers[3]?.label || null,
          quiz_answers: quizAnswers.map((q) =>
            q ? { label: q.label, el: q.el, tag: q.tag } : null
          ),
          lat,
          lon,
          timezone,
          full_result: result,
        };

        console.log("PAYLOAD TO SAVE:", payload);

        const inserted = await saveSubmission(payload);
        console.log("INSERTED ROW:", inserted);

        setSaved(true);
      } catch (err) {
        console.error("Failed to save reading:", err);
      }
    }

    persistResult();
  }, [result, step, saved, manualMode, manual, location, email, birth, about, quizAnswers]);

  const reset = () => {
    setStep(0);
    setLocation(null);
    setManualMode(false);
    setManual({ lat: "", lon: "", utc: "" });
    setBirth({ date: "", time: "" });
    setAbout({ relationship: "", work: "" });
    setQuizAnswers([null, null, null, null]);
    setEmail("");
    setError("");
    setSaved(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.ink,
        fontFamily: "'Work Sans', sans-serif",
      }}
    >
      <link href={FONTS_LINK} rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; }
        input, select { font-family: 'Work Sans', sans-serif; }
        input:focus, select:focus, button:focus-visible { outline: 2px solid ${C.brass}; outline-offset: 2px; }
        ::selection { background: ${C.brass}; color: ${C.ink}; }

        .leaflet-container {
          background: ${C.ink};
          font-family: 'Work Sans', sans-serif;
        }

        .leaflet-control-zoom a {
          background: ${C.ink2};
          color: ${C.parchment};
          border-bottom: 1px solid ${C.line};
        }

        .leaflet-control-zoom a:hover {
          background: ${C.ink};
          color: ${C.brass};
        }

        .leaflet-bar {
          border: 1px solid ${C.line};
          box-shadow: none;
        }

        .leaflet-control-attribution {
          background: rgba(0,0,0,0.45);
          color: ${C.parchmentDim};
          font-size: 10px;
        }

        .leaflet-control-attribution a {
          color: ${C.brass};
        }

        @media (prefers-reduced-motion: no-preference) {
          .fade-in { animation: fadeIn 0.5s ease both; }
          .ritual-spin { animation: spin 6s linear infinite; }
          .ritual-pulse { animation: pulse 1.6s ease-in-out infinite; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; r: 14; }
          50% { opacity: 1; r: 17; }
        }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px 80px" }}>
        <header style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: 3,
              color: C.brass,
              marginBottom: 10,
            }}
          >
            A SELF-EXPLORATION FIELD GUIDE
          </div>

          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 600,
              fontSize: 34,
              color: C.parchment,
              margin: 0,
              letterSpacing: -0.5,
            }}
          >
            Where the Sky Points You
          </h1>

          <p
            style={{
              color: C.parchmentDim,
              fontSize: 14,
              marginTop: 10,
              lineHeight: 1.6,
            }}
          >
            Your birth chart, read as a compass — not a verdict. Answer honestly,
            take what resonates, leave the rest.
          </p>
        </header>

        {step < 4 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 28 }}>
            {[0, 1, 2, 3].map((i) => (
              <MoonPhase key={i} index={i} active={step === i} done={step > i} />
            ))}
          </div>
        )}

        <div
          className="fade-in"
          key={step}
          style={{
            background: C.ink2,
            border: `1px solid ${C.line}`,
            borderRadius: 16,
            padding: 28,
          }}
        >
          {step === 0 && (
            <div>
              <h2 style={sectionTitle}>When and where did your story begin?</h2>

              <Field label="Birth date">
                <input
                  type="date"
                  value={birth.date}
                  onChange={(e) => setBirth({ ...birth, date: e.target.value })}
                  style={inputStyle}
                />
              </Field>

              <Field label="Birth time (as close as you know it)">
                <input
                  type="time"
                  value={birth.time}
                  onChange={(e) => setBirth({ ...birth, time: e.target.value })}
                  style={inputStyle}
                />
              </Field>

              <Field label="Birth location">
                <WorldMapPicker onSelect={setLocation} />

                {location && (
                  <p
                    style={{
                      fontSize: 12,
                      color: C.brass,
                      marginTop: 10,
                      marginBottom: 14,
                    }}
                  >
                    Using {location.name} • {location.timezone || `UTC ${location.utcOverride ?? ""}`}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setManualMode(!manualMode);
                    if (!manualMode) setLocation(null);
                  }}
                  style={{ ...ghostBtn, marginTop: manualMode ? 0 : 4, marginBottom: 14 }}
                >
                  {manualMode ? "Use the map instead" : "Enter coordinates manually"}
                </button>

                {manualMode && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Latitude"
                      value={manual.lat}
                      onChange={(e) => setManual({ ...manual, lat: e.target.value })}
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Longitude"
                      value={manual.lon}
                      onChange={(e) => setManual({ ...manual, lon: e.target.value })}
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      step="0.5"
                      placeholder="UTC offset"
                      value={manual.utc}
                      onChange={(e) => setManual({ ...manual, utc: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                )}
              </Field>

              <NavRow
                back={() => {}}
                next={() => setStep(1)}
                nextDisabled={!canProceedStep0}
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={sectionTitle}>A little context helps the reading land better</h2>

              <Field label="Relationship">
                <select
                  value={about.relationship}
                  onChange={(e) => setAbout({ ...about, relationship: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Choose one</option>
                  <option value="single">Single</option>
                  <option value="relationship">In a relationship</option>
                  <option value="married">Married</option>
                </select>
              </Field>

              <Field label="Work season">
                <select
                  value={about.work}
                  onChange={(e) => setAbout({ ...about, work: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Choose one</option>
                  <option value="corporate">Corporate / structured</option>
                  <option value="entrepreneur">Entrepreneur / builder</option>
                  <option value="creative">Creative / expressive</option>
                  <option value="care">Care / education / healthcare</option>
                  <option value="other">Other</option>
                </select>
              </Field>

              <NavRow
                back={() => setStep(0)}
                next={() => setStep(2)}
                nextDisabled={!canProceedStep1}
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={sectionTitle}>What are you reaching for right now?</h2>

              {QUIZ.map((item, i) => (
                <Field key={i} label={item.q}>
                  <div style={{ display: "grid", gap: 8 }}>
                    {item.options.map((opt) => {
                      const selected = quizAnswers[i]?.label === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            const next = [...quizAnswers];
                            next[i] = opt;
                            setQuizAnswers(next);
                          }}
                          style={{
                            textAlign: "left",
                            padding: "11px 12px",
                            borderRadius: 10,
                            border: `1px solid ${selected ? C.brass : C.line}`,
                            background: selected ? "rgba(199,154,86,0.12)" : C.ink,
                            color: C.parchment,
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              ))}

              <NavRow
                back={() => setStep(1)}
                next={() => setStep(3)}
                nextDisabled={!canProceedStep2}
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={sectionTitle}>Where should the reading be sent?</h2>

              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  placeholder="you@example.com"
                />
              </Field>

              <NavRow
                back={() => setStep(2)}
                next={() => setStep(4)}
                nextDisabled={!canProceedStep3}
                nextLabel="Reveal"
              />
            </div>
          )}

          {step === 4 && <RevealRitual onDone={() => setStep(5)} />}
          {step === 5 && result && <ResultsView result={result} onReset={reset} />}

          {error && (
            <p style={{ color: C.fire, fontSize: 13, marginTop: 14 }}>{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}