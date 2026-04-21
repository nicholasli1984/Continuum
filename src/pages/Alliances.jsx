import React from "react";
import { ALLIANCE_MBR, ALLIANCE_LABELS, ALLIANCE_TIER_LABELS, ALLIANCE_TIER_COLORS, BENEFIT_ROWS, HOME_BENEFITS, RECIP_BENEFITS } from "../constants/benefits";
import { LOYALTY_PROGRAMS } from "../constants/programs";
export function renderAlliances(s) {
  const { css, isMobile, darkMode, user, linkedAccounts, allPrograms, ProgramLogo } = s;
  const D = darkMode;
    const lp = {
      bg: "#08090a", surface: "#0f1012", surface2: "#17191d",
      border: "#1e2028", border2: "#2a2640",
      text: "#f7f8f8", text2: "#d0d6e0", dim: "#8a8f98",
      teal: "#0EA5A0", tealDim: "rgba(14,165,160,0.10)", tealBord: "rgba(14,165,160,0.22)",
      mono: "'Space Mono','JetBrains Mono',monospace", sans: "'DM Sans','Outfit',sans-serif",
      red: "#e05252", green: "#3ecf8e", yellow: "#f5a623",
    };
    const st = { color: lp.text, fontFamily: lp.sans };

    // Determine user's elite tier from selected program via projected status, with manual override
    const myStatus = getProjectedStatus(allianceMyProgram);
    const myEliteLevel = allianceMyTierOverride || myStatus?.currentTier?.name || null;
    const myAllianceMeta = ALLIANCE_MBR[allianceMyProgram];
    const myAllianceTierKey = myAllianceMeta && myEliteLevel ? myAllianceMeta.tierMap[myEliteLevel] : null;
    const availableTiers = Object.keys(myAllianceMeta?.tierMap || {});
    const myHomeBenefits = HOME_BENEFITS[allianceMyProgram]?.[myEliteLevel] || null;

    // Compare program — only show reciprocal benefits if same alliance
    const cmpAllianceMeta = ALLIANCE_MBR[allianceCompare];
    const myAlliance = myAllianceMeta?.alliance;
    const cmpAlliance = cmpAllianceMeta?.alliance;
    const sameAlliance = !!(myAlliance && cmpAlliance && myAlliance === cmpAlliance);
    const cmpTierKey = sameAlliance ? myAllianceTierKey : null;
    const cmpRecipBenefits = cmpTierKey ? RECIP_BENEFITS[cmpTierKey] : null;

    const compareOptions = Object.entries(ALLIANCE_MBR)
      .filter(([id]) => id !== allianceMyProgram)
      .map(([id, meta]) => ({ id, meta }));

    // Program display names
    const PROG_NAMES = {
      aa: "American Airlines AAdvantage", ua: "United MileagePlus", dl: "Delta SkyMiles",
      aeroplan: "Air Canada Aeroplan", singapore_kf: "Singapore KrisFlyer",
      turkish_miles: "Turkish Miles&Smiles", ba_avios: "British Airways Avios",
      qantas_ff: "Qantas Frequent Flyer", cathay_mp: "Cathay Pacific Marco Polo",
      flying_blue: "Air France/KLM Flying Blue",
    };

    // Group BENEFIT_ROWS by category
    const cats = [...new Set(BENEFIT_ROWS.map(r => r.cat))];

    const Cell = ({ ben }) => {
      if (!ben) return (
        <td style={{ padding: "10px 14px", borderBottom: `1px solid ${lp.border}`, color: lp.dim, fontFamily: lp.mono, fontSize: 12 }}>—</td>
      );
      return (
        <td style={{ padding: "10px 14px", borderBottom: `1px solid ${lp.border}`, verticalAlign: "top" }}>
          <div style={{ fontFamily: lp.mono, fontSize: 12, fontWeight: 700, color: ben.ok ? lp.green : lp.text2 }}>{ben.v}</div>
          {ben.d && <div style={{ fontFamily: lp.sans, fontSize: 11, color: lp.dim, marginTop: 3, lineHeight: 1.4 }}>{ben.d}</div>}
        </td>
      );
    };

    const noStatus = !myHomeBenefits;

    return (
      <div style={{ ...st }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: lp.mono, fontSize: 11, letterSpacing: 2, color: lp.teal, marginBottom: 8, textTransform: "uppercase" }}>Airline Alliances</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: lp.text, letterSpacing: -0.5 }}>Elite Status Comparison</h1>
          <p style={{ margin: "6px 0 0", color: lp.dim, fontSize: 14 }}>Compare your current home-carrier benefits against reciprocal benefits on a partner airline.</p>
        </div>

        {/* Selectors row */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
          {/* My Program */}
          <div style={{ flex: 1, minWidth: 220, background: lp.surface, border: `1px solid ${lp.border}`, padding: "16px 20px" }}>
            <div style={{ fontFamily: lp.mono, fontSize: 10, letterSpacing: 1.5, color: lp.teal, marginBottom: 8, textTransform: "uppercase" }}>My Program</div>
            <select
              value={allianceMyProgram}
              onChange={e => { setAllianceMyProgram(e.target.value); setAllianceMyTierOverride(null); }}
              style={{ width: "100%", background: lp.surface2, border: `1px solid ${lp.border2}`, color: lp.text, padding: "8px 10px", fontFamily: lp.mono, fontSize: 12, outline: "none" }}
            >
              {Object.entries(PROG_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            {availableTiers.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontFamily: lp.mono, fontSize: 10, letterSpacing: 1, color: lp.dim, marginBottom: 5, textTransform: "uppercase" }}>Membership Tier</div>
                <select
                  value={allianceMyTierOverride || (myStatus?.currentTier?.name || "")}
                  onChange={e => setAllianceMyTierOverride(e.target.value || null)}
                  style={{ width: "100%", background: lp.surface2, border: `1px solid ${lp.border2}`, color: lp.text, padding: "8px 10px", fontFamily: lp.mono, fontSize: 12, outline: "none" }}
                >
                  <option value="">— Select tier —</option>
                  {availableTiers.map(tier => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>
            )}
            {myEliteLevel && myAllianceTierKey && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, background: ALLIANCE_TIER_COLORS[myAllianceTierKey] }} />
                <span style={{ fontFamily: lp.mono, fontSize: 11, color: lp.text2 }}>{myEliteLevel} → {ALLIANCE_TIER_LABELS[myAllianceTierKey]}</span>
              </div>
            )}
            {myEliteLevel && !myAllianceTierKey && (
              <div style={{ marginTop: 10, fontFamily: lp.mono, fontSize: 11, color: lp.yellow }}>No alliance tier mapped for "{myEliteLevel}"</div>
            )}
            {!myEliteLevel && (
              <div style={{ marginTop: 10, fontFamily: lp.mono, fontSize: 11, color: lp.dim }}>No elite status on file for this program</div>
            )}
          </div>

          {/* Compare airline */}
          <div style={{ flex: 1, minWidth: 220, background: lp.surface, border: `1px solid ${lp.border}`, padding: "16px 20px" }}>
            <div style={{ fontFamily: lp.mono, fontSize: 10, letterSpacing: 1.5, color: lp.teal, marginBottom: 8, textTransform: "uppercase" }}>Compare Partner Airline</div>
            <select
              value={allianceCompare}
              onChange={e => setAllianceCompare(e.target.value)}
              style={{ width: "100%", background: lp.surface2, border: `1px solid ${lp.border2}`, color: lp.text, padding: "8px 10px", fontFamily: lp.mono, fontSize: 12, outline: "none" }}
            >
              {compareOptions.map(({ id }) => (
                <option key={id} value={id}>{PROG_NAMES[id] || id}</option>
              ))}
            </select>
            {cmpAllianceMeta && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, background: cmpAllianceMeta.color }} />
                <span style={{ fontFamily: lp.mono, fontSize: 11, color: lp.text2 }}>{ALLIANCE_LABELS[cmpAllianceMeta.alliance] || cmpAllianceMeta.alliance}</span>
              </div>
            )}
          </div>

          {/* Alliance status badge */}
          {myAllianceTierKey && (
            <div style={{
              flex: 1, minWidth: 220, background: lp.surface, padding: "16px 20px",
              border: `1px solid ${sameAlliance ? lp.tealBord : lp.border}`,
              borderLeft: `3px solid ${sameAlliance ? ALLIANCE_TIER_COLORS[myAllianceTierKey] : lp.red}`,
            }}>
              <div style={{ fontFamily: lp.mono, fontSize: 10, letterSpacing: 1.5, color: sameAlliance ? lp.teal : lp.red, marginBottom: 8, textTransform: "uppercase" }}>
                {sameAlliance ? "Reciprocal Tier" : "No Reciprocal Benefits"}
              </div>
              {sameAlliance ? (
                <>
                  <div style={{ fontFamily: lp.mono, fontSize: 14, fontWeight: 700, color: ALLIANCE_TIER_COLORS[myAllianceTierKey] }}>{ALLIANCE_TIER_LABELS[myAllianceTierKey]}</div>
                  <div style={{ fontFamily: lp.sans, fontSize: 12, color: lp.dim, marginTop: 4 }}>
                    {PROG_NAMES[allianceCompare] || allianceCompare} will recognize you as <strong style={{ color: lp.text2 }}>{ALLIANCE_TIER_LABELS[myAllianceTierKey]}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: lp.mono, fontSize: 13, fontWeight: 700, color: lp.red }}>
                    {ALLIANCE_LABELS[myAlliance]} ≠ {ALLIANCE_LABELS[cmpAlliance] || cmpAlliance}
                  </div>
                  <div style={{ fontFamily: lp.sans, fontSize: 12, color: lp.dim, marginTop: 4 }}>
                    Your {ALLIANCE_LABELS[myAlliance]} status earns no reciprocal benefits on {PROG_NAMES[allianceCompare] || allianceCompare}. Select a {ALLIANCE_LABELS[myAlliance]} partner to see benefits.
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {noStatus && (
          <div style={{ background: lp.surface, border: `1px solid ${lp.border}`, padding: "20px 24px", marginBottom: 24, fontFamily: lp.mono, fontSize: 13, color: lp.yellow }}>
            No home benefits found for this program/tier combination. Link your loyalty account with an elite status level to see full comparison.
          </div>
        )}

        {/* Different alliance — no reciprocal benefits panel */}
        {!sameAlliance && myAlliance && cmpAlliance && (
          <div style={{ background: lp.surface, border: `1px solid ${lp.border}`, borderLeft: `4px solid ${lp.red}`, padding: "28px 32px", textAlign: "center" }}>
            <div style={{ fontFamily: lp.mono, fontSize: 28, marginBottom: 16 }}>✗</div>
            <div style={{ fontFamily: lp.mono, fontSize: 15, fontWeight: 700, color: lp.text, marginBottom: 10 }}>
              No Reciprocal Benefits
            </div>
            <div style={{ fontFamily: lp.sans, fontSize: 14, color: lp.dim, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              <strong style={{ color: lp.text2 }}>{PROG_NAMES[allianceMyProgram]}</strong> is a <strong style={{ color: ALLIANCE_TIER_COLORS[myAllianceTierKey] || lp.teal }}>{ALLIANCE_LABELS[myAlliance]}</strong> member.
              {" "}<strong style={{ color: lp.text2 }}>{PROG_NAMES[allianceCompare]}</strong> is a <strong style={{ color: lp.yellow }}>{ALLIANCE_LABELS[cmpAlliance]}</strong> member.
            </div>
            <div style={{ fontFamily: lp.sans, fontSize: 13, color: lp.dim, marginTop: 12, lineHeight: 1.6 }}>
              Your {myEliteLevel} status on {ALLIANCE_LABELS[myAlliance]} does not grant any reciprocal elite benefits when flying {PROG_NAMES[allianceCompare]}.
              To see reciprocal benefits, select a <strong style={{ color: lp.text2 }}>{ALLIANCE_LABELS[myAlliance]}</strong> partner airline.
            </div>
            {/* Show which programs ARE valid partners */}
            <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <span style={{ fontFamily: lp.mono, fontSize: 10, color: lp.dim, alignSelf: "center", letterSpacing: 1 }}>{ALLIANCE_LABELS[myAlliance]} PARTNERS:</span>
              {Object.entries(ALLIANCE_MBR)
                .filter(([id, meta]) => id !== allianceMyProgram && meta.alliance === myAlliance)
                .map(([id]) => (
                  <button key={id} onClick={() => setAllianceCompare(id)} style={{
                    padding: "5px 12px", fontFamily: lp.mono, fontSize: 11, cursor: "pointer",
                    background: lp.surface2, border: `1px solid ${lp.border2}`, color: lp.text2,
                  }}>
                    {PROG_NAMES[id] || id}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Benefit table — only when same alliance */}
        {sameAlliance && (
        <div style={{ background: lp.surface, border: `1px solid ${lp.border}`, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ background: lp.surface2, borderBottom: `2px solid ${lp.teal}` }}>
                <th style={{ padding: "12px 14px", textAlign: "left", fontFamily: lp.mono, fontSize: 11, letterSpacing: 1, color: lp.dim, fontWeight: 600, width: "28%" }}>Benefit</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontFamily: lp.mono, fontSize: 11, letterSpacing: 1, color: lp.teal, fontWeight: 700 }}>
                  Your Status ({myEliteLevel || "—"})<br />
                  <span style={{ color: lp.dim, fontWeight: 400, fontSize: 10 }}>{PROG_NAMES[allianceMyProgram] || allianceMyProgram}</span>
                </th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontFamily: lp.mono, fontSize: 11, letterSpacing: 1, color: lp.yellow, fontWeight: 700 }}>
                  As {ALLIANCE_TIER_LABELS[cmpTierKey]} on {PROG_NAMES[allianceCompare] || allianceCompare}<br />
                  <span style={{ color: ALLIANCE_TIER_COLORS[cmpTierKey], fontWeight: 600, fontSize: 10 }}>{ALLIANCE_LABELS[myAlliance]} Reciprocal</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cats.map(cat => {
                const rows = BENEFIT_ROWS.filter(r => r.cat === cat);
                return [
                  <tr key={`cat-${cat}`}>
                    <td colSpan={3} style={{ padding: "8px 14px 4px", background: lp.bg, fontFamily: lp.mono, fontSize: 10, letterSpacing: 2, color: lp.teal, fontWeight: 700, textTransform: "uppercase", borderBottom: `1px solid ${lp.border}` }}>{cat}</td>
                  </tr>,
                  ...rows.map(row => (
                    <tr key={row.id} style={{ background: lp.surface }}>
                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${lp.border}`, verticalAlign: "top" }}>
                        <div style={{ fontFamily: lp.sans, fontSize: 13, fontWeight: 600, color: lp.text2 }}>{row.label}</div>
                        <div style={{ fontFamily: lp.sans, fontSize: 11, color: lp.dim, marginTop: 2 }}>{row.sub}</div>
                      </td>
                      <Cell ben={myHomeBenefits?.[row.id]} />
                      <Cell ben={cmpRecipBenefits?.[row.id]} />
                    </tr>
                  ))
                ];
              })}
            </tbody>
          </table>
        </div>
        )}

        {/* Footer note */}
        <div style={{ marginTop: 16, padding: "12px 16px", background: lp.surface, border: `1px solid ${lp.border}`, fontFamily: lp.sans, fontSize: 12, color: lp.dim, lineHeight: 1.6 }}>
          <strong style={{ color: lp.text2 }}>Disclaimer:</strong> Benefits shown are based on published alliance standards and typical carrier implementations. Actual benefits may vary by route, fare class, and carrier. Always verify with the operating carrier before travel.
        </div>
      </div>
    );
  };

