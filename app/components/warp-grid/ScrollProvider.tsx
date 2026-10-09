"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore, type RefObject, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { HeroController } from "../hero-dive/controller";
import { warpConfig } from "./config";
import LoadingScreen from "../LoadingScreen";

const WarpCanvas = dynamic(() => import("./WarpCanvas"), { ssr: false });
const motionQuery = "(prefers-reduced-motion: no-preference)";
const subscribeMotion = (callback: () => void) => {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};

export type WarpEntry = { id: string; element: HTMLElement; src: string };
export type ScrollRuntime = {
  scroll: number;
  velocity: number;
  delta: number;
  lenis: Lenis | null;
  update: Set<() => void>;
  refresh: Set<() => void>;
  render: Set<() => void>;
  backgroundRender: Set<() => void>;
  heroes: Set<HeroController>;
};

type ScrollContextValue = {
  runtime: RefObject<ScrollRuntime>;
  entries: WarpEntry[];
  motionEnabled: boolean;
  register: (entry: WarpEntry) => () => void;
};
const ScrollContext = createContext<ScrollContextValue | null>(null);

export function useScrollRuntime() {
  const context = useContext(ScrollContext);
  if (!context) throw new Error("Warp grid requires ScrollProvider");
  return context;
}

export default function ScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const enabled = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => false);
  const [entries, setEntries] = useState<WarpEntry[]>([]);
  const runtime = useRef<ScrollRuntime>({ scroll: 0, velocity: 0, delta: 0, lenis: null, update: new Set(), refresh: new Set(), render: new Set(), backgroundRender: new Set(), heroes: new Set() });
  const register = useCallback((entry: WarpEntry) => {
    setEntries((current) => [...current.filter((item) => item.id !== entry.id), entry]);
    return () => setEntries((current) => current.filter((item) => item !== entry));
  }, []);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
    const lenis = enabled ? new Lenis({
      // Share GSAP's clock so the page, WebGL, and scroll animations stay aligned.
      autoRaf: false,
      smoothWheel: true,
      lerp: 0.075,
      wheelMultiplier: 0.95,
      syncTouch: false,
      stopInertiaOnNavigate: true,
      anchors: {
        lerp: 0,
        duration: 1.25,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
      },
    }) : null;
    runtime.current.lenis = lenis;
    const navigateToWork = (event: MouseEvent) => {
      if (!lenis || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest?.('a[href="#case-studies"]');
      const section = document.getElementById("case-studies");
      if (!link || !section) return;
      // The splash temporarily translates this section; anchors target its resting position.
      const offset = new DOMMatrixReadOnly(getComputedStyle(section).transform).m42;
      event.preventDefault();
      event.stopImmediatePropagation();
      lenis.scrollTo(section.getBoundingClientRect().top + window.scrollY - offset, {
        lerp: 0,
        duration: 1.25,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
      });
    };
    document.addEventListener("click", navigateToWork, true);
    runtime.current.scroll = window.scrollY;
    runtime.current.velocity = 0;
    let previous = lenis?.scroll ?? window.scrollY;
    let active = true;
    let refreshFrame = 0;
    const refresh = () => {
      if (!active) return;
      lenis?.resize();
      runtime.current.refresh.forEach((callback) => callback());
      ScrollTrigger.refresh();
    };
    const scheduleRefresh = () => {
      if (!active || refreshFrame) return;
      refreshFrame = requestAnimationFrame(() => {
        refreshFrame = 0;
        refresh();
      });
    };
    const tick = (time: number, deltaMs: number) => {
      lenis?.raf(time * 1000);
      const delta = Math.min(64, Math.max(1, deltaMs));
      const scroll = lenis?.scroll ?? window.scrollY;
      const raw = enabled ? (scroll - previous) * (1000 / 60) / delta : 0;
      previous = scroll;
      const target = gsap.utils.clamp(-warpConfig.maxVelocity, warpConfig.maxVelocity, raw);
      const blend = 1 - Math.pow(1 - warpConfig.lerp, delta / (1000 / 60));
      runtime.current.velocity = gsap.utils.interpolate(runtime.current.velocity, target, blend);
      if (Math.abs(runtime.current.velocity) < 0.005) runtime.current.velocity = 0;
      runtime.current.scroll = window.scrollY;
      runtime.current.delta = delta / 1000;
      runtime.current.update.forEach((callback) => callback());
      runtime.current.render.forEach((callback) => callback());
    };
    lenis?.on("scroll", ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(tick);
    window.addEventListener("resize", scheduleRefresh);
    const observer = new ResizeObserver(scheduleRefresh);
    observer.observe(document.body);
    document.fonts.ready.then(scheduleRefresh);
    refresh();
    return () => {
      active = false;
      cancelAnimationFrame(refreshFrame);
      document.removeEventListener("click", navigateToWork, true);
      observer.disconnect();
      window.removeEventListener("resize", scheduleRefresh);
      gsap.ticker.remove(tick);
      lenis?.off("scroll", ScrollTrigger.update);
      lenis?.destroy();
      runtime.current.lenis = null;
      runtime.current.velocity = 0;
    };
  }, { dependencies: [enabled, pathname, runtime], revertOnUpdate: true });

  const value = useMemo(() => ({ runtime, entries, register, motionEnabled: enabled }), [runtime, entries, register, enabled]);
  return (
    <ScrollContext.Provider value={value}>
      {children}
      <WarpCanvas />
      <LoadingScreen runtime={runtime} />
    </ScrollContext.Provider>
  );
}
