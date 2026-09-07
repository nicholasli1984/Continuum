import React, { useState, useEffect } from "react";

/*
 * Tasks — a shared household ledger of responsibilities.
 *
 * A flat, running list (not a calendar). Tasks come in over time and never
 * disappear on their own; each carries who's responsible and whether it's done.
 *
 *   One-time task — "done" is sticky. Completing it stamps the date + who and it
 *                   sinks into the Done group. Toggle back any time.
 *   Recurring task — never persistently done. Tapping done logs a completion
 *                    (date, who, running count) and it stays in the list.
 *
 * Single-owner model: `people` are labels owned by this account (no second
 * login). Everything is owner-scoped in Supabase with RLS — see
 * supabase-tasks-migration.sql.
 */

const PALETTE = ["#4f46e5", "#0ea5a4", "#e0693b", "#c3358f", "#2f80ed", "#3f9142", "#8a5cf6", "#c9962a"];
const initials = (name) => (name || "?").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fmtDate = (s) => s
  ? new Date(`${s}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })
  : "";

export function renderTasks(s) {
  return <TasksPage {...s} />;
}

function TasksPage({ css, isMobile, darkMode, user, supabase }) {
  const [people, setPeople] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [ready, setReady] = useState(null);   // null=loading, false=needs migration, true=ok
  const [filter, setFilter] = useState(null);
  const [addTitle, setAddTitle] = useState("");
  const [addRecurring, setAddRecurring] = useState(false);
  const [editing, setEditing] = useState(null);      // task being edited
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
  async function addPerson(name) {
    const nm = (name || "").trim();
    if (!nm) return;
    const color = PALETTE[people.length % PALETTE.length];
    const { data, error } = await supabase.from("task_people")
      .insert({ owner_id: user.id, name: nm, color }).select().single();
    if (error) { console.error(error); return; }
    setPeople((prev) => [...prev, data]);
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
  async function deletePerson(id) {
    if (!confirm("Remove this person? Their tasks become unassigned.")) return;
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

  function cycleAssignee(t) {
    const ids = [null, ...people.map((p) => p.id)];
    const next = ids[(ids.indexOf(t.assignee_id) + 1) % ids.length];
    patchLocal(t.id, { assignee_id: next });
    pushDb(t.id, { assignee_id: next });
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

  async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setEditing(null);
    await supabase.from("tasks").delete().eq("id", id);
  }

  async function clearDone() {
    const doneIds = tasks.filter(isDone).map((t) => t.id);
    if (!doneIds.length || !confirm(`Remove ${doneIds.length} completed task${doneIds.length > 1 ? "s" : ""}?`)) return;
    setTasks((prev) => prev.filter((t) => !isDone(t)));
    await supabase.from("tasks").delete().in("id", doneIds);
  }

  /* ---------- derived ---------- */
  const visible = tasks.filter(matches);
  const todo = visible.filter((t) => !isDone(t));  // already created_at desc from query
  const done = visible.filter(isDone).sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""));

  /* ---------- styles ---------- */
  const wrap = { maxWidth: 760, margin: "0 auto", padding: isMobile ? "16px 12px 64px" : "24px 20px 80px" };
  const card = { background: css.surface, border: `1px solid ${css.border}`, borderRadius: css.radius, boxShadow: css.shadow };

  if (!user) {
    return <div style={wrap}><p style={{ color: css.text2 }}>Sign in to use Tasks.</p></div>;
  }

  if (ready === null) {
    return <div style={wrap}><p style={{ color: css.text3 }}>Loading…</p></div>;
  }

  if (ready === false) {
    return (
      <div style={wrap}>
        <h1 style={{ fontSize: 24, color: css.text, margin: "0 0 8px" }}>Tasks</h1>
        <div style={{ ...card, padding: 20, marginTop: 12 }}>
          <p style={{ color: css.text, fontWeight: 600, margin: "0 0 6px" }}>One-time setup needed</p>
          <p style={{ color: css.text2, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Run <code>supabase-tasks-migration.sql</code> in your Supabase SQL editor to create the
            <code> tasks</code> and <code>task_people</code> tables, then reopen this tab.
          </p>
        </div>
      </div>
    );
  }

  /* ---------- pills ---------- */
  const Pill = ({ onClick, children, style, title }) => (
    <button type="button" onClick={onClick} title={title} style={{
      display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
      border: `1px solid ${css.border}`, background: css.surface, color: css.text,
      font: "inherit", fontSize: 12.5, fontWeight: 700, padding: "5px 11px 5px 6px",
      borderRadius: 999, whiteSpace: "nowrap", ...style,
    }}>{children}</button>
  );

  const Bubble = ({ p, size = 20 }) => (
    <span style={{
      width: size, height: size, flex: "none", borderRadius: "50%", display: "grid", placeItems: "center",
      background: p ? p.color : "transparent", color: p ? "#fff" : css.text3, fontSize: 10, fontWeight: 700,
      border: p ? "none" : `1px dashed ${css.border}`,
    }}>{p ? initials(p.name) : "+"}</span>
  );

  function assigneePill(t) {
    const p = personById(t.assignee_id);
    return (
      <Pill onClick={() => cycleAssignee(t)} title="Tap to change who's responsible"
        style={p ? {} : { borderStyle: "dashed", color: css.text3 }}>
        <Bubble p={p} /><span>{p ? p.name : "Assign"}</span>
      </Pill>
    );
  }

  function statusPill(t) {
    if (t.recurring) {
      return (
        <Pill onClick={() => logDone(t)} title="Record that this was done"
          style={{ color: css.success, borderColor: css.successBg, padding: "6px 12px" }}>
          ✓ Log done
        </Pill>
      );
    }
    return (
      <Pill onClick={() => toggleComplete(t)} title={t.completed ? "Tap to reopen" : "Tap to mark done"}
        style={{ padding: "6px 12px", color: t.completed ? css.success : css.text3,
          background: t.completed ? css.successBg : css.surface, borderColor: t.completed ? "transparent" : css.border }}>
        {t.completed ? `✓ Done ${fmtDate(t.completed_at)}` : "○ Not done"}
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
        ...card, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
        opacity: isDone(t) ? 0.62 : 1, flexWrap: isMobile ? "wrap" : "nowrap",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: css.text, wordBreak: "break-word",
            textDecoration: isDone(t) ? "line-through" : "none" }}>
            {t.title}
            {t.recurring && <span style={{ marginLeft: 8, padding: "1px 7px", borderRadius: 5,
              background: css.accentBg, color: css.accent, fontSize: 9.5, fontWeight: 800,
              letterSpacing: ".05em", textTransform: "uppercase", verticalAlign: "middle" }}>Recurring</span>}
          </div>
          {meta && <div style={{ fontSize: 12, color: css.text3, marginTop: 3 }}>{meta}</div>}
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center", flex: "none",
          width: isMobile ? "100%" : "auto", order: isMobile ? 3 : 0 }}>
          {assigneePill(t)}
          {statusPill(t)}
          <button type="button" onClick={() => setEditing({ ...t })} aria-label={`Edit ${t.title}`}
            style={{ border: 0, background: "none", cursor: "pointer", color: css.text3, fontSize: 15, padding: "4px 6px", borderRadius: 8 }}>✎</button>
        </div>
      </div>
    );
  }

  const GroupTitle = ({ children, count, right }) => (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
      <h3 style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: css.text3, margin: 0 }}>
        {children}{count != null && <span style={{ marginLeft: 6, opacity: .8 }}>{count}</span>}
      </h3>
      {right}
    </div>
  );

  const chipBase = {
    border: `1px solid ${css.border}`, background: css.surface, color: css.text3,
    font: "inherit", fontSize: 13, fontWeight: 600, padding: "5px 12px", borderRadius: 999,
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
  };

  return (
    <div style={wrap}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 22 : 26, color: css.text, margin: 0, letterSpacing: "-.02em" }}>Tasks</h1>
          <p style={{ color: css.text3, fontSize: 13, margin: "2px 0 0" }}>Who's responsible for what.</p>
        </div>
      </div>

      {/* Add bar */}
      <div style={{ ...card, display: "flex", gap: 8, alignItems: "center", padding: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={addTitle} onChange={(e) => setAddTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
          placeholder="Add a task — e.g. Alyssa's lunch signup" maxLength={100}
          style={{ flex: 1, minWidth: 180, border: 0, background: "transparent", color: css.text, font: "inherit", fontSize: 15, padding: 8, outline: "none" }} />
        <div style={{ display: "inline-flex", padding: 3, background: css.surface2, borderRadius: 9 }}>
          {[["One-time", false], ["Recurring", true]].map(([label, val]) => (
            <button key={label} type="button" onClick={() => setAddRecurring(val)} style={{
              border: 0, background: addRecurring === val ? css.surface : "transparent",
              color: addRecurring === val ? css.text : css.text3, font: "inherit", fontSize: 12.5, fontWeight: 600,
              padding: "6px 12px", borderRadius: 7, cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: addRecurring === val ? css.shadow : "none",
            }}>{label}</button>
          ))}
        </div>
        <button type="button" onClick={addTask} style={{
          border: `1px solid ${css.accent}`, background: css.accent, color: "#fff", font: "inherit",
          fontSize: 14, fontWeight: 600, padding: "9px 16px", borderRadius: 10, cursor: "pointer",
        }}>Add</button>
      </div>

      {/* Filters + manage people */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {people.length > 0 && (
          <button type="button" onClick={() => setFilter(null)}
            style={{ ...chipBase, ...(filter === null ? { borderColor: css.accent, color: css.text, background: css.accentBg } : {}) }}>Everyone</button>
        )}
        {people.map((p) => (
          <button key={p.id} type="button" onClick={() => setFilter(filter === p.id ? null : p.id)}
            style={{ ...chipBase, ...(filter === p.id ? { borderColor: css.accent, color: css.text, background: css.accentBg } : {}) }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />{p.name}
          </button>
        ))}
        <button type="button" onClick={() => setShowPeople(true)}
          style={{ ...chipBase, borderStyle: "dashed", color: css.accent }}>＋ People</button>
      </div>

      {/* To do */}
      <div style={{ marginBottom: 22 }}>
        <GroupTitle count={todo.length || null}>To do</GroupTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {todo.length === 0 && (
            <div style={{ ...card, padding: 16, textAlign: "center", color: css.text3, fontSize: 14, boxShadow: "none" }}>
              {filter ? "Nothing here for them." : tasks.length ? "All clear. Nice." : "No tasks yet — add one above."}
            </div>
          )}
          {todo.map(TaskRow)}
        </div>
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div>
          <GroupTitle count={done.length} right={
            <button type="button" onClick={clearDone} style={{ border: 0, background: "none", color: css.accent, font: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Clear done</button>
          }>Done</GroupTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{done.map(TaskRow)}</div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <Overlay onClose={() => setEditing(null)} css={css}>
          <h2 style={{ fontSize: 17, color: css.text, margin: "0 0 14px" }}>Edit task</h2>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: ".03em", marginBottom: 6 }}>Task</label>
          <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} maxLength={100}
            style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: `1px solid ${css.border}`, background: css.bg, color: css.text, font: "inherit", fontSize: 15, marginBottom: 14, outline: "none" }} />
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: css.text3, textTransform: "uppercase", letterSpacing: ".03em", marginBottom: 6 }}>Type</label>
          <div style={{ display: "inline-flex", padding: 3, background: css.surface2, borderRadius: 9, marginBottom: 18 }}>
            {[["One-time", false], ["Recurring", true]].map(([label, val]) => (
              <button key={label} type="button" onClick={() => setEditing({ ...editing, recurring: val })} style={{
                border: 0, background: editing.recurring === val ? css.surface : "transparent",
                color: editing.recurring === val ? css.text : css.text3, font: "inherit", fontSize: 13, fontWeight: 600,
                padding: "7px 14px", borderRadius: 7, cursor: "pointer", boxShadow: editing.recurring === val ? css.shadow : "none",
              }}>{label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" onClick={() => deleteTask(editing.id)} style={{ border: 0, background: "none", color: css.warning, font: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete</button>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={() => setEditing(null)} style={{ border: 0, background: "none", color: css.text3, font: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "9px 14px" }}>Cancel</button>
            <button type="button" onClick={saveEdit} style={{ border: `1px solid ${css.accent}`, background: css.accent, color: "#fff", font: "inherit", fontSize: 14, fontWeight: 600, padding: "9px 16px", borderRadius: 10, cursor: "pointer" }}>Save</button>
          </div>
        </Overlay>
      )}

      {/* People modal */}
      {showPeople && (
        <Overlay onClose={() => setShowPeople(false)} css={css}>
          <h2 style={{ fontSize: 17, color: css.text, margin: "0 0 14px" }}>People</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={newPerson} onChange={(e) => setNewPerson(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { addPerson(newPerson); setNewPerson(""); } }}
              placeholder="Add a person (e.g. Nick)" maxLength={24}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1px solid ${css.border}`, background: css.bg, color: css.text, font: "inherit", fontSize: 14, outline: "none" }} />
            <button type="button" onClick={() => { addPerson(newPerson); setNewPerson(""); }}
              style={{ border: `1px solid ${css.accent}`, background: css.accent, color: "#fff", font: "inherit", fontSize: 14, fontWeight: 600, padding: "9px 16px", borderRadius: 10, cursor: "pointer" }}>Add</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {people.length === 0 && <p style={{ color: css.text3, fontSize: 13, margin: 0 }}>No one yet.</p>}
            {people.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: `1px solid ${css.border}`, borderRadius: 10 }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: p.color, color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, flex: "none" }}>{initials(p.name)}</span>
                <input defaultValue={p.name} onBlur={(e) => renamePerson(p.id, e.target.value)} maxLength={24}
                  style={{ border: 0, background: "none", color: css.text, font: "inherit", fontSize: 14, fontWeight: 600, width: 90, minWidth: 0, outline: "none" }} />
                <div style={{ display: "flex", gap: 3, marginLeft: "auto" }}>
                  {PALETTE.map((c) => (
                    <button key={c} type="button" onClick={() => recolorPerson(p.id, c)} aria-label="colour"
                      style={{ width: 16, height: 16, borderRadius: "50%", background: c, border: c === p.color ? `2px solid ${css.text}` : "2px solid transparent", cursor: "pointer", padding: 0 }} />
                  ))}
                </div>
                <button type="button" onClick={() => deletePerson(p.id)} aria-label={`Remove ${p.name}`}
                  style={{ border: 0, background: "none", cursor: "pointer", color: css.text3, fontSize: 14, padding: "2px 4px" }}>🗑</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button type="button" onClick={() => setShowPeople(false)} style={{ border: `1px solid ${css.border}`, background: css.surface, color: css.text, font: "inherit", fontSize: 14, fontWeight: 600, padding: "9px 16px", borderRadius: 10, cursor: "pointer" }}>Done</button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ children, onClose, css }) {
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(12,13,22,0.45)",
        display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, background: css.surface, border: `1px solid ${css.border}`,
        borderRadius: 18, boxShadow: css.shadowHover, padding: 20, maxHeight: "88vh", overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}
