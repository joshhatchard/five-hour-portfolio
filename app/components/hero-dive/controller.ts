import { sampleDive } from "./divePose";

export const diveConfig = {
  stageHeights: 4.4,
  endWaterline: 0,
  impact: 0.85,
  cameraNeutral: 0.78,
  zoom: 1.8,
  mobileZoom: 1.45,
  // --- the leap ---
  launch: 0.205, // progress where the feet leave the board (matches the launch key in divePose.ts)
  peak: 0.42, // progress at the top of the arc
  jumpHeight: 0.26, // height of the leap above the board, as a fraction of viewport height
  camLag: 0.14, // how far the camera trails the diver on the way up (fraction of viewport height)
};

export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const smooth = (a: number, b: number, value: number) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export type HeroController = {
  element: HTMLElement;
  progress: number;
  visible: boolean;
  width: number;
  height: number;
  stageTop: number;
  waterline: number;
  startX: number;
  startFootY: number;
  figureHeight: number;
  ink: string;
  cameraX: number;
  cameraY: number;
  zoom: number;
  diverX: number;
  diverY: number;
  renderDom: () => void;
};

/**
 * Springboard flex in degrees (+ = free end dips down). It loads up while the diver crouches,
 * then recoils the other way as the feet leave the board.
 */
export function boardAngle(p: number) {
  const load = smooth(0.08, 0.165, p) - smooth(0.165, diveConfig.launch, p);
  const recoil =
    smooth(diveConfig.launch - 0.005, 0.222, p) - smooth(0.222, 0.3, p);
  return load * 2.6 - recoil * 2.2;
}

/** Vertical drop (screen px, + = down) of the spot where the diver stands, caused by the board flexing. */
export function boardDipPx(state: HeroController) {
  const scale = state.figureHeight / 208; // 208 = figure height in the 600x480 SVG scene
  return Math.sin((boardAngle(state.progress) * Math.PI) / 180) * 350 * scale; // 350 = distance from the board's fixed end to the diver
}

/**
 * Hip path for the whole dive, in screen pixels.
 * - before launch the caller keeps the planted foot on the board (this returns a placeholder y)
 * - launch → peak: fast, decelerating rise (the "pop" off the board)
 * - peak → impact: slower, accelerating fall into the water
 * `launchY` is the hip height at the moment of take-off, measured by the caller from the posed model.
 */
export function flight(
  state: HeroController,
  hipHeight: number,
  launchY?: number,
) {
  const p = state.progress;
  const pose = sampleDive(p);
  const { launch, peak, impact } = diveConfig;

  const y0 = launchY ?? state.startFootY - hipHeight;
  const yPeak = y0 - diveConfig.jumpHeight * state.height;
  // Landing point, kept comfortably below the top of the arc.
  const impactY = Math.max(
    state.height * 0.66 - hipHeight,
    yPeak + state.height * 0.25,
  );

  let y: number;
  if (p <= launch) {
    y = y0;
  } else if (p < peak) {
    const u = (peak - p) / (peak - launch); // 1 at launch → 0 at the top
    y = yPeak + (y0 - yPeak) * u * u;
  } else {
    const u = clamp((p - peak) / (impact - peak)); // 0 at the top → 1 at the water
    y = yPeak + (impactY - yPeak) * u * u;
  }
  if (p > impact) y += smooth(impact, 1, p) * state.figureHeight * 1.8;

  const x = mix(state.startX, state.width * 0.5, clamp(pose.x / 0.5));
  return { x, y, pose };
}
