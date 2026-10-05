This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Creative gallery and scroll warp

The six demo items live in `app/components/Creative.tsx`; add/remove entries there
and put media in `public/creative/`. The grid grows automatically. Each item has a
real accessible image and caption. Use a unique `src` for each entry.

`app/components/warp-grid/` contains the implementation:

- `WarpGrid.tsx`: responsive DOM layout, divider lines, intersection markers, and image registration.
- `ScrollProvider.tsx`: mounted once in the root layout. GSAP drives Lenis, smooths/clamps velocity, updates scene objects, then renders. There is no second animation loop or per-frame React state. ScrollTrigger stays synced with Lenis. Route changes, font loads, and resizes refresh cached measurements.
- `WarpCanvas.tsx`: dynamically loaded without SSR; one fixed, transparent, orthographic canvas. One world unit equals one CSS pixel. Add future objects inside `SceneObjects` and register their updates through the shared runtime.
- `WarpPlane.tsx`: creates a segmented plane, caches its DOM image bounds, loads the texture, crossfades from the DOM image, and disposes all GPU resources on cleanup. Failed textures and unavailable/lost WebGL keep the DOM fallback visible.
- `shaders.ts`: velocity-driven deformation in shared screen coordinates. The artwork across all columns follows one wheel profile, rather than bending separately about each card's centre. The shader also changes X/Y because a Z-only bend is invisible with an orthographic camera. Captions and dividers stay in the DOM.
- `config.ts`: tune `strength`, `lerp`, `maxVelocity`, `segments`, and `rgbShift`. Higher strength increases bending; higher lerp settles faster. RGB shift is off by default. At zero velocity the shader leaves every vertex unchanged.

The gallery is flat at rest. The pinned title remains behind the moving work.
Mobile and touch devices use the same WebGL warp with a lighter `mobileStrength`;
touch scrolling stays native. Reduced-motion users get plain gallery images without warping
or smooth scrolling; the hero still renders its 3D model at rest. The current media type is images;
video playback/texture support is not implemented.

Run `npm run lint`, `npx tsc --noEmit`, and `npm run build -- --webpack` to check the
code. Run `npx playwright install chromium` once, then `npm run test:e2e` for the
Chromium browser checks (the runner reuses an existing server on port 3000 or
starts one). Tests cover desktop rendering, texture handoff, scrolling, preference
changes, and the mobile/reduced-motion fallbacks. Actual frame rate depends on the
device; no 60fps guarantee is assumed.

## Hero dive

`app/components/hero-dive/` uses the supplied world-space bone poser and
Catmull–Rom keyframes to animate `public/models/stickman.glb`. Tune the scroll
length and desktop/mobile zoom in `controller.ts`, and joint poses in
`divePose.ts`. `useHeroDive.ts` measures the existing illustration and FULL SEND
badge, drives the parallax/lime expansion, and anchors the reversible splash to
the real white Case Studies top edge. The following Creative section retains its
existing cream background.

`HeroDiver.tsx` renders through the existing shared canvas and GSAP/Lenis clock;
there is no extra animation loop. Camera follow uses eased scroll progress so
reverse scrolling returns to exactly the same framing. The hero model is skipped
outside its visible section. Reduced motion keeps the 3D hero at rest with ordinary document flow. Only
unavailable WebGL or a failed model download restores the SVG fallback. The model
faces left toward the page centre, holds the first tuck for an extra quarter-turn,
then stays extended through the remaining rotation (720° total). There is no
run-up or axial twist. It extends both
legs for a feet-first entry while folding the forearms toward the chest. Tune
choreography in `divePose.ts`; `poser.ts` keeps the world-space bone convention
and supports the elbow fold. The figure uses a flat, unlit ink material. The scroll sequence spans 4.4 viewport
heights, and the lime FULL SEND expansion fills the screen before take-off (20%).

`tests/hero-dive.spec.ts` captures the flip stages (10–85%), checks stationary take-off and feet-first entry,
and compares every stage on reverse scrolling at
1440×900 and 390×844 in `/tmp/hero-dive`, and checks landing alignment, console
errors, overflow and reduced motion. Run with `npx playwright test tests/hero-dive.spec.ts`.

Model: [Free Pack - Stick Man (Rigged)](https://sketchfab.com/3d-models/free-pack-stick-man-rigged-29e53f85cf1641c7a602af7fc02356b2)
by PolyOne Studio, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Posed and recoloured for this site; attribution is also displayed in the footer.
