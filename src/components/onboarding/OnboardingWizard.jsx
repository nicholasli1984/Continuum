import React, { useEffect, useMemo, useState } from "react";

const FONTS = {
  serif: "'Fraunces', 'Instrument Serif', Georgia, serif",
  sans: "'Inter Tight', 'Instrument Sans', sans-serif",
  mono: "'JetBrains Mono', 'Geist Mono', monospace",
};

const COUNTRIES = [
  ["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"], ["AU", "Australia"],
  ["NZ", "New Zealand"], ["IE", "Ireland"], ["DE", "Germany"], ["FR", "France"],
  ["NL", "Netherlands"], ["IT", "Italy"], ["ES", "Spain"], ["PT", "Portugal"],
  ["CH", "Switzerland"], ["JP", "Japan"], ["KR", "South Korea"], ["SG", "Singapore"],
  ["HK", "Hong Kong SAR"], ["TW", "Taiwan"], ["IN", "India"], ["AE", "UAE"],
  ["IL", "Israel"], ["BR", "Brazil"], ["MX", "Mexico"], ["BM", "Bermuda"],
  ["TT", "Trinidad & Tobago"], ["JM", "Jamaica"], ["BB", "Barbados"], ["ZA", "South Africa"],
];

const CURRENCIES = ["USD", "CAD", "GBP", "EUR", "AUD", "JPY", "SGD", "HKD"];

// Programs/cards we surface first — the high-volume ones a US/Bermuda traveler
// is most likely to hold. The full list is still browsable in Programs.
const POPULAR_AIRLINES = ["aa", "united", "delta", "alaska", "jetblue", "ba", "ana", "jal", "cathay", "lufthansa", "airfrance", "qatar", "emirates", "singapore"];
const POPULAR_HOTELS = ["marriott", "hilton", "hyatt", "ihg", "accor", "wyndham"];
const POPULAR_CARDS = ["amex_plat", "amex_gold", "chase_sapphire", "chase_sapphire_pref", "cap1_venturex", "citi_premier", "bilt", "amex_green"];

export default function OnboardingWizard({
  open, onClose, onComplete,
  user, supabase, setUser,
  LOYALTY_PROGRAMS, linkedAccounts, setLinkedAccounts,
  darkMode,
}) {
  const D = darkMode;
  const dv = palette(D);
  const [stepIdx, setStepIdx] = useState(0);
  const [profile, setProfile] = useState({
    homeAirport: user?.user_metadata?.home_airport || "",
    passportCountry: user?.user_metadata?.passport_country || "",
    defaultCurrency: user?.user_metadata?.default_currency || "USD",
  });
  const [airlinePicks, setAirlinePicks] = useState(new Set());
  const [hotelPicks, setHotelPicks] = useState(new Set());
  const [cardPicks, setCardPicks] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset every time the wizard opens (re-runnable from Settings)
  useEffect(() => {
    if (!open) return;
    setStepIdx(0);
    setError("");
    setProfile({
      homeAirport: user?.user_metadata?.home_airport || "",
      passportCountry: user?.user_metadata?.passport_country || "",
      defaultCurrency: user?.user_metadata?.default_currency || "USD",
    });
    // Pre-check anything already linked so the wizard reflects current state
    const existing = new Set(Object.keys(linkedAccounts || {}));
    setAirlinePicks(new Set([...existing].filter(id => (LOYALTY_PROGRAMS?.airlines || []).some(a => a.id === id))));
    setHotelPicks(new Set([...existing].filter(id => (LOYALTY_PROGRAMS?.hotels || []).some(h => h.id === id))));
    setCardPicks(new Set([...existing].filter(id => (LOYALTY_PROGRAMS?.creditCards || []).some(c => c.id === id))));
  }, [open]);

  const popularAirlines = useMemo(() => {
    const list = LOYALTY_PROGRAMS?.airlines || [];
    const order = new Map(POPULAR_AIRLINES.map((id, i) => [id, i]));
    return [...list].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  }, [LOYALTY_PROGRAMS]);

  const popularHotels = useMemo(() => {
    const list = LOYALTY_PROGRAMS?.hotels || [];
    const order = new Map(POPULAR_HOTELS.map((id, i) => [id, i]));
    return [...list].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  }, [LOYALTY_PROGRAMS]);

  const popularCards = useMemo(() => {
    const list = LOYALTY_PROGRAMS?.creditCards || [];
    const order = new Map(POPULAR_CARDS.map((id, i) => [id, i]));
    return [...list].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  }, [LOYALTY_PROGRAMS]);

  if (!open) return null;

  const togglePick = (set, setter, id) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      // 1) Profile metadata to user record
      const meta = {
        home_airport: profile.homeAirport.toUpperCase().trim() || null,
        passport_country: profile.passportCountry || null,
        default_currency: profile.defaultCurrency || "USD",
        onboarded_v1: true,
      };
      if (user && supabase?.auth?.updateUser) {
        const { data, error: e1 } = await supabase.auth.updateUser({ data: meta });
        if (e1) throw new Error(e1.message);
        if (data?.user && setUser) setUser(data.user);
      }

      // 2) Seed linked accounts for picked programs (empty values — user can fill in later)
      const picksAll = [...airlinePicks, ...hotelPicks, ...cardPicks];
      const newLinked = { ...(linkedAccounts || {}) };
      const now = new Date().toISOString();
      const upserts = [];
      for (const id of picksAll) {
        if (!newLinked[id]) {
          newLinked[id] = { memberId: "Pending", currentPoints: 0, currentNights: 0, currentRentals: 0, updatedAt: now };
        }
        if (user && supabase) {
          upserts.push({
            user_id: user.id,
            program_id: id,
            member_id: "Pending",
            points_balance: 0,
            tier_credits: 0,
            current_nights: 0,
            current_rentals: 0,
            updated_at: now,
          });
        }
      }
      if (upserts.length > 0 && user && supabase) {
        // Best-effort — don't block the wizard if the upsert errors
        await supabase.from("linked_accounts").upsert(upserts, { onConflict: "user_id,program_id" });
      }
      setLinkedAccounts?.(newLinked);

      onComplete?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const skipAll = async () => {
    // Stamp the flag so we don't re-prompt, but write nothing else
    if (user && supabase?.auth?.updateUser) {
      try {
        const { data } = await supabase.auth.updateUser({ data: { onboarded_v1: true } });
        if (data?.user && setUser) setUser(data.user);
      } catch (_) {}
    }
    onClose?.();
  };

  const totalSteps = 5;
  const stepNames = ["Welcome", "About you", "Loyalty", "Cards", "All set"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9800, background: "rgba(15,13,15,0.78)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: 0, position: "relative" }}>
        {/* Top bar — progress + skip */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: `1px solid ${dv.cream}`, background: dv.bone }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.accent }}>
              Setup · {String(stepIdx + 1)} / {String(totalSteps)}
            </span>
            <span style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 13 }}>{stepNames[stepIdx]}</span>
          </div>
          {stepIdx < totalSteps - 1 && (
            <button onClick={skipAll}
              style={{ background: "transparent", border: "none", color: dv.taupe, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", padding: "4px 8px" }}
              onMouseEnter={e => e.currentTarget.style.color = dv.accent}
              onMouseLeave={e => e.currentTarget.style.color = dv.taupe}>
              Skip setup
            </button>
          )}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, padding: "12px 22px 0" }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, background: i <= stepIdx ? dv.accent : dv.cream, transition: "background 0.25s" }} />
          ))}
        </div>

        <div style={{ padding: "26px 26px 22px" }}>
          {stepIdx === 0 && <StepWelcome dv={dv} firstName={user?.user_metadata?.first_name || ""} />}
          {stepIdx === 1 && <StepProfile dv={dv} profile={profile} setProfile={setProfile} />}
          {stepIdx === 2 && <StepLoyalty dv={dv} airlines={popularAirlines} hotels={popularHotels} airlinePicks={airlinePicks} hotelPicks={hotelPicks} togglePick={togglePick} setAirlinePicks={setAirlinePicks} setHotelPicks={setHotelPicks} />}
          {stepIdx === 3 && <StepCards dv={dv} cards={popularCards} cardPicks={cardPicks} togglePick={togglePick} setCardPicks={setCardPicks} />}
          {stepIdx === 4 && <StepDone dv={dv} profile={profile} airlinePicks={airlinePicks} hotelPicks={hotelPicks} cardPicks={cardPicks} />}
        </div>

        {error && (
          <div style={{ margin: "0 26px 16px", padding: "10px 14px", background: "rgba(200,85,61,0.08)", border: `1px solid ${dv.accent}`, color: dv.accent, fontFamily: FONTS.sans, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "14px 22px", borderTop: `1px solid ${dv.cream}`, background: dv.bone }}>
          {stepIdx > 0 ? (
            <button onClick={() => setStepIdx(i => Math.max(0, i - 1))}
              style={{ padding: "9px 16px", border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              Back
            </button>
          ) : <span />}
          {stepIdx < totalSteps - 1 ? (
            <button onClick={() => setStepIdx(i => Math.min(totalSteps - 1, i + 1))}
              style={{ padding: "10px 22px", border: "none", background: dv.ink, color: dv.bone, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              {stepIdx === 0 ? "Get started" : "Next"} →
            </button>
          ) : (
            <button onClick={finish} disabled={saving}
              style={{ padding: "10px 22px", border: "none", background: saving ? dv.cream : dv.accent, color: saving ? dv.taupe : "#F4F1EC", fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: saving ? "default" : "pointer" }}>
              {saving ? "Saving…" : "Open Continuum →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── STEPS ──────────────────────────────────────────────────────────────

function StepWelcome({ dv, firstName }) {
  return (
    <div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.accent, marginBottom: 14 }}>
        ● Welcome
      </div>
      <h2 style={{ fontFamily: FONTS.serif, fontSize: 32, fontWeight: 400, color: dv.ink, margin: "0 0 14px", letterSpacing: "-0.015em", lineHeight: 1.1 }}>
        Let's set up Continuum{firstName ? `, ${firstName}` : ""}.
      </h2>
      <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 16, lineHeight: 1.55, margin: "0 0 18px" }}>
        Two minutes of setup unlocks every feature — card recommendations, lounge access at your terminal, sweet-spot redemptions on the points you actually hold, and visa intel for your passport.
      </p>
      <p style={{ fontFamily: FONTS.serif, color: dv.taupe, fontSize: 14, lineHeight: 1.55, margin: 0 }}>
        You can edit any of this later in Settings or Programs. Skip this step entirely with the "Skip setup" link up top.
      </p>
    </div>
  );
}

function StepProfile({ dv, profile, setProfile }) {
  const lbl = { display: "block", fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 };
  const inp = { width: "100%", padding: "12px 14px", background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, color: dv.ink, fontSize: 15, fontFamily: FONTS.serif, outline: "none", boxSizing: "border-box" };
  return (
    <div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.accent, marginBottom: 12 }}>● About you</div>
      <h2 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: dv.ink, margin: "0 0 8px", letterSpacing: "-0.01em" }}>The basics.</h2>
      <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, lineHeight: 1.55, margin: "0 0 22px" }}>
        Powers your home weather, "currently in" detection, visa intel, and default expense currency.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Home airport (3-letter IATA code)</label>
        <input type="text" value={profile.homeAirport} placeholder="e.g. JFK, LAX, BDA"
          onChange={e => setProfile(p => ({ ...p, homeAirport: e.target.value.toUpperCase().slice(0, 3) }))}
          maxLength={3} style={inp} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lbl}>Passport country</label>
          <select value={profile.passportCountry}
            onChange={e => setProfile(p => ({ ...p, passportCountry: e.target.value }))}
            style={{ ...inp, cursor: "pointer" }}>
            <option value="">Select…</option>
            {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Default currency</label>
          <select value={profile.defaultCurrency}
            onChange={e => setProfile(p => ({ ...p, defaultCurrency: e.target.value }))}
            style={{ ...inp, cursor: "pointer" }}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function StepLoyalty({ dv, airlines, hotels, airlinePicks, hotelPicks, togglePick, setAirlinePicks, setHotelPicks }) {
  return (
    <div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.accent, marginBottom: 12 }}>● Status programs</div>
      <h2 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: dv.ink, margin: "0 0 8px", letterSpacing: "-0.01em" }}>What programs do you fly and stay with?</h2>
      <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, lineHeight: 1.55, margin: "0 0 18px" }}>
        Tap any program you have a status with — even pending. We'll add them so the lounge access engine, status tracker, and alliance recognition work properly. Add details (member #, status tier) later.
      </p>

      <SectionHead dv={dv} label="Airlines" />
      <ChipGrid items={airlines} picks={airlinePicks} onToggle={id => togglePick(airlinePicks, setAirlinePicks, id)} dv={dv} />

      <SectionHead dv={dv} label="Hotels" mt={20} />
      <ChipGrid items={hotels} picks={hotelPicks} onToggle={id => togglePick(hotelPicks, setHotelPicks, id)} dv={dv} />
    </div>
  );
}

function StepCards({ dv, cards, cardPicks, togglePick, setCardPicks }) {
  return (
    <div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.accent, marginBottom: 12 }}>● Credit cards</div>
      <h2 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: dv.ink, margin: "0 0 8px", letterSpacing: "-0.01em" }}>Which cards are in your wallet?</h2>
      <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, lineHeight: 1.55, margin: "0 0 18px" }}>
        Powers the live decision engine ("which card to swipe"), the annual benefits tracker, transfer-bonus alerts on points you hold, and card-issued lounge access (Centurion, Sapphire, Capital One).
      </p>
      <ChipGrid items={cards} picks={cardPicks} onToggle={id => togglePick(cardPicks, setCardPicks, id)} dv={dv} />
    </div>
  );
}

function StepDone({ dv, profile, airlinePicks, hotelPicks, cardPicks }) {
  const lines = [];
  if (profile.homeAirport) lines.push(`Home airport · ${profile.homeAirport}`);
  if (profile.passportCountry) lines.push(`Passport · ${profile.passportCountry}`);
  if (profile.defaultCurrency) lines.push(`Currency · ${profile.defaultCurrency}`);
  lines.push(`${airlinePicks.size} airline${airlinePicks.size === 1 ? "" : "s"}, ${hotelPicks.size} hotel${hotelPicks.size === 1 ? "" : "s"}, ${cardPicks.size} card${cardPicks.size === 1 ? "" : "s"}`);
  return (
    <div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.accent, marginBottom: 12 }}>● You're set</div>
      <h2 style={{ fontFamily: FONTS.serif, fontSize: 28, fontWeight: 400, color: dv.ink, margin: "0 0 14px", letterSpacing: "-0.015em", lineHeight: 1.1 }}>
        Ready to fly.
      </h2>
      <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 15, lineHeight: 1.55, margin: "0 0 18px" }}>
        Here's what we set up. Edit any of it from Programs or Settings whenever you want.
      </p>
      <div style={{ background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: "14px 18px" }}>
        {lines.map((line, i) => (
          <div key={i} style={{ fontFamily: FONTS.serif, fontSize: 14, color: dv.ink, padding: "8px 0", borderBottom: i < lines.length - 1 ? `1px solid ${dv.cream}` : "none" }}>
            {line}
          </div>
        ))}
      </div>
      <p style={{ fontFamily: FONTS.serif, fontStyle: "italic", color: dv.taupe, fontSize: 13, lineHeight: 1.55, margin: "16px 0 0" }}>
        Next step: forward a flight or hotel confirmation to <strong style={{ color: dv.accent, fontStyle: "normal" }}>trips@gocontinuum.app</strong> and watch a trip materialize.
      </p>
    </div>
  );
}

function SectionHead({ dv, label, mt = 0 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: mt, marginBottom: 10, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe }}>
      <div style={{ width: 18, height: 1, background: dv.accent }} />
      {label}
    </div>
  );
}

function ChipGrid({ items, picks, onToggle, dv }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map(item => {
        const on = picks.has(item.id);
        return (
          <button key={item.id} onClick={() => onToggle(item.id)}
            style={{
              padding: "8px 12px", border: `1px solid ${on ? dv.ink : dv.cream}`,
              background: on ? dv.ink : "transparent", color: on ? dv.bone : dv.taupe,
              fontFamily: FONTS.sans, fontSize: 12, letterSpacing: "-0.005em",
              cursor: "pointer", transition: "all 0.18s", whiteSpace: "nowrap",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", border: `1px solid ${on ? dv.bone : dv.stone}`, background: on ? dv.bone : "transparent" }} />
            {item.name}
          </button>
        );
      })}
    </div>
  );
}

function palette(D) {
  return {
    bone: D ? "#1a1a1a" : "#fff",
    paper: D ? "#222" : "#fff",
    cream: D ? "rgba(255,255,255,0.08)" : "#E2DCCE",
    stone: D ? "#8a8a8a" : "#857A66",
    taupe: D ? "#999" : "#6B6458",
    ink: D ? "#f0ece6" : "#15130F",
    accent: "#C8553D",
  };
}
