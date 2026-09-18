import React from "react";
import Reveal from "./Reveal";

export default function PageHead({ eyebrow, title, desc, action }) {
  return (
    <Reveal>
      <div className="pagehead">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {desc && <p>{desc}</p>}
        </div>
        {action}
      </div>
    </Reveal>
  );
}
