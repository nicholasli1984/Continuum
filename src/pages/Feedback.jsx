import { useState } from "react";
import { apiFetch } from "../utils/apiBase";

// Editorial "be heard" page in the bottom nav. Covers feature ideas, general
// feedback, and bug reports — one form, three modes via the top pill selector.
// Layout follows the reference Feedback screen (satisfaction rating + chips +
// comments + big submit), in the app's orange accent rather than the reference's
// green. All three submission types pass through one /api/feedback POST.
export default function FeedbackPage({ css, isMobile, darkMode, user }) {
  const D = !!darkMode;
  const dv = {
    bone: D ? "#1a1a1a" : "#fff",
    paper: D ? "#222" : "#fff",
    ink: D ? "#f0ece6" : "#15130F",
    taupe: D ? "#9a948a" : "#6B6458",
    stone: D ? "#8a8a8a" : "#857A66",
    cream: D ? "rgba(255,255,255,0.10)" : "#E2DCCE",
    accent: css?.accent || "#D4742D",
    accentSoft: D ? "rgba(232,136,58,0.12)" : "rgba(212,116,45,0.08)",
    serif: "'Fraunces', Georgia, serif",
    sans: "'Inter Tight', sans-serif",
    mono: "'JetBrains Mono', monospace",
  };

  const TYPES = [
    { id: "Feature request", label: "Feature idea", ph: "Describe the feature you'd love to see…" },
    { id: "Feedback", label: "Feedback", ph: "Share details about your experience or suggestions for improvement." },
    { id: "Bug report", label: "Bug", ph: "What happened, where in the app, and what you expected instead…" },
  ];

  const RATINGS = [
    { id: 1, emoji: "😠", label: "Very unsatisfied" },
    { id: 2, emoji: "😕", label: "Unsatisfied" },
    { id: 3, emoji: "😐", label: "Neutral" },
    { id: 4, emoji: "🙂", label: "Satisfied" },
    { id: 5, emoji: "😄", label: "Very satisfied" },
  ];

  const CHIPS = ["Trip planning", "Live flight updates", "Booking import", "Lounge finder", "App reliability"];

  const [type, setType] = useState("Feedback");
  const [rating, setRating] = useState(0);
  const [chips, setChips] = useState(new Set());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const active = TYPES.find(t => t.id === type) || TYPES[1];
  const ratingObj = RATINGS.find(r => r.id === rating);
  const toggleChip = (c) => setChips(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; });

  const submit = async () => {
    if (!message.trim() && !rating && chips.size === 0) { setError("Pick a rating or jot a few words."); return; }
    setSending(true); setError("");
    try {
      const resp = await apiFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || null,
          email: user?.email || null,
          category: type,
          message: message.trim(),
          rating: rating || null,
          ratingLabel: ratingObj?.label || null,
          highlights: [...chips],
        }),
      });
      if (!resp.ok) throw new Error("failed");
      setDone(true);
    } catch {
      setError("Couldn't send — please try again.");
    }
    setSending(false);
  };

  const reset = () => { setDone(false); setMessage(""); setType("Feedback"); setRating(0); setChips(new Set()); setError(""); };

  return (
    <div style={{ fontFamily: dv.sans, color: dv.ink, maxWidth: 640, margin: "0 auto", padding: isMobile ? "6px 20px 48px" : "12px 0 64px" }}>
      {/* Hero — matches the editorial flow */}
      <div style={{ marginBottom: 28, paddingBottom: 22, borderBottom: `1px solid ${dv.cream}` }}>
        <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: dv.accent, marginBottom: 12 }}>Help shape Continuum</div>
        <h1 style={{ margin: 0, fontFamily: dv.serif, fontSize: isMobile ? 30 : 38, fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.02em", color: dv.ink }}>Share your feedback</h1>
        <p style={{ margin: "12px 0 0", fontFamily: dv.serif, fontStyle: "italic", fontSize: isMobile ? 14 : 16, lineHeight: 1.5, color: dv.taupe, maxWidth: 520 }}>
          Your feedback helps us shape Continuum. Suggest a feature, share what you think, or flag something off — we read every note.
        </p>
      </div>

      {!done ? (
        <>
          {/* Type selector — feature idea / feedback / bug */}
          <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            {TYPES.map(t => {
              const on = t.id === type;
              return (
                <button key={t.id} onClick={() => { setType(t.id); setError(""); }} style={{
                  padding: "9px 18px", borderRadius: 999,
                  border: `1px solid ${on ? dv.accent : dv.cream}`,
                  background: on ? dv.accent : "transparent",
                  color: on ? "#fff" : dv.taupe,
                  fontFamily: dv.sans, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}>{t.label}</button>
              );
            })}
          </div>

          {/* Satisfaction */}
          <div style={{ marginBottom: 30 }}>
            <h3 style={{ margin: "0 0 14px", fontFamily: dv.sans, fontSize: 16, fontWeight: 700, color: dv.ink }}>How satisfied are you with Continuum?</h3>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, maxWidth: 420 }}>
              {RATINGS.map(r => {
                const on = rating === r.id;
                return (
                  <button key={r.id} onClick={() => setRating(r.id)} title={r.label} style={{
                    width: isMobile ? 54 : 60, height: isMobile ? 54 : 60, borderRadius: "50%",
                    background: on ? dv.accent : dv.accentSoft,
                    border: `1px solid ${on ? dv.accent : "transparent"}`,
                    display: "grid", placeItems: "center",
                    fontSize: isMobile ? 24 : 28, cursor: "pointer", padding: 0,
                    boxShadow: on ? "0 6px 18px rgba(212,116,45,0.35)" : "none",
                    transform: on ? "scale(1.04)" : "scale(1)",
                    transition: "all 0.2s ease",
                  }}>{r.emoji}</button>
                );
              })}
            </div>
            {ratingObj && (
              <div style={{ marginTop: 10, fontFamily: dv.sans, fontSize: 12, fontWeight: 600, color: dv.accent }}>{ratingObj.label}</div>
            )}
          </div>

          {/* What went well? — checkbox chips */}
          <div style={{ marginBottom: 30 }}>
            <h3 style={{ margin: "0 0 14px", fontFamily: dv.sans, fontSize: 16, fontWeight: 700, color: dv.ink }}>What went well?</h3>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10 }}>
              {CHIPS.map(c => {
                const on = chips.has(c);
                return (
                  <button key={c} onClick={() => toggleChip(c)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 100,
                    border: `1px solid ${on ? dv.accent : dv.cream}`,
                    background: dv.bone,
                    cursor: "pointer", textAlign: "left", transition: "all 0.18s",
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      background: on ? dv.accent : "transparent",
                      border: `1px solid ${on ? dv.accent : dv.cream}`,
                      display: "grid", placeItems: "center",
                    }}>
                      {on && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </span>
                    <span style={{ fontFamily: dv.sans, fontSize: 13, fontWeight: 500, color: dv.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional comments */}
          <div style={{ marginBottom: 26 }}>
            <h3 style={{ margin: "0 0 12px", fontFamily: dv.sans, fontSize: 16, fontWeight: 700, color: dv.ink }}>Additional comments {type !== "Bug report" ? <span style={{ fontWeight: 400, color: dv.stone }}>(optional)</span> : null}</h3>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={active.ph}
              rows={6}
              style={{ width: "100%", boxSizing: "border-box", background: dv.paper, border: `1px solid ${dv.cream}`, borderRadius: 14, color: dv.ink, fontFamily: dv.sans, fontSize: 15, lineHeight: 1.55, padding: "16px 18px", outline: "none", resize: "vertical", minHeight: 140 }}
            />
          </div>

          {error && <div style={{ marginBottom: 12, fontFamily: dv.sans, fontSize: 13, color: "#C8553D" }}>{error}</div>}

          <button onClick={submit} disabled={sending} style={{
            width: "100%", padding: "16px 0", borderRadius: 16, border: "none",
            background: dv.accent, color: "#fff",
            fontFamily: dv.sans, fontSize: 16, fontWeight: 700, letterSpacing: "0.01em",
            cursor: sending ? "default" : "pointer", opacity: sending ? 0.7 : 1,
            boxShadow: "0 10px 24px rgba(212,116,45,0.28)",
            transition: "opacity 0.2s",
          }}>{sending ? "Sending…" : "Submit feedback"}</button>

          <div style={{ marginTop: 14, textAlign: "center", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", color: dv.stone }}>
            {user?.email ? `Sending as ${user.email}` : "We may follow up by email"}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "44px 20px" }}>
          <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 30 : 36, fontWeight: 600, color: dv.ink, marginBottom: 12 }}>Thank you — we hear you.</div>
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 16, color: dv.taupe, lineHeight: 1.55, maxWidth: 440, margin: "0 auto 26px" }}>Your note is in front of us. This is genuinely how Continuum gets better.</p>
          <button onClick={reset} style={{ padding: "12px 28px", borderRadius: 12, border: `1px solid ${dv.cream}`, background: "transparent", color: dv.ink, fontFamily: dv.sans, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Send another</button>
        </div>
      )}
    </div>
  );
}
