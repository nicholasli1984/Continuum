import React, { useState, useRef } from "react";
import { parseAttachmentFile, SEGMENT_TYPE_OPTIONS } from "../utils/parseAttachment";

// Drop a PDF or image onto this zone, pick the booking type, get the file
// parsed via Claude Vision, then receive the parsed segment(s) via the
// `onParsed({ segments, segmentType, confirmationCode, passengerName })`
// callback. Designed to wrap the trip-detail "+ Add" button.
//
// Click the main button → opens the existing manual add-segment modal via
// `onClickManualAdd()`. Drag-and-drop OR the small "upload" link triggers
// the file-parse flow.

export default function SegmentDropZone({ ev, css, isMobile, onParsed, onClickManualAdd }) {
  const [hover, setHover] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const accent = ev?.accent || css?.accent || "#C8553D";
  const ink = ev?.ink || css?.text || "#15130F";
  const taupe = ev?.taupe || css?.text3 || "#857A66";
  const cream = ev?.cream || css?.border || "#E2DCCE";
  const stone = ev?.stone || "#857A66";
  const bone = ev?.bone || css?.bg || "#F4F1EC";
  const monoFont = ev?.mono || "'JetBrains Mono', monospace";
  const serifFont = ev?.serif || "'Fraunces', serif";
  const accentWash = ev?.accentWash || `${accent}10`;

  const onDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setHover(true); };
  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setHover(true); };
  const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setHover(false); };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setHover(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    setPendingFile(file); setError("");
  };
  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) { setPendingFile(file); setError(""); }
    e.target.value = "";
  };

  const runParse = async (segmentType) => {
    if (!pendingFile) return;
    setParsing(true); setError("");
    try {
      const result = await parseAttachmentFile(pendingFile, segmentType);
      onParsed?.(result);
      setPendingFile(null);
    } catch (err) {
      setError(err.message || "Couldn't parse the file. Try a different one.");
    } finally {
      setParsing(false);
    }
  };

  return (
    <>
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClickManualAdd}
        style={{
          width: "100%", padding: "20px", background: hover ? accentWash : "transparent",
          border: `1px dashed ${hover ? accent : stone}`,
          color: accent, fontFamily: monoFont, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
          cursor: "pointer", marginBottom: 32, transition: "all 0.2s",
          textAlign: "center",
        }}
        onMouseEnter={e => { if (!hover) { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = accentWash; } }}
        onMouseLeave={e => { if (!hover) { e.currentTarget.style.borderColor = stone; e.currentTarget.style.background = "transparent"; } }}
      >
        + Add flight, hotel, meeting, or activity
        <div style={{
          fontSize: 9, marginTop: 6, color: taupe, letterSpacing: "0.08em",
          fontFamily: monoFont, textTransform: "none",
        }}>
          {hover ? (
            "Drop the file here to auto-fill"
          ) : (
            <>
              Click to fill manually · or drag a PDF / Word / image to auto-fill ·{" "}
              <span onClick={e => { e.stopPropagation(); inputRef.current?.click(); }} style={{
                color: accent, textDecoration: "underline", cursor: "pointer",
              }}>upload</span>
            </>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: "none" }}
        onChange={onFileInputChange}
      />

      {/* Type picker modal */}
      {pendingFile && (
        <div onClick={() => !parsing && setPendingFile(null)} style={{
          position: "fixed", inset: 0, background: "rgba(15,13,15,0.72)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: bone, border: `1px solid ${cream}`,
            padding: 28, width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto",
            boxShadow: "0 12px 36px rgba(15,13,15,0.35)",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 style={{
                fontFamily: serifFont, fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em",
                color: ink, margin: 0,
              }}>What is this booking?</h3>
              <button onClick={() => !parsing && setPendingFile(null)} disabled={parsing} style={{
                background: "transparent", border: "none", color: taupe,
                fontSize: 20, cursor: parsing ? "not-allowed" : "pointer", padding: 0, lineHeight: 1,
              }}>×</button>
            </div>
            <p style={{
              fontFamily: serifFont, fontStyle: "italic", color: taupe,
              fontSize: 13, lineHeight: 1.5, margin: "0 0 18px",
            }}>
              {parsing ? "Reading the file…" : `Pick the type and we'll auto-fill the form from "${pendingFile.name}".`}
            </p>

            {error && (
              <div style={{
                padding: "10px 14px", marginBottom: 14, background: "rgba(200,85,61,0.08)",
                border: "1px solid rgba(200,85,61,0.3)", color: "#C8553D",
                fontFamily: serifFont, fontStyle: "italic", fontSize: 12,
              }}>{error}</div>
            )}

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
              gap: 8, opacity: parsing ? 0.4 : 1, pointerEvents: parsing ? "none" : "auto",
            }}>
              {SEGMENT_TYPE_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => runParse(opt.id)} style={{
                  padding: "16px 12px", border: `1px solid ${cream}`, background: "transparent",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = `${accent}08`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = cream; e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                  <span style={{
                    fontFamily: monoFont, fontSize: 10, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: ink,
                  }}>{opt.label}</span>
                </button>
              ))}
            </div>

            {parsing && (
              <div style={{
                marginTop: 16, padding: "12px 14px", background: "rgba(255,255,255,0.04)",
                border: `1px solid ${cream}`,
                fontFamily: monoFont, fontSize: 11, letterSpacing: "0.06em", color: taupe,
                textAlign: "center",
              }}>
                Reading the file with AI… this can take a few seconds.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
