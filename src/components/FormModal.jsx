import React, { useEffect } from "react";

// Shared "premium" modal chrome for all add/edit popups (Create Trip, Add
// Segment, Paste Itinerary, etc.). The colour scheme is intentionally INVERTED
// from the rest of the app — dark modal on light app, light modal on dark app
// — so the modal pops as a focal surface rather than disappearing into the
// page chrome.
//
// API:
//   <FormModal
//     open onClose darkMode isMobile
//     eyebrow="Trip"           // small caps text above title
//     title="Create trip"
//     subtitle="Plan your next adventure."
//     accentColor="#B8924A"    // optional, default = the app accent (orange)
//     primaryAction={{ label, onClick, disabled, loading }}
//     secondaryAction={{ label: "Cancel", onClick }}
//     error="..."
//   >
//     <FormRow label="Trip name"><input .../></FormRow>
//   </FormModal>
//
// Use <FormRow> for label/input layouts inside. Use <FormGrid> for two-column
// layouts (e.g. start date + end date side-by-side on desktop, stacked on mobile).

export function FormModal({
  open,
  onClose,
  darkMode,
  isMobile,
  eyebrow,
  title,
  subtitle,
  accentColor,
  primaryAction,
  secondaryAction,
  error,
  zIndex = 9000,
  children,
}) {
  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  // Inverted theme — dark modal on light app, light modal on dark app.
  const inv = !darkMode;
  const T = inv
    ? {
        // dark modal (on light app)
        bg: "#0f0f0f",
        bgRaised: "#1a1a1a",
        text: "#f4f1ec",
        textDim: "rgba(244,241,236,0.62)",
        textFaint: "rgba(244,241,236,0.40)",
        border: "rgba(255,255,255,0.10)",
        borderStrong: "rgba(255,255,255,0.18)",
        inputBg: "#171717",
        inputBorder: "rgba(255,255,255,0.10)",
        inputFocus: "rgba(255,255,255,0.30)",
        primaryBg: "#f4f1ec",
        primaryText: "#0f0f0f",
        primaryDisabledBg: "rgba(255,255,255,0.10)",
        primaryDisabledText: "rgba(244,241,236,0.40)",
        secondaryBorder: "rgba(255,255,255,0.18)",
        secondaryText: "#f4f1ec",
      }
    : {
        // light modal (on dark app)
        bg: "#fbfaf6",
        bgRaised: "#fff",
        text: "#15130F",
        textDim: "rgba(21,19,15,0.62)",
        textFaint: "rgba(21,19,15,0.42)",
        border: "rgba(0,0,0,0.08)",
        borderStrong: "rgba(0,0,0,0.18)",
        inputBg: "#fff",
        inputBorder: "rgba(0,0,0,0.10)",
        inputFocus: "rgba(0,0,0,0.30)",
        primaryBg: "#15130F",
        primaryText: "#fbfaf6",
        primaryDisabledBg: "rgba(0,0,0,0.08)",
        primaryDisabledText: "rgba(21,19,15,0.40)",
        secondaryBorder: "rgba(0,0,0,0.18)",
        secondaryText: "#15130F",
      };

  const accent = accentColor || "#B8924A";

  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex,
        background: "rgba(0,0,0,0.62)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 24,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: isMobile ? "92vh" : "88vh",
          background: T.bg,
          color: T.text,
          borderRadius: isMobile ? "20px 20px 0 0" : 20,
          border: `1px solid ${T.border}`,
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}>

        {/* Header band — eyebrow + close. Subtle gradient gives the "premium"
            feel without needing a sourced hero image. */}
        <div style={{
          padding: isMobile ? "18px 22px 0" : "22px 28px 0",
          position: "relative",
          background: `linear-gradient(180deg, ${accent}1a 0%, transparent 100%)`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              {eyebrow && (
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
                  color: accent,
                  marginBottom: 8,
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ width: 18, height: 1, background: accent, opacity: 0.6 }} />
                  {eyebrow}
                </div>
              )}
              <h2 style={{
                fontFamily: "'Fraunces', serif",
                fontSize: isMobile ? 24 : 30, fontWeight: 500,
                letterSpacing: "-0.02em", lineHeight: 1.1,
                margin: 0, color: T.text,
              }}>{title}</h2>
              {subtitle && (
                <p style={{
                  fontFamily: "'Fraunces', serif", fontStyle: "italic",
                  fontSize: isMobile ? 13 : 14,
                  color: T.textDim,
                  margin: "8px 0 0", lineHeight: 1.4,
                }}>{subtitle}</p>
              )}
            </div>
            <button onClick={onClose} aria-label="Close"
              style={{
                width: 34, height: 34, flexShrink: 0,
                border: `1px solid ${T.border}`,
                background: "transparent",
                color: T.textDim,
                borderRadius: 10, cursor: "pointer",
                display: "grid", placeItems: "center",
                transition: "all 0.18s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body. The form-modal theme is provided via CSS variables
            so children can style themselves with --fm-input-bg etc. */}
        <div
          className={inv ? "fm-theme fm-theme-dark" : "fm-theme fm-theme-light"}
          style={{
            "--fm-text": T.text,
            "--fm-text-dim": T.textDim,
            "--fm-text-faint": T.textFaint,
            "--fm-border": T.border,
            "--fm-border-strong": T.borderStrong,
            "--fm-input-bg": T.inputBg,
            "--fm-input-border": T.inputBorder,
            "--fm-input-focus": T.inputFocus,
            "--fm-bg-raised": T.bgRaised,
            "--fm-accent": accent,
            flex: 1, minHeight: 0, overflowY: "auto",
            padding: isMobile ? "20px 22px 8px" : "24px 28px 8px",
          }}>
          {children}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            margin: isMobile ? "0 22px 12px" : "0 28px 12px",
            padding: "10px 14px",
            background: "rgba(200,85,61,0.10)",
            border: `1px solid ${accent}`,
            color: accent,
            borderRadius: 10,
            fontFamily: "'Inter Tight', sans-serif", fontSize: 13, lineHeight: 1.4,
          }}>{error}</div>
        )}

        {/* Inputs and labels inside the modal — these `!important` rules let us
            adopt the inverted theme without editing the hundreds of inline
            styles inside each big modal form (Add Segment etc.). */}
        <style>{`
          .fm-theme input:not([type="button"]):not([type="submit"]),
          .fm-theme select,
          .fm-theme textarea {
            background-color: var(--fm-input-bg) !important;
            border-color: var(--fm-input-border) !important;
            color: var(--fm-text) !important;
            color-scheme: ${inv ? "dark" : "light"};
          }
          .fm-theme input::placeholder,
          .fm-theme textarea::placeholder {
            color: var(--fm-text-faint) !important;
          }
          .fm-theme input:focus,
          .fm-theme select:focus,
          .fm-theme textarea:focus {
            border-color: var(--fm-input-focus) !important;
          }
          .fm-theme label {
            color: var(--fm-text-dim) !important;
          }
        `}</style>

        {/* Footer actions */}
        {(primaryAction || secondaryAction) && (
          <div style={{
            padding: isMobile ? "14px 22px calc(14px + env(safe-area-inset-bottom))" : "18px 28px 22px",
            borderTop: `1px solid ${T.border}`,
            display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap",
          }}>
            {secondaryAction && (
              <button onClick={secondaryAction.onClick}
                style={{
                  padding: "11px 22px",
                  border: `1px solid ${T.secondaryBorder}`,
                  background: "transparent",
                  color: T.secondaryText,
                  borderRadius: 10, cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
                  transition: "all 0.18s",
                }}>{secondaryAction.label || "Cancel"}</button>
            )}
            {primaryAction && (
              <button onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
                style={{
                  padding: "11px 24px",
                  border: "none",
                  background: (primaryAction.disabled || primaryAction.loading) ? T.primaryDisabledBg : T.primaryBg,
                  color: (primaryAction.disabled || primaryAction.loading) ? T.primaryDisabledText : T.primaryText,
                  borderRadius: 10,
                  cursor: (primaryAction.disabled || primaryAction.loading) ? "default" : "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600,
                  transition: "all 0.18s",
                }}>{primaryAction.loading ? "Saving…" : primaryAction.label}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Single field row — label-left / input-right on desktop, stacked on mobile.
export function FormRow({ label, hint, children, isMobile }) {
  return (
    <div style={{
      padding: "16px 0",
      borderBottom: "1px solid var(--fm-border)",
      display: isMobile ? "block" : "grid",
      gridTemplateColumns: isMobile ? undefined : "140px 1fr",
      gap: isMobile ? 8 : 16,
      alignItems: "flex-start",
    }}>
      <div style={{ paddingTop: isMobile ? 0 : 10 }}>
        <label style={{
          fontFamily: "'Inter Tight', sans-serif",
          fontSize: 13, fontWeight: 500,
          color: "var(--fm-text)",
          display: "block",
        }}>{label}</label>
        {hint && (
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: "var(--fm-text-faint)",
            marginTop: 4, lineHeight: 1.4,
          }}>{hint}</div>
        )}
      </div>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

// Two-column grid for fields that naturally pair (Start/End dates etc.).
export function FormGrid({ children, isMobile, columns = 2 }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : `repeat(${columns}, 1fr)`,
      gap: 10,
    }}>{children}</div>
  );
}

// Shared input style so all fields look identical regardless of modal.
export const fmInputStyle = ({ darkMode } = {}) => ({
  width: "100%", boxSizing: "border-box",
  padding: "11px 14px",
  background: "var(--fm-input-bg)",
  border: "1px solid var(--fm-input-border)",
  borderRadius: 10,
  color: "var(--fm-text)",
  fontFamily: "'Inter Tight', sans-serif",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.15s",
  // Date/time picker chrome inversion — without color-scheme, native pickers
  // render with the OS theme which clashes with the inverted modal surface.
  colorScheme: darkMode ? "light" : "dark",
});

// Pill-style segmented control (for things like Status: Planned / Confirmed / Wishlist).
export function FormPillGroup({ value, onChange, options }) {
  return (
    <div style={{
      display: "inline-flex", padding: 4,
      background: "var(--fm-input-bg)",
      border: "1px solid var(--fm-input-border)",
      borderRadius: 100,
      gap: 2,
    }}>
      {options.map(([val, label]) => {
        const on = value === val;
        return (
          <button key={val} onClick={() => onChange(val)} type="button"
            style={{
              padding: "7px 16px",
              border: "none",
              background: on ? "var(--fm-accent)" : "transparent",
              color: on ? "#fff" : "var(--fm-text-dim)",
              borderRadius: 100,
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600,
              transition: "all 0.18s",
            }}>{label}</button>
        );
      })}
    </div>
  );
}
