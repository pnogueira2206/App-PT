import type { ReactNode } from "react";

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;

/**
 * Plain text with its web addresses turned into links (e.g. the Instagram reel of a
 * warm-up). Links sit above a card's whole-card link (`relative z-10`) so they open
 * the video instead of the editor.
 */
export function linkify(text: string, className = "relative z-10 break-all text-sky-700 underline underline-offset-2"): ReactNode[] {
  return text.split(URL_RE).map((part, i) => {
    if (i % 2 === 0) return part;
    // Leave trailing punctuation outside the link: "(https://…)." → link + ").".
    const match = part.match(/^(.*?)([).,;:!?]*)$/)!;
    return (
      <span key={i}>
        <a href={match[1]} target="_blank" rel="noopener noreferrer" className={className}>
          {match[1]}
        </a>
        {match[2]}
      </span>
    );
  });
}
