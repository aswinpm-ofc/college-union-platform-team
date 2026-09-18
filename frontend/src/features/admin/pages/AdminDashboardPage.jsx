import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  CalendarDays,
  ClipboardList,
  BookOpen,
  GraduationCap,
  Activity,
  AlertCircle,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Card, PageHead, RevealGroup } from "../../../components/common/PagePrimitives";
import { maintainerService } from "../../../services/api/maintainerService";
import { permissionService } from "../../../services/auth/permissionService";

export default function AdminDashboardPage() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState({
    activeStudents: 2482,
    upcomingEvents: 12,
    openGrievances: 18,
    academicMaterials: 620,
  });
  const [moderationStats, setModerationStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const canAccess = permissionService.hasPermission("CREATE_ANNOUNCEMENT", user?.role);

  useEffect(() => {
    if (canAccess) {
      loadStats();
    }
  }, [canAccess]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await maintainerService.getModerationStats();
      if (response.ok) {
        setModerationStats(response.data);
      }
    } catch (err) {
      console.error("Error loading stats");
    } finally {
      setLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <>
        <PageHead
          eyebrow="PLATFORM ADMINISTRATION"
          title="Admin Dashboard"
          desc="Platform management and moderation overview."
        />
        <Card style={{ textAlign: "center", padding: "60px 20px" }}>
          <Lock size={50} style={{ marginBottom: "15px", opacity: 0.5 }} />
          <h3 style={{ marginBottom: "5px" }}>Access Denied</h3>
          <p style={{ color: "var(--gray)" }}>
            Only system administrators can access this dashboard.
          </p>
        </Card>
      </>
    );
  }

  const recentActivities = [
    { id: 1, action: "Material approved", subject: "Advanced Algorithms", time: "2 hours ago" },
    { id: 2, action: "User reported", subject: "Inappropriate content", time: "4 hours ago" },
    { id: 3, action: "Event created", subject: "Tech Summit 2026", time: "6 hours ago" },
    { id: 4, action: "Material rejected", subject: "Spam entry", time: "1 day ago" },
  ];

  return (
    <>
      <PageHead
        eyebrow="MANAGEMENT"
        title="Admin Dashboard"
        desc="Central control room for the College Union platform."
      />

      <RevealGroup className="stats">
        <div className="stat">
          <div className="stat-icon">
            <Users size={19} />
          </div>
          <div>
            <small>Active students</small>
            <strong>{stats.activeStudents}</strong>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon">
            <CalendarDays size={19} />
          </div>
          <div>
            <small>Upcoming events</small>
            <strong>{stats.upcomingEvents}</strong>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon">
            <ClipboardList size={19} />
          </div>
          <div>
            <small>Open grievances</small>
            <strong>{stats.openGrievances}</strong>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon">
            <BookOpen size={19} />
          </div>
          <div>
            <small>Academic materials</small>
            <strong>{stats.academicMaterials}</strong>
          </div>
        </div>
      </RevealGroup>

      <div className="two-col">
        <Card>
          <h3>Management shortcuts</h3>
          <div className="quickgrid">
            {[
              ["academics", "Academics", "Manage departments/materials", BookOpen],
              ["welfare", "Student Welfare", "Manage opportunity listings", GraduationCap],
              ["events", "Events", "Create and publish events", CalendarDays],
              ["grievances", "Grievances", "Review issue queue", ClipboardList],
            ].map(([k, t, s, I]) => (
              <div className="quick" key={k}>
                <div className="quick-icon">
                  <I size={20} />
                </div>
                <div>
                  <b>{t}</b>
                  <span>{s}</span>
                </div>
                <ChevronRight size={16} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3>Moderation Activity</h3>
          {moderationStats && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span>Pending reviews</span>
                <strong>{moderationStats.totalPending}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span>Open reports</span>
                <strong>{moderationStats.totalReports}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span>Approved today</span>
                <strong>{moderationStats.approvedToday}</strong>
              </div>
            </div>
          )}
          <div className="role-banner">
            <ShieldCheck size={20} />
            <div>
              <b>Governance</b>
              <span>All role changes and moderation actions are audited.</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="card-head">
          <div>
            <h3>Recent activities</h3>
            <p>Latest admin and moderation actions</p>
          </div>
          <Activity size={19} />
        </div>
        {recentActivities.map((activity) => (
          <div
            key={activity.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>
              <b>{activity.action}</b>
              <p style={{ fontSize: "12px", color: "var(--gray)" }}>{activity.subject}</p>
            </div>
            <small style={{ color: "var(--gray)" }}>{activity.time}</small>
          </div>
        ))}
      </Card>
    </>
  );
}
