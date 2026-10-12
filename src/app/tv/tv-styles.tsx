/**
 * TV mode is shown on the gym's old Chromebox (Chrome 76), which ignores the app's
 * Tailwind CSS. These styles are plain CSS that old browsers understand: no
 * cascade layers, no modern colour functions, no flex `gap`. Sizes follow the
 * screen width (vw) so the text fills a TV.
 */
const CSS = `
body { margin: 0; background: #0b0b0b; }
.tv { min-height: 100vh; box-sizing: border-box; padding: 2vw 2.5vw; background: #0b0b0b; color: #f2f2f2;
  font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
.tv a { color: inherit; text-decoration: none; }
.tv-head { display: flex; justify-content: space-between; align-items: flex-end;
  border-bottom: 3px solid #c8a24a; padding-bottom: 1vw; margin-bottom: 1.6vw; }
.tv-brand { color: #c8a24a; letter-spacing: 0.3em; font-size: 1vw; font-weight: 700; margin: 0 0 0.4vw; }
.tv-title { font-size: 2.6vw; font-weight: 700; margin: 0; line-height: 1.15; }
.tv-date { font-size: 1.4vw; color: #bdbdbd; margin: 0.3vw 0 0; }
.tv-nav a { display: inline-block; margin-left: 0.8vw; font-size: 1.1vw; color: #c8a24a;
  border: 1px solid #555; border-radius: 6px; padding: 0.3vw 0.9vw; }
.tv-cols { -webkit-column-width: 29vw; column-width: 29vw; -webkit-column-gap: 3vw; column-gap: 3vw; }
.tv-cols + .tv-cols { border-top: 2px solid #3a3a3a; margin-top: 0.4vw; padding-top: 1.6vw; }
.tv-section { -webkit-column-break-inside: avoid; break-inside: avoid; page-break-inside: avoid; margin: 0 0 1.6vw; }
.tv-workout { font-size: 1.9vw; font-weight: 700; color: #ffffff; margin: 0 0 1vw; }
.tv-label { font-size: 1.55vw; font-weight: 700; color: #c8a24a; margin: 0 0 0.3vw; }
.tv-text { font-size: 1.45vw; line-height: 1.35; white-space: pre-wrap; margin: 0; }
.tv-muted { color: #bdbdbd; }
.tv-kg { color: #0b0b0b; background: #c8a24a; border-radius: 4px; padding: 0 0.3vw; margin-left: 0.3vw; font-weight: 700; white-space: nowrap; }
.tv-notes { font-style: italic; color: #c9c9c9; }
.tv-empty { font-size: 2vw; color: #bdbdbd; margin-top: 4vw; text-align: center; }
.tv-list h2 { font-size: 1.6vw; color: #c8a24a; margin: 2vw 0 0.8vw; }
.tv-list a { display: inline-block; font-size: 1.5vw; border: 1px solid #444; border-radius: 8px;
  padding: 0.6vw 1.2vw; margin: 0 0.8vw 0.8vw 0; }
`;

export function TvStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
