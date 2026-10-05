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
touch scrolling stays native. Reduced-motion users get plain images without WebGL
or smooth scrolling. The current media type is images;
video playback/texture support is not implemented.

Run `npm run lint`, `npx tsc --noEmit`, and `npm run build -- --webpack` to check the
code. Run `npx playwright install chromium` once, then `npm run test:e2e` for the
Chromium browser checks (the runner reuses an existing server on port 3000 or
starts one). Tests cover desktop rendering, texture handoff, scrolling, preference
changes, and the mobile/reduced-motion fallbacks. Actual frame rate depends on the
device; no 60fps guarantee is assumed.
