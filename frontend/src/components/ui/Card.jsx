import React from "react";
import Reveal from "./Reveal";

export default function Card({ children, className = "", onClick }) {
  return (
    <Reveal>
      <div
        className={`card ${className}`}
        onClick={onClick}
        style={{ cursor: "pointer" }}
      >
        {children}
      </div>
    </Reveal>
  );
}