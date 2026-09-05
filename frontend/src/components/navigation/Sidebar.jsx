import React from "react";
import {
  Home,
  Megaphone,
  CalendarDays,
  ClipboardList,
  Droplets,
  BookOpen,
  GraduationCap,
  ShieldAlert,
  Newspaper,
  Map,
  Bell,
  UserRound,
  ShieldCheck,
  X,
} from "lucide-react";
import { modules } from "../../data/demo/modules";
import BrandMark from "../ui/BrandMark";

export default function Sidebar({ page, go, open, close, role, user, unreadCount = 0, onLogout }) {
  const userName = user?.name || "Aswin P.";
  const userInitials = user?.initials || "AP";
  const roleText =
    role === "student"
      ? "CSE • Semester 5"
      : role === "maintainer"
      ? "Academic Maintainer"
      : "Super Admin";

  return (
    <aside className={"sidebar " + (open ? "open" : "")}>
      <div className="brand">
        <div className="brandmark">
          <BrandMark size={20} />
        </div>
        <div>
          <b>UnionHub</b>
          <small>College Union</small>
        </div>
        <button className="iconbtn close-side" onClick={close}>
          <X size={18} />
        </button>
      </div>
      <div className="side-label">MAIN</div>
      <nav>
        {modules.map(([key, label, Icon]) => (
          <button
            key={key}
            className={page === key ? "active" : ""}
            onClick={() => go(key)}
          >
            <Icon size={18} />
            <span>{label}</span>
            {key === "notifications" && unreadCount > 0 && <em>{unreadCount}</em>}
          </button>
        ))}
      </nav>
      <div className="side-label">MANAGEMENT</div>
      <button
        className={"admin-link " + (role !== "student" ? "visible" : "")}
        onClick={() => role !== "student" && go(role === "maintainer" ? "maintainer" : "admin")}
      >
        <ShieldCheck size={18} />
        <span>{role === "maintainer" ? "Maintainer Console" : "Admin Console"}</span>
      </button>
      <div className="sidebar-bottom">
        <div className="user-mini">
          <div className="avatar">{userInitials}</div>
          <div>
            <b>{userName}</b>
            <small>{roleText}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}