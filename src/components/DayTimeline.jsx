import React, { useState } from "react";
import { tzForAirport, tzForCity, wallToUTC, fmtInTz, nowInTz, tzAbbr } from "../constants/airportTimezones";

// Hour-by-hour daily timeline for a trip's detail view. The day runs a full
// 12am→12am clock in a user-selectable timezone (default: the device's local
// zone — where you currently are). Every event is placed by its real UTC instant,
// so flights that cross zones/midnight block out correctly and even spill onto the
// next day. Flight labels keep each endpoint in its own local time. Tapping a
// block opens its full booking detail.

const IMG = (id) => `https://images.unsplash.com/${id}?w=220&q=70&auto=format&fit=crop`;
const TYPE_IMG = {
  flight: IMG("photo-1436491865332-7a61a109cc05"),
  hotel: IMG("photo-1566073771259-6a8506099945"),
  accommodation: IMG("photo-1566073771259-6a8506099945"),
  restaurant: IMG("photo-1517248135467-4c7edcad34c4"),
  dining: IMG("photo-1517248135467-4c7edcad34c4"),
  activity: IMG("photo-1488646953014-85cb44e25828"),
  meeting: IMG("photo-1497366216548-37526070297c"),
  lounge: IMG("photo-1540575467063-178a50c2df87"),
  rental: IMG("photo-1449965408869-eaa3f722e40d"),
  transfer: IMG("photo-1449965408869-eaa3f722e40d"),
  train: IMG("photo-1474487548417-781cb71495f3"),
  cruise: IMG("photo-1548574505-5e239809ee19"),
  ferry: IMG("photo-1548574505-5e239809ee19"),
  default: IMG("photo-1488646953014-85cb44e25828"),
};

const dispTime = (t) => {
  const m = String(t || "").match(/(\d{1,2}):(\d{2})/);
  if (!m) return t || "";
  const h = +m[1], min = +m[2];
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ampm}`;
};
const fmtHourLabel = (h) => {
  const hr = ((h % 24) + 24) % 24;
  const ampm = hr < 12 ? "AM" : "PM";
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${h12} ${ampm}`;
};
const codesOf = (seg) => {
  const list = (seg.route || "").match(/\b[A-Z]{3}\b/g) || [];
  return { dep: seg.departureAirport || list[0] || "", arr: seg.arrivalAirport || list[list.length - 1] || "" };
};

export default function DayTimeline({
  ev, isMobile, D, trip, realSegs, sortedDates, tripStartDate,
  AIRPORT_CITY, SegIcon, segTypeInfo, segTitle, segSubtitle,
  resolveArrivalDate, resolveCityForDate, resolveHotelForDate, onOpenSeg,
}) {
  const days = (sortedDates || []).filter(d => d && d !== "undated");
  const todayStr = new Date().toISOString().slice(0, 10);
  const initIdx = days.findIndex(d => d >= todayStr);
  const [dayIdx, setDayIdx] = useState(initIdx === -1 ? 0 : initIdx);

  const deviceTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; } })();
  const [axisTz, setAxisTz] = useState(deviceTz);

  if (days.length === 0) return null;
  const day = days[Math.min(dayIdx, days.length - 1)];

  // Timezone choices: "Local time" (device) + every airport the trip touches.
  const tzOptions = [];
  const seenTz = new Set();
  const addOpt = (tz, label) => { if (tz && !seenTz.has(tz)) { seenTz.add(tz); tzOptions.push({ tz, label }); } };
  addOpt(deviceTz, "Local time");
  realSegs.filter(s => s.type === "flight").forEach(s => {
    const { dep, arr } = codesOf(s);
    addOpt(tzForAirport(dep), (AIRPORT_CITY?.[dep] || dep));
    addOpt(tzForAirport(arr), (AIRPORT_CITY?.[arr] || arr));
  });
  const axisAbbr = tzAbbr(axisTz);

  // Reference clocks: departing city (trip origin) vs. local city (where you are).
  const firstFlight = [...realSegs].filter(s => s.type === "flight" && s.date).sort((a, b) => (a.date + (a.departureTime || "")).localeCompare(b.date + (b.departureTime || "")))[0];
  const homeCode = firstFlight ? codesOf(firstFlight).dep : "";
  const homeCity = (homeCode && AIRPORT_CITY?.[homeCode]) || (trip.location || "").split(",")[0].trim() || "";
  const homeTz = tzForAirport(homeCode) || tzForCity(homeCity);
  const localCtx = resolveCityForDate ? resolveCityForDate(realSegs, day) : { city: "", airportCode: "" };
  const localCode = localCtx?.airportCode || "";
  const localCity = (localCode && AIRPORT_CITY?.[localCode]) || localCtx?.city || homeCity;
  const localTz = tzForAirport(localCode) || tzForCity(localCity) || homeTz;

  // ── Day window in the chosen axis timezone ──
  const dayStartUTC = wallToUTC(day, "00:00", axisTz) || new Date(day + "T00:00:00Z");
  const dayMs = dayStartUTC.getTime();
  const minFromStart = (utc) => utc ? (utc.getTime() - dayMs) / 60000 : null;

  const segTzForDate = (seg, dateStr) => {
    const ctx = resolveCityForDate ? resolveCityForDate(realSegs, dateStr) : null;
    return (ctx?.airportCode && tzForAirport(ctx.airportCode)) || tzForCity(seg.location) || tzForCity(localCity) || axisTz;
  };

  // ── Build events that touch this day ──
  const events = [];
  realSegs.forEach((seg, i) => {
    const type = (seg.type || "").toLowerCase();
    if (type === "flight") {
      const { dep, arr } = codesOf(seg);
      const depTz = tzForAirport(dep) || axisTz;
      const arrTz = tzForAirport(arr) || axisTz;
      const arrDate = (resolveArrivalDate && resolveArrivalDate(seg)) || seg.arrivalDate || seg.date;
      const depUTC = wallToUTC(seg.date, seg.departureTime || "00:00", depTz);
      const arrUTC = wallToUTC(arrDate, seg.arrivalTime || "", arrTz);
      if (!depUTC) return;
      const sMin = minFromStart(depUTC);
      const eMin = arrUTC ? minFromStart(arrUTC) : sMin + 90;
      if (eMin > 0 && sMin < 1440) events.push({ i, seg, type, kind: "flight", sMin, eMin, dep, arr, arrDate, depTz, arrTz });
    } else if (type === "hotel" || type === "accommodation") {
      const checkin = seg.date;
      const checkout = seg.checkoutDate || (checkin && seg.nights ? (() => { const d = new Date(checkin + "T12:00:00"); d.setDate(d.getDate() + (parseInt(seg.nights) || 1)); return d.toISOString().slice(0, 10); })() : "");
      const tz = segTzForDate(seg, day);
      if (checkin === day) { const u = wallToUTC(day, seg.checkinTime || "15:00", tz); if (u) { const s = minFromStart(u); events.push({ i, seg, type, kind: "hotel-in", sMin: s, eMin: s + 60, tz }); } }
      if (checkout === day) { const u = wallToUTC(day, seg.checkoutTime || "11:00", tz); if (u) { const s = minFromStart(u); events.push({ i, seg, type, kind: "hotel-out", sMin: s, eMin: s + 60, tz }); } }
    } else if (seg.date === day) {
      const tz = segTzForDate(seg, day);
      const tstr = seg.startTime || seg.time || seg.pickupTime || seg.departureTime || "12:00";
      const u = wallToUTC(day, tstr, tz);
      if (!u) return;
      const s = minFromStart(u);
      const endU = seg.endTime ? wallToUTC(day, seg.endTime, tz) : null;
      events.push({ i, seg, type, kind: "event", sMin: s, eMin: endU ? minFromStart(endU) : s + 75, tz });
    }
  });
  events.sort((a, b) => a.sMin - b.sMin);

  // Overnight hotel chip (covers this night, no check-in/out today)
  const overnight = (() => {
    if (events.some(e => e.kind === "hotel-in" || e.kind === "hotel-out")) return null;
    const h = resolveHotelForDate ? resolveHotelForDate(realSegs, day) : null;
    if (!h) return null;
    return { name: h.name, idx: realSegs.indexOf(h.seg) };
  })();

  // ── Full 12am → 12am axis ──
  const HOUR_PX = isMobile ? 38 : 44;
  const axisH = 24 * HOUR_PX;
  const AXIS_W = isMobile ? 50 : 58;
  const GAP = 6;
  const minBlockH = isMobile ? 58 : 64;

  // ── Column-pack overlapping events so none hide behind another ──
  const laid = events.map(e => {
    const topMin = Math.max(0, e.sMin);
    const botMin = Math.min(1440, e.eMin);
    const top = (topMin / 60) * HOUR_PX;
    const height = Math.max(minBlockH, ((botMin - topMin) / 60) * HOUR_PX);
    return { e, top, bottom: top + height, height, col: 0, cols: 1 };
  });
  laid.sort((a, b) => a.top - b.top || a.bottom - b.bottom);
  let _c = 0;
  while (_c < laid.length) {
    let j = _c, clusterEnd = laid[_c].bottom;
    const cluster = [laid[_c]];
    while (j + 1 < laid.length && laid[j + 1].top < clusterEnd - 0.5) {
      j++; cluster.push(laid[j]); clusterEnd = Math.max(clusterEnd, laid[j].bottom);
    }
    const colEnds = [];
    cluster.forEach(it => {
      let placed = false;
      for (let c = 0; c < colEnds.length; c++) {
        if (it.top >= colEnds[c] - 0.5) { it.col = c; colEnds[c] = it.bottom; placed = true; break; }
      }
      if (!placed) { it.col = colEnds.length; colEnds.push(it.bottom); }
    });
    cluster.forEach(it => { it.cols = colEnds.length; });
    _c = j + 1;
  }

  const dd = new Date(day + "T12:00:00");
  const dayNum = tripStartDate ? Math.floor((dd - new Date(tripStartDate + "T12:00:00")) / 86400000) + 1 : dayIdx + 1;
  const monthLabel = dd.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const Clock = ({ label, city, tz }) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: ev.mono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: ev.stone, marginBottom: 3 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: ev.serif, fontSize: isMobile ? 14 : 16, color: ev.ink, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{city || "—"}</span>
        {tz && <span style={{ fontFamily: ev.mono, fontSize: 11, color: ev.accent }}>{nowInTz(tz)}</span>}
      </div>
      {tz && <div style={{ fontFamily: ev.mono, fontSize: 9, color: ev.stone, marginTop: 2 }}>{tzAbbr(tz)}</div>}
    </div>
  );

  const Block = ({ it }) => {
    const e = it.e;
    const info = segTypeInfo(e.seg.type);
    const isFlight = e.kind === "flight";
    const top = it.top;
    const height = it.height;
    const cols = it.cols, col = it.col;
    const left = cols > 1
      ? `calc(${AXIS_W}px + ${col} * ((100% - ${AXIS_W}px - ${(cols - 1) * GAP}px) / ${cols} + ${GAP}px))`
      : AXIS_W;
    const widthStyle = cols > 1 ? `calc((100% - ${AXIS_W}px - ${(cols - 1) * GAP}px) / ${cols})` : null;
    const thumbW = cols >= 3 ? 0 : cols === 2 ? 46 : (height >= 92 ? 92 : 78);
    const img = TYPE_IMG[e.type] || TYPE_IMG.default;
    const clippedStart = e.sMin < 0;
    const clippedEnd = e.eMin > 1440;

    let title = segTitle ? segTitle(e.seg) : (e.seg.property || e.seg.flightNumber || info.label);
    let timeLine = "";
    let metaLine = "";
    if (isFlight) {
      const plus = e.arrDate && e.seg.date && e.arrDate !== e.seg.date ? " +1" : "";
      title = [e.seg.flightNumber, e.seg.route || `${e.dep} → ${e.arr}`].filter(Boolean).join(" · ");
      timeLine = `${dispTime(e.seg.departureTime)} ${e.dep} → ${dispTime(e.seg.arrivalTime)}${plus} ${e.arr}`.trim();
      // When the axis isn't the departure zone, show this day's portion in axis time.
      if (axisTz !== e.depTz) {
        const aDep = fmtInTz(wallToUTC(e.seg.date, e.seg.departureTime, e.depTz), axisTz);
        const aArr = fmtInTz(wallToUTC(e.arrDate, e.seg.arrivalTime, e.arrTz), axisTz);
        if (aDep && aArr) metaLine = `${aDep}–${aArr} ${axisAbbr}`;
      } else {
        metaLine = e.seg.airline || "";
      }
    } else {
      const localStr = e.seg.startTime || e.seg.time || e.seg.pickupTime || e.seg.checkinTime || e.seg.checkoutTime || (e.kind === "hotel-in" ? "15:00" : e.kind === "hotel-out" ? "11:00" : "");
      const prefix = e.kind === "hotel-in" ? "Check-in" : e.kind === "hotel-out" ? "Check-out" : "";
      // Primary time is in the axis zone (that's what the grid is measured in).
      const axisU = wallToUTC(day, localStr, e.tz);
      const axisTime = axisU ? fmtInTz(axisU, axisTz) : dispTime(localStr);
      timeLine = [prefix, axisTime].filter(Boolean).join(" · ");
      if (e.tz && e.tz !== axisTz) metaLine = `${dispTime(localStr)} local`;
      else metaLine = segSubtitle ? (segSubtitle(e.seg) || "") : "";
    }

    return (
      <button onClick={() => onOpenSeg && onOpenSeg(e.i)} style={{
        position: "absolute", top, left, height, ...(widthStyle ? { width: widthStyle } : { right: 0 }),
        display: "flex", overflow: "hidden",
        textAlign: "left", cursor: "pointer", background: ev.bone, border: `1px solid ${ev.cream}`,
        borderLeft: `3px solid ${info.color}`, borderRadius: 12, padding: 0, fontFamily: "inherit",
        transition: "border-color 0.15s",
      }}
        onMouseEnter={x => { x.currentTarget.style.borderColor = info.color; x.currentTarget.style.borderLeftColor = info.color; }}
        onMouseLeave={x => { x.currentTarget.style.borderColor = ev.cream; x.currentTarget.style.borderLeftColor = info.color; }}>
        {thumbW > 0 && (
          <div style={{ position: "relative", width: thumbW, flexShrink: 0, background: info.wash }}>
            <img src={img} alt="" loading="lazy" onError={x => { x.currentTarget.style.display = "none"; }} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <span style={{ position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: 6, background: "rgba(21,19,15,0.55)", display: "grid", placeItems: "center" }}>
              <SegIcon type={e.seg.type} size={11} color="#FBF8F3" />
            </span>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, padding: isMobile ? "8px 10px" : "10px 13px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.03em", color: ev.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {clippedStart && <span title="continues from the previous day" style={{ color: ev.stone }}>↑</span>}
            {timeLine}
            {clippedEnd && <span title="continues into the next day" style={{ color: ev.stone }}>↓</span>}
          </div>
          <div style={{ fontFamily: ev.serif, fontSize: isMobile ? 14 : 15, color: ev.ink, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
          {metaLine && <div style={{ fontFamily: ev.mono, fontSize: 10, color: ev.taupe, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{metaLine}</div>}
        </div>
      </button>
    );
  };

  const selStyle = {
    fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
    color: ev.ink, background: ev.bone, border: `1px solid ${ev.cream}`, borderRadius: 8,
    padding: "6px 8px", cursor: "pointer", maxWidth: 150,
  };

  return (
    <div style={{ background: D ? "#1c1a15" : "#fff", border: `1px solid ${ev.cream}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
      {/* Header + timezone selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: isMobile ? "12px 14px 10px" : "14px 20px 10px", borderBottom: `1px solid ${ev.cream}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 18, height: 1, background: ev.accent, display: "inline-block" }} />
          <span style={{ fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: ev.taupe }}>By the hour</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: ev.mono, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: ev.stone }}>Times in</span>
          <select value={axisTz} onChange={e => setAxisTz(e.target.value)} style={selStyle}>
            {tzOptions.map(o => <option key={o.tz} value={o.tz}>{o.label}{o.tz === deviceTz ? "" : ""}</option>)}
          </select>
        </div>
      </div>

      {/* Reference clocks */}
      {(homeCity || localCity) && (
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 14 : 28, padding: isMobile ? "12px 14px" : "12px 20px", borderBottom: `1px solid ${ev.cream}` }}>
          <Clock label="Departing city" city={homeCity} tz={homeTz} />
          {homeTz && localTz && homeTz !== localTz
            ? (<><div style={{ width: 18, height: 1, background: ev.cream }} /><Clock label="Local city" city={localCity} tz={localTz} /></>)
            : (<span style={{ fontFamily: ev.mono, fontSize: 10, letterSpacing: "0.06em", color: ev.stone }}>Same time zone today</span>)}
        </div>
      )}

      {/* Day strip */}
      <div style={{ padding: isMobile ? "12px 8px" : "14px 14px", borderBottom: `1px solid ${ev.cream}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 10px" }}>
          <button onClick={() => setDayIdx(Math.max(0, dayIdx - 1))} disabled={dayIdx <= 0} style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${dayIdx <= 0 ? ev.cream : ev.stone}`, background: "transparent", color: dayIdx <= 0 ? ev.stone : ev.ink, cursor: dayIdx <= 0 ? "default" : "pointer", display: "grid", placeItems: "center", opacity: dayIdx <= 0 ? 0.4 : 1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span style={{ fontFamily: ev.serif, fontSize: isMobile ? 15 : 17, color: ev.ink }}>{monthLabel}</span>
          <button onClick={() => setDayIdx(Math.min(days.length - 1, dayIdx + 1))} disabled={dayIdx >= days.length - 1} style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${dayIdx >= days.length - 1 ? ev.cream : ev.stone}`, background: "transparent", color: dayIdx >= days.length - 1 ? ev.stone : ev.ink, cursor: dayIdx >= days.length - 1 ? "default" : "pointer", display: "grid", placeItems: "center", opacity: dayIdx >= days.length - 1 ? 0.4 : 1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", padding: "0 6px" }}>
          {days.map((d, idx) => {
            const date = new Date(d + "T12:00:00");
            const active = idx === dayIdx;
            const isToday = d === todayStr;
            return (
              <button key={d} onClick={() => setDayIdx(idx)} style={{ flexShrink: 0, width: isMobile ? 46 : 52, padding: "8px 0", borderRadius: 12, cursor: "pointer", background: active ? ev.ink : "transparent", border: `1px solid ${active ? ev.ink : "transparent"}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.2s" }}>
                <span style={{ fontFamily: ev.mono, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: active ? "rgba(244,241,236,0.7)" : ev.stone }}>{date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)}</span>
                <span style={{ fontFamily: ev.serif, fontSize: isMobile ? 16 : 18, color: active ? "#FBF8F3" : ev.ink, fontVariantNumeric: "tabular-nums" }}>{date.getDate()}</span>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: isToday ? ev.accent : "transparent" }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Hourly grid (12am → 12am) */}
      <div style={{ padding: isMobile ? "8px 14px 16px" : "10px 20px 20px" }}>
        <div style={{ fontFamily: ev.mono, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: ev.stone, marginBottom: 10 }}>
          Day {String(dayNum).padStart(2, "0")} · {dd.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}{axisAbbr ? ` · ${axisAbbr}` : ""}
        </div>
        {overnight && (
          <button onClick={() => onOpenSeg && overnight.idx >= 0 && onOpenSeg(overnight.idx)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "9px 12px", marginBottom: 10, background: ev.bone, border: `1px solid ${ev.cream}`, borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>
            <SegIcon type="hotel" size={13} color={ev.plum} />
            <span style={{ fontFamily: ev.mono, fontSize: 11, letterSpacing: "0.04em", color: ev.taupe }}>Overnight · {overnight.name}</span>
          </button>
        )}
        <div style={{ position: "relative", height: axisH }}>
          {Array.from({ length: 25 }, (_, h) => (
            <div key={h} style={{ position: "absolute", top: h * HOUR_PX, left: 0, right: 0, display: "flex", alignItems: "flex-start", pointerEvents: "none" }}>
              <span style={{ width: AXIS_W, flexShrink: 0, fontFamily: ev.mono, fontSize: 9.5, color: ev.stone, transform: "translateY(-6px)", fontVariantNumeric: "tabular-nums" }}>{h < 24 ? fmtHourLabel(h) : "12 AM"}</span>
              <span style={{ flex: 1, height: 1, background: ev.cream, marginTop: -1 }} />
            </div>
          ))}
          {events.length === 0 && !overnight && (
            <div style={{ position: "absolute", top: 8 * HOUR_PX, left: AXIS_W, fontFamily: ev.serif, fontStyle: "italic", fontSize: 14, color: ev.taupe }}>Nothing scheduled this day.</div>
          )}
          {laid.map((it, idx) => <Block key={`${it.e.i}-${it.e.kind}-${idx}`} it={it} />)}
        </div>
      </div>
    </div>
  );
}
