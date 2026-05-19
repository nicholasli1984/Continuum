import React, { useRef, useState } from "react";

// Mouse-tracking radial-glow button. Adapted from a Tailwind+TS reference
// to match Continuum's inline-style editorial pattern. The glow follows the
// cursor inside the button on hover, fades out on leave.
export default function HoverGlowButton({
  children,
  onClick,
  disabled = false,
  glowColor = "#C8553D",
  backgroundColor = "#15130F",
  textColor = "#F4F1EC",
  hoverTextColor = "#F4F1EC",
  borderColor = null,
  style = {},
  title,
  active = false,
}) {
  const buttonRef = useRef(null);
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const onMove = (e) => {
    const r = buttonRef.current?.getBoundingClientRect();
    if (!r) return;
    setGlow({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "0 14px",
        height: 34,
        border: borderColor ? `1px solid ${borderColor}` : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        overflow: "hidden",
        backgroundColor,
        color: hovered ? hoverTextColor : textColor,
        opacity: disabled ? 0.5 : 1,
        transition: "color 0.3s, background 0.3s",
        ...style,
      }}
    >
      {/* Cursor-tracked radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          opacity: hovered ? 0.55 : 0,
          pointerEvents: "none",
          left: glow.x,
          top: glow.y,
          transform: `translate(-50%, -50%) scale(${hovered ? 1.2 : 0})`,
          background: `radial-gradient(circle, ${glowColor} 10%, transparent 70%)`,
          transition: "transform 0.4s ease-out, opacity 0.25s ease-out",
          zIndex: 0,
        }}
      />
      {/* Active-state dot indicator */}
      {active !== null && (
        <span aria-hidden="true" style={{
          position: "relative", zIndex: 1, width: 6, height: 6, borderRadius: "50%",
          background: active ? glowColor : "currentColor", opacity: active ? 1 : 0.4,
        }} />
      )}
      <span style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
        {children}
      </span>
    </button>
  );
}
