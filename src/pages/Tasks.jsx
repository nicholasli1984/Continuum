import React, { useState, useEffect } from "react";

/*
 * Tasks — a shared household ledger of responsibilities.
 *
 * A flat, running list (not a calendar). Tasks come in over time and never
 * disappear on their own; each carries who's responsible and whether it's done.
 *
 *   One-time task — "done" is sticky. Completing it stamps the date + who,
 *                   turns the status pill green and moves it to the Completed
 *                   pile at the foot of the page. Toggle back any time.
 *   Recurring task — never persistently done. Tapping done logs a completion
 *                    (date, who, running count) and it stays in its month.
 *
 * The ledger is grouped by the month each task was added, newest month first,
 * so a long list stays legible; nothing is ever struck through. Assignment is
 * explicit: the pill opens a sheet where a name is typed (new names join the
 * household roster).
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

/* ── Recurring cadence ──────────────────────────────────────────────────────
 * A recurring task repeats on a fixed rhythm, so "done" is only ever true for
 * a given occurrence: this week's laundry, this month's rent. Each cadence
 * slices the calendar into periods, one completion per period, and the row
 * carries a short trail of recent periods so a missed one is visible and any
 * occurrence — including a mis-tap — can be toggled back off.
 */
const CADENCES = [
  { id: "daily",   label: "Daily",   noun: "today",      trail: 7 },
  { id: "weekly",  label: "Weekly",  noun: "this week",  trail: 8 },
  { id: "monthly", label: "Monthly", noun: "this month", trail: 6 },
  { id: "yearly",  label: "Yearly",  noun: "this year",  trail: 4 },
];
const cadenceOf = (t) => CADENCES.find((c) => c.id === t.cadence) || CADENCES[1];

const parseDay = (s) => new Date(`${s}T00:00:00`);
const toDayStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

// ISO week (Monday-based), so "this week" doesn't drift by locale.
function isoWeek(date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));   // shift to the Thursday of this week
  const week1 = new Date(d.getFullYear(), 0, 4);
  const week = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return { year: d.getFullYear(), week };
}
const mondayOf = (date) => { const d = startOfDay(date); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };

// Period boundaries. A period is identified by the day it starts on, which is
// what start dates are compared against — a task that starts mid-month starts
// with that whole month's occurrence.
function periodStartOf(date, cadenceId) {
  const d = startOfDay(date);
  if (cadenceId === "daily") return d;
  if (cadenceId === "monthly") return new Date(d.getFullYear(), d.getMonth(), 1);
  if (cadenceId === "yearly") return new Date(d.getFullYear(), 0, 1);
  return mondayOf(d);
}
function periodEndOf(start, cadenceId) {
  if (cadenceId === "daily") return new Date(start);
  if (cadenceId === "monthly") return new Date(start.getFullYear(), start.getMonth() + 1, 0);
  if (cadenceId === "yearly") return new Date(start.getFullYear(), 11, 31);
  const e = new Date(start); e.setDate(e.getDate() + 6); return e;
}
function shiftPeriods(start, cadenceId, n) {
  const d = new Date(start);
  if (cadenceId === "daily") d.setDate(d.getDate() + n);
  else if (cadenceId === "monthly") d.setMonth(d.getMonth() + n);
  else if (cadenceId === "yearly") d.setFullYear(d.getFullYear() + n);
  else d.setDate(d.getDate() + 7 * n);
  return d;
}
function periodLabel(start, cadenceId) {
  if (cadenceId === "daily") return start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  if (cadenceId === "monthly") return start.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  if (cadenceId === "yearly") return `${start.getFullYear()}`;
  return `Week of ${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
// Short form for the status pill — "Aug 2026", "Mon Sep 7", "2027".
function shortPeriodLabel(start, cadenceId) {
  if (cadenceId === "daily") return start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (cadenceId === "monthly") return start.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  if (cadenceId === "yearly") return `${start.getFullYear()}`;
  return start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// A period key identifies one occurrence — two dates in the same period share it.
function periodKey(date, cadenceId) {
  const d = startOfDay(date);
  if (cadenceId === "daily") return toDayStr(d);
  if (cadenceId === "monthly") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  if (cadenceId === "yearly") return `${d.getFullYear()}`;
  const { year, week } = isoWeek(d);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/*
 * The periods to draw in a row's trail, oldest first, each with the date a
 * completion logged against it should carry (clamped so it's never in the
 * future). `startsOn` bounds the history: a monthly task that starts in August
 * has no July occurrence, so nothing before it is drawn or markable. A task
 * whose start is still ahead shows its first upcoming periods instead, all
 * inactive until it begins.
 */
function occurrencePeriods(cadenceId, count, startsOn) {
  const today = startOfDay(new Date());
  const curStart = periodStartOf(today, cadenceId);
  const fromStart = startsOn ? periodStartOf(parseDay(startsOn), cadenceId) : null;
  const notYetStarted = !!fromStart && fromStart > curStart;

  let first = notYetStarted ? fromStart : shiftPeriods(curStart, cadenceId, -(count - 1));
  if (!notYetStarted && fromStart && fromStart > first) first = fromStart;

  const out = [];
  for (let i = 0; i < count; i++) {
    const start = shiftPeriods(first, cadenceId, i);
    if (!notYetStarted && start > curStart) break;    // never draw ahead of the current period
    const end = periodEndOf(start, cadenceId);
    const stamp = end > today ? today : end;
    out.push({
      key: periodKey(start, cadenceId),
      label: periodLabel(start, cadenceId),
      stampDate: toDayStr(stamp < start ? start : stamp),
      isCurrent: start.getTime() === curStart.getTime(),
      isFuture: start > curStart,
    });
  }
  return out;
}

// Where a recurring task stands relative to its start date.
function startState(t, cadenceId) {
  if (!t.starts_on) return { pending: false };
  const curStart = periodStartOf(new Date(), cadenceId);
  const fromStart = periodStartOf(parseDay(t.starts_on), cadenceId);
  return { pending: fromStart > curStart, label: shortPeriodLabel(fromStart, cadenceId) };
}

// Completion log. Older rows predate the log and only carry last_done_at, so
// they're read as a single historic completion.
function completionsOf(t) {
  const raw = Array.isArray(t.completions) ? t.completions : [];
  if (raw.length === 0 && t.last_done_at) return [{ on: t.last_done_at, by: t.last_done_by || null }];
  return raw;
}

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
const ClockIcon = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></>} />;
const NoteIcon = (p) => <Icon {...p} d={<><path d="M4 5h16" /><path d="M4 10h16" /><path d="M4 15h10" /><path d="M4 20h6" /></>} />;

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
    note: D ? "#8AB4DC" : "#3A6491",  // notes — italic blue, set apart from the warm palette
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
  // null=loading | false=needs the base migration | "patch"=needs the cadence
  // patch | true=ok
  const [ready, setReady] = useState(null);
  const [filter, setFilter] = useState(null);
  const [addTitle, setAddTitle] = useState("");
  const [addRecurring, setAddRecurring] = useState(false);
  const [addCadence, setAddCadence] = useState("weekly");
  const [addStartsOn, setAddStartsOn] = useState(todayStr());
  const [editing, setEditing] = useState(null);      // task being edited
  const [assigning, setAssigning] = useState(null);  // task whose assignee is being set
  const [assignName, setAssignName] = useState("");  // typed name in the assign sheet
  const [showCompleted, setShowCompleted] = useState(false);   // the Completed pile stays folded away
  const [noteEditing, setNoteEditing] = useState(null);  // task id whose note is open
  const [noteDraft, setNoteDraft] = useState("");
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
    // Later columns arrived in patches — probe for them explicitly, since
    // select("*") can't tell an empty table from an un-patched one. Each patch
    // is probed on its own so the setup card names only what's actually missing.
    const [cad, note] = await Promise.all([
      supabase.from("tasks").select("id,cadence,completions,starts_on").limit(1),
      supabase.from("tasks").select("id,note").limit(1),
    ]);
    const missing = [];
    if (cad.error?.code === "42703") missing.push("cadence");
    if (note.error?.code === "42703") missing.push("notes");
    setReady(missing.length ? missing : true);
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
      owner_id: user.id, title, recurring: addRecurring, cadence: addCadence,
      starts_on: addRecurring ? (addStartsOn || todayStr()) : null, assignee_id: null,
      completed: false, completed_at: null, completed_by: null,
      done_count: 0, last_done_at: null, last_done_by: null, completions: [],
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

  /*
   * Recurring completions are toggled per occurrence rather than counted up, so
   * an accidental tap is undone by tapping the same period again. done_count /
   * last_done_at / last_done_by stay in sync as a rollup of the log.
   */
  function togglePeriod(t, key, stampDate) {
    const cad = cadenceOf(t).id;
    const list = completionsOf(t);
    const hit = list.find((c) => periodKey(parseDay(c.on), cad) === key);
    const next = hit
      ? list.filter((c) => c !== hit)
      : [...list, { on: stampDate, by: t.assignee_id || null }].sort((a, b) => a.on.localeCompare(b.on));
    const latest = next.length ? next[next.length - 1] : null;
    const patch = {
      completions: next,
      done_count: next.length,
      last_done_at: latest ? latest.on : null,
      last_done_by: latest ? latest.by : null,
    };
    patchLocal(t.id, patch);
    pushDb(t.id, patch);
  }

  // The pill acts on the occurrence happening right now.
  function toggleCurrentPeriod(t) {
    const cad = cadenceOf(t).id;
    togglePeriod(t, periodKey(new Date(), cad), todayStr());
  }

  async function saveEdit() {
    const t = editing;
    const title = t.title.trim();
    if (!title) return;
    const patch = {
      title, recurring: t.recurring, cadence: t.cadence || "weekly",
      starts_on: t.recurring ? (t.starts_on || todayStr()) : null,
    };
    // Switching kind clears the stamps that only apply to the other kind.
    if (t.recurring !== tasks.find((x) => x.id === t.id)?.recurring) {
      Object.assign(patch, { completed: false, completed_at: null, completed_by: null, done_count: 0, last_done_at: null, last_done_by: null, completions: [] });
    }
    patchLocal(t.id, patch);
    setEditing(null);
    await pushDb(t.id, patch);
  }

  /* ---------- notes ---------- */
  function openNote(t) { setNoteEditing(t.id); setNoteDraft(t.note || ""); }
  function closeNote() { setNoteEditing(null); setNoteDraft(""); }
  function saveNote(t) {
    const text = noteDraft.trim();
    if (text === (t.note || "")) { closeNote(); return; }   // nothing changed — don't touch the row
    const patch = { note: text || null };
    patchLocal(t.id, patch);
    pushDb(t.id, patch);
    closeNote();
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
  /*
   * The ledger is grouped by the month a task was added — a single unbroken
   * list gets unreadable once it runs to any length. Recurring tasks never
   * leave their month; a finished one-time task drops out of its month and
   * into the Completed pile at the foot of the page.
   */
  const visible = tasks.filter(matches);
  const live = visible.filter((t) => !isDone(t));            // created_at desc from the query
  const finished = visible.filter(isDone)
    .sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""));
  const monthsOf = (list) => {
    const map = new Map();
    list.forEach((t) => {
      const d = t.created_at ? new Date(t.created_at) : new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, { key, label: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }), items: [] });
      }
      map.get(key).items.push(t);
    });
    return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));   // newest month first
  };
  const liveMonths = monthsOf(live);

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
  // Native date input, dressed to match the chips beside it.
  const dateFieldStyle = {
    border: `1px solid ${dv.cream}`, background: D ? "rgba(255,255,255,0.04)" : "#FCFBF8", color: dv.ink,
    fontFamily: dv.mono, fontSize: 11, padding: "6px 10px", borderRadius: 999, outline: "none",
    colorScheme: D ? "dark" : "light", cursor: "pointer",
  };
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

  if (ready === false || Array.isArray(ready)) {
    const mono = { fontFamily: dv.mono, fontSize: 13, color: dv.ink };
    const patches = Array.isArray(ready) ? ready : [];
    return (
      <div style={wrap}>
        <Eyebrow />
        <h1 style={{ fontFamily: dv.serif, fontSize: isMobile ? 28 : 60, fontWeight: 300, lineHeight: 0.98, letterSpacing: "-0.03em", margin: "0 0 20px", color: dv.ink }}>
          One <em style={{ fontStyle: "italic", fontWeight: 400, color: dv.accent }}>setup step</em> left.
        </h1>
        <div style={{ ...cardStyle, padding: isMobile ? "18px" : "24px 26px", maxWidth: 520 }}>
          <p style={{ fontFamily: dv.sans, fontSize: 15, lineHeight: 1.55, color: dv.taupe, margin: 0 }}>
            {patches.length ? (
              <>Run {patches.includes("cadence") && <span style={mono}>supabase-tasks-cadence-migration.sql</span>}
                {patches.length > 1 && " and "}
                {patches.includes("notes") && <span style={mono}>supabase-tasks-notes-migration.sql</span>} in your
                Supabase SQL editor, then reopen this tab.{" "}
                {patches.includes("cadence") && "The first adds how often a recurring task repeats, when it begins, and which occurrences are done. "}
                {patches.includes("notes") && "The notes patch adds the per-task note. "}
                Both are safe to re-run.</>
            ) : (
              <>Run <span style={mono}>supabase-tasks-migration.sql</span> in your Supabase SQL editor to create
                the <span style={mono}>tasks</span> and <span style={mono}>task_people</span> tables, then reopen this tab.</>
            )}
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

  // Is the occurrence happening right now already logged?
  const doneThisPeriod = (t) => {
    const cad = cadenceOf(t).id;
    const nowKey = periodKey(new Date(), cad);
    return completionsOf(t).some((c) => periodKey(parseDay(c.on), cad) === nowKey);
  };

  // Status reads at a glance: red while open, green once complete.
  function statusControl(t) {
    if (t.recurring) {
      const cad = cadenceOf(t);
      const start = startState(t, cad.id);
      // Hasn't come round yet — say when it starts rather than calling it due.
      if (start.pending) {
        return (
          <Pill onClick={() => setEditing({ ...t })} title={`Starts ${start.label} — tap to change`}
            style={{ padding: "6px 13px", gap: 6, color: dv.gold, borderColor: `${dv.gold}55`, cursor: "pointer",
              background: D ? "rgba(184,146,74,0.12)" : "rgba(184,146,74,0.08)" }}>
            <ClockIcon size={13} /><span style={{ ...monoLabel, fontSize: 9.5 }}>Starts {start.label}</span>
          </Pill>
        );
      }
      const on = doneThisPeriod(t);
      return (
        <Pill onClick={() => toggleCurrentPeriod(t)}
          title={on ? `Logged for ${cad.noun} — tap to undo` : `Mark done for ${cad.noun}`}
          style={{
            padding: "6px 13px", gap: 6,
            color: on ? dv.moss : dv.red,
            borderColor: on ? `${dv.moss}55` : `${dv.red}55`,
            background: on
              ? (D ? "rgba(107,122,90,0.12)" : "rgba(107,122,90,0.07)")
              : (D ? "rgba(200,62,52,0.14)" : "rgba(200,62,52,0.07)"),
          }}>
          {on ? <CheckIcon size={13} /> : <CircleIcon size={13} stroke={1.6} />}
          <span style={{ ...monoLabel, fontSize: 9.5 }}>{on ? `Done ${cad.noun}` : `Due ${cad.noun}`}</span>
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
      const log = completionsOf(t);
      if (!log.length) return "Not done yet";
      const latest = log[log.length - 1];
      const who = personById(latest.by);
      return `Last done ${fmtDate(latest.on)}${who ? ` by ${who.name}` : ""} · ${log.length}×`;
    }
    if (t.completed) {
      const who = personById(t.completed_by);
      return `Completed ${fmtDate(t.completed_at)}${who ? ` by ${who.name}` : ""}`;
    }
    return "";
  }

  /*
   * Occurrence trail — one cell per recent period, oldest on the left. Filled
   * means that occurrence is logged, hollow means it was missed, and the
   * current period carries a ring. Every cell is tappable, so a week that was
   * forgotten can be filled in and a mis-tap can be cleared.
   */
  function occurrenceTrail(t) {
    const cad = cadenceOf(t);
    const log = completionsOf(t);
    const doneKeys = new Set(log.map((c) => periodKey(parseDay(c.on), cad.id)));
    const periods = occurrencePeriods(cad.id, cad.trail, t.starts_on);
    const pending = startState(t, cad.id).pending;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
        {periods.map((p) => {
          const filled = doneKeys.has(p.key);
          return (
            <button key={p.key} type="button" disabled={p.isFuture}
              onClick={() => { if (!p.isFuture) togglePeriod(t, p.key, p.stampDate); }}
              title={p.isFuture ? `${p.label} — not yet` : `${p.label} — ${filled ? "done, tap to undo" : "not done, tap to log"}`}
              aria-label={`${p.label}: ${p.isFuture ? "upcoming" : filled ? "done" : "not done"}`}
              style={{
                width: 16, height: 16, padding: 0, borderRadius: 4,
                cursor: p.isFuture ? "default" : "pointer",
                background: filled ? dv.moss : "transparent",
                border: filled ? `1px solid ${dv.moss}` : `1px ${p.isFuture ? "dashed" : "solid"} ${dv.cream}`,
                opacity: p.isFuture ? 0.7 : 1,
                boxShadow: p.isCurrent ? `0 0 0 2px ${D ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"}` : "none",
                transition: "background 0.18s, border-color 0.18s",
              }} />
          );
        })}
        <span style={{ ...monoLabel, fontSize: 8.5, color: dv.stone, marginLeft: 6 }}>
          {pending
            ? `From ${startState(t, cad.id).label}`
            : `Since ${t.starts_on ? shortPeriodLabel(periodStartOf(parseDay(t.starts_on), cad.id), cad.id) : periods[0]?.label || ""}`}
        </span>
      </div>
    );
  }

  /*
   * Note — one free-text aside per task, set in italic blue so it reads as a
   * margin annotation rather than part of the task itself. Click it to edit;
   * Enter saves, Escape reverts, blur saves. Emptying it removes the note.
   */
  // A plain render function, not a component: an inner component would be a new
  // type on every render, so React would remount the textarea — and drop the
  // caret — on each keystroke.
  function noteBlock(t) {
    const editingThis = noteEditing === t.id;
    if (editingThis) {
      return (
        <div style={{ marginTop: 9, display: "flex", alignItems: "flex-start", gap: 9 }}>
          <span style={{ width: 2, alignSelf: "stretch", background: dv.note, opacity: 0.5, borderRadius: 2, flex: "none" }} />
          <textarea value={noteDraft} autoFocus rows={2}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={() => saveNote(t)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNote(t); }
              if (e.key === "Escape") { e.preventDefault(); closeNote(); }
            }}
            placeholder="Add a note…" maxLength={280}
            style={{
              flex: 1, resize: "vertical", minHeight: 46, padding: "8px 10px", borderRadius: 8,
              border: `1px solid ${dv.note}55`, background: D ? "rgba(138,180,220,0.07)" : "rgba(58,100,145,0.04)",
              color: dv.note, fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, lineHeight: 1.5, outline: "none",
            }} />
        </div>
      );
    }
    if (t.note) {
      return (
        <div onClick={() => openNote(t)} title="Click to edit this note"
          style={{ marginTop: 9, display: "flex", alignItems: "flex-start", gap: 9, cursor: "text" }}>
          <span style={{ width: 2, alignSelf: "stretch", background: dv.note, opacity: 0.5, borderRadius: 2, flex: "none" }} />
          <p style={{ margin: 0, fontFamily: dv.serif, fontStyle: "italic", fontSize: 14, lineHeight: 1.5, color: dv.note, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {t.note}
          </p>
        </div>
      );
    }
    return (
      <button type="button" onClick={() => openNote(t)}
        style={{
          marginTop: 8, border: "none", background: "none", padding: 0, cursor: "pointer",
          color: dv.note, opacity: 0.75, ...monoLabel, fontSize: 9,
          display: "inline-flex", alignItems: "center", gap: 5, transition: "opacity 0.18s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.75"; }}>
        <NoteIcon size={11} />Add note
      </button>
    );
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
              }}><RepeatIcon size={9} stroke={2.2} />{cadenceOf(t).label}</span>
            )}
          </div>
          {meta && <div style={{ fontFamily: dv.sans, fontSize: 12.5, color: dv.taupe, marginTop: 4 }}>{meta}</div>}
          {t.recurring && occurrenceTrail(t)}
          {noteBlock(t)}
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

  // Cadence picker — only meaningful once "Recurring" is chosen.
  const CadencePicker = ({ value, onChange }) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {CADENCES.map((c) => {
        const on = (value || "weekly") === c.id;
        return (
          <button key={c.id} type="button" onClick={() => onChange(c.id)} style={{
            border: `1px solid ${on ? dv.gold : dv.cream}`,
            background: on ? (D ? "rgba(184,146,74,0.16)" : "rgba(184,146,74,0.10)") : "transparent",
            color: on ? (D ? dv.ink : "#7A5F26") : dv.taupe,
            ...monoLabel, fontSize: 9.5, padding: "7px 12px", borderRadius: 999,
            cursor: "pointer", transition: "all 0.18s",
          }}>{c.label}</button>
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
        {addRecurring && (
          <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 8px 4px", borderTop: `1px solid ${dv.cream}`, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ ...monoLabel, fontSize: 9.5, color: dv.taupe }}>Repeats</span>
            <CadencePicker value={addCadence} onChange={setAddCadence} />
            <span style={{ ...monoLabel, fontSize: 9.5, color: dv.taupe, marginLeft: 4 }}>Starting</span>
            <input type="date" value={addStartsOn} onChange={(e) => setAddStartsOn(e.target.value)}
              style={dateFieldStyle} />
          </div>
        )}
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

      {/* ── The ledger — grouped by the month each task was added ── */}
      {live.length === 0 && (
        <div style={{ ...cardStyle, padding: isMobile ? "26px 18px" : "34px 24px", textAlign: "center", background: "transparent", borderStyle: "dashed" }}>
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 15, color: dv.taupe, margin: 0 }}>
            {filter ? "Nothing on their plate." : finished.length ? "All clear — everything's done." : "No tasks yet — add the first one above."}
          </p>
        </div>
      )}
      {liveMonths.map((m, i) => (
        <div key={m.key} style={{ marginBottom: i === liveMonths.length - 1 ? 0 : (isMobile ? 28 : 38) }}>
          <SectionRule count={m.items.length}>{m.label}</SectionRule>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{m.items.map(TaskRow)}</div>
        </div>
      ))}

      {/* ── Completed — one-time tasks that are finished, folded away at the foot ── */}
      {finished.length > 0 && (
        <div style={{ marginTop: isMobile ? 34 : 46 }}>
          <SectionRule count={finished.length} right={
            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
              <button type="button" onClick={() => setShowCompleted((v) => !v)}
                style={{ border: "none", background: "none", color: dv.taupe, ...monoLabel, fontSize: 9.5, cursor: "pointer", padding: 0 }}>
                {showCompleted ? "Hide" : "Show"}
              </button>
              <button type="button" onClick={clearDone}
                style={{ border: "none", background: "none", color: dv.accent, ...monoLabel, fontSize: 9.5, cursor: "pointer", padding: 0 }}>Clear done</button>
            </div>
          }>Completed</SectionRule>
          {showCompleted && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{finished.map(TaskRow)}</div>
          )}
        </div>
      )}

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
          {editing.recurring && (
            <>
              <div style={{ marginTop: 18 }}>
                <label style={{ display: "block", ...monoLabel, color: dv.taupe, marginBottom: 8 }}>Repeats</label>
                <CadencePicker value={editing.cadence} onChange={(val) => setEditing({ ...editing, cadence: val })} />
              </div>
              <div style={{ marginTop: 18 }}>
                <label style={{ display: "block", ...monoLabel, color: dv.taupe, marginBottom: 8 }}>Starting</label>
                <input type="date" value={editing.starts_on || todayStr()}
                  onChange={(e) => setEditing({ ...editing, starts_on: e.target.value })}
                  style={{ ...dateFieldStyle, fontSize: 13, padding: "9px 13px", borderRadius: 10 }} />
              </div>
            </>
          )}
          <p style={{ fontFamily: dv.serif, fontStyle: "italic", fontSize: 13.5, lineHeight: 1.5, color: dv.taupe, margin: "14px 0 0" }}>
            {editing.recurring
              ? `Comes due again ${(CADENCES.find((c) => c.id === (editing.cadence || "weekly")) || CADENCES[1]).noun.replace("this ", "every ").replace("today", "every day")} — each occurrence is logged on its own, and tapping a logged one clears it.`
              : "One-time tasks stay in place; completing one just turns its status green."}
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
