import React from "react";
import { TrendingUp } from "lucide-react";

// `spark` is an optional array of 0..1 values rendered as a mini bar chart.
export default function Stat({ icon: Icon, label, value, trend, spark }) {
  return (
    <div className="stat">
      <div className="stat-icon"><Icon size={19} /></div>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        {trend && (
          <span className="stat-trend">
            {trend.trim().startsWith("+") && <TrendingUp size={10} />}
            {trend}
          </span>
        )}
      </div>
      {spark && (
        <span className="stat-spark" aria-hidden="true">
          <svg viewBox="0 0 62 26" width="62" height="26">
            {spark.map((v, i) => {
              const h = Math.max(4, Math.round(v * 26));
              return <rect key={i} x={i * 9} y={26 - h} width="5" height={h} rx="2.5" />;
            })}
          </svg>
        </span>
      )}
    </div>
  );
}
