import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { ClipboardList, Search } from "lucide-react";
import { Card, PageHead } from "../../../components/common/PagePrimitives";
import { grievancesService } from "../../../services/api/grievancesService";
import { permissionService } from "../../../services/auth/permissionService";
import GrievanceDetailModal from "./GrievanceDetailModal";
import NewGrievanceModal from "./NewGrievanceModal";

// ── helpers ──────────────────────────────────────────────
const STATUS_LABELS = {
  pending: "Pending",
  "in-progress": "In Progress",
  "under-review": "Under Review",
  resolved: "Resolved",
  closed: "Closed",
};

function statusColor(s) {
  if (s === "resolved" || s === "closed") return "green";
  if (s === "in-progress" || s === "under-review") return "amber";
  return "";
}

function getDateBucket(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays <= 7) return "This week";
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const m = d.getMonth(), y = d.getFullYear();
  const nm = now.getMonth(), ny = now.getFullYear();
  const monthDiff = (ny - y) * 12 + (nm - m);
  if (monthDiff === 0) return `This month (${months[m]})`;
  if (monthDiff === 1) return months[m];
  if (monthDiff === 2) return months[m];
  return `Older`;
}

// Concentric donut SVG
function DonutStats({ total, resolved }) {
  const r1 = 54, r2 = 40;
  const c = 64;
  const pct = total ? resolved / total : 0;
  const circ1 = 2 * Math.PI * r1;
  const circ2 = 2 * Math.PI * r2;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 0 10px" }}>
      <svg width={128} height={128} viewBox="0 0 128 128">
        {/* outer ring — total */}
        <circle cx={c} cy={c} r={r1} fill="none" stroke="#e7eaf0" strokeWidth={10} />
        <circle cx={c} cy={c} r={r1} fill="none" stroke="var(--brand)" strokeWidth={10}
          strokeDasharray={circ1} strokeDashoffset={circ1 * (1 - 1)}
          strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`} />
        {/* inner ring — resolved */}
        <circle cx={c} cy={c} r={r2} fill="none" stroke="#e7eaf0" strokeWidth={9} />
        <circle cx={c} cy={c} r={r2} fill="none" stroke="var(--green)" strokeWidth={9}
          strokeDasharray={circ2} strokeDashoffset={circ2 * (1 - pct)}
          strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: "stroke-dashoffset .6s ease" }} />
        <text x={c} y={c - 6} textAnchor="middle" fontSize={18} fontWeight={800} fill="var(--ink)">{total}</text>
        <text x={c} y={c + 12} textAnchor="middle" fontSize={9} fill="var(--muted)">total</text>
      </svg>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--brand)", display: "inline-block" }} />
          <span style={{ fontSize: 11 }}><b>{total}</b> total</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
          <span style={{ fontSize: 11 }}><b>{resolved}</b> resolved</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--amberbg)", border: "1px solid var(--amber)", display: "inline-block" }} />
          <span style={{ fontSize: 11 }}><b>{total - resolved}</b> active</span>
        </div>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────
export default function GrievancesPage() {
  const { notify, user } = useOutletContext();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);

  // admin filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterUser, setFilterUser] = useState("all");

  const isAdmin = permissionService.hasRole(user?.role, ["admin", "maintainer"]);

  useEffect(() => { loadGrievances(); }, [isAdmin]);

  const loadGrievances = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = isAdmin
        ? await grievancesService.getAllGrievances()
        : await grievancesService.getMyGrievances();
      if (res.ok) setGrievances(res.data);
      else setError("Failed to load grievances");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (id, newStatus) => {
    setGrievances((prev) => prev.map((g) => g.id === id ? { ...g, status: newStatus } : g));
  };

  const handleSubmitted = (newG) => {
    setGrievances((prev) => [newG, ...prev]);
  };


  // derive unique users for filter
  const uniqueUsers = [...new Set(grievances.map((g) => g.submittedBy).filter(Boolean))];

  // filter logic
  const filtered = grievances.filter((g) => {
    if (filterStatus !== "all" && g.status !== filterStatus) return false;
    if (filterDate !== "all" && getDateBucket(g.createdAt) !== filterDate) return false;
    if (filterUser !== "all" && g.submittedBy !== filterUser) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!g.title.toLowerCase().includes(q) && !g.id.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const total = grievances.length;
  const resolved = grievances.filter((g) => g.status === "resolved").length;
  const activeCount = grievances.filter((g) => g.status !== "resolved").length;

  // unique date buckets for filter dropdown
  const dateBuckets = [...new Set(grievances.map((g) => getDateBucket(g.createdAt)))];

  return (
    <>
      <PageHead
        eyebrow="STUDENT SUPPORT"
        title="Grievances"
        desc="Raise an issue and track what happens next."
        action={
          <button className="primary" onClick={() => setShowNew(true)}>
            + New grievance
          </button>
        }
      />

      <div style={{ maxWidth: 860 }}>
        <Card>
          <div className="card-head">
            <div>
              <h3>{isAdmin ? "All grievances" : "My grievances"}</h3>
              <p>{isAdmin ? "All submitted grievances" : "Private to your account"}</p>
            </div>
            <span className="pill">{activeCount} active</span>
          </div>

          {/* Donut stats */}
          <DonutStats total={total} resolved={resolved} />

          {/* Admin filters */}
          {isAdmin && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
              <div className="searchbox" style={{ flex: 1, minWidth: 160 }}>
                <Search size={13} />
                <input
                  placeholder="Search by title or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 11, background: "#fff" }}
              >
                <option value="all">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 11, background: "#fff" }}
              >
                <option value="all">Any time</option>
                {dateBuckets.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              {uniqueUsers.length > 0 && (
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 11, background: "#fff" }}
                >
                  <option value="all">All students</option>
                  {uniqueUsers.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              )}
            </div>
          )}

          {loading && <p style={{ textAlign: "center", padding: 20 }}>Loading...</p>}
          {error && <p style={{ textAlign: "center", padding: 20, color: "var(--red)" }}>{error}</p>}
          {!loading && filtered.length === 0 && (
            <p style={{ textAlign: "center", padding: 20, color: "var(--muted)" }}>No grievances found</p>
          )}

          {!loading && filtered.map((g) => (
            <div
              className="grievance-row"
              key={g.id}
              style={{ cursor: "pointer" }}
              onClick={() => setSelected(g)}
            >
              <div className="g-icon"><ClipboardList size={18} /></div>
              <div className="row-main">
                <b>{g.id} · {g.title}</b>
                <span>
                  {isAdmin && g.submittedBy ? `${g.submittedBy} · ` : ""}
                  Updated {g.updatedAt}
                </span>
              </div>
              <span className={"status " + statusColor(g.status)}>
                {STATUS_LABELS[g.status] || g.status}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {/* {-- How it works card commented out --}
      <Card>
        <h3>How it works</h3>
        <div className="timeline"> ... </div>
        <button className="outline full" onClick={() => notify("Demo: grievance tracking opened")}>
          Track a grievance
        </button>
      </Card> */}

      {selected && (
        <GrievanceDetailModal
          grievance={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
          notify={notify}
          isAdmin={isAdmin}
        />
      )}

      {showNew && (
        <NewGrievanceModal
          onClose={() => setShowNew(false)}
          onSubmitted={handleSubmitted}
          notify={notify}
        />
      )}
    </>
  );
}