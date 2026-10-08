"use client";

import type { RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useScrollRuntime } from "../warp-grid/ScrollProvider";
import {
  boardAngle,
  clamp,
  diveConfig,
  mix,
  smooth,
  type HeroController,
} from "./controller";

export function useHeroDive(ref: RefObject<HTMLElement | null>) {
  const { runtime } = useScrollRuntime();

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger, useGSAP);
      const hero = ref.current;
      const water = document.querySelector<HTMLElement>("#case-studies");
      if (!hero || !water) return;

      const stage = hero.querySelector<HTMLElement>("[data-hero-stage]")!;
      const svg = hero.querySelector<SVGSVGElement>("[data-hero-world]")!;
      const highlight = hero.querySelector<HTMLElement>("[data-hero-send]")!;
      const fill = hero.querySelector<HTMLElement>("[data-hero-fill]")!;
      const fullSendParticles = hero.querySelector<HTMLElement>("[data-hero-particles]")!;
      const dotField = hero.querySelector<HTMLElement>("[data-hero-dot-field]")!;
      const layers = Array.from(
        svg.querySelectorAll<SVGElement>("[data-parallax]"),
      );
      const copy = Array.from(
        hero.querySelectorAll<HTMLElement>("[data-hero-copy]"),
      );
      const splash = water.querySelector<SVGSVGElement>("[data-hero-splash]")!;
      const crownBack = splash.querySelector<SVGGElement>("[data-splash-crown-back]")!;
      const crownFront = splash.querySelector<SVGGElement>("[data-splash-crown-front]")!;
      const starbursts = Array.from(splash.querySelectorAll<SVGGElement>("[data-splash-starburst]"));
      const particles = Array.from(splash.querySelectorAll<SVGGElement>("[data-splash-particle]"));
      const media = gsap.matchMedia();
      const setResponsiveLayout = () => {
        const width = document.documentElement.clientWidth;
        const height = window.innerHeight;
        const navHeight = document.querySelector(".navbar")?.getBoundingClientRect().height ?? 72;
        const edgeSpace = width <= 700 ? 8 : 16;
        hero.style.setProperty("--hero-nav-space", `${navHeight + edgeSpace}px`);
        // Portrait compositions have room for a separate scene below the copy.
        // Landscape keeps the two elements beside one another, even on phones.
        const stacked = height / width >= 1.05;
        hero.dataset.heroLayout = stacked ? "stacked" : "split";
        const copyBlock = highlight.closest("h1")!.parentElement!;
        const title = highlight.closest("h1")!;
        const measuredCopy = stacked ? title : copyBlock;
        const savedTransform = highlight.style.transform;
        highlight.style.transform = "none";
        const availableHeight = Math.max(120, height - navHeight - edgeSpace * 2);
        const copyBudget = stacked ? availableHeight * 0.56 : availableHeight * 0.9;
        // In the split layout, size the heading to its text column as well as
        // the available height, leaving room for description and actions.
        let size = stacked
          ? Math.min(width * 0.105, 64)
          : Math.min(copyBlock.clientWidth * 0.115, availableHeight * 0.13, 100);
        size = Math.max(28, size);
        hero.style.setProperty("--hero-title-size", `${size}px`);
        // Fit actual font metrics after wrapping; never scale the whole page.
        while (size > 28 && (measuredCopy.offsetHeight > copyBudget || title.scrollWidth > measuredCopy.clientWidth)) {
          size = Math.max(28, size - 1);
          hero.style.setProperty("--hero-title-size", `${size}px`);
        }
        highlight.style.transform = savedTransform;
      };
      setResponsiveLayout();

      media.add(
        {
          animated: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const animated = Boolean(context.conditions?.animated);
          if (animated) hero.dataset.dive = "true";

          const scrollState = runtime.current;
          const scrollProgress = { value: 0 };
          const controller: HeroController = {
            element: hero,
            progress: 0,
            visible: true,
            width: 0,
            height: 0,
            stageTop: 0,
            waterline: 0,
            startX: 0,
            startFootY: 0,
            figureHeight: 0,
            ink: "",
            cameraX: 0,
            cameraY: 0,
            zoom: 1,
            diverX: 0,
            diverY: 0,
            renderDom: () => {},
          };

          let sceneX = 0,
            sceneY = 0,
            sceneScale = 1;
          let badge = { left: 0, top: 0, width: 0, height: 0 };
          let labelInset = 16;
          let labelTop = 88;

          const measure = () => {
            // Layout must settle before the SVG anchors and model are measured,
            // regardless of which resize/refresh listener ran first.
            setResponsiveLayout();
            controller.width = document.documentElement.clientWidth;
            controller.height = window.innerHeight;
            if (animated) {
              hero.style.setProperty(
                "--hero-scroll-height",
                `${controller.height * diveConfig.stageHeights}px`,
              );
            }
            const rect = svg.getBoundingClientRect();
            const stageRect = stage.getBoundingClientRect();
            sceneScale = Math.min(rect.width / 600, rect.height / svg.viewBox.baseVal.height);
            sceneX = rect.left - stageRect.left + (rect.width - 600 * sceneScale) / 2;
            sceneY =
              rect.top - stageRect.top + (rect.height - svg.viewBox.baseVal.height * sceneScale) / 2;
            controller.startX = sceneX + 350 * sceneScale;
            controller.startFootY = sceneY + 375 * sceneScale;
            controller.figureHeight = 208 * sceneScale;

            const saved = highlight.style.transform;
            highlight.style.transform = "none";
            const box = highlight.getBoundingClientRect();
            badge = {
              left: box.left - stageRect.left,
              top: box.top - stageRect.top,
              width: box.width,
              height: box.height,
            };
            highlight.style.transform = saved;

            const tokens = getComputedStyle(hero);
            labelInset = (controller.width - hero.querySelector<HTMLElement>("h1")!.parentElement!.parentElement!.clientWidth) / 2;
            labelTop = (document.querySelector(".navbar")?.getBoundingClientRect().height ?? 72) + (controller.width <= 700 ? 8 : 16);
            controller.ink = tokens.color;
            water.style.setProperty("--hero-ink", controller.ink);
            water.style.setProperty(
              "--hero-lime",
              tokens.getPropertyValue("--hero-lime"),
            );
          };

          controller.renderDom = () => {
            if (!animated) return;

            const p = controller.progress;

            hero.dataset.diveProgress = p.toFixed(4);
            const fade = 1 - smooth(0.02, 0.12, p);

            copy.forEach((element) => {
              element.style.opacity = String(fade);
              element.style.transform = `translateY(${-(1 - fade) * controller.height * 0.08}px)`;
              element.style.visibility = fade < 0.001 ? "hidden" : "visible";
            });

            layers.forEach((layer) => {
              const factor = Number(layer.dataset.parallax);
              const board = factor === 1;
              const fliesAway = layer.hasAttribute("data-fly-away");
              const fall = smooth(0.3, 0.5, p); // the board stays put until the diver is well clear of it
              const zoom = mix(1, controller.zoom, factor);
              const dx =
                -controller.cameraX * factor * zoom -
                (board ? fall * controller.width * 0.16 : 0);
              const dy =
                controller.cameraY * factor * zoom +
                (board
                  ? fall * controller.height * 0.85
                  : fliesAway
                    ? -fall * controller.height * 1.2
                    : -(1 - fade) * controller.height * factor * 0.3);
              const tx =
                ((controller.width / 2 - sceneX) * (1 - zoom) + dx) /
                sceneScale;
              const ty =
                ((controller.height / 2 - sceneY) * (1 - zoom) + dy) /
                sceneScale;

              layer.setAttribute(
                "transform",
                `matrix(${zoom} 0 0 ${zoom} ${tx} ${ty})${board ? ` rotate(${fall * -15} 350 375) rotate(${boardAngle(p)} 0 375)` : ""}`,
              );
              layer.style.opacity = String(
                fliesAway ? fade : board ? 1 - smooth(0.32, 0.5, p) : 1 - smooth(0.3, 0.55, p),
              );
            });

            const expand = smooth(0.04, 0.2, p);
            fill.style.left = `${mix(badge.left, 0, expand)}px`;
            fill.style.top = `${mix(badge.top, 0, expand)}px`;
            fill.style.width = `${mix(badge.width, controller.width, expand)}px`;
            fill.style.height = `${mix(badge.height, controller.height, expand)}px`;
            fill.style.opacity = p > 0.04 ? "1" : "0";
            fill.style.transformOrigin = "left top";
            fill.style.transform = "none";
            // Keep the field out of the small label expansion, then reveal it
            // once the lime has become the full stage background.
            fullSendParticles.style.opacity = String(smooth(0.2, 0.26, p));
            dotField.style.opacity = String(1 - smooth(0.02, 0.1, p));

            highlight.style.backgroundColor = p > 0.04 ? "transparent" : "";
            // When the next section reaches the waterline, release the label
            // upward with the scroll instead of dissolving it in place.
            const labelExit = smooth(0.72, 0.92, p);
            highlight.style.opacity = "1";

            // Expand into a centred, full-width title below the navigation.
            const labelMove = smooth(diveConfig.launch, 0.3, p);
            const targetWidth = controller.width - labelInset * 2;
            const labelScale = mix(1, targetWidth / Math.max(1, badge.width), labelMove);
            highlight.style.transform = `translate(${(labelInset - badge.left) * labelMove}px, ${(labelTop - badge.top) * labelMove - controller.height * 1.15 * labelExit}px) scale(${labelScale})`;

            const t = clamp((p - diveConfig.impact) / (1 - diveConfig.impact));
            splash.style.opacity = p > diveConfig.impact && p < 1 ? "1" : "0";
            const crownPop = smooth(0, 0.07, t);
            const accentPop = smooth(0.04, 0.16, t);
            const arrive = smooth(0.04, 0.18, t);
            const burst = Math.sin(t * Math.PI);
            crownBack.setAttribute("transform", `scale(${crownPop})`);
            crownFront.setAttribute("transform", `scale(${crownPop})`);
            starbursts.forEach((starburst, index) => {
              const direction = index ? -1 : 1;
              starburst.setAttribute("transform", `translate(${direction * 48 * (1 - arrive)} ${-42 * burst}) scale(${accentPop})`);
            });
            particles.forEach((particle, index) => {
              const direction = index ? -1 : 1;
              particle.setAttribute("transform", `translate(${direction * (62 * (1 - arrive) + 38 * burst)} ${-64 * burst}) scale(${accentPop})`);
            });
          };

          const update = () => {
            if (scrollProgress.value > 0 && hero.dataset.heroIntro === "true" && hero.dataset.heroEntranceComplete !== "true" && hero.dataset.heroIntroSkipped !== "true") {
              hero.dataset.heroIntroSkipped = "true";
              hero.dataset.heroEntered = "true";
              document.querySelector('[data-warp-canvas]')?.setAttribute('data-hero-intro-skipped', 'true');
              // Measure final resting positions, never the entrance transforms.
              measure();
            }
            if (animated) {
              // The splash completes inside the final stretch of the dive;
              // there is no held landing interval before the next section.
              controller.progress = scrollProgress.value;
              water.style.transform = "";
            }
            const rect = hero.getBoundingClientRect();
            controller.stageTop = stage.getBoundingClientRect().top;
            controller.waterline = water.getBoundingClientRect().top;
            controller.visible =
              rect.top < controller.height &&
              controller.waterline > -controller.height * 0.1;
            if (controller.visible) controller.renderDom();
          };

          measure();
          scrollState.heroes.add(controller);
          scrollState.update.add(update);
          scrollState.refresh.add(measure);

          const tween = animated
            ? gsap.to(scrollProgress, {
                value: 1,
                onUpdate: update,
                ease: "none",
                scrollTrigger: {
                  id: "hero-dive",
                  trigger: hero,
                  start: "top top",
                  end: () =>
                    `+=${controller.height * diveConfig.stageHeights}`,
                  scrub: true,
                  invalidateOnRefresh: true,
                  onRefresh: measure,
                },
              })
            : null;

          const refresh = () => {
            measure();
            ScrollTrigger.refresh();
          };
          window.addEventListener("resize", refresh);
          const sceneObserver = new ResizeObserver(() => {
            measure();
            update();
          });
          sceneObserver.observe(svg);

          let alive = true;
          document.fonts.ready.then(() => {
            if (alive) { setResponsiveLayout(); refresh(); }
          });
          refresh();
          update();

          return () => {
            alive = false;
            tween?.kill();
            water.style.removeProperty("transform");
            window.removeEventListener("resize", refresh);
            sceneObserver.disconnect();
            scrollState.heroes.delete(controller);
            scrollState.update.delete(update);
            scrollState.refresh.delete(measure);
            delete hero.dataset.dive;
            hero.style.removeProperty("--hero-scroll-height");
            copy.forEach((element) => {
              element.style.removeProperty("opacity");
              element.style.removeProperty("transform");
              element.style.removeProperty("visibility");
            });
            layers.forEach((layer) => {
              layer.removeAttribute("transform");
              layer.style.removeProperty("opacity");
            });
            highlight.style.removeProperty("transform");
            highlight.style.removeProperty("background-color");
            highlight.style.removeProperty("opacity");
            fill.style.opacity = "0";
            fullSendParticles.style.removeProperty("opacity");
            dotField.style.removeProperty("opacity");
            splash.style.opacity = "0";
          };
        },
      );

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.fromTo(
          stage,
          { backgroundColor: "#ffffff" },
          {
            backgroundColor:
              getComputedStyle(hero).getPropertyValue("--hero-lime"),
            duration: 0.5,
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      const fallback = () => media.revert();
      window.addEventListener("hero-renderer-unavailable", fallback);
      return () => {
        window.removeEventListener("hero-renderer-unavailable", fallback);
        delete hero.dataset.heroLayout;
        media.revert();
      };
    },
    { scope: ref },
  );
}
