/* Texturas do cenário do litoral, desenhadas em canvas na hora (nenhuma imagem
   baixada): ruído que se repete sem emenda, e mapas de relevo (normal map)
   tirados da própria altura. `t` = lado do quadrado (256 no celular, 512 no resto). */

import * as THREE from "three";

type Pixel = (x: number, y: number) => [number, number, number, number?];

/* ruído de valor periódico: repete sem emenda a cada `per` células */
function hashP(x: number, y: number, per: number) {
  x = ((x % per) + per) % per; y = ((y % per) + per) % per;
  const s = Math.sin(x * 127.1 + y * 311.7 + per * 0.13) * 43758.5453;
  return s - Math.floor(s);
}
function ruidoP(x: number, y: number, per: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hashP(xi, yi, per), b = hashP(xi + 1, yi, per), c = hashP(xi, yi + 1, per), d = hashP(xi + 1, yi + 1, per);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/** fbm periódico em coordenadas 0..1 da textura */
export function fbmP(u: number, v: number, base: number, oitavas = 4) {
  let s = 0, a = 0.5, f = base;
  for (let i = 0; i < oitavas; i++) { s += a * ruidoP(u * f, v * f, f); f *= 2; a *= 0.5; }
  return s / (1 - Math.pow(0.5, oitavas));
}

function criar(t: number, h: number, px: Pixel, altura?: (x: number, y: number) => number) {
  const c = document.createElement("canvas");
  c.width = t; c.height = h;
  const g = c.getContext("2d")!;
  const img = g.createImageData(t, h);
  const alt = altura ? new Float32Array(t * h) : null;
  for (let y = 0; y < h; y++) for (let x = 0; x < t; x++) {
    const [r, gg, b, a = 255] = px(x, y);
    const i = (y * t + x) * 4;
    img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = a;
    if (alt) alt[y * t + x] = altura!(x, y);
  }
  g.putImageData(img, 0, 0);
  return { canvas: c, ctx: g, alt };
}

function textura(c: HTMLCanvasElement, srgb = true, repetir = true) {
  const tx = new THREE.CanvasTexture(c);
  if (srgb) tx.colorSpace = THREE.SRGBColorSpace;
  if (repetir) { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; }
  tx.anisotropy = 8;
  return tx;
}

/** normal map a partir da altura (derivada com vizinhos, com emenda) */
function normalDe(alt: Float32Array, t: number, h: number, forca: number) {
  const c = document.createElement("canvas");
  c.width = t; c.height = h;
  const g = c.getContext("2d")!;
  const img = g.createImageData(t, h);
  const A = (x: number, y: number) => alt[((y + h) % h) * t + ((x + t) % t)];
  for (let y = 0; y < h; y++) for (let x = 0; x < t; x++) {
    const dx = (A(x + 1, y) - A(x - 1, y)) * forca, dy = (A(x, y + 1) - A(x, y - 1)) * forca;
    const l = Math.hypot(dx, dy, 1);
    const i = (y * t + x) * 4;
    img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (-dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return textura(c, false);
}

const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const cl = (v: number) => Math.max(0, Math.min(255, v));

/* ───── terreno ───── */
export function areia(t: number) {
  const f = (x: number, y: number) => {
    const u = x / t, v = y / t;
    const ond = Math.sin((v + fbmP(u, v, 4) * 0.15) * Math.PI * 2 * 14) * 0.5 + 0.5; // ondulação do vento
    return ond * 0.35 + fbmP(u, v, 16) * 0.4 + hashP(x, y, t) * 0.25;
  };
  const { canvas, alt } = criar(t, t, (x, y) => {
    const n = f(x, y), grao = hashP(x * 7, y * 3, t * 7);
    const k = 0.82 + n * 0.3 + (grao > 0.97 ? -0.25 : 0) + (grao < 0.02 ? 0.2 : 0);
    return [cl(222 * k), cl(196 * k), cl(150 * k)];
  }, f);
  return { cor: textura(canvas), normal: normalDe(alt!, t, t, 2.2) };
}

export function grama(t: number) {
  const { canvas } = criar(t, t, (x, y) => {
    const u = x / t, v = y / t;
    const m = fbmP(u, v, 6), fio = hashP(x, y * 3, t);
    const k = 0.7 + m * 0.5 + (fio - 0.5) * 0.35;
    const seco = fbmP(u + 0.3, v, 3) > 0.62 ? 1 : 0;
    return [cl(mix(58, 120, seco * 0.5) * k), cl(mix(98, 110, seco * 0.5) * k), cl(mix(46, 58, seco * 0.5) * k)];
  });
  return textura(canvas);
}

export function rocha(t: number) {
  const f = (x: number, y: number) => {
    const u = x / t, v = y / t;
    const r = Math.abs(fbmP(u, v, 5) - 0.5) * 2; // veios
    return fbmP(u, v, 8) * 0.6 + (1 - r) * 0.4;
  };
  const { canvas, alt } = criar(t, t, (x, y) => {
    const n = f(x, y), musgo = fbmP(x / t, y / t, 4) > 0.58 ? 1 : 0;
    const k = 0.55 + n * 0.55;
    return [cl(mix(118, 70, musgo * 0.6) * k), cl(mix(108, 92, musgo * 0.6) * k), cl(mix(96, 60, musgo * 0.6) * k)];
  }, f);
  return { cor: textura(canvas), normal: normalDe(alt!, t, t, 4) };
}

/** acostamento e pátio: cascalho/concreto batido */
export function cascalho(t: number) {
  const f = (x: number, y: number) => fbmP(x / t, y / t, 10) * 0.5 + hashP(x, y, t) * 0.5;
  const { canvas, alt } = criar(t, t, (x, y) => {
    const n = f(x, y), mancha = fbmP(x / t, y / t, 3);
    const k = 0.7 + n * 0.4 - (mancha > 0.66 ? 0.18 : 0);
    return [cl(128 * k), cl(120 * k), cl(108 * k)];
  }, f);
  return { cor: textura(canvas), normal: normalDe(alt!, t, t, 3) };
}

/** variação larga para quebrar a repetição */
export function macro(t: number) {
  const { canvas } = criar(t, t, (x, y) => {
    const n = fbmP(x / t, y / t, 3, 5) * 255;
    return [n, n, n];
  });
  return textura(canvas, false);
}

/* ───── estrada: 1 textura cobre a largura e ~9 m de comprimento ───── */
export function asfalto(t: number) {
  const W = t / 2, H = t * 2;
  const f = (x: number, y: number) => {
    const u = x / W, v = y / H;
    return fbmP(u * 1, v * 4, 12) * 0.5 + hashP(x, y, W) * 0.5;
  };
  const { canvas, ctx, alt } = criar(W, H, (x, y) => {
    const u = x / W, v = y / H;
    const n = f(x, y);
    let k = 0.62 + n * 0.3;
    // trilhos dos pneus: mais lisos e claros
    const trilho = Math.exp(-Math.pow((u - 0.24) / 0.05, 2)) + Math.exp(-Math.pow((u - 0.76) / 0.05, 2));
    k += trilho * 0.1;
    // remendos e manchas de óleo
    const rem = fbmP(u, v * 4, 3);
    if (rem > 0.7) k *= 0.82;
    if (fbmP(u + 0.5, v * 4, 6) > 0.74 && Math.abs(u - 0.5) < 0.3) k *= 0.8;
    const pedra = hashP(x * 3, y * 5, W * 3) > 0.985 ? 1.35 : 1;
    const c = 74 * k * pedra;
    return [cl(c), cl(c * 1.01), cl(c * 1.05)];
  }, f);
  // rachaduras
  ctx.strokeStyle = "rgba(15,15,17,0.8)"; ctx.lineWidth = Math.max(1, t / 512);
  for (let i = 0; i < 7; i++) {
    let x = Math.random() * W, y = Math.random() * H;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < 12; s++) { x += (Math.random() - 0.5) * W * 0.08; y += (Math.random() - 0.3) * H * 0.02; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  // faixas pintadas, gastas pelo ruído
  const faixa = (x0: number, largura: number, cor: [number, number, number], y0 = 0, y1 = H) => {
    const img = ctx.getImageData(0, 0, W, H);
    for (let y = Math.floor(y0); y < y1; y++) for (let x = Math.floor(x0); x < x0 + largura; x++) {
      const gasto = fbmP(x / W * 4, y / H * 8, 8) * 0.6 + hashP(x, y, W) * 0.4;
      if (gasto < 0.28) continue;
      const i = (y * W + x) * 4, a = 0.88;
      img.data[i] = mix(img.data[i], cor[0], a); img.data[i + 1] = mix(img.data[i + 1], cor[1], a); img.data[i + 2] = mix(img.data[i + 2], cor[2], a);
    }
    ctx.putImageData(img, 0, 0);
  };
  const lw = W * 0.025;
  faixa(W * 0.035, lw, [232, 230, 222]);
  faixa(W * 0.94, lw, [232, 230, 222]);
  faixa(W * 0.5 - lw / 2, lw, [226, 168, 38], 0, H * 0.55); // eixo amarelo tracejado
  return { cor: textura(canvas), normal: normalDe(alt!, W, H, 2.5) };
}

/* ───── coqueiro ───── */
export function casca(t: number) {
  const W = t / 4, H = t;
  const { canvas } = criar(W, H, (x, y) => {
    const v = y / H, u = x / W;
    const anel = Math.pow(Math.abs(Math.sin(v * Math.PI * 22 + fbmP(u, v, 4) * 1.5)), 6); // cicatrizes das folhas
    const k = 0.75 + fbmP(u, v * 4, 6) * 0.35 - anel * 0.35 + (hashP(x, y, W) - 0.5) * 0.1;
    return [cl(122 * k), cl(104 * k), cl(84 * k)];
  });
  return textura(canvas);
}

/** folha de coqueiro com folíolos recortados (alfa) — nervura no meio, ao longo de y */
export function folhaCoqueiro(t: number) {
  const W = t / 2, H = t;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, W, H);
  const n = 40;
  for (let i = 0; i < n; i++) {
    const s = i / n, y = H * (0.04 + s * 0.94);
    const comp = W * 0.48 * Math.sin(Math.min(1, s * 1.15 + 0.05) * Math.PI) * (0.85 + Math.random() * 0.2);
    const tom = 95 + Math.random() * 45;
    for (const lado of [-1, 1]) {
      g.strokeStyle = `rgb(${tom * 0.6},${tom + 45},${tom * 0.38})`;
      g.lineWidth = Math.max(3, W * 0.055);
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(W / 2, y);
      g.quadraticCurveTo(W / 2 + lado * comp * 0.5, y + H * 0.02, W / 2 + lado * comp, y + H * 0.06);
      g.stroke();
    }
  }
  g.strokeStyle = "rgb(120,110,60)"; g.lineWidth = Math.max(2, W * 0.03);
  g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();
  const tx = textura(c, true, false);
  return tx;
}

/** folhagem da mata: manchas de folhas claras e escuras */
export function copa(t: number) {
  const f = (x: number, y: number) => fbmP(x / t, y / t, 14) * 0.6 + hashP(x, y, t) * 0.4;
  const { canvas, alt } = criar(t, t, (x, y) => {
    const n = f(x, y);
    const k = 0.6 + n * 0.7;
    return [cl(96 * k), cl(140 * k), cl(72 * k)];
  }, f);
  return { cor: textura(canvas), normal: normalDe(alt!, t, t, 5) };
}

/* ───── construções ───── */
export function reboco(t: number, base: [number, number, number]) {
  const { canvas } = criar(t, t, (x, y) => {
    const u = x / t, v = y / t;
    const suj = Math.pow(v, 3) * 0.35 * fbmP(u * 3, v, 4); // sujeira escorrida perto do chão
    const k = 0.9 + fbmP(u, v, 12) * 0.12 - suj;
    return [cl(base[0] * k), cl(base[1] * k), cl(base[2] * k)];
  });
  return textura(canvas);
}

export function telha(t: number) {
  const f = (x: number, y: number) => {
    const u = x / t, v = y / t;
    const col = Math.abs(Math.sin(u * Math.PI * 12)); // canais da telha colonial
    const fila = (v * 10) % 1;
    return col * 0.7 + (1 - fila) * 0.3;
  };
  const { canvas, alt } = criar(t, t, (x, y) => {
    const n = f(x, y), var_ = fbmP(x / t, y / t, 6);
    const k = 0.55 + n * 0.45 + (var_ - 0.5) * 0.3;
    return [cl(168 * k), cl(84 * k), cl(52 * k)];
  }, f);
  return { cor: textura(canvas), normal: normalDe(alt!, t, t, 3) };
}

/** lataria do motorhome: branco com faixa lateral e frisos */
export function lataria(t: number) {
  const W = t, H = t / 2;
  const { canvas, ctx } = criar(W, H, (x, y) => {
    const u = x / W, v = y / H;
    const k = 0.92 + fbmP(u, v, 8) * 0.06 - Math.pow(v, 4) * 0.2;
    return [cl(244 * k), cl(241 * k), cl(234 * k)];
  });
  ctx.fillStyle = "#0f766e"; ctx.fillRect(0, H * 0.62, W, H * 0.08);
  ctx.fillStyle = "#d9772b"; ctx.fillRect(0, H * 0.72, W, H * 0.03);
  ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo((W / 6) * i, 0); ctx.lineTo((W / 6) * i, H); ctx.stroke(); }
  return textura(canvas, true, false);
}
