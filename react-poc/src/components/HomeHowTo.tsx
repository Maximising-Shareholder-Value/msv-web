// components/HomeHowTo.tsx — "How to use $MSV" on the homepage: the walkthrough's
// five steps laid out as numbered cards, instead of a slideshow. Same text as
// the main site's walkthrough (data/howTo.ts).

import { HOW_TO_SLIDES } from "../data/howTo";

export function HomeHowTo() {
  return (
    <ol className="hht-steps">
      {HOW_TO_SLIDES.map((step, i) => (
        <li key={step.title} className="hht-step">
          <span className="hht-num">{String(i + 1).padStart(2, "0")}</span>
          <strong>{step.title}</strong>
          <p>{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
