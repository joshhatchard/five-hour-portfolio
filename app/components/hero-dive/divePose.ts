/** Standing tucked gainer with a proper springboard leap:
 *   stand → wind-up → deep crouch with arms back → explosive toe-off with arms swinging up
 *   → rising arch → gather → extended rise → first tuck → layout → second tuck → snap-out → vertical entry.
 * - Angles are authored for a right-facing rig and mirrored by the renderer.
 * - Two complete flips total 720 degrees. No run-up or axial twist.
 * - Keys carry explicit progress times (not evenly spaced), so the crouch/launch can be
 *   timed independently while everything after the launch stays where it was.
 */
export type Pose = {
  x: number;
  y: number;
  rotZ: number;
  scale: number;
  yaw: number;
  hips: number; // pelvis pitch, + = lean forward, - = tilt back
  spine: number; // chest pitch, + = forward, - = arch back
  head: number; // head pitch, + = look down, - = look up
  armRaise: number; // from T-pose: -90 = down at sides, +90 = straight up
  armSwing: number; // + = forward (both arms)
  elbow: number; // forearm fold toward the chest
  armStride: number; // + = left arm forward, right arm back (run cycle, computed)
  thigh: number; // + = forward
  shin: number; // knee bend, + = heel toward butt
  shinAsym: number; // left knee bends more, right less (run cycle, computed)
  spread: number;
  stride: number; // + = left leg forward, right leg back
  foot: number; // absolute foot pitch, 0 = flat, 60 = pointed
  run: number; // 0..1 run-cycle strength (key only)
};

const BASE: Pose = {
  x: 0,
  y: 0,
  rotZ: 0,
  scale: 1,
  yaw: 85,
  hips: 0,
  spine: 0,
  head: 0,
  armRaise: -80,
  armSwing: 0,
  elbow: 0,
  armStride: 0,
  thigh: 0,
  shin: 0,
  shinAsym: 0,
  spread: 4,
  stride: 0,
  foot: 0,
  run: 0,
};

export const POSE_KEYS = Object.keys(BASE) as (keyof Pose)[];
const k = (o: Partial<Pose>): Pose => ({ ...BASE, ...o });

// Primary tuck position
const TUCK = {
  hips: 28,
  spine: 40,
  head: 16,
  armRaise: -45, // upper arms a little closer to the body
  armSwing: 82,
  elbow: 60, // forearms folded in so the elbows are tucked, hands pulled toward the shins
  thigh: 122,
  shin: 132,
  spread: 6,
};

// Intermediate semi-tuck transition to smooth out second tuck entry
const SEMI_TUCK = {
  hips: 14,
  spine: 18,
  head: 6,
  armRaise: -10,
  armSwing: 45,
  elbow: 30,
  thigh: 65,
  shin: 75,
  spread: 4,
};

// Layout extension (after the first tuck): deep back arch with shins trailing 45° behind quads
const EXTENDED = {
  hips: -6, // Pelvis tilt backward
  spine: -22, // Pronounced back arch
  head: -12, // Head tilted back along body arch line
  armRaise: 90,
  armSwing: 0,
  elbow: 0,
  thigh: 0, // Quads parallel with body axis
  shin: 45, // Lower legs trailing 45° behind quads toward head
  spread: 0,
  foot: 60,
};

// Take-off extension: hips open and body stretched, with the lower legs trailing behind the thighs
// (same leg shape as the later layout, just a gentler arch) and toes pointed.
const LAUNCH_EXTENDED = {
  hips: -4,
  spine: -14,
  head: -10,
  armRaise: 100,
  armSwing: 0,
  elbow: 0,
  thigh: -4, // thighs slightly behind the torso line = open hips
  shin: 45, // lower legs trailing 45° behind the quads
  spread: 2,
  foot: 60,
};

// Late rapid kick-out right before hitting water
const WATER_SNAP_OUT = {
  hips: 0,
  spine: -2,
  head: -4,
  armRaise: -78,
  armSwing: 10,
  elbow: 30,
  thigh: 6,
  shin: 10,
  spread: 2,
  foot: 45,
};

// Vertical streamlined entry into water
const WATER_ENTRY = {
  hips: 0,
  spine: 0,
  head: 0,
  armRaise: -90, // arms hang tight against the body
  armSwing: 0,
  elbow: 40, // elbows tucked in, forearms folded in front of the torso
  thigh: 0,
  shin: 0,
  spread: 0,
  foot: 60,
};

type Key = { t: number; pose: Pose };
const at = (t: number, pose: Pose): Key => ({ t, pose });

const KEYS: Key[] = [
  // Relaxed stance
  at(
    0,
    k({
      hips: -2,
      spine: 2,
      armRaise: -82,
      armSwing: 3,
      elbow: 12,
      thigh: 4,
      shin: 7,
      spread: 10,
    }),
  ),

  // Weight starts to settle, arms begin to swing back
  at(
    0.06,
    k({
      hips: 5,
      spine: 5,
      head: 2,
      armRaise: -78,
      armSwing: -22,
      elbow: 14,
      thigh: 16,
      shin: 26,
      spread: 8,
    }),
  ),

  // Sinking into the crouch, arms swinging behind the body
  at(
    0.12,
    k({
      hips: 22,
      spine: 12,
      head: -4,
      armRaise: -62,
      armSwing: -62,
      elbow: 8,
      thigh: 66,
      shin: 90,
      spread: 8,
    }),
  ),

  // Bottom of the crouch: deep knee bend, torso forward, arms thrown all the way back (the load)
  at(
    0.165,
    k({
      hips: 28,
      spine: 16,
      head: -8,
      armRaise: -55,
      armSwing: -88,
      elbow: 4,
      thigh: 80,
      shin: 105,
      spread: 8,
    }),
  ),

  // Toe-off: legs snap straight, up on the toes, arms swinging up overhead
  at(
    0.205,
    k({
      x: 0,
      y: 0,
      rotZ: 3,
      hips: -2,
      spine: -6,
      head: -10,
      armRaise: 85,
      armSwing: 25,
      thigh: -2,
      shin: 0,
      spread: 4,
      foot: 60,
    }),
  ),

  // Rising: extended with the legs trailing behind, arms overhead, rotation just starting
  at(0.24, k({ x: 0.07, y: 0.2, rotZ: 30, ...LAUNCH_EXTENDED })),

  // Still extended and trailing, rotated about a quarter turn: the long open line right off the board
  at(
    0.285,
    k({ x: 0.17, y: 0.33, rotZ: 105, ...LAUNCH_EXTENDED, armSwing: 5 }),
  ),

  // Quick gather
  at(0.32, k({ x: 0.23, y: 0.38, rotZ: 205, ...SEMI_TUCK, foot: 20 })),

  // First flip tuck
  at(0.355, k({ x: 0.29, y: 0.42, rotZ: 330, ...TUCK })),

  // Layout extension starts at rotZ: 440°
  at(5 / 12, k({ x: 0.36, y: 0.5, rotZ: 440, ...EXTENDED })),

  // Arched layout held through rotZ: 510°
  at(6 / 12, k({ x: 0.42, y: 0.32, rotZ: 510, ...EXTENDED })),

  // Smooth rotational transition into second tuck at rotZ: 545°
  at(7 / 12, k({ x: 0.45, y: 0.12, rotZ: 545, ...SEMI_TUCK })),

  // Full second tuck reached at rotZ: 580°
  at(8 / 12, k({ x: 0.47, y: -0.1, rotZ: 580, ...TUCK })),

  // Tuck held late into fall down to rotZ: 660°
  at(9 / 12, k({ x: 0.49, y: -0.6, rotZ: 660, ...TUCK })),

  // Late rapid snap-out extension at rotZ: 700°
  at(10 / 12, k({ x: 0.5, y: -1.15, rotZ: 700, ...WATER_SNAP_OUT })),

  // Vertical entry plunge into water at rotZ: 720°
  at(11 / 12, k({ x: 0.5, y: -1.6, rotZ: 720, ...WATER_ENTRY })),
  at(1, k({ x: 0.5, y: -2.2, rotZ: 720, ...WATER_ENTRY })),
];

/**
 * Cubic Hermite between keys, with tangents taken from the neighbouring keys *in time*,
 * so unevenly spaced keys (a short toe-off next to a long tuck) don't overshoot.
 */
function tangent(i: number, key: keyof Pose): number {
  const a = KEYS[Math.max(0, i - 1)];
  const b = KEYS[Math.min(KEYS.length - 1, i + 1)];
  if (i > 0 && i < KEYS.length - 1) {
    const before = (KEYS[i].pose[key] - a.pose[key]) / (KEYS[i].t - a.t);
    const after = (b.pose[key] - KEYS[i].pose[key]) / (b.t - KEYS[i].t);
    // Peak, dip or hold: flatten the curve there so it never overshoots (e.g. hyper-extended knees).
    if (before * after <= 0) return 0;
  }
  return (b.pose[key] - a.pose[key]) / (b.t - a.t);
}

/** how many full strides happen per 1.0 of progress (the run lasts ~0.2) */
export const RUN_CYCLES = 12;

export function sampleDive(progress: number): Pose {
  const pr = Math.min(1, Math.max(0, progress));
  let i = 0;
  while (i < KEYS.length - 2 && pr > KEYS[i + 1].t) i++;
  const k1 = KEYS[i];
  const k2 = KEYS[i + 1];
  const h = k2.t - k1.t;
  const t = (pr - k1.t) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  const out = {} as Pose;

  for (const key of POSE_KEYS) {
    out[key] =
      h00 * k1.pose[key] +
      h10 * h * tangent(i, key) +
      h01 * k2.pose[key] +
      h11 * h * tangent(i + 1, key);
  }

  // procedural run cycle layered on top, faded in and out by `run`
  const r = Math.max(0, out.run);
  const phase = pr * RUN_CYCLES * Math.PI * 2;
  out.stride += r * 42 * Math.sin(phase);
  out.armStride = -r * 58 * Math.sin(phase); // arms swing opposite to the legs
  out.shinAsym = r * 30 * Math.cos(phase);
  out.y += r * 0.012 * Math.abs(Math.sin(phase)); // small bounce

  return out;
}
