import React from "react";

// UnionHub mark: a central hub with three linked nodes — one union, many services.
export default function BrandMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12 L12 5 M12 12 L5.4 16 M12 12 L18.6 16"
        stroke="#fff"
        strokeOpacity=".75"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="4.6" r="2.3" fill="#fff" />
      <circle cx="5.2" cy="16.4" r="2.3" fill="#fff" fillOpacity=".82" />
      <circle cx="18.8" cy="16.4" r="2.3" fill="#fff" fillOpacity=".82" />
      <circle cx="12" cy="12" r="3.1" fill="#fff" />
      <circle cx="12" cy="12" r="1.25" fill="#5b4fdb" />
    </svg>
  );
}
