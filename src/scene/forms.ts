// Particle shapes, one per form id. Each function writes particle i's 3D
// position at time t into `o`. Ported 1:1 from the design prototype.
//
// 0 glowing core + sparks · 1 double helix · 2 stock chart + purification plane
// 3 hub with 9 nodes + 12 orbiting points · 4 rising path with 3 stops
// 5 four stacked layers · 6 upward arrow with a trail

export type Vec3 = [number, number, number];

const TAU = Math.PI * 2;

export function form(k: number, i: number, t: number, r: Float32Array, o: Vec3): void {
  const a = r[i * 4], b = r[i * 4 + 1], c = r[i * 4 + 2], d = r[i * 4 + 3];
  const rotY = (ang: number) => {
    const cs = Math.cos(ang), sn = Math.sin(ang), x = o[0];
    o[0] = x * cs - o[2] * sn;
    o[2] = x * sn + o[2] * cs;
  };

  if (k === 0) {
    const g = i % 3;
    if (g === 0) {
      const rad = 0.11 * Math.cbrt(d) * (1 + 0.15 * Math.sin(t * 3)), th = a * TAU, ph = Math.acos(2 * b - 1);
      o[0] = rad * Math.sin(ph) * Math.cos(th); o[1] = rad * Math.cos(ph); o[2] = rad * Math.sin(ph) * Math.sin(th);
      return;
    }
    if (g === 1) {
      const ray = Math.floor(a * 28), yy = 1 - 2 * (ray + 0.5) / 28, rr = Math.sqrt(1 - yy * yy), th = ray * 2.39996;
      const dist = 0.14 + ((c + t * 0.3) % 1) * 1.1;
      o[0] = Math.cos(th) * rr * dist; o[1] = yy * dist; o[2] = Math.sin(th) * rr * dist;
      return;
    }
    const rad = 1.3 + d * 0.7, th = a * TAU + t * 0.03, ph = Math.acos(2 * b - 1);
    o[0] = rad * Math.sin(ph) * Math.cos(th); o[1] = rad * Math.cos(ph) * 0.7; o[2] = rad * Math.sin(ph) * Math.sin(th);
    return;
  }

  if (k === 1) {
    const R = 0.42;
    if (i % 5 === 0) {
      const yq = Math.round(a * 22) / 22, y = (yq - 0.5) * 2.4, ang = y * 2.6 + t * 0.5;
      o[0] = Math.cos(ang) * R * (1 - 2 * b); o[1] = y; o[2] = Math.sin(ang) * R * (1 - 2 * b);
      return;
    }
    const y = (a - 0.5) * 2.4, ang = y * 2.6 + t * 0.5 + (i % 2 ? Math.PI : 0), j = (c - 0.5) * 0.04;
    o[0] = Math.cos(ang) * (R + j); o[1] = y; o[2] = Math.sin(ang) * (R + j);
    return;
  }

  if (k === 2) {
    if (i % 7 === 0) {
      o[0] = (a - 0.5) * 2.7; o[2] = (b - 0.5) * 0.9; o[1] = Math.sin(t * 0.6) * 0.55 + (c - 0.5) * 0.01;
      return;
    }
    const n = 16, j = Math.floor(a * n), xj = -1.2 + j * 2.4 / (n - 1);
    const p = 0.22 * Math.sin(j * 0.7) + (j - 8) * 0.035 + 0.08 * Math.sin(j * 2.3);
    const h = 0.08 + 0.14 * Math.abs(Math.sin(j * 1.7));
    if (i % 4 === 0) { o[0] = xj; o[1] = p + (b - 0.5) * h * 2.2; o[2] = 0; return; }
    o[0] = xj + (c - 0.5) * 0.08; o[1] = p + (b - 0.5) * h; o[2] = (d - 0.5) * 0.08;
    return;
  }

  if (k === 3) {
    const g = i % 3, spin = t * 0.15;
    const node = (n: number): Vec3 => {
      const an = n * TAU / 9 + spin;
      return [Math.cos(an) * 1.05, 0.28 * Math.sin(n * 1.3 + t * 0.4), Math.sin(an) * 1.05];
    };
    if (g === 0) {
      const P = node(Math.floor(a * 9)), u = (b + t * 0.3) % 1;
      o[0] = P[0] * u; o[1] = P[1] * u; o[2] = P[2] * u;
      return;
    }
    if (g === 1) {
      const P = node(Math.floor(a * 9)), rad = 0.08 * Math.cbrt(d), th = b * TAU, ph = Math.acos(2 * c - 1);
      o[0] = P[0] + rad * Math.sin(ph) * Math.cos(th); o[1] = P[1] + rad * Math.cos(ph); o[2] = P[2] + rad * Math.sin(ph) * Math.sin(th);
      return;
    }
    if (i % 2 === 0) {
      const rad = 0.16 * Math.cbrt(d), th = a * TAU, ph = Math.acos(2 * b - 1);
      o[0] = rad * Math.sin(ph) * Math.cos(th); o[1] = rad * Math.cos(ph); o[2] = rad * Math.sin(ph) * Math.sin(th);
      return;
    }
    const m = Math.floor(c * 12), an = m * TAU / 12 - t * 0.4, rr = 0.03 * Math.cbrt(d);
    o[0] = Math.cos(an) * 0.48 + (a - 0.5) * rr * 2; o[1] = 0.15 * Math.sin(an * 2) + (b - 0.5) * rr * 2; o[2] = Math.sin(an) * 0.48;
    return;
  }

  if (k === 4) {
    const P = (u: number): Vec3 => [-1.2 + 2.4 * u, -0.65 + 1.3 * Math.pow(u, 1.6), 0.25 * Math.sin(u * 3.5)];
    const g = i % 3;
    if (g === 0) {
      const u = (a + t * 0.12) % 1, q = P(u), sp = 0.05;
      o[0] = q[0] + (b - 0.5) * sp; o[1] = q[1] + (c - 0.5) * sp; o[2] = q[2] + (d - 0.5) * sp;
      return;
    }
    if (g === 1) { const q = P(a); o[0] = q[0]; o[1] = q[1] + (b - 0.5) * 0.012; o[2] = q[2]; return; }
    const q = P([0.12, 0.55, 0.96][Math.floor(b * 3)]);
    const rr = d < 0.3 ? 0.04 * Math.cbrt(c) : 0.13 + 0.02 * Math.sin(t * 2), an = a * TAU;
    o[0] = q[0] + Math.cos(an) * rr; o[1] = q[1] + Math.sin(an) * rr; o[2] = q[2];
    return;
  }

  if (k === 5) {
    const L = i % 4, y = -0.6 + L * 0.4, s = 0.85;
    if (i % 13 === 0) {
      const cn = Math.floor(a * 4);
      o[0] = cn & 1 ? s : -s; o[2] = cn & 2 ? s : -s; o[1] = (b - 0.5) * 1.2;
    } else if (b < 0.5) {
      const e = Math.floor(c * 4), u = (a * 2 - 1) * s;
      if (e === 0) { o[0] = u; o[2] = s; } else if (e === 1) { o[0] = u; o[2] = -s; } else if (e === 2) { o[0] = s; o[2] = u; } else { o[0] = -s; o[2] = u; }
      o[1] = y;
    } else {
      const q = Math.round(c * 6) / 6 * 2 - 1;
      if (d < 0.5) { o[0] = q * s; o[2] = (a * 2 - 1) * s; } else { o[2] = q * s; o[0] = (a * 2 - 1) * s; }
      o[1] = y;
    }
    rotY(t * 0.2 * (L % 2 ? -1 : 1) + L * 0.25);
    return;
  }

  const bob = 0.05 * Math.sin(t * 2);
  if (i % 3 === 0) {
    const u = (c + t * 0.5) % 1, sp = 0.08 + u * 0.5;
    o[0] = (a - 0.5) * sp; o[1] = -0.5 - u * 1.6 + bob; o[2] = (b - 0.5) * sp;
    return;
  }
  if (b < 0.55) {
    let u = a, v = c;
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    o[0] = -0.32 * u + 0.32 * v; o[1] = 0.75 - 0.45 * (u + v) + bob; o[2] = (d - 0.5) * 0.06;
  } else {
    o[0] = (a - 0.5) * 0.14; o[1] = 0.3 - c * 0.8 + bob; o[2] = (d - 0.5) * 0.06;
  }
  rotY(t * 0.35);
}
