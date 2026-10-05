export default function Splash() {
  return (
    <svg data-hero-splash aria-hidden="true" viewBox="-300 -200 600 260"
      style={{ position: "absolute", left: "50%", top: 0, width: "min(100%, 600px)", overflow: "visible", transform: "translate(-50%, -76.923%)", opacity: 0, pointerEvents: "none", zIndex: 2 }}>
      <path data-splash-bump d="M-85 0 Q0 0 85 0" fill="none" stroke="var(--hero-ink, #11120e)" strokeWidth="4" />
      {[0, 1, 2].map(index => <ellipse key={index} data-splash-ring cx="0" cy="3" rx="0" ry="0" fill="none" stroke="var(--hero-ink, #11120e)" strokeWidth="3" />)}
      {Array.from({ length: 16 }, (_, index) => <circle key={index} data-splash-drop cx="0" cy="0" r="4" fill={index % 3 ? "var(--hero-ink, #11120e)" : "var(--hero-lime, #d5fa48)"} />)}
    </svg>
  );
}
