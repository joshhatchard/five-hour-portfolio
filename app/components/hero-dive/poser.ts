import { Bone, Object3D, Quaternion, Vector3 } from "three";
import type { Pose } from "./divePose";

const DEG = Math.PI / 180;
const AX = new Vector3(1, 0, 0);
const AZ = new Vector3(0, 0, 1);
const rx = (deg: number) => new Quaternion().setFromAxisAngle(AX, deg * DEG);
const rz = (deg: number) => new Quaternion().setFromAxisAngle(AZ, deg * DEG);
const mul = (...qs: Quaternion[]) => qs.reduce((a, b) => a.multiply(b), new Quaternion());

/**
 * This rig (Mixamo-style FBX export) has flipped local bone axes (e.g. the legs
 * are rotated 180 degrees at rest), so rotating bones by their own local axes is
 * unintuitive. Instead we express every joint as a rotation in the model's own
 * frame (+X = character's left, +Y = up, +Z = forward) relative to the rest
 * pose, then convert to each bone's local rotation. That's what makes
 * "raise arm 90 degrees" mean the same thing for every bone.
 */
export function createPoser(root: Object3D) {
  root.updateMatrixWorld(true);

  const ordered: Bone[] = [];
  root.traverse((o) => {
    if ((o as Bone).isBone) ordered.push(o as Bone); // pre-order: parents first
  });
  const byName = new Map(ordered.map((b) => [b.name, b]));

  const restWorld = new Map<Bone, Quaternion>();
  ordered.forEach((b) => restWorld.set(b, b.getWorldQuaternion(new Quaternion())));

  const world = new Map<Bone, Quaternion>();
  const tmpParent = new Quaternion();

  function totals(p: Pose): Record<string, Quaternion> {
    const H = rx(p.hips);
    const chest = mul(H, rx(p.spine));
    const headQ = (f: number) => mul(chest.clone(), rx(p.head * f));
    const armL = mul(chest.clone(), rx(-(p.armSwing + p.armStride)), rz(p.armRaise));
    const armR = mul(chest.clone(), rx(-(p.armSwing - p.armStride)), rz(-p.armRaise));
    const forearmL = mul(chest.clone(), rx(-(p.armSwing + p.armStride + p.elbow)), rz(p.armRaise));
    const forearmR = mul(chest.clone(), rx(-(p.armSwing - p.armStride + p.elbow)), rz(-p.armRaise));
    const thighL = mul(H.clone(), rz(p.spread), rx(-(p.thigh + p.stride)));
    const thighR = mul(H.clone(), rz(-p.spread), rx(-(p.thigh - p.stride)));
    const shinL = mul(thighL.clone(), rx(p.shin + p.shinAsym));
    const shinR = mul(thighR.clone(), rx(p.shin - p.shinAsym));
    const foot = rx(p.foot);
    return {
      Root_00: H,
      Spine_01: mul(H.clone(), rx(p.spine * 0.25)),
      Spine1_02: mul(H.clone(), rx(p.spine * 0.6)),
      Spine2_03: chest,
      LeftShoulder_07: chest.clone(),
      RightShoulder_011: chest.clone(),
      Neck_04: headQ(0.5),
      Head_05: headQ(1),
      HeadTop_End_06: headQ(1),
      LeftArm_08: armL, LeftForeArm_09: forearmL, LeftHand_010: forearmL.clone(),
      RightArm_012: armR, RightForeArm_013: forearmR, RightHand_014: forearmR.clone(),
      LeftUpLeg_015: thighL, LeftLeg_016: shinL, LeftFoot_017: foot,
      RightUpLeg_018: thighR, RightLeg_019: shinR, RightFoot_020: foot.clone(),
    };
  }

  function apply(pose: Pose) {
    const T = totals(pose);
    for (const b of ordered) {
      const parent = b.parent as Bone | null;
      const pw = parent && (parent as Bone).isBone ? world.get(parent as Bone)! : (parent ? parent.getWorldQuaternion(tmpParent) : tmpParent.identity());
      const parentWorld = pw.clone();
      const D = T[b.name];
      if (D) {
        const desired = D.clone().multiply(restWorld.get(b)!);
        b.quaternion.copy(parentWorld.clone().invert().multiply(desired));
        world.set(b, desired);
      } else {
        world.set(b, parentWorld.multiply(b.quaternion));
      }
    }
    root.updateMatrixWorld(true);
  }

  return { apply, bones: byName, head: byName.get("HeadTop_End_06")!, hips: byName.get("Root_00")! };
}
