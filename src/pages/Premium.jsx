import React from "react";
export function renderPremium(s) {
  const { css, isMobile, darkMode } = s;
  const D = darkMode;
  return (
    <div>
      {/* Hero */}
      <div className="c-a1" style={{ textAlign: "center", marginBottom: 40, paddingTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <img src="/continuum-travel-logo.svg" alt="Continuum" style={{ height: 160, display: "block", filter: D ? "brightness(0.9) saturate(0.9)" : "brightness(0.6) sepia(1) hue-rotate(-15deg) saturate(2.5)" }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: css.gold, marginBottom: 10 }}>Unlock the Full Journey</div>
        <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 32 : 44, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Continuum Premium</h2>
        <p style={{ color: css.text2, fontSize: 15, marginTop: 10, lineHeight: 1.6 }}>Maximize every mile, every night, every point.</p>
      </div>

      {/* Pricing cards */}
      <div className="c-a2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 40 }}>
        {[
          {
            name: "Free", price: "$0", period: "forever",
            accent: css.text3, accentBg: css.surface2, border: css.border,
            features: ["3 linked programs", "Basic dashboard", "Manual trip entry", "Annual summary", "Community support"],
            cta: "Current Plan", ctaStyle: { background: css.surface2, color: css.text2, border: `1px solid ${css.border}` },
          },
          {
            name: "Premium", price: "$9.99", period: "/month", popular: true,
            accent: css.accent, accentBg: css.accentBg, border: css.accentBorder,
            features: ["Unlimited programs", "Trip Optimizer AI", "Status match alerts", "PDF reports & exports", "Card recommendations", "Mileage expiration alerts", "Flighty sync export", "Ad-free experience"],
            cta: "Upgrade Now", ctaStyle: { background: css.accent, color: "#fff", border: "none" },
          },
          {
            name: "Pro", price: "$24.99", period: "/month",
            accent: css.gold, accentBg: css.goldBg, border: `${css.gold}40`,
            features: ["Everything in Premium", "API access & integrations", "Multi-year status tracking", "Tax deduction reports", "Team/family accounts", "White-label option", "Dedicated account manager", "Custom analytics"],
            cta: "Upgrade Now", ctaStyle: { background: css.gold, color: "#1A1200", border: "none" },
          },
        ].map((plan, i) => (
          <div key={i} className="c-card" style={{
            background: css.surface, border: `1px solid ${plan.border}`,
            borderTop: plan.popular ? `3px solid ${plan.accent}` : `3px solid transparent`,
            borderRadius: 16, padding: 28, position: "relative",
            boxShadow: plan.popular ? (D ? "0 4px 24px rgba(212,116,45,0.15)" : "0 4px 24px rgba(212,116,45,0.12)") : (D ? "none" : "0 1px 4px rgba(26,21,18,0.05)"),
          }}>
            {plan.popular && (
              <div style={{
                position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
                background: plan.accent, color: "#fff", fontSize: 9, fontWeight: 700,
                padding: "3px 14px", borderRadius: "0 0 8px 8px", letterSpacing: "0.1em",
              }}>MOST POPULAR</div>
            )}
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: plan.accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>{plan.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
              <span style={{ fontSize: 38, fontWeight: 700, color: css.text, fontFamily: "'Instrument Sans', 'Outfit', sans-serif", lineHeight: 1 }}>{plan.price}</span>
              <span style={{ fontSize: 12, color: css.text3 }}>{plan.period}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
              {plan.features.map((f, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12, color: css.text2 }}>
                  <span style={{ color: plan.accent, fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button onClick={() => plan.cta !== "Current Plan" && setShowUpgrade(true)} style={{
              width: "100%", padding: "12px 0", borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: plan.cta === "Current Plan" ? "default" : "pointer",
              transition: "all 0.15s", ...plan.ctaStyle,
            }}>{plan.cta}</button>
          </div>
        ))}
      </div>

      {/* Feature highlights grid */}
      <div className="c-a3" style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 16, padding: "24px 22px" }}>
        <h3 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 24, fontWeight: 500, color: css.text, margin: "0 0 20px" }}>Why upgrade?</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {[
            { icon: "🧠", title: "AI Trip Optimizer", desc: "Credit every flight to the right program for maximum status acceleration" },
            { icon: "🔔", title: "Status Match Alerts", desc: "Get notified when airlines offer challenges that match your profile" },
            { icon: "📊", title: "Advanced Analytics", desc: "Multi-year tracking, spend analysis, and loyalty ROI reporting" },
            { icon: "💳", title: "Card Advisor", desc: "Personalized card recommendations based on your real travel patterns" },
            { icon: "📄", title: "Tax Reports", desc: "Export categorized travel expenses for business deductions" },
            { icon: "👨‍👩‍👧", title: "Family Accounts", desc: "Track the whole household and optimize your combined loyalty strategy" },
          ].map((f, i) => (
            <div key={i} style={{ padding: "16px 14px", borderRadius: 10, background: css.surface2, border: `1px solid ${css.border}` }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: css.text, marginBottom: 5 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: css.text2, lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

}
