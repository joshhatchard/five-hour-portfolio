import {
  BufferAttribute,
  BufferGeometry,
  LineBasicMaterial,
  LineSegments,
  OrthographicCamera,
  Scene,
  type WebGLRenderer,
} from "three";
import { smooth } from "./controller";

const MARKS = 10;
const SEGMENTS = 2;
const VERTICES = MARKS * SEGMENTS * 2;

const marks = Array.from({ length: MARKS }, (_, index) => ({
  angle: (index / MARKS) * Math.PI * 2 + (index % 2) * 0.18,
  radius: 0.15 + (index % 3) * 0.034,
  length: 0.06 + (index % 4) * 0.014,
  phase: index * 1.63,
}));

function stroke(colour: number) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(VERTICES * 3), 3));
  const material = new LineBasicMaterial({ color: colour, transparent: true, opacity: 0 });
  return { geometry, material, line: new LineSegments(geometry, material) };
}

// A screen-space overlay keeps the motion marks close to the figure instead of
// inheriting its orbiting 3D camera. Two imperfect strokes sell pencil ink.
export class VelocityEffects {
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  private readonly ink = stroke(0x11120d);
  private readonly paper = stroke(0xfafaf5);

  constructor() {
    this.scene.add(this.ink.line, this.paper.line);
    this.camera.position.z = 2;
  }

  render(renderer: WebGLRenderer, width: number, height: number, x: number, y: number, progress: number) {
    const strength = smooth(0.2, 0.31, progress) * (1 - smooth(0.7, 0.84, progress));
    if (strength < 0.002) return false;

    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();

    const size = Math.min(width, height);
    const inkPositions = this.ink.geometry.getAttribute("position") as BufferAttribute;
    const paperPositions = this.paper.geometry.getAttribute("position") as BufferAttribute;
    marks.forEach((mark, markIndex) => {
      const angle = mark.angle + Math.sin(progress * 9 + mark.phase) * 0.05;
      const outwardX = Math.cos(angle);
      const outwardY = Math.sin(angle);
      const tangentX = -outwardY;
      const tangentY = outwardX;
      const start = mark.radius * size;
      const length = mark.length * size * strength;
      const baseX = x + outwardX * start;
      const baseY = y + outwardY * start;
      const wobble = Math.sin(progress * 11 + mark.phase) * size * 0.004;
      for (let segment = 0; segment < SEGMENTS; segment++) {
        const a = segment / SEGMENTS;
        const b = (segment + 0.68) / SEGMENTS;
        const offset = (markIndex * SEGMENTS + segment) * 2;
        const x0 = baseX + outwardX * length * a + tangentX * wobble * (1 - a);
        const y0 = baseY + outwardY * length * a + tangentY * wobble * (1 - a);
        const x1 = baseX + outwardX * length * b + tangentX * wobble * (1 - b);
        const y1 = baseY + outwardY * length * b + tangentY * wobble * (1 - b);
        inkPositions.setXYZ(offset, x0, y0, 0);
        inkPositions.setXYZ(offset + 1, x1, y1, 0);
        paperPositions.setXYZ(offset, x0 + 2, y0 - 2, 0);
        paperPositions.setXYZ(offset + 1, x1 + 2, y1 - 2, 0);
      }
    });
    inkPositions.needsUpdate = true;
    paperPositions.needsUpdate = true;
    this.ink.material.opacity = strength * 0.8;
    this.paper.material.opacity = strength * 0.66;
    renderer.render(this.scene, this.camera);
    renderer.clearDepth();
    return true;
  }

  dispose() {
    this.ink.geometry.dispose();
    this.ink.material.dispose();
    this.paper.geometry.dispose();
    this.paper.material.dispose();
    this.scene.clear();
  }
}
