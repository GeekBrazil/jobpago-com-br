// =====================================================================================
//  Campus — o mundo 3D (anel estilo Apple Park, pátio, pavilhões, luz do dia)
//  Dono: frente "mundo". Usa o THREE global (r149, UMD). Sem addons, sem npm.
//
//  export criarMundo(scene, renderer, { qualidade: 'celular' | 'pc' }) → Mundo
//  Interface e convenções: data/campus/CONTRATO.md (o ADENDO vale sobre o resto).
//
//  Notas de integração
//   • Cores: escritas em sRGB. Se o renderer sai em sRGB (o app usa sRGBEncoding),
//     convertemos tudo pra linear aqui dentro — o resultado bate com os hex daqui.
//   • Não mexemos em renderer.shadowMap.type (o app escolhe PCF/PCFSoft); só garantimos
//     shadowMap.enabled. Sombra do sol: 1024 no 'pc', 512 no 'celular', cobrindo o pátio.
//   • O céu é uma cúpula que acompanha a câmera (onBeforeRender) e cabe em qualquer far.
//   • caminho(de, para) NÃO inclui `de`; o último ponto é `para` (com o y dele).
//     Se `de`/`para` é um posto, o caminho passa pelo ponto de aproximação do posto
//     (atrás da cadeira, no pé da cama, ao lado da esteira…).
//   • Postos: pos.y = altura da superfície (0 no piso; 0.18 no deck da esteira).
// =====================================================================================

const THREE = window.THREE;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const s2l = (c) => (c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4));

// ----------------------------------------------------------------------------- ruído
function hash2(x, y) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function ruido(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y) { return ruido(x, y) * 0.55 + ruido(x * 2.07 + 5.3, y * 2.07 - 1.7) * 0.3 + ruido(x * 4.31 - 2.1, y * 4.31 + 7.7) * 0.15; }
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}
function hashTexto(t) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// ----------------------------------------------------------------------------- cores
const _corCache = new Map();
function corS(h) { // THREE.Color em sRGB (sem conversão) — com cache
  if (h && h.isColor) return h;
  let c = _corCache.get(h);
  if (!c) { c = new THREE.Color(h); _corCache.set(h, c); }
  return c;
}

// ----------------------------------------------------------------------------- matrizes / quadros locais
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function mat(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ');
  _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
}
// Quadro local: origem (x,z) no chão, girado ry. Local +Z = "frente".
class Quadro {
  constructor(x, z, ry, y = 0) {
    this.x = x; this.z = z; this.y = y; this.ry = ry;
    this.c = Math.cos(ry); this.s = Math.sin(ry);
    this.m = mat(x, y, z, ry);
  }
  M(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) { return this.m.clone().multiply(mat(x, y, z, ry, sx, sy, sz, rx, rz)); }
  xz(x, z) { return [this.x + x * this.c + z * this.s, this.z - x * this.s + z * this.c]; }
  P(x, y, z) { const w = this.xz(x, z); return new THREE.Vector3(w[0], this.y + y, w[1]); }
  R(r) { return this.ry + r; }
  sub(x, z, ry = 0) { const w = this.xz(x, z); return new Quadro(w[0], w[1], this.ry + ry, this.y); }
}
const MUNDO = new Quadro(0, 0, 0);

// ----------------------------------------------------------------------------- construtor de malha simples
class Geo {
  constructor() { this.p = []; this.n = []; this.i = []; this.k = 0; }
  v(x, y, z, nx, ny, nz) { this.p.push(x, y, z); this.n.push(nx, ny, nz); return this.k++; }
  tri(a, b, c) { this.i.push(a, b, c); }
  // quad com orientação corrigida pela normal média (N0+N2)
  quad(P0, P1, P2, P3, N0, N1, N2, N3) {
    N1 = N1 || N0; N2 = N2 || N0; N3 = N3 || N0;
    const a = this.v(P0[0], P0[1], P0[2], N0[0], N0[1], N0[2]);
    const b = this.v(P1[0], P1[1], P1[2], N1[0], N1[1], N1[2]);
    const c = this.v(P2[0], P2[1], P2[2], N2[0], N2[1], N2[2]);
    const d = this.v(P3[0], P3[1], P3[2], N3[0], N3[1], N3[2]);
    const ux = P1[0] - P0[0], uy = P1[1] - P0[1], uz = P1[2] - P0[2];
    let wx = P2[0] - P0[0], wy = P2[1] - P0[1], wz = P2[2] - P0[2];
    let fx = uy * wz - uz * wy, fy = uz * wx - ux * wz, fz = ux * wy - uy * wx;
    if (fx * fx + fy * fy + fz * fz < 1e-12) { // primeiro triângulo degenerado: usa o segundo
      wx = P3[0] - P0[0]; wy = P3[1] - P0[1]; wz = P3[2] - P0[2];
      const vx = P2[0] - P0[0], vy = P2[1] - P0[1], vz = P2[2] - P0[2];
      fx = vy * wz - vz * wy; fy = vz * wx - vx * wz; fz = vx * wy - vy * wx;
    }
    const nx = N0[0] + N2[0], ny = N0[1] + N2[1], nz = N0[2] + N2[2];
    if (fx * nx + fy * ny + fz * nz >= 0) { this.tri(a, b, c); this.tri(a, c, d); } else { this.tri(a, c, b); this.tri(a, d, c); }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setIndex(this.i);
    return g;
  }
}

// setor de anel sólido (r0..r1, a0..a1 em rad, y0..y1). Ângulo a: x = r cos a, z = r sin a.
function setor(r0, r1, a0, a1, y0, y1, seg, o = {}) {
  const g = new Geo();
  const cheio = Math.abs(a1 - a0) >= TAU - 1e-4;
  const P = (r, a, y) => [r * Math.cos(a), y, r * Math.sin(a)];
  const Nr = (a, s) => [s * Math.cos(a), 0, s * Math.sin(a)];
  for (let i = 0; i < seg; i++) {
    const A = a0 + (a1 - a0) * i / seg, B = a0 + (a1 - a0) * (i + 1) / seg;
    if (o.topo !== false) g.quad(P(r0, A, y1), P(r1, A, y1), P(r1, B, y1), P(r0, B, y1), [0, 1, 0]);
    if (o.base) g.quad(P(r0, A, y0), P(r0, B, y0), P(r1, B, y0), P(r1, A, y0), [0, -1, 0]);
    if (y1 > y0) {
      if (o.fora !== false) g.quad(P(r1, A, y0), P(r1, B, y0), P(r1, B, y1), P(r1, A, y1), Nr(A, 1), Nr(B, 1), Nr(B, 1), Nr(A, 1));
      if (o.dentro !== false && r0 > 0.001) g.quad(P(r0, A, y0), P(r0, B, y0), P(r0, B, y1), P(r0, A, y1), Nr(A, -1), Nr(B, -1), Nr(B, -1), Nr(A, -1));
    }
  }
  if (!cheio && y1 > y0 && o.pontas !== false) {
    g.quad(P(r0, a0, y0), P(r1, a0, y0), P(r1, a0, y1), P(r0, a0, y1), [Math.sin(a0), 0, -Math.cos(a0)]);
    g.quad(P(r0, a1, y0), P(r1, a1, y0), P(r1, a1, y1), P(r0, a1, y1), [-Math.sin(a1), 0, Math.cos(a1)]);
  }
  return g.build();
}
// parede cilíndrica fina (só uma face) — sentido +1 normal pra fora, -1 pra dentro
function paredeArco(r, a0, a1, y0, y1, seg, sentido) {
  const g = new Geo();
  for (let i = 0; i < seg; i++) {
    const A = a0 + (a1 - a0) * i / seg, B = a0 + (a1 - a0) * (i + 1) / seg;
    const nA = [sentido * Math.cos(A), 0, sentido * Math.sin(A)], nB = [sentido * Math.cos(B), 0, sentido * Math.sin(B)];
    g.quad([r * Math.cos(A), y0, r * Math.sin(A)], [r * Math.cos(B), y0, r * Math.sin(B)], [r * Math.cos(B), y1, r * Math.sin(B)], [r * Math.cos(A), y1, r * Math.sin(A)], nA, nB, nB, nA);
  }
  return g.build();
}
// parede reta vertical entre dois pontos [x,z]
function paredeReta(p0, p1, y0, y1) {
  const g = new Geo();
  const dx = p1[0] - p0[0], dz = p1[1] - p0[1], l = Math.hypot(dx, dz) || 1;
  const n = [-dz / l, 0, dx / l];
  g.quad([p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]], n);
  return g.build();
}
// faixa plana ao longo de uma polilinha [[x,z]...] (caminhos), com saia nas bordas
function faixa(pts, w, yfn, fechado, saia = 0.1) {
  const g = new Geo();
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[fechado ? (i - 1 + n) % n : Math.max(i - 1, 0)];
    const b = pts[fechado ? (i + 1) % n : Math.min(i + 1, n - 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const h = w / 2;
    L.push([p[0] - tz * h, p[1] + tx * h]);
    R.push([p[0] + tz * h, p[1] - tx * h]);
  }
  const Y = (q) => (yfn ? yfn(q[0], q[1]) : 0);
  const m = fechado ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const j = (i + 1) % n;
    const l0 = L[i], l1 = L[j], r0 = R[i], r1 = R[j];
    const yl0 = Y(l0), yl1 = Y(l1), yr0 = Y(r0), yr1 = Y(r1);
    g.quad([l0[0], yl0, l0[1]], [r0[0], yr0, r0[1]], [r1[0], yr1, r1[1]], [l1[0], yl1, l1[1]], [0, 1, 0]);
    if (saia > 0) {
      let dx = l1[0] - l0[0], dz = l1[1] - l0[1], ll = Math.hypot(dx, dz) || 1;
      const nl = [-dz / ll, 0, dx / ll];
      g.quad([l0[0], yl0, l0[1]], [l1[0], yl1, l1[1]], [l1[0], yl1 - saia, l1[1]], [l0[0], yl0 - saia, l0[1]], nl);
      dx = r1[0] - r0[0]; dz = r1[1] - r0[1]; ll = Math.hypot(dx, dz) || 1;
      const nr = [dz / ll, 0, -dx / ll];
      g.quad([r0[0], yr0, r0[1]], [r1[0], yr1, r1[1]], [r1[0], yr1 - saia, r1[1]], [r0[0], yr0 - saia, r0[1]], nr);
    }
  }
  return g.build();
}
// grade polar (gramado / terreno). rDe(t) dá o raio do anel t∈[0,1]
function discoPolar(nr, na, rDe, yfn) {
  const g = new Geo();
  for (let i = 0; i <= nr; i++) {
    const r = rDe(i / nr);
    for (let j = 0; j < na; j++) {
      const a = j / na * TAU, x = r * Math.cos(a), z = r * Math.sin(a);
      let y = 0, nx = 0, ny = 1, nz = 0;
      if (yfn) {
        y = yfn(x, z);
        const e = 0.6, hx = (yfn(x + e, z) - yfn(x - e, z)) / (2 * e), hz = (yfn(x, z + e) - yfn(x, z - e)) / (2 * e);
        const l = Math.hypot(hx, 1, hz); nx = -hx / l; ny = 1 / l; nz = -hz / l;
      }
      g.v(x, y, z, nx, ny, nz);
    }
  }
  for (let i = 0; i < nr; i++) {
    for (let j = 0; j < na; j++) {
      const a = i * na + j, b = i * na + (j + 1) % na, c = (i + 1) * na + (j + 1) % na, d = (i + 1) * na + j;
      g.tri(a, b, c); g.tri(a, c, d);
    }
  }
  return g.build();
}

// ----------------------------------------------------------------------------- lote (geometria mesclada por material)
const _nm = new THREE.Matrix3(), _v = new THREE.Vector3(), _vn = new THREE.Vector3(), _vl = new THREE.Vector3();
class Lote {
  constructor(o = {}) {
    this.comUV = !!o.uv; this.comAlfa = !!o.alfa; this.ao = !!o.ao; this.comPad = !!o.pad;
    this.P = []; this.N = []; this.C = []; this.U = []; this.A = []; this.D = []; this.I = []; this.n = 0;
    this.pad = 0; // padrão de piso atual (ver PAD) — vale pros add() seguintes
  }
  // roda fn() com o padrão de piso k (só nas faces viradas pra cima)
  padrao(k, fn) { const a = this.pad; this.pad = k; try { fn(); } finally { this.pad = a; }
  }
  // geo: BufferGeometry; m: Matrix4; c: cor (hex/Color) ou fn(pMundo, nMundo, pLocal) → Color (sRGB)
  add(geo, m, c, uvRet, alfa = 1) {
    const pa = geo.attributes.position, na = geo.attributes.normal, ua = geo.attributes.uv;
    _nm.getNormalMatrix(m);
    const fn = typeof c === 'function' ? c : null;
    const cc = fn ? null : corS(c);
    const base = this.n;
    for (let i = 0; i < pa.count; i++) {
      _vl.fromBufferAttribute(pa, i);
      _v.copy(_vl).applyMatrix4(m);
      _vn.fromBufferAttribute(na, i).applyMatrix3(_nm).normalize();
      this.P.push(_v.x, _v.y, _v.z);
      this.N.push(_vn.x, _vn.y, _vn.z);
      const k = fn ? fn(_v, _vn, _vl) : cc;
      let f = 1;
      if (this.ao && Math.abs(_vn.y) < 0.9) f = lerp(0.74, 1, smooth(0, 0.7, _v.y)); // contato com o chão
      this.C.push(k.r * f, k.g * f, k.b * f);
      if (this.comUV) {
        let u = ua ? ua.getX(i) : 0, w = ua ? ua.getY(i) : 0;
        if (uvRet) { u = uvRet[0] + u * uvRet[2]; w = uvRet[1] + w * uvRet[3]; }
        this.U.push(u, w);
      }
      if (this.comAlfa) this.A.push(alfa);
      if (this.comPad) this.D.push(this.pad && _vn.y > 0.7 ? this.pad : 0);
    }
    if (geo.index) { const I = geo.index; for (let i = 0; i < I.count; i++) this.I.push(base + I.getX(i)); }
    else for (let i = 0; i < pa.count; i++) this.I.push(base + i);
    this.n += pa.count;
  }
  build(linear) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    const C = linear ? this.C.map(s2l) : this.C;
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    if (this.comUV) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
    if (this.comAlfa) g.setAttribute('alfa', new THREE.Float32BufferAttribute(this.A, 1));
    if (this.comPad) g.setAttribute('pad', new THREE.Float32BufferAttribute(this.D, 1));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.I, 1) : new THREE.Uint16BufferAttribute(this.I, 1));
    g.computeBoundingSphere();
    this.P = this.N = this.C = this.U = this.A = this.D = this.I = null;
    return g;
  }
}

// ----------------------------------------------------------------------------- geometrias unitárias (cache)
const GEO = {};
function gCaixa() { return GEO.caixa || (GEO.caixa = new THREE.BoxGeometry(1, 1, 1)); }
function gCil(seg = 12) { const k = 'cil' + seg; return GEO[k] || (GEO[k] = new THREE.CylinderGeometry(1, 1, 1, seg, 1)); }
function gCone(seg = 12) { const k = 'cone' + seg; return GEO[k] || (GEO[k] = new THREE.CylinderGeometry(0, 1, 1, seg, 1)); }
function gTronco(seg = 8) { const k = 'tronco' + seg; return GEO[k] || (GEO[k] = new THREE.CylinderGeometry(0.62, 1, 1, seg, 1)); }
function gEsfera(w = 12, h = 8) { const k = 'esf' + w + 'x' + h; return GEO[k] || (GEO[k] = new THREE.SphereGeometry(1, w, h)); }
function gMeiaEsfera(w = 16) { const k = 'meia' + w; return GEO[k] || (GEO[k] = new THREE.SphereGeometry(1, w, Math.max(4, w / 3 | 0), 0, TAU, 0, Math.PI / 2)); }
function gOcta() { return GEO.octa || (GEO.octa = new THREE.OctahedronGeometry(1, 0)); }
function gIco(d = 1) { const k = 'ico' + d; return GEO[k] || (GEO[k] = new THREE.IcosahedronGeometry(1, d)); }
function gPlano() { return GEO.plano || (GEO.plano = new THREE.PlaneGeometry(1, 1)); }
function gCapsula(r, l, cs = 3, rs = 10) { const k = `cap${r}_${l}_${cs}_${rs}`; return GEO[k] || (GEO[k] = new THREE.CapsuleGeometry(r, l, cs, rs)); }
function gToro(r, t, rs = 6, ts = 24) { const k = `toro${r}_${t}_${rs}_${ts}`; return GEO[k] || (GEO[k] = new THREE.TorusGeometry(r, t, rs, ts)); }

// ----------------------------------------------------------------------------- materiais
function rampa(niveis) {
  const n = niveis.length, d = new Uint8Array(n * 4);
  niveis.forEach((v, i) => { const b = Math.round(clamp(v, 0, 1) * 255); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = b; d[i * 4 + 3] = 255; });
  const t = new THREE.DataTexture(d, n, 1, THREE.RGBAFormat);
  t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

const GLSL_HASH = `
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n21(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1.0,0.0)), f.x), mix(h21(i+vec2(0.0,1.0)), h21(i+vec2(1.0,1.0)), f.x), f.y); }
`;

// ----------------------------------------------------------------------------- padrões de piso (no shader, 1 draw call)
// Coordenadas polares com a costura apontando pro jardim (+Z), onde não há piso de pavilhão.
const PAD = { madeira: 1, ladrilho: 2, borracha: 3, pedra: 4, carpete: 5, deck: 6, concreto: 7 };
const GLSL_PISO = `
float ph21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float pn21(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(ph21(i), ph21(i+vec2(1.0,0.0)), f.x), mix(ph21(i+vec2(0.0,1.0)), ph21(i+vec2(1.0,1.0)), f.x), f.y); }
// linha suave em fract(x) perto de 0 — largura w (em unidades de x) + antisserrilhado aa
float junta(float x, float w, float aa){ float d = min(fract(x), 1.0 - fract(x)); return 1.0 - smoothstep(w, w + aa, d); }
vec3 padraoPiso(float k, vec3 P, float dist){
  float r = length(P.xz); float ang = atan(P.x, -P.z); float s = ang * 18.0;
  float aa = clamp(dist * 0.0016, 0.004, 0.08);
  float fade = 1.0 - smoothstep(22.0, 75.0, dist);
  vec3 m = vec3(1.0);
  if (k < 1.5) {               // madeira: tábuas tangenciais 0.19 x 1.4 m, desencontradas
    float v = r / 0.19; float lin = floor(v); float u = s / 1.4 + ph21(vec2(lin, 3.1)) ;
    float tab = floor(u); float h = ph21(vec2(tab, lin));
    m *= 0.9 + 0.16 * h;
    m *= 0.97 + 0.05 * pn21(vec2(s * 3.0, r * 40.0));
    float j = max(junta(v, 0.03, aa / 0.19), junta(u, 0.006, aa / 1.4));
    m *= 1.0 - 0.28 * j;
  } else if (k < 2.5) {        // ladrilho 0.6 m
    vec2 q = vec2(s, r) / 0.6; vec2 c = floor(q);
    m *= 0.95 + 0.07 * ph21(c);
    float j = max(junta(q.x, 0.02, aa / 0.6), junta(q.y, 0.02, aa / 0.6));
    m *= 1.0 - 0.22 * j;
  } else if (k < 3.5) {        // borracha de academia: placas 1 m + granulado
    vec2 q = vec2(s, r); 
    m *= 0.93 + 0.12 * ph21(floor(q * 38.0)) * (1.0 - smoothstep(4.0, 14.0, dist));
    float j = max(junta(q.x, 0.01, aa), junta(q.y, 0.01, aa));
    m *= 1.0 - 0.25 * j;
  } else if (k < 4.5) {        // pedra portuguesa / pavimento: placas 0.6 x 0.3 desencontradas (cartesiano)
    vec2 q = P.xz / vec2(0.62, 0.31); float lin = floor(q.y); q.x += 0.5 * mod(lin, 2.0);
    vec2 c = floor(q);
    m *= 0.94 + 0.09 * ph21(c);
    float j = max(junta(q.x, 0.012, aa / 0.62), junta(q.y, 0.025, aa / 0.31));
    m *= 1.0 - 0.18 * j;
  } else if (k < 5.5) {        // carpete
    m *= 0.95 + 0.08 * pn21(P.xz * 6.0) + 0.04 * ph21(floor(P.xz * 60.0)) * (1.0 - smoothstep(3.0, 9.0, dist));
  } else if (k < 6.5) {        // deck externo: réguas de 0.14 m paralelas à fachada
    float v = r / 0.14; float lin = floor(v);
    m *= 0.88 + 0.16 * ph21(vec2(lin, 7.0));
    m *= 0.97 + 0.05 * pn21(vec2(s * 2.0, r * 30.0));
    m *= 1.0 - 0.34 * junta(v, 0.06, aa / 0.14);
  } else {                     // concreto polido com juntas de 1.2 m
    vec2 q = vec2(s, r) / 1.2;
    m *= 0.97 + 0.05 * pn21(P.xz * 1.3);
    m *= 1.0 - 0.14 * max(junta(q.x, 0.006, aa / 1.2), junta(q.y, 0.006, aa / 1.2));
  }
  return mix(vec3(1.0), m, fade);
}
`;
function comPiso(material) {
  const ant = material.onBeforeCompile;
  material.onBeforeCompile = (sh, r) => {
    if (ant) ant(sh, r);
    sh.vertexShader = 'attribute float pad;\nvarying float vPad;\nvarying vec3 vPW;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      vPad = pad;
      vec4 pwPiso = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        pwPiso = instanceMatrix * pwPiso;
      #endif
      vPW = (modelMatrix * pwPiso).xyz;`);
    sh.fragmentShader = 'varying float vPad;\nvarying vec3 vPW;\n' + GLSL_PISO + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      if (vPad > 0.5) diffuseColor.rgb *= padraoPiso(vPad, vPW, length(vPW - cameraPosition));`);
  };
  material.customProgramCacheKey = () => 'piso' + (ant ? '+v' : '');
}

// ----------------------------------------------------------------------------- atlas das telas (monitores, quadros)
const CELULA = {
  codigo: 0, graficos: 1, mapa: 2, planilha: 3, emails: 4, audio: 5, cardapio: 6, logo: 7,
  estrelas: 8, servidores: 9, slide: 10, kanban: 11, chat: 12, console: 13, globo: 14, agenda: 15,
};
function uvCelula(k) {
  const col = k % 4, row = (k / 4) | 0, m = 3 / 1024;
  return [col / 4 + m, 1 - (row + 1) / 4 + m, 0.25 - 2 * m, 0.25 - 2 * m];
}
function desenharAtlas() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1024;
  const g = cv.getContext('2d');
  const F = 'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, sans-serif';
  const r = rng(77);
  const cel = (k, fn) => { g.save(); g.translate((k % 4) * 256, ((k / 4) | 0) * 256); g.beginPath(); g.rect(0, 0, 256, 256); g.clip(); fn(); g.restore(); };
  const txt = (t, x, y, s, c, w = 600, al = 'left') => { g.fillStyle = c; g.font = `${w} ${s}px ${F}`; g.textAlign = al; g.textBaseline = 'alphabetic'; g.fillText(t, x, y); };
  const ret = (x, y, w, h, c, rr = 0) => { g.fillStyle = c; if (!rr) { g.fillRect(x, y, w, h); return; } g.beginPath(); g.moveTo(x + rr, y); g.arcTo(x + w, y, x + w, y + h, rr); g.arcTo(x + w, y + h, x, y + h, rr); g.arcTo(x, y + h, x, y, rr); g.arcTo(x, y, x + w, y, rr); g.fill(); };

  cel(CELULA.codigo, () => {
    ret(0, 0, 256, 256, '#1d1f27'); ret(0, 0, 256, 18, '#2a2d38');
    [['#ff6b6b', 10], ['#ffd166', 24], ['#8bd17c', 38]].forEach(([c, x]) => { g.fillStyle = c; g.beginPath(); g.arc(x, 9, 4, 0, TAU); g.fill(); });
    const cs = ['#7aa2ff', '#f2a33a', '#c792ea', '#e6e1d6', '#ff8f6b', '#9ad07a'];
    for (let i = 0; i < 17; i++) {
      let x = 14 + (r() < 0.3 ? 16 : 0) + (r() < 0.2 ? 16 : 0);
      const y = 30 + i * 13;
      txt(String(i + 1), 4, y + 7, 8, '#555a6a', 500);
      const n = 1 + (r() * 4 | 0);
      for (let j = 0; j < n && x < 240; j++) { const w = 12 + r() * 46; ret(x, y, w, 6, cs[(r() * cs.length) | 0], 3); x += w + 6; }
    }
  });
  cel(CELULA.graficos, () => {
    ret(0, 0, 256, 256, '#f7f4ee'); txt('Visitas da semana', 14, 26, 15, '#2b2723', 700);
    ret(14, 36, 70, 22, '#ffe6c2', 6); txt('+38%', 22, 52, 13, '#c06a12', 700);
    for (let i = 0; i < 7; i++) { const h = 30 + r() * 110; ret(20 + i * 32, 230 - h, 20, h, i === 5 ? '#f2a33a' : '#c9bfae', 4); }
    g.strokeStyle = '#3d8bff'; g.lineWidth = 3; g.beginPath();
    for (let i = 0; i < 8; i++) { const x = 18 + i * 31, y = 150 - Math.sin(i * 0.9) * 26 - i * 6; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  });
  cel(CELULA.mapa, () => {
    ret(0, 0, 256, 256, '#e9efe1'); g.fillStyle = '#a9cce3';
    g.beginPath(); g.moveTo(0, 190); g.bezierCurveTo(70, 160, 120, 230, 256, 180); g.lineTo(256, 256); g.lineTo(0, 256); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 7;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(r() * 256, 0); g.lineTo(r() * 256, 256); g.stroke(); g.beginPath(); g.moveTo(0, r() * 200); g.lineTo(256, r() * 200); g.stroke(); }
    ret(30, 40, 50, 36, '#cfe2b8', 6); ret(150, 70, 60, 44, '#cfe2b8', 6);
    [[70, 110, '#e0566d'], [160, 60, '#f2a33a'], [120, 150, '#5b6ee1'], [200, 130, '#e0566d']].forEach(([x, y, c]) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill(); });
  });
  cel(CELULA.planilha, () => {
    ret(0, 0, 256, 256, '#ffffff'); ret(0, 0, 256, 22, '#3f8f4a'); txt('Leads · Costa Verde', 8, 16, 12, '#fff', 700);
    g.strokeStyle = '#dfe3e8'; g.lineWidth = 1;
    for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(0, 22 + i * 15); g.lineTo(256, 22 + i * 15); g.stroke(); }
    for (let j = 0; j < 5; j++) { g.beginPath(); g.moveTo(50 * j + 40, 22); g.lineTo(50 * j + 40, 256); g.stroke(); }
    for (let i = 0; i < 15; i++) for (let j = 0; j < 5; j++) if (r() < 0.8) ret(50 * j + (j ? 46 : 6), 27 + i * 15, 10 + r() * 28, 5, j === 4 && r() < 0.4 ? '#f2a33a' : '#9aa3ad', 2);
  });
  cel(CELULA.emails, () => {
    ret(0, 0, 256, 256, '#fbfaf7'); ret(0, 0, 60, 256, '#f0ece4');
    ['Entrada', 'Rascunhos', 'Enviados'].forEach((t, i) => txt(t, 8, 26 + i * 20, 10, i ? '#8a8378' : '#2b2723', i ? 500 : 700));
    for (let i = 0; i < 9; i++) {
      const y = 12 + i * 27; ret(68, y, 180, 23, i === 1 ? '#fff1dc' : '#ffffff', 5);
      g.fillStyle = ['#f2a33a', '#5b6ee1', '#e0566d', '#3f8f4a'][i % 4]; g.beginPath(); g.arc(80, y + 11, 6, 0, TAU); g.fill();
      ret(92, y + 5, 60 + r() * 50, 5, '#3a3631', 2); ret(92, y + 14, 100 + r() * 40, 4, '#b8b0a4', 2);
    }
  });
  cel(CELULA.audio, () => {
    ret(0, 0, 256, 256, '#17141f'); txt('transcrevendo…', 12, 26, 14, '#c9b6ff', 600);
    g.strokeStyle = '#9a6bff'; g.lineWidth = 2;
    for (let x = 8; x < 248; x += 4) { const h = 6 + Math.abs(Math.sin(x * 0.11) * Math.cos(x * 0.031)) * 46 * (0.5 + r()); g.beginPath(); g.moveTo(x, 90 - h); g.lineTo(x, 90 + h); g.stroke(); }
    for (let i = 0; i < 6; i++) { ret(12, 150 + i * 16, 40, 8, '#4b4362', 3); ret(60, 150 + i * 16, 60 + r() * 120, 8, i === 2 ? '#f2a33a' : '#e7e2f4', 3); }
  });
  cel(CELULA.cardapio, () => {
    ret(0, 0, 256, 256, '#2b2420');
    txt('CAFÉ DO CAMPUS', 128, 34, 19, '#f2c27a', 800, 'center');
    g.strokeStyle = '#f2c27a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(40, 44); g.lineTo(216, 44); g.stroke();
    [['Espresso', '6'], ['Pingado', '7'], ['Cappuccino', '11'], ['Pão de queijo', '5'], ['Bolo de fubá', '8'], ['Suco de caju', '9']].forEach(([a, b], i) => {
      txt(a, 24, 76 + i * 28, 15, '#f4ece0', 600); txt('R$ ' + b, 232, 76 + i * 28, 15, '#f2a33a', 700, 'right');
    });
  });
  cel(CELULA.logo, () => {
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#fffaf2'); gr.addColorStop(1, '#f3e6d2'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const sg = g.createRadialGradient(118, 92, 4, 128, 104, 44); sg.addColorStop(0, '#ffe7ad'); sg.addColorStop(0.6, '#f4a43c'); sg.addColorStop(1, '#ec8424');
    g.fillStyle = sg; g.beginPath(); g.arc(128, 104, 38, Math.PI, 0); g.fill();
    g.strokeStyle = '#f2a33a'; g.lineWidth = 5; g.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 7; g.beginPath(); g.moveTo(128 + Math.cos(a) * 48, 104 + Math.sin(a) * 48); g.lineTo(128 + Math.cos(a) * 60, 104 + Math.sin(a) * 60); g.stroke(); }
    g.strokeStyle = '#b8865a'; g.lineWidth = 3; g.beginPath(); g.ellipse(128, 108, 84, 20, 0, 0, TAU); g.stroke();
    txt('campus', 128, 172, 40, '#2b2723', 800, 'center');
    txt('· allan ·', 128, 202, 18, '#b07a4c', 600, 'center');
  });
  cel(CELULA.estrelas, () => {
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#0d1433'); gr.addColorStop(1, '#27346b'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2); }
    g.strokeStyle = '#8fa6ff'; g.lineWidth = 1.5; g.beginPath();
    [[40, 60], [80, 90], [120, 70], [160, 110], [200, 80]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    txt('Cruzeiro do Sul', 14, 236, 14, '#c9d3ff', 600);
  });
  cel(CELULA.servidores, () => {
    ret(0, 0, 256, 256, '#0f1720'); txt('servidores · ok', 12, 24, 14, '#9ad07a', 700);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) ret(14 + j * 29, 40 + i * 34, 24, 26, r() < 0.12 ? '#f2a33a' : '#2f6b3a', 4);
  });
  cel(CELULA.slide, () => {
    ret(0, 0, 256, 256, '#fffaf3'); ret(0, 0, 256, 6, '#e0566d');
    txt('Mercado · Costa Verde', 14, 34, 17, '#2b2723', 800); txt('preço do m² em Angra e Paraty', 14, 54, 11, '#8a8378', 500);
    g.strokeStyle = '#e0566d'; g.lineWidth = 3.5; g.beginPath();
    for (let i = 0; i < 9; i++) { const x = 20 + i * 27, y = 210 - i * 13 - Math.sin(i * 1.3) * 12; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.strokeStyle = '#5b6ee1'; g.lineWidth = 3; g.beginPath();
    for (let i = 0; i < 9; i++) { const x = 20 + i * 27, y = 220 - i * 8 - Math.cos(i) * 8; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  });
  cel(CELULA.kanban, () => {
    ret(0, 0, 256, 256, '#f4f1ea');
    ['A fazer', 'Fazendo', 'Feito'].forEach((t, j) => {
      txt(t, 10 + j * 84, 20, 12, '#5a544c', 700);
      for (let i = 0; i < 4 - j % 2; i++) ret(8 + j * 84, 30 + i * 52, 76, 44, ['#ffd98a', '#ffb4a8', '#bfe0a8', '#c7d3ff'][(i + j) % 4], 4);
    });
  });
  cel(CELULA.chat, () => {
    ret(0, 0, 256, 256, '#efe7dc');
    for (let i = 0; i < 6; i++) { const eu = i % 2 === 1; const w = 70 + r() * 90; ret(eu ? 246 - w : 10, 12 + i * 40, w, 30, eu ? '#d6f2c4' : '#ffffff', 10); }
  });
  cel(CELULA.console, () => {
    ret(0, 0, 256, 256, '#101318');
    for (let i = 0; i < 17; i++) { txt(i % 5 === 4 ? '✓ ok' : '$', 8, 20 + i * 14, 11, i % 5 === 4 ? '#9ad07a' : '#f2a33a', 600); ret(30, 12 + i * 14, 30 + r() * 180, 5, '#7c8798', 2); }
  });
  cel(CELULA.globo, () => {
    ret(0, 0, 256, 256, '#121a2c');
    g.strokeStyle = '#3d8bff'; g.lineWidth = 1.2;
    g.beginPath(); g.arc(128, 128, 90, 0, TAU); g.stroke();
    for (let i = 1; i < 4; i++) { g.beginPath(); g.ellipse(128, 128, 90 * i / 4, 90, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(128, 128, 90, 90 * i / 4, 0, 0, TAU); g.stroke(); }
    for (let i = 0; i < 26; i++) { g.fillStyle = r() < 0.5 ? '#f2a33a' : '#8fb3ff'; g.beginPath(); g.arc(60 + r() * 136, 60 + r() * 136, 2.5, 0, TAU); g.fill(); }
  });
  cel(CELULA.agenda, () => {
    ret(0, 0, 256, 256, '#ffffff'); txt('Hoje', 12, 28, 18, '#2b2723', 800);
    for (let i = 0; i < 6; i++) { ret(12, 44 + i * 34, 6, 26, ['#f2a33a', '#5b6ee1', '#e0566d'][i % 3], 3); ret(26, 48 + i * 34, 120 + r() * 90, 7, '#3a3631', 3); ret(26, 60 + i * 34, 80, 5, '#b8b0a4', 2); }
  });
  return cv;
}

function desenharRotulo(texto, acento) {
  const F = 'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, sans-serif';
  const s = 2; // escala de nitidez
  const tmp = document.createElement('canvas').getContext('2d');
  tmp.font = `700 ${46 * s}px ${F}`;
  const tw = tmp.measureText(texto).width;
  const h = 96 * s, w = Math.ceil(tw + 112 * s);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const rr = 34 * s, y0 = 10 * s, hh = h - 20 * s, x0 = 6 * s, ww = w - 12 * s;
  g.shadowColor = 'rgba(80,50,20,0.28)'; g.shadowBlur = 8 * s; g.shadowOffsetY = 3 * s;
  g.fillStyle = 'rgba(255,251,244,0.95)';
  g.beginPath(); g.moveTo(x0 + rr, y0); g.arcTo(x0 + ww, y0, x0 + ww, y0 + hh, rr); g.arcTo(x0 + ww, y0 + hh, x0, y0 + hh, rr); g.arcTo(x0, y0 + hh, x0, y0, rr); g.arcTo(x0, y0, x0 + ww, y0, rr); g.fill();
  g.shadowColor = 'transparent';
  g.fillStyle = acento; g.beginPath(); g.arc(x0 + 40 * s, h / 2, 13 * s, 0, TAU); g.fill();
  g.fillStyle = '#2b2723'; g.font = `700 ${46 * s}px ${F}`; g.textBaseline = 'middle';
  g.fillText(texto, x0 + 66 * s, h / 2 + 2 * s);
  return cv;
}

function desenharQuadroGrana() {
  const cv = document.createElement('canvas');
  cv.width = 768; cv.height = 432;
  const g = cv.getContext('2d');
  const F = 'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, sans-serif';
  const gr = g.createLinearGradient(0, 0, 0, 432); gr.addColorStop(0, '#2a211b'); gr.addColorStop(1, '#1b1613');
  g.fillStyle = gr; g.fillRect(0, 0, 768, 432);
  // moeda
  g.fillStyle = '#f2a33a'; g.beginPath(); g.arc(78, 78, 38, 0, TAU); g.fill();
  g.fillStyle = '#ffd690'; g.beginPath(); g.arc(78, 78, 28, 0, TAU); g.fill();
  g.fillStyle = '#b8701e'; g.font = `800 34px ${F}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('R$', 78, 80);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#fff4e2'; g.font = `800 50px ${F}`; g.fillText('Monetização', 136, 74);
  g.fillStyle = '#d9b48a'; g.font = `600 26px ${F}`; g.fillText('onde tá a grana · toca aqui', 138, 110);
  const barras = [['Avisos de leilão', 0.92], ['Licitações', 0.74], ['Parceiro local', 0.61], ['Compras públicas', 0.52]];
  barras.forEach(([t, v], i) => {
    const y = 170 + i * 62;
    g.fillStyle = '#3a3029'; g.beginPath(); g.roundRect ? g.roundRect(40, y, 688, 40, 12) : g.rect(40, y, 688, 40); g.fill();
    const cg = g.createLinearGradient(40, 0, 728, 0); cg.addColorStop(0, '#f2a33a'); cg.addColorStop(1, '#ffcf73');
    g.fillStyle = cg; g.beginPath(); g.roundRect ? g.roundRect(40, y, 688 * v, 40, 12) : g.rect(40, y, 688 * v, 40); g.fill();
    g.fillStyle = '#2a1c10'; g.font = `700 24px ${F}`; g.fillText(`${i + 1}. ${t}`, 56, y + 28);
  });
  return cv;
}

// ----------------------------------------------------------------------------- definição das zonas
// a0/a1 em graus (x = r cos a, z = r sin a; a=90 é o lado da câmera inicial, +Z).
const ZONAS_DEF = [
  { id: 'recepcao', nome: 'Recepção', a0: 118, a1: 143, r0: 14.5, r1: 21.5, fundo: 'vidro', piso: '#eee6d8', pad: PAD.ladrilho, acento: '#d9a441', luz: '#ffe2b0' },
  { id: 'cafe', nome: 'Café', a0: 143, a1: 174, r0: 14.5, r1: 22, fundo: 'parede', corParede: '#c9784f', piso: '#d9b48a', pad: PAD.madeira, acento: '#b5713e', luz: '#ffd49a' },
  { id: 'academia', nome: 'Academia', a0: 174, a1: 213, r0: 14.5, r1: 23.5, fundo: 'vidro', piso: '#dcc19a', pad: PAD.madeira, acento: '#ff7a3d', luz: '#fff0d8' },
  { id: 'dormitorio', nome: 'Dormitório', a0: 213, a1: 252, r0: 14.5, r1: 23.5, fundo: 'parede', corParede: '#d9b48f', piso: '#ead9bf', pad: PAD.carpete, acento: '#b48cd8', luz: '#ffcf8f' },
  { id: 'escritorio-aberto', nome: 'Escritório', a0: 252, a1: 288, r0: 14.5, r1: 22, fundo: 'parede', corParede: '#f2eee7', piso: '#e2cba6', pad: PAD.madeira, acento: '#f2a33a', luz: '#fff0d8' },
  { id: 'biblioteca', nome: 'Biblioteca', a0: 288, a1: 318, r0: 14.5, r1: 22, fundo: 'parede', corParede: '#a8774c', piso: '#c99d70', pad: PAD.madeira, acento: '#c4553a', luz: '#ffd49a' },
  { id: 'auditorio', nome: 'Auditório', a0: 318, a1: 347, r0: 14.5, r1: 22, fundo: 'parede', corParede: '#3d414b', piso: '#9a5865', pad: PAD.carpete, acento: '#e0566d', luz: '#fff0d8' },
  { id: 'estudio', nome: 'Estúdio', a0: 347, a1: 376, r0: 14.5, r1: 22, fundo: 'parede', corParede: '#ece6f6', piso: '#5a5369', pad: PAD.carpete, acento: '#9a6bff', luz: '#e9dcff' },
  { id: 'sala-servidores', nome: 'Sala dos servidores', rotulo: 'Servidores', a0: 16, a1: 40, r0: 14.5, r1: 22, fundo: 'vidro', fechado: true, piso: '#d3d8e0', pad: PAD.ladrilho, acento: '#3d8bff', luz: '#dbe8ff' },
  { id: 'observatorio', nome: 'Observatório', a0: 40, a1: 62, r0: 14.5, r1: 22.5, aberto: true, piso: '#e6e0d6', pad: PAD.concreto, acento: '#5b6ee1', luz: '#dfe4ff' },
];
const ZONA_DA_ATIVIDADE = {
  computador: 'escritorio-aberto', 'telefone-andando': 'escritorio-aberto',
  'biblioteca-lendo': 'biblioteca', 'arquivo-cartas': 'biblioteca',
  observatorio: 'observatorio', 'fones-transcrevendo': 'estudio', 'gestos-holograma': 'estudio',
  'quadro-reuniao': 'auditorio', recepcao: 'recepcao', 'fotografando-campo': 'jardim',
  'sala-servidores': 'sala-servidores', 'caixa-registradora': 'cafe',
  esteira: 'academia', halteres: 'academia', yoga: 'academia', alongando: 'academia', bicicleta: 'academia',
  cafe: 'cafe', 'lendo-banco': 'jardim', 'caminhando-jardim': 'jardim', dormindo: 'dormitorio',
};
const R_ANEL_IN = 29, R_ANEL_OUT = 39, H_ANEL = 8;
const LAGO = { cx: 0, cz: 19.2, rx: 5.2, rz: 3.4 };
const LAGO_LOOP = { rx: 7.4, rz: 5.6 };
function lagoPonto(t, extra = 0) {
  const k = 1 + 0.1 * Math.sin(2 * t + 0.6) + 0.06 * Math.sin(3 * t - 1.1);
  return [LAGO.cx + (LAGO.rx * k + extra) * Math.cos(t), LAGO.cz + (LAGO.rz * k + extra) * Math.sin(t)];
}

// ===================================================================================== criarMundo
export function criarMundo(scene, renderer, opcoes = {}) {
  const PC = (opcoes && opcoes.qualidade) === 'pc';
  const LIN = !!(renderer && renderer.outputEncoding === THREE.sRGBEncoding);
  const K = (h) => { const c = new THREE.Color(h); return LIN ? c.convertSRGBToLinear() : c; };
  const raiz = new THREE.Group();
  raiz.name = 'campus-mundo';
  scene.add(raiz);
  if (renderer && renderer.shadowMap) renderer.shadowMap.enabled = true;

  const anima = []; // funções (dt, t) chamadas no update
  const objetosClicaveis = [];            // quadro da grana etc. (userData.acao)
  const canteiros = [];                   // áreas de flores (preenchidas pelas zonas, instanciadas no fim)
  const holoPos = new THREE.Vector3(0, 1.5, 0); // centro do holograma do estúdio
  const tempoU = { value: 0 };
  const noiteU = { value: 0 };

  // ------------------------------------------------------------------ lotes
  const Lsol = new Lote({ ao: true, pad: true });   // sólidos que fazem e recebem sombra
  const Lchao = new Lote({ pad: true });             // chão, caminhos, terreno (só recebe)
  const Ltela = new Lote({ uv: true });  // telas (atlas)
  const Lluz = new Lote();               // lâmpadas, faixas de luz (sem iluminação)
  const Lvid = new Lote({ alfa: true }); // vidro dos pavilhões
  const Lpoca = new Lote();              // poças de luz à noite (aditivo)
  const ledsP = [], ledsC = [], ledsF = []; // LEDs dos racks

  // atalhos de primitivas num quadro F (y = base)
  const bx = (L, F, x, y, z, w, h, d, c, ry = 0, rx = 0, rz = 0) => L.add(gCaixa(), F.M(x, y + h / 2, z, ry, w, h, d, rx, rz), c);
  const cl = (L, F, x, y, z, r, h, c, seg = 12, rx = 0, rz = 0, ry = 0) => L.add(gCil(seg), F.M(x, y + h / 2, z, ry, r, h, r, rx, rz), c);
  const es = (L, F, x, y, z, rx_, ry_, rz_, c, w = 12, h = 8) => L.add(gEsfera(w, h), F.M(x, y, z, 0, rx_, ry_, rz_), c);
  const tela = (F, x, y, z, w, h, cel, ry = 0, rx = 0) => Ltela.add(gPlano(), F.M(x, y, z, ry, w, h, 1, rx), '#ffffff', uvCelula(cel));
  const grad = (c0, c1, y0, y1) => { const A = corS(c0), B = corS(c1), C = new THREE.Color(); return (pw, nw, pl) => C.copy(A).lerp(B, smooth(y0, y1, pl.y)); };

  // ------------------------------------------------------------------ postos e navegação
  const postos = [];
  const nos = [];        // [{x,z}]
  const obst = [];       // segmentos [ax,az,bx,bz,...] (Float)
  const zonas = {};

  function posto(atividade, zona, F, x, z, ry, o = {}) {
    const y = o.y || 0;
    const pos = F.P(x, y, z);
    const ap = o.aprox ? F.xz(o.aprox[0], o.aprox[1]) : [pos.x, pos.z];
    postos.push({ id: postos.length, atividade, zona, pos, rotY: F.R(ry), aprox: new THREE.Vector3(ap[0], 0, ap[1]), ocupante: null });
  }
  const no = (F, x, z) => { const w = F.xz(x, z); nos.push({ x: w[0], z: w[1] }); };
  const barreira = (F, x0, z0, x1, z1) => { const a = F.xz(x0, z0), b = F.xz(x1, z1); obst.push(a[0], a[1], b[0], b[1]); };
  const barreiraMundo = (ax, az, bx_, bz) => obst.push(ax, az, bx_, bz);
  function barreiraArco(r, a0, a1, seg) {
    for (let i = 0; i < seg; i++) {
      const A = a0 + (a1 - a0) * i / seg, B = a0 + (a1 - a0) * (i + 1) / seg;
      obst.push(r * Math.cos(A), r * Math.sin(A), r * Math.cos(B), r * Math.sin(B));
    }
  }
  function barreiraCaixa(F, x, z, w, d) { // retângulo local
    barreira(F, x - w / 2, z - d / 2, x + w / 2, z - d / 2); barreira(F, x + w / 2, z - d / 2, x + w / 2, z + d / 2);
    barreira(F, x + w / 2, z + d / 2, x - w / 2, z + d / 2); barreira(F, x - w / 2, z + d / 2, x - w / 2, z - d / 2);
  }

  // ------------------------------------------------------------------ luz e céu
  const hemi = new THREE.HemisphereLight(0xffffff, 0x777777, 0.6);
  const sol = new THREE.DirectionalLight(0xffffff, 0.8);
  sol.castShadow = true;
  const SM = PC ? 2048 : 1024;
  sol.shadow.mapSize.set(SM, SM);
  Object.assign(sol.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 30, far: 170 });
  sol.shadow.bias = -0.0005;
  sol.shadow.normalBias = PC ? 0.03 : 0.045;
  sol.target.position.set(0, 0, 0);
  raiz.add(hemi, sol, sol.target);

  const fog = new THREE.Fog(0xffe2bd, 120, 560);
  scene.fog = fog;
  scene.background = new THREE.Color(0xffe2bd);

  const ceuU = {
    uTopo: { value: K('#6f9fe0') }, uHor: { value: K('#ffe0b8') }, uBaixo: { value: K('#d9c8a8') },
    uSolDir: { value: new THREE.Vector3(0.7, 0.4, 0.5).normalize() }, uSolCor: { value: K('#ffd9a8') },
    uNoite: noiteU, uT: tempoU,
  };
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({
    uniforms: ceuU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); p.z = p.w * 0.9999; gl_Position = p; }`,
    fragmentShader: `uniform vec3 uTopo, uHor, uBaixo, uSolDir, uSolCor; uniform float uNoite, uT; varying vec3 vD;
      ${GLSL_HASH}
      void main(){
        vec3 d = normalize(vD); float h = d.y;
        vec3 c = h > 0.0 ? mix(uHor, uTopo, pow(clamp(h, 0.0, 1.0), 0.5)) : mix(uHor, uBaixo, clamp(-h * 5.0, 0.0, 1.0));
        float s = max(dot(d, uSolDir), 0.0);
        c += uSolCor * (pow(s, 900.0) * 2.5 + pow(s, 14.0) * 0.28 * (1.0 - 0.7 * uNoite));
        c = mix(c, uSolCor, pow(s, 3.0) * smoothstep(0.25, -0.05, h) * 0.25 * (1.0 - uNoite));
        if (h > 0.0) {
          vec2 uv = d.xz / (h + 0.18) * 1.6 + vec2(uT * 0.006, uT * 0.002);
          float n = n21(uv) * 0.55 + n21(uv * 2.13 + 3.1) * 0.3 + n21(uv * 4.7 - 1.3) * 0.15;
          float nuv = smoothstep(0.56, 0.82, n) * smoothstep(0.02, 0.3, h);
          vec3 cn = mix(vec3(1.0, 0.98, 0.95), uSolCor, 0.35) * (1.0 - 0.75 * uNoite) + uHor * 0.15;
          c = mix(c, cn, nuv * 0.7);
          vec3 q = floor(d * 220.0);
          float st = step(0.9965, h21(q.xy + q.z * 17.0)) * smoothstep(0.05, 0.3, h);
          c += vec3(st) * uNoite * 0.9;
        }
        gl_FragColor = vec4(c, 1.0);
        #include <encodings_fragment>
      }`,
  }));
  ceu.renderOrder = -1000;
  ceu.frustumCulled = false;
  ceu.onBeforeRender = (r, s, cam) => {
    ceu.position.copy(cam.position);
    ceu.scale.setScalar(Math.min((cam.far || 900) * 0.85, 800));
    ceu.updateMatrixWorld();
  };
  raiz.add(ceu);

  // ------------------------------------------------------------------ materiais
  const rampaMundo = rampa([0.34, 0.37, 0.42, 0.62, 0.84, 0.95, 1.0, 1.0]);
  const rampaFolha = rampa([0.36, 0.4, 0.5, 0.72, 0.9, 1.0, 1.0, 1.0]);
  const matSol = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: rampaMundo });
  const matChao = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: rampaMundo });
  comPiso(matSol); comPiso(matChao);
  const matFolha = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: rampaFolha });
  const matTronco = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: rampaMundo });
  const matFlor = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: rampaFolha });
  // balanço das copas (vento)
  const ventoU = tempoU;
  const comVento = (m, forca) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uT = ventoU;
      sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float fase = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;
          float k = max(position.y - 1.2, 0.0) * ${forca.toFixed(3)};
          transformed.x += sin(uT * 1.3 + fase) * k;
          transformed.z += cos(uT * 1.1 + fase * 1.3) * k * 0.7;
        #endif`);
    };
  };
  comVento(matFolha, 0.035);

  // ===================================================================== CHÃO DO PÁTIO
  const corGrama = (() => {
    const a = corS('#7fb04c'), b = corS('#5f9a3d'), c = corS('#9cc25d'), d = corS('#b9b86a'), out = new THREE.Color();
    return (pw) => {
      const n = fbm(pw.x * 0.09 + 11, pw.z * 0.09 - 4), m = ruido(pw.x * 0.45, pw.z * 0.45);
      out.copy(a).lerp(b, smooth(0.35, 0.75, n)).lerp(c, smooth(0.55, 0.95, m) * 0.5);
      const r = Math.hypot(pw.x, pw.z);
      if (r > 34) out.lerp(d, smooth(0.6, 0.9, fbm(pw.x * 0.03, pw.z * 0.03)) * 0.55);
      return out;
    };
  })();
  const corPedra = (base, var_ = 0.05) => { const A = corS(base), C = new THREE.Color(); return (pw) => { const n = (ruido(pw.x * 0.8, pw.z * 0.8) - 0.5) * var_; return C.setRGB(A.r + n, A.g + n, A.b + n * 0.8); }; };

  // gramado do pátio (y = -0.03)
  Lchao.add(discoPolar(PC ? 44 : 30, PC ? 160 : 112, (t) => lerp(4.9, 29.3, Math.pow(t, 0.9)), (x, z) => -0.03), new THREE.Matrix4(), corGrama);

  // praça central: anéis de pedra, inlay âmbar e estrela
  {
    const faixas = [[0, 1.0, '#efe6d6'], [1.0, 1.16, '#e7a246'], [1.16, 2.3, '#e6dac6'], [2.3, 2.42, '#f4eee3'], [2.42, 3.6, '#ece2d1'], [3.6, 3.72, '#d9cbb3'], [3.72, 5.0, '#e8dece'], [5.0, 5.25, '#f6f2ea']];
    Lchao.padrao(PAD.pedra, () => faixas.forEach(([a, b, c]) => Lchao.add(setor(a, b, 0, TAU, -0.08, 0.0, 72, { dentro: false }), new THREE.Matrix4(), corPedra(c, 0.03))));
    // estrela-rosa-dos-ventos (latão), bem rente
    const sh = new THREE.Shape();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 0.22 : (i % 4 === 0 ? 0.78 : 0.45); const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
    const est = new THREE.ShapeGeometry(sh);
    Lchao.add(est, mat(0, 0.004, 0, 0, 1, 1, 1, -Math.PI / 2), '#d29a45');
    Lluz.add(setor(1.04, 1.12, 0, TAU, 0.006, 0.006, 72, { fora: false, dentro: false }), new THREE.Matrix4(), '#ffbe5c');
  }
  // caminho em anel (r = 11) e radiais
  const corCaminho = corPedra('#ebe2d1', 0.035);
  const caminhoChao = (geo, cor = corCaminho) => Lchao.padrao(PAD.pedra, () => Lchao.add(geo, new THREE.Matrix4(), cor));
  {
    const anel = []; for (let i = 0; i < 128; i++) { const a = i / 128 * TAU; anel.push([11 * Math.cos(a), 11 * Math.sin(a)]); }
    caminhoChao(faixa(anel, 2.4, null, true, 0.08));
    // radiais da praça até o anel
    [0, 90, 180, 270].forEach((g) => { const a = g * DEG; caminhoChao(faixa([[5.1 * Math.cos(a), 5.1 * Math.sin(a)], [9.9 * Math.cos(a), 9.9 * Math.sin(a)]], 2.0, null, false, 0.08)); });
    // calçada junto ao prédio (pátio) e por fora
    caminhoChao(setor(26.9, 29.1, 0, TAU, -0.08, 0.0, 128, { fora: false }), corPedra('#e6dccb', 0.03));
    caminhoChao(setor(38.9, 42.2, 0, TAU, -0.08, 0.0, 128, { dentro: false }), corPedra('#e6dccb', 0.03));
  }

  // ===================================================================== PRÉDIO EM ANEL
  const SEG_ANEL = PC ? 256 : 176;
  const anelU = {
    uTopo: { value: K('#6f9fe0') }, uHor: { value: K('#ffe0b8') }, uChao: { value: K('#8fa86a') },
    uSolDir: ceuU.uSolDir, uSolCor: ceuU.uSolCor, uInterior: { value: K('#69686a') }, uLuz: { value: K('#ffd9a0') },
    uMont: { value: K('#f3f1ec') }, uNoite: noiteU, uT: tempoU,
  };
  {
    const g1 = paredeArco(R_ANEL_IN, 0, TAU, 0, H_ANEL, SEG_ANEL, -1);
    const g2 = paredeArco(R_ANEL_OUT, 0, TAU, 0, H_ANEL, SEG_ANEL, 1);
    const L = new Lote(); L.add(g1, new THREE.Matrix4(), '#ffffff'); L.add(g2, new THREE.Matrix4(), '#ffffff');
    // teatro redondo no morro (lá fora) usa o mesmo vidro
    const teatro = new Quadro(-62, -50, 0);
    L.add(paredeArco(8, 0, TAU, 0, 3.6, 64, 1), teatro.m.clone().multiply(mat(0, alturaFora(-62, -50) - 0.2, 0)), '#ffffff');
    const um = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
    Object.assign(um, anelU);
    const matAnel = new THREE.ShaderMaterial({
      uniforms: um, fog: true, extensions: { derivatives: true },
      vertexShader: `varying vec3 vW; varying vec3 vN;
        #include <fog_pars_vertex>
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
          vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform vec3 uTopo, uHor, uChao, uSolDir, uSolCor, uInterior, uLuz, uMont; uniform float uNoite, uT;
        varying vec3 vW; varying vec3 vN;
        ${GLSL_HASH}
        #include <fog_pars_fragment>
        void main(){
          vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
          float ndv = clamp(dot(N, V), 0.0, 1.0);
          vec3 R = reflect(-V, N);
          vec3 refl = R.y > 0.0 ? mix(uHor, uTopo, pow(R.y, 0.55)) : mix(uHor, uChao, clamp(-R.y * 3.0, 0.0, 1.0));
          refl += uSolCor * pow(max(dot(R, uSolDir), 0.0), 60.0) * 0.9;
          float r = length(vW.xz); float s = atan(vW.z, vW.x) * r; float y = vW.y;
          float pf = y / 2.7; float fy = fract(pf); float andar = floor(pf);
          float bx = s / 1.6; float baia = floor(bx); float fx = fract(bx);
          vec3 inte = uInterior * (0.5 + 0.5 * smoothstep(0.25, 0.95, fy));
          inte += uLuz * smoothstep(0.84, 0.97, fy) * 0.35;
          float hb = h21(vec2(baia, andar));
          float vulto = step(0.6, hb) * step(0.06, fy) * step(fy, 0.5) * step(0.3, fx) * step(fx, 0.7);
          inte *= 1.0 - 0.4 * vulto;
          float aceso = step(0.36, h21(vec2(baia * 1.7 + 3.0, andar + 3.1)));
          inte = mix(inte, uLuz * (0.7 + 0.4 * smoothstep(0.1, 0.9, fy)), uNoite * aceso);
          float fres = (0.3 + 0.7 * pow(1.0 - ndv, 2.5)) * (1.0 - 0.8 * uNoite);
          vec3 c = mix(inte, refl, fres);
          c += (smoothstep(0.75, 1.0, sin(s * 0.05 - y * 0.12 + uT * 0.03)) * 0.07) * (1.0 - uNoite);
          float d = min(fx, 1.0 - fx); float aa = fwidth(bx) * 1.3;
          float mont = 1.0 - smoothstep(0.022, 0.022 + aa, d);
          c = mix(c, uMont * (0.6 + 0.4 * max(dot(N, uSolDir), 0.0)) * (1.0 - 0.65 * uNoite), mont * 0.9);
          c *= mix(0.55, 1.0, smoothstep(0.0, 0.18, y));
          gl_FragColor = vec4(c, 1.0);
          #include <encodings_fragment>
          #include <fog_fragment>
        }`,
    });
    const vidroAnel = new THREE.Mesh(L.build(LIN), matAnel);
    vidroAnel.receiveShadow = false;
    raiz.add(vidroAnel);

    // marquises (lajes salientes) e cobertura
    const branco = '#f3f1ec';
    [2.7, 5.4].forEach((y) => {
      Lsol.add(setor(28.05, 29.0, 0, TAU, y - 0.08, y + 0.08, SEG_ANEL, { base: true }), new THREE.Matrix4(), branco);
      Lsol.add(setor(39.0, 39.95, 0, TAU, y - 0.08, y + 0.08, SEG_ANEL, { base: true }), new THREE.Matrix4(), branco);
    });
    const corTeto = (() => { const W = corS(branco), G = corS('#b9bcbf'), C = new THREE.Color(); return (pw, nw) => { const r = Math.hypot(pw.x, pw.z); return nw.y > 0.5 && r > 28.9 && r < 39.1 ? C.copy(G) : W; }; })();
    Lsol.add(setor(27.3, 40.7, 0, TAU, 7.95, 8.38, SEG_ANEL, { base: true }), new THREE.Matrix4(), corTeto);
    // brises verticais reais a cada 4 baias (sombra e profundidade); as finas vêm no shader
    const nIn = Math.round(TAU * R_ANEL_IN / 6.4), nOut = Math.round(TAU * R_ANEL_OUT / 6.4);
    for (let i = 0; i < nIn; i++) { const a = (i + 0.5) / nIn * TAU; Lsol.add(gCaixa(), mat((R_ANEL_IN - 0.3) * Math.cos(a), 4.0, (R_ANEL_IN - 0.3) * Math.sin(a), Math.atan2(Math.cos(a), Math.sin(a)), 0.14, 8.0, 0.6), branco); }
    for (let i = 0; i < nOut; i++) { const a = (i + 0.5) / nOut * TAU; Lsol.add(gCaixa(), mat((R_ANEL_OUT + 0.3) * Math.cos(a), 4.0, (R_ANEL_OUT + 0.3) * Math.sin(a), Math.atan2(Math.cos(a), Math.sin(a)), 0.14, 8.0, 0.6), branco); }
    // teatro: cobertura em disco
    const yT = alturaFora(-62, -50) - 0.2;
    Lsol.add(setor(0, 8.7, 0, TAU, yT + 3.6, yT + 3.85, 64, { base: true }), mat(-62, 0, -50), '#e8e8e6');
    Lsol.add(setor(7.0, 7.05, 0, TAU, yT, yT + 3.6, 64), mat(-62, 0, -50), '#d8d4cc');
    Lchao.add(setor(0, 10.5, 0, TAU, yT - 0.3, yT + 0.02, 48, { dentro: false }), mat(-62, 0, -50), corPedra('#e4dac8', 0.04));

    // painéis solares (instanciados)
    const linhas = [30.45, 32.7, 34.95, 37.2];
    const mats = [];
    linhas.forEach((r) => { const n = Math.floor(TAU * r / 2.45); for (let i = 0; i < n; i++) mats.push([r, (i + 0.5) / n * TAU]); });
    const painel = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhongMaterial({ color: K('#27344a'), specular: K('#7d8fb0'), shininess: 60 }), mats.length);
    mats.forEach(([r, a], i) => painel.setMatrixAt(i, mat(r * Math.cos(a), 8.46, r * Math.sin(a), Math.atan2(Math.cos(a), Math.sin(a)), (TAU * r / Math.floor(TAU * r / 2.45)) - 0.16, 0.08, 2.0, -0.06)));
    painel.instanceMatrix.needsUpdate = true;
    painel.castShadow = false; painel.receiveShadow = false;
    raiz.add(painel);
  }

  // ===================================================================== TERRENO DE FORA
  function alturaFora(x, z) {
    const r = Math.hypot(x, z);
    const k = smooth(47, 80, r);
    if (k <= 0) return -0.03;
    let h = k * (3.2 * fbm(x * 0.018 + 3.1, z * 0.018 - 7.3) - 1.1);
    h += smooth(140, 380, r) * 26 * (fbm(x * 0.006 - 2, z * 0.006 + 5) - 0.35);
    const estrada = Math.abs(r - 89);
    if (estrada < 9) h = lerp(h, k * 0.3, 1 - smooth(4, 9, estrada)); // plano da estrada
    return h - 0.03;
  }
  Lchao.add(discoPolar(PC ? 46 : 34, PC ? 128 : 96, (t) => 41.8 + Math.pow(t, 1.9) * 460, alturaFora), new THREE.Matrix4(), corGrama);
  {
    // estrada perimetral e passeio sinuoso
    const est = [], linha = [], passeio = [];
    for (let i = 0; i < 160; i++) { const a = i / 160 * TAU; est.push([89 * Math.cos(a), 89 * Math.sin(a)]); }
    for (let i = 0; i < 160; i++) { const a = i / 160 * TAU; const r = 58 + 3.5 * Math.sin(a * 3 + 0.7); passeio.push([r * Math.cos(a), r * Math.sin(a)]); }
    Lchao.add(faixa(est, 7.0, (x, z) => alturaFora(x, z) + 0.07, true, 0.3), new THREE.Matrix4(), corPedra('#6b6d70', 0.03));
    caminhoChao(faixa(passeio, 2.0, (x, z) => alturaFora(x, z) + 0.06, true, 0.25));
    // faixa tracejada
    for (let i = 0; i < 120; i += 1) {
      if (i % 2) continue;
      const a0 = i / 120 * TAU, a1 = (i + 0.6) / 120 * TAU;
      linha.length = 0; for (let k = 0; k <= 3; k++) { const a = lerp(a0, a1, k / 3); linha.push([89 * Math.cos(a), 89 * Math.sin(a)]); }
      Lchao.add(faixa(linha, 0.22, (x, z) => alturaFora(x, z) + 0.09, false, 0), new THREE.Matrix4(), '#f1ead8');
    }
    // morros no horizonte (um aceno ao Rio: Pão de Açúcar, Urca e a serra)
    const morro = (x, z, r, h, perfil, cor, rot = 0, sx = 1) => {
      const pts = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(Math.max(0.001, r * perfil(t)), h * t)); }
      const g = new THREE.LatheGeometry(pts, 14);
      g.computeVertexNormals();
      Lchao.add(g, mat(x, alturaFora(x, z) - 3, z, rot, sx, 1, 1), grad(cor, '#8fae84', 0, h));
    };
    const domo = (t) => Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.2)));
    const cone = (t) => Math.pow(1 - t, 1.3);
    morro(-205, 250, 46, 88, domo, '#4f7a4f', 0.4, 0.8);   // Pão de Açúcar
    morro(-160, 268, 40, 46, domo, '#567f52', 0.2, 1.2);   // Urca
    const serra = rng(91);
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * TAU + serra() * 0.2; const r = 330 + serra() * 70;
      morro(r * Math.cos(a), r * Math.sin(a), 60 + serra() * 60, 30 + serra() * 55, cone, '#5d7f5a', serra() * 3, 1 + serra());
    }
  }

  // ===================================================================== PAVILHÕES
  const rotulos = [];
  const vidroTint = '#dceaf2';
  function pavilhao(def) {
    const r0 = def.r0, r1 = def.r1, H = 3.3;
    const a0 = (def.a0 + 1.5) * DEG, a1 = (def.a1 - 1.5) * DEG, ac = (def.a0 + def.a1) / 2 * DEG;
    const rc = (r0 + r1) / 2, d = r1 - r0, ha = (def.a1 - def.a0) / 2 * DEG - 1.5 * DEG;
    const F = new Quadro(rc * Math.cos(ac), rc * Math.sin(ac), Math.atan2(-Math.cos(ac), -Math.sin(ac)));
    const seg = Math.max(6, Math.round((def.a1 - def.a0) / 4));
    const W = new THREE.Matrix4();
    const branco = '#f4f2ed';
    // piso e borda branca
    Lsol.padrao(def.pad || 0, () => Lsol.add(setor(r0, r1, a0, a1, -0.14, 0.0, seg), W, corPedra(def.piso, 0.012)));
    Lchao.add(setor(r0 - 0.16, r1 + 0.16, a0 - 0.16 / r0, a1 + 0.16 / r0, -0.16, -0.012, seg), W, '#f2eee6');
    // luz de piso à noite
    Lpoca.add(new THREE.CircleGeometry(1, 24), F.M(0, 0.02, 0, 0, d * 0.5, d * 0.5, 1, -Math.PI / 2), (pw, nw, pl) => { const k = 1 - Math.min(1, Math.hypot(pl.x, pl.y)); return new THREE.Color().copy(corS(def.luz)).multiplyScalar(k * k); });
    zonas[def.id] = { nome: def.nome, centro: F.P(0, 0, 0), raio: Math.min(d, 2 * rc * Math.sin(ha)) * 0.5 };

    if (!def.aberto) {
      // colunas finas
      const col = (r, a) => cl(Lsol, MUNDO, r * Math.cos(a), 0, r * Math.sin(a), 0.07, H, branco, 10);
      const e0 = 0.18 / r0, e1 = 0.18 / r1;
      col(r0 + 0.18, a0 + e0); col(r0 + 0.18, a1 - e0); col(r1 - 0.18, a0 + e1); col(r1 - 0.18, a1 - e1);
      if (def.fundo === 'vidro') col(r1 - 0.18, ac);
      // cobertura: moldura branca + vidro + vigas
      // cobertura: moldura branca fina + vidro + uma viga central (pra ver as agentes lá dentro de cima)
      const ov = 0.18, mi = 0.22;
      Lsol.add(setor(r1 - mi, r1 + ov, a0 - ov / r1, a1 + ov / r1, H, H + 0.16, seg, { base: true }), W, branco);
      Lsol.add(setor(r0 - ov, r0 + mi, a0 - ov / r0, a1 + ov / r0, H, H + 0.16, seg, { base: true }), W, branco);
      Lsol.add(setor(r0 + mi, r1 - mi, a0 - ov / rc, a0 + mi / rc, H, H + 0.16, 2, { base: true }), W, branco);
      Lsol.add(setor(r0 + mi, r1 - mi, a1 - mi / rc, a1 + ov / rc, H, H + 0.16, 2, { base: true }), W, branco);
      Lsol.add(setor(r0 + mi, r1 - mi, ac - 0.05 / rc, ac + 0.05 / rc, H + 0.03, H + 0.12, 1, { base: true }), W, branco);
      // filete na cor da zona (fachada da frente)
      Lsol.add(setor(r0 - ov - 0.012, r0 - ov, a0 - ov / r0 + 0.004, a1 + ov / r0 - 0.004, H + 0.04, H + 0.12, seg, { topo: false, dentro: false, pontas: false }), W, def.acento);
      Lvid.add(setor(r0 + mi, r1 - mi, a0 + mi / rc, a1 - mi / rc, H + 0.1, H + 0.1, seg, { fora: false, dentro: false, pontas: false }), W, vidroTint, null, 0.45);
      // vidros: laterais, fundo (se vidro), frente (retornos ou fechada com porta)
      const P = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
      const vidroReto = (p, q) => { Lvid.add(paredeReta(p, q, 0.04, H), W, vidroTint, null, 1); };
      vidroReto(P(r0 + 0.05, a0 + 0.05 / r0), P(r1 - 0.05, a0 + 0.05 / r1));
      vidroReto(P(r0 + 0.05, a1 - 0.05 / r0), P(r1 - 0.05, a1 - 0.05 / r1));
      barreiraMundo(...P(r0, a0), ...P(r1, a0)); barreiraMundo(...P(r0, a1), ...P(r1, a1));
      barreiraArco(r1 - 0.1, a0, a1, seg);
      if (def.fundo === 'vidro') Lvid.add(paredeArco(r1 - 0.05, a0, a1, 0.04, H, seg, 1), W, vidroTint, null, 1);
      else Lsol.add(setor(r1 - 0.2, r1, a0, a1, 0, H, seg), W, def.corParede);
      const ret = 0.75 / r0;
      if (def.fechado) {
        const porta = 0.85 / r0;
        Lvid.add(paredeArco(r0 + 0.05, a0, ac - porta, 0.04, H, seg, -1), W, vidroTint, null, 1);
        Lvid.add(paredeArco(r0 + 0.05, ac + porta, a1, 0.04, H, seg, -1), W, vidroTint, null, 1);
        barreiraArco(r0 + 0.05, a0, ac - porta, 4); barreiraArco(r0 + 0.05, ac + porta, a1, 4);
        cl(Lsol, MUNDO, (r0 + 0.05) * Math.cos(ac - porta), 0, (r0 + 0.05) * Math.sin(ac - porta), 0.05, H, branco, 8);
        cl(Lsol, MUNDO, (r0 + 0.05) * Math.cos(ac + porta), 0, (r0 + 0.05) * Math.sin(ac + porta), 0.05, H, branco, 8);
      } else {
        Lvid.add(paredeArco(r0 + 0.05, a0, a0 + ret, 0.04, H, 2, -1), W, vidroTint, null, 1);
        Lvid.add(paredeArco(r0 + 0.05, a1 - ret, a1, 0.04, H, 2, -1), W, vidroTint, null, 1);
        barreiraArco(r0 + 0.05, a0, a0 + ret, 1); barreiraArco(r0 + 0.05, a1 - ret, a1, 1);
      }
      // montantes (perfis finos) nos vidros
      const mont = (r, a) => bx(Lsol, MUNDO, r * Math.cos(a), 0, r * Math.sin(a), 0.06, H, 0.06, branco, Math.atan2(Math.cos(a), Math.sin(a)));
      const nL = Math.max(2, Math.round(d / 1.6));
      for (let i = 1; i < nL; i++) { const r = lerp(r0, r1, i / nL); mont(r, a0 + 0.05 / r); mont(r, a1 - 0.05 / r); }
      if (def.fundo === 'vidro') { const nB = Math.max(2, Math.round((a1 - a0) * r1 / 1.6)); for (let i = 1; i < nB; i++) mont(r1 - 0.05, lerp(a0, a1, i / nB)); }
      // rodapé dos vidros
      Lsol.add(setor(r1 - 0.09, r1 - 0.01, a0, a1, 0, 0.08, seg), W, branco);
    } else {
      // terraço aberto: guarda-corpo
      const gc = (r, A, B, n) => {
        Lsol.add(setor(r - 0.035, r + 0.035, A, B, 1.0, 1.06, n, { base: true }), W, branco);
        Lvid.add(paredeArco(r, A, B, 0.1, 1.0, n, 1), W, vidroTint, null, 0.7);
        const k = Math.max(2, Math.round((B - A) * r / 1.4));
        for (let i = 0; i <= k; i++) { const a = lerp(A, B, i / k); cl(Lsol, MUNDO, r * Math.cos(a), 0, r * Math.sin(a), 0.03, 1.0, branco, 6); }
      };
      gc(r1 - 0.12, a0, a1, seg);
      barreiraArco(r1 - 0.12, a0, a1, seg);
      const lado = (a) => {
        const p0 = [(r0 + 0.1) * Math.cos(a), (r0 + 0.1) * Math.sin(a)], p1 = [(r1 - 0.12) * Math.cos(a), (r1 - 0.12) * Math.sin(a)];
        bx(Lsol, MUNDO, (p0[0] + p1[0]) / 2, 1.0, (p0[1] + p1[1]) / 2, 0.07, 0.06, d - 0.2, branco, Math.atan2(p1[0] - p0[0], p1[1] - p0[1]));
        Lvid.add(paredeReta(p0, p1, 0.1, 1.0), W, vidroTint, null, 0.7);
        for (let i = 0; i <= 5; i++) { const t = i / 5; cl(Lsol, MUNDO, lerp(p0[0], p1[0], t), 0, lerp(p0[1], p1[1], t), 0.03, 1.0, branco, 6); }
        barreiraMundo(p0[0], p0[1], p1[0], p1[1]);
      };
      lado(a0 + 0.1 / r0); lado(a1 - 0.1 / r0);
    }
    // rótulo flutuante
    const rp = F.P(0, def.aberto ? 3.0 : H + 1.05, def.aberto ? -d / 2 + 0.6 : -d / 2 + 0.25);
    rotulos.push({ texto: def.rotulo || def.nome, acento: def.acento, pos: rp });
    // nós de navegação: porta de fora e logo dentro
    no(F, 0, d / 2 + 1.15);
    no(F, 0, d / 2 - 0.75);
    // caminho de pedra até a porta
    const pA = F.xz(0, d / 2 + 2.45), pB = F.xz(0, d / 2 + 0.02);
    caminhoChao(faixa([pA, pB], 1.8, null, false, 0.08));
    const meia = (lz) => (rc - lz) * Math.tan(ha);
    return { F, def, d, rc, ha, meia, H };
  }

  // ------------------------------------------------------------------ mobília (cada uma no seu quadro: raiz na origem, olhando +Z)
  const CORES_LIVRO = ['#c4553a', '#2f5d8a', '#e2b04a', '#3f7a4f', '#8a4f7d', '#d97b4a', '#f0e6d2', '#45464d', '#b9d0e8', '#7a5a3c'];
  function cadeiraEscritorio(G, cor = '#3b3f47') {
    bx(Lsol, G, 0, 0.38, 0, 0.5, 0.08, 0.48, cor);
    bx(Lsol, G, 0, 0.5, -0.27, 0.46, 0.52, 0.06, cor, 0, -0.12);
    cl(Lsol, G, 0, 0.08, 0, 0.03, 0.3, '#8e939b', 8);
    cl(Lsol, G, 0, 0.02, 0, 0.27, 0.05, '#2a2d33', 10);
  }
  function mesaTrabalho(G, larg, z0, prof = 0.7, tampo = '#e9e4da', pe = '#f4f2ed') {
    bx(Lsol, G, 0, 0.7, z0 + prof / 2, larg, 0.04, prof, tampo);
    bx(Lsol, G, -larg / 2 + 0.06, 0, z0 + prof / 2, 0.05, 0.7, prof - 0.1, pe);
    bx(Lsol, G, larg / 2 - 0.06, 0, z0 + prof / 2, 0.05, 0.7, prof - 0.1, pe);
    bx(Lsol, G, 0, 0.45, z0 + prof - 0.08, larg - 0.15, 0.25, 0.02, pe); // painel de modéstia
  }
  function monitor(G, x, z, cel, w = 0.6, ry = 0) {
    const M = G.sub(x, z, ry);
    bx(Lsol, M, 0, 0.74, 0.05, 0.22, 0.02, 0.16, '#2a2d33');
    bx(Lsol, M, 0, 0.74, 0.07, 0.05, 0.3, 0.04, '#2a2d33');
    bx(Lsol, M, 0, 0.98, 0.04, w, w * 0.6, 0.035, '#24262c');
    tela(M, 0, 0.98 + w * 0.3, 0.02, w - 0.04, w * 0.6 - 0.04, cel, Math.PI);
  }
  function estacao(G, cel, o = {}) { // raiz = quem senta, olhando +Z
    cadeiraEscritorio(G, o.corCadeira);
    if (!o.semMesa) mesaTrabalho(G, o.larg || 1.3, 0.35);
    monitor(G, 0, 0.9, cel, 0.6);
    if (o.dois) monitor(G, 0.55, 0.85, o.cel2 ?? CELULA.console, 0.5, -0.35);
    bx(Lsol, G, 0, 0.74, 0.52, 0.42, 0.02, 0.14, '#d7d9dd');
    bx(Lsol, G, 0.3, 0.74, 0.52, 0.06, 0.02, 0.1, '#d7d9dd');
    if (o.caneca) { cl(Lsol, G, -0.42, 0.74, 0.55, 0.04, 0.1, o.caneca, 10); }
    if (o.planta) { cl(Lsol, G, 0.5, 0.74, 0.88, 0.06, 0.1, '#e9e4da', 8); es(Lsol, G, 0.5, 0.92, 0.88, 0.1, 0.1, 0.1, '#5f9a3d', 8, 6); }
  }
  function poltrona(G, cor) {
    bx(Lsol, G, 0, 0.04, 0, 0.82, 0.3, 0.76, cor);
    bx(Lsol, G, 0, 0.34, 0.03, 0.62, 0.12, 0.66, corS(cor).clone().offsetHSL(0, 0, 0.06));
    bx(Lsol, G, 0, 0.34, -0.31, 0.82, 0.62, 0.16, cor, 0, -0.1);
    bx(Lsol, G, -0.36, 0.34, 0.02, 0.12, 0.26, 0.72, cor); bx(Lsol, G, 0.36, 0.34, 0.02, 0.12, 0.26, 0.72, cor);
    [[-0.32, -0.3], [0.32, -0.3], [-0.32, 0.3], [0.32, 0.3]].forEach(([x, z]) => cl(Lsol, G, x, 0, z, 0.025, 0.05, '#6b4a2e', 6));
  }
  function cadeiraCafe(G, cor = '#2f3136') {
    bx(Lsol, G, 0, 0.42, 0, 0.42, 0.04, 0.42, '#c69a6a');
    [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([x, z]) => cl(Lsol, G, x, 0, z, 0.016, 0.42, cor, 6));
    bx(Lsol, G, 0, 0.46, -0.2, 0.4, 0.4, 0.03, cor, 0, -0.08);
  }
  function mesaRedonda(G, x, z, rTop = 0.38) {
    cl(Lsol, G, x, 0.71, z, rTop, 0.03, '#f4efe6', 16);
    cl(Lsol, G, x, 0.02, z, 0.035, 0.7, '#2f3136', 8);
    cl(Lsol, G, x, 0, z, 0.22, 0.03, '#2f3136', 12);
  }
  function estante(G, larg, alt, prof, o = {}) { // encostada atrás (frente = +Z)
    const madeira = o.madeira || '#8a5f3a';
    bx(Lsol, G, 0, 0, -prof / 2, larg, alt, 0.03, corS(madeira).clone().offsetHSL(0, 0, -0.06));
    bx(Lsol, G, -larg / 2, 0, 0, 0.04, alt, prof, madeira); bx(Lsol, G, larg / 2, 0, 0, 0.04, alt, prof, madeira);
    const prat = o.prateleiras || 5, ph = alt / prat;
    const rr = rng(o.semente || 5);
    for (let i = 0; i <= prat; i++) bx(Lsol, G, 0, Math.min(i * ph, alt - 0.03), 0, larg, 0.03, prof, madeira);
    for (let i = 0; i < prat; i++) {
      let x = -larg / 2 + 0.05;
      const passo = PC ? 1 : 1.6;
      while (x < larg / 2 - 0.08) {
        const w = (0.035 + rr() * 0.04) * passo, h = ph * (0.6 + rr() * 0.3);
        if (rr() < 0.08) { x += w * 2; continue; }
        bx(Lsol, G, x + w / 2, i * ph + 0.03, 0.02, w * 0.92, h, prof * 0.8, CORES_LIVRO[(rr() * CORES_LIVRO.length) | 0]);
        x += w;
      }
    }
  }
  function planta(G, x, z, alta = false, vaso = '#f1ece3') {
    cl(Lsol, G, x, 0, z, alta ? 0.22 : 0.2, alta ? 0.5 : 0.36, vaso, 12);
    if (alta) {
      cl(Lsol, G, x, 0.5, z, 0.025, 0.9, '#6b4a2e', 6);
      es(Lsol, G, x, 1.35, z, 0.38, 0.42, 0.38, '#4f8a3a', 10, 7);
      es(Lsol, G, x + 0.15, 1.65, z - 0.08, 0.28, 0.3, 0.28, '#6aa84f', 10, 7);
    } else es(Lsol, G, x, 0.55, z, 0.32, 0.3, 0.32, '#5f9a3d', 10, 7);
  }
  function luminaria(G, x, z, cor = '#f2e6cf') {
    cl(Lsol, G, x, 0, z, 0.14, 0.03, '#2f3136', 10);
    cl(Lsol, G, x, 0.03, z, 0.015, 1.45, '#2f3136', 6);
    Lsol.add(gCone(12), G.M(x, 1.5, z, 0, 0.2, 0.26, 0.2), cor);
    Lluz.add(gCil(10), G.M(x, 1.38, z, 0, 0.14, 0.01, 0.14), '#ffdca0');
  }
  function tapete(L, G, x, z, w, d, c) { bx(L, G, x, 0.0, z, w, 0.012, d, c); }

  // ------------------------------------------------------------------ zonas, uma a uma
  const PAV = {};
  ZONAS_DEF.forEach((def) => { PAV[def.id] = pavilhao(def); });

  // --- ESCRITÓRIO
  {
    const { F, d } = PAV['escritorio-aberto'], z = 'escritorio-aberto';
    const back = -d / 2;
    // quadro kanban e TV na parede do fundo
    bx(Lsol, F, -1.7, 0.95, back + 0.26, 2.5, 1.3, 0.05, '#ffffff');
    tela(F, -1.7, 1.6, back + 0.29, 2.4, 1.2, CELULA.kanban);
    bx(Lsol, F, 1.8, 1.25, back + 0.26, 1.7, 1.0, 0.06, '#24262c');
    tela(F, 1.8, 1.75, back + 0.3, 1.6, 0.9, CELULA.graficos);
    const cels = [CELULA.codigo, CELULA.planilha, CELULA.emails, CELULA.mapa, CELULA.graficos, CELULA.console];
    const canecas = ['#f2a33a', null, '#e0566d', null, '#5b6ee1', null];
    [[-1.5, 0], [1.1, 1]].forEach(([lz, fila]) => {
      const B = F.sub(0, lz);
      mesaTrabalho(B, 4.7, 0.35);
      [-1.6, 0, 1.6].forEach((lx, i) => {
        const k = fila * 3 + i;
        estacao(B.sub(lx, 0), cels[k], { semMesa: true, caneca: canecas[k], planta: k === 2 || k === 3, corCadeira: k % 2 ? '#3b3f47' : '#c76b3e' });
        posto('computador', z, F, lx, lz, 0, { aprox: [lx, lz - (fila ? 0.95 : 0.9)] });
      });
      barreira(F, -2.35, lz + 0.7, 2.35, lz + 0.7);
    });
    // telefone andando: frente de dentro e gramado na frente
    posto('telefone-andando', z, F, -3.0, 2.85, 0.6);
    posto('telefone-andando', z, F, 3.0, 2.85, -0.6);
    posto('telefone-andando', z, F, -2.4, d / 2 + 1.55, 2.6);
    posto('telefone-andando', z, F, 2.4, d / 2 + 1.55, -2.6);
    planta(F, -4.6, back + 0.8, true); planta(F, 4.6, back + 0.8, true);
    planta(F, -3.6, 2.9); planta(F, 3.6, 2.9);
    bx(Lsol, F, 3.9, 0, -1.4, 0.6, 0.9, 0.5, '#e9e4da'); // impressora/armário
    bx(Lsol, F, 3.9, 0.9, -1.4, 0.5, 0.25, 0.42, '#d7d9dd');
    [[0, 0.2], [-3.4, 0.2], [3.4, 0.2], [0, -2.45], [-3.6, -2.45], [3.6, -2.45], [-3.3, 2.7], [3.3, 2.7]].forEach(([x, zz]) => no(F, x, zz));
  }

  // --- BIBLIOTECA
  {
    const { F, d, ha, rc } = PAV.biblioteca, z = 'biblioteca';
    const back = -d / 2;
    [-1.7, 0, 1.7].forEach((lx, i) => estante(F.sub(lx, back + 0.42), 1.62, 2.5, 0.38, { semente: 11 + i, madeira: '#7a5232' }));
    tapete(Lsol, F, -1.6, -0.1, 3.8, 3.4, '#b5523a');
    tapete(Lsol, F, -1.6, -0.1, 3.4, 3.0, '#c9694d');
    const cores = ['#d9a441', '#3f6e5a', '#c4553a', '#5b6ee1'];
    [[-2.6, -1.25], [-0.75, -1.25], [-2.6, 1.0], [-0.75, 1.0]].forEach(([x, zz], i) => {
      poltrona(F.sub(x, zz), cores[i]);
      posto('biblioteca-lendo', z, F, x, zz, 0, { aprox: [x, zz + 0.9] });
    });
    cl(Lsol, F, -1.68, 0, -1.2, 0.22, 0.5, '#7a5232', 12); cl(Lsol, F, -1.68, 0.5, -1.2, 0.26, 0.03, '#8a5f3a', 14);
    luminaria(F, -3.4, -1.9); luminaria(F, 0.2, 1.6);
    // escaninhos (cartas) colados na parede direita, girados com ela
    const wallAng = Math.atan(Math.tan(ha)); // inclinação da parede no quadro local
    const zc = -0.3, xc = (rc - zc) * Math.tan(ha) - 0.42;
    const E = F.sub(xc, zc, -Math.PI / 2 - wallAng);
    // armário
    bx(Lsol, E, 0, 0, -0.05, 2.4, 2.0, 0.42, '#e9e1d2');
    for (let i = 0; i <= 6; i++) bx(Lsol, E, -1.2 + i * 0.4, 0.35, 0.17, 0.025, 1.6, 0.02, '#cfc3ad');
    for (let j = 0; j <= 5; j++) bx(Lsol, E, 0, 0.35 + j * 0.32, 0.17, 2.4, 0.02, 0.02, '#cfc3ad');
    const rr = rng(23);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) if (rr() < 0.7) {
      const n = 1 + (rr() * 3 | 0);
      for (let k = 0; k < n; k++) bx(Lsol, E, -1.0 + i * 0.4 + (rr() - 0.5) * 0.12, 0.38 + j * 0.32, 0.12 + k * 0.012, 0.24, 0.11 + rr() * 0.06, 0.01, ['#fffaf0', '#f7e3c4', '#ffd9d0', '#e3ecff'][(rr() * 4) | 0], 0, 0, (rr() - 0.5) * 0.3);
    }
    bx(Lsol, E, 0, 2.0, -0.05, 2.5, 0.06, 0.46, '#c9b48f');
    [-0.8, 0, 0.8].forEach((lx) => posto('arquivo-cartas', z, E, lx, 0.78, Math.PI));
    // carrinho de correio
    bx(Lsol, E, 1.55, 0.1, 1.1, 0.5, 0.5, 0.7, '#3f6e5a');
    bx(Lsol, E, 1.55, 0.6, 1.1, 0.46, 0.12, 0.66, '#f7e3c4');
    [[0, -0.1], [-1.8, -0.1], [0, 2.75], [-2.8, 2.75], [2.0, 2.4], [2.4, -1.9], [-3.6, -0.1]].forEach(([x, zz]) => no(F, x, zz));
  }

  // --- ACADEMIA
  {
    const { F, d } = PAV.academia, z = 'academia';
    tapete(Lsol, F, 2.6, 2.35, 4.3, 2.2, '#4b4f57');
    const esteira = (G) => {
      bx(Lsol, G, 0, 0, -0.1, 0.8, 0.12, 1.8, '#2f3238');
      bx(Lsol, G, 0, 0.12, -0.1, 0.6, 0.06, 1.62, '#1b1c20');
      bx(Lsol, G, -0.36, 0.12, -0.1, 0.08, 0.05, 1.7, '#9aa0a8'); bx(Lsol, G, 0.36, 0.12, -0.1, 0.08, 0.05, 1.7, '#9aa0a8');
      bx(Lsol, G, -0.36, 0.12, 0.74, 0.05, 1.1, 0.06, '#9aa0a8', 0, 0.12); bx(Lsol, G, 0.36, 0.12, 0.74, 0.05, 1.1, 0.06, '#9aa0a8', 0, 0.12);
      bx(Lsol, G, -0.36, 1.0, 0.45, 0.05, 0.05, 0.6, '#c8ccd2'); bx(Lsol, G, 0.36, 1.0, 0.45, 0.05, 0.05, 0.6, '#c8ccd2');
      bx(Lsol, G, 0, 1.18, 0.82, 0.74, 0.3, 0.1, '#2f3238', 0, -0.35);
      tela(G, 0, 1.34, 0.77, 0.5, 0.2, CELULA.graficos, Math.PI, 0.35);
      bx(Lsol, G, 0, 0.95, 0.86, 0.2, 0.06, 0.06, '#ff7a3d');
    };
    const bike = (G) => {
      bx(Lsol, G, 0, 0, 0.1, 0.12, 0.07, 1.15, '#2d3038');
      bx(Lsol, G, 0, 0, -0.42, 0.5, 0.06, 0.08, '#2d3038'); bx(Lsol, G, 0, 0, 0.62, 0.5, 0.06, 0.08, '#2d3038');
      bx(Lsol, G, 0, 0.05, -0.04, 0.06, 0.68, 0.06, '#2d3038', 0, -0.12);
      bx(Lsol, G, 0, 0.72, 0, 0.17, 0.06, 0.27, '#1b1c20');
      bx(Lsol, G, 0, 0.05, 0.5, 0.06, 0.9, 0.06, '#2d3038', 0, 0.1);
      bx(Lsol, G, 0, 0.96, 0.52, 0.46, 0.04, 0.06, '#1b1c20');
      cl(Lsol, G, 0, 0.36, 0.36, 0.24, 0.07, '#ff7a3d', 16, 0, Math.PI / 2);
      cl(Lsol, G, 0, 0.3, 0, 0.05, 0.16, '#9aa0a8', 8, 0, Math.PI / 2);
    };
    [-3.0, -1.6, 1.6, 3.0].forEach((lx) => {
      esteira(F.sub(lx, -2.8));
      posto('esteira', z, F, lx, -2.8, 0, { y: 0.18, aprox: [lx + (Math.abs(lx) > 2 ? Math.sign(lx) * 0.75 : -Math.sign(lx) * 0.75), -2.6] });
      bike(F.sub(lx, -0.55));
      posto('bicicleta', z, F, lx, -0.55, 0, { aprox: [lx + (Math.abs(lx) > 2 ? Math.sign(lx) * 0.65 : -Math.sign(lx) * 0.65), -0.35] });
    });
    barreira(F, -3.45, -2.9, -1.15, -2.9); barreira(F, 1.15, -2.9, 3.45, -2.9);
    barreira(F, -3.3, -0.5, -1.3, -0.5); barreira(F, 1.3, -0.5, 3.3, -0.5);
    // halteres: rack + 4 postos
    const R = F.sub(-2.85, 1.05);
    bx(Lsol, R, 0, 0, 0, 2.4, 0.06, 0.5, '#2d3038');
    [-1.15, 1.15, 0].forEach((x) => bx(Lsol, R, x, 0, 0, 0.06, 0.82, 0.5, '#2d3038'));
    bx(Lsol, R, 0, 0.42, 0, 2.4, 0.04, 0.5, '#3a3d45'); bx(Lsol, R, 0, 0.8, -0.05, 2.4, 0.04, 0.4, '#3a3d45');
    for (let i = 0; i < 7; i++) {
      const x = -1.0 + i * 0.33, ra = 0.05 + i * 0.004;
      [[0.46, 0.06], [0.84, -0.05]].forEach(([topo, zz]) => {
        const yc = topo + ra;
        Lsol.add(gCil(6), R.M(x, yc, zz, 0, 0.018, 0.3, 0.018, Math.PI / 2), '#9aa0a8');
        [-0.1, 0.1].forEach((dz) => Lsol.add(gCil(10), R.M(x, yc, zz + dz, 0, ra, 0.06, ra, Math.PI / 2), i % 3 === 0 ? '#ff7a3d' : '#2a2c31'));
      });
    }
    barreira(F, -4.1, 1.05, -1.6, 1.05);
    [[-4.0, 2.1], [-2.85, 2.1], [-1.7, 2.1], [-2.85, 3.3]].forEach(([x, zz]) => posto('halteres', z, F, x, zz, 0));
    // yoga
    ['#b48cd8', '#ff8f6b', '#e2b04a', '#8fb3ff'].forEach((c, i) => {
      const x = 1.15 + i * 0.95;
      bx(Lsol, F, x, 0.005, 2.35, 0.66, 0.012, 1.78, c);
      posto('yoga', z, F, x, 2.35, 0, { aprox: [x, 3.55] });
    });
    // alongando: deck de madeira na frente, no gramado
    {
      const a0 = (ZONAS_DEF[2].a0 + 6) * DEG, a1 = (ZONAS_DEF[2].a1 - 6) * DEG, am = (ZONAS_DEF[2].a0 + ZONAS_DEF[2].a1) / 2 * DEG, folga = 1.0 / 13.3;
      Lsol.padrao(PAD.deck, () => {
        Lsol.add(setor(12.75, 14.15, a0, am - folga, -0.06, 0.0, 6, { base: false }), new THREE.Matrix4(), '#c99a66');
        Lsol.add(setor(12.75, 14.15, am + folga, a1, -0.06, 0.0, 6, { base: false }), new THREE.Matrix4(), '#c99a66');
      });
      [-3.4, -1.75, 1.75, 3.4].forEach((x) => posto('alongando', z, F, x, d / 2 + 1.25, 0));
    }
    planta(F, 4.8, -3.6, true); planta(F, -4.8, -3.6, true);
    bx(Lsol, F, -4.3, 0, -1.6, 0.4, 1.1, 0.35, '#e9e4da'); cl(Lsol, F, -4.3, 1.1, -1.6, 0.1, 0.25, '#8fb3ff', 10);
    [[0, 3.6], [0, 1.1], [0, -1.7], [0, -3.7], [-4.0, -1.7], [4.0, -1.7], [-4.4, 0.4], [4.4, 0.4], [-3.9, -3.7], [3.9, -3.7], [-3.0, 3.6], [2.6, 3.6]].forEach(([x, zz]) => no(F, x, zz));
  }

  // --- CAFÉ
  {
    const { F, d } = PAV.cafe, z = 'cafe';
    const back = -d / 2;
    // balcão do fundo: máquina de espresso, moedor, xícaras + cardápio na parede
    bx(Lsol, F, 0, 0, back + 0.55, 4.6, 0.92, 0.6, '#f1ece3');
    bx(Lsol, F, 0, 0.92, back + 0.55, 4.7, 0.05, 0.64, '#3a3530');
    const maq = F.sub(-0.9, back + 0.55);
    bx(Lsol, maq, 0, 0.97, 0, 0.75, 0.42, 0.45, '#c9ccd2'); bx(Lsol, maq, 0, 1.39, -0.02, 0.75, 0.06, 0.42, '#2f3136');
    [-0.2, 0.2].forEach((x) => { cl(Lsol, maq, x, 1.03, 0.2, 0.05, 0.08, '#2f3136', 8); cl(Lsol, maq, x, 0.97, 0.18, 0.04, 0.05, '#ffffff', 8); });
    cl(Lsol, maq, 0.55, 0.97, 0, 0.09, 0.32, '#2f3136', 10); Lsol.add(gCone(10), maq.M(0.55, 1.36, 0, 0, 0.11, 0.14, 0.11, Math.PI), '#c9ccd2');
    for (let i = 0; i < 6; i++) cl(Lsol, F, 0.6 + i * 0.16, 0.97, back + 0.45, 0.045, 0.07, i % 2 ? '#ffffff' : '#f2a33a', 8);
    bx(Lsol, F, 0, 1.55, back + 0.24, 2.1, 1.1, 0.05, '#2b2420');
    tela(F, 0, 2.1, back + 0.27, 2.0, 1.0, CELULA.cardapio);
    // balcão de atendimento com caixas e vitrine
    const BAL = -1.6;
    bx(Lsol, F, 0, 0, BAL, 4.6, 0.98, 0.6, '#b5713e');
    bx(Lsol, F, 0, 0.98, BAL, 4.7, 0.05, 0.66, '#ece6dc');
    for (let i = 0; i < 9; i++) bx(Lsol, F, -2.1 + i * 0.52, 0.05, BAL + 0.305, 0.04, 0.88, 0.01, '#9a5d32');
    [-1.3, 0, 1.3].forEach((lx) => {
      const C = F.sub(lx, BAL - 0.05, Math.PI);
      bx(Lsol, C, 0, 1.03, 0, 0.3, 0.05, 0.25, '#2f3136');
      bx(Lsol, C, 0, 1.08, 0.05, 0.3, 0.2, 0.03, '#2f3136', 0, -0.4);
      tela(C, 0, 1.18, 0.035, 0.26, 0.16, CELULA.planilha, 0, -0.4);
      posto('caixa-registradora', z, F, lx, -2.5, 0);
    });
    Lvid.add(gCaixa(), F.M(1.95, 1.25, BAL, 0, 0.6, 0.45, 0.5), '#f6fbff', null, 0.5);
    for (let i = 0; i < 6; i++) es(Lsol, F, 1.75 + (i % 3) * 0.2, 1.1, BAL - 0.1 + ((i / 3) | 0) * 0.2, 0.07, 0.04, 0.07, i % 2 ? '#e2b04a' : '#c4553a', 8, 5);
    barreira(F, -2.4, BAL, 2.4, BAL);
    // mesas redondas, 2 cadeiras cada
    [-2.55, 0, 2.55].forEach((tx) => {
      const tz = 0.45;
      mesaRedonda(F, tx, tz);
      cl(Lsol, F, tx + 0.12, 0.74, tz, 0.04, 0.08, '#ffffff', 8);
      cadeiraCafe(F.sub(tx - 0.73, tz, Math.PI / 2));
      cadeiraCafe(F.sub(tx + 0.73, tz, -Math.PI / 2));
      posto('cafe', z, F, tx - 0.73, tz, Math.PI / 2, { aprox: [tx - 0.73, tz + 0.75] });
      posto('cafe', z, F, tx + 0.73, tz, -Math.PI / 2, { aprox: [tx + 0.73, tz + 0.75] });
    });
    planta(F, -3.7, 2.9, true); planta(F, 3.7, 2.9, true);
    luminaria(F, -4.0, -0.6, '#f2c27a');
    [[0, 1.4], [-3.6, 1.4], [3.6, 1.4], [-3.4, -2.5], [3.4, -2.5], [-3.6, -0.6], [3.6, -0.6]].forEach(([x, zz]) => no(F, x, zz));
  }

  // --- AUDITÓRIO (sala de reunião com telão)
  {
    const { F, d } = PAV.auditorio, z = 'auditorio';
    const back = -d / 2;
    bx(Lsol, F, 0, 0.75, back + 0.3, 3.9, 2.25, 0.1, '#1b1c20');
    tela(F, 0, 1.87, back + 0.36, 3.7, 2.05, CELULA.slide);
    tapete(Lsol, F, 0, back + 1.4, 4.4, 1.7, '#a35a67');
    // mesa oval + 8 cadeiras
    Lsol.add(gCil(24), F.M(0, 0.72, 0.6, 0, 1.6, 0.04, 0.62), '#efe9df');
    cl(Lsol, F, -0.8, 0, 0.6, 0.06, 0.72, '#2f3136', 8); cl(Lsol, F, 0.8, 0, 0.6, 0.06, 0.72, '#2f3136', 8);
    [[-0.9, -0.25, 0], [0, -0.25, 0], [0.9, -0.25, 0], [-0.9, 1.45, Math.PI], [0, 1.45, Math.PI], [0.9, 1.45, Math.PI], [-2.0, 0.6, Math.PI / 2], [2.0, 0.6, -Math.PI / 2]].forEach(([x, zz, r]) => cadeiraEscritorio(F.sub(x, zz, r), '#e0566d'));
    for (let i = 0; i < 4; i++) { const x = -1.2 + i * 0.8; bx(Lsol, F, x, 0.74, 0.55, 0.3, 0.01, 0.22, '#ffffff', 0.3 * i); }
    barreiraCaixa(F, 0, 0.6, 3.6, 1.6);
    const foco = [0, 0.6];
    [[-1.4, -2.35], [0, -2.5], [1.4, -2.35], [2.6, -1.6]].forEach(([x, zz]) => posto('quadro-reuniao', z, F, x, zz, Math.atan2(foco[0] - x, foco[1] - zz)));
    planta(F, -3.9, -3.0, true); planta(F, 3.9, -3.0, true);
    [[0, 2.9], [-2.9, 0.6], [2.9, 0.6], [-2.6, -1.5], [2.9, -1.0], [0, -1.6]].forEach(([x, zz]) => no(F, x, zz));
  }

  // --- ESTÚDIO
  {
    const { F, d } = PAV.estudio, z = 'estudio';
    const back = -d / 2;
    // painéis acústicos hexagonais na parede
    const hx = ['#9a6bff', '#ffb38a', '#f4efe6', '#c9b6ff', '#ff8f6b'];
    for (let i = 0; i < 11; i++) for (let j = 0; j < 3; j++) {
      if ((i + j) % 4 === 3) continue;
      const x = -3.2 + i * 0.62 + (j % 2) * 0.31, y = 0.9 + j * 0.54;
      Lsol.add(gCil(6), F.M(x, y, back + 0.24, 0, 0.3, 0.06, 0.3, Math.PI / 2), hx[(i * 3 + j) % hx.length]);
    }
    tapete(Lsol, F, -1.7, -0.4, 3.4, 4.2, '#5c5470');
    [[-1.5, 0], [0.95, 1]].forEach(([lz, fila]) => {
      const B = F.sub(-1.75, lz);
      mesaTrabalho(B, 2.75, 0.35, 0.7, '#2f3136', '#2f3136');
      [-0.65, 0.65].forEach((lx, i) => {
        const S = B.sub(lx, 0);
        estacao(S, CELULA.audio, { semMesa: true, dois: true, cel2: fila ? CELULA.chat : CELULA.console, corCadeira: '#9a6bff' });
        // microfone de braço
        cl(Lsol, S, -0.45, 0.74, 0.95, 0.02, 0.4, '#1b1c20', 6);
        bx(Lsol, S, -0.45, 1.12, 0.75, 0.03, 0.03, 0.4, '#1b1c20', 0, 0.5);
        cl(Lsol, S, -0.45, 1.0, 0.55, 0.035, 0.12, '#3a3d45', 8);
        posto('fones-transcrevendo', z, F, -1.75 + lx, lz, 0, { aprox: [-1.75 + lx, lz - (fila ? 0.95 : 0.9)] });
      });
      barreira(F, -3.15, lz + 0.7, -0.35, lz + 0.7);
    });
    // mesa holográfica
    const hc = [2.0, -0.55];
    cl(Lsol, F, hc[0], 0, hc[1], 0.32, 0.86, '#ece6f6', 16);
    cl(Lsol, F, hc[0], 0.86, hc[1], 0.62, 0.06, '#f4f2ed', 24);
    Lluz.add(setor(0.5, 0.6, 0, TAU, 0.925, 0.925, 32, { fora: false, dentro: false }), F.M(hc[0], 0, hc[1]), '#b9a3ff');
    Lluz.add(gCil(24), F.M(hc[0], 0.92, hc[1], 0, 0.45, 0.01, 0.45), '#6f5bd6');
    barreiraCaixa(F, hc[0], hc[1], 1.1, 1.1);
    [[0.85, 0.85], [-0.85, 0.85], [0.85, -0.85], [-0.85, -0.85]].forEach(([dx, dz]) => posto('gestos-holograma', z, F, hc[0] + dx, hc[1] + dz, Math.atan2(-dx, -dz)));
    holoPos.copy(F.P(hc[0], 1.55, hc[1]));
    // softbox e tripé
    const SB = F.sub(3.3, -2.6, -0.6);
    cl(Lsol, SB, 0, 0, 0, 0.02, 1.6, '#1b1c20', 6); bx(Lsol, SB, 0, 1.55, 0, 0.6, 0.6, 0.12, '#1b1c20'); Lluz.add(gPlano(), SB.M(0, 1.85, 0.065, 0, 0.54, 0.54, 1), '#fff6e8');
    planta(F, 3.9, 2.9, true);
    [[0, 2.9], [-3.4, 0.2], [-1.75, 0.2], [0.4, 0.2], [-1.75, -2.45], [-3.5, -2.45], [0.2, -2.45], [2.0, 1.4], [3.4, -0.55], [2.0, -2.3]].forEach(([x, zz]) => no(F, x, zz));
  }

  // --- SALA DOS SERVIDORES
  {
    const { F, d } = PAV['sala-servidores'], z = 'sala-servidores';
    const back = -d / 2;
    const rack = (G, alt = 2.0) => {
      bx(Lsol, G, 0, 0, 0, 0.6, alt, 1.0, '#23262d');
      bx(Lsol, G, 0, 0.05, 0.505, 0.52, alt - 0.1, 0.01, '#2e323b');
      for (let i = 0; i < 9; i++) bx(Lsol, G, 0, 0.18 + i * 0.2, 0.512, 0.46, 0.012, 0.01, '#3a3f4a');
      // LEDs
      for (let c = 0; c < 3; c++) for (let rI = 0; rI < (PC ? 14 : 10); rI++) {
        const p = G.P(-0.18 + c * 0.09, 0.22 + rI * (alt - 0.4) / (PC ? 14 : 10), 0.52);
        ledsP.push(p.x, p.y, p.z, G.ry);
        const k = Math.random();
        ledsC.push(k < 0.6 ? '#7dff6a' : k < 0.85 ? '#5aa8ff' : '#ffb347');
        ledsF.push(Math.random() * 100);
      }
    };
    [-1.55, -0.93, -0.31, 0.31, 0.93, 1.55].forEach((lx) => rack(F.sub(lx, back + 1.15)));
    // calha de cabos amarela
    bx(Lsol, F, 0, 2.35, back + 1.15, 3.8, 0.08, 0.3, '#f2b632');
    barreira(F, -1.95, back + 1.7, 1.95, back + 1.7);
    // nobreak e ar-condicionado
    bx(Lsol, F, -2.3, 0, 0.2, 0.7, 1.7, 0.8, '#eef0f3', -0.15); bx(Lsol, F, -2.3, 1.2, 0.62, 0.5, 0.3, 0.02, '#c4ccd6', -0.15);
    // console de pé
    const C = F.sub(1.75, 1.25);
    bx(Lsol, C, 0, 0, 0, 0.7, 1.0, 0.5, '#e6e9ee'); bx(Lsol, C, 0, 1.0, -0.05, 0.6, 0.04, 0.4, '#2f3136', 0, 0.3);
    tela(C, 0, 1.06, 0.02, 0.5, 0.3, CELULA.servidores, 0, -Math.PI / 2 + 0.3);
    [-1.0, 0, 1.0].forEach((lx) => posto('sala-servidores', z, F, lx, back + 2.35, Math.PI));
    posto('sala-servidores', z, F, 1.75, 2.0, Math.PI);
    [[0, 2.9], [0, 0.6], [-1.0, back + 2.5], [1.6, 0.4], [-1.7, 1.6]].forEach(([x, zz]) => no(F, x, zz));
  }

  // --- OBSERVATÓRIO (terraço aberto + cúpula)
  {
    const { F, d } = PAV.observatorio, z = 'observatorio';
    const back = -d / 2;
    const dc = [0, back + 1.85];
    // cúpula: tambor baixo + domo com a fenda aberta pro céu
    cl(Lsol, F, dc[0], 0, dc[1], 1.62, 0.12, '#d9d4cb', 28);
    cl(Lsol, F, dc[0], 0.12, dc[1], 1.55, 0.95, '#f3f0ea', 28);
    cl(Lsol, F, dc[0], 1.03, dc[1], 1.6, 0.08, '#5b6ee1', 28);
    Lsol.add(gMeiaEsfera(28), F.M(dc[0], 1.1, dc[1], 0, 1.55, 1.4, 1.55), '#eceae6');
    const fenda = new THREE.SphereGeometry(1, 3, 8, Math.PI / 2 - 0.2, 0.4, 0.05, Math.PI / 2 - 0.05);
    Lsol.add(fenda, F.M(dc[0], 1.1, dc[1], 0, 1.565, 1.415, 1.565), '#27304d');
    bx(Lsol, F, dc[0], 0.12, dc[1] + 1.53, 0.8, 0.86, 0.05, '#3a4466');
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, a2 = (i + 1) / 8 * TAU; barreira(F, dc[0] + 1.7 * Math.sin(a), dc[1] + 1.7 * Math.cos(a), dc[0] + 1.7 * Math.sin(a2), dc[1] + 1.7 * Math.cos(a2)); }
    // piso: tapete-mapa estelar
    Lsol.add(setor(0, 1.25, 0, TAU, 0.0, 0.01, 32, { dentro: false }), F.M(0, 0, 1.45), '#27346b');
    Lsol.add(setor(1.25, 1.36, 0, TAU, 0.0, 0.012, 32, { dentro: false }), F.M(0, 0, 1.45), '#5b6ee1');
    const rr = rng(5);
    for (let i = 0; i < 18; i++) { const a = rr() * TAU, r = rr() * 1.1; bx(Lsol, F, Math.cos(a) * r, 0.006, 1.45 + Math.sin(a) * r, 0.05, 0.012, 0.05, '#f6f2ea', a); }
    const telescopio = (G, cor) => {
      const tz = 0.62;
      [0, 1, 2].forEach((i) => {
        const a = i / 3 * TAU + 0.3, fx = Math.sin(a) * 0.42, fz = tz + Math.cos(a) * 0.42;
        const mx = 0, my = 1.28, mz = tz; const dx = mx - fx, dz = mz - fz, l = Math.hypot(dx, my, dz);
        Lsol.add(gCil(6), G.M((fx + mx) / 2, my / 2, (fz + mz) / 2, Math.atan2(dx, dz), 0.02, l, 0.02, Math.acos(my / l)), '#2f3136');
      });
      bx(Lsol, G, 0, 1.24, tz, 0.14, 0.14, 0.14, '#2f3136');
      const ang = 55 * DEG;
      Lsol.add(gCil(14), G.M(0, 1.42 + Math.cos(ang) * 0.62, 0.22 + Math.sin(ang) * 0.62, 0, 0.09, 1.2, 0.09, ang), cor);
      Lsol.add(gCil(14), G.M(0, 1.42 + Math.cos(ang) * 1.18, 0.22 + Math.sin(ang) * 1.18, 0, 0.1, 0.1, 0.1, ang), '#e9e8e6');
      cl(Lsol, G, 0, 1.36, 0.2, 0.025, 0.1, '#1b1c20', 8, 0.6);
    };
    [[-1.0, 0.25, 0.25], [1.0, 0.25, -0.25], [-0.95, 2.45, 0.15], [0.95, 2.45, -0.3]].forEach(([x, zz, r], i) => {
      telescopio(F.sub(x, zz, r), i % 2 ? '#5b6ee1' : '#f4f2ed');
      posto('observatorio', z, F, x, zz, r, { aprox: [x + (x < 0 ? 0.6 : -0.6), zz - 0.45] });
    });
    // totem com o céu
    const T = F.sub(2.0, -0.1, -0.5);
    bx(Lsol, T, 0, 0, 0, 0.5, 1.3, 0.12, '#2b3354'); tela(T, 0, 1.0, 0.065, 0.44, 0.44, CELULA.estrelas);
    [[0, 3.5], [0, 1.45], [-1.9, 1.3], [1.9, 1.3], [-2.2, -0.6], [2.2, -1.2]].forEach(([x, zz]) => no(F, x, zz));
  }

  // --- RECEPÇÃO
  {
    const { F, d } = PAV.recepcao, z = 'recepcao';
    // balcão em arco
    const C = F.sub(0, 0.55);
    const arcoBal = (r0, r1, y0, y1, cor) => Lsol.add(setor(r0, r1, Math.PI / 2 - 0.42, Math.PI / 2 + 0.42, y0, y1, 10, { base: true }), C.M(0, 0, -4.0), cor);
    arcoBal(4.0, 4.55, 0, 1.0, '#f4f2ed');
    arcoBal(3.95, 4.62, 1.0, 1.06, '#c99d70');
    arcoBal(4.53, 4.56, 0.12, 0.2, '#d9a441');
    [-1.2, 0, 1.2].forEach((lx) => {
      const zIn = 0.55 - (4.0 - Math.sqrt(16 - lx * lx)), giro = Math.asin(lx / 4); // borda de dentro do balcão
      const M = F.sub(lx, zIn + 0.17, Math.PI + giro);
      bx(Lsol, M, 0, 1.06, 0, 0.42, 0.25, 0.03, '#24262c', 0, 0.15);
      tela(M, 0, 1.19, -0.02, 0.38, 0.21, CELULA.agenda, Math.PI, -0.15);
      posto('recepcao', z, F, lx - Math.sin(giro) * 0.5, zIn - 0.5, giro);
    });
    barreira(F, -1.9, 0.75, 1.9, 0.75);
    // parede com logo
    bx(Lsol, F, 0, 0, -2.3, 2.9, 2.5, 0.16, '#fbf6ee');
    tela(F, 0, 1.45, -2.21, 1.7, 1.7, CELULA.logo);
    // tocar no logo abre a equipe (app: executarAcaoMundo('equipe'))
    {
      const alvo = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.5), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      alvo.material.colorWrite = false;
      alvo.position.copy(F.P(0, 1.25, -2.2));
      alvo.rotation.y = F.ry;
      alvo.userData = { acao: 'equipe', rotulo: 'Equipe do campus' };
      alvo.name = 'logo-equipe';
      raiz.add(alvo);
      objetosClicaveis.push(alvo);
    }
    barreira(F, -1.45, -2.3, 1.45, -2.3);
    // sala de espera
    const S = F.sub(-2.15, 2.2, Math.PI / 2);
    bx(Lsol, S, 0, 0.05, 0, 1.6, 0.36, 0.8, '#d9a441'); bx(Lsol, S, 0, 0.41, -0.3, 1.6, 0.42, 0.2, '#c9922f');
    bx(Lsol, S, -0.8, 0.05, 0, 0.16, 0.56, 0.8, '#c9922f'); bx(Lsol, S, 0.8, 0.05, 0, 0.16, 0.56, 0.8, '#c9922f');
    cl(Lsol, F, -1.1, 0, 2.2, 0.32, 0.4, '#f4f2ed', 16);
    planta(F, 2.5, 2.6, true); planta(F, -2.6, -2.6, true); planta(F, 2.6, -2.6);
    [[0, 2.7], [-2.3, 0.6], [2.4, 0.6], [0, -1.15], [-2.0, -1.2], [2.1, -1.2]].forEach(([x, zz]) => no(F, x, zz));
  }

  // --- DORMITÓRIO (21 pufes/cápsulas)
  {
    const { F, d } = PAV.dormitorio, z = 'dormitorio';
    const back = -d / 2;
    const pasteis = ['#c9b6ff', '#ffc9a8', '#ffe39a', '#b9d9ff', '#f7b6c8', '#cde8b0'];
    tapete(Lsol, F, 0, 2.95, 3.2, 1.6, '#e8c9a0');
    const cama = (G, i, capsula) => {
      bx(Lsol, G, 0, 0, 0, 0.9, 0.12, 1.92, capsula ? '#c49a6c' : '#d9b68a');
      // colchão: cápsula deitada ao longo de Z, achatada (topo a 0.32 no centro)
      Lsol.add(gCapsula(0.4, 1.1, 3, 10), G.M(0, 0.21, 0, 0, 1, 1, 0.275, Math.PI / 2), pasteis[i % pasteis.length]);
      // travesseiro na cabeceira (−Z)
      Lsol.add(gCapsula(0.13, 0.36, 2, 8), G.M(0, 0.33, -0.7, 0, 0.42, 1, 1, 0, Math.PI / 2), '#fffaf2');
      if (capsula) {
        bx(Lsol, G, -0.47, 0, -0.15, 0.04, 0.55, 1.5, '#b88a5c');
        bx(Lsol, G, 0, 0, -0.98, 0.98, 0.75, 0.05, '#b88a5c');
        Lluz.add(gCil(8), G.M(0, 0.62, -0.94, 0, 0.05, 0.02, 0.05, Math.PI / 2), '#ffcf8f');
      }
    };
    const fundo = -2.6, frente = 1.0;
    for (let i = -6; i <= 6; i++) {
      const lx = i * 1.0;
      cama(F.sub(lx, fundo), i + 6, true);
      posto('dormindo', z, F, lx, fundo, 0, { aprox: [lx, fundo + 1.5] });
    }
    bx(Lsol, F, 6.47, 0, fundo - 0.15, 0.04, 0.55, 1.5, '#b88a5c');
    [-4.1, -3.1, -2.1, -1.1, 1.1, 2.1, 3.1, 4.1].forEach((lx, i) => {
      cama(F.sub(lx, frente), i + 3, false);
      posto('dormindo', z, F, lx, frente, 0, { aprox: [lx, frente + 1.45] });
    });
    barreira(F, -4.6, frente, -0.62, frente); barreira(F, 0.62, frente, 4.6, frente);
    // varal de luzinhas na parede do fundo
    for (let i = 0; i < 26; i++) { const x = -6.4 + i * 0.5; Lluz.add(gEsfera(6, 4), F.M(x, 2.55 - Math.sin((i % 6) / 6 * Math.PI) * 0.18, back + 0.28, 0, 0.05, 0.05, 0.05), i % 3 ? '#ffd27a' : '#ffb38a'); }
    // pufes soltos e luminárias
    es(Lsol, F, -3.3, 0.25, 3.2, 0.5, 0.3, 0.5, '#b48cd8', 12, 8); es(Lsol, F, 3.3, 0.25, 3.2, 0.5, 0.3, 0.5, '#ffb38a', 12, 8);
    luminaria(F, -5.4, 2.6, '#ffe2bd'); luminaria(F, 5.4, 2.6, '#ffe2bd');
    planta(F, -1.6, 3.6, true);
    [[0, 3.7], [0, -1.1], [-3.3, -1.1], [3.3, -1.1], [-6.0, -1.1], [6.0, -1.1], [-5.0, 2.3], [5.0, 2.3], [-2.6, 2.4], [2.6, 2.4]].forEach(([x, zz]) => no(F, x, zz));
  }

  // ===================================================================== JARDIM (aberto) + LAGO
  const aguaU = {
    uCeu: { value: K('#8fb9e8') }, uHor: { value: K('#ffe6c4') }, uFundo: { value: K('#245a86') },
    uSolDir: ceuU.uSolDir, uSolCor: ceuU.uSolCor, uNoite: noiteU, uT: tempoU,
    uLago: { value: new THREE.Vector4(LAGO.cx, LAGO.cz, LAGO.rx, LAGO.rz) },
  };
  {
    const z = 'jardim';
    const J = MUNDO;
    zonas.jardim = { nome: 'Jardim', centro: new THREE.Vector3(0, 0, LAGO.cz), raio: 7 };
    // lago: água (shader) + borda de pedra
    const N = 64, pts = [];
    for (let i = 0; i < N; i++) pts.push(lagoPonto(i / N * TAU));
    const sh = new THREE.Shape(pts.map(([x, zz]) => new THREE.Vector2(x, -zz)));
    const gAgua = new THREE.ShapeGeometry(sh, 4);
    gAgua.rotateX(-Math.PI / 2);
    const um = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
    Object.assign(um, aguaU);
    const agua = new THREE.Mesh(gAgua, new THREE.ShaderMaterial({
      uniforms: um, fog: true,
      vertexShader: `varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform vec3 uCeu, uHor, uFundo, uSolDir, uSolCor; uniform vec4 uLago; uniform float uNoite, uT; varying vec3 vW;
        ${GLSL_HASH}
        #include <fog_pars_fragment>
        void main(){
          vec2 p = vW.xz;
          float a = sin(p.x * 1.7 + uT * 1.1) + sin(p.y * 2.3 - uT * 1.3) + 0.6 * sin((p.x + p.y) * 3.1 + uT * 1.7) + 0.4 * sin((p.x - p.y) * 4.7 - uT * 2.1);
          float b = cos(p.x * 2.1 - uT * 0.9) + cos(p.y * 1.9 + uT * 1.2) + 0.5 * cos((p.x - p.y) * 3.7 + uT * 1.5);
          vec3 N = normalize(vec3(a * 0.03, 1.0, b * 0.03));
          vec3 V = normalize(cameraPosition - vW);
          float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0);
          vec3 R = reflect(-V, N);
          vec3 sky = mix(uHor, uCeu, clamp(R.y * 1.3, 0.0, 1.0));
          // fundo: mais escuro no meio, clarinho na beira
          float k = length((p - uLago.xy) / uLago.zw);
          vec3 fundo = mix(uFundo * 0.78, uFundo * 1.45 + vec3(0.03, 0.05, 0.04), smoothstep(0.45, 1.05, k));
          vec3 c = mix(fundo, sky, 0.12 + 0.7 * fr);
          float br = pow(max(0.0, sin(a * 1.6 + b * 0.9)), 6.0);
          c += mix(vec3(1.0), uSolCor, 0.5) * br * 0.05 * (1.0 - 0.7 * uNoite);
          float s = pow(max(dot(R, uSolDir), 0.0), 160.0);
          c += uSolCor * s * 1.4 * (1.0 - 0.6 * uNoite);
          c *= mix(1.0, 0.82, smoothstep(0.93, 1.08, k)); // sombra da borda de pedra
          gl_FragColor = vec4(c, 1.0);
          #include <encodings_fragment>
          #include <fog_fragment>
        }`,
    }));
    agua.position.y = -0.012;
    agua.receiveShadow = false;
    raiz.add(agua);
    Lsol.add(faixa(pts.concat(), 0.5, () => 0.05, true, 0.32), new THREE.Matrix4(), corPedra('#e2d8c6', 0.06));
    // obstáculo do lago (com folga)
    for (let i = 0; i < 32; i++) { const a = lagoPonto(i / 32 * TAU, 0.25), b = lagoPonto((i + 1) / 32 * TAU, 0.25); barreiraMundo(a[0], a[1], b[0], b[1]); }
    // vitórias-régias
    const rr = rng(3);
    for (let i = 0; i < 9; i++) { const t = rr() * TAU, k = 0.35 + rr() * 0.45; const p = [LAGO.cx + LAGO.rx * k * Math.cos(t), LAGO.cz + LAGO.rz * k * Math.sin(t)]; Lsol.add(gCil(12), mat(p[0], 0.0, p[1], rr() * 6, 0.25 + rr() * 0.25, 0.018, 0.25 + rr() * 0.25), i % 4 ? '#5c9a45' : '#7fb85a'); if (i % 3 === 0) es(Lsol, MUNDO, p[0] + 0.08, 0.05, p[1], 0.07, 0.05, 0.07, '#ffb3c6', 8, 5); }
    // caminho em volta do lago
    const loop = [];
    for (let i = 0; i < 72; i++) { const t = i / 72 * TAU; loop.push([LAGO.cx + LAGO_LOOP.rx * Math.cos(t), LAGO.cz + LAGO_LOOP.rz * Math.sin(t)]); }
    caminhoChao(faixa(loop, 1.5, null, true, 0.08));
    caminhoChao(faixa([[0, 12.1], [0, LAGO.cz - LAGO_LOOP.rz + 0.2]], 1.8, null, false, 0.08));
    caminhoChao(faixa([[0, LAGO.cz + LAGO_LOOP.rz - 0.2], [0, 27.0]], 1.6, null, false, 0.08));
    // deck de madeira (ponto de foto) no lado oeste
    const deck = new Quadro(-6.15, LAGO.cz, Math.PI / 2);
    for (let i = 0; i < 7; i++) bx(Lsol, deck, 0, -0.07, -1.0 + i * 0.27 + 0.13, 1.6, 0.07, 0.25, i % 2 ? '#c99a66' : '#bd8d5a');
    [[-0.75, 0], [0.75, 0]].forEach(([x]) => { cl(Lsol, deck, x, -0.3, -0.85, 0.05, 0.3, '#8a5f3a', 6); cl(Lsol, deck, x, -0.3, 0.85, 0.05, 0.3, '#8a5f3a', 6); });
    // canteiros de flores (instanciados depois) — guarda as áreas
    canteiros.push({ tipo: 'anel', cx: LAGO.cx, cz: LAGO.cz, rx0: LAGO.rx * 1.18 + 0.4, rx1: LAGO_LOOP.rx - 1.0, rz0: LAGO.rz * 1.18 + 0.4, rz1: LAGO_LOOP.rz - 1.0, n: PC ? 260 : 150, evitar: [[-6.3, LAGO.cz, 1.4]] });
    canteiros.push({ tipo: 'anel', cx: LAGO.cx, cz: LAGO.cz, rx0: LAGO_LOOP.rx + 1.0, rx1: LAGO_LOOP.rx + 2.6, rz0: LAGO_LOOP.rz + 1.0, rz1: LAGO_LOOP.rz + 2.2, n: PC ? 240 : 140, evitar: [[0, 13.0, 1.5], [0, 25.6, 1.5], [-9.2, 23.1, 1.6], [9.2, 23.1, 1.6], [-9.3, 15.6, 1.3]] });
    // postos: fotografando (4), caminhando (5), lendo-banco no jardim (4)
    posto('fotografando-campo', z, deck, 0, -0.45, Math.PI, { aprox: [0, -1.5] });
    posto('fotografando-campo', z, J, 7.9, 17.0, -Math.PI / 2 - 0.5);
    posto('fotografando-campo', z, J, -4.3, 14.15, 0.35);
    posto('fotografando-campo', z, J, 3.6, 24.6, Math.PI - 0.3);
    [200, 250, 290, 335, 25].forEach((g) => {
      const t = g * DEG, x = LAGO.cx + LAGO_LOOP.rx * Math.cos(t), zz = LAGO.cz + LAGO_LOOP.rz * Math.sin(t);
      const tx = -LAGO_LOOP.rx * Math.sin(t), tz = LAGO_LOOP.rz * Math.cos(t);
      posto('caminhando-jardim', z, J, x, zz, Math.atan2(tx, tz));
    });
    // bancos de frente pro lago
    [[150, z], [30, z]].forEach(([g]) => {
      const t = g * DEG; const x = LAGO.cx + LAGO_LOOP.rx * Math.cos(t), zz = LAGO.cz + LAGO_LOOP.rz * Math.sin(t);
      const nx = Math.cos(t) / LAGO_LOOP.rx, nz = Math.sin(t) / LAGO_LOOP.rz, nl = Math.hypot(nx, nz);
      const bxp = x + nx / nl * 1.45, bzp = zz + nz / nl * 1.45;
      const B = new Quadro(bxp, bzp, Math.atan2(-nx, -nz));
      banco(B, 1.9);
      posto('lendo-banco', z, B, -0.48, 0, 0, { aprox: [-0.48, 0.85] });
      posto('lendo-banco', z, B, 0.48, 0, 0, { aprox: [0.48, 0.85] });
      barreira(B, -1.0, -0.15, 1.0, -0.15);
    });
    // nós do jardim: anel do lago + ligações
    for (let i = 0; i < 14; i++) { const t = i / 14 * TAU; nos.push({ x: LAGO.cx + LAGO_LOOP.rx * Math.cos(t), z: LAGO.cz + LAGO_LOOP.rz * Math.sin(t) }); }
    nos.push({ x: 0, z: 12.6 }, { x: 0, z: 26.2 }, { x: -6.6, z: LAGO.cz }, { x: 8.9, z: 13.8 }, { x: -8.9, z: 13.8 });
    rotulos.push({ texto: 'Jardim', acento: '#6aa84f', pos: new THREE.Vector3(-2.2, 2.3, 13.1) });
  }

  // banco reto (raiz no centro do assento, sentados olham +Z)
  function banco(B, larg = 1.9) {
    for (let i = 0; i < 3; i++) bx(Lsol, B, 0, 0.4, -0.135 + i * 0.135, larg, 0.06, 0.125, i % 2 ? '#c08a55' : '#b77f4c');
    bx(Lsol, B, 0, 0.5, -0.25, larg, 0.1, 0.05, '#b77f4c', 0, -0.15); bx(Lsol, B, 0, 0.68, -0.27, larg, 0.1, 0.05, '#c08a55', 0, -0.15);
    [-larg / 2 + 0.18, larg / 2 - 0.18].forEach((x) => bx(Lsol, B, x, 0, -0.02, 0.1, 0.4, 0.42, '#d9d4cb'));
  }

  // ===================================================================== PRAÇA: bancos curvos, canteiros, postes, quadro da grana
  {
    const z = 'praca';
    zonas.praca = { nome: 'Praça', centro: new THREE.Vector3(0, 0, 0), raio: 5 };
    [45, 135, 225, 315].forEach((g) => {
      const a = g * DEG, sp = 17 * DEG;
      Lsol.add(setor(5.95, 6.5, a - sp, a + sp, 0.4, 0.46, 8, { base: true }), new THREE.Matrix4(), '#c08a55');
      Lsol.add(setor(6.42, 6.52, a - sp, a + sp, 0.5, 0.86, 8), new THREE.Matrix4(), '#b77f4c');
      [-0.7, 0, 0.7].forEach((k) => { const b = a + k * sp; bx(Lsol, MUNDO, 6.22 * Math.cos(b), 0, 6.22 * Math.sin(b), 0.42, 0.4, 0.1, '#d9d4cb', Math.atan2(Math.cos(b), Math.sin(b))); });
      Lchao.add(setor(5.6, 6.9, a - sp - 0.06, a + sp + 0.06, -0.08, -0.004, 8), new THREE.Matrix4(), corPedra('#e6dccb', 0.03));
      [-0.5, 0.5].forEach((k) => {
        const b = a + k * sp, x = 6.2 * Math.cos(b), zz = 6.2 * Math.sin(b);
        const ry = Math.atan2(-Math.cos(b), -Math.sin(b));
        postos.push({ id: postos.length, atividade: 'lendo-banco', zona: z, pos: new THREE.Vector3(x, 0, zz), rotY: ry, aprox: new THREE.Vector3(5.25 * Math.cos(b), 0, 5.25 * Math.sin(b)), ocupante: null });
      });
      barreiraArco(6.5, a - sp, a + sp, 3);
      // canteiro atrás do banco
      Lsol.add(setor(6.75, 7.6, a - sp - 0.05, a + sp + 0.05, -0.05, 0.22, 8), new THREE.Matrix4(), '#e8e1d4');
      Lchao.add(setor(6.85, 7.5, a - sp, a + sp, 0.22, 0.23, 8, { fora: false, dentro: false, pontas: false }), new THREE.Matrix4(), '#6b4f36');
      canteiros.push({ tipo: 'arco', r0: 6.95, r1: 7.4, a0: a - sp, a1: a + sp, y: 0.23, n: PC ? 60 : 40 });
    });
    // quadro da grana (clicável)
    const a = 246 * DEG, r = 8.3;
    const Q = new Quadro(r * Math.cos(a), r * Math.sin(a), Math.atan2(-Math.cos(a), -Math.sin(a)));
    bx(Lsol, Q, -1.25, 0, 0, 0.1, 2.75, 0.1, '#2f3136'); bx(Lsol, Q, 1.25, 0, 0, 0.1, 2.75, 0.1, '#2f3136');
    bx(Lsol, Q, 0, 1.1, -0.03, 2.62, 1.55, 0.08, '#2f3136');
    bx(Lsol, Q, 0, 0, 0, 1.0, 0.08, 0.6, '#d9d4cb');
    const cv = desenharQuadroGrana();
    const tx = new THREE.CanvasTexture(cv);
    if (LIN) tx.encoding = THREE.sRGBEncoding;
    tx.anisotropy = 4;
    const quadro = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.41), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }));
    quadro.position.copy(Q.P(0, 1.875, 0.02));
    quadro.rotation.y = Q.ry;
    quadro.userData = { acao: 'monetizacao', rotulo: 'Quadro de monetização' };
    quadro.name = 'quadro-monetizacao';
    raiz.add(quadro);
    objetosClicaveis.push(quadro);
    barreira(Q, -1.35, 0, 1.35, 0);
  }

  // postes de luz ao longo dos caminhos
  {
    const poste = (x, z) => {
      cl(Lsol, MUNDO, x, 0, z, 0.15, 0.06, '#3a3d45', 10);
      cl(Lsol, MUNDO, x, 0, z, 0.05, 2.85, '#3a3d45', 8);
      Lluz.add(gCil(12), mat(x, 3.0, z, 0, 0.13, 0.32, 0.13), '#fff1d6');
      cl(Lsol, MUNDO, x, 3.16, z, 0.17, 0.05, '#3a3d45', 12);
      Lpoca.add(new THREE.CircleGeometry(1, 20), mat(x, 0.025, z, 0, 2.6, 2.6, 1, -Math.PI / 2), (pw, nw, pl) => { const k = 1 - Math.min(1, Math.hypot(pl.x, pl.y)); return new THREE.Color().copy(corS('#ffbe6a')).multiplyScalar(k * k * k * 0.75); });
    };
    [62].concat(ZONAS_DEF.map((z) => z.a0)).forEach((g) => { const a = g * DEG; poste(12.55 * Math.cos(a), 12.55 * Math.sin(a)); });
    for (let i = 0; i < 16; i++) { const a = (i * 22.5 + 11) * DEG; if (Math.sin(a) > 0.86) continue; poste(26.6 * Math.cos(a), 26.6 * Math.sin(a)); }
    [[-8.4, 19.2], [8.4, 19.2]].forEach(([x, z]) => poste(x, z));
    // praça acesa à noite (é onde as agentes vêm falar com o Allan)
    Lpoca.add(new THREE.CircleGeometry(1, 40), mat(0, 0.03, 0, 0, 5.6, 5.6, 1, -Math.PI / 2), (pw, nw, pl) => { const k = 1 - Math.min(1, Math.hypot(pl.x, pl.y)); return new THREE.Color().copy(corS('#ffc982')).multiplyScalar(Math.pow(k, 1.6) * 0.55); });
  }

  // ===================================================================== ÁRVORES
  const arvA = [], arvB = [], arvC = [], palm = [], arbustos = [];
  {
    const rr = rng(1234);
    // pomar no anel entre os pavilhões e o prédio
    const jardimA0 = 60 * DEG, jardimA1 = 120 * DEG;
    ZONAS_DEF.forEach((def) => {
      const a0 = def.a0 * DEG, a1 = def.a1 * DEG;
      const rows = def.r1 > 23 ? [25.1] : [23.4, 25.6];
      rows.forEach((r, ri) => {
        const n = Math.max(2, Math.round((a1 - a0) * r / 4.3));
        for (let i = 0; i < n; i++) {
          const a = a0 + (i + 0.5 + (ri % 2 ? 0.5 : 0)) / n * (a1 - a0);
          if (a > jardimA0 - 0.05 && a < jardimA1 + 0.05) continue;
          const x = r * Math.cos(a), z = r * Math.sin(a);
          (rr() < 0.18 ? arvB : arvA).push([x, z, 0.8 + rr() * 0.35, rr() * TAU]);
        }
      });
    });
    // jardim
    arvB.push([9.3, 20.7, 1.0, 1], [-9.3, 20.7, 1.05, 2], [5.6, 25.9, 0.85, 3], [-5.6, 25.9, 0.9, 4]);
    arvA.push([9.9, 25.2, 0.9, 5], [-9.9, 25.2, 0.95, 6]);
    // lado de fora: aglomerados
    const nFora = PC ? 340 : 190;
    let tent = 0;
    while (arvC.length < nFora && tent < 6000) {
      tent++;
      const a = rr() * TAU, r = 46 + Math.pow(rr(), 1.4) * 150;
      const x = r * Math.cos(a), z = r * Math.sin(a);
      if (Math.abs(r - 89) < 6.5) continue;
      const rp = 58 + 3.5 * Math.sin(a * 3 + 0.7); if (Math.abs(r - rp) < 2.5) continue;
      if (Math.hypot(x + 62, z + 50) < 13) continue;
      if (fbm(x * 0.03 + 9, z * 0.03 - 2) < 0.47 && rr() > 0.12) continue;
      arvC.push([x, z, 0.8 + rr() * 0.6, rr() * TAU]);
    }
    // palmeiras imperiais na avenida
    for (let i = 0; i < 40; i++) { const a = (i + 0.5) / 40 * TAU; [84.3, 93.7].forEach((r, k) => { if ((i + k) % 2) return; palm.push([r * Math.cos(a), r * Math.sin(a), 0.9 + rr() * 0.25, rr() * TAU]); }); }
    // arbustos na base do prédio e nas frentes dos pavilhões
    for (let i = 0; i < 90; i++) { const a = i / 90 * TAU + rr() * 0.02; const r = 26.25 + rr() * 0.3; if (Math.sin(a) > 0.86 && Math.abs(Math.cos(a)) < 0.12) continue; arbustos.push([r * Math.cos(a), r * Math.sin(a), 0.55 + rr() * 0.35]); }
    for (let i = 0; i < 70; i++) { const a = i / 70 * TAU + rr() * 0.02; const r = 43.2 + rr() * 0.4; arbustos.push([r * Math.cos(a), r * Math.sin(a), 0.6 + rr() * 0.4]); }
  }
  const instanciar = (geo, material, lista, fnMat, fnCor, sombra = true) => {
    const im = new THREE.InstancedMesh(geo, material, lista.length);
    const c = new THREE.Color();
    lista.forEach((it, i) => { im.setMatrixAt(i, fnMat(it)); if (fnCor) { fnCor(it, c, i); if (LIN) c.convertSRGBToLinear(); im.setColorAt(i, c); } });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = sombra; im.receiveShadow = true;
    raiz.add(im);
    return im;
  };
  const copa = (blobs, c0, c1, y0, y1, det = 1, frutos = null) => {
    const L = new Lote();
    blobs.forEach(([x, y, z, r, sy = 1]) => L.add(gIco(det), mat(x, y, z, 0, r, r * sy, r), grad(c0, c1, y0, y1)));
    if (frutos) { // frutinhas na casca das copas (pomar) — só onde nenhuma outra bola cobre
      const rr = rng(frutos.semente || 9);
      const dentro = (px, py, pz, k) => blobs.some(([x, y, z, r, sy = 1], j) => j !== k && Math.hypot((px - x) / r, (py - y) / (r * sy), (pz - z) / r) < 0.98);
      let n = 0;
      for (let t = 0; t < frutos.n * 8 && n < frutos.n; t++) {
        const k = t % blobs.length, [x, y, z, r, sy = 1] = blobs[k];
        const a = rr() * TAU, el = (rr() * 1.2 - 0.45);
        const dx = Math.cos(a) * Math.cos(el), dy = Math.sin(el), dz = Math.sin(a) * Math.cos(el);
        const px = x + dx * r * 1.0, py = y + dy * r * sy * 1.0, pz = z + dz * r * 1.0;
        if (dentro(px, py, pz, k)) continue;
        L.add(gOcta(), mat(px, py, pz, a, 0.13, 0.13, 0.13), frutos.cores[n % frutos.cores.length]);
        n++;
      }
    }
    return L.build(LIN);
  };
  const ty = (x, z) => (Math.hypot(x, z) > 41 ? alturaFora(x, z) : -0.03);
  {
    const todos = arvA.map((a) => [...a, 'A']).concat(arvB.map((a) => [...a, 'B']), arvC.map((a) => [...a, 'C']), palm.map((a) => [...a, 'P']));
    instanciar(gTronco(PC ? 8 : 6).clone().translate(0, 0.5, 0), matTronco, todos,
      ([x, z, s, r, t]) => { const h = t === 'A' ? 1.5 : t === 'B' ? 2.3 : t === 'C' ? 2.2 : 8.5; const w = t === 'P' ? 0.17 : t === 'C' ? 0.24 : t === 'B' ? 0.15 : 0.17; return mat(x, ty(x, z), z, r, w * s, h * s, w * s); },
      ([, , , , t], c) => c.set(t === 'P' ? '#b9ad9a' : t === 'B' ? '#6e5640' : '#7a5a3c'), true).castShadow = true;
    // pomar: copa redonda com frutas (laranja, tangerina, caqui)
    const gA = copa([[0, 2.55, 0, 1.25, 0.9], [0.75, 2.3, 0.35, 0.85], [-0.65, 2.4, -0.4, 0.9], [0.1, 3.25, -0.1, 0.8], [-0.3, 2.2, 0.6, 0.7]], '#3f7d35', '#9ccc5a', 1.6, 3.6, 1,
      { n: 18, cores: ['#ff8a1f', '#ffb22e', '#ff6a2b', '#ffd23a'], semente: 31 });
    instanciar(gA, matFolha, arvA, ([x, z, s, r]) => mat(x, ty(x, z), z, r, s, s, s), (it, c, i) => c.setHSL(0.22 + ((i * 37) % 10) * 0.006, 0.35, 0.86 + ((i * 53) % 7) * 0.02));
    // ipês (amarelo e rosa): copa clara, a cor vem da instância
    const gB = copa([[0, 3.55, 0, 1.45, 0.6], [1.05, 3.3, 0.4, 1.0, 0.65], [-0.95, 3.4, -0.5, 1.05, 0.65], [0.3, 3.95, -0.85, 0.9, 0.6], [-0.35, 3.85, 0.9, 0.85, 0.6]], '#e8dccb', '#ffffff', 2.9, 4.3);
    instanciar(gB, matFolha, arvB, ([x, z, s, r]) => mat(x, ty(x, z), z, r, s, s, s), (it, c, i) => c.set(i % 3 === 1 ? '#ff9cc4' : '#ffd23a'));
    // lá fora (longe da câmera): no celular, copa low-poly
    const gC = copa([[0, 3.4, 0, 2.0, 0.85], [0.6, 4.5, 0.3, 1.3], [-0.9, 3.1, -0.5, 1.3]], '#2f5f2c', '#79a84a', 2.0, 5.2, PC ? 1 : 0);
    instanciar(gC, matFolha, arvC, ([x, z, s, r]) => mat(x, ty(x, z), z, r, s, s * (0.9 + (r % 0.3)), s), (it, c, i) => c.setHSL(0.25 + ((i * 13) % 9) * 0.006, 0.35, 0.58 + ((i * 7) % 11) * 0.02), false);
    // palmeira: folhas
    const Lp = new Lote();
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU, inc = 0.35 + (i % 3) * 0.18;
      for (let k = 0; k < 4; k++) {
        const t0 = k / 4, t1 = (k + 1) / 4, len = 2.6;
        const p0 = [Math.sin(a) * len * t0, -Math.pow(t0, 2) * 1.4 * inc + t0 * 0.6, Math.cos(a) * len * t0];
        const p1 = [Math.sin(a) * len * t1, -Math.pow(t1, 2) * 1.4 * inc + t1 * 0.6, Math.cos(a) * len * t1];
        const w0 = 0.45 * Math.sin(Math.PI * (0.15 + t0 * 0.85)), w1 = 0.45 * Math.sin(Math.PI * (0.15 + t1 * 0.85));
        const g = new Geo(); const cx = Math.cos(a), cz = -Math.sin(a);
        g.quad([p0[0] - cx * w0, p0[1], p0[2] - cz * w0], [p0[0] + cx * w0, p0[1], p0[2] + cz * w0], [p1[0] + cx * w1, p1[1], p1[2] + cz * w1], [p1[0] - cx * w1, p1[1], p1[2] - cz * w1], [0, 1, 0]);
        Lp.add(g.build(), new THREE.Matrix4(), k > 1 ? '#6fa046' : '#4f8a36');
      }
    }
    const matPalma = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: rampaFolha, side: THREE.DoubleSide });
    comVento(matPalma, 0.0);
    instanciar(Lp.build(LIN), matPalma, palm, ([x, z, s, r]) => mat(x, ty(x, z) + 8.5 * s, z, r, s, s, s), null, false);
    const gArb = copa([[0, 0.35, 0, 0.55, 0.75], [0.4, 0.3, 0.1, 0.4, 0.8], [-0.35, 0.32, -0.1, 0.42, 0.8]], '#3d7032', '#7fb04c', 0.0, 0.8, 0);
    instanciar(gArb, matFolha, arbustos, ([x, z, s]) => mat(x, ty(x, z), z, x * 3 + z, s, s, s), (it, c, i) => c.setHSL(0.27, 0.2, 0.85 + (i % 4) * 0.04), false);
  }

  // ===================================================================== FLORES (instanciadas)
  {
    const rr = rng(77);
    const cores = ['#ff8fb1', '#ff7a5c', '#ffd23f', '#fff6e8', '#b99cff', '#e84a5f', '#ffb347'];
    const lista = [];
    canteiros.forEach((cv) => {
      for (let i = 0; i < cv.n; i++) {
        let x, z, y = 0;
        if (cv.tipo === 'anel') {
          const t = rr() * TAU, k = rr();
          x = cv.cx + lerp(cv.rx0, cv.rx1, k) * Math.cos(t); z = cv.cz + lerp(cv.rz0, cv.rz1, k) * Math.sin(t);
          if (cv.evitar && cv.evitar.some(([ex, ez, er]) => Math.hypot(x - ex, z - ez) < er)) continue;
        } else {
          const a = lerp(cv.a0, cv.a1, rr()), r = lerp(cv.r0, cv.r1, rr());
          x = r * Math.cos(a); z = r * Math.sin(a); y = cv.y;
        }
        const grupo = Math.floor(fbm(x * 0.5, z * 0.5) * 7) % cores.length;
        lista.push([x, y, z, 0.7 + rr() * 0.6, cores[(grupo + (rr() < 0.2 ? 1 : 0)) % cores.length]]);
      }
    });
    const gf = new THREE.IcosahedronGeometry(0.11, 0); gf.translate(0, 0.16, 0);
    const caule = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 3, 1, true); caule.translate(0, 0.08, 0);
    instanciar(gf, matFlor, lista, ([x, y, z, s]) => mat(x, y, z, x * 7, s, s * 0.8, s), ([, , , , c], cc) => cc.set(c), false);
    instanciar(caule, matFlor, lista, ([x, y, z, s]) => mat(x, y, z, 0, 1, s, 1), (it, cc) => cc.set('#4f8a36'), false);
  }

  // ===================================================================== MALHAS FINAIS DOS LOTES
  const mSol = new THREE.Mesh(Lsol.build(LIN), matSol); mSol.castShadow = true; mSol.receiveShadow = true; raiz.add(mSol);
  const mChao = new THREE.Mesh(Lchao.build(LIN), matChao); mChao.receiveShadow = true; raiz.add(mChao);
  const atlas = new THREE.CanvasTexture(desenharAtlas());
  if (LIN) atlas.encoding = THREE.sRGBEncoding;
  atlas.anisotropy = 4;
  const matTela = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: false, toneMapped: false });
  const mTela = new THREE.Mesh(Ltela.build(LIN), matTela); raiz.add(mTela);
  const matLuz = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const mLuz = new THREE.Mesh(Lluz.build(LIN), matLuz); raiz.add(mLuz);
  const matPoca = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, toneMapped: false });
  const mPoca = new THREE.Mesh(Lpoca.build(LIN), matPoca); mPoca.renderOrder = 2; raiz.add(mPoca);
  const vidroU = { uCeu: { value: K('#9cc3ee') }, uHor: { value: K('#fff0dc') }, uNoite: noiteU };
  {
    const um = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
    Object.assign(um, vidroU);
    const matVidro = new THREE.ShaderMaterial({
      uniforms: um, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, vertexColors: true,
      vertexShader: `attribute float alfa; varying vec3 vW; varying vec3 vN; varying float vA; varying vec3 vC;
        #include <fog_pars_vertex>
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vA = alfa; vC = color;
          vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform vec3 uCeu, uHor; uniform float uNoite; varying vec3 vW; varying vec3 vN; varying float vA; varying vec3 vC;
        #include <fog_pars_fragment>
        void main(){
          vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
          float c = abs(dot(N, V)); float fr = pow(1.0 - c, 3.0);
          vec3 R = reflect(-V, N * sign(dot(N, V)));
          vec3 sky = mix(uHor, uCeu, clamp(R.y, 0.0, 1.0));
          vec3 col = mix(vC, sky, 0.35 + 0.5 * fr);
          float st = smoothstep(0.93, 1.0, sin((vW.x + vW.z) * 0.7 + vW.y * 0.9) * 0.5 + 0.5);
          col += st * 0.18 * (1.0 - uNoite);
          float a = vA * (0.07 + 0.5 * fr) + st * 0.05 * vA;
          gl_FragColor = vec4(col * (1.0 - 0.6 * uNoite), a);
          #include <encodings_fragment>
          #include <fog_fragment>
        }`,
    });
    const mVid = new THREE.Mesh(Lvid.build(LIN), matVidro);
    mVid.renderOrder = 1;
    raiz.add(mVid);
  }
  // LEDs dos racks (pisca no shader, sem CPU por quadro)
  {
    const L = new Lote(); const fases = [];
    const qd = new THREE.PlaneGeometry(0.035, 0.018);
    for (let i = 0; i < ledsF.length; i++) {
      L.add(qd, mat(ledsP[i * 4], ledsP[i * 4 + 1], ledsP[i * 4 + 2], ledsP[i * 4 + 3]), ledsC[i]);
      for (let k = 0; k < 4; k++) fases.push(ledsF[i]);
    }
    const g = L.build(LIN);
    g.setAttribute('fase', new THREE.Float32BufferAttribute(fases, 1));
    const um = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
    um.uT = tempoU;
    const mLed = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: um, fog: true, vertexColors: true,
      vertexShader: `attribute float fase; varying float vF; varying vec3 vC;
        #include <fog_pars_vertex>
        void main(){ vF = fase; vC = color; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform float uT; varying float vF; varying vec3 vC;
        #include <fog_pars_fragment>
        void main(){ float on = step(0.42, fract(sin(vF * 78.233 + floor(uT * (1.2 + fract(vF * 13.7) * 5.0))) * 43758.5453));
          gl_FragColor = vec4(vC * (0.18 + 1.0 * on), 1.0);
          #include <encodings_fragment>
          #include <fog_fragment>
        }`,
    }));
    raiz.add(mLed);
  }
  // holograma (estúdio)
  {
    const grp = new THREE.Group();
    grp.position.copy(holoPos);
    const eg = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.34, 1));
    const pos = Array.from(eg.attributes.position.array);
    for (let k = 0; k < 2; k++) for (let i = 0; i < 48; i++) {
      const a = i / 48 * TAU, b = (i + 1) / 48 * TAU, r = 0.5 + k * 0.1, inc = k ? 0.5 : -0.35;
      const P = (t) => [Math.cos(t) * r, Math.sin(t) * r * Math.sin(inc), Math.sin(t) * r * Math.cos(inc)];
      pos.push(...P(a), ...P(b));
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const linhas = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: K('#a9c1ff'), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.62, 24, 1, true), new THREE.MeshBasicMaterial({ color: K('#7d6cff'), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    cone.position.y = -0.32;
    grp.add(linhas, cone);
    raiz.add(grp);
    anima.push((dt, t) => { linhas.rotation.y = t * 0.6; linhas.rotation.x = Math.sin(t * 0.4) * 0.15; linhas.position.y = Math.sin(t * 1.3) * 0.04; });
  }
  // rótulos flutuantes das zonas
  rotulos.forEach((r) => {
    const cv = desenharRotulo(r.texto, r.acento);
    const tx = new THREE.CanvasTexture(cv);
    if (LIN) tx.encoding = THREE.sRGBEncoding;
    tx.generateMipmaps = true; tx.minFilter = THREE.LinearMipmapLinearFilter; tx.anisotropy = 2;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
    const asp = cv.width / cv.height;
    sp.scale.set(asp, 1, 1);
    sp.position.copy(r.pos);
    sp.renderOrder = 5;
    sp.name = 'rotulo-' + r.texto;
    sp.userData.rotulo = r.texto;
    // ~mesmo tamanho na tela de longe; de perto (câmera chegando numa agente) some pra não tampar
    sp.onBeforeRender = (rr, ss, cam) => {
      const dd = cam.position.distanceTo(sp.position);
      const k = clamp(dd * 0.033, 0.75, 2.7);
      sp.scale.set(k * asp, k, 1);
      sp.material.opacity = smooth(9, 16, dd);
      sp.updateMatrixWorld();
    };
    raiz.add(sp);
  });

  // ===================================================================== NAVEGAÇÃO
  // nós: anel do caminho (r=11), calçada junto ao prédio (r=27.8) e o centro
  nos.push({ x: 0, z: 0 });
  for (let i = 0; i < 36; i++) { const a = i / 36 * TAU; nos.push({ x: 11 * Math.cos(a), z: 11 * Math.sin(a) }); }
  for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; nos.push({ x: 27.8 * Math.cos(a), z: 27.8 * Math.sin(a) }); }
  barreiraArco(28.85, 0, TAU, 72);
  const FOLGA = 0.4;
  const NO = obst.length / 4;
  const OB = new Float32Array(obst);
  function dSegSeg2(ax, az, bx_, bz, cx, cz, dx, dz) {
    // interseção?
    const d1x = bx_ - ax, d1z = bz - az, d2x = dx - cx, d2z = dz - cz;
    const den = d1x * d2z - d1z * d2x;
    if (Math.abs(den) > 1e-9) {
      const t = ((cx - ax) * d2z - (cz - az) * d2x) / den, u = ((cx - ax) * d1z - (cz - az) * d1x) / den;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return 0;
    }
    const pt = (px, pz, sx, sz, ex, ez) => { const vx = ex - sx, vz = ez - sz, l2 = vx * vx + vz * vz; let t = l2 > 0 ? ((px - sx) * vx + (pz - sz) * vz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const qx = sx + vx * t - px, qz = sz + vz * t - pz; return qx * qx + qz * qz; };
    return Math.min(pt(ax, az, cx, cz, dx, dz), pt(bx_, bz, cx, cz, dx, dz), pt(cx, cz, ax, az, bx_, bz), pt(dx, dz, ax, az, bx_, bz));
  }
  function livre(ax, az, bx_, bz, folga = FOLGA) {
    const f2 = folga * folga;
    const minx = Math.min(ax, bx_) - folga, maxx = Math.max(ax, bx_) + folga, minz = Math.min(az, bz) - folga, maxz = Math.max(az, bz) + folga;
    for (let i = 0; i < NO; i++) {
      const cx = OB[i * 4], cz = OB[i * 4 + 1], dx = OB[i * 4 + 2], dz = OB[i * 4 + 3];
      if ((cx < minx && dx < minx) || (cx > maxx && dx > maxx) || (cz < minz && dz < minz) || (cz > maxz && dz > maxz)) continue;
      if (dSegSeg2(ax, az, bx_, bz, cx, cz, dx, dz) < f2) return false;
    }
    return true;
  }
  // remove nós encostados em obstáculos
  const NOS = nos.filter((n) => livre(n.x, n.z, n.x + 1e-4, n.z, FOLGA * 0.9));
  const NN = NOS.length;
  const viz = NOS.map(() => []);
  for (let i = 0; i < NN; i++) for (let j = i + 1; j < NN; j++) {
    const a = NOS[i], b = NOS[j], dd = Math.hypot(a.x - b.x, a.z - b.z);
    if (dd > 9.5) continue;
    if (livre(a.x, a.z, b.x, b.z)) { viz[i].push([j, dd]); viz[j].push([i, dd]); }
  }
  const _dist = new Float64Array(NN), _ant = new Int32Array(NN), _feito = new Uint8Array(NN);
  function visiveis(p) {
    const out = [];
    for (let i = 0; i < NN; i++) { const n = NOS[i]; const dd = Math.hypot(n.x - p.x, n.z - p.z); if (dd < 16 && livre(p.x, p.z, n.x, n.z)) out.push([i, dd]); }
    if (!out.length) for (let i = 0; i < NN; i++) { const n = NOS[i]; const dd = Math.hypot(n.x - p.x, n.z - p.z); if (dd < 40 && livre(p.x, p.z, n.x, n.z, 0.12)) out.push([i, dd]); }
    return out;
  }
  function rota(a, b) { // a, b: {x,z} → lista de {x,z} (sem a)
    if (livre(a.x, a.z, b.x, b.z)) return [b];
    const src = visiveis(a), dst = visiveis(b);
    if (!src.length || !dst.length) return [b];
    _dist.fill(Infinity); _ant.fill(-1); _feito.fill(0);
    src.forEach(([i, dd]) => { if (dd < _dist[i]) _dist[i] = dd; });
    const fim = new Map(dst.map(([i, dd]) => [i, dd]));
    let melhor = -1, melhorC = Infinity;
    for (;;) {
      let u = -1, du = Infinity;
      for (let i = 0; i < NN; i++) if (!_feito[i] && _dist[i] < du) { du = _dist[i]; u = i; }
      if (u < 0 || du >= melhorC) break;
      _feito[u] = 1;
      if (fim.has(u)) { const c = du + fim.get(u); if (c < melhorC) { melhorC = c; melhor = u; } }
      for (const [v, w] of viz[u]) { const nd = du + w; if (nd < _dist[v]) { _dist[v] = nd; _ant[v] = u; } }
    }
    if (melhor < 0) return [b];
    const seq = [];
    for (let u = melhor; u >= 0; u = _ant[u]) seq.push(NOS[u]);
    seq.reverse();
    const pts = [a, ...seq, b];
    // puxa o barbante
    const out = [];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !livre(pts[i].x, pts[i].z, pts[j].x, pts[j].z)) j--;
      out.push(pts[j]); i = j;
    }
    return out;
  }
  function postoPerto(p, raio) {
    let m = null, md = raio;
    for (const q of postos) { const dd = Math.hypot(q.pos.x - p.x, q.pos.z - p.z); if (dd < md) { md = dd; m = q; } }
    return m;
  }
  function caminho(de, para) {
    if (!de || !para) return para ? [para.clone()] : [];
    const out = [];
    let a = { x: de.x, z: de.z };
    const pDe = postoPerto(de, 1.15);
    if (pDe && Math.hypot(pDe.aprox.x - de.x, pDe.aprox.z - de.z) > 0.2) { out.push(new THREE.Vector3(pDe.aprox.x, 0, pDe.aprox.z)); a = { x: pDe.aprox.x, z: pDe.aprox.z }; }
    const pPara = postoPerto(para, 0.06);
    let b = { x: para.x, z: para.z };
    const usarAprox = pPara && Math.hypot(pPara.aprox.x - para.x, pPara.aprox.z - para.z) > 0.2;
    if (usarAprox) b = { x: pPara.aprox.x, z: pPara.aprox.z };
    rota(a, b).forEach((p) => out.push(new THREE.Vector3(p.x, 0, p.z)));
    if (usarAprox) out.push(para.clone());
    else out[out.length - 1].y = para.y;
    // tira pontos repetidos
    const lim = [];
    out.forEach((p) => { const u = lim[lim.length - 1] || de; if (Math.hypot(p.x - u.x, p.z - u.z) > 0.05 || p === out[out.length - 1]) lim.push(p); });
    return lim.length ? lim : [para.clone()];
  }

  // ===================================================================== LUZ DO DIA (setHora)
  const CICLO = [
    { h: 0, topo: '#0b1431', hor: '#24345f', baixo: '#141a2a', fog: '#1f2b4c', sol: '#9fb4ff', si: 0.2, hc: '#4a5a92', hg: '#141a26', hi: 0.42, noite: 1, agua: '#0f2238', vidro: '#2c3a5e' },
    { h: 4.9, topo: '#0e1838', hor: '#2c3c66', baixo: '#161c2c', fog: '#26345a', sol: '#9fb4ff', si: 0.18, hc: '#4a5a92', hg: '#141a26', hi: 0.42, noite: 1, agua: '#0f2238', vidro: '#2c3a5e' },
    { h: 5.9, topo: '#41609e', hor: '#f3ae80', baixo: '#5a4a48', fog: '#e6a882', sol: '#ff9a5c', si: 0.45, hc: '#93a3d0', hg: '#4a3c34', hi: 0.48, noite: 0.45, agua: '#2a4a6e', vidro: '#a8b6d6' },
    { h: 7.0, topo: '#6c9fe3', hor: '#ffd9ae', baixo: '#b9a586', fog: '#ffdcb6', sol: '#ffc58c', si: 0.82, hc: '#c3d6f2', hg: '#8f7c5c', hi: 0.6, noite: 0, agua: '#245a86', vidro: '#cfe2f3' },
    { h: 9.5, topo: '#5f9ce7', hor: '#ffe8cc', baixo: '#c4b394', fog: '#fde6cc', sol: '#ffe2b8', si: 0.86, hc: '#c9def6', hg: '#8f8462', hi: 0.62, noite: 0, agua: '#245a86', vidro: '#d8e8f6' },
    { h: 12, topo: '#4e8fe0', hor: '#dcebfa', baixo: '#c8c4b0', fog: '#e4eef8', sol: '#fff7ea', si: 0.9, hc: '#d2e3f7', hg: '#8d8a70', hi: 0.64, noite: 0, agua: '#245a86', vidro: '#dfeefa' },
    { h: 15, topo: '#5690dc', hor: '#f2e6d0', baixo: '#c8bda4', fog: '#f2e7d4', sol: '#fff0d6', si: 0.88, hc: '#cfdcef', hg: '#8f8466', hi: 0.62, noite: 0, agua: '#245a86', vidro: '#dceaf6' },
    { h: 16.8, topo: '#5b84cf', hor: '#ffcd94', baixo: '#b39a78', fog: '#ffd3a2', sol: '#ffb867', si: 0.86, hc: '#cbc8e0', hg: '#8a7356', hi: 0.58, noite: 0, agua: '#2a5580', vidro: '#e8dccb' },
    { h: 17.9, topo: '#3f5aa0', hor: '#ff9868', baixo: '#7a5a48', fog: '#f29a74', sol: '#ff8040', si: 0.55, hc: '#9d9cc6', hg: '#5a4638', hi: 0.5, noite: 0.25, agua: '#2a4466', vidro: '#c9a8a0' },
    { h: 18.8, topo: '#1e2c5e', hor: '#6e5a8e', baixo: '#2a2434', fog: '#4f4670', sol: '#b49aff', si: 0.25, hc: '#5a64a0', hg: '#20202c', hi: 0.44, noite: 0.8, agua: '#14263e', vidro: '#4a4a6e' },
    { h: 20, topo: '#0e1838', hor: '#28396a', baixo: '#151b2b', fog: '#22305a', sol: '#9fb4ff', si: 0.2, hc: '#4a5a92', hg: '#141a26', hi: 0.42, noite: 1, agua: '#0f2238', vidro: '#2c3a5e' },
    { h: 24, topo: '#0b1431', hor: '#24345f', baixo: '#141a2a', fog: '#1f2b4c', sol: '#9fb4ff', si: 0.2, hc: '#4a5a92', hg: '#141a26', hi: 0.42, noite: 1, agua: '#0f2238', vidro: '#2c3a5e' },
  ];
  const _ca = new THREE.Color(), _cb = new THREE.Color();
  const mix = (k, a, b, t, alvo, linear = true) => { _ca.set(a[k]); _cb.set(b[k]); _ca.lerp(_cb, t); if (linear && LIN) _ca.convertSRGBToLinear(); alvo.copy(_ca); };
  let horaAtual = 8;
  // ---- sombra do sol que acompanha a câmera de perto ----
  // o mapa é pequeno no celular (1024 px p/ 64 m ≈ 6 cm por texel: serrilha de perto);
  // o app chama focoSombra(alvo, meia) quando aproxima e focoSombra(null) na vista geral.
  const SOMBRA_GERAL = 32;
  const solDir = new THREE.Vector3(0.5, 0.7, 0.5).normalize();
  const focoS = { x: 0, z: 0, meia: SOMBRA_GERAL };
  function aplicarSombra() {
    const m = focoS.meia, texel = (2 * m) / SM;
    // centro preso à grade de texels: a sombra não "nada" quando a câmera anda
    const cx = Math.round(focoS.x / texel) * texel, cz = Math.round(focoS.z / texel) * texel;
    sol.target.position.set(cx, 0, cz);
    sol.position.copy(solDir).multiplyScalar(95).add(sol.target.position);
    const c = sol.shadow.camera;
    if (c.right !== m) { c.left = -m; c.right = m; c.top = m; c.bottom = -m; c.updateProjectionMatrix(); }
  }
  function focoSombra(centro, meia) {
    if (!centro || !Number.isFinite(centro.x) || !Number.isFinite(centro.z)) { focoS.x = 0; focoS.z = 0; focoS.meia = SOMBRA_GERAL; }
    else {
      const mm = clamp(Number(meia) || SOMBRA_GERAL, 6, SOMBRA_GERAL);
      focoS.meia = Math.round(mm * 2) / 2; // degraus de 0,5 m: não refaz a projeção a cada quadro do zoom
      focoS.x = centro.x; focoS.z = centro.z;
      if (focoS.meia >= SOMBRA_GERAL) { focoS.x = 0; focoS.z = 0; }
    }
    aplicarSombra();
  }
  function setHora(h) {
    h = ((Number(h) % 24) + 24) % 24;
    if (!isFinite(h)) h = 8;
    horaAtual = h;
    let i = 0; while (i < CICLO.length - 2 && CICLO[i + 1].h <= h) i++;
    const A = CICLO[i], B = CICLO[i + 1], t = clamp((h - A.h) / (B.h - A.h), 0, 1);
    mix('topo', A, B, t, ceuU.uTopo.value); mix('hor', A, B, t, ceuU.uHor.value); mix('baixo', A, B, t, ceuU.uBaixo.value);
    mix('sol', A, B, t, ceuU.uSolCor.value);
    mix('fog', A, B, t, fog.color, false); scene.background = fog.color;
    mix('sol', A, B, t, sol.color); sol.intensity = lerp(A.si, B.si, t);
    mix('hc', A, B, t, hemi.color); mix('hg', A, B, t, hemi.groundColor); hemi.intensity = lerp(A.hi, B.hi, t);
    noiteU.value = lerp(A.noite, B.noite, t);
    anelU.uTopo.value.copy(ceuU.uTopo.value); anelU.uHor.value.copy(ceuU.uHor.value);
    mix('hg', A, B, t, anelU.uChao.value);
    aguaU.uCeu.value.copy(ceuU.uTopo.value).lerp(ceuU.uHor.value, 0.35); aguaU.uHor.value.copy(ceuU.uHor.value);
    mix('agua', A, B, t, aguaU.uFundo.value);
    mix('vidro', A, B, t, vidroU.uCeu.value); vidroU.uHor.value.copy(ceuU.uHor.value);
    // direção do sol: nasce a leste (+X), passa pelo lado da câmera (+Z), põe a oeste (−X)
    const dia = clamp((h - 5.8) / (18.2 - 5.8), 0, 1);
    const az = dia * Math.PI;
    const el = (h > 5.8 && h < 18.2) ? (20 + 40 * Math.sin(dia * Math.PI)) * DEG : 0;
    let dir;
    if (h > 5.6 && h < 18.4) dir = new THREE.Vector3(Math.cos(az) * Math.cos(Math.max(el, 4 * DEG)), Math.sin(Math.max(el, 4 * DEG)), Math.sin(az) * Math.cos(Math.max(el, 4 * DEG)) * 0.85);
    else dir = new THREE.Vector3(-0.45, 0.75, 0.55); // lua
    dir.normalize();
    ceuU.uSolDir.value.copy(dir);
    solDir.copy(dir);
    aplicarSombra();
    // luzes acendem
    const n = noiteU.value;
    matLuz.color.setScalar(lerp(0.78, 1.0, n));
    matPoca.opacity = n * 0.6;
    matTela.color.setScalar(lerp(0.92, 1.0, n));
  }
  setHora(typeof opcoes.hora === 'number' ? opcoes.hora : 8);

  // ===================================================================== RESERVA DE POSTOS
  function liberarPosto(slug) {
    for (const p of postos) if (p.ocupante === slug) p.ocupante = null;
  }
  function reservarPosto(atividade, slug) {
    const atual = postos.find((p) => p.ocupante === slug);
    if (atual && atual.atividade === atividade) return copiaPosto(atual);
    liberarPosto(slug);
    let livres = postos.filter((p) => p.atividade === atividade && !p.ocupante);
    if (!livres.length) {
      const zona = ZONA_DA_ATIVIDADE[atividade] || (postos.find((p) => p.atividade === atividade) || {}).zona;
      if (!zona) return null;
      livres = postos.filter((p) => p.zona === zona && !p.ocupante && p.atividade !== 'dormindo');
      if (!livres.length) return null;
    }
    const p = livres[hashTexto(String(slug) + atividade) % livres.length];
    p.ocupante = slug;
    return copiaPosto(p);
  }
  const copiaPosto = (p) => ({ pos: p.pos.clone(), rotY: p.rotY, zona: p.zona, atividade: p.atividade });

  // ===================================================================== UPDATE
  function update(dt, t) {
    const tt = typeof t === 'number' ? t : (tempoU.value + (dt || 0));
    tempoU.value = tt;
    for (let i = 0; i < anima.length; i++) anima[i](dt, tt);
  }

  const mundo = {
    pontoAllan: new THREE.Vector3(0, 0, 0),
    // ~46° de elevação, do lado do jardim olhando pro escritório: lago, praça, 3 pavilhões e o anel com o teto solar
    camerainicial: { pos: new THREE.Vector3(0, 46.4, 39.1), alvo: new THREE.Vector3(0, 0, -5) },
    zonas,
    reservarPosto,
    liberarPosto,
    caminho,
    setHora,
    update,
    objetosClicaveis,
    focoSombra,
    // extras (debug/integração)
    raiz,
    get hora() { return horaAtual; },
    listarPostos: () => postos.map((p) => ({ id: p.id, atividade: p.atividade, zona: p.zona, pos: p.pos.clone(), rotY: p.rotY, aprox: p.aprox.clone(), ocupante: p.ocupante })),
    _nav: { nos: NOS, obst: OB, livre },
    dispose() {
      scene.remove(raiz);
      raiz.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); } });
      if (scene.fog === fog) scene.fog = null;
    },
  };
  return mundo;
}
