import React from "react";

// Small mono pill that flags an expense as already submitted in a report.
// Multiple reports → red/warning state (likely a duplicate submission).
// Click → opens the first report; on multi-report rows, hover-tooltip lists them.
// Renders nothing if the expense isn't in any report.
export default function ReportedBadge({ reports, onOpen, compact = false }) {
  if (!Array.isArray(reports) || reports.length === 0) return null;
  const isDuplicate = reports.length > 1;
  const primary = reports[0];
  const accent = isDuplicate ? "#C8553D" : "#0EA5A0";
  const wash = isDuplicate ? "rgba(200,85,61,0.10)" : "rgba(14,165,160,0.10)";
  const border = isDuplicate ? "rgba(200,85,61,0.4)" : "rgba(14,165,160,0.40)";
  const label = isDuplicate
    ? `Reported · ${reports.length}×`
    : (compact ? "Reported" : `Reported · ${primary.title || "Expense report"}`);
  const tooltip = isDuplicate
    ? `In multiple reports — possible duplicate submission:\n${reports.map(r => `• ${r.title || "Untitled"}`).join("\n")}\n\nClick to open the first one.`
    : `Click to view "${primary.title || "Expense report"}"`;
  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof onOpen === "function" && primary?.id) onOpen(primary.id);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      title={tooltip}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        borderRadius: 4,
        border: `1px solid ${border}`,
        background: wash,
        color: accent,
        fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
        whiteSpace: "nowrap",
        maxWidth: compact ? 110 : 220,
        overflow: "hidden",
        textOverflow: "ellipsis",
        lineHeight: 1.3,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0 }} />
      {label}
    </button>
  );
}
