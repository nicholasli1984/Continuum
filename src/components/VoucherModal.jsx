import React, { useState } from "react";

const VOUCHER_KINDS = [
  { id: "companion_voucher", label: "Companion voucher" },
  { id: "free_night", label: "Free night award" },
  { id: "upgrade_voucher", label: "Upgrade voucher" },
  { id: "travel_credit", label: "Travel credit" },
  { id: "other", label: "Other" },
];

export default function VoucherModal({ css, initial, linkedCards = [], hotelPrograms = [], onClose, onSave, onDelete }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() => ({
    id: initial?.id || null,
    kind: initial?.kind || "companion_voucher",
    title: initial?.title || "",
    source_card_id: initial?.source_card_id || "",
    source_program_id: initial?.source_program_id || "",
    source_benefit_id: initial?.source_benefit_id || null,
    issued_date: initial?.issued_date || "",
    expiry_date: initial?.expiry_date || "",
    value_estimate: initial?.value_estimate ?? "",
    notes: initial?.notes || "",
    status: initial?.status || "active",
  }));
  const isPrefilled = Boolean(initial && !initial.id && initial.source_card_id);
  const [saving, setSaving] = useState(false);

  const set = (patch) => setForm(f => ({ ...f, ...patch }));

  const canSave = form.title.trim().length > 0 && form.expiry_date;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const inputStyle = {
    display: "block", width: "100%", padding: "10px 12px",
    background: css.surface2, border: `1px solid ${css.border}`,
    borderRadius: 8, color: css.text, fontSize: 13,
    fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block", fontSize: 11, fontWeight: 600,
    color: css.text3, textTransform: "uppercase", letterSpacing: "0.08em",
    fontFamily: "'JetBrains Mono', monospace", marginBottom: 6,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: css.surface, border: `1px solid ${css.border}`, borderRadius: 12,
        padding: 24, width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{
            fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 400,
            letterSpacing: "-0.01em", color: css.text, margin: 0,
          }}>
            {isEdit ? "Edit voucher" : isPrefilled ? "Activate voucher" : "Add voucher"}
          </h3>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: css.text3,
            fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1,
          }}>×</button>
        </div>

        {isPrefilled && (
          <div style={{
            padding: "10px 12px", marginBottom: 14, borderRadius: 8,
            background: css.accentBg || "rgba(14,165,160,0.06)",
            border: `1px solid ${css.accentBorder || "rgba(14,165,160,0.2)"}`,
            fontFamily: "'Fraunces', serif", fontStyle: "italic",
            fontSize: 12, color: css.text2, lineHeight: 1.4,
          }}>
            Auto-filled from your linked card. Just set the expiry date and save.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={form.kind} onChange={e => set({ kind: e.target.value })} style={inputStyle}>
              {VOUCHER_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Title</label>
            <input value={form.title} onChange={e => set({ title: e.target.value })}
              placeholder="e.g. BA Premium Companion Voucher"
              style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Source card (optional)</label>
            <select value={form.source_card_id} onChange={e => set({ source_card_id: e.target.value })} style={inputStyle}>
              <option value="">— None —</option>
              {linkedCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Source hotel program (optional)</label>
            <select value={form.source_program_id} onChange={e => set({ source_program_id: e.target.value })} style={inputStyle}>
              <option value="">— None —</option>
              {hotelPrograms.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Issued date</label>
              <input type="date" value={form.issued_date || ""} onChange={e => set({ issued_date: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Expiry date *</label>
              <input type="date" value={form.expiry_date || ""} onChange={e => set({ expiry_date: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Estimated value (optional)</label>
            <input type="number" min="0" step="any" value={form.value_estimate}
              onChange={e => set({ value_estimate: e.target.value })}
              placeholder="USD value if redeemed"
              style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea value={form.notes} onChange={e => set({ notes: e.target.value })}
              placeholder="Restrictions, route, blackout dates…"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", minHeight: 60, fontFamily: "Inter, sans-serif" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {isEdit && (
              <button onClick={() => onDelete(form.id)} style={{
                background: "transparent", border: "none",
                color: css.text3, fontSize: 11, cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em",
                textTransform: "uppercase", padding: "8px 0",
              }}>Delete</button>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{
              padding: "10px 18px", borderRadius: 8, border: `1px solid ${css.border}`,
              background: "transparent", color: css.text2, cursor: "pointer",
              fontSize: 12, fontWeight: 600, fontFamily: "'Inter Tight', Inter, sans-serif",
              letterSpacing: "0.04em",
            }}>Cancel</button>
            <button onClick={handleSave} disabled={!canSave || saving} style={{
              padding: "10px 22px", borderRadius: 8, border: "none",
              background: canSave ? css.accent : css.surface2,
              color: canSave ? "#fff" : css.text3,
              cursor: canSave ? "pointer" : "not-allowed",
              fontSize: 12, fontWeight: 700, fontFamily: "'Inter Tight', Inter, sans-serif",
              letterSpacing: "0.04em", opacity: saving ? 0.7 : 1,
            }}>{saving ? "Saving…" : isEdit ? "Save changes" : "Add voucher"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
