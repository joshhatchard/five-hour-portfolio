export default function Splash() {
  return (
    <svg data-hero-splash aria-hidden="true" viewBox="-300 -280 600 300"
      style={{ position: "absolute", left: "50%", top: 0, width: "min(100%, 600px)", overflow: "visible", transform: "translate(-50%, -93.333%)", opacity: 0, pointerEvents: "none", zIndex: 11 }}>
      <g data-splash-crown-back><image href="/hero/splash/crown_filled_l.svg" x="-216" y="-250" width="400" height="276" /></g>
      <g data-splash-crown-front><image href="/hero/splash/crown_halftone_l.svg" x="-200" y="-250" width="400" height="276" /></g>
      <g data-splash-starburst><image href="/hero/splash/starburst_halftone_m.svg" x="72" y="-252" width="148" height="148" /></g>
      <g data-splash-starburst><image href="/hero/splash/starburst_outline_s.svg" x="-166" y="-206" width="104" height="104" /></g>
      <g data-splash-particle><image href="/hero/splash/dots_scatter.svg" x="18" y="-307" width="158" height="91" /></g>
      <g data-splash-particle><image href="/hero/splash/dots_trio.svg" x="-92" y="-280" width="118" height="81" /></g>
    </svg>
  );
}
