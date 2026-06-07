import React from "react";
import { airlineDeepLink } from "../constants/airlineDeepLinks";

// One-tap button that takes the user from a Continuum flight card into the
// airline's own "Manage Booking" page or app, with PNR + last name pre-filled
// when we know the airline's URL shape. Once the booking lands in the airline's
// app, the airline's native notifications take over — gate changes, boarding,
// delays — and Continuum is free of the maintenance burden of running its own
// flight-tracking pipeline.
//
// Renders nothing when the carrier is unknown to airlineDeepLinks.js (so we
// don't show a button that 404s).
//
// Two visual variants:
//   "primary"  — full-width pill, used on the Dashboard's main flight card
//   "inline"   — compact text+arrow link, used in segment detail rows
export default function TrackInAirlineButton({
  flightNumber,
  pnr,
  lastName,
  variant = "primary",
  theme,            // { ink, taupe, cream, paper, accent } — pulled from Dashboard's dv
  onMissingPnr,     // optional callback the parent can use to surface "add a PNR" UX
}) {
  const link = airlineDeepLink({ flightNumber, pnr, lastName });
  if (!link) return null;

  // For airlines where we know the URL prefills both fields, surface a clear
  // "Track in X" CTA. For airlines where we only have the generic landing page,
  // soften the copy ("Open X to add booking") so the user knows they'll be
  // typing the PNR themselves.
  const prefilled = link.confidence === "high" || link.confidence === "medium";
  const label = prefilled ? `Track in ${link.name} app` : `Open ${link.name}`;

  const handleClick = (e) => {
    e.stopPropagation();
    if (!pnr && onMissingPnr) {
      onMissingPnr();
      return;
    }
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  const t = theme || {};
  const ink = t.ink || "#15130F";
  const taupe = t.taupe || "#6B6458";
  const cream = t.cream || "#E2DCCE";
  const accent = t.accent || "#C97B4D";

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="track-airline-btn-inline"
        title={pnr ? link.url : `Add a confirmation code to ${flightNumber} to pre-fill`}
      >
        {label}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
        <style>{`
          .track-airline-btn-inline {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: transparent;
            border: none;
            padding: 4px 0;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: ${accent};
            cursor: pointer;
            transition: gap 0.2s ease;
          }
          .track-airline-btn-inline:hover { gap: 9px; }
        `}</style>
      </button>
    );
  }

  // Primary variant — sits inside the flight card, full-width pill.
  return (
    <button
      type="button"
      onClick={handleClick}
      className="track-airline-btn-primary"
      title={pnr ? link.url : `Add a confirmation code to ${flightNumber} to pre-fill`}
    >
      <span className="track-airline-btn-primary__label">{label}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
      <style>{`
        .track-airline-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 12px 16px;
          background: ${ink};
          color: #FBF8F3;
          border: 1px solid ${ink};
          border-radius: 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }
        .track-airline-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
          background: ${accent};
          border-color: ${accent};
        }
        .track-airline-btn-primary__label {
          font-weight: 500;
        }
      `}</style>
    </button>
  );
}
