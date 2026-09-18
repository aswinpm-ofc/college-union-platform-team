import React, { useState, useEffect } from "react";
import { Bell, CalendarDays, ClipboardList, GraduationCap, ShieldAlert, AlertCircle } from "lucide-react";
import { Card, PageHead } from "../../../components/common/PagePrimitives";
import { notificationsService } from "../../../services/api/notificationsService";

const iconMap = {
  calendar: CalendarDays,
  award: GraduationCap,
  alert: ShieldAlert,
  book: GraduationCap,
  megaphone: Bell,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationsService.getNotifications();
      if (response.ok) {
        setNotifications(response.data);
      } else {
        setError("Failed to load notifications");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await notificationsService.markAllAsRead();
      if (response.ok) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error("Error marking all as read");
    }
  };

  const markAsRead = async (id) => {
    setNotifications(notifications.map((n2) => n2.id === id ? { ...n2, read: true } : n2));
    await notificationsService.markAsRead(id);
  }


  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <PageHead
        eyebrow="UPDATES"
        title="Notifications"
        desc="Your official UnionHub notification inbox."
        action={
          <button className="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            Mark all read
          </button>
        }
      />

      {loading && <div className="loading-state">Loading notifications...</div>}

      {error && (
        <div className="error-state">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="empty-state">
          <Bell size={40} />
          <p>No notifications yet</p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="notification-list">
          {notifications.map((n) => {
            const IconComponent = iconMap[n.icon] || Bell;

            return (
              <Card className={!n.read ? "unread" : ""} key={n.id} onClick={() => markAsRead(n.id)}>
                <div className="notif">
                  <div className="notif-icon">
                    <IconComponent size={18} />
                  </div>
                  <div>
                    <b>{n.title}</b>
                    <p>{n.message}</p>
                    <span>{n.timestamp}</span>
                  </div>
                  {!n.read && <i className="unread-dot" />}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}