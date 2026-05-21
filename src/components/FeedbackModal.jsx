import { useState, useEffect } from "react";
import { apiFetch } from "../utils/apiBase";

// Fire this from anywhere to open the modal (avoids prop-threading through the
// app). Both the Settings item and the Dashboard footer link call it.
export const openFeedback = () => window.dispatchEvent(new Event("continuum:open-feedback"));

// Private feature-suggestion modal. Submissions go to the owner (DB + email),
// never shown to other users — so it's not App Store UGC.
export default function FeedbackModal({ user, darkMode }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Feature request");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = () => { setOpen(true); setDone(false); setError(""); setMessage(""); setCategory("Feature request"); };
    window.addEventListener("continuum:open-feedback", handler);
    return () => window.removeEventListener("continuum:open-feedback", handler);
  }, []);

  if (!open) return null;
  const D = !!darkMode;
  const t = {
    bone: D ? "#1a1a1a" : "#F4F1EC",
    paper: D ? "#262320" : "#EBE6DD",
    ink: D ? "#f0ece6" : "#15130F",
    taupe: D ? "#9a948a" : "#6B6458",
    cream: D ? "rgba(255,255,255,0.10)" : "#DAD3C5",
    accent: "#D4742D",
    serif: "'Fraunces', Georgia, serif",
    sans: "'Inter Tight', sans-serif",
    mono: "'JetBrains Mono', monospace",
  };
  const close = () => setOpen(false);

  const submit = async () => {
    if (!message.trim()) { setError("Please write your suggestion first."); return; }
    setSending(true); setError("");
    try {
      const resp = await apiFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id || null, email: user?.email || null, category, message: message.trim() }),
      });
      if (!resp.ok) throw new Error("failed");
      setDone(true);
    } catch {
      setError("Couldn't send — please try again.");
    }
    setSending(false);
  };

  const lbl = { fontFamily: t.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: t.taupe, marginBottom: 6, display: "block" };
  const field = { width: "100%", boxSizing: "border-box", background: t.paper, border: `1px solid ${t.cream}`, borderRadius: 10, color: t.ink, fontFamily: t.sans, fontSize: 14, padding: "11px 13px", outline: "none" };

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 4000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: t.bone, border: `1px solid ${t.cream}`, borderRadius: 18, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
        {!done ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontFamily: t.serif, fontSize: 24, fontWeight: 600, color: t.ink, letterSpacing: "-0.01em" }}>Suggest a feature</h2>
              <button onClick={close} aria-label="Close" style={{ background: "transparent", border: "none", color: t.taupe, fontSize: 22, lineHeight: 1, cursor: "pointer", padding: 4 }}>×</button>
            </div>
            <p style={{ margin: "0 0 18px", fontFamily: t.sans, fontSize: 13, color: t.taupe, lineHeight: 1.5 }}>What would make Continuum more useful for you? We read every suggestion.</p>

            <label style={lbl}>Type</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...field, marginBottom: 14, appearance: "none", cursor: "pointer" }}>
              <option>Feature request</option>
              <option>Improvement</option>
              <option>Bug report</option>
              <option>Other</option>
            </select>

            <label style={lbl}>Your suggestion</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="I'd love to see…" style={{ ...field, resize: "vertical", minHeight: 110, lineHeight: 1.5 }} />

            {error && <div style={{ marginTop: 10, fontFamily: t.sans, fontSize: 12, color: "#C8553D" }}>{error}</div>}

            <button onClick={submit} disabled={sending} style={{ marginTop: 18, width: "100%", padding: "13px", borderRadius: 10, border: "none", background: t.accent, color: "#fff", fontFamily: t.sans, fontSize: 14, fontWeight: 600, cursor: sending ? "default" : "pointer", opacity: sending ? 0.7 : 1, transition: "opacity 0.2s" }}>{sending ? "Sending…" : "Send suggestion"}</button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "14px 6px 6px" }}>
            <div style={{ fontFamily: t.serif, fontSize: 26, fontWeight: 600, color: t.ink, marginBottom: 8 }}>Thank you</div>
            <p style={{ fontFamily: t.sans, fontSize: 14, color: t.taupe, lineHeight: 1.55, margin: "0 0 20px" }}>Your suggestion is in. We read every one — it genuinely shapes what we build next.</p>
            <button onClick={close} style={{ padding: "11px 26px", borderRadius: 10, border: `1px solid ${t.cream}`, background: "transparent", color: t.ink, fontFamily: t.sans, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
