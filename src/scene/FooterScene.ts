// The footer scene, drawn entirely with particles like the hero: a lone figure
// seen from behind on a high crest, above a sea of fog, facing a huge sunrise.
//
// Everything is laid out on a 1600x640 grid that is fitted to the canvas the
// way SVG "xMidYMax slice" would (scaled to cover, anchored bottom-centre).

const TAU = Math.PI * 2;
const ART_W = 1600;
const ART_H = 640;
const NARROW = 640;

const SUN = { x: 1060, y: 410, r: 150 };
/** On narrow screens only a slice of the grid shows, so the sun slides toward the figure. */
const SUN_NARROW_X = 950;
const FIGURE_FOOT = { x: 650, y: 505 };
const RISE_DISTANCE = 340;

// Three ridges, far to near, as chains of cubic Béziers. The nearest is the
// crest the figure stands on.
const RIDGE_PATHS = [
  'M0 430 C120 418 240 440 380 436 C520 432 600 408 760 414 C900 420 980 446 1120 440 C1280 434 1420 410 1600 424',
  'M0 500 C160 486 300 512 460 504 C640 496 760 470 940 476 C1120 482 1260 512 1420 504 C1500 500 1560 494 1600 496',
  'M0 584 C140 566 300 548 440 530 C540 517 600 506 650 504 C720 502 770 516 850 540 C960 572 1100 590 1260 598 C1400 604 1520 600 1600 596',
];
// Per ridge: terrain dots, rim dots, how quickly terrain thins with depth (grid units),
// and brightness. The nearest crest is the densest and brightest, so it reads as the high ground.
const LAND = [
  { dots: 1500, rim: 800, depth: 38, bright: 0.75 },
  { dots: 2000, rim: 800, depth: 34, bright: 0.9 },
  { dots: 4800, rim: 1300, depth: 85, bright: 1.25 },
];

// Figure outline pieces, in units with the feet at (0, 0) and up being negative.
const FIGURE_SHAPE = new Path2D(
  'M-10 -46 C-11 -41 -10 -33 -9 -27 C-9.6 -18 -11 -9 -12.5 -1 L12.5 -1 C11 -9 9.6 -18 9 -27 C10 -33 11 -41 10 -46 C6 -48.5 -6 -48.5 -10 -46 Z ' +
  'M-5.8 -57.5 C-5.8 -63.4 5.8 -63.4 5.8 -57.5 C7.4 -53.6 9 -50.8 10 -47.6 L10 -43 L-10 -43 L-10 -47.6 C-9 -50.8 -7.4 -53.6 -5.8 -57.5 Z',
);
const CLOAK_SHAPE = new Path2D(
  'M-9.5 -45.5 C-16 -43.5 -22.5 -36.5 -27 -21 C-24 -22.8 -21.2 -21.8 -19 -19.4 C-17 -18.2 -14.2 -18.6 -11.4 -16 L-9.6 -27 Z',
);

const CREAM = '#EDE4DD';
const PEACH = '#F8AE93';
const CORAL = '#EE8463';
const WHITE_HOT = '#FFEBDF';
const COLORS = [WHITE_HOT, PEACH, CORAL, CREAM];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const rand = Math.random;

/** y of a ridge for every whole grid x from 0 to 1600, found by walking its Bézier chain. */
function sampleRidge(d: string): Float32Array {
  const n = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  const xs: number[] = [n[0]];
  const ys: number[] = [n[1]];
  for (let i = 2; i + 5 < n.length; i += 6) {
    const x0 = xs[xs.length - 1], y0 = ys[ys.length - 1];
    for (let s = 1; s <= 24; s++) {
      const t = s / 24, u = 1 - t;
      const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, e = t * t * t;
      xs.push(a * x0 + b * n[i] + c * n[i + 2] + e * n[i + 4]);
      ys.push(a * y0 + b * n[i + 1] + c * n[i + 3] + e * n[i + 5]);
    }
  }
  const out = new Float32Array(ART_W + 1);
  let j = 0;
  for (let x = 0; x <= ART_W; x++) {
    while (j < xs.length - 2 && xs[j + 1] < x) j++;
    const span = xs[j + 1] - xs[j] || 1;
    out[x] = ys[j] + ((ys[j + 1] - ys[j]) * (x - xs[j])) / span;
  }
  return out;
}
const RIDGES = RIDGE_PATHS.map(sampleRidge);

interface Dots {
  n: number;
  x: Float32Array;
  y: Float32Array;
  size: Float32Array;
  alpha: Float32Array;
  phase: Float32Array;
  speed: Float32Array;
  color: Uint8Array;
}

function makeDots(n: number): Dots {
  return {
    n,
    x: new Float32Array(n), y: new Float32Array(n), size: new Float32Array(n),
    alpha: new Float32Array(n), phase: new Float32Array(n), speed: new Float32Array(n),
    color: new Uint8Array(n),
  };
}

/**
 * Animates only while on screen and not paused; a paused or reduced-motion
 * visitor gets a still frame. The sunrise follows the scroll position.
 */
export class FooterScene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private land: HTMLCanvasElement = document.createElement('canvas');
  private hit: CanvasRenderingContext2D | null = document.createElement('canvas').getContext('2d');

  private w = 0;
  private h = 0;
  private dpr = 1;
  private k = 1;
  private xo = 0;
  private yo = 0;
  private sx = 0;
  private sy = 0;
  private sr = 0;
  private density = 1;
  /** Canvas-pixel y of each ridge at each canvas x. */
  private ridge: Float32Array[] = [];
  /** For each ridge, the highest of the ridges nearer than it (a dot below this is hidden). */
  private cover: Float32Array[] = [];
  private coverAll = new Float32Array(0);

  private stars = makeDots(0);
  private body = makeDots(0);
  private ux = new Float32Array(0);
  private uy = new Float32Array(0);
  private sparks = makeDots(0);
  private sparkAngle = new Float32Array(0);
  private dust = makeDots(0);
  private dustRho = new Float32Array(0);
  private fog = [makeDots(0), makeDots(0)];
  private wind = makeDots(0);
  private windLife = new Float32Array(0);
  private windSpan = new Float32Array(0);
  private figure = makeDots(0);
  private figureLocal = new Float32Array(0);
  private figureCloak = new Uint8Array(0);
  /** Canvas pixels per figure unit. */
  private figureUnit = 1;
  private lastColor = -1;

  private t = 0;
  private last = 0;
  private raf = 0;
  private rise = 1;
  private paused: boolean;
  private followScroll: boolean;
  private visible = false;
  private disposed = false;
  private ro: ResizeObserver;
  private io: IntersectionObserver;

  constructor(canvas: HTMLCanvasElement, paused: boolean, followScroll: boolean) {
    this.canvas = canvas;
    this.paused = paused;
    this.followScroll = followScroll;
    this.ctx = canvas.getContext('2d');
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.sync();
    });
    this.io.observe(canvas);
    addEventListener('scroll', this.onScroll, { passive: true });
    this.resize();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.sync();
  }

  /** Off means the sun simply sits in its finished position. */
  setFollowScroll(on: boolean) {
    this.followScroll = on;
    this.readRise();
    if (!this.raf) this.draw();
  }

  dispose() {
    this.disposed = true;
    this.sync();
    this.ro.disconnect();
    this.io.disconnect();
    removeEventListener('scroll', this.onScroll);
  }

  private sync() {
    const run = this.visible && !this.paused && !this.disposed;
    if (run && !this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.loop);
    } else if (!run && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  private onScroll = () => {
    this.readRise();
    // While the loop runs it redraws anyway; otherwise redraw so the sun still follows the page.
    if (!this.raf && this.visible) this.draw();
  };

  /** 0 when the scene just peeks in at the bottom of the screen, 1 a little before it is fully in view. */
  private readRise() {
    if (!this.followScroll) {
      this.rise = 1;
      return;
    }
    const r = this.canvas.getBoundingClientRect();
    this.rise = clamp01((innerHeight - r.top) / r.height / 0.9);
  }

  // ---------- layout ----------

  private resize() {
    const { canvas, ctx } = this;
    if (!ctx) return;
    this.w = canvas.clientWidth;
    this.h = canvas.clientHeight;
    if (this.w === 0 || this.h === 0) return;
    this.dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(this.w * this.dpr);
    canvas.height = Math.round(this.h * this.dpr);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.k = Math.max(this.w / ART_W, this.h / ART_H);
    this.xo = (this.w - ART_W * this.k) / 2;
    this.yo = this.h - ART_H * this.k;
    // Same dots per pixel at every size, so the picture keeps its look.
    this.density = Math.max(0.2, Math.min(1.6, this.k * this.k));
    const narrow = this.w < NARROW;
    this.sx = this.gx(narrow ? SUN_NARROW_X : SUN.x);
    this.sy = this.gy(SUN.y);
    this.sr = SUN.r * this.k;

    this.buildRidges();
    this.buildLand();
    this.buildSun();
    this.buildFog();
    this.buildWind();
    this.buildFigure(narrow ? 1.5 : 1.15);
    this.buildStars();
    this.readRise();
    this.draw();
  }

  private gx = (ax: number) => this.xo + ax * this.k;
  private gy = (ay: number) => this.yo + ay * this.k;

  private buildRidges() {
    const { w } = this;
    this.ridge = RIDGES.map(r => {
      const out = new Float32Array(w + 1);
      for (let px = 0; px <= w; px++) {
        const ax = Math.max(0, Math.min(ART_W, Math.round((px - this.xo) / this.k)));
        out[px] = this.gy(r[ax]);
      }
      return out;
    });
    // cover[i] = the highest of the ridges nearer than ridge i.
    this.cover = this.ridge.map((_, i) => {
      const out = new Float32Array(w + 1).fill(Infinity);
      for (let j = i + 1; j < this.ridge.length; j++) {
        for (let px = 0; px <= w; px++) out[px] = Math.min(out[px], this.ridge[j][px]);
      }
      return out;
    });
    this.coverAll = new Float32Array(w + 1);
    this.coverAll = this.cover[0].map((c, px) => Math.min(c, this.ridge[0][px]));
  }

  /** How close a canvas x is to the sun, 1 at the sun and fading to 0 far away. */
  private nearSun(x: number) {
    const d = (x - this.sx) / (this.w * 0.3);
    return Math.exp(-d * d);
  }

  private buildLand() {
    const { w, h, dpr, k } = this;
    this.land.width = Math.round(w * dpr);
    this.land.height = Math.round(h * dpr);
    const lc = this.land.getContext('2d');
    if (!lc) return;
    lc.setTransform(dpr, 0, 0, dpr, 0, 0);
    lc.clearRect(0, 0, w, h);
    lc.globalCompositeOperation = 'lighter';

    const plot = (x: number, y: number, size: number, alpha: number, color: string) => {
      lc.globalAlpha = alpha;
      lc.fillStyle = color;
      lc.fillRect(x, y, size, size);
    };
    LAND.forEach((layer, i) => {
      const ridge = this.ridge[i], cover = this.cover[i];
      // Terrain: dense along the crest, thinning with depth, like sand catching light.
      for (let n = Math.round(layer.dots * this.density); n > 0; n--) {
        const x = rand() * w;
        // A few dots hover just above the crest like blown sand; the rest settle below it.
        const y = ridge[x | 0] + Math.log(1 - rand()) * layer.depth * k * (rand() < 0.08 ? 0.25 : -1);
        if (y > h || y > cover[x | 0]) continue;
        const sun = this.nearSun(x);
        const color = rand() < 0.16 ? CORAL : sun > 0.5 && rand() < 0.5 ? PEACH : CREAM;
        plot(x, y, 1.1 + rand() * 0.9, (0.14 + rand() * 0.4) * (0.4 + 0.6 * sun) * layer.bright, color);
      }
      // Rim: a bright line of dots along the top edge, strongest facing the sun.
      for (let n = Math.round(layer.rim * this.density); n > 0; n--) {
        const x = rand() * w;
        const y = ridge[x | 0] + (rand() + rand() - 1) * 1.6 * k;
        if (y > cover[x | 0]) continue;
        const sun = this.nearSun(x);
        plot(x, y, 1.3 + rand() * 0.9, (0.16 + 0.7 * sun) * (0.5 + 0.5 * rand()) * layer.bright, sun > 0.35 && rand() < 0.6 ? PEACH : CREAM);
      }
    });
  }

  private scaled(n: number) {
    return makeDots(Math.max(1, Math.round(n * this.density)));
  }

  private buildSun() {
    // Body: a disc of dots that glows toward the middle, with a hot nucleus
    // like the hero's core and a crisp rim.
    const body = (this.body = this.scaled(9500));
    this.ux = new Float32Array(body.n);
    this.uy = new Float32Array(body.n);
    for (let i = 0; i < body.n; i++) {
      const r = i / body.n;
      const nucleus = r < 0.09;
      const rim = r > 0.9;
      const rho = nucleus ? Math.pow(rand(), 2) * 0.3 : rim ? 0.97 + rand() * 0.05 : Math.sqrt(rand());
      const a = rand() * TAU;
      this.ux[i] = Math.cos(a) * rho;
      this.uy[i] = Math.sin(a) * rho;
      const mix = rho + (rand() - 0.5) * 0.3;
      body.color[i] = nucleus ? 0 : mix < 0.4 ? 0 : mix < 0.8 ? 1 : 2;
      body.alpha[i] = nucleus
        ? 0.5 + rand() * 0.45
        : (0.16 + 0.55 * Math.pow(1 - Math.min(rho, 1), 1.1) + (rim ? 0.25 : 0)) * (0.65 + 0.35 * rand());
      body.size[i] = nucleus ? 1.4 + rand() * 1.2 : 1.1 + rand() * 1;
      body.phase[i] = rand() * TAU;
      body.speed[i] = 0.4 + rand() * 1.2;
    }
    // Sparks stream outward along fixed rays, like the hero's glowing core.
    const sparks = (this.sparks = this.scaled(1700));
    this.sparkAngle = new Float32Array(sparks.n);
    for (let i = 0; i < sparks.n; i++) {
      this.sparkAngle[i] = (Math.floor(rand() * 64) / 64) * TAU + (rand() - 0.5) * 0.02;
      sparks.phase[i] = rand();
      sparks.speed[i] = 0.05 + rand() * 0.08;
      sparks.color[i] = rand() < 0.45 ? 2 : 1;
      sparks.size[i] = 1.2 + rand() * 0.9;
    }
    // Dust drifts slowly around the sun.
    const dust = (this.dust = this.scaled(700));
    this.dustRho = new Float32Array(dust.n);
    for (let i = 0; i < dust.n; i++) {
      this.dustRho[i] = 1.15 + Math.pow(rand(), 1.4) * 1.5;
      dust.phase[i] = rand() * TAU;
      dust.speed[i] = (rand() < 0.5 ? 1 : -1) * (0.015 + rand() * 0.03) / this.dustRho[i];
      dust.alpha[i] = 0.08 + rand() * 0.2;
      dust.size[i] = 1.1 + rand() * 0.9;
      dust.color[i] = rand() < 0.4 ? 2 : 3;
    }
  }

  private buildFog() {
    const bands = [
      { cx: 800, cy: 456, rx: 760, ry: 58, ridge: 1 },
      { cx: 640, cy: 492, rx: 660, ry: 64, ridge: 2 },
    ];
    this.fog = bands.map((b, bi) => {
      const f = this.scaled(1500);
      for (let i = 0; i < f.n; i++) {
        f.x[i] = this.gx(b.cx) + (rand() + rand() - 1) * b.rx * this.k;
        f.y[i] = this.gy(b.cy) + (rand() + rand() - 1) * b.ry * this.k;
        f.alpha[i] = 0.1 + rand() * 0.24;
        f.size[i] = 1.3 + rand() * 1.4;
        f.phase[i] = rand() * TAU;
        f.speed[i] = bi;
        f.color[i] = rand() < 0.3 ? 1 : 3;
      }
      return f;
    });
  }

  private buildWind() {
    const wind = (this.wind = this.scaled(70));
    this.windLife = new Float32Array(wind.n);
    this.windSpan = new Float32Array(wind.n);
    for (let i = 0; i < wind.n; i++) this.spawnWind(i, true);
  }

  /** A puff of dust lifts off the crest and is carried away from the sun. */
  private spawnWind(i: number, scatter: boolean) {
    const wd = this.wind;
    const x = rand() * this.w;
    const span = 6 + rand() * 7;
    wd.x[i] = x;
    wd.y[i] = this.ridge[2][x | 0] - rand() * 34 * this.k;
    wd.speed[i] = -(24 + rand() * 40) * this.k;
    wd.size[i] = 1.3 + rand();
    wd.alpha[i] = 0.35 + rand() * 0.4;
    wd.color[i] = rand() < 0.4 ? 2 : 1;
    this.windSpan[i] = span;
    this.windLife[i] = scatter ? rand() * span : span;
  }

  private buildFigure(scale: number) {
    const hit = this.hit;
    this.figure = makeDots(0);
    if (!hit) return;
    // Dots per square unit, kept at a constant look in pixels.
    const unit = this.k * scale;
    const count = Math.max(140, Math.round(620 * unit * unit));
    const local: number[] = [];
    const cloak: number[] = [];
    const color: number[] = [];
    const alpha: number[] = [];
    const size: number[] = [];
    for (let tries = 0; local.length / 2 < count && tries < count * 40; tries++) {
      const lx = -28 + rand() * 41;
      const ly = -64 + rand() * 64;
      const inBody = hit.isPointInPath(FIGURE_SHAPE, lx, ly);
      const inCloak = !inBody && hit.isPointInPath(CLOAK_SHAPE, lx, ly);
      if (!inBody && !inCloak) continue;
      // The edge facing the sun (right) and the top of the head catch the light.
      // The cloak trails away from the sun, so it stays in shade.
      const lit = inBody && (!hit.isPointInPath(FIGURE_SHAPE, lx + 2, ly) || !hit.isPointInPath(FIGURE_SHAPE, lx, ly - 2));
      local.push(lx, ly);
      cloak.push(inCloak ? 1 : 0);
      color.push(lit ? (rand() < 0.45 ? 0 : 1) : rand() < 0.3 ? 1 : 3);
      alpha.push(lit ? 0.75 + rand() * 0.25 : 0.2 + rand() * 0.25);
      size.push(lit ? 1.5 + rand() * 0.8 : 1.1 + rand() * 0.6);
    }
    const n = cloak.length;
    this.figure = makeDots(n);
    this.figureLocal = Float32Array.from(local);
    this.figureCloak = Uint8Array.from(cloak);
    for (let i = 0; i < n; i++) {
      this.figure.color[i] = color[i];
      this.figure.alpha[i] = alpha[i];
      this.figure.size[i] = size[i];
      this.figure.phase[i] = rand() * TAU;
    }
    this.figureUnit = unit;
  }

  private buildStars() {
    const stars = (this.stars = this.scaled(150));
    let n = 0;
    for (let tries = 0; n < stars.n && tries < stars.n * 5; tries++) {
      const x = rand() * this.w;
      const y = this.h * 0.8 * Math.pow(rand(), 1.3);
      if (y > this.coverAll[x | 0] - 6) continue;
      if (Math.hypot(x - this.sx, y - this.sy) < this.sr * 1.3) continue;
      stars.x[n] = x;
      stars.y[n] = y;
      stars.size[n] = rand() < 0.85 ? 1.2 : 2;
      stars.alpha[n] = 0.14 + rand() * 0.4;
      stars.speed[n] = 0.5 + rand() * 1.4;
      stars.phase[n] = rand() * TAU;
      stars.color[n] = n % 9 === 0 ? 2 : 3;
      n++;
    }
    stars.n = n;
  }

  // ---------- motion ----------

  private update(dt: number) {
    const w = this.wind;
    for (let i = 0; i < w.n; i++) {
      this.windLife[i] -= dt;
      if (this.windLife[i] <= 0) {
        this.spawnWind(i, false);
        continue;
      }
      w.x[i] += (w.speed[i] + Math.sin(this.t * 0.8 + i) * 6 * this.k) * dt;
      w.y[i] -= 3 * this.k * dt;
    }
  }

  // ---------- drawing ----------

  private draw() {
    const { ctx, w, h } = this;
    if (!ctx || w === 0) return;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    this.lastColor = -1;
    this.drawStars(ctx);
    this.drawSun(ctx);
    this.drawFog(ctx);
    this.drawWind(ctx);
    ctx.globalAlpha = 1;
    ctx.drawImage(this.land, 0, 0, w, h);
    this.lastColor = -1;
    this.drawFigure(ctx);
    ctx.globalAlpha = 1;
  }

  /** Plots one dot. Setting a fill style is slow, so it only changes when the colour does. */
  private put(ctx: CanvasRenderingContext2D, color: number, x: number, y: number, size: number, alpha: number) {
    ctx.globalAlpha = alpha;
    if (color !== this.lastColor) {
      ctx.fillStyle = COLORS[color];
      this.lastColor = color;
    }
    ctx.fillRect(x, y, size, size);
  }

  private drawStars(ctx: CanvasRenderingContext2D) {
    const s = this.stars, t = this.t;
    for (let i = 0; i < s.n; i++) {
      this.put(ctx, s.color[i], s.x[i], s.y[i], s.size[i], s.alpha[i] * (0.65 + 0.35 * Math.sin(t * s.speed[i] + s.phase[i])));
    }
  }

  private drawSun(ctx: CanvasRenderingContext2D) {
    const { sx, sr, t, w, coverAll } = this;
    const sy = this.sy + (1 - this.rise) * RISE_DISTANCE * this.k;
    const fade = clamp01(this.rise * 1.5);
    if (fade <= 0) return;
    const breathe = 1 + 0.012 * Math.sin(t * 0.6);

    const b = this.body;
    for (let i = 0; i < b.n; i++) {
      const x = sx + this.ux[i] * sr * breathe;
      const y = sy + this.uy[i] * sr * breathe;
      if (x < 0 || x > w || y > coverAll[x | 0]) continue;
      this.put(ctx, b.color[i], x, y, b.size[i], b.alpha[i] * fade * (0.7 + 0.3 * Math.sin(t * b.speed[i] + b.phase[i])));
    }
    const s = this.sparks;
    for (let i = 0; i < s.n; i++) {
      const f = (s.phase[i] + t * s.speed[i]) % 1;
      const d = sr * (1.04 + f * 1.9);
      const x = sx + Math.cos(this.sparkAngle[i]) * d;
      const y = sy + Math.sin(this.sparkAngle[i]) * d;
      if (x < 0 || x > w || y < 0 || y > coverAll[x | 0]) continue;
      this.put(ctx, s.color[i], x, y, s.size[i], 0.85 * Math.pow(1 - f, 1.3) * fade);
    }
    const d = this.dust;
    for (let i = 0; i < d.n; i++) {
      const a = d.phase[i] + t * d.speed[i];
      const x = sx + Math.cos(a) * this.dustRho[i] * sr;
      const y = sy + Math.sin(a) * this.dustRho[i] * sr;
      if (x < 0 || x > w || y < 0 || y > coverAll[x | 0]) continue;
      this.put(ctx, d.color[i], x, y, d.size[i], d.alpha[i] * fade);
    }
  }

  private drawFog(ctx: CanvasRenderingContext2D) {
    const { t, w, k } = this;
    // The two bands drift in opposite directions.
    const drift = [Math.sin(t * 0.13) * 90 * k, -Math.sin(t * 0.1) * 70 * k];
    this.fog.forEach((f, bi) => {
      const cover = this.cover[bi + 1];
      for (let i = 0; i < f.n; i++) {
        const x = f.x[i] + drift[bi];
        if (x < 0 || x > w) continue;
        const y = f.y[i];
        if (y > cover[x | 0]) continue;
        this.put(ctx, f.color[i], x, y, f.size[i], f.alpha[i] * (0.7 + 0.3 * Math.sin(t * 0.5 + f.phase[i])));
      }
    });
  }

  private drawWind(ctx: CanvasRenderingContext2D) {
    const wd = this.wind;
    for (let i = 0; i < wd.n; i++) {
      if (wd.x[i] < 0 || wd.x[i] > this.w) continue;
      const age = 1 - this.windLife[i] / this.windSpan[i];
      this.put(ctx, wd.color[i], wd.x[i], wd.y[i], wd.size[i], wd.alpha[i] * Math.sin(clamp01(age) * Math.PI));
    }
  }

  private drawFigure(ctx: CanvasRenderingContext2D) {
    const f = this.figure;
    if (f.n === 0) return;
    const unit = this.figureUnit;
    const fx = this.gx(FIGURE_FOOT.x), fy = this.gy(FIGURE_FOOT.y);
    const t = this.t;
    for (let i = 0; i < f.n; i++) {
      const lx = this.figureLocal[i * 2], ly = this.figureLocal[i * 2 + 1];
      // The cloak ripples in the wind, more toward its loose tip.
      const sway = this.figureCloak[i] ? Math.sin(t * 1.1 + ly * 0.12) * (-lx - 9) * 0.1 : 0;
      this.put(ctx, f.color[i], fx + (lx + sway) * unit, fy + ly * unit, f.size[i], f.alpha[i] * (0.85 + 0.15 * Math.sin(t * 1.3 + f.phase[i])));
    }
  }
}
