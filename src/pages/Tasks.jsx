import React, { useState, useEffect } from "react";

/*
 * Tasks — a shared household ledger of responsibilities.
 *
 * A flat, running list (not a calendar). Tasks come in over time and never
 * disappear on their own; each carries who's responsible and whether it's done.
 *
 *   One-time task — "done" is sticky. Completing it stamps the date + who and
 *                   turns the status pill green; the task keeps its place in
 *                   the list. Toggle back any time.
 *   Recurring task — never persistently done. Tapping done logs a completion
 *                    (date, who, running count) and it stays in the list.
 *
 * The list is flat and stays in the order tasks were added — nothing is struck
 * through and nothing sinks to the bottom. Assignment is explicit: the pill
 * opens a sheet where a name is typed (new names join the household roster).
 *
 * Single-owner model: `people` are labels owned by this account (no second
 * login). Everything is owner-scoped in Supabase with RLS — see
 * supabase-tasks-migration.sql.
 *
 * Styling follows the app's editorial house style (Trips / Expense Split):
 * a local `dv` palette, Fraunces display type over Inter Tight body copy with
 * JetBrains Mono eyebrows, paper cards on a cream hairline, stroke-SVG icons,
 * and modals that dock above the bottom tab bar with a sticky header.
 */

// Editorial accent set for person bubbles — same family as the split-page chips.
const PALETTE = ["#C8553D", "#6B7A5A", "#B8924A", "#6B6458", "#2C6E63", "#8A5A44", "#4F6D8C", "#9C5C7A"];
const initials = (name) => (name || "?").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fmtDate = (s) => s
  ? new Date(`${s}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  : "";

/* ── Icons — stroke SVGs, matching the app's nav/segment icon weight ── */
const Icon = ({ d, size = 14, stroke = 1.9 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const CheckIcon = (p) => <Icon {...p} d={<polyline points="20 6 9 17 4 12" />} />;
const CircleIcon = (p) => <Icon {...p} d={<circle cx="12" cy="12" r="8" />} />;
const RepeatIcon = (p) => <Icon {...p} d={<><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>} />;
const PencilIcon = (p) => <Icon {...p} d={<path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />} />;
const TrashIcon = (p) => <Icon {...p} d={<><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>} />;
const PlusIcon = (p) => <Icon {...p} d={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} />;
const CloseIcon = (p) => <Icon {...p} d={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} />;

export function renderTasks(s) {
  return <TasksPage {...s} />;
}

function TasksPage({ css, isMobile, darkMode, user, supabase, showConfirm }) {
  const D = !!darkMode;

  // Editorial palette — mirrors Trips / Expense Split so the tab reads as one app.
  const dv = {
    bone: D ? "#1a1a1a" : "#fff",
    paper: D ? "#222" : "#fff",
    cream: D ? "rgba(255,255,255,0.08)" : "#E2DCCE",
    stone: D ? "#8a8a8a" : "#857A66",
    taupe: D ? "#999" : "#6B6458",
    ink: D ? "#f0ece6" : "#15130F",
    accent: "#C8553D",
    moss: "#6B7A5A",   // complete
    red: D ? "#E05A4E" : "#C03E34",   // open — deliberately hotter than the terracotta accent
    gold: "#B8924A",
    serif: "'Fraunces', 'Instrument Serif', Georgia, serif",
    sans: "'Inter Tight', 'Instrument Sans', sans-serif",
    mono: "'JetBrains Mono', 'Geist Mono', monospace",
  };

  // Fall back to the browser dialog only if the host didn't pass the in-app one.
  const confirmThen = (message, onConfirm) => {
    if (showConfirm) showConfirm(message, onConfirm);
    else if (window.confirm(message)) onConfirm();
  };

  const [people, setPeople] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [ready, setReady] = useState(null);   // null=loading, false=needs migration, true=ok
  const [filter, setFilter] = useState(null);
  const [addTitle, setAddTitle] = useState("");
  const [addRecurring, setAddRecurring] = useState(false);
  const [editing, setEditing] = useState(null);      // task being edited
  const [assigning, setAssigning] = useState(null);  // task whose assignee is being set
  const [assignName, setAssignName] = useState("");  // typed name in the assign sheet
  const [showPeople, setShowPeople] = useState(false);
  const [newPerson, setNewPerson] = useState("");

  const personById = (id) => people.find((p) => p.id === id) || null;
  const isDone = (t) => !t.recurring && t.completed;
  const matches = (t) => !filter || t.assignee_id === filter;

  /* ---------- load ---------- */
  useEffect(() => { if (user) loadAll(); }, [user]);

  async function loadAll() {
    const [pp, tt] = await Promise.all([
      supabase.from("task_people").select("*").eq("owner_id", user.id).order("created_at", { ascending: true }),
      supabase.from("tasks").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
    ]);
    // Table not migrated yet — show a friendly setup note instead of crashing.
    if (pp.error?.code === "42P01" || tt.error?.code === "42P01" ||
        pp.error?.message?.includes("schema cache") || tt.error?.message?.includes("schema cache")) {
      setReady(false); return;
    }
    if (pp.error || tt.error) { console.error("Tasks load error:", pp.error || tt.error); setReady(true); return; }
    setPeople(pp.data || []);
    setTasks(tt.data || []);
    setReady(true);
  }

  /* ---------- people CRUD ---------- */
  // Returns the person row so callers (the assign sheet) can use it immediately.
  async function addPerson(name) {
    const nm = (name || "").trim();
    if (!nm) return null;
    // Typing a name that already exists reuses that person rather than duplicating.
    const existing = people.find((p) => p.name.toLowerCase() === nm.toLowerCase());
    if (existing) return existing;
    const color = PALETTE[people.length % PALETTE.length];
    const { data, error } = await supabase.from("task_people")
      .insert({ owner_id: user.id, name: nm, color }).select().single();
    if (error) { console.error(error); return null; }
    setPeople((prev) => [...prev, data]);
    return data;
  }
  async function renamePerson(id, name) {
    const nm = (name || "").trim();
    if (!nm) return;
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, name: nm } : p)));
    await supabase.from("task_people").update({ name: nm }).eq("id", id);
  }
  async function recolorPerson(id, color) {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, color } : p)));
    await supabase.from("task_people").update({ color }).eq("id", id);
  }
  function deletePerson(id) {
    confirmThen("Remove this person? Their tasks become unassigned.", async () => {
      setPeople((prev) => prev.filter((p) => p.id !== id));
      // DB clears the references via ON DELETE SET NULL; mirror that locally.
      setTasks((prev) => prev.map((t) => ({
        ...t,
        assignee_id: t.assignee_id === id ? null : t.assignee_id,
        completed_by: t.completed_by === id ? null : t.completed_by,
        last_done_by: t.last_done_by === id ? null : t.last_done_by,
      })));
      if (filter === id) setFilter(null);
      await supabase.from("task_people").delete().eq("id", id);
    });
  }

  /* ---------- task CRUD ---------- */
  const patchLocal = (id, patch) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const pushDb = async (id, patch) => {
    const { error } = await supabase.from("tasks").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { console.error("task update error:", error); loadAll(); }
  };

  async function addTask() {
    const title = addTitle.trim();
    if (!title) return;
    const row = {
      owner_id: user.id, title, recurring: addRecurring, assignee_id: null,
      completed: false, completed_at: null, completed_by: null,
      done_count: 0, last_done_at: null, last_done_by: null,
    };
    const { data, error } = await supabase.from("tasks").insert(row).select().single();
    if (error) { console.error(error); return; }
    setTasks((prev) => [data, ...prev]);
    setAddTitle("");
    setFilter(null);
  }

  // Assignment is explicit: the pill opens a sheet where a name is typed (or an
  // existing person picked), rather than cycling blindly through the roster.
  function setAssignee(t, personId) {
    patchLocal(t.id, { assignee_id: personId });
    pushDb(t.id, { assignee_id: personId });
    setAssigning(null);
    setAssignName("");
  }

  async function assignTypedName(t) {
    const nm = assignName.trim();
    if (!nm) return;
    const person = await addPerson(nm);
    if (person) setAssignee(t, person.id);
  }

  function toggleComplete(t) {
    const on = !t.completed;
    const patch = { completed: on, completed_at: on ? todayStr() : null, completed_by: on ? t.assignee_id : null };
    patchLocal(t.id, patch);
    pushDb(t.id, patch);
  }

  function logDone(t) {
    const patch = { done_count: (t.done_count || 0) + 1, last_done_at: todayStr(), last_done_by: t.assignee_id };
    patchLocal(t.id, patch);
    pushDb(t.id, patch);
  }

  async function saveEdit() {
    const t = editing;
    const title = t.title.trim();
    if (!title) return;
    const patch = { title, recurring: t.recurring };
    // Switching kind clears the stamps that only apply to the other kind.
    if (t.recurring !== tasks.find((x) => x.id === t.id)?.recurring) {
      Object.assign(patch, { completed: false, completed_at: null, completed_by: null, done_count: 0, last_done_at: null, last_done_by: null });
    }
    patchLocal(t.id, patch);
    setEditing(null);
    await pushDb(t.id, patch);
  }

  function deleteTask(id) {
    confirmThen("Delete this task?", async () => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setEditing(null);
      await supabase.from("tasks").delete().eq("id", id);
    });
  }

  function clearDone() {
    const doneIds = tasks.filter(isDone).map((t) => t.id);
    if (!doneIds.length) return;
    confirmThen(`Remove ${doneIds.length} completed task${doneIds.length > 1 ? "s" : ""}?`, async () => {
      setTasks((prev) => prev.filter((t) => !isDone(t)));
      await supabase.from("tasks").delete().in("id", doneIds);
    });
  }

  /* ---------- derived ---------- */
  // One flat list in the order tasks were added (created_at desc from the query).
  // Completed tasks keep their place — the status pill turns green, nothing
  // sinks to the bottom and nothing gets struck through.
  const visible = tasks.filter(matches);

  /* ---------- shared styles ---------- */
  // The app shell already supplies page padding and bottom-nav clearance, so the
  // page only sets its own measure.
  const wrap = { fontFamily: dv.sans, color: dv.ink, maxWidth: 880, margin: "0 auto" };
  const cardStyle = { background: dv.paper, border: `1px solid ${dv.cream}`, borderRadius: 12 };
  const fieldStyle = {
    width: "100%", padding: "11px 13px", borderRadius: 10, border: `1px solid ${dv.cream}`,
    background: D ? "rgba(255,255,255,0.03)" : "#FCFBF8", color: dv.ink,
    fontFamily: dv.sans, fontSize: 15, outline: "none",
  };
  const monoLabel = { fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" };
  const primaryBtn = {
    border: "none", background: dv.ink, color: dv.bone, ...monoLabel, fontWeight: 600,
    padding: "12px 18px", borderRadius: 8, cursor: "pointer", transition: "opacity 0.18s",
  };
  const ghostBtn = {
    border: `1px solid ${dv.cream}`, background: "transparent", color: dv.ink, ...monoLabel,
    padding: "12px 18px", borderRadius: 8, cursor: "pointer", transition: "border-color 0.18s",
  };

  if (!user) {
    return <div style={wrap}><p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 16, color: dv.taupe }}>Sign in to use Tasks.</p></div>;
  }

  if (ready === null) {
    return <div style={wrap}><p style={{ ...monoLabel, color: dv.taupe }}>Loading…</p></div>;
  }

  const Eyebrow = () => (
    <div style={{ ...monoLabel, fontSize: 12, letterSpacing: "0.15em", color: dv.accent, marginBottom: isMobile ? 16 : 24, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 28, height: 1, background: dv.accent }} />
      Tasks
    </div>
  );

  if (ready === false) {
    return (
      <div style={wrap}>
        <Eyebrow />
        <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 28 : 60, fontWeight: 300, lineHeight: 0.98, letterSpacing: "-0.03em", margin: "0 0 20px", color: dv.ink }}>
          One <em style={{ fontStyle: "italic", fontWeight: 400, color: dv.accent }}>setup step</em> left.
        </h1>
        <div style={{ ...cardStyle, padding: isMobile ? "18px" : "24px 26px", maxWidth: 520 }}>
          <p style={{ fontFamily: dv.sans, fontSize: 15, lineHeight: 1.55, color: dv.taupe, margin: 0 }}>
            Run <span style={{ fontFamily: dv.mono, fontSize: 13, color: dv.ink }}>supabase-tasks-migration.sql</span> in
            your Supabase SQL editor to create the <span style={{ fontFamily: dv.mono, fontSize: 13, color: dv.ink }}>tasks</span> and{" "}
            <span style={{ fontFamily: dv.mono, fontSize: 13, color: dv.ink }}>task_people</span> tables, then reopen this tab.
          </p>
        </div>
      </div>
    );
  }

  /* ---------- pieces ---------- */
  const Bubble = ({ p, size = 22 }) => (
    <span style={{
      width: size, height: size, flex: "none", borderRadius: "50%", display: "grid", placeItems: "center",
      background: p ? p.color : "transparent", color: p ? "#fff" : dv.stone,
      fontFamily: dv.mono, fontSize: size <= 22 ? 9 : 10, fontWeight: 500, letterSpacing: "0.02em",
      border: p ? "none" : `1px dashed ${dv.cream}`,
    }}>{p ? initials(p.name) : "+"}</span>
  );

  const Pill = ({ onClick, children, style, title }) => (
    <button type="button" onClick={onClick} title={title} style={{
      display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer",
      border: `1px solid ${dv.cream}`, background: "transparent", color: dv.ink,
      fontFamily: dv.sans, fontSize: 12.5, fontWeight: 500, padding: "5px 12px 5px 5px",
      borderRadius: 999, whiteSpace: "nowrap", transition: "border-color 0.18s, background 0.18s", ...style,
    }}>{children}</button>
  );

  function assigneePill(t) {
    const p = personById(t.assignee_id);
    return (
      <Pill onClick={() => { setAssigning(t); setAssignName(""); }} title="Set who's responsible"
        style={p ? {} : { borderStyle: "dashed", color: dv.taupe }}>
        <Bubble p={p} /><span>{p ? p.name : "Assign"}</span>
      </Pill>
    );
  }

  // Status reads at a glance: red while open, green once complete.
  function statusControl(t) {
    if (t.recurring) {
      return (
        <Pill onClick={() => logDone(t)} title="Record that this was done"
          style={{ padding: "6px 13px", gap: 6, color: dv.moss, borderColor: `${dv.moss}55`,
            background: D ? "rgba(107,122,90,0.12)" : "rgba(107,122,90,0.07)" }}>
          <CheckIcon size={13} /><span style={{ ...monoLabel, fontSize: 9.5 }}>Log done</span>
        </Pill>
      );
    }
    const on = t.completed;
    return (
      <Pill onClick={() => toggleComplete(t)} title={on ? "Tap to reopen" : "Tap to mark done"}
        style={{
          padding: "6px 13px", gap: 6,
          color: on ? dv.moss : dv.red,
          borderColor: on ? `${dv.moss}55` : `${dv.red}55`,
          background: on
            ? (D ? "rgba(107,122,90,0.12)" : "rgba(107,122,90,0.07)")
            : (D ? "rgba(200,62,52,0.14)" : "rgba(200,62,52,0.07)"),
        }}>
        {on ? <CheckIcon size={13} /> : <CircleIcon size={13} stroke={1.6} />}
        <span style={{ ...monoLabel, fontSize: 9.5 }}>{on ? `Done ${fmtDate(t.completed_at)}` : "Open"}</span>
      </Pill>
    );
  }

  function subtitle(t) {
    if (t.recurring) {
      if (!t.last_done_at) return "Not done yet";
      const who = personById(t.last_done_by);
      return `Last done ${fmtDate(t.last_done_at)}${who ? ` by ${who.name}` : ""} · ${t.done_count}×`;
    }
    if (t.completed) {
      const who = personById(t.completed_by);
      return `Completed ${fmtDate(t.completed_at)}${who ? ` by ${who.name}` : ""}`;
    }
    return "";
  }

  function TaskRow(t) {
    const meta = subtitle(t);
    return (
      <div key={t.id} style={{
        ...cardStyle, display: "flex", alignItems: "center", gap: 14,
        padding: isMobile ? "14px 15px" : "15px 18px",
        flexWrap: isMobile ? "wrap" : "nowrap",
        transition: "border-color 0.18s",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: dv.serif, fontSize: isMobile ? 16 : 18, fontWeight: 400, lineHeight: 1.25,
            color: dv.ink, wordBreak: "break-word", letterSpacing: "-0.01em",
          }}>
            {t.title}
            {t.recurring && (
              <span style={{
                marginLeft: 9, display: "inline-flex", alignItems: "center", gap: 4, verticalAlign: "middle",
                padding: "2px 7px", borderRadius: 5, background: D ? "rgba(184,146,74,0.14)" : "rgba(184,146,74,0.10)",
                color: dv.gold, ...monoLabel, fontSize: 8.5,
              }}><RepeatIcon size={9} stroke={2.2} />Recurring</span>
            )}
          </div>
          {meta && <div style={{ fontFamily: dv.sans, fontSize: 12.5, color: dv.taupe, marginTop: 4 }}>{meta}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: "none",
          width: isMobile ? "100%" : "auto", order: isMobile ? 3 : 0 }}>
          {assigneePill(t)}
          {statusControl(t)}
          <button type="button" onClick={() => setEditing({ ...t })} aria-label={`Edit ${t.title}`} title="Edit"
            style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid transparent", background: "transparent",
              color: dv.stone, cursor: "pointer", display: "grid", placeItems: "center", transition: "border-color 0.18s, color 0.18s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = dv.cream; e.currentTarget.style.color = dv.ink; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = dv.stone; }}>
            <PencilIcon size={13} />
          </button>
        </div>
      </div>
    );
  }

  // Section rule — the app's standard "eyebrow + hairline" divider.
  const SectionRule = ({ children, count, right }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 16px", ...monoLabel, fontSize: 11, letterSpacing: "0.15em", color: dv.taupe }}>
      <div style={{ width: 28, height: 1, background: dv.accent, flex: "none" }} />
      <strong style={{ color: dv.ink, fontWeight: 500, whiteSpace: "nowrap" }}>
        {children}{count != null && <span style={{ color: dv.taupe, marginLeft: 8 }}>{count}</span>}
      </strong>
      <div style={{ flex: 1, height: 1, background: dv.cream }} />
      {right}
    </div>
  );

  const chipBase = {
    border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe,
    fontFamily: dv.sans, fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 999,
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.18s",
  };
  const chipOn = { borderColor: dv.accent, color: dv.ink, background: D ? "rgba(200,85,61,0.12)" : "rgba(200,85,61,0.07)" };

  const openCount = tasks.filter((t) => !isDone(t)).length;
  const doneCount = tasks.filter(isDone).length;

  const Stat = ({ n, label }) => (
    <div>
      <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 26 : 32, fontWeight: 400, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: dv.ink }}>{n}</div>
      <div style={{ ...monoLabel, fontSize: 10.5, letterSpacing: "0.1em", color: dv.taupe, marginTop: 4 }}>{label}</div>
    </div>
  );

  const Segmented = ({ value, onChange }) => (
    <div style={{ display: "inline-flex", padding: 3, background: D ? "rgba(255,255,255,0.05)" : "#F4F1EC", borderRadius: 9, border: `1px solid ${dv.cream}` }}>
      {[["One-time", false], ["Recurring", true]].map(([label, val]) => {
        const on = value === val;
        return (
          <button key={label} type="button" onClick={() => onChange(val)} style={{
            border: "none", background: on ? dv.paper : "transparent",
            color: on ? dv.ink : dv.taupe, ...monoLabel, fontSize: 9.5,
            padding: "8px 13px", borderRadius: 7, cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: on ? (D ? "0 1px 3px rgba(0,0,0,0.4)" : "0 1px 2px rgba(0,0,0,0.06)") : "none",
            transition: "all 0.18s",
          }}>{label}</button>
        );
      })}
    </div>
  );

  return (
    <div style={wrap}>
      {/* ── Hero ── */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: isMobile ? 22 : 48,
        alignItems: "end", paddingBottom: isMobile ? 24 : 34, marginBottom: isMobile ? 26 : 36,
        borderBottom: `1px solid ${dv.cream}`,
      }}>
        <div>
          <Eyebrow />
          <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 30 : "clamp(48px, 7vw, 76px)", fontWeight: 300, lineHeight: isMobile ? 1.04 : 0.94, letterSpacing: "-0.035em", margin: 0, color: dv.ink }}>
            Who's doing <em style={{ fontStyle: "italic", fontWeight: 400, color: dv.accent }}>what.</em>
          </h1>
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: isMobile ? 14 : 16, lineHeight: 1.5, color: dv.taupe, margin: "14px 0 0", maxWidth: 420 }}>
            A running ledger of the household's responsibilities — the one-time jobs that get finished, and the recurring ones that never quite do.
          </p>
        </div>
        <div style={{ display: "flex", gap: isMobile ? 28 : 40, paddingTop: isMobile ? 0 : 8 }}>
          <Stat n={openCount} label="Open" />
          <Stat n={doneCount} label="Done" />
          <Stat n={people.length} label={people.length === 1 ? "Person" : "People"} />
        </div>
      </div>

      {/* ── Composer ── */}
      <div style={{ ...cardStyle, display: "flex", gap: 10, alignItems: "center", padding: isMobile ? 10 : 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={addTitle} onChange={(e) => setAddTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
          placeholder="Add a task…" maxLength={100}
          style={{ flex: 1, minWidth: 180, border: "none", background: "transparent", color: dv.ink,
            fontFamily: dv.serif, fontSize: isMobile ? 16 : 18, padding: "6px 8px", outline: "none" }} />
        <Segmented value={addRecurring} onChange={setAddRecurring} />
        <button type="button" onClick={addTask} style={{ ...primaryBtn, display: "inline-flex", alignItems: "center", gap: 7 }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
          <PlusIcon size={12} stroke={2.4} />Add
        </button>
      </div>

      {/* ── Filters + people ── */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: isMobile ? 26 : 34 }}>
        {people.length > 0 && (
          <button type="button" onClick={() => setFilter(null)}
            style={{ ...chipBase, ...(filter === null ? chipOn : {}) }}>Everyone</button>
        )}
        {people.map((p) => (
          <button key={p.id} type="button" onClick={() => setFilter(filter === p.id ? null : p.id)}
            style={{ ...chipBase, ...(filter === p.id ? chipOn : {}) }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flex: "none" }} />{p.name}
          </button>
        ))}
        <button type="button" onClick={() => setShowPeople(true)}
          style={{ ...chipBase, borderStyle: "dashed", color: dv.accent }}>
          <PlusIcon size={11} stroke={2.2} />People
        </button>
      </div>

      {/* ── The ledger — one flat list, completed tasks stay put ── */}
      <div>
        <SectionRule count={visible.length || null} right={doneCount > 0 ? (
          <button type="button" onClick={clearDone}
            style={{ border: "none", background: "none", color: dv.accent, ...monoLabel, fontSize: 9.5, cursor: "pointer", padding: 0, flex: "none" }}>Clear done</button>
        ) : null}>The list</SectionRule>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.length === 0 && (
            <div style={{ ...cardStyle, padding: isMobile ? "26px 18px" : "34px 24px", textAlign: "center", background: "transparent", borderStyle: "dashed" }}>
              <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 15, color: dv.taupe, margin: 0 }}>
                {filter ? "Nothing on their plate." : "No tasks yet — add the first one above."}
              </p>
            </div>
          )}
          {visible.map(TaskRow)}
        </div>
      </div>

      {/* ── Assign modal — type a name, or pick someone already on the list ── */}
      {assigning && (
        <Overlay dv={dv} isMobile={isMobile} onClose={() => { setAssigning(null); setAssignName(""); }}
          eyebrow="Responsible" title={assigning.title}
          footer={
            <>
              {assigning.assignee_id && (
                <button type="button" onClick={() => setAssignee(assigning, null)} style={ghostBtn}>Unassign</button>
              )}
              <div style={{ flex: 1 }} />
              <button type="button" onClick={() => { setAssigning(null); setAssignName(""); }} style={ghostBtn}>Cancel</button>
              <button type="button" onClick={() => assignTypedName(assigning)}
                style={{ ...primaryBtn, opacity: assignName.trim() ? 1 : 0.4, cursor: assignName.trim() ? "pointer" : "default" }}>Assign</button>
            </>
          }>
          <label style={{ display: "block", ...monoLabel, color: dv.taupe, marginBottom: 8 }}>Name</label>
          <input value={assignName} onChange={(e) => setAssignName(e.target.value)} autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") assignTypedName(assigning); }}
            placeholder="Type a name" maxLength={24}
            style={{ ...fieldStyle, fontFamily: dv.serif, fontSize: 17 }} />
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13.5, lineHeight: 1.5, color: dv.taupe, margin: "10px 0 0" }}>
            A new name is added to the household; an existing one is reused.
          </p>
          {people.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 12px" }}>
                <div style={{ ...monoLabel, fontSize: 9.5, color: dv.taupe, whiteSpace: "nowrap" }}>Or pick someone</div>
                <div style={{ flex: 1, height: 1, background: dv.cream }} />
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {people.map((p) => {
                  const on = assigning.assignee_id === p.id;
                  return (
                    <button key={p.id} type="button" onClick={() => setAssignee(assigning, p.id)}
                      style={{ ...chipBase, paddingLeft: 6, ...(on ? chipOn : {}) }}>
                      <Bubble p={p} size={20} />{p.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Overlay>
      )}

      {/* ── Edit modal ── */}
      {editing && (
        <Overlay dv={dv} isMobile={isMobile} onClose={() => setEditing(null)} eyebrow="Task" title="Edit task"
          footer={
            <>
              <button type="button" onClick={() => deleteTask(editing.id)}
                style={{ ...ghostBtn, display: "inline-flex", alignItems: "center", gap: 7, color: dv.accent, borderColor: "rgba(200,85,61,0.3)", background: D ? "rgba(200,85,61,0.10)" : "rgba(200,85,61,0.06)" }}>
                <TrashIcon size={13} />Delete
              </button>
              <div style={{ flex: 1 }} />
              <button type="button" onClick={() => setEditing(null)} style={ghostBtn}>Cancel</button>
              <button type="button" onClick={saveEdit} style={primaryBtn}>Save</button>
            </>
          }>
          <label style={{ display: "block", ...monoLabel, color: dv.taupe, marginBottom: 8 }}>Task</label>
          <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} maxLength={100}
            style={{ ...fieldStyle, fontFamily: dv.serif, fontSize: 17, marginBottom: 20 }} />
          <label style={{ display: "block", ...monoLabel, color: dv.taupe, marginBottom: 8 }}>Type</label>
          <Segmented value={editing.recurring} onChange={(val) => setEditing({ ...editing, recurring: val })} />
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13.5, lineHeight: 1.5, color: dv.taupe, margin: "14px 0 0" }}>
            {editing.recurring
              ? "Recurring tasks stay on the list and keep a running count of every time they're done."
              : "One-time tasks sink into Done once they're finished."}
          </p>
        </Overlay>
      )}

      {/* ── People modal ── */}
      {showPeople && (
        <Overlay dv={dv} isMobile={isMobile} onClose={() => setShowPeople(false)} eyebrow="Household" title="People"
          footer={
            <>
              <div style={{ flex: 1 }} />
              <button type="button" onClick={() => setShowPeople(false)} style={primaryBtn}>Done</button>
            </>
          }>
          <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
            <input value={newPerson} onChange={(e) => setNewPerson(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { addPerson(newPerson); setNewPerson(""); } }}
              placeholder="Add a person" maxLength={24}
              style={{ ...fieldStyle, fontSize: 14.5 }} />
            <button type="button" onClick={() => { addPerson(newPerson); setNewPerson(""); }}
              style={{ ...primaryBtn, flex: "none" }}>Add</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {people.length === 0 && (
              <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, color: dv.taupe, margin: 0 }}>No one yet.</p>
            )}
            {people.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", border: `1px solid ${dv.cream}`, borderRadius: 10 }}>
                <Bubble p={p} size={28} />
                <input defaultValue={p.name} onBlur={(e) => renamePerson(p.id, e.target.value)} maxLength={24}
                  style={{ border: "none", background: "none", color: dv.ink, fontFamily: dv.sans, fontSize: 14, fontWeight: 500, width: 84, minWidth: 0, outline: "none" }} />
                <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                  {PALETTE.map((c) => (
                    <button key={c} type="button" onClick={() => recolorPerson(p.id, c)} aria-label={`Set colour ${c}`}
                      style={{ width: 15, height: 15, borderRadius: "50%", background: c, border: c === p.color ? `2px solid ${dv.ink}` : "2px solid transparent", cursor: "pointer", padding: 0, transition: "border-color 0.18s" }} />
                  ))}
                </div>
                <button type="button" onClick={() => deletePerson(p.id)} aria-label={`Remove ${p.name}`} title="Remove"
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid transparent", background: "none", cursor: "pointer", color: dv.stone, display: "grid", placeItems: "center", flex: "none", transition: "color 0.18s, border-color 0.18s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = dv.accent; e.currentTarget.style.borderColor = "rgba(200,85,61,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = dv.stone; e.currentTarget.style.borderColor = "transparent"; }}>
                  <TrashIcon size={13} />
                </button>
              </div>
            ))}
          </div>
        </Overlay>
      )}
    </div>
  );
}

/*
 * Modal shell — the app's standard sheet: one scroll container with a sticky
 * header (title + close) and a sticky action footer, docked above the bottom
 * tab bar on mobile so the footer stays reachable.
 */
function Overlay({ children, onClose, dv, isMobile, title, eyebrow, footer }) {
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center",
        padding: isMobile ? "0 0 calc(132px + env(safe-area-inset-bottom)) 0" : 24,
        overscrollBehavior: "contain",
      }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 460,
        maxHeight: isMobile ? "calc(var(--app-height, 100dvh) * 0.78)" : "86vh",
        overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain",
        background: dv.bone, border: `1px solid ${dv.cream}`,
        borderRadius: isMobile ? 18 : 16, boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
      }}>
        {/* Sticky header — stays put while the body scrolls. */}
        <div style={{
          position: "sticky", top: 0, zIndex: 2, background: dv.bone, borderBottom: `1px solid ${dv.cream}`,
          padding: isMobile ? "16px 18px" : "18px 22px", display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            {eyebrow && (
              <div style={{ fontFamily: dv.mono, fontSize: 10, letterSpacing: "0.13em", textTransform: "uppercase", color: dv.accent, marginBottom: 4 }}>{eyebrow}</div>
            )}
            <div style={{ fontFamily: dv.serif, fontSize: isMobile ? 20 : 23, fontWeight: 400, color: dv.ink, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{title}</div>
          </div>
          <button type="button" onClick={onClose} title="Close" aria-label="Close"
            style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${dv.cream}`, background: "transparent", color: dv.taupe, cursor: "pointer", display: "grid", placeItems: "center", flex: "none", transition: "border-color 0.18s, color 0.18s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = dv.ink; e.currentTarget.style.color = dv.ink; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = dv.cream; e.currentTarget.style.color = dv.taupe; }}>
            <CloseIcon size={15} stroke={2} />
          </button>
        </div>

        <div style={{ padding: isMobile ? "18px 18px 20px" : "20px 22px 22px" }}>{children}</div>

        {footer && (
          <div style={{
            position: "sticky", bottom: 0, zIndex: 2, display: "flex", gap: 8, alignItems: "center",
            padding: isMobile ? "12px 18px calc(12px + env(safe-area-inset-bottom))" : "14px 22px",
            borderTop: `1px solid ${dv.cream}`, background: dv.bone,
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
