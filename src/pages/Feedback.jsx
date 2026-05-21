import { useState } from "react";
import { apiFetch } from "../utils/apiBase";

// Full editorial "be heard" page — a destination in the bottom nav. Covers
// feature ideas, general feedback, and bug reports via one type selector.
// Submissions go to the owner (DB + email), never shown to other users.
export default function FeedbackPage({ css, isMobile, darkMode, user }) {
  const D = !!darkMode;
  const dv = {
    bone: D ? "#1a1a1a" : "#F4F1EC", paper: D ? "#262320" : "#EFEAE1",
    ink: D ? "#f0ece6" : "#15130F", taupe: D ? "#9a948a" : "#6B6458",
    stone: D ? "#8a8a8a" : "#857A66", cream: D ? "rgba(255,255,255,0.10)" : "#DAD3C5",
    accent: css?.accent || "#D4742D",
    serif: "'Fraunces', Georgia, serif", sans: "'Inter Tight', sans-serif", mono: "'JetBrains Mono', monospace",
  };

  const TYPES = [
    { id: "Feature request", label: "Feature idea", blurb: "Something you'd love Continuum to do.", ph: "I'd love to see…" },
    { id: "Feedback", label: "Feedback", blurb: "Tell us what's working — or what isn't.", ph: "What's on your mind about Continuum…" },
    { id: "Bug report", label: "Bug", blurb: "Something not behaving the way it should?", ph: "What happened, and where in the app…" },
  ];
  const [type, setType] = useState("Feature request");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const active = TYPES.find(t => t.id === type) || TYPES[0];

  const submit = async () => {
    if (!message.trim()) { setError("Add a few words first."); return; }
    setSending(true); setError("");
    try {
      const resp = await apiFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id || null, email: user?.email || null, category: type, message: message.trim() }),
      });
      if (!resp.ok) throw new Error("failed");
      setDone(true);
    } catch {
      setError("Couldn't send — please try again.");
    }
    setSending(false);
  };

  return (
    <div style={{ fontFamily: dv.sans, color: dv.ink, maxWidth: 640, margin: "0 auto", padding: isMobile ? "6px 2px 48px" : "12px 0 64px" }}>
      {/* Hero — matches the editorial flow of the other pages */}
      <div style={{ marginBottom: 28, paddingBottom: 22, borderBottom: `1px solid ${dv.cream}` }}>
        <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: dv.accent, marginBottom: 12 }}>Help shape Continuum</div>
        <h1 style={{ margin: 0, fontFamily: dv.serif, fontSize: isMobile ? 30 : 38, fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.02em", color: dv.ink }}>Built with travelers like you.</h1>
        <p style={{ margin: "14px 0 0", fontFamily: dv.serif, fontStyle: "italic", fontSize: isMobile ? 15 : 17, lineHeight: 1.5, color: dv.taupe, maxWidth: 520 }}>
          Continuum gets better because of the people who use it. Suggest a feature, share what you think, or flag something off — we read every note, and it shapes what we build next.
        </p>
      </div>

      {!done ? (
        <>
          {/* Type selector — feature idea / feedback / bug */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {TYPES.map(t => {
              const on = t.id === type;
              return (
                <button key={t.id} onClick={() => { setType(t.id); setError(""); }} style={{
                  padding: "9px 16px", borderRadius: 999,
                  border: `1px solid ${on ? dv.accent : dv.cream}`,
                  background: on ? dv.accent : "transparent",
                  color: on ? "#fff" : dv.taupe,
                  fontFamily: dv.sans, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}>{t.label}</button>
              );
            })}
          </div>
          <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, color: dv.stone, marginBottom: 14 }}>{active.blurb}</div>

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={active.ph}
            rows={7}
            style={{ width: "100%", boxSizing: "border-box", background: dv.paper, border: `1px solid ${dv.cream}`, borderRadius: 14, color: dv.ink, fontFamily: dv.sans, fontSize: 15, lineHeight: 1.55, padding: "16px 18px", outline: "none", resize: "vertical", minHeight: 150 }}
          />

          {error && <div style={{ marginTop: 12, fontFamily: dv.sans, fontSize: 13, color: "#C8553D" }}>{error}</div>}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, gap: 14, flexWrap: "wrap" }}>
            <div style={{ fontFamily: dv.mono, fontSize: 11, color: dv.stone, letterSpacing: "0.04em" }}>{user?.email ? `Sending as ${user.email}` : "We may follow up by email"}</div>
            <button onClick={submit} disabled={sending} style={{ padding: "13px 32px", borderRadius: 12, border: "none", background: dv.accent, color: "#fff", fontFamily: dv.sans, fontSize: 15, fontWeight: 600, cursor: sending ? "default" : "pointer", opacity: sending ? 0.7 : 1, transition: "opacity 0.2s" }}>{sending ? "Sending…" : "Send"}</button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "44px 20px" }}>
          <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 30 : 36, fontWeight: 600, color: dv.ink, marginBottom: 12 }}>Thank you — we hear you.</div>
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 16, color: dv.taupe, lineHeight: 1.55, maxWidth: 440, margin: "0 auto 26px" }}>Your note is in front of us. This is genuinely how Continuum gets better.</p>
          <button onClick={() => { setDone(false); setMessage(""); setType("Feature request"); setError(""); }} style={{ padding: "12px 28px", borderRadius: 12, border: `1px solid ${dv.cream}`, background: "transparent", color: dv.ink, fontFamily: dv.sans, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Send another</button>
        </div>
      )}
    </div>
  );
}
