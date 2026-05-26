import React, { useEffect, useMemo, useState } from "react";
import { LOYALTY_PROGRAMS } from "../constants/programs";
import { CC_BONUS_EXPANDED } from "../constants/airline-data";
import { recommendCard } from "../components/cardRecommend";
import { POINT_CURRENCIES, CARD_TO_CURRENCY, readPointValueOverrides, writePointValueOverrides, getEffectiveValuations } from "../constants/pointValues";
import TransferBonusBand from "../components/transferBonuses/TransferBonusBand";
import BenefitsSummaryPanel from "../components/benefits/BenefitsSummaryPanel";
import { derivePotentialVouchers } from "../constants/voucherDetect";

const PURCHASE_CATEGORIES = [
  { id: "dining", label: "Dining", icon: "food" },
  { id: "groceries", label: "Groceries", icon: "cart" },
  { id: "flight", label: "Flights", icon: "plane" },
  { id: "lodging", label: "Hotels", icon: "hotel" },
  { id: "taxi", label: "Transit / Rideshare", icon: "car" },
  { id: "mobile", label: "Mobile / Streaming", icon: "shop" },
  { id: "other", label: "Everything else", icon: "shop" },
];

const ICONS = {
  food:   <><path d="M3 11h18l-2 9H5z" /><path d="M8 11V6a4 4 0 0 1 8 0v5" /></>,
  cart:   <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></>,
  plane:  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
  hotel:  <><path d="M3 21V8l9-5 9 5v13" /><path d="M9 21v-6h6v6" /></>,
  car:    <><path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></>,
  shop:   <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
  bolt:   <polyline points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" />,
};
const Icon = ({ id, color, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {ICONS[id] || ICONS.shop}
  </svg>
);

const STRATEGY_CATEGORIES = [
  { id: "dining", label: "Dining" },
  { id: "lodging", label: "Hotels" },
  { id: "flight", label: "Flights" },
  { id: "groceries", label: "Groceries" },
  { id: "taxi", label: "Transit" },
  { id: "mobile", label: "Streaming" },
  { id: "other", label: "Everything else" },
];

export function renderWallet(s) {
  return <WalletPage {...s} />;
}

function WalletPage({ css, isMobile, darkMode, linkedAccounts, ProgramLogo, setActiveView, transferBonuses, userPointCurrencies, benefitsSummary, allCreditCards, onEditCardBenefits, vouchers = [], setShowVoucherModal, markVoucherRedeemed }) {
  const D = darkMode;
  const dv = {
    bone: D ? "#1a1a1a" : "#fff",
    paper: D ? "#222" : "#fff",
    cream: D ? "rgba(255,255,255,0.08)" : "#E2DCCE",
    stone: D ? "#8a8a8a" : "#857A66",
    taupe: D ? "#999" : "#6B6458",
    ink: D ? "#f0ece6" : "#15130F",
    accent: "#C8553D",
    moss: "#6B7A5A",
    gold: "#B8924A",
    serif: "'Fraunces', 'Instrument Serif', Georgia, serif",
    sans: "'Inter Tight', 'Instrument Sans', sans-serif",
    mono: "'JetBrains Mono', 'Geist Mono', monospace",
  };

  const linkedCards = useMemo(() => {
    return LOYALTY_PROGRAMS.creditCards
      .filter(c => linkedAccounts?.[c.id])
      .map(c => ({ ...c, knownBonuses: !!CC_BONUS_EXPANDED[c.id] }));
  }, [linkedAccounts]);

  // Currencies the user actually holds — used to highlight bonuses on those
  // points first (and to filter the valuations panel below).
  const userCurrencies = useMemo(() => {
    const set = new Set();
    linkedCards.forEach(c => { const cc = CARD_TO_CURRENCY[c.id]; if (cc) set.add(cc); });
    return [...set];
  }, [linkedCards]);

  // Point-value overrides — kept in localStorage, surfaced as editable in the
  // "Point valuations" panel below.
  const [overrides, setOverrides] = useState(() => readPointValueOverrides());
  const valuations = useMemo(() => getEffectiveValuations(overrides), [overrides]);

  // Decision engine state
  const [category, setCategory] = useState("dining");
  const [amount, setAmount] = useState("100");
  const amountNum = parseFloat(amount) || 0;
  const recommendation = useMemo(
    () => recommendCard({ expenseCategory: category, amount: amountNum, linkedAccounts, valueOverrides: overrides }),
    [category, amountNum, linkedAccounts, overrides]
  );

  // Editing state for valuations panel
  const [editingValuations, setEditingValuations] = useState(false);
  const [draftValues, setDraftValues] = useState({}); // { currencyId: stringInput }

  useEffect(() => {
    if (editingValuations) {
      // Hydrate draft with current effective values (in cents/pt for display)
      const d = {};
      Object.entries(valuations).forEach(([id, v]) => { d[id] = (v.value * 100).toFixed(2); });
      setDraftValues(d);
    }
  }, [editingValuations]);

  const saveValuations = () => {
    const newOv = {};
    Object.entries(draftValues).forEach(([id, str]) => {
      const cents = parseFloat(str);
      if (!isNaN(cents) && cents > 0 && cents !== POINT_CURRENCIES[id]?.defaultValue * 100) {
        newOv[id] = cents / 100; // store as USD/pt
      }
    });
    writePointValueOverrides(newOv);
    setOverrides(newOv);
    setEditingValuations(false);
  };

  const resetValuations = () => {
    writePointValueOverrides({});
    setOverrides({});
    setDraftValues({});
    setEditingValuations(false);
  };

  if (linkedCards.length === 0) {
    return (
      <div style={{ fontFamily: dv.sans, color: dv.ink }}>
        <Hero dv={dv} D={D} isMobile={isMobile} css={css} />
        <PageHeader dv={dv} isMobile={isMobile} />
        <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: isMobile ? "32px 22px" : "48px 32px", textAlign: "center" }}>
          <h3 style={{ fontFamily: dv.serif, fontSize: 24, fontWeight: 400, color: dv.ink, margin: "0 0 10px", letterSpacing: "-0.01em" }}>
            No cards in your wallet yet.
          </h3>
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, lineHeight: 1.55, margin: "0 auto 22px", maxWidth: 460 }}>
            Add your credit cards in Programs and we'll tell you which one to swipe for any purchase — Dining, Hotels, Flights, Groceries, you name it.
          </p>
          <button onClick={() => setActiveView?.("programs")} style={{
            padding: "12px 22px", border: "none", background: dv.ink, color: dv.bone,
            fontFamily: dv.serif, fontSize: 14, cursor: "pointer", letterSpacing: "0.02em",
          }}>
            Add cards in Programs →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: dv.sans, color: dv.ink }}>
      <Hero dv={dv} D={D} isMobile={isMobile} css={css} />
      <PageHeader dv={dv} isMobile={isMobile} />

      {/* ── Live transfer bonus band ── */}
      {transferBonuses && (
        <TransferBonusBand
          bonuses={transferBonuses.active}
          userBonuses={transferBonuses.forUser(userCurrencies)}
          lastUpdated={transferBonuses.data?.lastUpdated}
          isMobile={isMobile} darkMode={D} variant="full"
        />
      )}

      {/* ── Wallet band ── */}
      <SectionEyebrow dv={dv} title={`Your wallet · ${linkedCards.length} card${linkedCards.length === 1 ? "" : "s"}`} />
      <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: isMobile ? "16px" : "20px 24px", marginBottom: 40, display: "flex", flexWrap: "wrap", gap: 14 }}>
        {linkedCards.map(card => (
          <div key={card.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px 8px 8px", background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
              {ProgramLogo ? <ProgramLogo prog={card} size={20} /> : null}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: dv.serif, fontSize: 14, color: dv.ink, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</div>
              <div style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>
                {valuations[CARD_TO_CURRENCY[card.id]]?.short || (card.knownBonuses ? "" : "No bonus data")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Decision engine ── */}
      <SectionEyebrow dv={dv} title="The decision · which card to swipe" />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(280px, 340px) 1fr", gap: 0, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, marginBottom: 56 }}>
        <div style={{ padding: isMobile ? "24px 20px" : "28px 26px", borderRight: isMobile ? "none" : `1px solid ${dv.cream}`, borderBottom: isMobile ? `1px solid ${dv.cream}` : "none", background: dv.bone }}>
          <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.accent, marginBottom: 22, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 1, background: dv.accent }} />
            Configure purchase
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 10 }}>Category</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {PURCHASE_CATEGORIES.map(cat => {
                const active = category === cat.id;
                return (
                  <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 12px", border: `1px solid ${active ? dv.ink : dv.cream}`,
                    background: active ? dv.ink : dv.bone, color: active ? dv.bone : dv.taupe,
                    fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
                    cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                  }}>
                    <Icon id={cat.icon} size={12} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 10 }}>Amount (USD)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", fontFamily: dv.serif, fontSize: 26, color: dv.stone, fontStyle: "italic" }}>$</span>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${dv.stone}`, padding: "12px 0 12px 24px", fontFamily: dv.serif, fontSize: 26, color: dv.ink, outline: "none", fontVariantNumeric: "tabular-nums" }} />
            </div>
          </div>
        </div>

        {/* Output */}
        <div style={{ padding: isMobile ? "24px 20px" : "28px 32px" }}>
          {!recommendation ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: dv.taupe }}>
              <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 15, margin: 0 }}>
                Enter an amount above to see the recommendation.
              </p>
            </div>
          ) : (() => {
            const { best, bestDirect, bestPortal, alternatives, reasoning } = recommendation;
            const showSplit = bestDirect && bestPortal && bestDirect.cardId !== bestPortal.cardId
              || (bestDirect && bestPortal && bestDirect.path !== bestPortal.path);
            // Always show split when both direct and portal options exist that earn meaningfully different value.
            const splitMeaningful = bestDirect && bestPortal &&
              (bestDirect.cardId !== bestPortal.cardId || bestDirect.path !== bestPortal.path);
            return (
              <>
                {/* Top recommendation */}
                <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.moss, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon id="bolt" size={11} />
                  The recommendation
                </div>
                <RecommendationCard dv={dv} option={best} ProgramLogo={ProgramLogo} pathLabel headline reasoning={reasoning} />

                {/* Direct vs Portal comparison */}
                {splitMeaningful && (
                  <div style={{ marginTop: 22 }}>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginBottom: 10 }}>
                      Direct vs Portal · the math
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                      <PathCard dv={dv} option={bestDirect} pathTitle="Booking direct" ProgramLogo={ProgramLogo} isBest={best === bestDirect} />
                      <PathCard dv={dv} option={bestPortal} pathTitle="Booking via issuer portal" ProgramLogo={ProgramLogo} isBest={best === bestPortal} />
                    </div>
                    <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
                      Portal bookings often have worse pricing or restricted inventory — make sure the points uplift actually beats booking direct at a lower fare.
                    </p>
                  </div>
                )}

                {/* Runners-up */}
                {alternatives.length > 0 && (
                  <div style={{ marginTop: 22 }}>
                    <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginBottom: 10 }}>Runners-up</div>
                    <div style={{ border: `1px solid ${dv.cream}` }}>
                      {alternatives.map((alt, i) => {
                        const altProg = LOYALTY_PROGRAMS.creditCards.find(c => c.id === alt.cardId);
                        return (
                          <div key={`${alt.cardId}-${alt.path}`} style={{
                            display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 12,
                            padding: "12px 14px", alignItems: "center",
                            borderBottom: i < alternatives.length - 1 ? `1px solid ${dv.cream}` : "none",
                            background: i % 2 === 1 ? "rgba(226,220,206,0.18)" : "transparent",
                          }}>
                            <div style={{ width: 28, height: 28, background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, display: "grid", placeItems: "center" }}>
                              {ProgramLogo && altProg ? <ProgramLogo prog={altProg} size={18} /> : null}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontFamily: dv.serif, fontSize: 14, color: dv.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{alt.cardName}</div>
                              <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.06em", color: alt.path === "portal" ? dv.gold : dv.taupe, textTransform: "uppercase", marginTop: 2 }}>{alt.path === "portal" ? "Portal" : "Direct"}</div>
                            </div>
                            <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, letterSpacing: "0.04em" }}>{alt.rate}×</span>
                            <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe, fontVariantNumeric: "tabular-nums", textAlign: "right", minWidth: 60 }}>{Math.round(alt.points).toLocaleString()} pts</span>
                            <span style={{ fontFamily: dv.serif, fontSize: 13, color: dv.ink, fontVariantNumeric: "tabular-nums", textAlign: "right", minWidth: 60 }}>${alt.valueUSD.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* ── Vouchers & Free Nights · the locker ── */}
      {(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const active = (vouchers || [])
          .filter(v => v.status === "active")
          .map(v => {
            if (!v.expiry_date) return { ...v, daysLeft: null, urgent: false };
            const exp = new Date(v.expiry_date + "T12:00:00");
            const days = Math.round((exp - today) / 86400000);
            return { ...v, daysLeft: days, urgent: days <= 90 };
          })
          .sort((a, b) => (a.daysLeft ?? 99999) - (b.daysLeft ?? 99999));
        const allPotential = derivePotentialVouchers(linkedCards);
        const claimedKey = new Set((vouchers || [])
          .filter(v => v.source_card_id && v.source_benefit_id)
          .map(v => `${v.source_card_id}::${v.source_benefit_id}`));
        const potential = allPotential.filter(p => !claimedKey.has(`${p.source_card_id}::${p.source_benefit_id}`));

        return (
          <div style={{ marginBottom: 56 }}>
            <SectionEyebrow dv={dv} title="Vouchers & free nights · the locker" />
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
              <button onClick={() => setShowVoucherModal && setShowVoucherModal("new")} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
                border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe,
                fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                cursor: "pointer", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = dv.accent; e.currentTarget.style.color = dv.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; e.currentTarget.style.color = dv.taupe; }}
              >+ Add voucher</button>
            </div>

            {active.length === 0 && potential.length === 0 && (
              <div style={{ padding: "16px 18px", background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14 }}>
                Track companion vouchers, hotel free nights, upgrade certs and travel credits — never miss an expiry date again.
              </div>
            )}

            {active.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                {active.map(v => {
                  const accent = v.urgent ? "#C8553D" : (v.kind === "free_night" ? dv.gold : v.kind === "upgrade_voucher" ? dv.moss : dv.accent);
                  const daysLabel = v.daysLeft === null ? "No expiry set"
                    : v.daysLeft < 0 ? "Expired"
                    : v.daysLeft === 0 ? "Expires today"
                    : v.daysLeft === 1 ? "1 day left"
                    : v.daysLeft < 30 ? `${v.daysLeft} days left`
                    : v.daysLeft < 365 ? `${Math.round(v.daysLeft / 30)} months left`
                    : `${Math.round(v.daysLeft / 365)} year${Math.round(v.daysLeft / 365) === 1 ? "" : "s"} left`;
                  const expLabel = v.expiry_date ? new Date(v.expiry_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
                  return (
                    <div key={v.id} style={{
                      textAlign: "left", padding: "14px 16px", background: dv.paper,
                      border: `1px solid ${dv.cream}`, borderLeft: `3px solid ${accent}`,
                      display: "flex", flexDirection: "column", gap: 6,
                    }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: accent }}>
                          {v.kind === "free_night" ? "Free night" : v.kind === "upgrade_voucher" ? "Upgrade" : v.kind === "travel_credit" ? "Travel credit" : v.kind === "companion_voucher" ? "Companion" : "Voucher"}
                        </span>
                        {v.value_estimate ? (
                          <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.06em" }}>
                            ~${Number(v.value_estimate).toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                      <span style={{ fontFamily: dv.serif, fontSize: 16, color: dv.ink, lineHeight: 1.25, letterSpacing: "-0.01em" }}>{v.title}</span>
                      <span style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 12, color: v.urgent ? "#C8553D" : dv.taupe, lineHeight: 1.4 }}>
                        {daysLabel}{expLabel ? ` · ${expLabel}` : ""}
                      </span>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button onClick={() => setShowVoucherModal && setShowVoucherModal(v)} style={{ background: "transparent", border: "none", color: dv.taupe, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 0", cursor: "pointer" }}>Edit</button>
                        <span style={{ color: dv.stone, fontSize: 10 }}>·</span>
                        <button onClick={() => markVoucherRedeemed && markVoucherRedeemed(v.id)} style={{ background: "transparent", border: "none", color: dv.moss, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 0", cursor: "pointer" }}>Mark redeemed</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {potential.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: active.length > 0 ? "18px 0 10px" : "0 0 10px" }}>
                  <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe }}>Available from your cards</span>
                  <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, opacity: 0.6 }}>({potential.length})</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                  {potential.map(p => {
                    const accent = p.kind === "free_night" ? dv.gold : p.kind === "upgrade_voucher" ? dv.moss : dv.accent;
                    return (
                      <div key={`${p.source_card_id}-${p.source_benefit_id}`} style={{
                        textAlign: "left", padding: "14px 16px", background: "transparent",
                        border: `1px dashed ${dv.cream}`, borderLeft: `3px dashed ${accent}`,
                        display: "flex", flexDirection: "column", gap: 6,
                      }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, opacity: 0.85 }}>
                            {p.kind === "free_night" ? "Free night" : p.kind === "upgrade_voucher" ? "Upgrade" : "Companion"}
                          </span>
                          {p.value_estimate ? (
                            <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.06em" }}>~${Number(p.value_estimate).toLocaleString()}</span>
                          ) : null}
                        </div>
                        <span style={{ fontFamily: dv.serif, fontSize: 16, color: dv.taupe, lineHeight: 1.25, letterSpacing: "-0.01em" }}>{p.title}</span>
                        <span style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 12, color: dv.taupe, lineHeight: 1.4 }}>From {p.cardName}</span>
                        <div style={{ marginTop: 8 }}>
                          <button onClick={() => setShowVoucherModal && setShowVoucherModal({
                            kind: p.kind, title: p.title,
                            source_card_id: p.source_card_id, source_benefit_id: p.source_benefit_id,
                            value_estimate: p.value_estimate || "",
                          })} style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: "transparent", border: `1px solid ${accent}`, color: accent,
                            fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                            padding: "6px 12px", cursor: "pointer", transition: "all 0.2s",
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = accent; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = accent; }}
                          >Activate · set expiry</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── Annual benefits tracker ── */}
      <BenefitsSummaryPanel
        summary={benefitsSummary}
        isMobile={isMobile} darkMode={D}
        ProgramLogo={ProgramLogo}
        allCards={allCreditCards}
        onEditCard={onEditCardBenefits}
      />

      {/* ── Monthly strategy grid ── */}
      <SectionEyebrow dv={dv} title="Monthly strategy · default cards by category" />
      <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, lineHeight: 1.55, margin: "0 0 18px", maxWidth: 720 }}>
        The best card in your wallet for everyday spend, by category. Memorize this and you barely need to open the configurator.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 0, border: `1px solid ${dv.cream}`, background: dv.paper, marginBottom: 56 }}>
        {STRATEGY_CATEGORIES.map((cat, ci) => {
          const rec = recommendCard({ expenseCategory: cat.id, amount: 100, linkedAccounts, valueOverrides: overrides });
          const totalCols = isMobile ? 1 : 2;
          const isLastInRow = (ci % totalCols) === totalCols - 1;
          const lastRowStart = Math.floor((STRATEGY_CATEGORIES.length - 1) / totalCols) * totalCols;
          const isInLastRow = ci >= lastRowStart;
          const bestProg = rec ? LOYALTY_PROGRAMS.creditCards.find(c => c.id === rec.best.cardId) : null;
          return (
            <div key={cat.id} style={{
              padding: isMobile ? "20px 18px" : "22px 24px",
              borderRight: !isLastInRow && !isMobile ? `1px solid ${dv.cream}` : "none",
              borderBottom: !isInLastRow ? `1px solid ${dv.cream}` : "none",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{ width: 36, height: 36, background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, display: "grid", placeItems: "center", flexShrink: 0, color: dv.taupe }}>
                <Icon id={PURCHASE_CATEGORIES.find(p => p.id === cat.id)?.icon || "shop"} size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 4 }}>{cat.label}</div>
                {rec ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 26, height: 26, background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      {ProgramLogo && bestProg ? <ProgramLogo prog={bestProg} size={16} /> : null}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: dv.serif, fontSize: 16, color: dv.ink, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rec.best.cardName}</div>
                      <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.accent, letterSpacing: "0.08em", marginTop: 2 }}>
                        {rec.best.rate}×{rec.best.path === "portal" ? " (portal)" : ""} · {(rec.best.ptValue * 100).toFixed(2)}¢/pt
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 13 }}>No bonus card in your wallet for this category.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Point valuations ── */}
      <SectionEyebrow dv={dv} title="Point valuations · what each currency is worth" />
      <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, lineHeight: 1.55, margin: "0 0 18px", maxWidth: 720 }}>
        Defaults are industry-standard valuations (TPG / Frequent Miler / NerdWallet blended), refreshed periodically.
        If you redeem differently than the average traveler, override any of these to match your own redemption strategy — the decision engine will recompute instantly.
      </p>

      <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderBottom: `1px solid ${dv.cream}`, background: dv.bone }}>
          <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe }}>
            {Object.keys(overrides).length > 0
              ? <><span style={{ color: dv.accent }}>●</span> {Object.keys(overrides).length} value{Object.keys(overrides).length === 1 ? "" : "s"} customized</>
              : "Using default valuations"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {editingValuations ? (
              <>
                <button onClick={resetValuations} style={btnGhost(dv)}>Reset to defaults</button>
                <button onClick={() => setEditingValuations(false)} style={btnGhost(dv)}>Cancel</button>
                <button onClick={saveValuations} style={btnPrimary(dv)}>Save</button>
              </>
            ) : (
              <button onClick={() => setEditingValuations(true)} style={btnGhost(dv)}>Edit values</button>
            )}
          </div>
        </div>

        <div>
          {/* Show user's currencies first, then the rest */}
          {[...userCurrencies, ...Object.keys(POINT_CURRENCIES).filter(id => !userCurrencies.includes(id))].map((id, i, arr) => {
            const meta = valuations[id];
            const isUserCurrency = userCurrencies.includes(id);
            return (
              <div key={id} style={{
                display: "grid", gridTemplateColumns: isMobile ? "1fr auto" : "auto 1fr auto auto", gap: 14,
                padding: "12px 22px", alignItems: "center",
                borderBottom: i < arr.length - 1 ? `1px solid ${dv.cream}` : "none",
                background: i % 2 === 1 ? "rgba(226,220,206,0.18)" : "transparent",
                opacity: isUserCurrency ? 1 : 0.55,
              }}>
                {!isMobile && (
                  <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", color: dv.taupe, padding: "3px 8px", border: `1px solid ${dv.cream}`, background: dv.bone, minWidth: 48, textAlign: "center" }}>
                    {meta.short}
                  </span>
                )}
                <div>
                  <div style={{ fontFamily: dv.serif, fontSize: 15, color: dv.ink }}>{meta.name}</div>
                  {!isUserCurrency && <div style={{ fontFamily: dv.mono, fontSize: 11, color: dv.stone, letterSpacing: "0.06em", marginTop: 2, textTransform: "uppercase" }}>No card in wallet</div>}
                </div>
                {!isMobile && (
                  <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.stone, letterSpacing: "0.04em" }}>
                    default {(meta.defaultValue * 100).toFixed(2)}¢
                  </span>
                )}
                {editingValuations ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input type="number" step="0.01" value={draftValues[id] ?? ""}
                      onChange={e => setDraftValues(d => ({ ...d, [id]: e.target.value }))}
                      style={{ width: 64, padding: "6px 8px", background: dv.bone, borderRadius: 12, border: `1px solid ${meta.isOverride ? dv.accent : dv.cream}`, color: dv.ink, fontFamily: dv.mono, fontSize: 13, textAlign: "right", outline: "none" }}
                    />
                    <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.taupe }}>¢</span>
                  </div>
                ) : (
                  <span style={{ fontFamily: dv.serif, fontSize: 18, color: meta.isOverride ? dv.accent : dv.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em", minWidth: 60, textAlign: "right" }}>
                    {(meta.value * 100).toFixed(2)}¢
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──
function Hero({ dv, D, isMobile, css }) {
  return (
    <div style={{ margin: isMobile ? "0 -16px 0" : "0 -40px 0", position: "relative", height: isMobile ? 200 : 320, overflow: "hidden", background: "#2C2A26" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/programsPicture.jpeg')", backgroundSize: "cover", backgroundPosition: "center", filter: "saturate(0.85) contrast(1.05)", animation: "kenburns 24s ease-in-out infinite alternate" }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${D ? "rgba(15,15,15,0)" : "rgba(244,241,236,0)"} 55%, ${D ? "rgba(15,15,15,0.9)" : "rgba(244,241,236,0.9)"} 90%, ${css.bg} 100%)`, zIndex: 1 }} />
      <div style={{ position: "absolute", top: 18, left: isMobile ? 16 : 48, zIndex: 3, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#F4F1EC", opacity: 0.9 }}>
        <span style={{ color: dv.accent }}>● </span>Card Optimizer
      </div>
    </div>
  );
}

function PageHeader({ dv, isMobile }) {
  return (
    <div style={{ marginTop: -24, marginBottom: 36, paddingBottom: 28, borderBottom: `1px solid ${dv.cream}`, position: "relative", zIndex: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.accent }}>
        <div style={{ width: 28, height: 1, background: dv.accent }} />
        Wallet · Live decision engine
      </div>
      <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 30 : "clamp(56px, 8vw, 92px)", fontWeight: 300, lineHeight: isMobile ? 1.05 : 0.94, letterSpacing: "-0.03em", color: dv.ink, margin: 0 }}>
        Which card. <em style={{ fontStyle: "italic", color: dv.accent, fontWeight: 400 }}>And why.</em>
      </h1>
      <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: isMobile ? 13 : 18, color: dv.taupe, marginTop: isMobile ? 10 : 16, marginBottom: 0, lineHeight: 1.45, maxWidth: 540 }}>
        Tell us what you're paying for. We weigh category multipliers and per-point values across the cards in your wallet, then surface the runners-up so you can see the math.
      </p>
    </div>
  );
}

function SectionEyebrow({ dv, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 18px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe }}>
      <div style={{ width: 28, height: 1, background: dv.accent }} />
      <strong style={{ color: dv.ink, fontWeight: 500 }}>{title}</strong>
      <div style={{ flex: 1, height: 1, background: dv.cream }} />
    </div>
  );
}

function RecommendationCard({ dv, option, ProgramLogo, reasoning }) {
  const prog = LOYALTY_PROGRAMS.creditCards.find(c => c.id === option.cardId);
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div style={{ width: 48, height: 48, background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
          {ProgramLogo && prog ? <ProgramLogo prog={prog} size={32} /> : null}
        </div>
        <div>
          <div style={{ fontFamily: dv.serif, fontSize: 26, fontWeight: 400, color: dv.ink, lineHeight: 1.1, letterSpacing: "-0.01em" }}>{option.cardName}</div>
          <div style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, marginTop: 4 }}>{reasoning}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, border: `1px solid ${dv.cream}`, marginBottom: 4 }}>
        <Stat dv={dv} lbl="Multiplier" val={`${option.rate}×`} />
        <Stat dv={dv} lbl="Points earned" val={Math.round(option.points).toLocaleString()} border />
        <Stat dv={dv} lbl="Expected value" val={`$${option.valueUSD.toFixed(2)}`} border accent />
      </div>
    </>
  );
}

function PathCard({ dv, option, pathTitle, ProgramLogo, isBest }) {
  const prog = LOYALTY_PROGRAMS.creditCards.find(c => c.id === option.cardId);
  return (
    <div style={{
      padding: "14px 16px", border: `1px solid ${isBest ? dv.accent : dv.cream}`,
      background: isBest ? "rgba(200,85,61,0.05)" : dv.bone, position: "relative",
    }}>
      {isBest && (
        <span style={{ position: "absolute", top: -1, right: -1, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff", background: dv.accent, padding: "3px 8px" }}>Best</span>
      )}
      <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>{pathTitle}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
          {ProgramLogo && prog ? <ProgramLogo prog={prog} size={20} /> : null}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: dv.serif, fontSize: 15, color: dv.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{option.cardName}</div>
          <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.06em", marginTop: 2 }}>{option.rate}× · {(option.ptValue * 100).toFixed(2)}¢/pt</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 10, borderTop: `1px solid ${dv.cream}` }}>
        <span style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, letterSpacing: "0.06em" }}>{Math.round(option.points).toLocaleString()} pts</span>
        <span style={{ fontFamily: dv.serif, fontSize: 22, fontWeight: 400, color: isBest ? dv.accent : dv.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>${option.valueUSD.toFixed(2)}</span>
      </div>
    </div>
  );
}

function Stat({ dv, lbl, val, border, accent }) {
  return (
    <div style={{ padding: "16px 18px", borderLeft: border ? `1px solid ${dv.cream}` : "none", background: dv.bone }}>
      <div style={{ fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginBottom: 6 }}>{lbl}</div>
      <div style={{ fontFamily: dv.serif, fontSize: 22, fontWeight: 400, color: accent ? dv.accent : dv.ink, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{val}</div>
    </div>
  );
}

function btnGhost(dv) {
  return {
    padding: "7px 12px", border: `1px solid ${dv.cream}`, background: "transparent",
    color: dv.taupe, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em",
    textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
  };
}
function btnPrimary(dv) {
  return {
    padding: "7px 14px", border: "none", background: dv.ink,
    color: dv.bone, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em",
    textTransform: "uppercase", cursor: "pointer",
  };
}
