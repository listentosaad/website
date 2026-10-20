# سعد الرفاعي · Portfolio

Personal portfolio site, built with React, TypeScript and plain CSS from the Claude Design prototype "Saad Portfolio".

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build into dist/
```

## Where things live

- `src/data.ts`: all page text, products, roles and contact links. Edit copy here.
- `src/components/`: `Header` and the six page sections.
- `src/scene/`: the scroll-driven particle background (`forms.ts` holds the shapes, `ParticleScene.ts` the canvas loop, mouse tilt and ambient sound).
- `src/hooks/useReveal.ts`: the slide-in-once animation for section content.
- `src/index.css`: every style, with colours as CSS variables on `:root`.

`<App density motion trails />` takes the same scene options the prototype exposed as tweaks (defaults: `medium`, `normal`, `true`).
