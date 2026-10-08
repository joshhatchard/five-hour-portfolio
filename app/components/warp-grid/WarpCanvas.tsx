"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { NoToneMapping } from "three";
import { useScrollRuntime } from "./ScrollProvider";
import HeroDiver from "../hero-dive/HeroDiver";
import WarpPlane from "./WarpPlane";

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { window.dispatchEvent(new Event("hero-renderer-unavailable")); }
  render() { return this.state.failed ? null : this.props.children; }
}

// Add additional synced scene objects here; they share the same canvas and clock.
function SceneObjects() {
  const { entries, runtime, motionEnabled } = useScrollRuntime();
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    const render = () => {
      gl.autoClear = false;
      gl.clear();
      runtime.current.backgroundRender.forEach(callback => callback());
      gl.clearDepth();
      gl.render(scene, camera);
      gl.autoClear = true;
    };
    const renderers = runtime.current.render;
    renderers.add(render);
    return () => { renderers.delete(render); };
  }, [gl, scene, camera, runtime]);
  return <><HeroDiver />{motionEnabled && entries.map((entry) => <WarpPlane key={entry.id} entry={entry} />)}</>;
}

export default function WarpCanvas() {
  const [lost, setLost] = useState(false);
  if (lost) return null;
  return (
    <CanvasBoundary>
      <div className="pointer-events-none fixed inset-0 z-10" data-warp-canvas aria-hidden="true" onContextMenu={(event) => event.preventDefault()}>
        <Canvas
          style={{ pointerEvents: "none" }}
          orthographic
          camera={{ position: [0, 0, 1000], near: 0.1, far: 2000, zoom: 1 }}
          frameloop="never"
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, toneMapping: NoToneMapping }}
          fallback={null}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            gl.domElement.style.pointerEvents = "none";
            gl.domElement.addEventListener("webglcontextlost", (event) => {
              event.preventDefault();
              window.dispatchEvent(new Event("hero-renderer-unavailable"));
              setLost(true);
            }, { once: true });
          }}
        >
          <SceneObjects />
        </Canvas>
      </div>
    </CanvasBoundary>
  );
}
