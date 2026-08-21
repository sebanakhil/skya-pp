import React, { useCallback, useEffect, useRef, useState } from "react";
import * as wp from "./wordpokeApi";

const CARD_COLORS = ["#E8B94A", "#8FA876", "#D9857A", "#6FA8C9", "#A88FC9"];

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % CARD_COLORS.length;
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

export default function WordPoke() {
  const [screen, setScreen] = useState("landing"); // 'landing' | 'board'
  const [nameInput, setNameInput] = useState("");
  const [promptInput, setPromptInput] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [me, setMe] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [prompt, setPrompt] = useState("What's your word?");
  const [revealed, setRevealed] = useState(false);
  const [participants, setParticipants] = useState([]); // [{name, word, joined_at}]
  const [wordInput, setWordInput] = useState("");

  const unsubRef = useRef(null);

  const loadRoomState = useCallback(async (code) => {
    try {
      const [room, people] = await Promise.all([wp.fetchRoom(code), wp.fetchParticipants(code)]);
      if (!room) return;
      setPrompt(room.prompt);
      setRevealed(room.revealed);
      setParticipants(people);
    } catch {
      // transient network hiccup — the next realtime event or poll will catch up
    }
  }, []);

  const enterRoom = useCallback(
    (code, name) => {
      setRoomCode(code);
      setMe(name);
      setScreen("board");
      loadRoomState(code);
      unsubRef.current = wp.subscribeToRoom(code, () => loadRoomState(code));
    },
    [loadRoomState]
  );

  // Backstop poll in case the realtime socket drops.
  useEffect(() => {
    if (screen !== "board" || !roomCode) return undefined;
    const id = setInterval(() => loadRoomState(roomCode), 4000);
    return () => clearInterval(id);
  }, [screen, roomCode, loadRoomState]);

  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  async function handleCreate() {
    setError("");
    const name = nameInput.trim();
    if (!name) {
      setError("Enter your name first.");
      return;
    }
    setBusy(true);
    try {
      const code = await wp.createRoom(promptInput.trim());
      await wp.joinRoom(code, name);
      enterRoom(code, name);
    } catch (e) {
      setError(e.message || "Could not create a board — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    setError("");
    const name = nameInput.trim();
    const code = roomInput.trim().toUpperCase();
    if (!name) {
      setError("Enter your name first.");
      return;
    }
    if (!code) {
      setError("Enter a room code.");
      return;
    }
    setBusy(true);
    try {
      const room = await wp.fetchRoom(code);
      if (!room) {
        setError("No board found with that code.");
        return;
      }
      await wp.joinRoom(code, name);
      enterRoom(code, name);
    } catch (e) {
      setError(e.message || "Could not join that board.");
    } finally {
      setBusy(false);
    }
  }

  function leaveRoom() {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    setRoomCode(null);
    setMe(null);
    setScreen("landing");
    setWordInput("");
    setParticipants([]);
    setRevealed(false);
    setError("");
  }

  async function handlePin() {
    const word = wordInput.trim();
    if (!word || !roomCode || !me || revealed) return;
    setParticipants((prev) => prev.map((p) => (p.name === me ? { ...p, word } : p)));
    try {
      await wp.pinWord(roomCode, me, word);
    } catch {
      setError("Could not pin your word — try again.");
    }
  }

  async function handleReveal() {
    if (!roomCode) return;
    try {
      await wp.revealRoom(roomCode);
    } catch {
      setError("Could not reveal the board.");
    }
  }

  async function handleNewRound() {
    if (!roomCode) return;
    setWordInput("");
    try {
      await wp.newRound(roomCode);
    } catch {
      setError("Could not start a new round.");
    }
  }

  const myEntry = participants.find((p) => p.name === me);
  const iHavePinned = !!(myEntry && myEntry.word);
  const wordLocked = iHavePinned || revealed;

  return (
    <div
      style={{
        fontFamily: "'Nunito', sans-serif",
        background:
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.03), transparent 40%)," +
          "radial-gradient(circle at 80% 60%, rgba(255,255,255,0.03), transparent 40%)," +
          "repeating-linear-gradient(0deg, #4A3626, #4A3626 2px, #3A2A1C 2px, #3A2A1C 3px), #4A3626",
        color: "#F4ECD8",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px 64px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Nunito:wght@400;600;700;800&display=swap');

        .wp-app{ width:100%; max-width: 980px; }

        .wp-brand{ display:flex; align-items:baseline; gap:12px; justify-content:center; margin-bottom: 6px; }
        .wp-brand h1{
          font-family:'Kalam', cursive; font-size: 2.6rem; margin:0; color: #F4ECD8;
          text-shadow: 2px 2px 0 rgba(0,0,0,0.25); transform: rotate(-1.5deg);
        }
        .wp-pin{
          width:14px;height:14px;border-radius:50%;
          background: radial-gradient(circle at 35% 30%, #ff8a75, #C0392B);
          box-shadow: 0 3px 4px rgba(0,0,0,0.5); display:inline-block;
        }
        .wp-tagline{ text-align:center; color: rgba(244,236,216,0.65); font-size: 0.95rem; margin-bottom: 36px; }

        .wp-landing{
          max-width: 420px; margin: 40px auto 0; background: #F4ECD8; color: #2B2118;
          border-radius: 6px; padding: 32px 28px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.35), 0 2px 0 rgba(255,255,255,0.4) inset;
          position: relative; transform: rotate(0.4deg);
        }
        .wp-landing::before{
          content:""; position:absolute; top:-10px; left:50%; transform:translateX(-50%);
          width:18px; height:18px; border-radius:50%;
          background: radial-gradient(circle at 35% 30%, #ff8a75, #C0392B);
          box-shadow: 0 4px 6px rgba(0,0,0,0.4);
        }
        .wp-landing label{
          display:block; font-weight: 800; font-size: 0.78rem; letter-spacing: 0.06em;
          text-transform: uppercase; color: #6b5d4c; margin: 18px 0 6px;
        }
        .wp-landing label:first-of-type{ margin-top: 4px; }
        .wp-landing input{
          width:100%; font-family:'Nunito', sans-serif; font-size: 1.05rem; padding: 11px 12px;
          border-radius: 5px; border: 2px solid #ddd0b0; background: #fffdf7; color: #2B2118;
        }
        .wp-landing input:focus{ outline: none; border-color: #E8B94A; }
        .wp-room-row{ display:flex; gap:8px; }
        .wp-room-row input{ flex:1; text-transform: uppercase; letter-spacing: 0.08em; }

        .wp-btn{
          font-family:'Nunito', sans-serif; font-weight: 800; font-size: 0.95rem; border: none;
          border-radius: 6px; padding: 12px 18px; cursor: pointer;
          transition: transform 0.08s ease, box-shadow 0.08s ease;
        }
        .wp-btn:active{ transform: translateY(1px); }
        .wp-btn-primary{ background: #C0392B; color: #fff; box-shadow: 0 4px 0 #8e2a20; }
        .wp-btn-primary:hover{ background:#d1443a; }
        .wp-btn-primary:disabled{ opacity:0.5; cursor:not-allowed; }
        .wp-btn-ghost{ background: transparent; color: #6b5d4c; border: 2px dashed #cbbf9e; }
        .wp-btn-secondary{ background: #6FA8C9; color: #10202a; box-shadow: 0 4px 0 #4a7f9c; }
        .wp-btn-secondary:disabled{ opacity:0.5; cursor:not-allowed; }

        .wp-landing .wp-actions{ margin-top: 24px; display:flex; flex-direction:column; gap:10px; }
        .wp-divider-word{
          text-align:center; color:#b6a982; font-size:0.75rem; font-weight:800;
          text-transform:uppercase; letter-spacing:0.1em; margin: 4px 0;
        }
        .wp-error-msg{ color: #C0392B; font-size: 0.85rem; font-weight:700; margin-top:8px; min-height: 1.1em; }

        .wp-topbar{
          display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 12px;
          background: rgba(0,0,0,0.18); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
          padding: 14px 18px; margin-bottom: 26px;
        }
        .wp-room-info{ display:flex; align-items:center; gap:10px; font-size:0.95rem; flex-wrap: wrap; }
        .wp-room-code-badge{
          font-family:'Kalam', cursive; background: #E8B94A; color:#3a2a10;
          padding: 3px 12px; border-radius: 5px; font-size:1.15rem; letter-spacing: 0.08em;
          box-shadow: 0 2px 0 #a9772f;
        }
        .wp-you-badge{ color: rgba(244,236,216,0.7); }
        .wp-topbar .wp-controls{ display:flex; gap:10px; flex-wrap:wrap; }
        .wp-btn-sm{ padding: 9px 14px; font-size: 0.85rem; border-radius:5px; }

        .wp-prompt-box{ text-align:center; margin-bottom: 28px; }
        .wp-prompt-box h2{ font-family:'Kalam', cursive; font-size: 1.6rem; font-weight: 700; margin: 0 0 14px; color: #F4ECD8; }
        .wp-answer-row{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
        .wp-answer-row input{
          width: min(340px, 80vw); font-family: 'Nunito', sans-serif; font-size: 1.05rem;
          padding: 13px 16px; border-radius: 6px; border: none; background: #F4ECD8; color: #2B2118;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        }
        .wp-answer-row input:focus{ outline: 3px solid #E8B94A; }
        .wp-answer-row input:disabled{ opacity: 0.7; }
        .wp-locked-msg{ color: #8FA876; font-weight:700; font-size:0.9rem; margin-top:10px; }

        .wp-pinboard{
          display:grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 22px;
          padding: 10px 4px 4px;
        }
        .wp-card-slot{ perspective: 900px; margin-bottom: 30px; }
        .wp-card{
          position:relative; height: 140px; border-radius: 6px; transform-style: preserve-3d;
          transition: transform 0.55s cubic-bezier(.2,.8,.2,1); box-shadow: 0 10px 18px rgba(0,0,0,0.4);
        }
        .wp-card.revealed{ transform: rotateY(180deg); }

        .wp-card-face{
          position:absolute; inset:0; border-radius:6px; display:flex; flex-direction:column;
          align-items:center; justify-content:center; backface-visibility: hidden; padding: 10px; text-align:center;
        }
        .wp-card-back{
          background: repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 8px, transparent 8px 16px), #C0392B;
        }
        .wp-card-back .wp-waiting-dots{
          width:10px;height:10px;border-radius:50%; background: rgba(255,255,255,0.85);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.15);
        }
        .wp-card-back .wp-pin-icon{
          width:12px;height:12px;border-radius:50%; background: radial-gradient(circle at 35% 30%, #fff, #ddd);
          margin-bottom: 10px;
        }

        .wp-card-front{ transform: rotateY(180deg); color: #2B2118; }
        .wp-card-word{ font-family: 'Kalam', cursive; font-size: 1.25rem; font-weight: 700; line-height: 1.15; word-break: break-word; }

        .wp-card-name{
          position:absolute; bottom: -26px; left:0; right:0; text-align:center;
          font-size: 0.78rem; font-weight: 700; color: rgba(244,236,216,0.75);
        }
        .wp-card-name .wp-you-tag{ color: #E8B94A; }

        .wp-empty-state{ text-align:center; color: rgba(244,236,216,0.5); font-style: italic; padding: 40px 0; }

        .wp-footer-note{ text-align:center; margin-top: 40px; font-size: 0.78rem; color: rgba(244,236,216,0.35); }

        @media (prefers-reduced-motion: reduce){ .wp-card{ transition: none; } }
      `}</style>

      <div className="wp-app">
        <div className="wp-brand">
          <span className="wp-pin"></span>
          <h1>WordPoke</h1>
        </div>
        <p className="wp-tagline">Pin your word. Reveal together. No numbers allowed.</p>

        {screen === "landing" && (
          <div className="wp-landing">
            <label htmlFor="wpName">Your name</label>
            <input
              id="wpName"
              type="text"
              placeholder="e.g. Priya"
              maxLength={24}
              autoComplete="off"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />

            <label htmlFor="wpPrompt">Question for the board (only if creating)</label>
            <input
              id="wpPrompt"
              type="text"
              placeholder="e.g. Describe this sprint in one word"
              maxLength={80}
              autoComplete="off"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />

            <div className="wp-actions">
              <button className="wp-btn wp-btn-primary" disabled={busy} onClick={handleCreate}>
                Create a new board
              </button>
              <div className="wp-divider-word">or join one</div>
              <div className="wp-room-row">
                <input
                  type="text"
                  placeholder="ROOM CODE"
                  maxLength={6}
                  autoComplete="off"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
                <button className="wp-btn wp-btn-secondary" disabled={busy} onClick={handleJoin}>
                  Join
                </button>
              </div>
            </div>
            <div className="wp-error-msg">{error}</div>
          </div>
        )}

        {screen === "board" && (
          <div>
            <div className="wp-topbar">
              <div className="wp-room-info">
                <span className="wp-room-code-badge">{roomCode}</span>
                <span className="wp-you-badge">
                  You're in as <strong>{me}</strong>
                </span>
              </div>
              <div className="wp-controls">
                <button className="wp-btn wp-btn-secondary wp-btn-sm" disabled={revealed} onClick={handleReveal}>
                  Reveal
                </button>
                <button className="wp-btn wp-btn-ghost wp-btn-sm" onClick={handleNewRound}>
                  New round
                </button>
                <button className="wp-btn wp-btn-ghost wp-btn-sm" onClick={leaveRoom}>
                  Leave
                </button>
              </div>
            </div>

            <div className="wp-prompt-box">
              <h2>{prompt}</h2>
              <div className="wp-answer-row">
                <input
                  type="text"
                  placeholder="Type your word or phrase…"
                  maxLength={40}
                  autoComplete="off"
                  value={wordInput}
                  disabled={wordLocked}
                  onChange={(e) => setWordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePin()}
                />
                <button className="wp-btn wp-btn-primary" disabled={wordLocked} onClick={handlePin}>
                  Pin it
                </button>
              </div>
              {iHavePinned && <div className="wp-locked-msg">✓ Pinned — waiting on the others</div>}
              {error && <div className="wp-error-msg">{error}</div>}
            </div>

            {participants.length > 0 ? (
              <div className="wp-pinboard">
                {participants.map((p) => {
                  const hasWord = !!p.word;
                  return (
                    <div className="wp-card-slot" key={p.name}>
                      <div className={"wp-card" + (revealed && hasWord ? " revealed" : "")}>
                        <div className="wp-card-face wp-card-back" style={{ opacity: hasWord ? 1 : 0.35 }}>
                          <div className="wp-pin-icon"></div>
                          {hasWord ? (
                            <div className="wp-waiting-dots"></div>
                          ) : (
                            <div style={{ fontSize: "0.75rem", color: "#fff" }}>thinking…</div>
                          )}
                        </div>
                        <div className="wp-card-face wp-card-front" style={{ background: colorFor(p.name) }}>
                          <div className="wp-card-word">{hasWord ? p.word : ""}</div>
                        </div>
                      </div>
                      <div className="wp-card-name">
                        {p.name === me ? <span className="wp-you-tag">{p.name} (you)</span> : p.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="wp-empty-state">No one has pinned a word yet.</div>
            )}
          </div>
        )}

        <p className="wp-footer-note">
          Words are visible to everyone in the room once revealed. Leave to reset your own device.
        </p>
      </div>
    </div>
  );
}
