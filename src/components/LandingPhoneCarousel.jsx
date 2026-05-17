import React, { useState, useEffect, useCallback, useRef } from "react";

// 3D perspective phone carousel for the landing page.
// Center frame is sharp + full-size; immediate neighbors are scaled down,
// blurred, and slightly rotated for depth. Auto-advances every 4s.
//
// The phone auto-fits its container via ResizeObserver so the landing page
// can never scroll — width is the smallest of (caller's cap, what fits in
// the container's height, what leaves room for the two side neighbors).

const ASPECT = 2048 / 945; // iPhone screenshot aspect ratio (h / w)

export default function LandingPhoneCarousel({
  images,
  maxPhoneWidth,
  intervalMs = 4000,
  accent = "#E1E0CC",
}) {
  const [currentIndex, setCurrentIndex] = useState(Math.floor(images.length / 2));
  const wrapRef = useRef(null);
  const [phoneWidth, setPhoneWidth] = useState(maxPhoneWidth);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const t = setInterval(handleNext, intervalMs);
    return () => clearInterval(t);
  }, [handleNext, intervalMs]);

  // Measure available space and pick a phone width that always fits.
  // Neighbors sit at translateX(±55%) scaled to 0.82, so the visible row
  // is roughly width × (1 + 2 × 0.55 × 0.82) ≈ width × 1.9.
  useEffect(() => {
    if (!wrapRef.current) return;
    const fit = () => {
      const el = wrapRef.current;
      if (!el) return;
      const { width: availW, height: availH } = el.getBoundingClientRect();
      if (!availW || !availH) return;
      const wByHeight = availH / ASPECT;
      const wByWidth  = availW / 1.9;
      const next = Math.max(80, Math.floor(Math.min(maxPhoneWidth, wByHeight, wByWidth)));
      setPhoneWidth(next);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [maxPhoneWidth]);

  const phoneH = phoneWidth * ASPECT;

  const navBtn = (side) => ({
    position: "absolute",
    top: "50%",
    [side]: 12,
    transform: "translateY(-50%)",
    width: 40, height: 40,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(225,224,204,0.2)",
    color: accent,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    transition: "background 0.2s, border-color 0.2s",
  });

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1000px",
      }}
    >
      {images.map((image, index) => {
        const total = images.length;
        let pos = ((index - currentIndex) + total) % total;
        if (pos > Math.floor(total / 2)) pos = pos - total;

        const isCenter = pos === 0;
        const isAdjacent = Math.abs(pos) === 1;
        const visible = Math.abs(pos) <= 1;

        return (
          <div
            key={index}
            aria-hidden={!isCenter}
            style={{
              position: "absolute",
              width: phoneWidth,
              height: phoneH,
              transform: `translateX(${pos * 55}%) scale(${isCenter ? 1 : isAdjacent ? 0.82 : 0.7}) rotateY(${pos * -10}deg)`,
              zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
              opacity: isCenter ? 1 : isAdjacent ? 0.45 : 0,
              filter: isCenter ? "blur(0px)" : "blur(3px)",
              visibility: visible ? "visible" : "hidden",
              transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease, filter 0.4s ease",
              background: "#000",
              borderRadius: 40,
              padding: 6,
              boxShadow: isCenter
                ? "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(225,224,204,0.16)"
                : "0 18px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(225,224,204,0.08)",
              willChange: "transform, opacity, filter",
            }}
          >
            <img
              src={image.src}
              alt={image.alt || ""}
              draggable={false}
              loading={isCenter || isAdjacent ? "eager" : "lazy"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top center",
                borderRadius: 34,
                background: "#1a1a1a",
                display: "block",
                pointerEvents: "none",
              }}
            />
          </div>
        );
      })}

      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous screen"
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.6)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.4)"; }}
        style={navBtn("left")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={handleNext}
        aria-label="Next screen"
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.6)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.4)"; }}
        style={navBtn("right")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  );
}
