import React from "react";
export default function MediaPlaceholder({ label = "This is a demo media placeholder." }) {
  return (
    <div className="media-placeholder" role="img" aria-label={label}>
      <span>{label}</span>
      <small>No external image/asset is loaded in demo mode.</small>
    </div>
  );
}
