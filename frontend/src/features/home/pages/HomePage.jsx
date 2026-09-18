import React from "react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Bell, BookOpen, CalendarDays, ChevronRight, ClipboardList, Clock3, Droplets, GraduationCap, Map, MapPin, ShieldAlert, Sparkles, TrendingUp, TrendingDown, Trophy, Users } from "lucide-react";
import { eventsService } from "../../../services/api/eventsService";
import { Card, Reveal, RevealGroup, Stat } from "../../../components/common/PagePrimitives";

const HUBS = [
  {
    key: "academics", title: "Academics", desc: "Notes, papers and subject material for every semester.",
    icon: BookOpen, tone: "violet", metrics: [["—", "materials"], ["—", "this month"]],
    gauge: "No published data", fill: 0,
  },
  {
    key: "welfare", title: "Student Welfare", desc: "Scholarships, fellowships and part-time opportunities.",
    icon: GraduationCap, tone: "green", metrics: [["—", "open"], ["—", "hubs"]],
    gauge: "No published data", fill: 0,
  },
  {
    key: "grievances", title: "Grievances", desc: "Raise an issue and follow every status change.",
    icon: ClipboardList, tone: "amber", metrics: [["—", "active"], ["—", "resolved"]],
    gauge: "No published data", fill: 0,
  },
  {
    key: "blood", title: "Blood Bank", desc: "Verified campus donors and live emergency requests.",
    icon: Droplets, tone: "rose", metrics: [["—", "donors"], ["—", "ready now"]],
    gauge: "No published data", fill: 0,
  },
  {
    key: "emergency", title: "Emergency Hub", desc: "One-tap access to verified campus response lines.",
    icon: ShieldAlert, tone: "red", metrics: [["—", "contacts"], ["—", "available"]],
    gauge: "No published data", fill: 0,
  },
  {
    key: "map", title: "University Map", desc: "Navigate departments, food courts and campus services.",
    icon: Map, tone: "blue", metrics: [["—", "places"], ["—", "zones"]],
    gauge: "No published data", fill: 0,
  },
];

// Campus activity pulse, last 12 days — drives the hero's full-bleed curve.
const PULSE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// Smooth cubic path through evenly spaced values, plus the closed area beneath it.
function pulsePath(values, w, h) {
  const max = Math.max(...values) || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - (v / max) * (h - 12) - 6]);
  let line = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = ((x0 + x1) / 2).toFixed(1);
    line += ` C ${cx} ${y0.toFixed(1)}, ${cx} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return { line, area: `${line} L ${w} ${h} L 0 ${h} Z` };
}

const PULSE_PATH = pulsePath(PULSE, 1200, 150);

const HERO_METRICS = [
  { label: "Campus activity", value: "—", unit: "", delta: "No data yet", up: true, spark: [0, 0, 0, 0, 0, 0, 0] },
  { label: "Events you attended", value: "—", unit: "", delta: "No registrations yet", up: true, spark: [0, 0, 0, 0, 0, 0, 0] },
  { label: "Grievance response", value: "—", unit: "", delta: "No data yet", up: false, spark: [0, 0, 0, 0, 0, 0, 0] },
];

const UPDATES = [];

function useGreeting() {
  const now = new Date();
  const hour = now.getHours();
  const period = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const dateLabel = now
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    .toUpperCase();
  const shortDate = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { period, dateLabel, shortDate };
}

// "Sep 05" -> "Tomorrow" / "In 4 days", relative to today.
function countdownLabel(dateStr) {
  const today = new Date();
  const target = new Date(`${dateStr} ${today.getFullYear()}`);
  if (Number.isNaN(target.getTime())) return dateStr;
  const days = Math.round((target.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `In ${days} days`;
  return dateStr;
}

export default function HomePage({ role, user }) {
  const { go } = useOutletContext();
  const [events, setEvents] = useState([]);
  useEffect(() => {
    eventsService.getEvents().then((result) => {
      if (!result?.ok || !Array.isArray(result.data)) return;
      setEvents(result.data.map((event) => ({
        ...event,
        date: event.date ? new Date(`${event.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit" }) : "",
        going: event.attendees || 0,
        capacity: event.capacity || Math.max(event.attendees || 0, 1),
        tag: event.category || "event",
      })));
    });
  }, []);
  const firstName = user?.name?.split(" ")[0] || "there";
  const { period, dateLabel, shortDate } = useGreeting();
  const nextEvent = events[0] || { date: "", title: "No upcoming events", time: "", venue: "" };

  return <>
    <Reveal className="hero-reveal"><div className="hero">
      <div className="hero-main">
        <div className="hero-copy">
          <span className="eyebrow light">{dateLabel}</span>
          <h1>Good {period}, {firstName}.</h1>
          <p>Your campus, union services and opportunities — all in one place.</p>
          <div className="hero-chips">
            <span><GraduationCap size={13} /> Semester 5</span>
            <span><CalendarDays size={13} /> {events.length} upcoming events</span>
          </div>
          <div className="hero-actions"><button className="primary" onClick={() => go("events")}>Explore events <ChevronRight size={16} /></button><button className="ghost" onClick={() => go("grievances")}>Submit a grievance</button></div>
        </div>
        <div className="hero-art">
          <div className="orbit o1" /><div className="orbit o2" />
          <div className="hero-panel">
            <div className="hero-panel-head">
              <span className="hero-live"><i />Live</span>
              <span>{shortDate}</span>
            </div>
            <button className="hero-next" onClick={() => go("events")}>
              <span className="hero-next-label"><Sparkles size={11} /> Next up · {countdownLabel(nextEvent.date)}</span>
              <b>{nextEvent.title}</b>
              <span className="hero-next-meta">{nextEvent.time} · {nextEvent.venue}</span>
            </button>
            <div className="hero-panel-rows">
              <button onClick={() => go("grievances")}><ClipboardList size={14} /><span>Open grievances</span><b>—</b></button>
              <button onClick={() => go("academics")}><BookOpen size={14} /><span>New materials</span><b>—</b></button>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-metrics">
        {HERO_METRICS.map((m) => (
          <div className="hero-metric" key={m.label}>
            <span className="hm-label">{m.label}</span>
            <span className="hm-value">{m.value}{m.unit && <i>{m.unit}</i>}</span>
            <span className={m.up ? "hm-delta up" : "hm-delta down"}>
              {m.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{m.delta}
            </span>
            <span className="hm-spark" aria-hidden="true">
              <svg viewBox="0 0 62 24" width="62" height="24">
                {m.spark.map((v, i) => {
                  const h = Math.max(3, Math.round(v * 24));
                  return <rect key={i} x={i * 9} y={24 - h} width="5" height={h} rx="2.5" />;
                })}
              </svg>
            </span>
          </div>
        ))}
        <div className="hero-metric hero-ring">
          <svg viewBox="0 0 76 76" width="66" height="66" aria-hidden="true">
            <defs>
              <linearGradient id="heroRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a9a2ff" />
                <stop offset="100%" stopColor="#7fdcb0" />
              </linearGradient>
            </defs>
            <circle cx="38" cy="38" r="31" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="7" />
            <circle
              cx="38" cy="38" r="31" fill="none" stroke="url(#heroRing)" strokeWidth="7"
              strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset="58"
              transform="rotate(-90 38 38)"
            />
          </svg>
          <div>
            <span className="hm-label">Semester progress</span>
            <span className="hm-value">—</span>
            <span className="hm-sub">No progress data yet</span>
          </div>
        </div>
      </div>
      <svg className="hero-wave" viewBox="0 0 1200 150" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="heroWaveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b7cff" stopOpacity=".34" />
            <stop offset="100%" stopColor="#8b7cff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="heroWaveLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6b5ce0" stopOpacity=".25" />
            <stop offset="50%" stopColor="#a9a2ff" stopOpacity=".95" />
            <stop offset="100%" stopColor="#7fdcb0" stopOpacity=".9" />
          </linearGradient>
        </defs>
        <path className="hero-wave-area" d={PULSE_PATH.area} fill="url(#heroWaveFill)" />
        <path
          className="hero-wave-line" d={PULSE_PATH.line} fill="none" pathLength="1"
          stroke="url(#heroWaveLine)" strokeWidth="2.5" vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div></Reveal>
    <RevealGroup className="stats">
      <Stat icon={CalendarDays} label="Upcoming events" value={events.length.toString()} spark={[0, 0, 0, 0, 0, 0, 0]} />
      <Stat icon={Bell} label="Unread updates" value="—" spark={[0, 0, 0, 0, 0, 0, 0]} />
      <Stat icon={BookOpen} label="Academic materials" value="—" spark={[0, 0, 0, 0, 0, 0, 0]} />
      <Stat icon={GraduationCap} label="Welfare opportunities" value="—" spark={[0, 0, 0, 0, 0, 0, 0]} />
    </RevealGroup>
    <Reveal><div className="section-row"><div><h2>Quick access</h2><p>Frequently used student services.</p></div></div></Reveal>
    <Reveal className="hub-grid">{HUBS.map((hub) => {
      const Icon = hub.icon;
      return (
        <button className="hub-card" data-tone={hub.tone} onClick={() => go(hub.key)} key={hub.key}>
          <span className="hub-glow" aria-hidden="true" />
          <span className="hub-watermark" aria-hidden="true"><Icon size={112} /></span>
          <span className="hub-cta" aria-hidden="true"><ChevronRight size={16} /></span>
          <span className="hub-icon"><Icon size={23} /></span>
          <span className="hub-title">{hub.title}</span>
          <span className="hub-desc">{hub.desc}</span>
          <span className="hub-metrics">
            {hub.metrics.map(([value, label]) => (
              <span className="hub-metric" key={label}><b>{value}</b><small>{label}</small></span>
            ))}
          </span>
          <span className="hub-gauge">
            <span className="hub-gauge-top"><small>{hub.gauge}</small><b>{hub.fill}%</b></span>
            <span className="hub-bar"><i style={{ width: `${hub.fill}%` }} /></span>
          </span>
        </button>
      );
    })}</Reveal>
    <div className="two-col">
      <Card>
        <div className="card-head">
          <div><h3>Upcoming events</h3><p>What's happening around campus</p></div>
          <button className="textbtn" onClick={() => go("events")}>View all <ChevronRight size={14} /></button>
        </div>
        <div className="event-list">
          {events.length ? events.map((e) => {
            const [month, day] = e.date.split(" ");
            const pct = Math.min(100, Math.round((e.going / e.capacity) * 100));
            return (
              <button className="event-item" data-tag={e.tag.toLowerCase()} onClick={() => go("events")} key={e.title}>
                <span className="ev-date"><b>{day}</b><small>{month.toUpperCase()}</small></span>
                <span className="ev-body">
                  <span className="ev-top">
                    <b>{e.title}</b>
                    <span className="ev-when">{countdownLabel(e.date)}</span>
                  </span>
                  <span className="ev-meta">
                    <span><Clock3 size={12} /> {e.time}</span>
                    <span><MapPin size={12} /> {e.venue}</span>
                  </span>
                  <span className="ev-fill"><i style={{ width: `${pct}%` }} /></span>
                  <span className="ev-going"><Users size={11} /> {e.going} going · {pct}% of {e.capacity} seats</span>
                </span>
                <ChevronRight size={16} />
              </button>
            );
          }) : <p className="empty-state">No upcoming events have been published.</p>}
        </div>
      </Card>
      <Card>
        <div className="card-head">
          <div><h3>Latest updates</h3><p>Official union notices</p></div>
          <button className="textbtn" onClick={() => go("announcements")}>All updates <ChevronRight size={14} /></button>
        </div>
        <div className="update-feed">
          {UPDATES.length ? UPDATES.map((u) => {
            const Icon = u.icon;
            return (
              <button className="update-item" data-tone={u.tone} onClick={() => go("announcements")} key={u.title}>
                <span className="ui-marker"><Icon size={14} /></span>
                <span className="ui-body">
                  <span className="ui-top"><b>{u.title}</b><span className="ui-tag">{u.tag}</span></span>
                  <span className="ui-desc">{u.desc}</span>
                  <span className="ui-meta">{u.time}</span>
                </span>
              </button>
            );
          }) : <p className="empty-state">No announcements have been published.</p>}
        </div>
      </Card>
    </div>
  </>;
}
