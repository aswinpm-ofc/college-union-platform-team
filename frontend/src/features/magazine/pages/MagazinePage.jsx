import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { PageHead } from "../../../components/common/PagePrimitives";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../../lib/constants";
import { getAuthHeaders } from "../../../lib/supabaseClient";

export default function Magazine() {
	useOutletContext();
	const [issues, setIssues] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadIssues() {
			if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
				setLoading(false);
				return;
			}
			const response = await fetch(`${SUPABASE_URL}/rest/v1/magazine_issues?status=eq.published&order=published_at.desc`, { headers: await getAuthHeaders() });
			if (response.ok) setIssues(await response.json());
			setLoading(false);
		}
		loadIssues();
	}, []);

	return <><PageHead eyebrow="UNION PUBLICATION" title="Union Magazine" desc="Stories, achievements, opinions and campus life." />{loading && <div className="loading-state">Loading magazine issues...</div>}{!loading && !issues.length && <div className="empty-state"><h2>No magazine issues published</h2><p>Published issues will appear here when the union releases them.</p></div>}{!loading && issues.length > 0 && <div className="issue-grid">{issues.map((issue) => <article className="card" key={issue.id}><div className="mini-cover"><span>{issue.edition || "Edition"}</span></div><h2>{issue.title}</h2><p>{issue.description}</p><button className="primary" onClick={() => window.open(issue.source_url, "_blank", "noopener,noreferrer")} disabled={!issue.source_url}>{issue.source_url ? "Read magazine" : "Link unavailable"}</button></article>)}</div>}</>;
}