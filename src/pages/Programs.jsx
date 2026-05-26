import React from "react";
import { LOYALTY_PROGRAMS } from "../constants/programs";
import ProgramCards from "../components/ProgramCards";
import ScannerCardStream from "../components/ScannerCardStream";

export function renderPrograms(s, _previewSub = null) {
  const { css, isMobile, darkMode, user, linkedAccounts, setLinkedAccounts, supabase,
    progAddType, setProgAddType, progAddId, setProgAddId, progAddTier, setProgAddTier,
    ProgramLogo, expandedCardId, setExpandedCardId,
    cardBenefitValues, setCardBenefitValue, cardCustomBenefits, addCustomBenefit, updateCustomBenefit, removeCustomBenefit,
    getCardNetValue, showConfirm } = s;
  const D = darkMode;

  const dv = {
    bone: D ? "#1a1a1a" : "#fff",
    paper: D ? "#222" : "#fff",
    cream: D ? "rgba(255,255,255,0.08)" : "#E2DCCE",
    stone: D ? "#8a8a8a" : "#857A66",
    taupe: D ? "#999" : "#6B6458",
    graphite: D ? "#111" : "#2C2A26",
    ink: D ? "#f0ece6" : "#15130F",
    accent: "#C8553D",
    moss: "#6B7A5A",
    gold: "#B8924A",
    rose: "#C8553D",
    serif: "'Fraunces', 'Instrument Serif', Georgia, serif",
    sans: "'Inter Tight', 'Instrument Sans', sans-serif",
    mono: "'JetBrains Mono', 'Geist Mono', monospace",
  };

  const allAirlines = LOYALTY_PROGRAMS.airlines;
  const allHotels = LOYALTY_PROGRAMS.hotels;
  const allCards = LOYALTY_PROGRAMS.creditCards;
  const linkedCount = Object.keys(linkedAccounts).length;

  const linkedAirlines = allAirlines.filter(p => linkedAccounts[p.id]);
  const linkedHotels = allHotels.filter(p => linkedAccounts[p.id]);
  const linkedCards = allCards.filter(p => linkedAccounts[p.id]);

  // Card economics
  let totalFees = 0, totalBenefits = 0, totalNet = 0;
  linkedCards.forEach(c => {
    const r = getCardNetValue(c.id) || {};
    totalFees += (r.fee || 0);
    totalBenefits += (r.total || 0);
    totalNet += (r.net || 0);
  });

  const addProgram = async (type, programId, tier) => {
    if (!programId) return;
    const now = new Date().toISOString();
    setLinkedAccounts(prev => ({
      ...prev,
      [programId]: { ...(prev[programId] || {}), memberId: prev[programId]?.memberId || "", currentTier: tier || "", updatedAt: now },
    }));
    if (user) {
      await supabase.from("linked_accounts").upsert({
        user_id: user.id, program_id: programId, member_id: linkedAccounts[programId]?.memberId || "",
        current_tier: tier || "", tier_credits: 0, points_balance: 0, current_nights: 0, current_rentals: 0, updated_at: now,
      }, { onConflict: "user_id,program_id" });
    }
  };
  const removeProgram = (programId) => {
    showConfirm("Remove this program from your account?", async () => {
      setLinkedAccounts(prev => { const n = { ...prev }; delete n[programId]; return n; });
      if (user) await supabase.from("linked_accounts").delete().eq("user_id", user.id).eq("program_id", programId);
    });
  };

  const addType = progAddType;
  const setAddType = (v) => { setProgAddType(v); setProgAddId(""); setProgAddTier(""); };
  const addProgramId = progAddId;
  const setAddProgramId = (v) => { setProgAddId(v); setProgAddTier(""); };
  const addTier = progAddTier;
  const setAddTier = setProgAddTier;
  const programOptions = addType === "airline" ? allAirlines : addType === "hotel" ? allHotels : allCards;
  const selectedProg = programOptions.find(p => p.id === addProgramId);
  const tierOptions = selectedProg?.tiers || [];

  const handleAdd = () => {
    if (!addProgramId) return;
    addProgram(addType, addProgramId, addType === "card" ? "" : addTier);
    setProgAddId(""); setProgAddTier("");
  };

  const fmtMoney = (n) => Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // ─── METRICS ───
  const metrics = [
    { lbl: "Airlines", val: String(linkedAirlines.length), sub: linkedAirlines.length === 0 ? "Add a frequent flyer status." : "Tracked across alliances." },
    { lbl: "Hotels", val: String(linkedHotels.length), sub: linkedHotels.length === 0 ? "Bonvoy, Hilton, Hyatt and more." : "Status & nights logged." },
    { lbl: "Credit Cards", val: String(linkedCards.length), sub: linkedCards.length === 0 ? "Track benefit value vs annual fee." : `$${fmtMoney(totalFees)}/yr in fees.` },
    {
      lbl: "Net Card Value · YTD",
      val: linkedCards.length === 0 ? "—" : `${totalNet >= 0 ? "+" : "−"}$${fmtMoney(totalNet)}`,
      sub: linkedCards.length === 0 ? "Add cards to compute." : `$${fmtMoney(totalBenefits)} captured.`,
      tone: totalNet >= 0 ? "moss" : "rose",
    },
  ];

  return (
    <div style={{ fontFamily: dv.sans, color: dv.ink }}>
      {/* ── Hero banner ── */}
      <div style={{ margin: isMobile ? "0 -16px 0" : "0 -40px 0", position: "relative", height: isMobile ? 200 : 320, overflow: "hidden", background: "#2C2A26" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/programsPicture.jpeg')", backgroundSize: "cover", backgroundPosition: "center", filter: "saturate(0.85) contrast(1.05)", animation: "kenburns 24s ease-in-out infinite alternate" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${D ? "rgba(15,15,15,0)" : "rgba(244,241,236,0)"} 55%, ${D ? "rgba(15,15,15,0.9)" : "rgba(244,241,236,0.9)"} 90%, ${css.bg} 100%)`, zIndex: 1 }} />
        <div style={{ position: "absolute", top: 18, left: isMobile ? 16 : 48, zIndex: 3, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#F4F1EC", opacity: 0.85 }}>
          <span style={{ color: css.accent }}>&#9679; </span>Continuum
        </div>
      </div>

      {/* ─── PAGE HEAD ─── */}
      <div style={{ marginTop: -20, marginBottom: 36, position: "relative", zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: dv.accent }}>
          <div style={{ width: 32, height: 1, background: dv.accent }} />
          Loyalty · Programs §06
        </div>
        <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 30 : "clamp(56px, 8vw, 88px)", fontWeight: 300, lineHeight: isMobile ? 1.05 : 0.94, letterSpacing: "-0.03em", color: dv.ink, margin: 0 }}>
          Programs<em style={{ fontStyle: "italic", color: dv.accent, fontWeight: 400 }}>.</em>
        </h1>
        <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: isMobile ? 15 : 18, color: dv.taupe, marginTop: 16, marginBottom: 0, lineHeight: 1.45, maxWidth: 540 }}>
          Your loyalty footprint — airlines, hotels, and cards in one ledger, with a running tally of what each one returns.
        </p>
      </div>

      {/* ─── METRICS BAND ─── */}
      <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 0, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, marginBottom: 40 }}>
        {metrics.map((m, i) => {
          const valColor = m.tone === "moss" ? dv.moss : m.tone === "rose" ? dv.rose : dv.ink;
          return (
            <div key={i} style={{
              padding: isMobile ? "20px 18px" : "26px 28px",
              borderRight: !isMobile && i < metrics.length - 1 ? `1px solid ${dv.cream}` : "none",
              borderBottom: isMobile && i < 2 ? `1px solid ${dv.cream}` : "none",
              borderRightWidth: isMobile && i % 2 === 0 ? 1 : 0,
              borderRightStyle: "solid", borderRightColor: dv.cream,
            }}>
              <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 12 }}>{m.lbl}</div>
              <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 28 : 38, fontWeight: 300, lineHeight: 1, letterSpacing: "-0.03em", color: valColor, fontVariantNumeric: "tabular-nums" }}>{m.val}</div>
              <div style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13, color: dv.taupe, marginTop: 8, lineHeight: 1.4 }}>{m.sub}</div>
            </div>
          );
        })}
      </section>

      {/* ─── ADD PROGRAM ─── */}
      <SectionSep dv={dv} num="§ 1" title="Add a program" rule />
      <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: isMobile ? "20px 18px" : "26px 28px", marginBottom: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : addType === "card" ? "1fr 2fr auto" : "1fr 2fr 1fr auto", gap: 14, alignItems: "end" }}>
          <Field dv={dv} label="Type">
            <select value={addType} onChange={e => { setAddType(e.target.value); }} style={selectStyle(dv)}>
              <option value="airline">Airline</option>
              <option value="hotel">Hotel</option>
              <option value="card">Credit Card</option>
            </select>
          </Field>
          <Field dv={dv} label="Program">
            <select value={addProgramId} onChange={e => { setAddProgramId(e.target.value); }} style={selectStyle(dv)}>
              <option value="">{addType === "card" ? "Select a credit card…" : `Select a ${addType}…`}</option>
              {programOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          {addType !== "card" && (
            <Field dv={dv} label="Status level">
              <select value={addTier} onChange={e => setAddTier(e.target.value)} disabled={!addProgramId || tierOptions.length === 0} style={{ ...selectStyle(dv), opacity: (!addProgramId || tierOptions.length === 0) ? 0.45 : 1 }}>
                <option value="">Member (base)</option>
                {tierOptions.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
            </Field>
          )}
          <button onClick={handleAdd} disabled={!addProgramId} style={{
            padding: "13px 26px", border: "none",
            background: addProgramId ? dv.ink : dv.cream,
            color: addProgramId ? dv.bone : dv.taupe,
            fontFamily: dv.serif, fontSize: 15, fontWeight: 400, letterSpacing: "-0.005em",
            cursor: addProgramId ? "pointer" : "default", transition: "background 0.25s",
            display: "inline-flex", alignItems: "center", gap: 10, justifyContent: "center",
          }}
            onMouseEnter={e => { if (addProgramId) e.currentTarget.style.background = dv.accent; }}
            onMouseLeave={e => { if (addProgramId) e.currentTarget.style.background = dv.ink; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add
          </button>
        </div>
      </div>

      {/* ─── ALL PROGRAMS · one scanning stream ─── */}
      {(linkedAirlines.length + linkedHotels.length + linkedCards.length) > 0 && (() => {
        const all = [...linkedAirlines, ...linkedHotels, ...linkedCards];
        const cardIds = new Set(linkedCards.map(p => p.id));
        const saveTier = (progId, tier) => {
          setLinkedAccounts(prev => ({ ...prev, [progId]: { ...prev[progId], currentTier: tier } }));
          if (user) supabase.from("linked_accounts").upsert({ user_id: user.id, program_id: progId, current_tier: tier, member_id: linkedAccounts[progId]?.memberId || "", updated_at: new Date().toISOString() }, { onConflict: "user_id,program_id" });
        };
        return (
          <>
            <SectionSep dv={dv} num="§ 2" title="Your wallet" count={all.length} rule />
            <ScannerCardStream programs={all} ProgramLogo={ProgramLogo} isMobile={isMobile} D={D} cardIds={cardIds} linkedAccounts={linkedAccounts} onCardClick={(prog) => setExpandedCardId(prog.id)} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 4, marginBottom: 36, flexWrap: "wrap" }}>
              <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.stone }}>Tap a card to set tier, benefits or remove.</div>
              <button onClick={() => setExpandedCardId("__list__")} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 100, border: `1px solid ${dv.cream}`, background: dv.bone, color: dv.ink, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = dv.stone; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3.5" cy="6" r="0.5" /><circle cx="3.5" cy="12" r="0.5" /><circle cx="3.5" cy="18" r="0.5" /></svg>
                View list
              </button>
            </div>
            {expandedCardId && all.some(p => p.id === expandedCardId) && (() => {
              const prog = all.find(p => p.id === expandedCardId);
              const isCard = cardIds.has(prog.id);
              const close = () => setExpandedCardId(null);
              const cardNet = isCard ? getCardNetValue(prog.id) : null;
              const values = isCard ? (cardBenefitValues[prog.id] || {}) : {};
              const netColor = cardNet && cardNet.net >= 0 ? dv.moss : dv.rose;
              return (
                <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}>
                  <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 540, maxHeight: isMobile ? "88vh" : "86vh", overflowY: "auto", background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`, borderRadius: isMobile ? "18px 18px 0 0" : 16, boxShadow: "0 24px 70px rgba(0,0,0,0.4)" }}>
                    <div style={{ position: "sticky", top: 0, background: dv.bone, borderBottom: `1px solid ${dv.cream}`, padding: isMobile ? "16px 18px" : "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{ width: 38, height: 38, display: "grid", placeItems: "center", background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, borderRadius: 9 }}><ProgramLogo prog={prog} size={24} /></div>
                        <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 19 : 22, color: dv.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prog.name}</div>
                      </div>
                      <button onClick={close} style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 8, border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe, cursor: "pointer", display: "grid", placeItems: "center" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ padding: isMobile ? "16px 18px 22px" : "18px 22px 24px" }}>
                      {!isCard && (
                        <div>
                          <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>Status tier</div>
                          <select value={linkedAccounts[prog.id]?.currentTier || ""} onChange={e => saveTier(prog.id, e.target.value)} style={{ width: "100%", padding: "11px 36px 11px 14px", borderRadius: 10, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, color: dv.ink, fontSize: 14, fontFamily: dv.sans, cursor: "pointer", outline: "none", appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236B6458' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
                            <option value="">Member · base</option>
                            {(prog.tiers || []).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                          </select>
                        </div>
                      )}
                      {isCard && cardNet && (
                        <>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe }}>Net value · YTD</span>
                            <span style={{ fontFamily: dv.serif, fontSize: 20, color: netColor, fontVariantNumeric: "tabular-nums" }}>{cardNet.net >= 0 ? "+" : "−"}${Math.abs(cardNet.net)}</span>
                          </div>
                          <CardBenefitsPanel
                            dv={dv} isMobile={isMobile} prog={prog} values={values}
                            customs={cardCustomBenefits[prog.id] || []}
                            total={cardNet.total} fee={cardNet.fee} net={cardNet.net} netColor={netColor}
                            setCardBenefitValue={setCardBenefitValue}
                            addCustomBenefit={addCustomBenefit}
                            updateCustomBenefit={updateCustomBenefit}
                            removeCustomBenefit={removeCustomBenefit}
                          />
                        </>
                      )}
                      <button onClick={() => { close(); removeProgram(prog.id); }} style={{ marginTop: 18, width: "100%", padding: "12px 0", borderRadius: 10, border: `1px solid rgba(200,85,61,0.3)`, background: "rgba(200,85,61,0.06)", color: dv.rose, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>Remove from wallet</button>
                    </div>
                  </div>
                </div>
              );
            })()}
            {expandedCardId === "__list__" && (() => {
              const close = () => setExpandedCardId(null);
              const groups = [
                { title: "Airlines", items: linkedAirlines },
                { title: "Hotels", items: linkedHotels },
                { title: "Credit cards", items: linkedCards },
              ].filter(g => g.items.length > 0);
              return (
                <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}>
                  <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, maxHeight: isMobile ? "88vh" : "86vh", overflowY: "auto", background: dv.bone, border: `1px solid ${dv.cream}`, borderRadius: isMobile ? "18px 18px 0 0" : 16, boxShadow: "0 24px 70px rgba(0,0,0,0.4)" }}>
                    <div style={{ position: "sticky", top: 0, background: dv.bone, borderBottom: `1px solid ${dv.cream}`, padding: isMobile ? "16px 18px" : "18px 22px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe, marginBottom: 3 }}>Your wallet · {all.length} {all.length === 1 ? "entry" : "entries"}</div>
                        <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 22 : 26, color: dv.ink, fontWeight: 500, letterSpacing: "-0.01em" }}>All programs</div>
                      </div>
                      <button onClick={close} style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe, cursor: "pointer", display: "grid", placeItems: "center" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                    <div style={{ padding: isMobile ? "12px 18px 22px" : "14px 22px 24px" }}>
                      {groups.map(g => (
                        <div key={g.title} style={{ marginBottom: 18 }}>
                          <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.stone, marginBottom: 10 }}>{g.title} · {g.items.length}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {g.items.map(prog => {
                              const tier = linkedAccounts[prog.id]?.currentTier;
                              const isCard = cardIds.has(prog.id);
                              return (
                                <button key={prog.id} onClick={() => setExpandedCardId(prog.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, border: `1px solid ${dv.cream}`, background: dv.paper, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "border-color 0.15s" }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = dv.stone; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = dv.cream; }}>
                                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "#fff", border: `1px solid ${dv.cream}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                                    <ProgramLogo prog={prog} size={22} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontFamily: dv.serif, fontSize: 15, color: dv.ink, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prog.name}</div>
                                    <div style={{ fontFamily: dv.mono, fontSize: 10, color: dv.taupe, marginTop: 4, letterSpacing: "0.04em" }}>
                                      {isCard ? (prog.annualFee ? `$${prog.annualFee}/yr fee` : "No annual fee") : (tier || "Member · base")}
                                    </div>
                                  </div>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={dv.stone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        );
      })()}

      {linkedCount === 0 && (
        <div style={{ padding: "60px 28px", textAlign: "center", background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}` }}>
          <h3 style={{ fontFamily: dv.serif, fontSize: 24, fontWeight: 400, color: dv.ink, margin: 0, letterSpacing: "-0.01em" }}>An empty ledger.</h3>
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 14, marginTop: 8, marginBottom: 0 }}>
            Use the form above to add your first airline, hotel, or card program.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── helpers ───
function SectionSep({ dv, num, title, count, rule }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 18px", fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: dv.taupe }}>
      <div style={{ width: 28, height: 1, background: dv.accent }} />
      <strong style={{ color: dv.ink, fontWeight: 500 }}>{num} · {title}</strong>
      {count != null && (
        <span style={{ color: dv.accent, background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, padding: "2px 8px" }}>
          {String(count)} {count === 1 ? "entry" : "entries"}
        </span>
      )}
      {rule && <div style={{ flex: 1, height: 1, background: dv.cream }} />}
    </div>
  );
}

function Field({ dv, label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe, marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

function selectStyle(dv) {
  return {
    width: "100%", padding: "11px 14px", background: dv.bone,
    border: `1px solid ${dv.cream}`, color: dv.ink, fontSize: 13,
    fontFamily: dv.sans, cursor: "pointer", outline: "none",
    appearance: "none", WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6458' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36,
  };
}

function ProgramLedger({ dv, children }) {
  return (
    <div style={{ background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}`, marginBottom: 40 }}>
      {children}
    </div>
  );
}

function ProgramRow({ dv, isMobile, idx, last, prog, ProgramLogo, tierName, onTierChange, onRemove }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "32px auto 1fr auto auto" : "36px auto 1fr auto auto",
      gap: isMobile ? 10 : 18, alignItems: "center",
      padding: isMobile ? "16px 16px" : "18px 28px",
      borderBottom: last ? "none" : `1px solid ${dv.cream}`,
      background: idx % 2 === 1 ? "rgba(226,220,206,0.18)" : "transparent",
      transition: "background 0.25s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = dv.bone}
      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? "rgba(226,220,206,0.18)" : "transparent"}>
      <span style={{ fontFamily: dv.mono, fontSize: 11, color: dv.stone, letterSpacing: "0.08em" }}>{String(idx + 1)}</span>
      <div style={{ width: 32, height: 32, display: "grid", placeItems: "center", background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}` }}>
        <ProgramLogo prog={prog} size={20} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 16 : 18, fontWeight: 400, color: dv.ink, lineHeight: 1.15, letterSpacing: "-0.005em" }}>{prog.name}</div>
        <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.04em", color: dv.taupe, marginTop: 4 }}>
          {tierName ? <span style={{ color: dv.accent, fontWeight: 500 }}>{tierName}</span> : <em style={{ fontStyle: "italic" }}>Member · base</em>}
        </div>
      </div>
      <select value={tierName || ""} onChange={e => onTierChange(e.target.value)} style={{
        padding: "7px 32px 7px 12px", background: dv.bone, borderRadius: 12, border: `1px solid ${dv.cream}`,
        color: dv.ink, fontSize: 12, fontFamily: dv.sans, cursor: "pointer", outline: "none",
        appearance: "none", WebkitAppearance: "none",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236B6458' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
      }}>
        <option value="">Member</option>
        {(prog.tiers || []).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
      </select>
      <button onClick={onRemove} title="Remove" style={{
        width: 30, height: 30, border: `1px solid ${dv.cream}`, background: "transparent",
        color: dv.taupe, display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.25s",
      }}
        onMouseEnter={e => { e.currentTarget.style.color = dv.rose; e.currentTarget.style.borderColor = dv.rose; }}
        onMouseLeave={e => { e.currentTarget.style.color = dv.taupe; e.currentTarget.style.borderColor = dv.cream; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>
  );
}

function CardBenefitsPanel({ dv, isMobile, prog, values, customs, total, fee, net, netColor, setCardBenefitValue, addCustomBenefit, updateCustomBenefit, removeCustomBenefit }) {
  const hasBenefits = (prog.benefits || []).length > 0;
  return (
    <div style={{ padding: isMobile ? "16px 16px 22px" : "10px 28px 26px", borderTop: `1px solid ${dv.cream}`, background: dv.bone }}>
      {hasBenefits && (
        <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 13, marginTop: 16, marginBottom: 14, lineHeight: 1.5 }}>
          Enter the dollar value you actually received from each benefit this year. The face value is shown for reference.
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {(prog.benefits || []).map(b => {
          const v = values[b.id];
          return (
            <div key={b.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "center", padding: "10px 14px", background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}` }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: dv.serif, fontSize: 14, color: dv.ink, fontWeight: 400, letterSpacing: "-0.005em" }}>{b.label}</div>
                <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.04em", color: dv.taupe, marginTop: 3 }}>
                  {b.maxValue > 0 ? `Face value up to $${b.maxValue}` : "Variable / perk value"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: dv.mono, fontSize: 12, color: dv.stone }}>$</span>
                <input
                  type="number" inputMode="decimal" min="0"
                  value={v == null ? "" : v}
                  placeholder="0"
                  onChange={e => setCardBenefitValue(prog.id, b.id, e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ width: 84, padding: "7px 10px", border: `1px solid ${dv.cream}`, background: dv.bone, color: dv.ink, fontSize: 13, fontFamily: dv.mono, textAlign: "right", outline: "none" }}
                />
                {b.maxValue > 0 && (
                  <button onClick={() => setCardBenefitValue(prog.id, b.id, b.maxValue)} title="Fill with face value" style={{
                    padding: "5px 10px", border: `1px solid ${dv.cream}`, background: "transparent",
                    color: dv.taupe, fontFamily: dv.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = dv.ink; e.currentTarget.style.borderColor = dv.ink; }}
                    onMouseLeave={e => { e.currentTarget.style.color = dv.taupe; e.currentTarget.style.borderColor = dv.cream; }}
                  >Max</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom benefits */}
      <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px dashed ${dv.cream}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: dv.taupe }}>Other benefits</span>
          <button onClick={() => addCustomBenefit(prog.id)} style={{
            padding: "5px 12px", border: `1px solid ${dv.accent}`, background: "transparent",
            color: dv.accent, fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
            cursor: "pointer", transition: "all 0.25s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = dv.accent; e.currentTarget.style.color = dv.bone; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = dv.accent; }}
          >+ Add</button>
        </div>
        {customs.length === 0 && (
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", color: dv.taupe, fontSize: 13, margin: "4px 0", lineHeight: 1.5 }}>
            Add card-specific perks (Points Boost, category multipliers, hidden ones) with a label and dollar value.
          </p>
        )}
        {customs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {customs.map(cb => (
              <div key={cb.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center", padding: "10px 14px", background: dv.paper, borderRadius: 12, border: `1px solid ${dv.cream}` }}>
                <input type="text" value={cb.label} placeholder="e.g. Points Boost on redemptions"
                  onChange={e => updateCustomBenefit(prog.id, cb.id, { label: e.target.value })}
                  style={{ minWidth: 0, padding: "7px 10px", border: `1px solid ${dv.cream}`, background: dv.bone, color: dv.ink, fontSize: 13, fontFamily: dv.sans, outline: "none" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: dv.mono, fontSize: 12, color: dv.stone }}>$</span>
                  <input type="number" inputMode="decimal" min="0"
                    value={cb.value == null ? "" : cb.value} placeholder="0"
                    onChange={e => updateCustomBenefit(prog.id, cb.id, { value: e.target.value === "" ? "" : Number(e.target.value) })}
                    style={{ width: 80, padding: "7px 10px", border: `1px solid ${dv.cream}`, background: dv.bone, color: dv.ink, fontSize: 13, fontFamily: dv.mono, textAlign: "right", outline: "none" }}
                  />
                </div>
                <button onClick={() => removeCustomBenefit(prog.id, cb.id)} title="Remove" style={{
                  width: 28, height: 28, border: `1px solid ${dv.cream}`, background: "transparent",
                  color: dv.taupe, display: "grid", placeItems: "center", cursor: "pointer",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = dv.rose; e.currentTarget.style.borderColor = dv.rose; }}
                  onMouseLeave={e => { e.currentTarget.style.color = dv.taupe; e.currentTarget.style.borderColor = dv.cream; }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      <div style={{ marginTop: 18, paddingTop: 16, borderTop: `2px double ${dv.ink}`, display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dv.taupe }}>
          <span style={{ color: dv.moss, fontWeight: 500 }}>+${total}</span>
          <span style={{ color: dv.stone, margin: "0 8px" }}>−</span>
          <span style={{ color: dv.rose, fontWeight: 500 }}>${fee}</span>
          <span style={{ color: dv.stone, margin: "0 8px" }}>=</span>
          <span style={{ color: dv.ink, fontWeight: 500 }}>net for the year</span>
        </div>
        <div style={{ fontFamily: dv.serif, fontSize: 22, fontWeight: 400, color: netColor, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>
          {net >= 0 ? "+" : "−"}${Math.abs(net)}
        </div>
      </div>
    </div>
  );
}
