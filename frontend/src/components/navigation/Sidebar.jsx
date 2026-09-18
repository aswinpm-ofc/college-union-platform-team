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
  X,
} from "lucide-react";
import { modules } from "../../data/demo/modules";
import BrandMark from "../ui/BrandMark";

export default function Sidebar({ page, go, open, close, unreadCount = 0 }) {
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
          </button>
        ))}
      </nav>
    </aside>
  );
}