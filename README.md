# سعد الرفاعي · Portfolio

Personal portfolio site, built with React, TypeScript and plain CSS from the Claude Design prototype "Saad Portfolio".

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build into dist/
```

## Where things live

- `src/data.ts`: all page text, products, roles and contact links. Edit copy here.
- `src/components/`: `Header`, the six page sections and `Footer` (links, socials, and the particle scene beneath them).
- `src/scene/`: the scroll-driven particle background (`forms.ts` holds the shapes, `ParticleScene.ts` the canvas loop, mouse tilt and ambient sound), and `FooterScene.ts`, the footer's all-particle sunrise (sun, high ground, fog, figure). It pauses off-screen and from the footer's "إيقاف الحركة" button.
- `src/hooks/useReveal.ts`: the slide-in-once animation for section content.
- `src/index.css`: every style, with colours as CSS variables on `:root`.

`<App density motion trails />` takes the same scene options the prototype exposed as tweaks (defaults: `medium`, `normal`, `true`).
