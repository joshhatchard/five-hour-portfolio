"use client";

import { useEffect, useRef } from "react";

export default function Navbar() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const header = ref.current;
      if (!header) return;
      header.querySelectorAll("a").forEach(link => {
        const rect = link.getBoundingClientRect();
        const underneath = document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        let colour = "#000000";
        for (const element of underneath) {
          if (header.contains(element)) continue;
          const style = getComputedStyle(element);
          if (Number(style.opacity) < 0.5) continue;
          const channels = style.backgroundColor.match(/[\d.]+/g)?.map(Number);
          if (!channels || channels.length < 3 || (channels[3] ?? 1) < 0.5) continue;
          const [r, g, b] = channels.slice(0, 3).map(channel => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          colour = 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#000000" : "#ffffff";
          break;
        }
        link.style.color = colour;
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <header ref={ref} className="navbar">
      <nav className="container" aria-label="Main navigation">
        <a href="#hero">Nav Bar</a>
        <div className="nav-links">
          <a href="#work">Work</a>
          <a href="#creative">Creative</a>
          <a href="#about">About</a>
          <a href="#cta">Contact</a>
        </div>
      </nav>
    </header>
  );
}
