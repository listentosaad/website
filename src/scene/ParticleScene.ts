import { form, type Vec3 } from './forms';

export type Density = 'low' | 'medium' | 'high';
export type Motion = 'calm' | 'normal' | 'intense';

export interface SceneOptions {
  density: Density;
  motion: Motion;
  trails: boolean;
  onActiveChange: (index: number) => void;
}

interface Audio {
  ctx: AudioContext;
  filter: BiquadFilterNode;
  o2: OscillatorNode;
}

// Which particle form each page section shows, and how far the shape is
// pushed left/right of center (fraction of viewport width) on desktop.
const FORMS = [0, 2, 3, 6, 4, 0];
const OFFSETS = [-0.16, -0.2, 0.2, 0.2, -0.2, 0.18];
const COUNTS: Record<Density, number> = { low: 1600, medium: 3000, high: 5000 };
const SPEEDS: Record<Motion, number> = { calm: 0.5, normal: 1, intense: 1.8 };

/**
 * Scroll-driven particle background. Reads `[data-scene]` sections to know
 * where the reader is, morphs between shapes, tilts the camera with the mouse,
 * and drives an optional ambient drone.
 */
export class ParticleScene {
  private canvas: HTMLCanvasElement;
  private opts: SceneOptions;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private N = 0;
  private r = new Float32Array(0);
  private sceneF = 0;
  private target = 0;
  private active = 0;
  private mx = 0;
  private my = 0;
  private tmx = 0;
  private tmy = 0;
  private t = 0;
  private vel = 0;
  private lastY = 0;
  private raf = 0;
  private reduced: boolean;
  private audio: Audio | null = null;
  private timers: number[] = [];
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, opts: SceneOptions) {
    this.canvas = canvas;
    this.opts = opts;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.lastY = window.scrollY;
    this.seed();

    addEventListener('resize', this.onResize);
    addEventListener('mousemove', this.onMove);
    addEventListener('scroll', this.onScroll, { passive: true });
    this.resize();
    this.readScroll();
    this.sceneF = this.target;

    // Layout can shift after first paint (fonts, images), so re-read scroll.
    const resync = () => { if (!this.disposed) this.readScroll(); };
    requestAnimationFrame(resync);
    this.timers.push(window.setTimeout(resync, 300));
    document.fonts?.ready.then(resync);

    let prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      this.frame(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  setOptions(next: Partial<SceneOptions>) {
    const densityChanged = next.density !== undefined && next.density !== this.opts.density;
    this.opts = { ...this.opts, ...next };
    if (densityChanged) this.seed();
  }

  get soundOn() {
    return this.audio !== null;
  }

  toggleSound(): boolean {
    if (this.audio) {
      this.audio.ctx.close();
      this.audio = null;
      return false;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 200; filter.Q.value = 6;
    const g = ctx.createGain();
    g.gain.value = 0; g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.5);
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 82.5;
    o1.connect(filter); o2.connect(filter); filter.connect(g); g.connect(ctx.destination);
    o1.start(); o2.start();
    this.audio = { ctx, filter, o2 };
    return true;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.timers.forEach(clearTimeout);
    removeEventListener('resize', this.onResize);
    removeEventListener('mousemove', this.onMove);
    removeEventListener('scroll', this.onScroll);
    this.audio?.ctx.close();
    this.audio = null;
  }

  private onResize = () => this.resize();

  private onMove = (e: MouseEvent) => {
    this.tmx = e.clientX / innerWidth * 2 - 1;
    this.tmy = e.clientY / innerHeight * 2 - 1;
  };

  private onScroll = () => this.readScroll();

  private seed() {
    const N = COUNTS[this.opts.density] ?? 3000;
    this.N = N;
    this.r = new Float32Array(N * 4);
    for (let i = 0; i < N * 4; i++) this.r[i] = Math.random();
  }

  private resize() {
    const c = this.canvas;
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.w = innerWidth; this.h = innerHeight;
    c.width = this.w * this.dpr; c.height = this.h * this.dpr;
    this.ctx = c.getContext('2d');
    if (!this.ctx) return;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.fillStyle = '#050506';
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  private readScroll() {
    const secs = [...document.querySelectorAll<HTMLElement>('[data-scene]')];
    const y = scrollY, mid = y + innerHeight / 2;
    let f = 0;
    secs.forEach((s, i) => {
      const top = s.offsetTop, h = s.offsetHeight;
      if (mid >= top && mid < top + h) f = i + (mid - top) / h - 0.5;
    });
    const last = secs[secs.length - 1];
    if (!last || last.offsetHeight === 0) return;
    if (mid >= last.offsetTop + last.offsetHeight) f = secs.length - 1;
    this.target = Math.max(0, Math.min(secs.length - 1, f));
    this.vel += Math.abs(y - this.lastY) / innerHeight;
    this.lastY = y;
    const a = Math.round(this.target);
    if (a !== this.active) {
      this.active = a;
      this.opts.onActiveChange(a);
    }
  }

  private frame(dt: number) {
    const cv = this.canvas;
    if (!this.ctx || cv.width === 0 || this.w !== innerWidth || this.h !== innerHeight) this.resize();
    const ctx = this.ctx;
    if (!ctx) return;

    const mot = (SPEEDS[this.opts.motion] ?? 1) * (this.reduced ? 0.3 : 1);
    this.vel *= 0.92;
    this.t += dt * mot * (1 + Math.min(this.vel * 6, 4));
    this.sceneF += (this.target - this.sceneF) * Math.min(1, dt * 3.5);
    this.mx += (this.tmx - this.mx) * dt * 2;
    this.my += (this.tmy - this.my) * dt * 2;

    const w = this.w, h = this.h, t = this.t, S = FORMS.length;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.opts.trails ? 'rgba(5,5,6,0.35)' : '#050506';
    ctx.fillRect(0, 0, w, h);

    // Blend from the current section's form to the next one.
    const k = Math.min(S - 2, Math.floor(this.sceneF)), fr = this.sceneF - k;
    const e0 = Math.max(0, Math.min(1, (fr - 0.15) / 0.7)), m = e0 * e0 * (3 - 2 * e0);
    const k2 = Math.min(S - 1, k + 1);
    const fa = FORMS[k], fb = FORMS[k2];
    const mobile = w < 760;
    const off = mobile ? 0 : OFFSETS[k] * (1 - m) + OFFSETS[k2] * m;
    const cx = w * (0.5 + off), cy = h * 0.5;
    const fov = Math.min(w, h) * 0.95, camZ = 3;
    const yaw = this.mx * 0.4 + Math.sin(t * 0.07) * 0.35, pitch = 0.18 + this.my * 0.25;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const A: Vec3 = [0, 0, 0], B: Vec3 = [0, 0, 0];

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.N; i++) {
      form(fa, i, t, this.r, A);
      form(fb, i, t, this.r, B);
      const lag = Math.max(0, Math.min(1, m * 1.25 - this.r[i * 4 + 3] * 0.25));
      const x = A[0] + (B[0] - A[0]) * lag, y = A[1] + (B[1] - A[1]) * lag, z = A[2] + (B[2] - A[2]) * lag;
      const x1 = x * cyw - z * syw, z1 = x * syw + z * cyw;
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      const dz = camZ - z2;
      if (dz < 0.25) continue;
      const pr = fov / dz, px = cx + x1 * pr, py = cy - y2 * pr;
      if (px < -10 || px > w + 10 || py < -10 || py > h + 10) continue;
      const near = 3 / dz, s = Math.max(0.6, Math.min(3.2, near * 1.1));
      ctx.globalAlpha = Math.max(0.05, Math.min(0.36, near * 0.19));
      ctx.fillStyle = i % 17 === 0 ? '#EE8463' : '#F2F0EC';
      ctx.fillRect(px, py, s, s);
    }
    ctx.globalAlpha = 1;

    if (this.audio) {
      const now = this.audio.ctx.currentTime, v = Math.min(this.vel * 6, 4);
      this.audio.filter.frequency.setTargetAtTime(180 + this.sceneF * 80 + v * 500, now, 0.2);
      this.audio.o2.frequency.setTargetAtTime(82.5 * (1 + this.sceneF * 0.05), now, 0.4);
    }
  }
}
