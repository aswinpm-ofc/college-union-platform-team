import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = url && key ? createClient(url, key) : null;
const roles = ["student", "academic_maintainer", "academic_coordinator", "grievance_officer", "content_editor", "super_admin"];
const staffRoles = new Set(roles.slice(1));
const tabNames = { dashboard: "Overview", academics: "Academic moderation", grievances: "Grievances", publishing: "Publishing", operations: "Student support", departments: "Department requests", users: "Users and roles" };

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(async ({ data }) => { if (data.session) await loadProfile(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange(async (_, nextSession) => {
      if (nextSession) await loadProfile(nextSession);
      else { setSession(null); setProfile(null); }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function loadProfile(nextSession) {
    setSession(nextSession);
    const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", nextSession.user.id).single();
    if (profileError) { setError(profileError.message); return; }
    if (!staffRoles.has(data.role)) { await supabase.auth.signOut(); setError("Only staff accounts can access the management portal."); return; }
    setProfile(data);
  }

  async function login(event) {
    event.preventDefault(); setError("");
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message);
    else if (data.session) await loadProfile(data.session);
  }

  if (!supabase) return <main><section className="card"><h1>UnionHub Management</h1><h2>Supabase configuration missing</h2><p>Add <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to <code>admin-website/.env</code>, then restart Vite.</p></section></main>;
  if (loading) return <main><section className="card">Loading...</section></main>;
  if (!session || !profile) return <main><section className="card auth-card"><h1>UnionHub Management</h1><p>Staff access only. Students and visitors use the main website.</p><form onSubmit={login}><input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required /><input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button>Sign in</button></form>{error && <p className="error">{error}</p>}</section></main>;
  return <Console session={session} profile={profile} onSignOut={() => supabase.auth.signOut()} />;
}

function Console({ session, profile, onSignOut }) {
  const [tab, setTab] = useState("dashboard");
  const allowed = (items) => items.includes(profile.role);
  const tabs = ["dashboard", ...(allowed(["academic_maintainer", "academic_coordinator", "super_admin"]) ? ["academics"] : []), ...(allowed(["grievance_officer", "super_admin"]) ? ["grievances"] : []), ...(staffRoles.has(profile.role) ? ["publishing"] : []), ...(allowed(["content_editor", "super_admin"]) ? ["operations"] : []), ...(allowed(["academic_coordinator", "super_admin"]) ? ["departments"] : []), ...(profile.role === "super_admin" ? ["users"] : [])];
  return <main className="console-shell"><section className="console-card"><header className="console-header"><div><p className="kicker">UNIONHUB / STAFF CONSOLE</p><h1>Management workspace</h1><p>{profile.full_name || session.user.email} <span className="role-tag">{profile.role}</span></p></div><button className="secondary" onClick={onSignOut}>Sign out</button></header><nav className="tabs">{tabs.map((item) => <button className={tab === item ? "tab active" : "tab"} key={item} onClick={() => setTab(item)}>{tabNames[item]}</button>)}</nav><div className="workspace">{tab === "dashboard" && <Dashboard profile={profile} />}{tab === "academics" && <AcademicQueue userId={session.user.id} />}{tab === "grievances" && <GrievanceQueue userId={session.user.id} />}{tab === "publishing" && <Publishing userId={session.user.id} canEdit={allowed(["content_editor", "super_admin"])} />}{tab === "operations" && <Operations canFulfill={profile.role === "super_admin"} />}{tab === "departments" && <DepartmentRequests userId={session.user.id} />}{tab === "users" && <Users />}</div></section></main>;
}

function useRecords(table, order = "created_at") {
  const [records, setRecords] = useState([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const refresh = async () => { setLoading(true); const { data, error: queryError } = await supabase.from(table).select("*").order(order, { ascending: false }); setRecords(data || []); setError(queryError?.message || ""); setLoading(false); };
  useEffect(() => { refresh(); }, [table]);
  return { records, setRecords, error, loading, refresh };
}

function Dashboard({ profile }) {
  const [stats, setStats] = useState({});
  useEffect(() => { Promise.all(["profiles", "academic_materials", "grievances", "events", "announcements"].map(async (table) => { const { count } = await supabase.from(table).select("id", { count: "exact", head: true }); return [table, count || 0]; })).then((values) => setStats(Object.fromEntries(values))); }, []);
  return <><div className="section-heading"><div><p className="kicker">CONTROL CENTER</p><h2>What needs attention</h2></div><span className="muted">Live counts from Supabase</span></div><div className="metric-grid">{[["profiles", "Accounts"], ["academic_materials", "Materials"], ["grievances", "Grievances"], ["events", "Events"], ["announcements", "Announcements"]].map(([key, title]) => <div className="metric" key={key}><strong>{stats[key] ?? "-"}</strong><span>{title}</span></div>)}</div><div className="notice"><strong>Role boundary</strong><p>{profile.role === "super_admin" ? "You can manage every staff workflow, including user roles." : `Your ${profile.role.replaceAll("_", " ")} permissions determine the modules shown here.`}</p></div></>;
}

function AcademicQueue({ userId }) {
  const { records, setRecords, error, loading, refresh } = useRecords("academic_materials"); const pending = records.filter((item) => item.status === "pending_review");
  function openMaterial(item) {
    const fileUrl = item.file_url || (item.storage_path ? `${url}/storage/v1/object/public/academic_materials/${item.storage_path}` : "");
    if (!fileUrl) { window.alert("This material has no stored file URL."); return; }
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }
  async function update(item, status) { const values = { status, approved_by: status === "approved" ? userId : null, approved_at: status === "approved" ? new Date().toISOString() : null, rejection_reason: status === "rejected" ? window.prompt("Reason for rejection") || "" : null }; const { error: updateError } = await supabase.from("academic_materials").update(values).eq("id", item.id); if (updateError) window.alert(updateError.message); else setRecords(records.map((record) => record.id === item.id ? { ...record, ...values } : record)); }
  async function remove(item) { if (!window.confirm(`Remove material "${item.title}"? This cannot be undone.`)) return; const { error: deleteError } = await supabase.from("academic_materials").delete().eq("id", item.id); if (deleteError) { window.alert(`Could not remove material: ${deleteError.message}`); return; } if (item.storage_path) { const { error: storageError } = await supabase.storage.from("academic_materials").remove([item.storage_path]); if (storageError) window.alert(`Material record removed, but file cleanup failed: ${storageError.message}`); } setRecords(records.filter((record) => record.id !== item.id)); }
  const reviewRecords = records.filter((item) => item.status === "pending_review");
  const approvedRecords = records.filter((item) => item.status === "approved");
  return <Module title="Academic moderation" description="Open, inspect, approve, reject, or remove student-submitted academic material."><Toolbar count={`${pending.length} pending`} onRefresh={refresh} />{loading && <p>Loading queue...</p>}{error && <p className="error">{error}</p>}{reviewRecords.map((item) => <article className="record" key={item.id}><div><h3>{item.title}</h3><p>{item.description || "No description"}</p><small>{item.material_type} · {item.original_filename}</small></div><div className="actions"><button className="secondary" onClick={() => openMaterial(item)}>Open material</button><button onClick={() => update(item, "approved")}>Approve</button><button className="danger" onClick={() => update(item, "rejected")}>Reject</button></div></article>)}{!loading && !reviewRecords.length && <Empty text="No academic material is waiting for review." />}<h3 className="subheading">Approved materials</h3>{approvedRecords.map((item) => <article className="record" key={item.id}><div><h3>{item.title}</h3><p>{item.description || "No description"}</p><small>{item.material_type} · {item.original_filename}</small></div><div className="actions"><button className="secondary" onClick={() => openMaterial(item)}>Open material</button><button className="danger" onClick={() => remove(item)}>Remove material</button></div></article>)}</Module>;
}

function GrievanceQueue({ userId }) {
  const { records, setRecords, error, loading, refresh } = useRecords("grievances");
  const [filter, setFilter] = useState("all");
  async function update(item, status) { const { error: updateError } = await supabase.from("grievances").update({ status, assigned_to: item.assigned_to || userId, updated_at: new Date().toISOString() }).eq("id", item.id); if (updateError) window.alert(updateError.message); else setRecords(records.map((record) => record.id === item.id ? { ...record, status } : record)); }
  const filtered = records.filter((item) => filter === "all" || (filter === "open" ? !["resolved", "closed"].includes(item.status) : item.status === filter));
  return <Module title="Grievance queue" description="Review student grievances and move them through the resolution pipeline."><Toolbar count={`${records.filter((item) => !["resolved", "closed"].includes(item.status)).length} open`} onRefresh={refresh} /><div className="status-filters">{[["all", "All"], ["open", "Open"], ["in_review", "In review"], ["resolved", "Resolved"], ["closed", "Closed"]].map(([value, label]) => <button key={value} className={filter === value ? "filter-button active" : "filter-button"} onClick={() => setFilter(value)}>{label} <span>{value === "all" ? records.length : value === "open" ? records.filter((item) => !["resolved", "closed"].includes(item.status)).length : records.filter((item) => item.status === value).length}</span></button>)}</div>{loading && <p>Loading grievances...</p>}{error && <p className="error">{error}</p>}{filtered.map((item) => <article className="record" key={item.id}><div><h3>{item.title}</h3><p>{item.description}</p><small>{item.category} · {new Date(item.created_at).toLocaleDateString()}</small></div><div className="actions"><span className={`status ${item.status}`}>{item.status}</span>{!["in_review", "resolved", "closed"].includes(item.status) && <button onClick={() => update(item, "in_review")}>Review</button>}{!["resolved", "closed"].includes(item.status) && <button onClick={() => update(item, "resolved")}>Resolve</button>}{item.status === "resolved" && <button onClick={() => update(item, "closed")}>Close</button>}{item.status === "closed" && <button className="secondary" onClick={() => update(item, "submitted")}>Reopen</button>}</div></article>)}{!loading && !filtered.length && <Empty text={filter === "all" ? "No grievances have been submitted." : `No ${filter.replace("_", " ")} grievances.`} />}</Module>;
}

function Publishing({ userId, canEdit }) {
  const events = useRecords("events", "start_at"); const announcements = useRecords("announcements", "publish_at"); const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [kind, setKind] = useState("announcement"); const [startAt, setStartAt] = useState(""); const [poster, setPoster] = useState(null); const [editing, setEditing] = useState(null);
  async function uploadPoster(file) { if (!file) return ""; const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`; const { error } = await supabase.storage.from("event-posters").upload(path, file, { upsert: true, contentType: file.type }); if (error) throw error; return supabase.storage.from("event-posters").getPublicUrl(path).data.publicUrl; }
  async function uploadAttachment(file) { if (!file) return null; const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`; const { error } = await supabase.storage.from("announcement-attachments").upload(path, file, { upsert: true, contentType: file.type }); if (error) throw error; return { url: supabase.storage.from("announcement-attachments").getPublicUrl(path).data.publicUrl, type: file.type, name: file.name }; }
  async function create(event) { event.preventDefault(); try { const posterUrl = await uploadPoster(poster); const attachment = kind === "announcement" ? await uploadAttachment(poster) : null; const table = kind === "event" ? "events" : "announcements"; const values = kind === "event" ? { title, description: body, start_at: startAt ? new Date(startAt).toISOString() : new Date().toISOString(), status: "published", created_by: userId, ...(posterUrl ? { poster_url: posterUrl } : {}) } : { title, body, category: "general", status: "published", publish_at: new Date().toISOString(), created_by: userId, ...(attachment ? { attachment_url: attachment.url, attachment_type: attachment.type, attachment_name: attachment.name } : {}) }; const { error } = editing ? await supabase.from(table).update(values).eq("id", editing.id) : await supabase.from(table).insert(values); if (error) throw error; resetForm(); kind === "event" ? events.refresh() : announcements.refresh(); } catch (error) { window.alert(error.message); } }
  function edit(table, item) { setEditing({ ...item, table }); setKind(table === "events" ? "event" : "announcement"); setTitle(item.title || ""); setBody(item.description || item.body || ""); setStartAt(item.start_at ? item.start_at.slice(0, 16) : ""); setPoster(null); }
  function resetForm() { setEditing(null); setTitle(""); setBody(""); setStartAt(""); setPoster(null); }
  async function remove(table, id) { const { error } = await supabase.from(table).delete().eq("id", id); if (error) window.alert(error.message); else (table === "events" ? events.refresh() : announcements.refresh()); }
  return <Module title="Publishing" description="View active campus events and announcements. Publishing staff can edit or remove them."><>{events.error && <p className="error">Events: {events.error}</p>}{announcements.error && <p className="error">Announcements: {announcements.error}</p>}{canEdit && <form className="composer" onSubmit={create}><select value={kind} onChange={(event) => setKind(event.target.value)}><option value="announcement">Announcement</option><option value="event">Event</option></select><input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} required /><textarea placeholder="Description or announcement body" value={body} onChange={(event) => setBody(event.target.value)} />{kind === "event" && <><input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} required />{editing?.poster_url && <img className="poster-preview" src={editing.poster_url} alt="Current event cover" />}<input type="file" accept="image/*" onChange={(event) => setPoster(event.target.files?.[0] || null)} /></>}{kind === "announcement" && <input type="file" accept="image/*,.pdf,application/pdf" onChange={(event) => setPoster(event.target.files?.[0] || null)} />}<button>{editing ? `Save ${kind} changes` : `Publish ${kind}`}</button>{editing && <button type="button" className="secondary" onClick={resetForm}>Cancel edit</button>}</form>}{!canEdit && <p className="notice">You have view access. Content editors and super admins can edit or publish.</p>}<div className="split"><div><h3>Announcements</h3>{announcements.records.map((item) => <RecordLine key={item.id} item={item} editLabel="Edit announcement" onEdit={canEdit ? () => edit("announcements", item) : null} onDelete={canEdit ? () => remove("announcements", item.id) : null} />)}</div><div><h3>Events</h3>{events.records.map((item) => <RecordLine key={item.id} item={item} editLabel="Edit event" onEdit={canEdit ? () => edit("events", item) : null} onDelete={canEdit ? () => remove("events", item.id) : null} />)}</div></div></></Module>;
}

function Operations({ canFulfill }) {
  const blood = useRecords("blood_requests"); const welfare = useRecords("welfare_items", "deadline"); const contacts = useRecords("emergency_contacts", "name");
  async function update(table, id, values, refresh) { const { error } = await supabase.from(table).update(values).eq("id", id); if (error) window.alert(error.message); else refresh(); }
  return <Module title="Student support operations" description="Maintain blood requests, welfare opportunities, and emergency contact information used by students."><div className="split"><div><h3>Blood requests</h3>{blood.error && <p className="error">{blood.error}</p>}{blood.records.map((item) => <article className="record compact" key={item.id}><div><h3>{item.blood_group} · {item.location || "No location"}</h3><small>{item.urgency} · {item.units || 1} unit(s) · {item.status}</small></div>{item.status !== "fulfilled" && canFulfill && <button onClick={() => update("blood_requests", item.id, { status: "fulfilled" }, blood.refresh)}>Mark fulfilled</button>}{item.status !== "fulfilled" && !canFulfill && <span className="muted">Super admin action</span>}{item.status === "fulfilled" && <span className="status resolved">Fulfilled</span>}</article>)}{!blood.loading && !blood.records.length && <Empty text="No blood requests have been submitted." />}</div><div><h3>Welfare opportunities</h3>{welfare.records.map((item) => <RecordLine key={item.id} item={item} onDelete={() => update("welfare_items", item.id, { status: item.status === "published" ? "draft" : "published" }, welfare.refresh)} />)}</div></div><h3 className="subheading">Emergency contacts</h3>{contacts.records.map((item) => <article className="record compact" key={item.id}><div><h3>{item.name}</h3><small>{item.category} · {item.phone}</small></div><button className="secondary" onClick={() => update("emergency_contacts", item.id, { active: !item.active }, contacts.refresh)}>{item.active ? "Deactivate" : "Activate"}</button></article>)}</Module>;
}

function DepartmentRequests({ userId }) {
  const { records, setRecords, loading, error, refresh } = useRecords("department_requests");
  async function decide(item, status) {
    if (status === "approved") {
      const { error: departmentError } = await supabase.from("departments").insert({ name: item.name, code: item.code, active: true });
      if (departmentError && !departmentError.message.toLowerCase().includes("duplicate")) { window.alert(departmentError.message); return; }
    }
    const { error: updateError } = await supabase.from("department_requests").update({ status, reviewed_by: userId, reviewed_at: new Date().toISOString() }).eq("id", item.id);
    if (updateError) window.alert(updateError.message);
    else setRecords(records.map((record) => record.id === item.id ? { ...record, status } : record));
  }
  return <Module title="Department requests" description="Accept or reject new department requests submitted by students."><Toolbar count={`${records.filter((item) => item.status === "pending").length} pending`} onRefresh={refresh} />{loading && <p>Loading requests...</p>}{error && <p className="error">{error}</p>}{records.map((item) => <article className="record" key={item.id}><div><h3>{item.name} <span className="muted">{item.code}</span></h3><p>{item.reason || "No reason provided"}</p></div><div className="actions">{item.status === "pending" ? <><button onClick={() => decide(item, "approved")}>Accept</button><button className="danger" onClick={() => decide(item, "rejected")}>Reject</button></> : <span className={`status ${item.status}`}>{item.status}</span>}</div></article>)}</Module>;
}

function Users() {
  const { records, setRecords, loading, error, refresh } = useRecords("profiles", "created_at");
  async function changeRole(item, role) { const { error: updateError } = await supabase.rpc("set_profile_role", { target_user_id: item.id, target_role: role }); if (updateError) window.alert(updateError.message); else setRecords(records.map((record) => record.id === item.id ? { ...record, role } : record)); }
  return <Module title="Users and roles" description="Assign staff responsibilities. Students remain on the public website; staff use this console."><Toolbar count={`${records.length} accounts`} onRefresh={refresh} />{loading && <p>Loading users...</p>}{error && <p className="error">{error}</p>}{records.map((item) => <article className="record compact" key={item.id}><div><h3>{item.full_name || item.email}</h3><small>{item.email}</small></div><select value={item.role} onChange={(event) => changeRole(item, event.target.value)}>{roles.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}</select></article>)}</Module>;
}

function Module({ title, description, children }) { return <section className="module"><div className="section-heading"><div><p className="kicker">STAFF WORKFLOW</p><h2>{title}</h2><p>{description}</p></div></div>{children}</section>; }
function Toolbar({ count, onRefresh }) { return <div className="toolbar"><span className="muted">{count}</span><button className="secondary" onClick={onRefresh}>Refresh</button></div>; }
function RecordLine({ item, editLabel = "Edit", onEdit, onDelete }) { return <div className="record-line"><span><strong>{item.title}</strong><small>{item.status}</small></span><span className="actions">{onEdit && <button className="secondary" onClick={onEdit}>{editLabel}</button>}<button className="danger" onClick={onDelete}>Remove</button></span></div>; }
function Empty({ text }) { return <div className="empty">{text}</div>; }

createRoot(document.getElementById("root")).render(<App />);
