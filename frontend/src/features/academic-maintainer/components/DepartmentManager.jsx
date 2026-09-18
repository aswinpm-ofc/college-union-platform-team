/**
 * DepartmentManager
 * ─────────────────
 * Admin / Maintainer component for managing academic departments.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Building2,
  PlusCircle,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Loader,
  RefreshCw,
  Clock,
  X,
} from "lucide-react";
import { Card } from "../../../components/common/PagePrimitives";
import { academicsService } from "../../../services/api/academicsService";

// ── Small utility: status badge ───────────────────────────────────────────────
function DeptBadge({ active }) {
  return active ? (
    <span className="status green">Active</span>
  ) : (
    <span className="status" style={{ background: "#f3f4f6", color: "#6b7280" }}>
      Inactive
    </span>
  );
}

// ── Request status badge ──────────────────────────────────────────────────────
function ReqBadge({ status }) {
  const map = {
    pending:  { label: "Pending",  cls: "status amber" },
    approved: { label: "Approved", cls: "status green"  },
    rejected: { label: "Rejected", cls: "status red"    },
  };
  const cfg = map[status] || { label: status, cls: "status" };
  return <span className={cfg.cls}>{cfg.label}</span>;
}

// ── Shared modal shell ────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "420px",
        boxShadow: "0 24px 60px rgba(0,0,0,.18)", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px 12px", borderBottom: "1px solid var(--line)",
        }}>
          <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>{title}</h3>
          <button className="textbtn" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: "18px 20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Field component ───────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <label style={{ display: "block", marginBottom: "13px" }}>
      <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--ink)", marginBottom: "5px" }}>
        {label}{required && " *"}
      </span>
      {children}
    </label>
  );
}

const INPUT_STYLE = {
  display: "block", width: "100%", padding: "9px 11px",
  border: "1px solid var(--line)", borderRadius: "8px",
  fontSize: "12px", background: "#fff", boxSizing: "border-box",
};

// ── Add Department modal ──────────────────────────────────────────────────────
function AddDepartmentModal({ onClose, onCreated, notify }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState(null);
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) { setErr("Department name is required."); return; }
    if (!code.trim()) { setErr("Department code is required."); return; }

    setBusy(true);
    try {
      const cleanName = name.trim();
      const cleanCode = code.trim().toUpperCase();

      const res = await academicsService.adminCreateDepartment({
        name: cleanName,
        code: cleanCode,
      });

      if (res.ok) {
        if (typeof notify === "function") {
          notify(`Department "${cleanName}" created successfully ✓`);
        }
        // Fallback object guarantees we never pass undefined into React state
        const fallbackDept = {
          id: `dept-${cleanCode.toLowerCase()}`,
          name: cleanName,
          code: cleanCode,
          active: true,
          created_at: new Date().toISOString(),
        };
        onCreated(res.data || fallbackDept);
        onClose();
      } else {
        setErr(res.error || "Failed to create department.");
      }
    } catch (ex) {
      setErr(ex.message || "Unexpected error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Add Department" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Department Name" required>
          <input ref={nameRef} type="text" placeholder="e.g. Information Technology"
            value={name} onChange={(e) => setName(e.target.value)}
            disabled={busy} style={INPUT_STYLE} />
        </Field>
        <Field label="Department Code" required>
          <input type="text" placeholder="e.g. IT, BCA, CSE"
            value={code} maxLength={8}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={busy}
            style={{ ...INPUT_STYLE, textTransform: "uppercase", letterSpacing: ".05em" }} />
        </Field>
        {err && (
          <div style={{
            display: "flex", gap: "7px", alignItems: "flex-start",
            padding: "9px 11px", borderRadius: "8px",
            background: "var(--redbg)", border: "1px solid #fca5a5",
            color: "var(--red)", fontSize: "11px", marginBottom: "14px",
          }}>
            <AlertCircle size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span>{err}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button type="button" className="outline small" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="primary small" disabled={busy} style={{ minWidth: "110px" }}>
            {busy ? <><Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> Creating…</> : "Create Department"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Edit Name modal ───────────────────────────────────────────────────────────
function EditDeptModal({ dept, onClose, onSaved, notify }) {
  const [name, setName] = useState(dept.name);
  const [code, setCode] = useState(dept.code);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState(null);
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) { setErr("Name is required."); return; }

    setBusy(true);
    try {
      const res = await academicsService.adminRenameDepartment(dept.id, {
        name: name.trim(),
        code: code.trim().toUpperCase() || dept.code,
      });
      if (res.ok) {
        if (typeof notify === "function") notify("Department renamed ✓");
        onSaved({ ...dept, name: name.trim(), code: code.trim().toUpperCase() || dept.code });
        onClose();
      } else {
        setErr(res.error || "Failed to rename.");
      }
    } catch (ex) {
      setErr(ex.message || "Unexpected error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={`Edit – ${dept.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Department Name" required>
          <input ref={nameRef} type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy} style={INPUT_STYLE} />
        </Field>
        <Field label="Department Code">
          <input type="text" value={code} maxLength={8}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={busy}
            style={{ ...INPUT_STYLE, textTransform: "uppercase" }} />
        </Field>
        {err && (
          <div style={{
            display: "flex", gap: "7px", alignItems: "flex-start",
            padding: "9px 11px", borderRadius: "8px",
            background: "var(--redbg)", border: "1px solid #fca5a5",
            color: "var(--red)", fontSize: "11px", marginBottom: "14px",
          }}>
            <AlertCircle size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span>{err}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button type="button" className="outline small" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="primary small" disabled={busy} style={{ minWidth: "90px" }}>
            {busy ? <><Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Approve request modal ────────────────────────────────────────────────────
function ApproveRequestModal({ request, onClose, onApproved, notify }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const handleApprove = async () => {
    setBusy(true);
    try {
      const res = await academicsService.adminApproveDepartmentRequest(request.id, note.trim());
      if (res.ok) {
        if (typeof notify === "function") notify(`"${request.name}" approved and created ✓`);
        onApproved(request.id);
        onClose();
      }
    } catch { /* noop */ } finally { setBusy(false); }
  };

  return (
    <ModalShell title={`Approve Request – ${request.name}`} onClose={onClose}>
      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: 0 }}>
        Approving this request will <strong>create</strong> the department <em>{request.name} ({request.code})</em> and make it available immediately.
      </p>
      {request.reason && (
        <div style={{
          background: "#f9fafb", border: "1px solid var(--line)", borderRadius: "8px",
          padding: "10px 12px", fontSize: "11px", marginBottom: "13px",
        }}>
          <strong style={{ fontSize: "10px", display: "block", marginBottom: "3px", color: "var(--muted)" }}>STUDENT'S REASON</strong>
          {request.reason}
        </div>
      )}
      <Field label="Admin Note (optional)">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
          disabled={busy} placeholder="Visible to the student…"
          style={{ ...INPUT_STYLE, resize: "vertical", fontFamily: "inherit" }} />
      </Field>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button className="outline small" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="approve small" onClick={handleApprove} disabled={busy} style={{ minWidth: "100px" }}>
          {busy ? <><Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> Approving…</> : "Approve"}
        </button>
      </div>
    </ModalShell>
  );
}

// ── Reject request modal ──────────────────────────────────────────────────────
function RejectRequestModal({ request, onClose, onRejected, notify }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const handleReject = async () => {
    setBusy(true);
    try {
      const res = await academicsService.adminRejectDepartmentRequest(request.id, note.trim());
      if (res.ok) {
        if (typeof notify === "function") notify("Request rejected.");
        onRejected(request.id);
        onClose();
      }
    } catch { /* noop */ } finally { setBusy(false); }
  };

  return (
    <ModalShell title={`Reject Request – ${request.name}`} onClose={onClose}>
      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: 0 }}>
        Rejecting will notify the student. Provide a reason below.
      </p>
      <Field label="Reason for rejection (optional)">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
          disabled={busy} placeholder="Why is this department not being added?"
          style={{ ...INPUT_STYLE, resize: "vertical", fontFamily: "inherit" }} />
      </Field>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button className="outline small" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="reject small" onClick={handleReject} disabled={busy} style={{ minWidth: "90px" }}>
          {busy ? <><Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> Rejecting…</> : "Reject"}
        </button>
      </div>
    </ModalShell>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DepartmentManager({ notify }) {
  const [depts,    setDepts]    = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [reqBusy,  setReqBusy]  = useState({});

  // Modal state
  const [addOpen,    setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [approveReq, setApproveReq] = useState(null);
  const [rejectReq,  setRejectReq]  = useState(null);

  // Load all data cleanly
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, rRes] = await Promise.all([
        academicsService.adminGetAllDepartments(),
        academicsService.adminGetDepartmentRequests(),
      ]);
      if (dRes?.ok) setDepts((dRes.data || []).filter(Boolean));
      if (rRes?.ok) setRequests((rRes.data || []).filter(Boolean));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleToggleActive = async (dept) => {
    setReqBusy((p) => ({ ...p, [dept.id]: "toggle" }));
    try {
      const res = await academicsService.adminSetDepartmentStatus(dept.id, !dept.active);
      if (res.ok) {
        setDepts((prev) =>
          prev.map((d) => d.id === dept.id ? { ...d, active: !d.active } : d)
        );
        if (typeof notify === "function") {
          notify(dept.active ? "Department deactivated." : "Department activated ✓");
        }
      } else {
        if (typeof notify === "function") notify(res.error || "Action failed.");
      }
    } catch { 
      if (typeof notify === "function") notify("Action failed."); 
    }
    finally { setReqBusy((p) => ({ ...p, [dept.id]: null })); }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Permanently delete "${dept.name}"? This cannot be undone.`)) return;
    setReqBusy((p) => ({ ...p, [dept.id]: "delete" }));
    try {
      const res = await academicsService.adminDeleteDepartment(dept.id);
      if (res.ok) {
        setDepts((prev) => prev.filter((d) => d && d.id !== dept.id));
        if (typeof notify === "function") notify(`"${dept.name}" deleted.`);
      } else {
        if (typeof notify === "function") notify(res.error || "Delete failed.");
      }
    } catch { 
      if (typeof notify === "function") notify("Delete failed."); 
    }
    finally { setReqBusy((p) => ({ ...p, [dept.id]: null })); }
  };

  const handleSaved = (updated) => {
    if (!updated) return;
    setDepts((prev) => prev.map((d) => (d && d.id === updated.id ? updated : d)));
  };

  const handleCreated = (newDept) => {
    if (newDept && newDept.id) {
      setDepts((prev) => [...prev.filter(Boolean), newDept]);
    }
    loadAll();
  };

  const handleApproved = (reqId) => {
    setRequests((prev) => prev.map((r) => r && r.id === reqId ? { ...r, status: "approved" } : r));
    loadAll();
  };

  const handleRejected = (reqId) => {
    setRequests((prev) => prev.map((r) => r && r.id === reqId ? { ...r, status: "rejected" } : r));
  };

  // Safe Derived Counts (Protected from undefined elements)
  const validDepts    = (depts || []).filter(Boolean);
  const validRequests = (requests || []).filter(Boolean);
  const totalActive   = validDepts.filter((d) => d?.active).length;
  const totalInactive = validDepts.filter((d) => !d?.active).length;
  const pendingReqs   = validRequests.filter((r) => r?.status === "pending").length;

  const TH = { fontSize: "9px", fontWeight: 800, color: "var(--muted)", letterSpacing: ".08em", textTransform: "uppercase", textAlign: "left", padding: "8px 10px", background: "#f9fafb", borderBottom: "1px solid var(--line)" };
  const TD = { fontSize: "11px", padding: "11px 10px", borderBottom: "1px solid var(--line)", verticalAlign: "middle" };

  return (
    <>
      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "18px" }}>
        {[
          { label: "Total Departments", value: validDepts.length, icon: <Building2 size={16} /> },
          { label: "Active",            value: totalActive,       icon: <CheckCircle2 size={16} color="var(--green)" /> },
          { label: "Inactive",          value: totalInactive,     icon: <XCircle size={16} color="var(--muted)" /> },
          { label: "Pending Requests",  value: pendingReqs,       icon: <Clock size={16} color="var(--amber)" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="stat" style={{ padding: "14px 16px" }}>
            <div className="stat-icon">{icon}</div>
            <div>
              <small>{label}</small>
              <strong>{loading ? "—" : value}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* ── Departments table ───────────────────────────────────────────────── */}
      <Card>
        <div className="card-head" style={{ marginBottom: "14px" }}>
          <div>
            <h3>All Departments</h3>
            <p>Manage, rename, activate, or delete academic departments.</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="outline small" onClick={loadAll} disabled={loading} title="Refresh">
              <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
              Refresh
            </button>
            <button className="primary small" onClick={() => setAddOpen(true)}>
              <PlusCircle size={13} /> Add Department
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
            <Loader size={20} style={{ animation: "spin 1s linear infinite", marginBottom: "8px" }} /><br />Loading departments…
          </div>
        )}

        {!loading && validDepts.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <Building2 size={34} style={{ marginBottom: "10px", opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: "12px" }}>No departments yet. Click <strong>Add Department</strong> to create one.</p>
          </div>
        )}

        {!loading && validDepts.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr>
                  <th style={TH}>Department</th>
                  <th style={TH}>Code</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Created</th>
                  <th style={{ ...TH, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {validDepts.map((dept) => {
                  if (!dept) return null;
                  const busy = reqBusy[dept.id];
                  return (
                    <tr key={dept.id || Math.random()} style={{ background: "#fff" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#fafbff"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                    >
                      <td style={TD}>
                        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--soft)", color: "var(--brand)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <Building2 size={14} />
                          </div>
                          <b style={{ fontSize: "11px" }}>{dept.name}</b>
                        </div>
                      </td>
                      <td style={TD}>
                        <span style={{ fontFamily: "monospace", fontSize: "10px", fontWeight: 800, background: "#f3f4f6", padding: "3px 7px", borderRadius: "6px" }}>
                          {dept.code}
                        </span>
                      </td>
                      <td style={TD}><DeptBadge active={dept.active} /></td>
                      <td style={{ ...TD, color: "var(--muted)", fontSize: "10px" }}>
                        {dept.created_at ? new Date(dept.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ ...TD, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            className="outline small"
                            title="Edit name"
                            style={{ padding: "5px 8px" }}
                            onClick={() => setEditTarget(dept)}
                            disabled={!!busy}
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            className="outline small"
                            title={dept.active ? "Deactivate" : "Activate"}
                            style={{ padding: "5px 8px", color: dept.active ? "var(--amber)" : "var(--green)" }}
                            onClick={() => handleToggleActive(dept)}
                            disabled={!!busy}
                          >
                            {busy === "toggle"
                              ? <Loader size={11} style={{ animation: "spin 1s linear infinite" }} />
                              : dept.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />
                            }
                          </button>
                          <button
                            className="reject small"
                            title="Delete permanently"
                            style={{ padding: "5px 8px" }}
                            onClick={() => handleDelete(dept)}
                            disabled={!!busy}
                          >
                            {busy === "delete"
                              ? <Loader size={11} style={{ animation: "spin 1s linear infinite" }} />
                              : <Trash2 size={11} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Pending student requests ────────────────────────────────────────── */}
      {validRequests.length > 0 && (
        <Card style={{ marginTop: "13px" }}>
          <div className="card-head" style={{ marginBottom: "14px" }}>
            <div>
              <h3>Student Requests</h3>
              <p>Departments submitted for review by students.</p>
            </div>
            {pendingReqs > 0 && (
              <span className="status amber" style={{ fontSize: "10px", padding: "5px 9px" }}>
                {pendingReqs} pending
              </span>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr>
                  <th style={TH}>Department</th>
                  <th style={TH}>Code</th>
                  <th style={TH}>Requested by</th>
                  <th style={TH}>Date</th>
                  <th style={TH}>Status</th>
                  <th style={{ ...TH, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {validRequests.map((req) => {
                  if (!req) return null;
                  return (
                    <tr key={req.id || Math.random()} style={{ background: "#fff" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#fafbff"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                    >
                      <td style={TD}>
                        <b style={{ fontSize: "11px" }}>{req.name}</b>
                        {req.reason && (
                          <span style={{ display: "block", fontSize: "9px", color: "var(--muted)", marginTop: "2px", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {req.reason}
                          </span>
                        )}
                      </td>
                      <td style={TD}>
                        <span style={{ fontFamily: "monospace", fontSize: "10px", fontWeight: 800, background: "#f3f4f6", padding: "3px 7px", borderRadius: "6px" }}>
                          {req.code}
                        </span>
                      </td>
                      <td style={{ ...TD, fontSize: "10px" }}>
                        {req.requester_name || req.requested_by || "—"}
                      </td>
                      <td style={{ ...TD, fontSize: "10px", color: "var(--muted)" }}>
                        {req.created_at ? new Date(req.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                      </td>
                      <td style={TD}><ReqBadge status={req.status} /></td>
                      <td style={{ ...TD, textAlign: "right" }}>
                        {req.status === "pending" ? (
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button className="approve small" onClick={() => setApproveReq(req)}>
                              <CheckCircle2 size={11} /> Approve
                            </button>
                            <button className="reject small" onClick={() => setRejectReq(req)}>
                              <XCircle size={11} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "10px", color: "var(--muted)" }}>
                            {req.admin_note || "Reviewed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {addOpen && (
        <AddDepartmentModal
          onClose={() => setAddOpen(false)}
          onCreated={handleCreated}
          notify={notify}
        />
      )}
      {editTarget && (
        <EditDeptModal
          dept={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
          notify={notify}
        />
      )}
      {approveReq && (
        <ApproveRequestModal
          request={approveReq}
          onClose={() => setApproveReq(null)}
          onApproved={handleApproved}
          notify={notify}
        />
      )}
      {rejectReq && (
        <RejectRequestModal
          request={rejectReq}
          onClose={() => setRejectReq(null)}
          onRejected={handleRejected}
          notify={notify}
        />
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
}