"use client";

import { useEffect, useRef, useState } from "react";
import { PageTransitionLink } from "./PageTransition";

type NavbarProps = {
  page?: "home" | "case-study";
};

export default function Navbar({ page = "home" }: NavbarProps) {
  const isCaseStudy = page === "case-study";
  const hrefFor = (id: string) => isCaseStudy ? `/#${id}` : `#${id}`;
  const navItems = [
    { id: "case-studies", label: "Work" },
    { id: "creative", label: "Creative" },
    { id: "about", label: "About" },
    { id: "cta", label: "Contact" },
  ];
  const ref = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuExitTimer = useRef<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
    if (menuExitTimer.current) window.clearTimeout(menuExitTimer.current);
    menuExitTimer.current = window.setTimeout(() => setMenuVisible(false), 500);
  };
  const openMenu = () => {
    if (menuExitTimer.current) window.clearTimeout(menuExitTimer.current);
    setMenuVisible(true);
    requestAnimationFrame(() => setMenuOpen(true));
  };

  useEffect(() => {
    const close = closeMenu;
    const closeOnDesktop = () => {
      if (window.innerWidth > 700) close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) {
        close();
        menuButton.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    window.addEventListener("resize", closeOnDesktop);
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", closeOnDesktop);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [menuOpen]);

  useEffect(() => () => {
    if (menuExitTimer.current) window.clearTimeout(menuExitTimer.current);
  }, []);

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
      if (isCaseStudy) {
        header.dataset.surface = "case-study";
        header.querySelectorAll<HTMLElement>("a, button").forEach(link => { link.style.color = "#ffffff"; });
        return;
      }
      const navY = header.getBoundingClientRect().top + header.offsetHeight / 2;
      const gallerySurface = document.querySelector<HTMLElement>("[data-gallery-surface]");
      const cta = document.getElementById("call-to-action");
      const heroFill = document.querySelector<HTMLElement>("[data-hero-fill]");
      const galleryBounds = gallerySurface?.getBoundingClientRect();
      const ctaBounds = cta?.getBoundingClientRect();
      const galleryColour = galleryBounds && galleryBounds.top <= navY && galleryBounds.bottom >= navY
        ? foregroundFor(getComputedStyle(gallerySurface!).backgroundColor)
        : null;
      const ctaColour = cta?.querySelector<HTMLElement>("[data-cta-colour]");
      const isOnCta = Boolean(
        ctaBounds && ctaBounds.top <= navY && ctaBounds.bottom >= navY,
      );
      const isOnPrimary = Boolean(
        ctaBounds && ctaBounds.top <= navY && ctaBounds.bottom >= navY
        && ctaColour && Number(getComputedStyle(ctaColour).opacity) > 0.5
        && isPrimary(getComputedStyle(ctaColour).backgroundColor),
      ) || Boolean(heroFill && Number(getComputedStyle(heroFill).opacity) > 0.5 && (() => {
        const bounds = heroFill.getBoundingClientRect();
        return bounds.top <= navY && bounds.bottom >= navY && bounds.left <= innerWidth / 2 && bounds.right >= innerWidth / 2;
      })());
      const surface = isOnCta ? "cta" : isOnPrimary ? "primary" : "default";
      // Complete hit-testing/layout reads before changing any link styles.
      const colours = Array.from(header.querySelectorAll<HTMLElement>("a, button"), link => {
        if (isOnCta) {
          return { link, colour: "#11120d" };
        }
        if (galleryColour) {
          return { link, colour: galleryColour };
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
        return { link, colour };
      });
      if (header.dataset.surface !== surface) header.dataset.surface = surface;
      colours.forEach(({ link, colour }) => {
        if (link.dataset.navColour === colour) return;
        link.dataset.navColour = colour;
        link.style.color = colour;
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    if (isCaseStudy) return;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [isCaseStudy]);

  return (
    <header ref={ref} className="navbar" data-entrance={isCaseStudy ? undefined : "home"} data-surface={isCaseStudy ? "case-study" : undefined} data-menu-open={menuOpen} data-menu-visible={menuVisible}>
      <nav className="siteContainer" aria-label="Main navigation">
        {isCaseStudy ? (
          <PageTransitionLink className="nav-wordmark" href="/" onClick={closeMenu}>
            <span className="nav-mark" aria-hidden="true" />
            <span>Josh Hatchard</span>
          </PageTransitionLink>
        ) : (
          <a className="nav-wordmark" href="#hero" onClick={closeMenu}>
            <span className="nav-mark" aria-hidden="true" />
            <span>Josh Hatchard</span>
          </a>
        )}
        <button ref={menuButton} className="nav-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="navigation-links" onClick={menuOpen ? closeMenu : openMenu}>
          <span aria-hidden="true" /><span aria-hidden="true" />
        </button>
        <div id="navigation-links" className="nav-links" onClick={closeMenu}>
          {navItems.map(({ id, label }) => isCaseStudy ? (
            <PageTransitionLink key={id} href={hrefFor(id)} resetScroll={false}>{label}</PageTransitionLink>
          ) : <a key={id} href={hrefFor(id)}>{label}</a>)}
        </div>
      </nav>
    </header>
  );
}
