import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Megaphone, ChevronRight, AlertCircle } from "lucide-react";
import { Card, PageHead } from "../../../components/common/PagePrimitives";
import { announcementsService } from "../../../services/api/announcementsService";

export default function AnnouncementsPage() {
  const { notify } = useOutletContext();
  const [announcements, setAnnouncements] = useState([]);
  const [filter, setFilter] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await announcementsService.getAnnouncements();
      if (response.ok) {
        setAnnouncements(response.data);
      } else {
        setError("Failed to load announcements");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = announcementsService.getCategories();
  const openAnnouncement = async (announcement) => {
    setDetailLoading(true);
    setDetailError("");
    const response = await announcementsService.getAnnouncementDetails(announcement.id);
    if (response.ok) setSelectedAnnouncement(response.data);
    else setDetailError(response.data?.error || "Unable to load this announcement.");
    setDetailLoading(false);
  };
  const filtered =
    filter === "all"
      ? announcements
      : announcements.filter((a) => a.category === filter);

  return (
    <>
      <PageHead
        eyebrow="OFFICIAL COMMUNICATION"
        title="Announcements"
        desc="Important union and campus notices."
        action={
          <button className="primary" onClick={() => notify("Demo: announcement composer opened")}>
            + New announcement
          </button>
        }
      />

      <div className="filterbar">
        <button className={filter === "all" ? "filter active" : "filter"} onClick={() => setFilter("all")}>
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={filter === cat.id ? "filter active" : "filter"}
            onClick={() => setFilter(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading-state">Loading announcements...</div>}

      {error && (
        <div className="error-state">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <Megaphone size={40} />
          <p>No announcements in this category</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="notice-list">
          {filtered.map((n) => (
            <Card key={n.id} className={n.priority === "high" ? "urgent-card" : ""}>
              <div className="notice">
                <div className="notice-icon">
                  <Megaphone size={19} />
                </div>
                <div>
                  <div className="notice-top">
                    <span className="pill">{n.category}</span>
                    <small>{n.publishedAt}</small>
                  </div>
                  <h3>{n.title}</h3>
                  <p>{n.content}</p>
                  <button className="textbtn" onClick={() => openAnnouncement(n)}>
                    Read notice <ChevronRight size={14} />
                  </button>
                  {selectedAnnouncement?.id === n.id && (
                    <div className="announcement-detail">
                      {detailLoading && <p>Loading notice...</p>}
                      {detailError && <p className="form-error">{detailError}</p>}
                      {!detailLoading && !detailError && <>
                        <p>{selectedAnnouncement.fullContent || selectedAnnouncement.content || selectedAnnouncement.body}</p>
                        {selectedAnnouncement.attachmentUrl && selectedAnnouncement.attachmentType?.startsWith("image/") && <img className="announcement-attachment" src={selectedAnnouncement.attachmentUrl} alt={selectedAnnouncement.attachmentName || "Announcement attachment"} />}
                        {selectedAnnouncement.attachmentUrl && selectedAnnouncement.attachmentType === "application/pdf" && <a className="outline" href={selectedAnnouncement.attachmentUrl} target="_blank" rel="noreferrer">Open PDF attachment</a>}
                        <button className="textbtn" onClick={() => setSelectedAnnouncement(null)}>Close notice</button>
                      </>}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}