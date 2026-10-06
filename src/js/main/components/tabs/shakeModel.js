export const AE_FRAME = 0.0333333333;
export const AE_FRAMES = 10;
export const AE_BLUR_MAX = 55;
export const AE_BLUR_MIN = 0.1;
export const FAST_IN = [0.05, 0.9, 0.2, 1];
export const LINEAR_HANDLES = [1 / 3, 1 / 3, 2 / 3, 2 / 3];

export const EASE_PRESETS = [
  { label: "Linear", value: null },
  { label: "Ease", value: [0.42, 0, 0.58, 1] },
  { label: "Fast in", value: FAST_IN },
  { label: "Ease out", value: [0, 0, 0.58, 1] },
  { label: "Hold", value: "hold" },
];

export const DIM_LABELS = {
  "1d": [""],
  "2d": ["X", "Y"],
  "3d": ["X", "Y", "Z"],
  color: ["R", "G", "B", "A"],
};

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function num(v, def) {
  if (v === "" || v === null || v === undefined) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export function makeRng(seedText) {
  let h = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    h = (h * 31 + seedText.charCodeAt(i)) % 4294967296;
  }
  let state = h;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function bezierEase(t, [x1, y1, x2, y2]) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const bx = (s) =>
    3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s;
  const by = (s) =>
    3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (bx(mid) < t) lo = mid;
    else hi = mid;
  }
  return by((lo + hi) / 2);
}

const cloneEase = (e) => (Array.isArray(e) ? [...e] : e ?? null);
const mk = (f, v, ease) => ({
  f,
  v,
  ease: v.map((_, d) => cloneEase(ease?.[d])),
});

export function cloneKeys(keys) {
  return keys.map((k) => ({
    f: k.f,
    v: [...k.v],
    ease: k.v.map((_, d) => cloneEase(k.ease?.[d])),
  }));
}

export function angleToVector(angle) {
  const r = (angle * Math.PI) / 180;
  return [-Math.sin(r), Math.cos(r)];
}


export function generateGroups(p, aspect = 1) {
  const D = Math.round(clamp(num(p.duration, 14), 4, 30));
  const N = Math.round(clamp(num(p.bounces, 6), 1, 12));
  const decay = clamp(num(p.decay, 70), 10, 95) / 100;
  const ax = clamp(num(p.posX, 12), 0, 60) / 100;
  const ay = clamp(num(p.posY, 12), 0, 60) / 100;
  const ar = clamp(num(p.rotation, 3), 0, 30);
  const az = clamp(num(p.zoom, 6), 0, 40) / 100;
  const blurAmount = clamp(num(p.blur, 60), 0, 100) / 100;
  const falloff = clamp(num(p.blurFalloff, 50), 10, 100);

  const rnd = makeRng(String(p.seed || p.name || "shake"));
  rnd();
  rnd();
  rnd();
  const dirX = rnd() < 0.5 ? 1 : -1;
  const dirY = rnd() < 0.5 ? 1 : -1;
  const dirR = rnd() < 0.5 ? 1 : -1;

  const pos = [];
  const rot = [];
  const scale = [];
  for (let i = 0; i < N; i += 1) {
    const alt = i % 2 === 0 ? 1 : -1;
    const g = Math.pow(decay, i);
    const jx = 0.75 + 0.25 * rnd();
    const jy = 0.75 + 0.25 * rnd();
    const jr = 0.75 + 0.25 * rnd();
    const f = (D * i) / N;
    pos.push(mk(f, [dirX * alt * ax * g * jx, dirY * alt * ay * g * jy]));
    rot.push(mk(f, [dirR * alt * ar * g * jr]));
    scale.push(mk(f, [1 + (i % 2 === 0 ? az * g : 0)]));
  }
  pos.push(mk(D, [0, 0]));
  rot.push(mk(D, [0]));
  scale.push(mk(D, [1]));

  const blurLen = Math.max(AE_BLUR_MIN, AE_BLUR_MAX * blurAmount);
  const blurEnd = Math.max(0.5, (D * falloff) / 100);
  const blur = [mk(0, [blurLen]), mk(blurEnd, [AE_BLUR_MIN])];

  let angle;
  if (p.blurAuto === false) {
    angle = clamp(num(p.blurAngle, 0), 0, 180);
  } else {
    const mx = dirX * ax * aspect;
    const my = dirY * ay;
    angle = mx === 0 && my === 0 ? 0 : (Math.atan2(-mx, my) * 180) / Math.PI;
    angle = ((angle % 180) + 180) % 180;
  }

  return {
    frames: D,
    angle,
    groups: [
      { id: "pos", label: "Position", dims: ["X", "Y"], mul: 100, unit: "%", keys: pos },
      { id: "rot", label: "Rotation", dims: [""], mul: 1, unit: "°", keys: rot },
      { id: "scale", label: "Scale", dims: [""], mul: 100, unit: "%", keys: scale },
      { id: "blur", label: "Directional blur", dims: [""], mul: 1, unit: "px", keys: blur },
    ],
  };
}

export function basicGroups() {
  const y = [
    [0, 0.045],
    [2, -0.02],
    [5, 0.01],
    [AE_FRAMES, 0],
  ];
  return {
    frames: AE_FRAMES,
    angle: 0,
    groups: [
      {
        id: "pos",
        label: "Position",
        dims: ["X", "Y"],
        mul: 100,
        unit: "%",
        keys: y.map(([f, v]) => mk(f, [0, v])),
      },
      {
        id: "blur",
        label: "Directional blur",
        dims: [""],
        mul: 1,
        unit: "px",
        keys: [mk(0, [AE_BLUR_MAX]), mk(5, [AE_BLUR_MIN])],
      },
    ],
  };
}

export function flashGroup(settings, maxFrames) {
  const fd = clamp(Math.round(Number(settings.flashDuration) || 5), 1, maxFrames);
  const amount =
    (clamp(Number(settings.flashStrength) || 100, 1, 100) / 100) * 2;
  return {
    id: "flash",
    label: "Flash exposure",
    dims: [""],
    mul: 1,
    unit: " EV",
    keys: [mk(0, [amount], [FAST_IN]), mk(fd, [0])],
  };
}

export function applyOverrides(groups, overrides) {
  return groups.map((g) => {
    const keys = cloneKeys(g.keys);
    const ov = overrides?.[g.id];
    if (ov) {
      keys.forEach((k, i) => {
        const o = ov[i];
        if (!o) return;
        if (typeof o.f === "number") k.f = o.f;
        if (Array.isArray(o.v) && o.v.length === k.v.length) k.v = [...o.v];
        if (Array.isArray(o.ease) && o.ease.length === k.v.length) {
          k.ease = o.ease.map(cloneEase);
        }
      });
    }
    return { ...g, keys };
  });
}

export function applyStrength(groups, s) {
  return groups.map((g) => ({
    ...g,
    keys: cloneKeys(g.keys).map((k) => {
      if (g.id === "pos" || g.id === "rot") k.v = k.v.map((v) => v * s);
      else if (g.id === "scale") k.v = k.v.map((v) => 1 + (v - 1) * s);
      else if (g.id === "blur") {
        k.v = k.v.map((v) =>
          v > AE_BLUR_MIN ? Math.max(AE_BLUR_MIN, v * s) : v,
        );
      }
      return k;
    }),
  }));
}

export function effectGroup(fx, ei, prop, pi) {
  return {
    id: `fx${ei}.${pi}`,
    label: `${fx.name} › ${prop.label}`,
    dims: DIM_LABELS[prop.vt] || [""],
    mul: 1,
    unit: "",
    keys: cloneKeys(prop.keys),
  };
}

export function effectGroups(effects) {
  const out = [];
  (effects || []).forEach((fx, ei) => {
    (fx.props || []).forEach((prop, pi) => {
      if (prop.keys && prop.keys.length > 1) out.push(effectGroup(fx, ei, prop, pi));
    });
  });
  return out;
}

function lastFrame(keys) {
  return keys.reduce((m, k) => Math.max(m, k.f), 0);
}


export function buildRenderModel(p, settings) {
  const s = Number(settings.intensity) / 100;
  const base = p ? generateGroups(p) : basicGroups();
  const groups = applyStrength(applyOverrides(base.groups, p?.overrides), s);
  if (settings.addFlash) {
    groups.push(
      ...applyOverrides([flashGroup(settings, p ? 15 : 10)], p?.overrides),
    );
  }
  let frames = base.frames;
  const byId = {};
  for (const g of groups) {
    byId[g.id] = g;
    frames = Math.max(frames, lastFrame(g.keys));
  }
  if (p) {
    for (const g of effectGroups(p.effects)) {
      frames = Math.max(frames, lastFrame(g.keys));
    }
  }
  return { frames, angle: base.angle, groups: byId };
}

export function editorGroups(p, settings) {
  const base = generateGroups(p, 1);
  const groups = applyOverrides(base.groups, p.overrides);
  if (settings.addFlash) {
    groups.push(...applyOverrides([flashGroup(settings, 15)], p.overrides));
  }
  return groups;
}
export function baseKeysFor(p, settings, id) {
  if (id === "flash") return flashGroup(settings, 15).keys;
  return generateGroups(p, 1).groups.find((g) => g.id === id)?.keys;
}

export function diffKeys(baseKeys, keys) {
  const out = {};
  keys.forEach((k, i) => {
    const b = baseKeys?.[i];
    if (!b) return;
    const o = {};
    if (Math.abs(k.f - b.f) > 1e-6) o.f = k.f;
    if (k.v.some((v, d) => Math.abs(v - b.v[d]) > 1e-6)) o.v = [...k.v];
    if (JSON.stringify(k.ease) !== JSON.stringify(b.ease)) {
      o.ease = k.ease.map(cloneEase);
    }
    if (Object.keys(o).length) out[i] = o;
  });
  return out;
}

export function sampleGroup(g, f) {
  const k = g.keys;
  if (f <= k[0].f) return [...k[0].v];
  for (let i = 1; i < k.length; i += 1) {
    if (f <= k[i].f) {
      const a = k[i - 1];
      const b = k[i];
      const span = b.f - a.f;
      const t = span > 0 ? (f - a.f) / span : 1;
      return a.v.map((v0, d) => {
        const e = a.ease?.[d];
        if (e === "hold") return v0;
        const te = Array.isArray(e) ? bezierEase(t, e) : t;
        return v0 + (b.v[d] - v0) * te;
      });
    }
  }
  return [...k[k.length - 1].v];
}