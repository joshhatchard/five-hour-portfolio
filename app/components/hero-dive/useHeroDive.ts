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
      const layers = Array.from(
        svg.querySelectorAll<SVGElement>("[data-parallax]"),
      );
      const copy = Array.from(
        hero.querySelectorAll<HTMLElement>("[data-hero-copy]"),
      );
      const splash = water.querySelector<SVGSVGElement>("[data-hero-splash]")!;
      const drops = Array.from(splash.querySelectorAll("[data-splash-drop]"));
      const rings = Array.from(splash.querySelectorAll("[data-splash-ring]"));
      const bump = splash.querySelector("[data-splash-bump]")!;
      const media = gsap.matchMedia();

      media.add(
        {
          animated: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const animated = Boolean(context.conditions?.animated);
          if (animated) hero.dataset.dive = "true";

          const scrollState = runtime.current;
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

          const measure = () => {
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
            sceneScale = Math.min(rect.width / 600, rect.height / 480);
            sceneX = rect.left + (rect.width - 600 * sceneScale) / 2;
            sceneY =
              rect.top - stageRect.top + (rect.height - 480 * sceneScale) / 2;
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
              const fall = smooth(0.3, 0.5, p); // the board stays put until the diver is well clear of it
              const zoom = mix(1, controller.zoom, factor);
              const dx =
                -controller.cameraX * factor * zoom -
                (board ? fall * controller.width * 0.16 : 0);
              const dy =
                controller.cameraY * factor * zoom +
                (board
                  ? fall * controller.height * 0.85
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
                board ? 1 - smooth(0.32, 0.5, p) : 1 - smooth(0.3, 0.55, p),
              );
            });

            const expand = smooth(0.04, 0.2, p);
            fill.style.left = `${mix(badge.left, 0, expand)}px`;
            fill.style.top = `${mix(badge.top, 0, expand)}px`;
            fill.style.width = `${mix(badge.width, controller.width, expand)}px`;
            fill.style.height = `${mix(badge.height, controller.height, expand)}px`;
            fill.style.opacity = p > 0.04 ? "1" : "0";
            fill.style.transformOrigin = "left top";
            fill.style.transform = `rotate(${-3 * (1 - expand)}deg)`;

            highlight.style.backgroundColor = p > 0.04 ? "transparent" : "";
            highlight.style.opacity = String(1 - smooth(0.9, 0.97, p));

            const textScale = Math.min(
              (controller.width * 0.8) / badge.width,
              (controller.height * 0.17) / badge.height,
            );
            const targetX = (controller.width - badge.width * textScale) / 2;
            const targetY =
              controller.height * 0.07 - Math.min(0, controller.stageTop);
            highlight.style.transform = `translate(${(targetX - badge.left) * expand}px, ${(targetY - badge.top) * expand}px) scale(${mix(1, textScale, expand)}) rotate(${-3 * (1 - expand)}deg)`;

            const t = clamp((p - 0.835) / 0.165);
            splash.style.opacity = p > 0.835 && p < 1 ? "1" : "0";

            drops.forEach((drop, index) => {
              const seed = ((index * 73 + 19) % 101) / 100;
              const side = index % 2 ? -1 : 1;
              const x = side * (55 + seed * 175) * t;
              const y = -(80 + seed * 140) * 4 * t * (1 - t);
              drop.setAttribute("cx", String(x));
              drop.setAttribute("cy", String(y));
              drop.setAttribute(
                "r",
                String((3 + seed * 4) * Math.sin(Math.PI * t)),
              );
            });

            rings.forEach((ring, index) => {
              const phase = clamp((t - index * 0.12) / (1 - index * 0.12));
              ring.setAttribute("rx", String(20 + phase * 180));
              ring.setAttribute("ry", String(2 + phase * 15));
              ring.setAttribute(
                "opacity",
                String(phase > 0 ? (1 - phase) * 0.7 : 0),
              );
            });

            bump.setAttribute(
              "d",
              `M-85 0 Q0 ${-Math.sin(t * Math.PI) * 45} 85 0`,
            );
            bump.setAttribute("opacity", String(1 - t));
          };

          const update = () => {
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
            ? gsap.to(controller, {
                progress: 1,
                ease: "none",
                scrollTrigger: {
                  id: "hero-dive",
                  trigger: hero,
                  start: "top top",
                  end: () =>
                    `+=${controller.height * (diveConfig.stageHeights - diveConfig.endWaterline)}`,
                  scrub: true,
                  invalidateOnRefresh: true,
                  onRefresh: measure,
                },
              })
            : null;

          const refresh = () => {
            measure();
            tween?.scrollTrigger?.refresh();
          };
          window.addEventListener("resize", refresh);

          let alive = true;
          document.fonts.ready.then(() => {
            if (alive) refresh();
          });
          refresh();
          update();

          return () => {
            alive = false;
            window.removeEventListener("resize", refresh);
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
            splash.style.opacity = "0";
          };
        },
      );

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.fromTo(
          stage,
          { backgroundColor: "#faf9f3" },
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
        media.revert();
      };
    },
    { scope: ref },
  );
}
