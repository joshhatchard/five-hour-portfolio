"use client";

import { useEffect, useRef, useState } from "react";

export default function Navbar() {
  const ref = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) {
        close();
        menuButton.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    window.addEventListener("resize", close);
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [menuOpen]);

  useEffect(() => {
    let frame = 0;
    const foregroundFor = (background: string) => {
      const channels = background.match(/[\d.]+/g)?.map(Number);
      if (!channels || channels.length < 3 || (channels[3] ?? 1) < 0.5) return null;
      const [r, g, b] = channels.slice(0, 3).map(channel => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#11120d" : "#ffffff";
    };
    const isPrimary = (background: string) => {
      const channels = background.match(/[\d.]+/g)?.map(Number);
      return Boolean(channels && Math.abs(channels[0] - 196) < 2 && Math.abs(channels[1] - 241) < 2 && Math.abs(channels[2] - 58) < 2);
    };
    const update = () => {
      frame = 0;
      const header = ref.current;
      if (!header) return;
      const navY = header.getBoundingClientRect().top + header.offsetHeight / 2;
      const gallerySurface = document.querySelector<HTMLElement>("[data-gallery-surface]");
      const quote = document.getElementById("quote");
      const heroFill = document.querySelector<HTMLElement>("[data-hero-fill]");
      const galleryBounds = gallerySurface?.getBoundingClientRect();
      const quoteBounds = quote?.getBoundingClientRect();
      const galleryColour = galleryBounds && galleryBounds.top <= navY && galleryBounds.bottom >= navY
        ? foregroundFor(getComputedStyle(gallerySurface!).backgroundColor)
        : null;
      const quoteColour = quote?.querySelector<HTMLElement>("[data-quote-colour]");
      const isOnPrimary = Boolean(
        quoteBounds && quoteBounds.top <= navY && quoteBounds.bottom >= navY
        && quoteColour && Number(getComputedStyle(quoteColour).opacity) > 0.5
        && isPrimary(getComputedStyle(quoteColour).backgroundColor),
      ) || Boolean(heroFill && Number(getComputedStyle(heroFill).opacity) > 0.5 && (() => {
        const bounds = heroFill.getBoundingClientRect();
        return bounds.top <= navY && bounds.bottom >= navY && bounds.left <= innerWidth / 2 && bounds.right >= innerWidth / 2;
      })());
      header.dataset.surface = isOnPrimary ? "primary" : "default";
      header.querySelectorAll<HTMLElement>("a, button").forEach(link => {
        if (galleryColour) {
          link.style.color = galleryColour;
          return;
        }
        const rect = link.getBoundingClientRect();
        const underneath = document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        let colour = "#11120d";
        for (const element of underneath) {
          if (header.contains(element)) continue;
          const style = getComputedStyle(element);
          if (Number(style.opacity) < 0.5) continue;
          const nextColour = foregroundFor(style.backgroundColor);
          if (!nextColour) continue;
          colour = nextColour;
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
    <header ref={ref} className="navbar" data-menu-open={menuOpen}>
      <nav className="siteContainer" aria-label="Main navigation">
        <a className="nav-wordmark" href="#hero" onClick={() => setMenuOpen(false)}>
          <span className="nav-mark" aria-hidden="true" />
          <span>Josh Hatchard</span>
        </a>
        <button ref={menuButton} className="nav-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="navigation-links" onClick={() => setMenuOpen(!menuOpen)}>
          <span aria-hidden="true" /><span aria-hidden="true" />
        </button>
        <div id="navigation-links" className="nav-links" onClick={() => setMenuOpen(false)}>
          <a href="#case-studies">Work</a>
          <a href="#creative">Creative</a>
          <a href="#about">About</a>
          <a href="#cta">Contact</a>
        </div>
      </nav>
    </header>
  );
}
