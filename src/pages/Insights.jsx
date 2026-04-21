import React from "react";
export function renderInsights(s, _previewTab = null) {
  const { css, isMobile, darkMode, user, trips, expenses, linkedAccounts, allPrograms,
    insightsTab, setInsightsTab, EXPENSE_CATEGORIES,
    formatTripDates, getTripExpenses, getTripTotal, getTripName,
    AIRPORT_CITY, setActiveView } = s;
  const D = darkMode;
    const INSIGHT_TABS = [
      { id: "countdown",  label: "Status Countdown", tier: "free" },
      { id: "expiration", label: "Expiration Tracker", tier: "free" },
      { id: "redemption", label: "Redemption Value",   tier: "free" },
      { id: "transfer",   label: "Transfer Matrix",    tier: "free" },
      { id: "annual_fee", label: "Annual Fee Calc",    tier: "free" },
    ];
    const isPremium = true; // All features free for now

    // ── Helpers ──────────────────────────────────────────────────
    // allPrograms passed via state bag
    const findProg = (id) => allPrograms.find(p => p.id === id);

    // Infer last-activity date from trips
    const lastActivityByProg = {};
    const allTrips = [...(user?.upcomingTrips || []), ...trips];
    allTrips.forEach(t => {
      const d = t.date ? new Date(t.date) : null;
      if (!d || isNaN(d)) return;
      if (!lastActivityByProg[t.program] || d > lastActivityByProg[t.program]) {
        lastActivityByProg[t.program] = d;
      }
    });

    const today = new Date();
    const daysBetween = (a, b) => Math.round((b - a) / 86400000);

    // ── Sub-tab: Status Countdown ─────────────────────────────────
    const renderCountdown = () => {
      const progsSorted = Object.entries(linkedAccounts)
        .map(([id, acct]) => {
          const prog = findProg(id);
          if (!prog || !prog.tiers) return null;
          const current = acct.tierCredits ?? acct.currentNights ?? acct.currentRentals ?? 0;
          const nextTier = prog.tiers.find(t => t.threshold > current);
          const currentTierObj = [...prog.tiers].reverse().find(t => t.threshold <= current);
          const deficit = nextTier ? nextTier.threshold - current : 0;
          const pct = nextTier ? Math.min((current / nextTier.threshold) * 100, 100) : 100;
          const yearEnd = new Date("2026-12-31");
          const daysLeft = daysBetween(today, yearEnd);
          return { id, prog, acct, current, nextTier, currentTierObj, deficit, pct, daysLeft };
        })
        .filter(Boolean);

      if (progsSorted.length === 0) {
        return (
          <div style={{ textAlign: "center", padding: "60px 20px", color: css.text3 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>No linked accounts yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Link your loyalty programs in the Programs tab to see your status countdown.</div>
          </div>
        );
      }

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, color: css.text3, marginBottom: 4 }}>
            Qualification year ends <strong style={{ color: css.text }}>Dec 31, 2026</strong> · {Math.round(daysBetween(today, new Date("2026-12-31")) / 30.5)} months remaining
          </div>
          {progsSorted.map(({ id, prog, current, nextTier, currentTierObj, deficit, pct, daysLeft }) => (
            <div key={id} className="c-card" style={{ background: css.surface, border: `1px solid ${css.border}`, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ProgramLogo prog={prog} size={28} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{prog.name}</div>
                    <div style={{ fontSize: 12, color: css.text3 }}>
                      {currentTierObj ? <span style={{ color: css.gold, fontWeight: 600 }}>{currentTierObj.name}</span> : "No status yet"}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {nextTier ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 700, color: css.accent }}>{deficit.toLocaleString()} to go</div>
                      <div style={{ fontSize: 11, color: css.text3 }}>for {nextTier.name}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 700, color: css.success }}>Top tier ✓</div>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ position: "relative", height: 6, background: css.surface3, borderRadius: 0 }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ position: "absolute", top: 0, left: 0, height: "100%", background: pct >= 100 ? css.success : css.accent, borderRadius: 0 }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: css.text3 }}>
                <span>{current.toLocaleString()} {prog.unit}</span>
                {nextTier && <span>{nextTier.threshold.toLocaleString()} {prog.unit}</span>}
              </div>
              {nextTier && (
                <div style={{ fontSize: 12, color: css.text3, background: css.surface2, padding: "8px 12px", borderLeft: `2px solid ${css.accentBorder}` }}>
                  At current pace: <strong style={{ color: css.text }}>{Math.round(deficit / (daysLeft / 30.5))}</strong> {prog.unit}/month needed in {daysLeft} days remaining
                </div>
              )}
            </div>
          ))}
        </div>
      );
    };

    // ── Sub-tab: Expiration Tracker ───────────────────────────────
    const renderExpiration = () => {
      const rows = Object.entries(linkedAccounts).map(([id, acct]) => {
        const prog = findProg(id);
        if (!prog) return null;
        const rule = EXPIRATION_RULES[id];
        if (!rule) return null;
        const balance = acct.currentPoints ?? acct.bonvoyPoints ?? acct.hhPoints ?? acct.ihgPoints ?? acct.pointsBalance ?? acct.currentNights ?? 0;
        const lastActivity = lastActivityByProg[id];
        let expiresIn = null, risk = "safe";
        if (!rule.neverExpire && rule.months > 0) {
          const expirationDate = lastActivity ? new Date(lastActivity.getTime() + rule.months * 30.5 * 86400000) : null;
          expiresIn = expirationDate ? daysBetween(today, expirationDate) : null;
          if (expiresIn !== null) {
            if (expiresIn < 90) risk = "high";
            else if (expiresIn < 180) risk = "medium";
            else risk = "safe";
          } else {
            risk = "unknown";
          }
        }
        return { id, prog, acct, rule, balance, expiresIn, risk };
      }).filter(Boolean);

      const riskColor = { safe: css.success, medium: css.warning, high: "#ef4444", unknown: css.text3 };
      const riskLabel = { safe: "Safe", medium: "Monitor", high: "At Risk", unknown: "Unknown" };

      if (rows.length === 0) {
        return (
          <div style={{ textAlign: "center", padding: "60px 20px", color: css.text3 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏱️</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>No linked accounts</div>
          </div>
        );
      }

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.sort((a, b) => {
            const order = { high: 0, medium: 1, unknown: 2, safe: 3 };
            return order[a.risk] - order[b.risk];
          }).map(({ id, prog, rule, balance, expiresIn, risk }) => (
            <div key={id} className="c-card" style={{ background: css.surface, border: `1px solid ${css.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <ProgramLogo prog={prog} size={26} />
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{prog.name}</div>
                <div style={{ fontSize: 11, color: css.text3, marginTop: 2 }}>{balance.toLocaleString()} {prog.unit}</div>
              </div>
              <div style={{ flex: 2, minWidth: 160 }}>
                {rule.neverExpire ? (
                  <div style={{ fontSize: 12, color: css.success }}>✓ Never expire</div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: css.text2 }}>
                      {expiresIn !== null
                        ? expiresIn > 0
                          ? `Expires in ${expiresIn} days`
                          : "⚠️ May have expired"
                        : "No recent activity found"}
                    </div>
                    <div style={{ fontSize: 11, color: css.text3, marginTop: 2 }}>{rule.note}</div>
                  </>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColor[risk] }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: riskColor[risk] }}>
                  {rule.neverExpire ? "Safe" : riskLabel[risk]}
                </span>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: css.text3, marginTop: 4, paddingLeft: 2 }}>
            * Activity dates inferred from logged trips. Link your accounts for real-time data.
          </div>
        </div>
      );
    };

    // ── Sub-tab: Redemption Value Engine ─────────────────────────
    const renderRedemption = () => {
      if (!isPremium) {
        return (
          <div className="c-a1" style={{ textAlign: "center", padding: "60px 20px", background: css.surface, border: `1px solid ${css.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>💎</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: css.gold, marginBottom: 8 }}>Premium Feature</div>
            <h3 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 28, fontWeight: 600, color: css.text, margin: "0 0 12px" }}>Redemption Value Engine</h3>
            <p style={{ color: css.text2, fontSize: 14, maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.6 }}>See the real dollar value of your miles and points, plus where to get the most out of each balance.</p>
            <button onClick={() => setActiveView("premium")} className="c-btn-primary" style={{ padding: "10px 24px", background: css.accent, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, borderRadius: 0 }}>Upgrade to Premium</button>
          </div>
        );
      }

      const entries = Object.entries(linkedAccounts).map(([id, acct]) => {
        const prog = findProg(id);
        const rdv = REDEMPTION_VALUES[id];
        if (!prog || !rdv) return null;
        const balance = acct.currentPoints ?? acct.bonvoyPoints ?? acct.hhPoints ?? acct.ihgPoints ?? acct.pointsBalance ?? 0;
        const dollarValue = (balance * rdv.cpp / 100).toFixed(0);
        return { id, prog, rdv, balance, dollarValue };
      }).filter(Boolean).sort((a, b) => b.dollarValue - a.dollarValue);

      const totalValue = entries.reduce((s, e) => s + parseFloat(e.dollarValue), 0);

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Total value banner */}
          <div style={{ background: css.accentBg, border: `1px solid ${css.accentBorder}`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: css.accent, marginBottom: 4 }}>Portfolio Value (at peak redemption)</div>
              <div style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 42, fontWeight: 600, color: css.text, lineHeight: 1 }}>
                ${totalValue.toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: 12, color: css.text2, maxWidth: 240, lineHeight: 1.5 }}>
              Based on best achievable cents-per-point (CPP) values, not average. Actual value depends on how you redeem.
            </div>
          </div>

          {entries.map(({ id, prog, rdv, balance, dollarValue }) => (
            <div key={id} className="c-card" style={{ background: css.surface, border: `1px solid ${css.border}`, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ProgramLogo prog={prog} size={28} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: css.text }}>{prog.name}</div>
                    <div style={{ fontSize: 12, color: css.text3 }}>{balance.toLocaleString()} {prog.unit} · <span style={{ color: css.accent, fontWeight: 700 }}>{rdv.cpp}¢/pt peak CPP</span></div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 28, fontWeight: 600, color: css.text }}>${parseFloat(dollarValue).toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: css.text3 }}>peak value</div>
                </div>
              </div>
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: css.surface2, padding: "10px 12px", borderLeft: `2px solid ${css.success}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: css.success, marginBottom: 4 }}>Best Use</div>
                  <div style={{ fontSize: 12, color: css.text2, lineHeight: 1.4 }}>{rdv.best}</div>
                </div>
                <div style={{ background: css.surface2, padding: "10px 12px", borderLeft: `2px solid #ef4444` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#ef4444", marginBottom: 4 }}>Avoid</div>
                  <div style={{ fontSize: 12, color: css.text2, lineHeight: 1.4 }}>{rdv.avoid}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    };

    // ── Sub-tab: Transfer Partner Matrix ─────────────────────────
    const renderTransfer = () => {
      if (!isPremium) {
        return (
          <div className="c-a1" style={{ textAlign: "center", padding: "60px 20px", background: css.surface, border: `1px solid ${css.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🔀</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: css.gold, marginBottom: 8 }}>Premium Feature</div>
            <h3 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 28, fontWeight: 600, color: css.text, margin: "0 0 12px" }}>Transfer Partner Matrix</h3>
            <p style={{ color: css.text2, fontSize: 14, maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.6 }}>Explore which credit card currencies can reach your target airline or hotel program, and chart the optimal transfer path.</p>
            <button onClick={() => setActiveView("premium")} className="c-btn-primary" style={{ padding: "10px 24px", background: css.accent, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, borderRadius: 0 }}>Upgrade to Premium</button>
          </div>
        );
      }

      // Build matrix: all linked credit cards that have transfer partners
      const linkedCards = Object.keys(linkedAccounts).filter(id => CC_TRANSFER_PARTNERS[id]?.partners);
      const allTargets = [...new Set(linkedCards.flatMap(id => CC_TRANSFER_PARTNERS[id].partners))];

      // Goal finder
      const goalMatches = transferGoal
        ? linkedCards.filter(id => CC_TRANSFER_PARTNERS[id]?.partners?.includes(transferGoal))
        : [];

      const targetProg = transferGoal ? findProg(transferGoal) : null;

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Goal finder */}
          <div style={{ background: css.surface, border: `1px solid ${css.border}`, padding: "20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: css.text3, marginBottom: 12 }}>Transfer Path Advisor</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, color: css.text2, marginBottom: 6 }}>I want to earn points in...</div>
                <select
                  value={transferGoal}
                  onChange={e => setTransferGoal(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", background: css.surface2, border: `1px solid ${css.border}`, color: css.text, fontSize: 13, borderRadius: 0, cursor: "pointer" }}
                >
                  <option value="">Select a target program</option>
                  {allTargets.map(tid => {
                    const tp = findProg(tid);
                    return tp ? <option key={tid} value={tid}>{tp.name}</option> : null;
                  })}
                </select>
              </div>
            </div>
            {transferGoal && (
              <div style={{ marginTop: 16 }}>
                {goalMatches.length > 0 ? (
                  <>
                    <div style={{ fontSize: 12, color: css.success, fontWeight: 600, marginBottom: 10 }}>
                      ✓ {goalMatches.length} card{goalMatches.length > 1 ? "s" : ""} can transfer to {targetProg?.name}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {goalMatches.map(cardId => {
                        const cardProg = findProg(cardId);
                        const tp = CC_TRANSFER_PARTNERS[cardId];
                        const balance = linkedAccounts[cardId]?.pointsBalance ?? 0;
                        return (
                          <div key={cardId} style={{ display: "flex", alignItems: "center", gap: 12, background: css.surface2, padding: "10px 14px", borderLeft: `2px solid ${css.accent}` }}>
                            <ProgramLogo prog={cardProg} size={22} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{cardProg?.name}</div>
                              <div style={{ fontSize: 11, color: css.text3 }}>{tp.currency}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: css.accent }}>{balance.toLocaleString()} pts</div>
                              <div style={{ fontSize: 11, color: css.text3 }}>available to transfer</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "#ef4444" }}>
                    None of your linked cards can transfer to {targetProg?.name}. Consider adding a card that does.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Full matrix */}
          <div style={{ background: css.surface, border: `1px solid ${css.border}`, padding: "20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: css.text3, marginBottom: 16 }}>Your Transfer Matrix</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {linkedCards.map(cardId => {
                const cardProg = findProg(cardId);
                const tp = CC_TRANSFER_PARTNERS[cardId];
                const balance = linkedAccounts[cardId]?.pointsBalance ?? 0;
                return (
                  <div key={cardId}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <ProgramLogo prog={cardProg} size={22} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: css.text }}>{cardProg?.name}</div>
                      <div style={{ fontSize: 11, color: css.accent, fontWeight: 600, marginLeft: "auto" }}>{balance.toLocaleString()} {tp.currency}</div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 32 }}>
                      {tp.partners.map(pid => {
                        const pp = findProg(pid);
                        const isGoal = pid === transferGoal;
                        return pp ? (
                          <button
                            key={pid}
                            onClick={() => setTransferGoal(pid)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "4px 10px", border: `1px solid ${isGoal ? css.accent : css.border}`,
                              background: isGoal ? css.accentBg : "transparent",
                              color: isGoal ? css.accent : css.text2,
                              fontSize: 11, fontWeight: isGoal ? 600 : 400, cursor: "pointer", borderRadius: 0,
                            }}
                          >
                            <ProgramLogo prog={pp} size={14} />
                            {pp.name.split(" ")[0]}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

    // ── Sub-tab: Annual Fee Calculator ────────────────────────────
    const renderAnnualFee = () => {
      if (!isPremium) {
        return (
          <div className="c-a1" style={{ textAlign: "center", padding: "60px 20px", background: css.surface, border: `1px solid ${css.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🧮</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: css.gold, marginBottom: 8 }}>Premium Feature</div>
            <h3 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 28, fontWeight: 600, color: css.text, margin: "0 0 12px" }}>Annual Fee Calculator</h3>
            <p style={{ color: css.text2, fontSize: 14, maxWidth: 380, margin: "0 auto 24px", lineHeight: 1.6 }}>Tally the dollar value of benefits you actually use and see whether your card is truly worth the fee.</p>
            <button onClick={() => setActiveView("premium")} className="c-btn-primary" style={{ padding: "10px 24px", background: css.accent, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, borderRadius: 0 }}>Upgrade to Premium</button>
          </div>
        );
      }

      const cardData = CARD_BENEFITS_DATA[annualFeeCard];
      const catColors = { travel: css.accent, lifestyle: css.gold, lounge: "#8B6CF6", status: css.success, rewards: css.text2 };

      const getEffectiveValue = (b) => {
        const key = `${annualFeeCard}:${b.id}`;
        const custom = customBenefitValues[key];
        return (custom !== undefined && custom !== "") ? Number(custom) : b.value;
      };
      const usedValue = cardData
        ? cardData.benefits.reduce((sum, b) => {
            const key = `${annualFeeCard}:${b.id}`;
            return sum + (checkedBenefits[key] ? getEffectiveValue(b) : 0);
          }, 0)
        : 0;
      const netValue = usedValue - (cardData?.annualFee || 0);

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Card selector */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.keys(CARD_BENEFITS_DATA).map(cid => {
              const cp = findProg(cid);
              return (
                <button
                  key={cid}
                  onClick={() => setAnnualFeeCard(cid)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", border: `1px solid ${annualFeeCard === cid ? css.accent : css.border}`,
                    background: annualFeeCard === cid ? css.accentBg : css.surface,
                    color: annualFeeCard === cid ? css.accent : css.text2,
                    fontSize: 12, fontWeight: annualFeeCard === cid ? 700 : 400,
                    cursor: "pointer", borderRadius: 0,
                  }}
                >
                  {cp && <ProgramLogo prog={cp} size={16} />}
                  {cp?.name || cid}
                </button>
              );
            })}
          </div>

          {cardData && (
            <>
              {/* Net value summary */}
              <div style={{ background: netValue >= 0 ? css.successBg : css.warningBg, border: `1px solid ${netValue >= 0 ? css.success : css.warning}`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: netValue >= 0 ? css.success : css.warning, marginBottom: 6 }}>
                    {netValue >= 0 ? "Card is paying for itself" : "Card is costing you"}
                  </div>
                  <div style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: 38, fontWeight: 600, color: css.text, lineHeight: 1 }}>
                    {netValue >= 0 ? "+" : ""}{netValue < 0 ? `-$${Math.abs(netValue).toLocaleString()}` : `$${netValue.toLocaleString()}`}
                    <span style={{ fontSize: 16, color: css.text3, marginLeft: 8, fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontWeight: 400 }}>net value</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: css.text2, textAlign: "right" }}>
                  <div>Benefits used: <strong style={{ color: css.text }}>${usedValue.toLocaleString()}</strong></div>
                  <div>Annual fee: <strong style={{ color: css.text }}>−${cardData.annualFee.toLocaleString()}</strong></div>
                </div>
              </div>

              {/* Benefits checklist */}
              <div style={{ background: css.surface, border: `1px solid ${css.border}`, padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: css.text3 }}>
                    Check off benefits you use · edit value to match what you actually get
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {cardData.benefits.map(benefit => {
                    const key = `${annualFeeCard}:${benefit.id}`;
                    const checked = !!checkedBenefits[key];
                    const customVal = customBenefitValues[key];
                    const isCustomized = customVal !== undefined && customVal !== "" && Number(customVal) !== benefit.value;
                    return (
                      <div
                        key={benefit.id}
                        className="c-row-hover"
                        onClick={() => setCheckedBenefits(prev => ({ ...prev, [key]: !prev[key] }))}
                        style={{
                          display: "flex", alignItems: "center", gap: 14, padding: "12px 10px",
                          cursor: "pointer", borderBottom: `1px solid ${css.surface2}`,
                          background: checked ? (D ? "rgba(61,184,122,0.05)" : "rgba(61,184,122,0.04)") : "transparent",
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 18, height: 18, border: `2px solid ${checked ? css.success : css.border}`,
                          background: checked ? css.success : "transparent", display: "flex",
                          alignItems: "center", justifyContent: "center", flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}>
                          {checked && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
                        </div>
                        {/* Label + note */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: css.text }}>{benefit.name}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: catColors[benefit.cat] || css.text3, opacity: 0.8 }}>{benefit.cat}</span>
                          </div>
                          <div style={{ fontSize: 11, color: css.text3, marginTop: 2, lineHeight: 1.4 }}>{benefit.note}</div>
                        </div>
                        {/* Editable value */}
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, gap: 2 }}
                        >
                          <div style={{ display: "flex", alignItems: "center", border: `1px solid ${isCustomized ? css.accent : css.border}`, background: css.surface2, transition: "border-color 0.15s" }}>
                            <span style={{ padding: "4px 0 4px 8px", fontSize: 13, fontWeight: 600, color: checked ? css.success : css.text3 }}>$</span>
                            <input
                              type="number"
                              min="0"
                              value={customVal !== undefined ? customVal : benefit.value}
                              onChange={e => setCustomBenefitValues(prev => ({ ...prev, [key]: e.target.value }))}
                              style={{
                                width: 64, padding: "4px 8px 4px 2px", border: "none", outline: "none",
                                background: "transparent", fontSize: 13, fontWeight: 600,
                                color: checked ? css.success : css.text3,
                                fontFamily: "'Instrument Sans', 'Outfit', sans-serif", textAlign: "right",
                              }}
                            />
                          </div>
                          {isCustomized && (
                            <button
                              onClick={() => setCustomBenefitValues(prev => { const n = { ...prev }; delete n[key]; return n; })}
                              style={{ fontSize: 10, color: css.text3, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Instrument Sans', 'Outfit', sans-serif", lineHeight: 1 }}
                            >
                              reset (${benefit.value})
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${css.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    onClick={() => {
                      const allKeys = cardData.benefits.reduce((acc, b) => {
                        acc[`${annualFeeCard}:${b.id}`] = true;
                        return acc;
                      }, {});
                      setCheckedBenefits(prev => ({ ...prev, ...allKeys }));
                    }}
                    style={{ fontSize: 12, color: css.accent, background: "none", border: "none", cursor: "pointer", fontFamily: "'Instrument Sans', 'Outfit', sans-serif", padding: 0 }}
                  >
                    Check all
                  </button>
                  <button
                    onClick={() => {
                      const cleared = cardData.benefits.reduce((acc, b) => {
                        acc[`${annualFeeCard}:${b.id}`] = false;
                        return acc;
                      }, {});
                      setCheckedBenefits(prev => ({ ...prev, ...cleared }));
                    }}
                    style={{ fontSize: 12, color: css.text3, background: "none", border: "none", cursor: "pointer", fontFamily: "'Instrument Sans', 'Outfit', sans-serif", padding: 0 }}
                  >
                    Clear all
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      );
    };

    // ── Main Insights layout ──────────────────────────────────────
    const activeTab = _previewTab ?? insightTab;
    const subContent =
      activeTab === "countdown"  ? renderCountdown()  :
      activeTab === "expiration" ? renderExpiration() :
      activeTab === "redemption" ? renderRedemption() :
      activeTab === "transfer"   ? renderTransfer()   :
                                   renderAnnualFee();

    // Preview mode: return raw sub-content for nav thumbnail
    if (_previewTab !== null) return subContent;

    return (
      <div>
        {/* Header */}
        <div className="c-a1" style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: css.accent, marginBottom: 8 }}>Intelligence Layer</div>
          <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 28 : 38, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>Insights</h2>
          <p style={{ color: css.text2, fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>Track your qualification runway, protect expiring miles, and maximize every point you have.</p>
        </div>

        {/* Sub-tab bar — desktop only (mobile uses header strip) */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${css.border}`, marginBottom: 24 }}>
            {INSIGHT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setInsightTab(tab.id)}
                style={{
                  padding: "10px 18px", border: "none", cursor: "pointer", background: "transparent",
                  borderBottom: activeTab === tab.id ? `2px solid ${css.accent}` : "2px solid transparent",
                  color: activeTab === tab.id ? css.accent : css.text3,
                  fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                  fontFamily: "'Instrument Sans', 'Outfit', sans-serif",
                  display: "flex", alignItems: "center", gap: 6, marginBottom: -1,
                }}
              >
                {tab.label}
                {tab.tier === "premium" && !isPremium && (
                  <span style={{ fontSize: 9, background: css.goldBg, color: css.gold, padding: "1px 5px", fontWeight: 700, border: `1px solid ${D ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.3)"}` }}>PRO</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="c-a2">
          {subContent}
        </div>
      </div>
    );
  };

