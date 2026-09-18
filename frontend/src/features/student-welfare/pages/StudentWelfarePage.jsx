import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  BriefcaseBusiness,
  ClipboardList,
  GraduationCap,
  Trophy,
  WalletCards,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card, PageHead, RevealGroup } from "../../../components/common/PagePrimitives";
import { welfareService } from "../../../services/api/welfareService";

export default function StudentWelfarePage() {
  const { notify } = useOutletContext();
  const [type, setType] = useState("all");
  const [welfare, setWelfare] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWelfare();
  }, []);

  const loadWelfare = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await welfareService.getWelfarePlatforms();
      if (response.ok) {
        setWelfare(response.data);
      } else {
        setError("Failed to load welfare opportunities");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categoryIcons = {
    scholarship: GraduationCap,
    "financial-aid": WalletCards,
    hostel: Trophy,
    sports: Trophy,
    career: BriefcaseBusiness,
  };

  const categories = welfareService.getCategories();
  const shown =
    type === "all"
      ? welfare
      : welfare.filter((x) => x.category === type);

  const openOpportunity = (opportunity) => {
    if (!opportunity.source_url) {
      notify(`${opportunity.title} details`);
      return;
    }
    window.open(opportunity.source_url, "_blank", "noopener,noreferrer");
  };

  const categoryCount = (cat) => welfare.filter((x) => x.category === cat).length;

  return (
    <>
      <PageHead
        eyebrow="STUDENT WELFARE HUB"
        title="Opportunities for your next step"
        desc="Scholarships, internships, fellowships, exams and part-time opportunities."
      />

      <RevealGroup className="welfare-cats">
        <button
          className={type === "all" ? "active" : ""}
          onClick={() => setType("all")}
        >
          <Trophy size={19} />
          <b>All opportunities</b>
          <span>{welfare.length} total</span>
        </button>
        {categories.map((cat) => {
          const Icon = categoryIcons[cat.id] || GraduationCap;
          return (
            <button
              className={type === cat.id ? "active" : ""}
              onClick={() => setType(cat.id)}
              key={cat.id}
            >
              <Icon size={19} />
              <b>{cat.label}</b>
              <span>{categoryCount(cat.id)} opportunities</span>
            </button>
          );
        })}
      </RevealGroup>

      {loading && <div className="loading-state">Loading opportunities...</div>}

      {error && (
        <div className="error-state">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {!loading && shown.length === 0 && (
        <div className="empty-state">
          <Trophy size={40} />
          <p>No opportunities available in this category</p>
        </div>
      )}

      {!loading && shown.length > 0 && (
        <div className="opps">
          {shown.map((o) => (
            <Card key={o.id}>
              <div className="opp-top">
                <span className="pill">{o.category}</span>
                <span className="deadline">Deadline {o.deadline}</span>
              </div>
              <h3>{o.title}</h3>
              <p>{o.description}</p>
              <div className="opp-meta">
                <span>{o.eligibility}</span>
                <span>{o.applicants} applied</span>
              </div>
              <button
                className="outline full"
                onClick={() => openOpportunity(o)}
              >
                {o.source_url ? "Open application website" : "View opportunity"} <ChevronRight size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}