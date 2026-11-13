// Campus — personagens anime procedurais (Three r149, global THREE, sem arquivos de imagem/modelo).
// Dono: frente "personagens". Interface e convenções: data/campus/CONTRATO.md (+ ADENDO).
//
// Arquitetura (pensada pra 19 meninas a 60 fps num iGPU / celular médio):
// - Corpo inteiro (cabeça, tronco, braços, pernas, roupa, cabelo, acessórios fixos) = UMA SkinnedMesh
//   com cores por vértice (cor + "sombra" de cada vértice) e um único material toon compartilhado
//   por todas as personagens. Contorno = a mesma geometria com um material de casco invertido.
// - Rosto = remendo (patch) na frente da cabeça com CanvasTexture 256² própria (piscar/boca redesenham).
// - Esqueleto de 25 ossos; poses procedurais (alvos + senos) com mistura de ~0,3 s entre atividades.
// - Cores autoradas em espaço linear (o app usa renderer.outputEncoding = sRGBEncoding).

const THREE = globalThis.THREE;

export const ATIVIDADES = [
  'computador', 'biblioteca-lendo', 'telefone-andando', 'observatorio', 'fones-transcrevendo', 'quadro-reuniao',
  'recepcao', 'fotografando-campo', 'sala-servidores', 'arquivo-cartas', 'gestos-holograma', 'caixa-registradora',
  'esteira', 'halteres', 'yoga', 'cafe', 'lendo-banco', 'caminhando-jardim', 'alongando', 'bicicleta',
  'dormindo', 'andando', 'parada', 'acenando', 'falando',
];

// ------------------------------------------------------------------ convenções do mundo (CONTRATO)
const ALTURA_BASE = 1.65;
const ASSENTO = 0.46;            // topo do assento acima de pos.y
const MESA = 0.74;               // tampo da mesa
const MESA_BORDA = 0.35;         // borda da frente da mesa (+Z local)
const BIKE = { selim: 0.78, guidaoZ: 0.5, guidaoY: 1.0, pedalY: 0.30, pedalZ: 0.02, pedalR: 0.15 };
const CAMA = { topo: 0.32 };
const SENTADAS = new Set(['computador', 'biblioteca-lendo', 'fones-transcrevendo', 'cafe', 'lendo-banco']);
const POSTURA = (nome) => (SENTADAS.has(nome) ? 'sentada' : nome === 'dormindo' ? 'deitada' : nome === 'bicicleta' ? 'bike' : 'pe');

// ------------------------------------------------------------------ utilitários
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function aleatorio(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; }; }
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function anguloCurto(de, para) { let d = (para - de) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }

// ------------------------------------------------------------------ cores (linear)
function cor(hex, reserva = '#cccccc') {
  const c = new THREE.Color();
  try { c.set(typeof hex === 'string' && hex ? hex : reserva); } catch { c.set(reserva); }
  c.convertSRGBToLinear();
  return [c.r, c.g, c.b];
}
const mixC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mulC = (a, k) => [a[0] * k[0], a[1] * k[1], a[2] * k[2]];
const BRANCO = [1, 1, 1];
function lumC(c) { return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function hexDe(c) { // linear → hex sRGB
  const k = new THREE.Color(c[0], c[1], c[2]); k.convertLinearToSRGB();
  return '#' + k.getHexString();
}
const SOMBRA_PELE = [0.80, 0.53, 0.55];   // tom de sombra da pele (multiplicador linear) — igual no shader do rosto
const SOMBRA_PANO = [0.44, 0.40, 0.58];   // sombra fria-lilás dos tecidos
const tPele = (c) => ({ c, s: mulC(c, SOMBRA_PELE) });
const tPano = (c) => ({ c, s: mulC(c, SOMBRA_PANO) });
const tCabelo = (c, s) => ({ c, s: mixC(s, mulC(c, [0.55, 0.5, 0.62]), 0.15) });
const tBrilho = (t, k) => ({ c: mixC(t.c, BRANCO, k), s: t.s });

// ------------------------------------------------------------------ materiais compartilhados
const TOON_PARS = `varying vec3 vViewPosition;
struct ToonMaterial { vec3 diffuseColor; vec3 shadeColor; };
void RE_Direct_Toon( const in IncidentLight directLight, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
  float g = getGradientIrradiance( geometry.normal, directLight.direction ).r;
  vec3 alb = mix( material.shadeColor, material.diffuseColor, g );
  reflectedLight.directDiffuse += directLight.color * BRDF_Lambert( alb );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
  reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct RE_Direct_Toon
#define RE_IndirectDiffuse RE_IndirectDiffuse_Toon`;

const RIM = `vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
  { float rim = 1.0 - clamp( dot( normalize( vNormal ), normalize( vViewPosition ) ), 0.0, 1.0 );
    outgoingLight += diffuseColor.rgb * smoothstep( 0.66, 0.92, rim ) * 0.16; }`;

function patchToon(rosto) {
  return (sh) => {
    if (!rosto) {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec3 sombra;\nvarying vec3 vSombra;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSombra = sombra;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSombra;');
    }
    const sombra = rosto
      ? `material.shadeColor = diffuseColor.rgb * vec3(${SOMBRA_PELE.map((v) => v.toFixed(3)).join(',')});`
      : 'material.shadeColor = vSombra * ( diffuseColor.rgb / max( vColor.rgb, vec3( 0.0001 ) ) );';
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <lights_toon_pars_fragment>', TOON_PARS)
      .replace('#include <lights_toon_fragment>', `ToonMaterial material;\nmaterial.diffuseColor = diffuseColor.rgb;\n${sombra}`)
      .replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;', RIM);
  };
}

function patchContorno(u) {
  return (sh) => {
    sh.uniforms.uLargura = u;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uLargura;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec4 c0 = modelViewMatrix * vec4( position, 1.0 );
        float lw = uLargura * clamp( 0.55 + ( -c0.z ) * 0.075, 0.55, 2.6 );
        transformed += normalize( normal ) * lw; }`);
  };
}

function texGradiente(vals) {
  const n = vals.length, d = new Uint8Array(n * 4);
  vals.forEach((v, i) => { const b = Math.round(clamp(v, 0, 1) * 255); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = b; d[i * 4 + 3] = 255; });
  const t = new THREE.DataTexture(d, n, 1, THREE.RGBAFormat);
  t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
}

function canvasTex(w, h, desenhar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  desenhar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  return t;
}

let RES = null;
function recursos() {
  if (RES) return RES;
  // 3 tons: sombra | meio-tom | luz  (coord = dotNL*0.5+0.5)
  const grad = texGradiente([0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 1, 1, 1, 1, 1, 1, 1]);
  const toon = () => {
    const m = new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: grad });
    m.onBeforeCompile = patchToon(false);
    m.customProgramCacheKey = () => 'campus-toon-v3';
    return m;
  };
  const corpo = toon();          // SkinnedMesh das personagens
  const estatico = toon();       // objetos de mão / acessórios soltos
  const largura = { value: 0.0042 };
  const contorno = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.11, 0.07, 0.085), vertexColors: true, side: THREE.BackSide });
  contorno.onBeforeCompile = patchContorno(largura);
  contorno.customProgramCacheKey = () => 'campus-contorno-v3';
  const hitbox = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
  const geoHit = new THREE.CapsuleGeometry(0.28, 1.0, 3, 8);
  const anelTex = canvasTex(128, 128, (g, w) => {
    const c = w / 2;
    const gr = g.createRadialGradient(c, c, 0, c, c, c);
    gr.addColorStop(0, 'rgba(255,255,255,0.0)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.10)');
    gr.addColorStop(0.74, 'rgba(255,255,255,0.35)'); gr.addColorStop(0.8, 'rgba(255,255,255,1)');
    gr.addColorStop(0.9, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
  const zzzTex = canvasTex(128, 128, (g) => {
    g.font = '900 54px system-ui, sans-serif'; g.lineJoin = 'round'; g.textAlign = 'center';
    const z = (txt, x, y, s) => { g.font = `900 ${s}px system-ui, sans-serif`; g.lineWidth = s * 0.16; g.strokeStyle = '#5b4a8a'; g.strokeText(txt, x, y); g.fillStyle = '#f6f0ff'; g.fillText(txt, x, y); };
    z('z', 30, 112, 34); z('z', 62, 78, 44); z('Z', 96, 46, 54);
  });
  const holoTex = canvasTex(256, 160, (g, w, h) => {
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    g.globalAlpha = 0.35; g.lineWidth = 1;
    for (let x = 20; x < w; x += 20) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x, h - 8); g.stroke(); }
    for (let y = 20; y < h; y += 20) { g.beginPath(); g.moveTo(8, y); g.lineTo(w - 8, y); g.stroke(); }
    g.globalAlpha = 0.9; g.fillStyle = '#fff';
    [0.3, 0.55, 0.8, 0.45, 0.65].forEach((v, i) => g.fillRect(24 + i * 34, h - 20 - v * 90, 20, v * 90));
    g.beginPath(); g.arc(w - 50, 46, 24, 0, TAU); g.lineWidth = 5; g.stroke();
  });
  RES = { grad, corpo, estatico, contorno, largura, hitbox, geoHit, anelTex, zzzTex, holoTex, props: new Map(), geoAnel: new THREE.PlaneGeometry(1, 1) };
  return RES;
}

// ------------------------------------------------------------------ geometria: partes
class Parte {
  constructor() { this.P = []; this.I = []; this.M = []; this.N = null; this.L = null; }
  get n() { return this.P.length / 3; }
  v(x, y, z, m) { this.P.push(x, y, z); this.M.push(m || null); return this.P.length / 3 - 1; }
  tri(a, b, c) { if (a !== b && b !== c && a !== c) this.I.push(a, b, c); }
  inverter() { for (let i = 0; i < this.I.length; i += 3) { const t = this.I[i + 1]; this.I[i + 1] = this.I[i + 2]; this.I[i + 2] = t; } return this; }
  calcNormais() {
    const n = this.n, L = this.L, P = this.P, I = this.I;
    let nl = n; if (L) { nl = 0; for (let i = 0; i < L.length; i++) if (L[i] + 1 > nl) nl = L[i] + 1; }
    const A = new Float64Array(nl * 3);
    for (let i = 0; i < I.length; i += 3) {
      const a = I[i] * 3, b = I[i + 1] * 3, c = I[i + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
      const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (let k = 0; k < 3; k++) { const j = (L ? L[I[i + k]] : I[i + k]) * 3; A[j] += nx; A[j + 1] += ny; A[j + 2] += nz; }
    }
    this.N = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      const j = (L ? L[k] : k) * 3; const x = A[j], y = A[j + 1], z = A[j + 2]; const l = Math.hypot(x, y, z) || 1;
      this.N[k * 3] = x / l; this.N[k * 3 + 1] = y / l; this.N[k * 3 + 2] = z / l;
    }
    return this;
  }
  // garante normais "pra fora" de um ponto de referência por vértice
  orientar(ref) {
    let s = 0; const P = this.P, I = this.I;
    for (let i = 0; i < I.length; i += 3) {
      const a = I[i], b = I[i + 1], c = I[i + 2];
      const pa = [P[a * 3], P[a * 3 + 1], P[a * 3 + 2]], pb = [P[b * 3], P[b * 3 + 1], P[b * 3 + 2]], pc = [P[c * 3], P[c * 3 + 1], P[c * 3 + 2]];
      const nrm = cross3(sub3(pb, pa), sub3(pc, pa));
      const cen = mul3(add3(add3(pa, pb), pc), 1 / 3);
      s += Math.sign(dot3(nrm, sub3(cen, ref(a))));
    }
    if (s < 0) this.inverter();
    return this;
  }
}

// lofts ao longo de Y: anéis elípticos {y, rx, rz, cx, cz, corte}; corte = duplica o anel (borda de cor nítida)
function loft(aneis, o) {
  const pt = new Parte(); const seg = o.seg; const aberto = !!o.arco;
  const cols = aberto ? seg + 1 : seg;
  const a0 = aberto ? o.arco[0] : 0, da = aberto ? (o.arco[1] - o.arco[0]) / seg : TAU / seg;
  const L = []; let nlog = 0; const lo = [], hi = [];
  for (let i = 0; i < aneis.length; i++) {
    const r = aneis[i]; const base = nlog; nlog += cols;
    const dup = r.corte && i > 0 && i < aneis.length - 1;
    const A = [], Bv = [];
    for (let j = 0; j < cols; j++) {
      const a = a0 + da * j;
      let x = (r.cx || 0) + r.rx * Math.sin(a), y = r.y, z = (r.cz || 0) + r.rz * Math.cos(a);
      if (o.deform) { const d = o.deform(x, y, z, a, r); if (d) { x = d[0]; y = d[1]; z = d[2]; } }
      A.push(pt.v(x, y, z, { y: r.y, a, i, lado: dup ? -1 : 0, r })); L.push(base + j);
      if (dup) { Bv.push(pt.v(x, y, z, { y: r.y, a, i, lado: 1, r })); L.push(base + j); } else Bv.push(A[j]);
    }
    lo.push(A); hi.push(Bv);
  }
  const quad = (a, d, b, c) => { pt.tri(a, d, b); pt.tri(d, c, b); };
  const segs = seg;
  for (let i = 0; i < aneis.length - 1; i++) {
    const A = hi[i], Bv = lo[i + 1];
    for (let j = 0; j < segs; j++) { const j1 = aberto ? j + 1 : (j + 1) % seg; quad(A[j], A[j1], Bv[j], Bv[j1]); }
  }
  if (o.fundo) {
    const r = aneis[0]; const c = pt.v(r.cx || 0, o.fundoY !== undefined ? o.fundoY : r.y, r.cz || 0, { y: r.y, a: 0, i: -1, lado: 0, r }); L.push(nlog++);
    for (let j = 0; j < segs; j++) { const j1 = aberto ? j + 1 : (j + 1) % seg; pt.tri(c, lo[0][j1], lo[0][j]); }
  }
  if (o.topo) {
    const k = aneis.length - 1, r = aneis[k]; const c = pt.v(r.cx || 0, o.topoY !== undefined ? o.topoY : r.y, r.cz || 0, { y: r.y, a: 0, i: k + 1, lado: 0, r }); L.push(nlog++);
    for (let j = 0; j < segs; j++) { const j1 = aberto ? j + 1 : (j + 1) % seg; pt.tri(hi[k][j], hi[k][j1], c); }
  }
  pt.L = L; pt.calcNormais();
  return pt;
}

function elipsoide(cx, cy, cz, rx, ry, rz, seg, an, deform) {
  const aneis = [];
  for (let k = 1; k < an; k++) { const th = Math.PI * (1 - k / an); const s = Math.sin(th); aneis.push({ y: cy + ry * Math.cos(th), rx: rx * s, rz: rz * s, cx, cz }); }
  return loft(aneis, { seg, fundo: true, fundoY: cy - ry, topo: true, topoY: cy + ry, deform });
}

// grade paramétrica fn(u,v)→[x,y,z]; normal opcional fnN(u,v)
function grade(nu, nv, fn, o = {}) {
  const pt = new Parte(); const cols = o.wrapU ? nu : nu + 1;
  for (let j = 0; j <= nv; j++) for (let i = 0; i < cols; i++) { const u = i / nu, v = j / nv; const p = fn(u, v); pt.v(p[0], p[1], p[2], { u, v, i, j }); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const i1 = o.wrapU ? (i + 1) % nu : i + 1;
    const a = j * cols + i, b = j * cols + i1, c = (j + 1) * cols + i1, d = (j + 1) * cols + i;
    if (o.keep && !o.keep(i, j)) continue;
    pt.tri(a, b, d); pt.tri(b, c, d);
  }
  if (o.ref) pt.orientar(o.ref);
  if (o.fnN) {
    pt.N = new Float32Array(pt.n * 3);
    for (let k = 0; k < pt.n; k++) { const m = pt.M[k]; const nn = o.fnN(m.u, m.v); pt.N[k * 3] = nn[0]; pt.N[k * 3 + 1] = nn[1]; pt.N[k * 3 + 2] = nn[2]; }
  } else pt.calcNormais();
  return pt;
}

// tubo achatado ao longo de pontos {p, w (meia largura), h (meia espessura), out (direção "pra fora")}
function tubo(pts, lados, o = {}) {
  const pt = new Parte(); const n = pts.length; const rings = []; const centros = [];
  for (let i = 0; i < n; i++) {
    const P = pts[i].p; const Pa = pts[Math.max(0, i - 1)].p, Pb = pts[Math.min(n - 1, i + 1)].p;
    const T = norm3(sub3(Pb, Pa)); const Bx = norm3(cross3(T, pts[i].out)); const Nx = cross3(Bx, T);
    const w = pts[i].w, h = pts[i].h; const ring = [];
    const meta = { t: i / (n - 1), i, k: 0 };
    if (i === n - 1 && w < 1e-4) { ring.push(pt.v(P[0], P[1], P[2], meta)); centros.push(P); }
    else for (let k = 0; k < lados; k++) {
      const th = (k / lados) * TAU; const c = Math.cos(th), s = Math.sin(th);
      ring.push(pt.v(P[0] + Bx[0] * w * c + Nx[0] * h * s, P[1] + Bx[1] * w * c + Nx[1] * h * s, P[2] + Bx[2] * w * c + Nx[2] * h * s, { t: i / (n - 1), i, k }));
      centros.push(P);
    }
    rings.push(ring);
  }
  for (let i = 0; i < n - 1; i++) {
    const A = rings[i], Bv = rings[i + 1];
    for (let k = 0; k < A.length; k++) {
      const k1 = (k + 1) % A.length;
      const b = Bv.length === 1 ? Bv[0] : Bv[k], c = Bv.length === 1 ? Bv[0] : Bv[k1];
      pt.tri(A[k], b, A[k1]); if (Bv.length > 1) pt.tri(b, c, A[k1]);
    }
  }
  if (o.tampa !== false) {
    const P0 = pts[0].p; const c0 = pt.v(P0[0], P0[1], P0[2], { t: 0, i: 0, k: -1 }); centros.push(P0);
    const A = rings[0]; for (let k = 0; k < A.length; k++) pt.tri(c0, A[(k + 1) % A.length], A[k]);
  }
  pt.orientar((v) => centros[v]);
  pt.calcNormais();
  return pt;
}

// geometria do three → Parte (pra props)
function deGeo(g, m) {
  const pt = new Parte(); const p = g.attributes.position, nn = g.attributes.normal;
  const v = new THREE.Vector3(), n3 = new THREE.Vector3(); const nm = m ? new THREE.Matrix3().getNormalMatrix(m) : null;
  pt.N = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); if (m) v.applyMatrix4(m); pt.v(v.x, v.y, v.z, { i });
    n3.fromBufferAttribute(nn, i); if (nm) n3.applyMatrix3(nm).normalize(); pt.N[i * 3] = n3.x; pt.N[i * 3 + 1] = n3.y; pt.N[i * 3 + 2] = n3.z;
  }
  if (g.index) for (let i = 0; i < g.index.count; i++) pt.I.push(g.index.getX(i)); else for (let i = 0; i < p.count; i++) pt.I.push(i);
  g.dispose();
  return pt;
}
const M4 = () => new THREE.Matrix4();
const mT = (x, y, z) => M4().makeTranslation(x, y, z);
const mComp = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => M4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));

// junta partes numa BufferGeometry com cor, sombra e (opcional) pele/ossos
class Malha {
  constructor(pele = true) { this.pele = pele; this.P = []; this.N = []; this.C = []; this.S = []; this.SI = []; this.SW = []; this.I = []; this.I2 = []; this.nv = 0; this.semContorno = false; }
  // semContorno: faces internas/decalques — vão pro fim do índice e o casco do contorno não desenha
  add(parte, m, tinta, peso, semContorno = this.semContorno) {
    const base = this.nv; const e = m ? m.elements : null;
    const nm = m ? new THREE.Matrix3().getNormalMatrix(m).elements : null;
    const n = parte.n, P = parte.P, N = parte.N;
    for (let i = 0; i < n; i++) {
      const lx = P[i * 3], ly = P[i * 3 + 1], lz = P[i * 3 + 2];
      let X = lx, Y = ly, Z = lz, nx = N[i * 3], ny = N[i * 3 + 1], nz = N[i * 3 + 2];
      if (e) {
        X = e[0] * lx + e[4] * ly + e[8] * lz + e[12]; Y = e[1] * lx + e[5] * ly + e[9] * lz + e[13]; Z = e[2] * lx + e[6] * ly + e[10] * lz + e[14];
        const ax = nm[0] * nx + nm[3] * ny + nm[6] * nz, ay = nm[1] * nx + nm[4] * ny + nm[7] * nz, az = nm[2] * nx + nm[5] * ny + nm[8] * nz;
        const l = Math.hypot(ax, ay, az) || 1; nx = ax / l; ny = ay / l; nz = az / l;
      }
      this.P.push(X, Y, Z); this.N.push(nx, ny, nz);
      const t = typeof tinta === 'function' ? tinta(X, Y, Z, parte.M[i], lx, ly, lz) : tinta;
      this.C.push(t.c[0], t.c[1], t.c[2]); this.S.push(t.s[0], t.s[1], t.s[2]);
      if (this.pele) {
        const w = typeof peso === 'function' ? peso(X, Y, Z, parte.M[i], lx, ly, lz) : peso;
        let tot = 0; for (let k = 0; k < 4; k++) tot += w[k] ? w[k][1] : 0; tot = tot || 1;
        for (let k = 0; k < 4; k++) { this.SI.push(w[k] ? w[k][0] : 0); this.SW.push(w[k] ? w[k][1] / tot : 0); }
      }
    }
    const dst = semContorno ? this.I2 : this.I;
    for (let i = 0; i < parte.I.length; i++) dst.push(base + parte.I[i]);
    this.nv += n;
  }
  geometria() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    g.setAttribute('sombra', new THREE.Float32BufferAttribute(this.S, 3));
    if (this.pele) {
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.SI, 4));
      g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.SW, 4));
    }
    const I = this.I2.length ? this.I.concat(this.I2) : this.I;
    g.setIndex(this.nv > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
    g.userData.nContorno = this.I.length;
    return g;
  }
}

// ------------------------------------------------------------------ esqueleto
const B = { raiz: 0, quadril: 1, cintura: 2, peito: 3, pescoco: 4, cabeca: 5, ombroE: 6, cotoveloE: 7, maoE: 8, ombroD: 9, cotoveloD: 10, maoD: 11, coxaE: 12, joelhoE: 13, peE: 14, coxaD: 15, joelhoD: 16, peD: 17, costas: 18, a1: 19, a2: 20, a3: 21, b1: 22, b2: 23, b3: 24 };
const NB = 25;
const QUADRIL_Y = 0.86;
const COXA = 0.39, CANELA = 0.405, TORNOZELO = 0.065;
const BRACO = 0.26, ANTEBRACO = 0.23;
const HC = [0, 0.08, 0.006];   // centro da cabeça no espaço do osso "cabeca" (y mundo ≈ 1.525)
const RC = 0.1;                 // raio-base da cabeça
const DEF_OSSOS = [
  ['raiz', -1, 0, 0, 0], ['quadril', 0, 0, QUADRIL_Y, 0], ['cintura', 1, 0, 0.14, 0], ['peito', 2, 0, 0.18, 0],
  ['pescoco', 3, 0, 0.21, -0.008], ['cabeca', 4, 0, 0.048, 0.006],
  ['ombroE', 3, 0.149, 0.148, -0.012], ['cotoveloE', 6, 0, -BRACO, 0], ['maoE', 7, 0, -ANTEBRACO, 0],
  ['ombroD', 3, -0.149, 0.148, -0.012], ['cotoveloD', 9, 0, -BRACO, 0], ['maoD', 10, 0, -ANTEBRACO, 0],
  ['coxaE', 1, 0.085, 0, 0], ['joelhoE', 12, 0, -COXA, 0], ['peE', 13, 0, -CANELA, 0],
  ['coxaD', 1, -0.085, 0, 0], ['joelhoD', 15, 0, -COXA, 0], ['peD', 16, 0, -CANELA, 0],
  ['costas', 3, 0, 0.17, -0.1],
  ['caudaA1', 5, 0, 0, 0], ['caudaA2', 19, 0, 0, 0], ['caudaA3', 20, 0, 0, 0],
  ['caudaB1', 5, 0, 0, 0], ['caudaB2', 22, 0, 0, 0], ['caudaB3', 23, 0, 0, 0],
];
function criarEsqueleto(cadeias) {
  const ossos = [];
  for (const [nome, pai, x, y, z] of DEF_OSSOS) {
    const b = new THREE.Bone(); b.name = nome; b.position.set(x, y, z);
    if (pai >= 0) ossos[pai].add(b);
    ossos.push(b);
  }
  const hc = (p) => [p[0] + HC[0], p[1] + HC[1], p[2] + HC[2]];
  const set = (i0, pts) => {
    if (!pts) { ossos[i0].position.set(HC[0], HC[1], HC[2] - 0.05); return; }
    const a = hc(pts[0]), b = hc(pts[1]), c = hc(pts[2]);
    ossos[i0].position.set(a[0], a[1], a[2]); ossos[i0 + 1].position.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); ossos[i0 + 2].position.set(c[0] - b[0], c[1] - b[1], c[2] - b[2]);
  };
  set(B.a1, cadeias.A); set(B.b1, cadeias.B);
  ossos[0].updateMatrixWorld(true);
  return { ossos, bind: ossos.map((o) => o.matrixWorld.clone()) };
}
const P1 = (i) => [[i, 1]];
const P2 = (a, b, t) => (t <= 0.001 ? [[a, 1]] : t >= 0.999 ? [[b, 1]] : [[a, 1 - t], [b, t]]);

// ------------------------------------------------------------------ cabeça (superfície)
function dirEsfera(th, ph) { const s = Math.sin(th); return [s * Math.sin(ph), Math.cos(th), s * Math.cos(ph)]; }
// esfera unitária → cabeça de anime (crânio redondo, mandíbula fina, queixo pontudo à frente)
function deformarCabeca(x, y, z) {
  let X = x, Y = y, Z = z;
  if (Y < 0) {
    const t = -Y, f = (Z + 1) * 0.5;          // f: 0 nuca … 1 rosto
    X *= 1 - 0.50 * Math.pow(t, 1.25) * (0.35 + 0.65 * f);
    Y = -t * (0.66 + 0.46 * Math.pow(f, 1.6));
    Z = Z * (1 - 0.30 * t * (1 - f)) + 0.10 * t * t * f;
  } else Y *= 1.05;
  if (Z < 0) Z *= 1.06;
  if (Z > 0) Z *= 0.94;                         // rosto um tico mais plano
  return [X * RC * 0.97, Y * RC, Z * RC];
}
function pontoCabeca(th, ph, off = 0) {
  const d = dirEsfera(th, ph); const p = deformarCabeca(d[0], d[1], d[2]);
  if (!off) return p;
  const n = normalCabeca(th, ph); return [p[0] + n[0] * off, p[1] + n[1] * off, p[2] + n[2] * off];
}
function normalCabeca(th, ph) {
  const t = clamp(th, 0.06, Math.PI - 0.06), e = 0.004;
  const f = (a, b) => { const d = dirEsfera(a, b); return deformarCabeca(d[0], d[1], d[2]); };
  const T1 = sub3(f(t + e, ph), f(t - e, ph)), T2 = sub3(f(t, ph + e), f(t, ph - e));
  let n = norm3(cross3(T1, T2));
  if (dot3(n, f(t, ph)) < 0) n = mul3(n, -1);
  if (th < 0.06) n = norm3(lerp3([0, 1, 0], n, th / 0.06));
  return n;
}
function parteCabeca(q) {
  const nu = q === 'pc' ? 26 : 20, nv = q === 'pc' ? 18 : 14;
  const fn = (u, v) => pontoCabeca(lerp(0.0, Math.PI, v), (u - 0.5) * TAU);
  return grade(nu, nv, fn, { wrapU: true, ref: () => [0, 0, 0], fnN: (u, v) => normalCabeca(lerp(0.0, Math.PI, v), (u - 0.5) * TAU) });
}
// remendo do rosto (mesma superfície, 1,6 mm pra fora), UV plano frontal: x ±0,11 · y −0,135…0,085
const ROSTO = { x: 0.11, y0: -0.135, y1: 0.085 };
function geoRosto(q) {
  const nu = q === 'pc' ? 18 : 14, nv = q === 'pc' ? 16 : 13;
  const TH0 = 0.70, TH1 = 2.95, PH = 1.22;
  const pt = grade(nu, nv, (u, v) => pontoCabeca(lerp(TH0, TH1, v), lerp(-PH, PH, u), 0.0016),
    { ref: () => [0, 0, 0], fnN: (u, v) => normalCabeca(lerp(TH0, TH1, v), lerp(-PH, PH, u)) });
  const g = new THREE.BufferGeometry();
  const pos = [], uv = [];
  for (let i = 0; i < pt.n; i++) {
    const x = pt.P[i * 3], y = pt.P[i * 3 + 1], z = pt.P[i * 3 + 2];
    pos.push(x + HC[0], y + HC[1], z + HC[2]);
    uv.push(0.5 + x / (2 * ROSTO.x), (y - ROSTO.y0) / (ROSTO.y1 - ROSTO.y0));
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from(pt.N), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(pt.I);
  return g;
}

// ------------------------------------------------------------------ estilo da personagem (cabelo, rosto, roupas)
const ROSTOS = {
  'central-prospeccao': 'vivo', 'prospeccao-robo': 'felino', 'atendimento-lead': 'redondo', 'sofia-bot': 'vivo',
  'motor-sites': 'felino', 'avisos-leilao': 'felino', 'painel-pncp-cnpj': 'sereno', 'mercado-imobiliario': 'sereno',
  jobpago: 'vivo', 'allancandido-site': 'felino', visiteprado: 'redondo', 'link-checker': 'sereno',
  'whatsapp-rag-jarvis': 'sereno', 'offline-brain': 'redondo', 'transcricao-video': 'sereno', 'olho-do-investidor': 'sereno',
  'holo-gestures': 'vivo', 'controle-de-servicos': 'redondo', 'robos-navegador': 'felino',
};
const FRANJAS = {
  'prospeccao-robo': 'reta', 'allancandido-site': 'lateral', 'whatsapp-rag-jarvis': 'repartida',
  'central-prospeccao': 'lateral', jobpago: 'repartida', 'atendimento-lead': 'reta', 'holo-gestures': 'lateral',
  'motor-sites': 'reta', 'link-checker': 'lateral', 'robos-navegador': 'reta',
  'avisos-leilao': 'repartida', 'olho-do-investidor': 'lateral', 'controle-de-servicos': 'reta',
  'mercado-imobiliario': 'repartida', visiteprado: 'lateral', 'painel-pncp-cnpj': 'reta', 'transcricao-video': 'lateral',
  'sofia-bot': 'repartida', 'offline-brain': 'reta',
};
const VAR_FRANJA = [0.0, 0.07, -0.05, 0.1, -0.02, 0.05, -0.06, 0.03, 0.08, -0.03];
const COQUES = { 'avisos-leilao': 'baixo', 'olho-do-investidor': 'alto', 'controle-de-servicos': 'topo' };
const AHOGE = new Set(['central-prospeccao', 'atendimento-lead', 'jobpago', 'holo-gestures', 'visiteprado', 'transcricao-video', 'sofia-bot']);
const OCULOS = { 'painel-pncp-cnpj': 'redondo', 'offline-brain': 'redondo', 'avisos-leilao': 'meia-lua', 'robos-navegador': 'laranja' };

// roupa de trabalho por agente (desenho da roupa a partir de roupaTrabalho.tipo + cores do roster)
// top: blazer|jaqueta|colete|camisa|polo|sueter|moletom|cardiga|jaleco|macacao|vestido
const ROUPAS = {
  'central-prospeccao': { top: 'polo', mangas: 'curta', gola: 'polo', baixo: 'calca', perna: 'justa', corBaixo: '#2a2f3a', sapato: 'sapatilha', corSapato: '#2a2f3a', punho: 'sec', acess: ['headset', 'cracha'], cinto: '#2a2f3a', topFim: 1.0 },
  'prospeccao-robo': { top: 'blazer', mangas: 'longa', gola: 'v', interna: 'sec', aberto: true, baixo: 'calca', perna: 'pantalona', corBaixo: 'pri', sapato: 'salto', corSapato: '#7a0a1c' },
  'atendimento-lead': { top: 'blazer', mangas: 'longa', gola: 'redonda', interna: '#ffffff', baixo: 'saia', saia: { comp: 0.5, roda: 0.25 }, corBaixo: 'pri', sapato: 'sapatilha', corSapato: 'sec', acess: ['lenco', 'headset'] },
  'sofia-bot': { top: 'colete', mangas: 'tresquartos', corMangas: 'sec', gola: 'v', interna: 'sec', aberto: true, baixo: 'calca', perna: 'cargo', corBaixo: '#6b6446', sapato: 'bota', corSapato: '#5a3d28', acess: ['cameraPescoco'] },
  'motor-sites': { top: 'sueter', mangas: 'longa', gola: 'alta', baixo: 'saia', saia: { comp: 0.3, roda: 0.55, pregas: true }, corBaixo: 'sec', sapato: 'sapatilha', corSapato: '#1e1b2e', acess: ['caneta'], topFim: 0.99 },
  'avisos-leilao': { top: 'blazer', mangas: 'longa', gola: 'v', interna: 'sec', aberto: true, baixo: 'calca', perna: 'reta', corBaixo: 'pri', sapato: 'salto', corSapato: '#c9a13a' },
  'painel-pncp-cnpj': { top: 'camisa', mangas: 'tresquartos', gola: 'camisa', baixo: 'calca', perna: 'reta', corBaixo: '#24305e', cinto: 'sec', sapato: 'sapatilha', corSapato: '#1a2140', topFim: 1.0 },
  'mercado-imobiliario': { top: 'blazer', mangas: 'longa', gola: 'redonda', interna: 'sec', aberto: true, baixo: 'vestido', saia: { comp: 0.47, roda: 0.08 }, corBaixo: 'sec', sapato: 'salto', corSapato: 'sec', acess: ['trena'] },
  jobpago: { top: 'jaqueta', mangas: 'longa', gola: 'redonda', interna: 'sec', aberto: true, baixo: 'calca', perna: 'reta', corBaixo: '#34507a', sapato: 'tenis', corSapato: '#f4f1ea', sola: 'sec', acess: ['mochila', 'bone'] },
  'allancandido-site': { top: 'blazer', mangas: 'longa', gola: 'v', interna: 'sec', aberto: true, baixo: 'calca', perna: 'reta', corBaixo: 'pri', sapato: 'salto', corSapato: '#15161a', acess: ['cracha'] },
  visiteprado: { top: 'camisa', mangas: 'tresquartos', gola: 'camisa', baixo: 'calca', perna: 'reta', corBaixo: '#cdb894', cinto: 'sec', sapato: 'tenis', corSapato: '#f4ecdc', sola: 'sec', acess: ['chapeu'], topFim: 1.0 },
  'link-checker': { top: 'colete', mangas: 'longa', corMangas: 'sec', gola: 'camisa', interna: 'sec', baixo: 'calca', perna: 'reta', corBaixo: 'pri', sapato: 'bota', corSapato: '#22262e' },
  'whatsapp-rag-jarvis': { top: 'cardiga', corTop: 'sec', mangas: 'longa', gola: 'redonda', interna: 'pri', aberto: true, largo: true, baixo: 'vestido', saia: { comp: 0.1, roda: 0.42 }, corBaixo: 'pri', sapato: 'sapatilha', corSapato: 'sec', acess: ['colar'] },
  'offline-brain': { top: 'cardiga', mangas: 'longa', gola: 'redonda', interna: '#efe6f5', aberto: true, sobretudo: 0.6, baixo: 'saia', saia: { comp: 0.3, roda: 0.5, pregas: true }, corBaixo: 'sec', meia: '#2b2540', sapato: 'sapatilha', corSapato: '#2b2540' },
  'transcricao-video': { top: 'moletom', mangas: 'longa', gola: 'capuz', baixo: 'calca', perna: 'jogger', corBaixo: '#3a3045', sapato: 'tenis', corSapato: '#2a2233', sola: 'sec', punho: 'sec', acess: ['fonesPescoco'] },
  'olho-do-investidor': { top: 'jaleco', mangas: 'longa', gola: 'alta', corGola: 'sec', interna: 'sec', aberto: true, sobretudo: 0.5, baixo: 'calca', perna: 'reta', corBaixo: '#20161f', sapato: 'sapatilha', corSapato: '#20161f' },
  'holo-gestures': { top: 'jaqueta', mangas: 'longa', gola: 'alta', baixo: 'calca', perna: 'justa', corBaixo: '#e6eaf2', faixa: 'sec', sapato: 'bota', corSapato: '#f5f7fb', acess: ['luva'] },
  'controle-de-servicos': { top: 'macacao', mangas: 'curta', punho: 'sec', gola: 'camisa', baixo: 'calca', perna: 'reta', corBaixo: 'pri', cinto: '#2a2a2a', sapato: 'bota', corSapato: '#2a2a2a', acess: ['radio'], topFim: 0.7 },
  'robos-navegador': { top: 'jaqueta', mangas: 'longa', punho: 'sec', gola: 'redonda', interna: '#3f4450', aberto: true, baixo: 'calca', perna: 'cargo', corBaixo: '#3b3f36', sapato: 'tenis', corSapato: '#23252b', sola: 'sec' },
};
function roupaPorPalavras(rt) {
  const t = String(rt?.tipo || '').toLowerCase();
  const r = { top: 'camisa', mangas: 'longa', gola: 'redonda', baixo: 'calca', perna: 'reta', corBaixo: '#2a2f3a', sapato: 'sapatilha', corSapato: '#2a2a2a' };
  if (/blazer|terninho|tailleur/.test(t)) Object.assign(r, { top: 'blazer', gola: 'v', interna: 'sec', aberto: true, corBaixo: 'pri' });
  else if (/jaqueta|bomber/.test(t)) Object.assign(r, { top: 'jaqueta', interna: 'sec', aberto: true });
  else if (/colete/.test(t)) Object.assign(r, { top: 'colete', corMangas: 'sec', interna: 'sec' });
  else if (/moletom/.test(t)) Object.assign(r, { top: 'moletom', gola: 'capuz' });
  else if (/su[eé]ter|gola alta/.test(t)) Object.assign(r, { top: 'sueter', gola: 'alta' });
  else if (/cardig/.test(t)) Object.assign(r, { top: 'cardiga', interna: 'sec', aberto: true });
  else if (/jaleco/.test(t)) Object.assign(r, { top: 'jaleco', interna: 'sec', aberto: true, sobretudo: 0.5 });
  else if (/macac/.test(t)) Object.assign(r, { top: 'macacao', corBaixo: 'pri', topFim: 0.7 });
  if (/polo|manga curta/.test(t)) r.mangas = 'curta';
  if (/saia/.test(t)) Object.assign(r, { baixo: 'saia', saia: { comp: /midi/.test(t) ? 0.3 : 0.48, roda: 0.4, pregas: /plissad/.test(t) }, corBaixo: 'sec' });
  if (/vestido/.test(t)) Object.assign(r, { baixo: 'vestido', saia: { comp: /longo/.test(t) ? 0.1 : 0.47, roda: 0.2 }, corBaixo: 'pri' });
  if (/pantalona/.test(t)) r.perna = 'pantalona';
  if (/cargo/.test(t)) r.perna = 'cargo';
  if (/jogger/.test(t)) r.perna = 'jogger';
  return r;
}

function resolverFicha(ficha) {
  const slug = String(ficha.slug || 'agente');
  const h = hash(slug);
  const cab = ficha.cabelo || {};
  const estilosOk = ['longo-liso', 'rabo-de-cavalo', 'maria-chiquinha', 'chanel', 'coque', 'ondulado-longo', 'franja-curta', 'trança-lateral'];
  let estilo = String(cab.estilo || '').normalize('NFC');
  if (estilo === 'tranca-lateral') estilo = 'trança-lateral';
  if (!estilosOk.includes(estilo)) estilo = estilosOk[h % estilosOk.length];
  return {
    slug, h,
    estilo,
    franja: FRANJAS[slug] || ['reta', 'lateral', 'repartida'][(h >>> 3) % 3],
    coque: COQUES[slug] || ['baixo', 'alto', 'topo'][(h >>> 5) % 3],
    ahoge: AHOGE.has(slug) || (!(slug in ROSTOS) && (h >>> 7) % 3 === 0),
    tipoOlho: ROSTOS[slug] || ['vivo', 'felino', 'redondo', 'sereno'][(h >>> 9) % 4],
    oculos: OCULOS[slug] || null,
    lado: (h >>> 11) % 2 ? 1 : -1,   // lado da franja lateral
    pele: cor(ficha.pele, '#e9c1a0'), peleHex: typeof ficha.pele === 'string' ? ficha.pele : '#e9c1a0',
    cabelo: tCabelo(cor(cab.cor, '#3a2a2a'), cor(cab.corSombra || cab.cor, '#1e1414')),
    cabeloHex: cab.cor || '#3a2a2a', sombraHex: cab.corSombra || '#1e1414',
    olhosHex: typeof ficha.olhos === 'string' ? ficha.olhos : '#6b4a2a',
    accent: cor(ficha.accentHex, '#f2a33a'), accentHex: ficha.accentHex || '#f2a33a',
    busto: clamp(+ficha.busto || 1, 0.75, 1.35), quadril: clamp(+ficha.quadril || 1, 0.85, 1.25),
    altura: clamp(+ficha.altura || 1, 0.85, 1.15),
    roupa: ROUPAS[slug] || roupaPorPalavras(ficha.roupaTrabalho),
    rt: ficha.roupaTrabalho || {}, ra: ficha.roupaAcademia || {},
  };
}

// plano do cabelo: cadeias de ossos (rabo/maria-chiquinha) em espaço do centro da cabeça
function planoCabelo(F) {
  const c = {};
  if (F.estilo === 'rabo-de-cavalo') c.A = [[0, 0.062, -0.1], [0, 0.02, -0.172], [0, -0.1, -0.168]];
  if (F.estilo === 'maria-chiquinha') {
    c.A = [[0.09, 0.045, -0.032], [0.165, -0.02, -0.075], [0.168, -0.14, -0.1]];
    c.B = [[-0.09, 0.045, -0.032], [-0.165, -0.02, -0.075], [-0.168, -0.14, -0.1]];
  }
  return c;
}

// ------------------------------------------------------------------ roupa resolvida (cores + formas)
function estiloRoupa(F, roupa) {
  const pele = tPele(F.pele);
  const E = { pele, cabelo: F.cabelo, nome: roupa, acess: new Set(), decais: [] };
  const R = F.roupa;
  const pri = cor(F.rt.corPrincipal, '#e8e2d8'), sec = cor(F.rt.corSecundaria, F.accentHex);
  const res = (v, reserva) => (v === 'pri' ? pri : v === 'sec' ? sec : v ? cor(v) : reserva);
  if (roupa === 'academia') {
    const top = tPano(cor(F.ra.corTop, F.accentHex)), leg = tPano(cor(F.ra.corLegging, '#22222a'));
    Object.assign(E, {
      top: { t: top, fim: 0.985, gola: 'academia', decote: 1.366, mangas: 'sem', folga: 0.001, bustoK: 0.92 },
      baixo: { t: leg, tipo: 'calca', perna: 'legging', folga: 0.002, cintura: 0.985, fim: -0.76 },
      saia: null, sobretudo: null,
      sapato: { tipo: 'tenis', t: tPano(cor('#f4f2f0')), sola: tPano(cor(F.ra.corTop, F.accentHex)) },
      faixa: top, meia: null, cinto: null,
    });
    return E;
  }
  if (roupa === 'pijama') {
    const base = mixC(F.accent, BRANCO, 0.42);
    const pastel = tPano(mixC(base, cor('#ffeef6'), 0.18)), vivo = tPano(mixC(F.accent, BRANCO, 0.12));
    Object.assign(E, {
      top: { t: pastel, fim: 0.9, gola: 'redonda', decote: 1.384, mangas: 'longa', folga: 0.012, punho: vivo, bustoK: 0.8, largo: true },
      baixo: { t: pastel, tipo: 'calca', perna: 'pijama', folga: 0.016, cintura: 0.98, fim: -0.77, punho: vivo },
      saia: null, sobretudo: null,
      sapato: { tipo: 'pantufa', t: tPano(mixC(cor('#ffffff'), F.accent, 0.12)), sola: vivo },
      meia: null, cinto: null,
    });
    E.decais.push({ tipo: 'faixa', t: vivo, w: 0.008, y1: 1.33, y0: 0.92 });
    return E;
  }
  // trabalho
  const corTop = tPano(res(R.corTop, pri));
  const interna = R.interna ? tPano(res(R.interna, sec)) : null;
  const mangas = R.corMangas ? tPano(res(R.corMangas, pri)) : corTop;
  const baixoT = tPano(res(R.corBaixo, pri));
  const folgas = { blazer: 0.009, jaqueta: 0.012, colete: 0.008, camisa: 0.004, polo: 0.004, sueter: 0.007, moletom: 0.02, cardiga: 0.01, jaleco: 0.012, macacao: 0.008, vestido: 0.003 };
  const fimTop = R.topFim !== undefined ? R.topFim : ({ blazer: 0.875, jaqueta: 0.9, colete: 0.9, moletom: 0.86, cardiga: 0.86, jaleco: 0.86 })[R.top] || 0.99;
  const vestido = R.baixo === 'vestido';
  Object.assign(E, {
    top: {
      t: corTop, fim: fimTop, gola: R.gola || 'redonda', decote: ({ v: 1.384, alta: 1.384, capuz: 1.384, camisa: 1.39, polo: 1.39 })[R.gola] || 1.392, mangas: R.mangas || 'longa', mangasT: mangas,
      folga: folgas[R.top] || 0.006, ombreira: R.top === 'blazer' ? 0.012 : 0, aberto: !!R.aberto, interna,
      punho: R.punho ? tPano(res(R.punho, sec)) : (R.mangas === 'tresquartos' ? (interna || tBrilho(mangas, 0.25)) : null),
      corGola: R.corGola ? tPano(res(R.corGola, sec)) : null, tipo: R.top,
      bustoK: R.top === 'moletom' ? 0.6 : R.largo ? 0.8 : 0.92, largo: R.top === 'moletom' || !!R.largo,
    },
    baixo: { t: baixoT, tipo: R.baixo === 'calca' ? 'calca' : 'saia', perna: R.perna || 'reta', folga: 0.005, cintura: 0.99, fim: R.perna === 'pantalona' ? -0.8 : -0.775 },
    saia: (R.baixo === 'saia' || vestido) ? { t: baixoT, bainha: R.saia?.comp ?? 0.48, roda: R.saia?.roda ?? 0.3, pregas: !!R.saia?.pregas, vestido } : null,
    sobretudo: R.sobretudo ? { t: corTop, bainha: R.sobretudo } : null,
    sapato: { tipo: R.sapato || 'sapatilha', t: tPano(res(R.corSapato, cor('#2a2a2a'))), sola: R.sola ? tPano(res(R.sola, sec)) : null },
    meia: R.meia ? tPano(res(R.meia)) : null,
    cinto: R.cinto ? tPano(res(R.cinto, sec)) : null,
    faixa: R.faixa ? tPano(res(R.faixa, sec)) : null,
  });
  if (vestido && !R.aberto) E.top.fim = 0.99;
  for (const a of R.acess || []) E.acess.add(a);
  if (E.top.mangas === 'curta' && R.top === 'macacao') E.top.punho = tPano(res(R.punho, sec));
  // decote / frente aberta
  if (interna && (R.gola === 'v' || R.aberto || R.top === 'colete')) {
    const forma = R.top === 'blazer' ? 'blazer' : R.top === 'colete' ? 'colete' : (R.top === 'cardiga' || R.top === 'jaleco') ? 'cardiga' : R.aberto ? 'jaqueta' : 'v';
    const escuroTop = lumC(corTop.c) < 0.06;
    const tl = escuroTop ? { c: mixC(corTop.c, BRANCO, 0.045), s: mixC(corTop.s, BRANCO, 0.02) } : { c: mulC(corTop.c, [0.8, 0.8, 0.84]), s: mulC(corTop.s, [0.85, 0.85, 0.88]) };
    E.decais.push({ tipo: 'frente', t: interna, forma, aberto: !!R.aberto, ate: E.top.fim, tl, botao: tPano(mixC(sec, cor('#2a2a31'), 0.35)) });
  }
  if (R.gola === 'camisa' || R.gola === 'polo') E.decais.push({ tipo: 'vPele', t: pele });
  if (E.acess.has('cracha')) E.decais.push({ tipo: 'cracha', t: tPano(cor('#fbfaf6')), fita: tPano(sec) });
  if (E.acess.has('mochila')) E.decais.push({ tipo: 'alcas', t: tPano(cor('#2f4a6b')) });
  if (R.top === 'moletom') E.decais.push({ tipo: 'cordao', t: tPano(sec) });
  return E;
}

// ------------------------------------------------------------------ corpo: tronco
function dadosTronco(F, E) {
  const q = F.quadril, folga = E.top.folga, fb = E.baixo.folga;
  const b = F.busto;
  const largo = E.top.largo ? 1 : 0;
  // y, rx, rz, cz
  const base = [
    [0.765, 0.03, 0.025, 0.0], [0.785, 0.086, 0.06, 0.0], [0.81, 0.12, 0.073, -0.004],
    [0.845, 0.146 * q, 0.082, -0.01], [0.9, 0.157 * q, 0.088, -0.014], [0.955, 0.146 * q, 0.083, -0.01],
    [1.0, 0.124, 0.072, -0.006], [1.04, 0.106, 0.066, -0.004], [1.075, 0.099, 0.064, -0.003], [1.11, 0.103, 0.066, 0.0],
    [1.15, 0.114, 0.071, 0.003], [1.168, 0.119, 0.073, 0.004], [1.185, 0.124, 0.075, 0.005], [1.2, 0.127, 0.0765, 0.0055], [1.215, 0.13, 0.078, 0.006], [1.23, 0.132, 0.0785, 0.006], [1.245, 0.134, 0.079, 0.006], [1.26, 0.136, 0.0785, 0.005],
    [1.275, 0.138, 0.078, 0.004], [1.3, 0.142, 0.076, 0.002], [1.322, 0.143, 0.072, -0.001], [1.342, 0.13, 0.066, -0.004],
    [1.358, 0.108, 0.059, -0.006], [1.372, 0.084, 0.052, -0.008], [1.386, 0.06, 0.045, -0.008], [1.4, 0.044, 0.038, -0.007], [1.415, 0.034, 0.032, -0.006],
  ];
  const cortes = new Set();
  const addCorte = (y) => { if (y > 0.77 && y < 1.41) cortes.add(Math.round(y * 1000) / 1000); };
  addCorte(E.top.decote); addCorte(E.top.fim); addCorte(E.baixo.cintura);
  if (E.cinto) addCorte(E.top.fim - 0.022);
  const ys = new Set(base.map((r) => r[0]));
  const aneis = base.map((r) => ({ y: r[0], rx: r[1], rz: r[2], cz: r[3] }));
  for (const y of cortes) {
    if (!ys.has(y)) {
      let k = 0; while (k < aneis.length - 1 && aneis[k + 1].y < y) k++;
      const A = aneis[k], Bn = aneis[k + 1]; const t = (y - A.y) / (Bn.y - A.y);
      aneis.splice(k + 1, 0, { y, rx: lerp(A.rx, Bn.rx, t), rz: lerp(A.rz, Bn.rz, t), cz: lerp(A.cz, Bn.cz, t) });
    }
    aneis.find((r) => Math.abs(r.y - y) < 1e-6).corte = true;
  }
  // folgas da roupa
  for (const r of aneis) {
    let f = 0;
    if (r.y >= E.baixo.cintura - 0.001 && r.y <= 1.37) f = folga * ss(1.37, 1.33, r.y);
    else if (r.y < E.baixo.cintura && r.y > 0.78) f = Math.max(fb, r.y < E.top.fim ? 0 : folga);
    if (r.y < E.top.fim + 0.001 && E.top.fim < 0.95 && r.y > 0.8) f = Math.max(f, folga * 0.9);
    if (largo && r.y > 0.98 && r.y < 1.2) { r.rx = Math.max(r.rx, lerp(0.12, 0.13, (r.y - 0.98) / 0.22)); }
    if (E.top.ombreira && r.y > 1.31 && r.y < 1.35) f += E.top.ombreira;
    r.rx += f; r.rz += f * 0.8;
  }
  const A = (0.017 + 0.05 * (b - 0.8)) * E.top.bustoK;
  const bump = (x, y) => {
    const dy = y - 1.232; const sy = dy > 0 ? 0.056 : 0.032;
    const g1 = Math.exp(-((x - 0.056) ** 2) / 0.0019 - (dy * dy) / (sy * sy));
    const g2 = Math.exp(-((x + 0.056) ** 2) / 0.0019 - (dy * dy) / (sy * sy));
    return A * Math.max(g1, g2);
  };
  const qb = (q - 1) * 0.6 + 0.012;   // volume do bumbum (estilizado e discreto)
  const deform = (x, y, z, a) => {
    const ca = Math.cos(a);
    if (ca > 0) { const k = Math.pow(ca, 0.6); const bb = bump(x, y) * k; return [x + Math.sign(x) * bb * 0.18, y, z + bb]; }
    const g = qb * Math.exp(-((y - 0.87) ** 2) / 0.0028) * Math.pow(-ca, 1.2);
    return [x, y, z - g];
  };
  // superfície frontal contínua (pra decalques)
  const interp = (y) => {
    let k = 0; while (k < aneis.length - 2 && aneis[k + 1].y < y) k++;
    const P = aneis[k], Q = aneis[k + 1]; const t = clamp((y - P.y) / (Q.y - P.y), 0, 1);
    return [lerp(P.rx, Q.rx, t), lerp(P.rz, Q.rz, t), lerp(P.cz, Q.cz, t)];
  };
  const sup = (x, y) => {
    const [rx, rz, cz] = interp(y); const s = clamp(x / rx, -0.999, 0.999); const a = Math.asin(s);
    const p = deform(x, y, cz + rz * Math.cos(a), a); return p;
  };
  return { aneis, deform, sup, ys: aneis.map((r) => r.y) };
}

// decalque frontal: linhas [y, xEsq, xDir] (y decrescente), amostra exata da borda
function decalFrontal(sup, linhas, nLin, nCol, off, ysAneis) {
  const pt = new Parte();
  const y0 = linhas[0][0], y1 = linhas[linhas.length - 1][0];
  // linhas do decalque: uniformes + nas alturas dos anéis do tronco + nas quebras do contorno
  // (assim as cordas do decalque acompanham as do tronco e o busto não fura o tecido pintado)
  let ys = [];
  for (let r = 0; r <= nLin; r++) ys.push(lerp(y0, y1, r / nLin));
  for (const y of ysAneis || []) if (y < y0 - 0.001 && y > y1 + 0.001) ys.push(y);
  for (const l of linhas) ys.push(l[0]);
  ys.sort((a, b) => b - a);
  ys = ys.filter((y, i) => i === 0 || ys[i - 1] - y > 0.0015);
  nLin = ys.length - 1;
  const faixa = (y) => {
    for (let k = 0; k < linhas.length - 1; k++) {
      const a = linhas[k], b = linhas[k + 1];
      if ((y <= a[0] && y >= b[0]) || k === linhas.length - 2) { const t = clamp((y - a[0]) / (b[0] - a[0] || 1), 0, 1); return [lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
    }
    return [linhas[0][1], linhas[0][2]];
  };
  const nrm = (x, y) => { const e = 0.002; const n = cross3(sub3(sup(x + e, y), sup(x - e, y)), sub3(sup(x, y + e), sup(x, y - e))); const v = norm3(n); return v[2] < 0 ? mul3(v, -1) : v; };
  for (let r = 0; r <= nLin; r++) {
    const y = ys[r]; const [xl, xr] = faixa(y);
    for (let c = 0; c <= nCol; c++) {
      const x = lerp(xl, xr, c / nCol); const p = sup(x, y), n = nrm(x, y);
      pt.v(p[0] + n[0] * off, p[1] + n[1] * off, p[2] + n[2] * off, { y, x, n });
    }
  }
  const cols = nCol + 1;
  for (let r = 0; r < nLin; r++) for (let c = 0; c < nCol; c++) {
    const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
    pt.tri(a, d, b); pt.tri(b, d, e);
  }
  pt.orientar((v) => { const m = pt.M[v]; return [pt.P[v * 3] - m.n[0], pt.P[v * 3 + 1] - m.n[1], pt.P[v * 3 + 2] - m.n[2]]; });
  pt.N = new Float32Array(pt.n * 3); pt.M.forEach((m, i) => { pt.N[i * 3] = m.n[0]; pt.N[i * 3 + 1] = m.n[1]; pt.N[i * 3 + 2] = m.n[2]; });
  return pt;
}

// ------------------------------------------------------------------ pesos
function pesoTronco(X, Y) {
  let w;
  if (Y < 0.95) w = [[B.quadril, 1]];
  else if (Y < 1.05) w = P2(B.quadril, B.cintura, ss(0.95, 1.05, Y));
  else if (Y < 1.15) w = [[B.cintura, 1]];
  else if (Y < 1.24) w = P2(B.cintura, B.peito, ss(1.15, 1.24, Y));
  else w = [[B.peito, 1]];
  if (Y > 1.385) { const t = ss(1.385, 1.415, Y) * 0.7; w = [[w[0][0], 1 - t], [B.pescoco, t]]; }
  const ax = Math.abs(X);
  if (Y > 1.26 && ax > 0.105) {
    const k = ss(0.105, 0.155, ax) * ss(1.26, 1.33, Y) * 0.45;
    if (k > 0.001) w = [...w.map(([i, v]) => [i, v * (1 - k)]), [X > 0 ? B.ombroE : B.ombroD, k]];
  }
  return w;
}
function pesoSaia(frenteK) {
  return (X, Y, Z) => {
    const t = ss(0.9, 0.62, Y) * (Z > 0 ? frenteK : frenteK * 0.55 + 0.15 * ss(0, -0.05, Z));
    if (t < 0.01) return [[B.quadril, 1]];
    const l = ss(-0.035, 0.035, X);
    const kn = ss(0.5, 0.36, Y);   // abaixo do joelho: canela
    const w = [[B.quadril, 1 - t]];
    if (l > 0.01) { w.push([B.coxaE, t * l * (1 - kn)]); if (kn > 0) w.push([B.joelhoE, t * l * kn]); }
    if (l < 0.99) { w.push([B.coxaD, t * (1 - l) * (1 - kn)]); if (kn > 0) w.push([B.joelhoD, t * (1 - l) * kn]); }
    w.sort((a, b) => b[1] - a[1]);
    return w.slice(0, 4);
  };
}

// ------------------------------------------------------------------ corpo completo
function construirCorpo(ch, roupaNome) {
  const F = ch.F; const q = ch.q;
  const E = estiloRoupa(F, roupaNome);
  const SEG = q === 'pc' ? 28 : 22, SEGM = q === 'pc' ? 12 : 10, LADOS = q === 'pc' ? 6 : 5;
  const M = new Malha(true);
  const bind = ch.bind;
  const mHC = M4().multiplyMatrices(bind[B.cabeca], mT(HC[0], HC[1], HC[2]));

  // cabeça
  M.add(parteCabeca(q), mHC, E.pele, P1(B.cabeca));
  // orelhinhas (aparecem nos penteados presos)
  for (const lado of (F.estilo === 'rabo-de-cavalo' || F.estilo === 'coque' ? [1, -1] : [])) {
    const o = elipsoide(0, 0, 0, 0.01, 0.018, 0.007, 6, 5);
    M.add(o, M4().multiplyMatrices(mHC, mComp(lado * 0.091, -0.022, -0.012, 0, lado * 0.5, 0)), E.pele, P1(B.cabeca));
  }
  // pescoço
  const gola = E.top.gola;
  const golaAlta = gola === 'alta';
  const pesc = loft([
    { y: -0.045, rx: 0.04, rz: 0.036, cz: 0.0 }, { y: -0.01, rx: 0.036, rz: 0.034, cz: 0.003 },
    { y: 0.025, rx: 0.033, rz: 0.032, cz: 0.004, corte: golaAlta }, { y: 0.06, rx: 0.031, rz: 0.03, cz: 0.004 }, { y: 0.09, rx: 0.028, rz: 0.028, cz: 0.0 },
  ].map((r) => (golaAlta && r.y <= 0.026 ? { ...r, rx: r.rx + 0.009, rz: r.rz + 0.009 } : r)), { seg: SEGM });
  const tGola = E.top.corGola || E.top.t;
  M.add(pesc, bind[B.pescoco], (X, Y, Z, m) => (golaAlta && m.y + m.lado * 1e-4 <= 0.025 ? tGola : E.pele),
    (X, Y, Z, m, lx, ly) => (ly < 0 ? P2(B.peito, B.pescoco, ss(-0.045, 0, ly)) : P2(B.pescoco, B.cabeca, ss(0.045, 0.085, ly))));

  // tronco
  const tr = dadosTronco(F, E);
  const tintaTronco = (X, Y, Z, m) => {
    const y = m ? m.y + (m.lado || 0) * 1e-4 : Y;
    if (y > E.top.decote) return golaAlta || gola === 'capuz' ? tGola : E.pele;
    if (y >= E.top.fim) return E.top.t;
    if (E.cinto && y >= E.top.fim - 0.022) return E.cinto;
    if (E.saia && E.saia.vestido) return E.saia.t;
    return E.baixo.t;
  };
  M.add(loft(tr.aneis, { seg: SEG, deform: tr.deform, fundo: true, fundoY: 0.755, topo: true, topoY: 1.425 }), null, tintaTronco, pesoTronco);

  // (decalques vão no fim: ficam fora do contorno)

  // braços + mãos
  const mangaFim = { longa: -0.47, tresquartos: -0.345, curta: -0.12, sem: 1 }[E.top.mangas] ?? -0.47;
  const fm = E.top.mangas === 'sem' ? 0 : E.top.folga * 0.7 + 0.002;
  for (const lado of [1, -1]) {
    const ob = lado > 0 ? B.ombroE : B.ombroD, cb = lado > 0 ? B.cotoveloE : B.cotoveloD, mb = lado > 0 ? B.maoE : B.maoD;
    const prof = [[0.042, 0.008], [0.032, 0.028], [0.012, 0.039], [-0.02, 0.041], [-0.06, 0.037], [-0.12, 0.033], [-0.19, 0.030], [-0.24, 0.027],
      [-0.26, 0.026], [-0.28, 0.027], [-0.32, 0.028], [-0.38, 0.025], [-0.44, 0.0215], [-0.475, 0.019], [-0.497, 0.012], [-0.506, 0.004]];
    const aneis = prof.map(([y, r]) => ({ y, rx: r, rz: r * 0.93 }));
    const cortes = [];
    if (mangaFim < 0.5) { cortes.push(mangaFim); if (E.top.punho) cortes.push(mangaFim + 0.026); }
    for (const y of cortes) {
      const ja = aneis.find((r) => Math.abs(r.y - y) < 1e-4); if (ja) { ja.corte = true; continue; }
      let k = 0; while (k < aneis.length - 1 && aneis[k + 1].y > y) k++;
      const A = aneis[k], Bn = aneis[k + 1]; const t = (y - A.y) / (Bn.y - A.y);
      aneis.splice(k + 1, 0, { y, rx: lerp(A.rx, Bn.rx, t), rz: lerp(A.rz, Bn.rz, t), corte: true });
    }
    aneis.reverse();   // loft vai de baixo pra cima
    for (const r of aneis) if (r.y >= mangaFim - 0.0001 && r.y < 0.03) { const k = r.y > 0 ? 1 - r.y / 0.03 : 1; r.rx += fm * k; r.rz += fm * k; }
    const tintaBraco = (X, Y, Z, m) => {
      const y = m.y + (m.lado || 0) * 1e-4;
      if (y >= mangaFim) { if (E.top.punho && y < mangaFim + 0.026) return E.top.punho; return E.top.mangasT || E.top.t; }
      return E.pele;
    };
    const pesoBraco = (X, Y, Z, m, lx, ly) => {
      if (ly > -0.235) return [[ob, 1]];
      if (ly > -0.285) return P2(ob, cb, ss(-0.235, -0.285, ly));
      if (ly > -0.47) return [[cb, 1]];
      return P2(cb, mb, ss(-0.47, -0.5, ly));
    };
    M.add(loft(aneis, { seg: SEGM, fundo: true, fundoY: -0.508, topo: true, topoY: 0.045 }), bind[ob], tintaBraco, pesoBraco);
    // mão (luva no direito da Hikari)
    const luva = E.acess.has('luva') && lado < 0;
    const tm = luva ? tPano(cor(F.rt.corSecundaria, '#2fb4ff')) : E.pele;
    const palma = elipsoide(-lado * 0.001, -0.036, 0.004, 0.0125, 0.037, 0.022, 8, 7);
    M.add(palma, bind[mb], tm, P1(mb));
    const dedao = elipsoide(0, 0, 0, 0.0075, 0.017, 0.0075, 6, 5);
    M.add(dedao, M4().multiplyMatrices(bind[mb], mComp(-lado * 0.004, -0.024, 0.021, 0.5, 0, lado * 0.25)), tm, P1(mb));
  }

  // pernas
  const calca = E.baixo.tipo === 'calca' && !E.saia;
  const perna = E.baixo.perna;
  const pernaFim = calca ? E.baixo.fim : 1;
  const bota = E.sapato.tipo === 'bota';
  const qd = F.quadril;
  for (const lado of [1, -1]) {
    const cb = lado > 0 ? B.coxaE : B.coxaD, jb = lado > 0 ? B.joelhoE : B.joelhoD, pb = lado > 0 ? B.peE : B.peD;
    const prof = [[0.07, 0.012, 0], [0.05, 0.05, 0], [0.02, 0.07, 0], [-0.02, 0.077, 0], [-0.09, 0.073, 0], [-0.18, 0.066, 0.002], [-0.27, 0.058, 0.003],
      [-0.34, 0.05, 0.004], [-0.385, 0.046, 0.005], [-0.42, 0.045, 0.003], [-0.47, 0.048, -0.004], [-0.53, 0.0495, -0.009], [-0.6, 0.044, -0.008],
      [-0.67, 0.035, -0.004], [-0.73, 0.028, -0.002], [-0.77, 0.025, 0], [-0.8, 0.023, 0], [-0.815, 0.012, 0]];
    const aneis = prof.map(([y, r, cz]) => {
      const kq = 1 + (qd - 1) * 0.7 * ss(-0.3, 0.0, y);
      return { y, rx: r * kq, rz: r * 0.95 * kq, cz, cx: -lado * 0.006 * ss(-0.3, 0.02, y) };
    });
    const cortes = [];
    if (calca) { cortes.push(pernaFim); if (perna === 'jogger' || E.baixo.punho) cortes.push(pernaFim + 0.03); }
    if (bota) cortes.push(-0.56);
    if (E.saia && E.meia) cortes.push(0.0);
    for (const y of cortes) {
      const ja = aneis.find((r) => Math.abs(r.y - y) < 1e-4); if (ja) { ja.corte = true; continue; }
      let k = 0; while (k < aneis.length - 1 && aneis[k + 1].y > y) k++;
      const A = aneis[k], Bn = aneis[k + 1]; const t = (y - A.y) / (Bn.y - A.y);
      aneis.splice(k + 1, 0, { y, rx: lerp(A.rx, Bn.rx, t), rz: lerp(A.rz, Bn.rz, t), cz: lerp(A.cz, Bn.cz, t), cx: lerp(A.cx, Bn.cx, t), corte: true });
    }
    for (const r of aneis) {
      let f = 0;
      if (calca && r.y >= pernaFim - 0.0001) {
        f = E.baixo.folga + ({ reta: 0.006, cargo: 0.012, jogger: 0.012, pantalona: 0.008 + 0.042 * ss(-0.3, -0.8, r.y), justa: 0.002, legging: 0.0, pijama: 0.014 })[perna] || 0;
        if (perna === 'jogger' && r.y < pernaFim + 0.03) f = 0.006;
        if (perna === 'cargo' && r.y < -0.12 && r.y > -0.3) f += 0.006;
      }
      if (bota && r.y <= -0.56) f = Math.max(f, 0.006);
      r.rx += f; r.rz += f;
    }
    aneis.reverse();
    const faixa = E.faixa;
    const tintaPerna = (X, Y, Z, m) => {
      const y = m.y + (m.lado || 0) * 1e-4;
      if (bota && y <= -0.56) return E.sapato.t;
      if (calca && y >= pernaFim) {
        if ((perna === 'jogger' || E.baixo.punho) && y < pernaFim + 0.03) return E.baixo.punho || tBrilho(E.baixo.t, 0.12);
        if (faixa && Math.abs(Math.sin(m.a) * lado - 1) < 0.08) return faixa;
        return E.baixo.t;
      }
      if (E.meia && y < 0) return { c: mixC(E.pele.c, E.meia.c, 0.75), s: mixC(E.pele.s, E.meia.s, 0.75) };
      return E.pele;
    };
    const pesoPerna = (X, Y, Z, m, lx, ly) => {
      if (ly > -0.02) return P2(B.quadril, cb, ss(0.06, -0.02, ly) * 0.6 + 0.4);
      if (ly > -0.36) return [[cb, 1]];
      if (ly > -0.42) return P2(cb, jb, ss(-0.36, -0.42, ly));
      if (ly > -0.77) return [[jb, 1]];
      return P2(jb, pb, ss(-0.77, -0.805, ly));
    };
    M.add(loft(aneis, { seg: SEGM, fundo: true, fundoY: -0.82, topo: true, topoY: 0.08 }), bind[cb], tintaPerna, pesoPerna);
    // sapato (loft ao longo de +Z, construído em Y e girado)
    const sapAneis = [[-0.05, 0.010, 0.012, -0.035], [-0.042, 0.026, 0.030, -0.033], [-0.02, 0.031, 0.036, -0.030], [0.01, 0.033, 0.034, -0.032],
      [0.05, 0.035, 0.026, -0.040], [0.09, 0.033, 0.019, -0.047], [0.12, 0.026, 0.014, -0.051], [0.138, 0.014, 0.009, -0.055]]
      .map(([z, rx, ry, cy]) => ({ y: z, rx: rx + (E.sapato.tipo === 'tenis' ? 0.003 : 0), rz: ry + (E.sapato.tipo === 'tenis' ? 0.004 : 0), cz: -cy }));
    const sap = loft(sapAneis, { seg: SEGM, fundo: true, fundoY: -0.056, topo: true, topoY: 0.146 });
    const sola = E.sapato.sola || (E.sapato.tipo === 'tenis' ? tPano(cor('#ffffff')) : null);
    M.add(sap, M4().multiplyMatrices(bind[pb], mComp(0, 0, 0, Math.PI / 2, 0, 0)), (X, Y, Z, m, lx, ly, lz) => (sola && -lz < -0.052 ? sola : E.sapato.t), P1(pb));
  }

  // saia / vestido
  if (E.saia) {
    const S = E.saia; const yb = S.bainha; const roda = S.roda;
    const r0x = tr.aneis.find((r) => r.y >= 0.995)?.rx || 0.125;
    const prof = [];
    const n = 9;
    for (let k = 0; k <= n; k++) {
      const y = lerp(1.0, yb, k / n);
      const hip = 0.157 * qd + 0.016;
      let rx = y > 0.9 ? lerp(r0x + 0.008, hip, ss(1.0, 0.9, y)) : hip + roda * 0.22 * ss(0.9, yb, y) * ((0.9 - y) / Math.max(0.1, 0.9 - yb));
      if (S.vestido && roda < 0.15 && y < 0.7) rx = hip - 0.012 * ss(0.7, yb, y);   // tubinho afunila
      prof.push({ y, rx, rz: rx * 0.62 + 0.012 + 0.03 * ss(0.95, 0.75, y), cz: -0.006 });
    }
    prof.reverse();
    const pregas = S.pregas;
    const saia = loft(prof, {
      seg: pregas ? SEG + 4 : SEG,
      deform: pregas ? (x, y, z, a) => { const k = 0.011 * ss(0.95, 0.6, y); const tri = Math.abs(((a * 16) / TAU) % 1 - 0.5) * 2; const f = 1 + k * tri * 6; return [x * f, y, z * f]; } : null,
    });
    // interior visível por baixo (barra): segunda face invertida
    const dentro = loft(prof.map((r) => ({ ...r, rx: r.rx - 0.003, rz: r.rz - 0.003 })), { seg: Math.round(SEG * 0.6) }); dentro.inverter(); dentro.calcNormais();
    const ps = pesoSaia(S.vestido && roda < 0.15 ? 0.95 : 0.9);
    M.add(saia, null, S.t, ps);
    M.add(dentro, null, { c: mulC(S.t.c, [0.7, 0.7, 0.75]), s: S.t.s }, ps, true);
  }
  // casaco longo (jaleco / cardigã comprido): saia aberta na frente
  if (E.sobretudo) {
    const yb = E.sobretudo.bainha;
    const prof = [];
    for (let k = 0; k <= 7; k++) {
      const y = lerp(0.99, yb, k / 7); const hip = 0.157 * qd + 0.03 + (E.saia ? E.saia.roda * 0.1 : 0);
      const rx = y > 0.9 ? lerp(0.14, hip, ss(0.99, 0.9, y)) : hip + 0.04 * ss(0.9, yb, y);
      prof.push({ y, rx, rz: rx * 0.66 + 0.02, cz: -0.01 });
    }
    prof.reverse();
    const arco = [0.32, TAU - 0.32];
    const cas = loft(prof, { seg: SEG, arco });
    const dentro = loft(prof.map((r) => ({ ...r, rx: r.rx - 0.003, rz: r.rz - 0.003 })), { seg: Math.round(SEG * 0.6), arco }); dentro.inverter(); dentro.calcNormais();
    const ps = pesoSaia(0.85);
    M.add(cas, null, E.top.t, ps);
    M.add(dentro, null, { c: mulC(E.top.t.c, [0.75, 0.75, 0.8]), s: E.top.t.s }, ps, true);
  }

  // acessórios fixos
  acessoriosFixos(M, ch, E, mHC, tr, LADOS);
  // cabelo
  construirCabelo(M, ch, E, mHC, LADOS);
  // detalhes pintados sobre o tronco (sem contorno próprio)
  M.semContorno = true; decalques(M, E, tr); M.semContorno = false;
  const g = M.geometria();
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.85, 0), 1.35);
  return g;
}

function decalques(M, E, tr) {
  const add = (linhas, t, nL = 8, nC = 6, off = 0.004) => M.add(decalFrontal(tr.sup, linhas, nL, nC, off, tr.ys), null, t, pesoTronco);
  const espelho = (linhas) => linhas.map(([y, a, b]) => [y, -b, -a]);
  const dec = E.top.decote;
  for (const d of E.decais) {
    if (d.tipo === 'frente') {
      const hem = Math.max(d.ate, 0.86) + 0.005;
      let linhas;
      if (d.forma === 'blazer') {
        // paletó abotoado: V largo até o botão, fechado, e abre só na barra
        const yb = 1.165;
        linhas = [[dec - 0.001, -0.062, 0.062], [yb, -0.004, 0.004]];
        if (hem < yb - 0.1) linhas.push([hem + 0.06, -0.004, 0.004], [hem, -0.03, 0.03]);
        add(linhas, d.t, 12, 6, 0.0058);
        const lap = [[dec - 0.002, 0.056, 0.09], [1.31, 0.04, 0.078], [1.255, 0.024, 0.048], [yb + 0.002, 0.003, 0.012]];
        add(lap, d.tl, 7, 3, 0.0072); add(espelho(lap), d.tl, 7, 3, 0.0072);
        add([[yb - 0.01, -0.0075, 0.0075], [yb - 0.025, -0.0075, 0.0075]], d.botao, 1, 2, 0.008);
        if (hem < 1.0) add([[1.065, -0.0075, 0.0075], [1.05, -0.0075, 0.0075]], d.botao, 1, 2, 0.008);
        continue;
      }
      if (d.forma === 'colete' || d.forma === 'v') {
        const yb = d.forma === 'colete' ? 1.19 : 1.235;
        linhas = [[dec - 0.001, -0.056, 0.056], [yb, -0.003, 0.003]];
        if (d.aberto && hem < yb - 0.04) linhas.push([hem, -0.024, 0.024]);
      } else if (d.forma === 'cardiga') {
        linhas = [[dec - 0.001, -0.058, 0.058], [1.12, -0.024, 0.024], [hem, -0.03, 0.03]];
      } else {   // jaqueta aberta: faixa da blusa por dentro
        linhas = [[dec - 0.001, -0.05, 0.05], [1.27, -0.032, 0.032], [hem, -0.03, 0.03]];
      }
      add(linhas, d.t, 10, 6, 0.0058);
      if (d.forma === 'colete' && d.aberto === false) add([[1.15, -0.005, 0.005], [1.138, -0.005, 0.005]], d.botao, 1, 2, 0.0075);
    } else if (d.tipo === 'vPele') add([[dec - 0.001, -0.03, 0.03], [1.322, -0.002, 0.002]], d.t, 6, 4, 0.0066);
    else if (d.tipo === 'faixa') add([[d.y1, -d.w, d.w], [d.y0, -d.w, d.w]], d.t, 8, 2, 0.0042);
    else if (d.tipo === 'botoes') { for (const y of d.ys) add([[y + 0.007, -0.006, 0.006], [y - 0.007, -0.006, 0.006]], d.t, 1, 2, 0.0048); }
    else if (d.tipo === 'cracha') {
      add([[1.17, -0.024, 0.024], [1.12, -0.024, 0.024]], d.t, 3, 3, 0.0085);
      add([[1.17, -0.024, 0.024], [1.162, -0.024, 0.024]], d.fita, 1, 3, 0.0092);
      for (const s of [1, -1]) add([[dec - 0.004, s * 0.046 - 0.004, s * 0.046 + 0.004], [1.17, s * 0.018 - 0.003, s * 0.018 + 0.003]], d.fita, 6, 1, 0.0078);
    } else if (d.tipo === 'alcas') {
      for (const s of [1, -1]) add([[1.37, s * 0.082 - 0.014, s * 0.082 + 0.014], [1.2, s * 0.1 - 0.013, s * 0.1 + 0.013]], d.t, 6, 2, 0.0055);
    } else if (d.tipo === 'cordao') {
      for (const s of [1, -1]) add([[dec - 0.004, s * 0.03 - 0.003, s * 0.03 + 0.003], [1.25, s * 0.036 - 0.003, s * 0.036 + 0.003]], d.t, 5, 1, 0.0055);
    }
  }
}

function acessoriosFixos(M, ch, E, mHC, tr, LADOS) {
  const F = ch.F, bind = ch.bind;
  const escuro = tPano(cor('#2a2a31')), sec = tPano(cor(F.rt.corSecundaria, F.accentHex));
  const naCabeca = (pt, t, m) => M.add(pt, m ? M4().multiplyMatrices(mHC, m) : mHC, t, P1(B.cabeca));
  if (E.acess.has('headset')) {
    const arco = deGeo(new THREE.TorusGeometry(0.117, 0.0045, 4, 18, Math.PI * 1.05), M4().compose(new THREE.Vector3(0, -0.004, -0.004), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI * -0.025)), new THREE.Vector3(1, 1.1, 1)));
    naCabeca(arco, escuro);
    const conchaE = deGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.016, 12), mComp(0.113, -0.02, -0.006, 0, 0, Math.PI / 2));
    const conchaD = deGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.016, 12), mComp(-0.113, -0.02, -0.006, 0, 0, Math.PI / 2));
    naCabeca(conchaE, sec); naCabeca(conchaD, sec);
    const haste = tubo([{ p: [-0.118, -0.03, 0.0], w: 0.003, h: 0.003, out: [-1, 0, 0] }, { p: [-0.115, -0.07, 0.045], w: 0.003, h: 0.003, out: [-1, 0, 0] }, { p: [-0.075, -0.085, 0.085], w: 0.0025, h: 0.0025, out: [-1, 0, 0] }], 4);
    naCabeca(haste, escuro);
    naCabeca(elipsoide(-0.068, -0.086, 0.088, 0.008, 0.007, 0.007, 6, 4), sec);
  }
  if (E.acess.has('lenco')) {
    const l = loft([{ y: -0.008, rx: 0.049, rz: 0.047, cz: 0.004 }, { y: 0.004, rx: 0.051, rz: 0.049, cz: 0.005 }, { y: 0.016, rx: 0.045, rz: 0.043, cz: 0.004 }], { seg: 14, fundo: true, topo: true });
    M.add(l, bind[B.pescoco], sec, (X, Y) => P2(B.peito, B.pescoco, 0.6));
    const no = elipsoide(0, 0, 0, 0.016, 0.011, 0.009, 8, 5);
    M.add(no, M4().multiplyMatrices(bind[B.pescoco], mComp(0.026, -0.002, 0.047, 0, 0.6, 0.3)), sec, P1(B.pescoco));
    for (const [dx, rz] of [[0.034, 0.35], [0.018, -0.25]]) {
      const ponta = elipsoide(0, 0, 0, 0.011, 0.026, 0.005, 6, 5);
      M.add(ponta, M4().multiplyMatrices(bind[B.pescoco], mComp(dx, -0.03, 0.066, 0.25, 0.3, rz)), sec, P1(B.peito));
    }
  }
  if (E.acess.has('colar')) {
    const c = deGeo(new THREE.TorusGeometry(0.056, 0.0022, 4, 20), mComp(0, -0.022, 0.006, Math.PI / 2 - 0.35, 0, 0));
    M.add(c, bind[B.pescoco], tPano(cor('#e2b85a')), P1(B.peito));
    M.add(elipsoide(0, 0, 0, 0.009, 0.012, 0.004, 6, 4), M4().multiplyMatrices(bind[B.pescoco], mT(0, -0.05, 0.05)), tPano(cor('#e2b85a')), P1(B.peito));
  }
  if (E.acess.has('caneta')) {
    const c = deGeo(new THREE.CylinderGeometry(0.0035, 0.0035, 0.085, 6), mComp(-0.1, 0.02, 0.0, 0.25, 0, 1.25));
    naCabeca(c, sec);
  }
  if (E.acess.has('chapeu')) {
    const palha = tPano(cor('#e9cf8d'));
    const aba = loft([{ y: -0.004, rx: 0.2, rz: 0.2 }, { y: 0.0, rx: 0.205, rz: 0.205 }, { y: 0.004, rx: 0.2, rz: 0.2 }], { seg: 24, fundo: true, topo: true });
    const copa = loft([{ y: 0.0, rx: 0.112, rz: 0.118 }, { y: 0.03, rx: 0.11, rz: 0.116, corte: true }, { y: 0.042, rx: 0.109, rz: 0.115, corte: true }, { y: 0.07, rx: 0.1, rz: 0.106 }, { y: 0.082, rx: 0.07, rz: 0.075 }], { seg: 20, topo: true, topoY: 0.086 });
    const mh = mComp(0, 0.058, -0.012, -0.12, 0, 0.04);
    naCabeca(aba, palha, mh);
    M.add(copa, M4().multiplyMatrices(mHC, mh), (X, Y, Z, m) => { const y = m.y + (m.lado || 0) * 1e-4; return y > 0.03 && y < 0.042 ? sec : palha; }, P1(B.cabeca));
  }
  if (E.acess.has('bone')) {
    const azul = tPano(cor('#2f4a6b'));
    const copa = grade(16, 6, (u, v) => pontoCabeca(lerp(0.0, 1.32, v), (u - 0.5) * TAU, 0.033), { wrapU: true, ref: () => [0, 0, 0] });
    naCabeca(copa, azul);
    const aba = elipsoide(0, 0, 0, 0.085, 0.006, 0.06, 12, 4);
    naCabeca(aba, azul, mComp(0, 0.05, 0.126, 0.18, 0, 0));
    naCabeca(elipsoide(0, 0.137, 0, 0.012, 0.006, 0.012, 6, 3), tPano(cor(F.rt.corSecundaria, '#f5b400')));
  }
  if (E.acess.has('mochila')) {
    const am = tPano(cor('#f5b400')), az = tPano(cor('#2f4a6b'));
    const m = elipsoide(0, 0, 0, 0.115, 0.13, 0.06, 12, 8, (x, y, z) => [x * (1 + 0.15 * (1 - Math.abs(y) / 0.13)), y, z]);
    M.add(m, mT(0, 1.12, -0.155), (X, Y) => (Y > 1.19 ? az : am), P1(B.peito));
    M.add(elipsoide(0, 1.07, -0.205, 0.07, 0.04, 0.025, 10, 5), null, az, P1(B.peito));
  }
  if (E.acess.has('trena') || E.acess.has('radio')) {
    const radio = E.acess.has('radio');
    const cx = radio ? -0.16 * F.quadril : 0.16 * F.quadril;
    const caixa = deGeo(new THREE.BoxGeometry(0.03, radio ? 0.07 : 0.05, 0.05), mT(cx, 0.96, 0.02));
    M.add(caixa, null, radio ? tPano(cor('#2a2a2a')) : tPano(cor('#f1c232')), P1(B.quadril));
    if (radio) M.add(deGeo(new THREE.CylinderGeometry(0.003, 0.003, 0.06, 4), mT(cx, 1.02, 0.03)), null, escuro, P1(B.quadril));
  }
  if (E.top.tipo === 'moletom' && E.nome === 'trabalho') {
    const capuz = elipsoide(0, 0, 0, 0.1, 0.05, 0.05, 12, 6);
    M.add(capuz, mComp(0, 1.37, -0.075, -0.35, 0, 0), E.top.t, (X, Y) => P2(B.peito, B.pescoco, 0.2));
  }
  if (E.top.gola === 'camisa' || E.top.gola === 'polo') {
    const colar = loft([{ y: 0.0, rx: 0.058, rz: 0.052, cz: 0.0 }, { y: 0.02, rx: 0.06, rz: 0.054, cz: -0.002 }, { y: 0.03, rx: 0.056, rz: 0.05, cz: -0.004 }], { seg: 16, arco: [0.35, TAU - 0.35], fundo: false });
    const dentro = loft([{ y: 0.0, rx: 0.056, rz: 0.05, cz: 0.0 }, { y: 0.02, rx: 0.058, rz: 0.052, cz: -0.002 }, { y: 0.03, rx: 0.054, rz: 0.048, cz: -0.004 }], { seg: 16, arco: [0.35, TAU - 0.35] }); dentro.inverter(); dentro.calcNormais();
    const tc = E.top.gola === 'polo' && E.top.punho ? E.top.punho : (E.top.tipo === 'colete' ? (E.top.mangasT || E.top.t) : E.top.t);
    M.add(colar, mT(0, 1.36, -0.002), tc, (X, Y) => P2(B.peito, B.pescoco, 0.25));
    M.add(dentro, mT(0, 1.36, -0.002), tc, (X, Y) => P2(B.peito, B.pescoco, 0.25), true);
  }
}

// ------------------------------------------------------------------ cabelo
function construirCabelo(M, ch, E, mHC, LADOS) {
  const F = ch.F; const est = F.estilo; const H = E.cabelo;
  const rnd = aleatorio(F.h ^ 0x9e3779b9);
  const brilho = (th, ph) => 0.2 * Math.exp(-(((th - 0.62) / 0.09) ** 2)) * ss(1.9, 1.2, Math.abs(ph));
  const tintaTh = (th, ph) => { const k = brilho(th, ph); return k > 0.01 ? { c: mixC(H.c, BRANCO, k), s: H.s } : H; };
  const naCabeca = (pt, tinta) => M.add(pt, mHC, tinta || H, P1(B.cabeca));

  // --- calota: termina exatamente na linha do cabelo
  const curto = est === 'franja-curta';
  const preso = est === 'rabo-de-cavalo' || est === 'coque';
  const tf = 1.0, ts = curto ? 1.78 : 1.86, tb = est === 'franja-curta' ? 2.05 : preso ? 2.12 : 2.25;
  const linha = (ph) => { const a = Math.abs(ph); return tf + (ts - tf) * ss(0.7, 1.45, a) + (tb - ts) * ss(1.75, 2.9, a); };
  const vol = est === 'ondulado-longo' ? 1.25 : curto ? 0.95 : 1.0;
  const offCal = (th, ph) => (0.008 + 0.016 * vol * Math.pow(clamp(Math.cos(th) * 1.1 + 0.1, 0, 1), 0.8) + 0.007 * vol * ss(1.6, 3.0, Math.abs(ph)) * Math.sin(th)) * (preso ? 0.85 : 1);
  const nu = ch.q === 'pc' ? 28 : 22, nv = ch.q === 'pc' ? 12 : 9;
  const cal = grade(nu, nv, (u, v) => { const ph = (u - 0.5) * TAU; const th = 0.02 + (linha(ph) - 0.02) * v; return pontoCabeca(th, ph, offCal(th, ph)); }, { wrapU: true, ref: () => [0, 0, 0] });
  M.add(cal, mHC, (X, Y, Z, m) => { const ph = (m.u - 0.5) * TAU; return tintaTh(0.02 + (linha(ph) - 0.02) * m.v, ph); }, P1(B.cabeca));

  // --- mechas: helper sobre a superfície da cabeça
  const mecha = (pts, peso, tinta, lados) => { const t = tubo(pts, lados || LADOS); M.add(t, mHC, tinta || ((X, Y, Z, m) => H), peso || P1(B.cabeca)); };
  const pSup = (th, ph, off) => pontoCabeca(th, ph, off);
  const nSup = (th, ph) => normalCabeca(th, ph);

  // --- franja
  const tipoF = curto ? 'pesada' : F.franja;
  const nF = tipoF === 'pesada' ? 9 : tipoF === 'reta' ? 8 : 7;
  for (let k = 0; k < nF; k++) {
    const s = ((k + 0.5) / nF) * 2 - 1;
    let ph0 = s * 0.95, ph1 = s * 0.78, th1 = 1.44 + (rnd() - 0.5) * 0.06;
    if (tipoF === 'lateral') { const L = F.lado; ph0 = s * 0.95 - L * 0.25; ph1 = ph0 + L * (0.35 + 0.15 * (1 - Math.abs(s))); th1 = 1.36 + 0.12 * ((L * s + 1) / 2) + (rnd() - 0.5) * 0.05; }
    if (tipoF === 'repartida') { ph0 = s * 0.35 + Math.sign(s) * 0.08; ph1 = Math.sign(s) * (0.45 + Math.abs(s) * 0.62); th1 = 1.32 + Math.abs(s) * 0.12 + (rnd() - 0.5) * 0.05; }
    if (tipoF === 'pesada') th1 = 1.5 + (k % 2 ? 0.04 : -0.03) + (rnd() - 0.5) * 0.05;
    if (tipoF === 'reta') th1 = 1.47 + (k % 3 === 1 ? 0.035 : k % 3 === 2 ? -0.02 : 0) + (rnd() - 0.5) * 0.02;
    th1 += VAR_FRANJA[(k + (F.h >>> 13)) % VAR_FRANJA.length] * (tipoF === 'reta' ? 0.35 : 0.8);
    if (Math.abs(s) > 0.8) th1 += 0.07;   // pontas de fora descem mais (emolduram o rosto)
    const th0 = 0.3, N = 7; const pts = [];
    const W = (tipoF === 'pesada' ? 0.034 : 0.032) * (1 - Math.abs(s) * 0.2);
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const th = lerp(th0, th1, t), ph = lerp(ph0, ph1, Math.pow(t, 1.4));
      const off = 0.012 + 0.011 * Math.sin(Math.PI * clamp(t * 1.2, 0, 1)) + 0.002 * t * t;
      const w = W * (t < 0.75 ? 1 - 0.15 * t : (1 - t) / 0.25 * 0.89);
      pts.push({ p: pSup(th, ph, off), w: i === N - 1 ? 0 : w, h: i === N - 1 ? 0 : 0.0065 * (1 - t * 0.6), out: nSup(th, ph) });
    }
    mecha(pts, null, (X, Y, Z, m) => tintaTh(lerp(th0, th1, m.t), 0), ch.q === 'pc' ? 5 : 4);
  }

  // --- mechas laterais (emolduram o rosto)
  const longo = ['longo-liso', 'ondulado-longo', 'trança-lateral', 'maria-chiquinha', 'rabo-de-cavalo'].includes(est);
  const yFim = est === 'chanel' ? -0.085 : curto ? -0.05 : preso ? -0.1 : longo ? -0.2 : -0.12;
  for (const lado of [1, -1]) {
    const pts = []; const N = 7;
    const phB = lado * 1.18;
    const a = pSup(0.75, lado * 1.05, 0.016), b = pSup(1.25, phB, 0.016), c = pSup(1.7, lado * 1.25, 0.014);
    const d = [c[0] + lado * 0.004, Math.max(yFim * 0.55, c[1] - 0.03), c[2] + 0.004];
    const e = [c[0] - lado * 0.004, yFim, c[2] + 0.012];
    const curva = [a, b, c, d, e];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1); const f = t * (curva.length - 1); const k = Math.min(curva.length - 2, Math.floor(f));
      const p = lerp3(curva[k], curva[k + 1], f - k);
      const wv = (est === 'chanel' ? 0.032 : 0.026) * (t < 0.7 ? 1 : (1 - t) / 0.3);
      pts.push({ p, w: i === N - 1 ? 0 : wv, h: i === N - 1 ? 0 : 0.007, out: [lado, 0, 0.35] });
    }
    const pesoLat = longo && yFim < -0.15 ? (X, Y, Z, m) => P2(B.cabeca, B.peito, ss(0.5, 1, m.t) * 0.5) : P1(B.cabeca);
    mecha(pts, pesoLat);
  }

  // --- costas por estilo
  if (est === 'longo-liso' || est === 'ondulado-longo') {
    // cortina contínua (nuca → meio das costas) + algumas mechas por cima pra dar fio
    const ond = est === 'ondulado-longo';
    const yEnd = ond ? -0.47 : -0.45, larg = ond ? 0.142 : 0.128;
    const PHC = 1.32;
    const cortina = (u, v, d) => {
      const sU = (u - 0.5) * 2, ph = Math.PI + sU * PHC;
      // cai reto da parte mais larga da cabeça, passa por trás dos ombros e desce até o meio das costas
      const A = pSup(1.6, ph, offCal(1.6, ph) - 0.002 - d);
      if (v < 0.16) { const th = lerp(1.0, 1.6, v / 0.16); return pSup(th, ph, offCal(th, ph) - 0.002 - d); }
      const zM = Math.min(A[2] - 0.01, -0.078 - 0.04 * (1 - sU * sU)) + d;
      const Mp = [A[0] * 1.06 + sU * 0.004, -0.17, zM];
      const ponta = 0.045 * Math.abs(Math.sin(u * Math.PI * (ond ? 5 : 6) + 0.6));
      const Ep = [sU * larg * (1 - d * 4), yEnd + ponta, -0.102 - 0.03 * (1 - sU * sU) + d];
      let p;
      if (v < 0.42) { const t = (v - 0.16) / 0.26; p = [lerp(A[0], Mp[0], t * t * (2 - t)), lerp(A[1], Mp[1], t), lerp(A[2], Mp[2], t * t * (2 - t))]; }
      else {
        const w = (v - 0.42) / 0.58;
        p = [lerp(Mp[0], Ep[0], w), lerp(Mp[1], Ep[1], w), lerp(Mp[2], Ep[2], w)];
        if (ond) { p[0] += Math.sin(w * 10 + sU * 2.5) * 0.012 * w; p[2] += Math.cos(w * 8 + sU * 4) * 0.007 * w; }
      }
      return p;
    };
    const nU = ch.q === 'pc' ? 18 : 14, nV = ch.q === 'pc' ? 12 : 10;
    const pesoCostas = (X, Y, Z, m, lx, ly) => (ly > -0.08 ? [[B.cabeca, 1]] : P2(B.cabeca, B.costas, ss(-0.08, -0.22, ly)));
    const fora = grade(nU, nV, (u, v) => cortina(u, v, 0), {});
    fora.orientar((i) => { const m = fora.M[i]; const q = cortina(m.u, m.v, 0); return [q[0] * 0.4, q[1], q[2] + 0.2]; });
    fora.calcNormais();
    M.add(fora, mHC, (X, Y, Z, m) => tintaTh(1.2 + m.v * 1.2, Math.PI), pesoCostas);
    const dentro = grade(nU, nV, (u, v) => cortina(u, v, 0.003), {});
    dentro.orientar((i) => { const m = dentro.M[i]; const q = cortina(m.u, m.v, 0.003); return [q[0] * 1.6, q[1], q[2] - 0.2]; });
    dentro.calcNormais();
    M.add(dentro, mHC, { c: mulC(H.c, [0.72, 0.68, 0.78]), s: H.s }, pesoCostas, true);
    // mechas por cima da cortina
    for (const sU of [-0.78, -0.4, 0.0, 0.42, 0.8]) {
      const u = sU / 2 + 0.5; const pts = []; const N = 8;
      for (let i = 0; i < N; i++) {
        const v = 0.3 + (i / (N - 1)) * 0.68; const q = cortina(u, v, -0.005 * ss(0, 0.3, i / (N - 1)));
        const w = 0.02 * (i < N - 2 ? 1 : (N - 1 - i) / 2) * (i === 0 ? 0.5 : 1);
        pts.push({ p: q, w: i === N - 1 ? 0 : w, h: i === N - 1 ? 0 : 0.006, out: [q[0] * 0.5, 0.0, -1] });
      }
      mecha(pts, pesoCostas);
    }
  } else if (est === 'rabo-de-cavalo') {
    const caminho = [[0, 0.062, -0.095], [0, 0.077, -0.128], [0, 0.064, -0.158], [0, 0.02, -0.174], [0, -0.04, -0.176], [0, -0.1, -0.168], [0, -0.16, -0.157], [0, -0.22, -0.146], [0, -0.27, -0.138]];
    const ws = [0.022, 0.036, 0.046, 0.048, 0.046, 0.04, 0.031, 0.018, 0];
    const pts = caminho.map((p, i) => ({ p: [p[0] + (i > 5 ? 0.008 * (i - 5) : 0), p[1], p[2]], w: ws[i], h: ws[i] * 0.85, out: [0, 0.3, -1] }));
    const pesoRabo = (X, Y, Z, m) => { const t = m.i / 8; return t < 0.3 ? P2(B.a1, B.a2, ss(0.2, 0.36, t)) : t < 0.6 ? P2(B.a2, B.a3, ss(0.5, 0.66, t)) : [[B.a3, 1]]; };
    // mais duas mechas finas no rabo pra volume
    for (const dx of [-0.018, 0.018]) {
      const p2 = caminho.map((p, i) => ({ p: [p[0] + dx * (i > 1 ? 1 : 0.3), p[1] - 0.004 * i, p[2] + 0.004], w: ws[i] * 0.6, h: ws[i] * 0.5, out: [dx, 0.3, -1] }));
      p2[p2.length - 1].p[1] += 0.03; mecha(p2, pesoRabo);
    }
    mecha(pts, pesoRabo, null, 8);
    const laco = deGeo(new THREE.TorusGeometry(0.019, 0.007, 6, 12), mComp(0, 0.066, -0.104, 0.6, 0, 0));
    M.add(laco, mHC, tPano(F.slug === 'jobpago' ? cor('#2f4a6b') : F.accent), P1(B.a1));
  } else if (est === 'maria-chiquinha') {
    for (const lado of [1, -1]) {
      const caminho = [[0.088, 0.045, -0.03], [0.12, 0.055, -0.045], [0.15, 0.035, -0.06], [0.165, -0.02, -0.075], [0.17, -0.09, -0.09], [0.165, -0.16, -0.103], [0.155, -0.235, -0.113], [0.145, -0.3, -0.118]]
        .map((p) => [p[0] * lado, p[1], p[2]]);
      const ws = [0.022, 0.034, 0.042, 0.043, 0.04, 0.033, 0.02, 0];
      const A = lado > 0 ? [B.a1, B.a2, B.a3] : [B.b1, B.b2, B.b3];
      const peso = (X, Y, Z, m) => { const t = m.i / 7; return t < 0.35 ? P2(A[0], A[1], ss(0.25, 0.42, t)) : t < 0.65 ? P2(A[1], A[2], ss(0.55, 0.7, t)) : [[A[2], 1]]; };
      mecha(caminho.map((p, i) => ({ p: [p[0] + lado * 0.012 * Math.sin(i * 0.9), p[1], p[2]], w: ws[i], h: ws[i] * 0.8, out: [lado, 0.2, -0.3] })), peso, null, 8);
      const p2 = caminho.map((p, i) => ({ p: [p[0] - lado * 0.01, p[1] - 0.005 * i, p[2] + 0.012], w: ws[i] * 0.6, h: ws[i] * 0.5, out: [lado, 0.2, 0.3] }));
      mecha(p2, peso);
      const lacoC = F.slug === 'atendimento-lead' ? cor('#ffffff') : F.accent;
      if (F.slug === 'atendimento-lead') {
        for (const s of [1, -1]) M.add(elipsoide(0, 0, 0, 0.028, 0.017, 0.009, 8, 5), M4().multiplyMatrices(mHC, mComp(lado * 0.1, 0.05 + s * 0.022, -0.04, 0, lado * 0.9, s * 0.5)), tPano(lacoC), P1(B.cabeca));
        M.add(elipsoide(lado * 0.1, 0.05, -0.04, 0.011, 0.011, 0.011, 6, 4), mHC, tPano(lacoC), P1(B.cabeca));
      } else {
        const laco = deGeo(new THREE.TorusGeometry(0.017, 0.007, 6, 12), mComp(lado * 0.098, 0.048, -0.035, 0, 0, lado * 1.2));
        M.add(laco, mHC, tPano(lacoC), P1(A[0]));
      }
    }
    // nuca: camada curta atrás
    nucaCurta(mecha, pSup, nSup, rnd, 7, -0.085);
  } else if (est === 'chanel') {
    const choppy = F.slug === 'robos-navegador';
    const lado = F.slug === 'link-checker' ? 1 : 0;
    const PH0 = 0.88, nU = ch.q === 'pc' ? 24 : 18, nV = 6;
    const forma = (u, v, d) => {
      const ph = lerp(PH0, TAU - PH0, u) - Math.PI; // -π+PH0 … π-PH0 passando pela nuca (0 = nuca)
      const phH = ph + Math.PI;                       // ângulo na convenção da cabeça
      const yTop = 0.065, yb = -0.088 + (choppy ? 0.012 * Math.abs(Math.sin(u * 23)) : 0) + lado * 0.02 * Math.sin(phH);
      const y = lerp(yTop, yb, v);
      const bul = Math.sin(Math.PI * clamp(v * 1.15, 0, 1));
      const r = 0.104 + 0.02 * bul - 0.012 * ss(0.8, 1, v) - d;
      const dx = Math.sin(phH), dz = Math.cos(phH);
      return [dx * r * 1.0, y, dz * r * (dz < 0 ? 1.1 : 1.0) - 0.004];
    };
    const fora = grade(nU, nV, (u, v) => forma(u, v, 0), { ref: () => [0, 0, 0] });
    const dentro = grade(nU, nV, (u, v) => forma(u, v, 0.0025), { ref: () => [0, 0, 0] }); dentro.inverter(); dentro.calcNormais();
    M.add(fora, mHC, H, P1(B.cabeca));
    M.add(dentro, mHC, { c: mulC(H.c, [0.75, 0.72, 0.8]), s: H.s }, P1(B.cabeca), true);
  } else if (est === 'coque') {
    const tipo = F.coque;
    const pos = tipo === 'alto' ? [0, 0.1, -0.06] : tipo === 'topo' ? [0, 0.122, -0.01] : [0, -0.035, -0.118];
    const r = tipo === 'topo' ? 0.052 : 0.048;
    const coque = elipsoide(0, 0, 0, r, r * 0.85, r * 0.92, 12, 8, (x, y, z) => { const a = Math.atan2(z, x); const k = 1 + 0.06 * Math.sin(a * 5 + y * 40); return [x * k, y, z * k]; });
    const rot = tipo === 'baixo' ? mComp(pos[0], pos[1], pos[2], 1.2, 0, 0) : tipo === 'alto' ? mComp(pos[0], pos[1], pos[2], -0.6, 0, 0) : mComp(pos[0], pos[1], pos[2]);
    M.add(coque, M4().multiplyMatrices(mHC, rot), (X, Y, Z, m, lx, ly) => (ly > r * 0.3 ? tBrilho(H, 0.12) : H), P1(B.cabeca));
    const lacoP = tipo === 'baixo' ? mComp(0, -0.012, -0.1, 1.2, 0, 0) : tipo === 'alto' ? mComp(0, 0.075, -0.068, -0.6, 0, 0) : mComp(0, 0.1, -0.012);
    M.add(deGeo(new THREE.TorusGeometry(r * 0.6, 0.006, 5, 12), M4().multiplyMatrices(lacoP, mComp(0, 0, 0, Math.PI / 2, 0, 0))), mHC, tPano(F.slug === 'avisos-leilao' ? cor('#c9a13a') : F.accent), P1(B.cabeca));
  } else if (est === 'franja-curta') {
    // tufos em camadas atrás e dos lados (pixie)
    for (let k = 0; k < 9; k++) {
      const ph = Math.PI + (k / 8 - 0.5) * 3.6; const th0 = 1.1, th1 = 1.95 + (k % 2) * 0.12;
      const pts = []; for (let i = 0; i < 5; i++) { const t = i / 4; const th = lerp(th0, th1, t); pts.push({ p: pSup(th, ph + (k % 2 ? 0.05 : -0.05) * t, 0.013 + 0.008 * Math.sin(Math.PI * t) + 0.006 * t), w: i === 4 ? 0 : 0.034 * (1 - t * 0.5), h: i === 4 ? 0 : 0.007, out: nSup(th, ph) }); }
      mecha(pts);
    }
  } else if (est === 'trança-lateral') {
    nucaCurta(mecha, pSup, nSup, rnd, 7, -0.07);
    // trança no lado esquerdo (+X), por cima do ombro
    const L = 1;
    const cam = [[0.075, -0.03, -0.055], [0.098, -0.075, -0.035], [0.112, -0.12, -0.005], [0.118, -0.16, 0.035], [0.118, -0.2, 0.07], [0.115, -0.25, 0.092], [0.11, -0.3, 0.1], [0.105, -0.35, 0.098], [0.1, -0.395, 0.092]];
    const contas = [];
    for (let i = 0; i < cam.length; i++) {
      const p = cam[i]; const r = 0.026 - i * 0.0014; const alt = i % 2 ? 1 : -1;
      const conta = elipsoide(0, 0, 0, r * 0.95, r * 1.45, r * 0.78, 8, 6);
      const prox = cam[Math.min(i + 1, cam.length - 1)], ant = cam[Math.max(i - 1, 0)];
      const dir = norm3(sub3(prox, ant));
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(dir[0], dir[1], dir[2]));
      q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, alt * 0.5)));
      const m = M4().compose(new THREE.Vector3(p[0] * L + alt * 0.005, p[1], p[2]), q, new THREE.Vector3(1, 1, 1));
      contas.push([conta, m, i]);
    }
    for (const [conta, m, i] of contas) M.add(conta, M4().multiplyMatrices(mHC, m), H, i < 2 ? P1(B.cabeca) : P2(B.cabeca, B.peito, ss(1, 4, i)));
    // ponta + laço
    const ponta = cam[cam.length - 1];
    mecha([{ p: [ponta[0], ponta[1] - 0.01, ponta[2]], w: 0.016, h: 0.012, out: [0, 0, 1] }, { p: [ponta[0] + 0.004, ponta[1] - 0.045, ponta[2] - 0.004], w: 0.014, h: 0.01, out: [0, 0, 1] }, { p: [ponta[0] + 0.006, ponta[1] - 0.075, ponta[2] - 0.01], w: 0, h: 0, out: [0, 0, 1] }], P1(B.peito));
    M.add(deGeo(new THREE.TorusGeometry(0.016, 0.006, 5, 10), mComp(ponta[0], ponta[1] - 0.008, ponta[2], Math.PI / 2, 0, 0)), mHC, tPano(F.accent), P1(B.peito));
  }
  if (est === 'rabo-de-cavalo') nucaCurta(mecha, pSup, nSup, rnd, 3, -0.045);

  // ahoge
  if (F.ahoge && !E.acess.has('bone') && !E.acess.has('chapeu')) {
    const base = pSup(0.32, 0.25, 0.016);
    const pts = [{ p: base, w: 0.008, h: 0.004, out: [0, 1, 0] }, { p: add3(base, [0.004, 0.03, 0.012]), w: 0.007, h: 0.0035, out: [0, 1, 0] }, { p: add3(base, [0.01, 0.048, 0.038]), w: 0.005, h: 0.003, out: [0, 0.5, 1] }, { p: add3(base, [0.014, 0.038, 0.06]), w: 0, h: 0, out: [0, 0, 1] }];
    mecha(pts);
  }
}
function nucaCurta(mecha, pSup, nSup, rnd, n, yFim) {
  for (let k = 0; k < n; k++) {
    const s = (k / (n - 1)) * 2 - 1; const ph = Math.PI + s * 1.3;
    const pts = []; const th0 = 1.4, N = 5;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1); const th = lerp(th0, 2.35, t);
      const p = pSup(th, ph, 0.012 + 0.008 * t);
      if (t > 0.5) p[1] = Math.max(p[1], yFim + (rnd() - 0.5) * 0.015);
      pts.push({ p, w: i === N - 1 ? 0 : 0.03, h: i === N - 1 ? 0 : 0.008, out: nSup(th, ph) });
    }
    mecha(pts);
  }
}

// ------------------------------------------------------------------ rosto (canvas)
function claro(hex, k) { const c = new THREE.Color(hex); return '#' + c.lerp(new THREE.Color('#ffffff'), k).getHexString(); }
function escuro(hex, k) { const c = new THREE.Color(hex); return '#' + c.lerp(new THREE.Color('#14080c'), k).getHexString(); }
function desenharRosto(g, F, st) {
  const W = g.canvas.width; const K = W / 256;
  const px = (x) => ((x + ROSTO.x) / (2 * ROSTO.x)) * W;
  const py = (y) => ((ROSTO.y1 - y) / (ROSTO.y1 - ROSTO.y0)) * W;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = F.peleHex; g.fillRect(0, 0, W, W);
  const lumPele = lumC(F.pele);
  const cilios = '#2a1a22';
  const tipo = F.tipoOlho;
  // blush
  for (const s of [1, -1]) {
    const cx = px(s * 0.054), cy = py(-0.046);
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 17 * K);
    const a = lumPele > 0.25 ? 0.32 : 0.22;
    gr.addColorStop(0, `rgba(255,105,130,${a})`); gr.addColorStop(1, 'rgba(255,105,130,0)');
    g.save(); g.translate(cx, cy); g.scale(1, 0.5); g.translate(-cx, -cy); g.fillStyle = gr; g.fillRect(cx - 20 * K, cy - 20 * K, 40 * K, 40 * K); g.restore();
  }
  // olhos
  const eyeW = (tipo === 'redondo' ? 47 : tipo === 'felino' ? 49 : 47) * K;
  const eyeH = (tipo === 'redondo' ? 56 : tipo === 'felino' ? 46 : tipo === 'sereno' ? 46 : 54) * K;
  const ey = py(-0.016);
  for (const d of [1, -1]) olho(g, px(d * 0.04), ey, eyeW, eyeH, d, F, st, K);
  // sobrancelhas
  const sob = escuro(F.sombraHex, 0.25);
  g.strokeStyle = sob; g.lineCap = 'round';
  for (const d of [1, -1]) {
    const ang = tipo === 'felino' ? 0.18 : tipo === 'sereno' ? -0.05 : 0.05;
    const y0 = py(0.03) + (st.olhos === 'feliz' ? -3 * K : 0);
    g.lineWidth = 3.2 * K;
    g.beginPath();
    g.moveTo(px(d * 0.02), y0 + 4 * K * (1 + ang * 2));
    g.quadraticCurveTo(px(d * 0.045), y0 - 4 * K, px(d * 0.066), y0 + 1 * K - ang * 10 * K);
    g.stroke();
  }
  // nariz
  g.strokeStyle = escuro(F.peleHex, 0.22); g.lineWidth = 2 * K;
  g.beginPath(); g.moveTo(px(0.003), py(-0.047)); g.lineTo(px(0.0008), py(-0.051)); g.stroke();
  // boca
  const by = py(-0.073), bw = 15 * K;
  const labio = lumPele > 0.25 ? '#a8505c' : '#5c2430';
  g.lineWidth = 2.4 * K; g.strokeStyle = labio; g.fillStyle = '#7a2633';
  const boca = st.boca;
  if (boca === 0) {
    g.beginPath(); g.moveTo(px(0) - bw / 2, by); g.quadraticCurveTo(px(0), by + (st.sorriso ? 5 : 3) * K, px(0) + bw / 2, by - 0.5 * K); g.stroke();
  } else if (boca === 1) {
    g.beginPath(); g.ellipse(px(0), by + 1.5 * K, bw * 0.3, 4 * K, 0, 0, TAU); g.fill();
  } else {
    g.beginPath(); g.moveTo(px(0) - bw * 0.48, by - 1 * K); g.quadraticCurveTo(px(0), by - 2 * K, px(0) + bw * 0.48, by - 1 * K);
    g.quadraticCurveTo(px(0) + bw * 0.3, by + 10 * K, px(0), by + 10 * K); g.quadraticCurveTo(px(0) - bw * 0.3, by + 10 * K, px(0) - bw * 0.48, by - 1 * K); g.fill();
    g.fillStyle = '#e07c86'; g.beginPath(); g.ellipse(px(0), by + 7.5 * K, bw * 0.24, 2.6 * K, 0, 0, TAU); g.fill();
  }
  // óculos
  if (F.oculos) {
    const r = eyeW * 0.66;
    g.lineWidth = 3 * K;
    if (F.oculos === 'meia-lua') {
      g.strokeStyle = '#b8902e';
      for (const d of [1, -1]) { g.beginPath(); g.arc(px(d * 0.04), ey + 6 * K, r, 0.1, Math.PI - 0.1); g.stroke(); g.beginPath(); g.moveTo(px(d * 0.04) - r, ey + 8 * K); g.lineTo(px(d * 0.04) + r, ey + 8 * K); g.stroke(); }
    } else {
      g.strokeStyle = F.oculos === 'laranja' ? '#2a2420' : '#3b2e3e';
      for (const d of [1, -1]) {
        if (F.oculos === 'laranja') { g.fillStyle = 'rgba(255,128,40,0.32)'; g.beginPath(); g.arc(px(d * 0.04), ey + 2 * K, r, 0, TAU); g.fill(); }
        g.beginPath(); g.arc(px(d * 0.04), ey + 2 * K, r, 0, TAU); g.stroke();
      }
      g.beginPath(); g.moveTo(px(-0.04) + r, ey); g.quadraticCurveTo(px(0), ey - 6 * K, px(0.04) - r, ey); g.stroke();
    }
  }
}
function olho(g, cx, cy, w, h, d, F, st, K) {
  const tipo = F.tipoOlho;
  const tilt = tipo === 'felino' ? 0.16 : tipo === 'sereno' ? 0.02 : 0.06;
  const xi = cx - d * w * 0.5, xo = cx + d * w * 0.5;
  const yi = cy + h * 0.12, yo = cy - h * tilt;
  const yTop = cy - h * 0.5, yBot = cy + h * 0.44;
  const cil = '#2a1a22';
  if (st.olhos !== 'aberto') {
    g.strokeStyle = cil; g.lineWidth = 4.2 * K; g.lineCap = 'round';
    g.beginPath();
    if (st.olhos === 'feliz') { g.moveTo(xi, cy + h * 0.12); g.quadraticCurveTo(cx, cy - h * 0.32, xo, cy + h * 0.08); }
    else { g.moveTo(xi, cy + h * 0.05); g.quadraticCurveTo(cx, cy + h * 0.32, xo, cy); g.lineTo(xo + d * w * 0.12, cy - h * 0.1); }
    g.stroke();
    return;
  }
  // esclera
  g.beginPath(); g.moveTo(xi, yi);
  g.bezierCurveTo(xi + d * w * 0.06, yTop - h * 0.02, xo - d * w * 0.28, yTop - h * 0.06, xo, yo);
  g.bezierCurveTo(xo - d * w * 0.06, yBot + h * 0.02, xi + d * w * 0.3, yBot + h * 0.06, xi, yi);
  g.closePath();
  g.fillStyle = '#fbfaff'; g.fill();
  g.save(); g.clip();
  const sl = g.createLinearGradient(0, yTop, 0, yTop + h * 0.4); sl.addColorStop(0, 'rgba(110,90,150,0.5)'); sl.addColorStop(1, 'rgba(110,90,150,0)');
  g.fillStyle = sl; g.fillRect(cx - w, yTop - h * 0.2, w * 2, h * 0.6);
  // íris
  const ix = cx + d * w * 0.03, iy = cy + h * (tipo === 'sereno' ? 0.1 : 0.04), irx = w * 0.35, iry = h * (tipo === 'felino' ? 0.52 : 0.47);
  const gi = g.createLinearGradient(0, iy - iry, 0, iy + iry);
  gi.addColorStop(0, escuro(F.olhosHex, 0.6)); gi.addColorStop(0.42, F.olhosHex); gi.addColorStop(1, claro(F.olhosHex, 0.55));
  g.fillStyle = gi; g.beginPath(); g.ellipse(ix, iy, irx, iry, 0, 0, TAU); g.fill();
  g.strokeStyle = escuro(F.olhosHex, 0.7); g.lineWidth = 1.6 * K; g.stroke();
  // pupila
  g.fillStyle = escuro(F.olhosHex, 0.85); g.beginPath(); g.ellipse(ix, iy - iry * 0.06, irx * 0.46, iry * (tipo === 'felino' ? 0.58 : 0.5), 0, 0, TAU); g.fill();
  // brilho de baixo (crescente)
  g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.ellipse(ix, iy + iry * 0.62, irx * 0.62, iry * 0.22, 0, 0, TAU); g.fill();
  // reflexos
  g.fillStyle = '#ffffff';
  g.beginPath(); g.ellipse(ix - irx * 0.32, iy - iry * 0.42, irx * 0.36, iry * 0.26, -0.3, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(ix + irx * 0.38, iy + iry * 0.36, irx * 0.15, iry * 0.11, 0, 0, TAU); g.fill();
  if (tipo === 'vivo' || tipo === 'redondo') { g.beginPath(); g.ellipse(ix + irx * 0.2, iy - iry * 0.6, irx * 0.09, iry * 0.07, 0, 0, TAU); g.fill(); }
  g.restore();
  // sombra da pálpebra (sereno)
  if (tipo === 'sereno') {
    g.fillStyle = 'rgba(60,30,50,0.18)';
    g.beginPath(); g.moveTo(xi, yi); g.bezierCurveTo(xi + d * w * 0.06, yTop - h * 0.02, xo - d * w * 0.28, yTop - h * 0.06, xo, yo); g.lineTo(xo, yo + h * 0.22); g.quadraticCurveTo(cx, yTop + h * 0.2, xi, yi); g.fill();
  }
  // linha dos cílios superiores com o "risquinho" pra fora
  g.strokeStyle = cil; g.fillStyle = cil; g.lineCap = 'round'; g.lineJoin = 'round';
  g.lineWidth = 3.4 * K;
  g.beginPath(); g.moveTo(xi + d * w * 0.02, yi - h * 0.02);
  g.bezierCurveTo(xi + d * w * 0.06, yTop - h * 0.02, xo - d * w * 0.28, yTop - h * 0.06, xo, yo);
  g.stroke();
  // engrossa na metade de fora + asinha
  g.beginPath();
  g.moveTo(cx - d * w * 0.05, yTop + h * 0.0);
  g.quadraticCurveTo(xo - d * w * 0.18, yTop - h * 0.08, xo + d * w * 0.03, yo - h * 0.02);
  g.lineTo(xo + d * w * (tipo === 'felino' ? 0.2 : 0.14), yo - h * (tipo === 'felino' ? 0.2 : 0.14));
  g.lineTo(xo - d * w * 0.02, yo + h * 0.08);
  g.quadraticCurveTo(xo - d * w * 0.22, yTop + h * 0.04, cx - d * w * 0.05, yTop + h * 0.08);
  g.closePath(); g.fill();
  // cílio inferior de fora
  g.lineWidth = 1.8 * K;
  g.beginPath(); g.moveTo(xo - d * w * 0.02, yo + h * 0.14); g.quadraticCurveTo(xo - d * w * 0.15, yBot + h * 0.02, cx + d * w * 0.05, yBot + h * 0.04); g.stroke();
  // vinco da pálpebra
  g.strokeStyle = 'rgba(70,30,40,0.35)'; g.lineWidth = 1.4 * K;
  g.beginPath(); g.moveTo(cx - d * w * 0.15, yTop - h * 0.12); g.quadraticCurveTo(cx + d * w * 0.15, yTop - h * 0.2, xo - d * w * 0.04, yo - h * 0.18); g.stroke();
}

// ------------------------------------------------------------------ objetos de mão
function geoProp(nome, F) {
  const R = recursos();
  const chave = nome + (['livro', 'halter', 'xicara', 'fones', 'cameraPescoco', 'fonesPescoco'].includes(nome) ? F.accentHex : '');
  if (R.props.has(chave)) return R.props.get(chave);
  const M = new Malha(false);
  const ac = tPano(F.accent), esc = tPano(cor('#24242a')), bra = tPano(cor('#f6f3ee')), tela = { c: cor('#9fd0ff'), s: cor('#6aa6e6') };
  const add = (g, m, t) => M.add(deGeo(g, m && m.isMatrix4 ? m : null), null, t, null);
  switch (nome) {
    case 'celular': add(new THREE.BoxGeometry(0.008, 0.075, 0.037), null, esc); add(new THREE.BoxGeometry(0.0015, 0.066, 0.032), mT(0.0042, 0, 0), tela); break;
    case 'tablet': add(new THREE.BoxGeometry(0.2, 0.008, 0.14), null, esc); add(new THREE.BoxGeometry(0.184, 0.0015, 0.124), mT(0, 0.0045, 0), tela); break;
    case 'livro': {
      for (const s of [1, -1]) {
        add(new THREE.BoxGeometry(0.098, 0.006, 0.145), mComp(s * 0.05, 0, 0, 0, 0, -s * 0.12), ac);
        add(new THREE.BoxGeometry(0.092, 0.012, 0.136), mComp(s * 0.048, 0.007, 0, 0, 0, -s * 0.12), bra);
      }
      break;
    }
    case 'halter': add(new THREE.CylinderGeometry(0.011, 0.011, 0.13, 8), mComp(0, 0, 0, Math.PI / 2, 0, 0), esc); for (const s of [1, -1]) add(new THREE.CylinderGeometry(0.032, 0.032, 0.035, 6), mComp(0, 0, s * 0.06, Math.PI / 2, 0, 0), ac); break;
    case 'camera': add(new THREE.BoxGeometry(0.11, 0.07, 0.05), null, esc); add(new THREE.CylinderGeometry(0.024, 0.026, 0.05, 12), mComp(0, -0.003, 0.045, Math.PI / 2, 0, 0), esc); add(new THREE.CylinderGeometry(0.018, 0.018, 0.002, 12), mComp(0, -0.003, 0.071, Math.PI / 2, 0, 0), tela); add(new THREE.BoxGeometry(0.02, 0.012, 0.02), mT(-0.035, 0.04, 0), ac); break;
    case 'xicara': add(new THREE.CylinderGeometry(0.03, 0.025, 0.065, 12), null, bra); add(new THREE.CylinderGeometry(0.026, 0.026, 0.002, 12), mT(0, 0.031, 0), { c: cor('#5a3420'), s: cor('#3a2010') }); add(new THREE.TorusGeometry(0.017, 0.005, 5, 10, Math.PI * 1.2), mComp(0.032, 0.002, 0, 0, 0, -Math.PI * 0.6), bra); break;
    case 'ponteiro': add(new THREE.CylinderGeometry(0.0035, 0.0045, 0.42, 6), mT(0, 0.21, 0), esc); add(new THREE.SphereGeometry(0.008, 6, 4), mT(0, 0.42, 0), tPano(cor('#e8413c'))); break;
    case 'cartas': add(new THREE.BoxGeometry(0.004, 0.08, 0.12), null, tPano(cor('#f3e6c8'))); add(new THREE.BoxGeometry(0.0015, 0.03, 0.03), mComp(0.0025, 0.01, 0, Math.PI / 4, 0, 0), tPano(cor('#c23b3b'))); break;
    case 'fones': {
      add(new THREE.TorusGeometry(0.122, 0.009, 5, 20, Math.PI), mComp(0, 0, -0.005, 0, 0, 0), esc);
      for (const s of [1, -1]) { add(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 14), mComp(s * 0.118, -0.02, -0.005, 0, 0, Math.PI / 2), esc); add(new THREE.CylinderGeometry(0.03, 0.03, 0.002, 14), mComp(s * 0.134, -0.02, -0.005, 0, 0, Math.PI / 2), ac); }
      break;
    }
    case 'fonesPescoco': {
      add(new THREE.TorusGeometry(0.075, 0.008, 5, 18, Math.PI), mComp(0, 0, -0.03, Math.PI / 2 + 0.35, 0, Math.PI), esc);
      for (const s of [1, -1]) { add(new THREE.CylinderGeometry(0.034, 0.034, 0.026, 12), mComp(s * 0.075, -0.012, 0.012, 0.25, 0, Math.PI / 2 + s * 0.4), esc); add(new THREE.CylinderGeometry(0.026, 0.026, 0.002, 12), mComp(s * 0.088, -0.006, 0.02, 0.25, 0, Math.PI / 2 + s * 0.4), ac); }
      break;
    }
    case 'cameraPescoco': add(new THREE.BoxGeometry(0.085, 0.055, 0.04), null, esc); add(new THREE.CylinderGeometry(0.019, 0.02, 0.035, 10), mComp(0, -0.002, 0.035, Math.PI / 2, 0, 0), esc); add(new THREE.CylinderGeometry(0.014, 0.014, 0.002, 10), mComp(0, -0.002, 0.053, Math.PI / 2, 0, 0), tela); break;
    default: add(new THREE.BoxGeometry(0.05, 0.05, 0.05), null, ac);
  }
  const g = M.geometria(); g.computeBoundingSphere();
  R.props.set(chave, g);
  return g;
}
// onde cada objeto vai: osso + transformação local
const PROPS_ATIV = {
  'biblioteca-lendo': [['livro', B.maoD]], 'lendo-banco': [['livro', B.maoD]], 'telefone-andando': [['celular', B.maoD]],
  observatorio: [['tablet', B.maoE]], 'fones-transcrevendo': [['fones', B.cabeca]], 'quadro-reuniao': [['ponteiro', B.maoD]],
  recepcao: [['tablet', B.maoE]], 'fotografando-campo': [['camera', B.maoD]], 'sala-servidores': [['tablet', B.maoE]],
  'arquivo-cartas': [['cartas', B.maoD]], 'gestos-holograma': [['holo', -1]], halteres: [['halter', B.maoE], ['halter', B.maoD]],
  cafe: [['xicara', B.maoD]], 'caixa-registradora': [], computador: [],
};
function encaixeProp(nome, osso) {
  const esq = osso === B.maoE; const s = esq ? -1 : 1;
  switch (nome) {
    case 'celular': return mComp(s * 0.012, -0.05, 0.012, 0, 0, 0);
    case 'tablet': return mComp(s * 0.06, -0.075, 0.022, Math.PI / 2, 0, 0);   // tela virada pro rosto, apoiada nos dedos
    case 'livro': return mComp(0.05, -0.06, 0.03, 0.0, 0, 1.45);
    case 'halter': return mComp(s * 0.004, -0.05, 0.012, 0, 0, 0);
    case 'camera': return mComp(0.06, -0.035, 0.06, -0.05, 0, 0);
    case 'xicara': return mComp(s * 0.03, -0.045, 0.02, 0, 0, 0);
    case 'ponteiro': return mComp(s * 0.004, -0.05, 0.02, Math.PI / 2 + 0.2, 0, 0);
    case 'cartas': return mComp(s * 0.012, -0.065, 0.02, 0, 0, 0);
    case 'fones': return mT(HC[0], HC[1] - 0.005, HC[2]);
    default: return M4();
  }
}

// ------------------------------------------------------------------ poses
class Pose {
  constructor() { this.r = new Float32Array(NB * 3); this.hip = [0, QUADRIL_Y, 0]; this.corpoRx = 0; this.corpoY = 0; this.corpoZ = 0; this.olhos = null; this.boca = null; this.sorriso = false; this.caudas = null; }
  zerar() { this.r.fill(0); this.hip[0] = 0; this.hip[1] = QUADRIL_Y; this.hip[2] = 0; this.corpoRx = 0; this.corpoY = 0; this.corpoZ = 0; this.olhos = null; this.boca = null; this.sorriso = false; this.caudas = null; return this; }
  s(i, x, y, z) { this.r[i * 3] = x; this.r[i * 3 + 1] = y; this.r[i * 3 + 2] = z; return this; }
  a(i, x, y, z) { this.r[i * 3] += x; this.r[i * 3 + 1] += y; this.r[i * 3 + 2] += z; return this; }
}
function ikPerna(hy, hz, ty, tz) {
  const dy = ty - hy, dz = tz - hz; let d = Math.hypot(dy, dz); d = clamp(d, 0.08, COXA + CANELA - 0.002);
  const a = Math.atan2(dz, -dy);
  const b = Math.acos(clamp((COXA * COXA + d * d - CANELA * CANELA) / (2 * COXA * d), -1, 1));
  const k = Math.PI - Math.acos(clamp((COXA * COXA + CANELA * CANELA - d * d) / (2 * COXA * CANELA), -1, 1));
  return [-(a + b), k];
}
function respiro(P, t, ch, amp = 1) { const b = Math.sin(t * 1.7 + ch.fase); P.a(B.peito, -0.012 * b * amp, 0, 0); P.a(B.ombroE, 0, 0, 0.008 * b * amp); P.a(B.ombroD, 0, 0, -0.008 * b * amp); }
function bracosSoltos(P, ch, k = 1) {
  const ab = (0.13 + 0.14 * (ch.F.quadril - 1)) * k;
  P.s(B.ombroE, 0.05, 0, ab).s(B.cotoveloE, -0.22, -0.2, 0).s(B.maoE, 0.05, 0, -0.06);
  P.s(B.ombroD, 0.05, 0, -ab).s(B.cotoveloD, -0.22, 0.2, 0).s(B.maoD, 0.05, 0, 0.06);
}
function emPe(P, t, ch, calma = 1) {
  const sw = Math.sin(t * 0.42 + ch.fase * 2) * calma;
  P.hip[0] = 0.01 * sw; P.hip[1] = QUADRIL_Y - 0.004;
  P.s(B.quadril, 0, 0.03 * sw, 0.03 * sw);
  P.s(B.cintura, 0.02, 0, -0.02 * sw);
  P.s(B.peito, -0.035, 0, -0.012 * sw);
  P.s(B.pescoco, 0.05, 0, 0.01 * sw);
  P.s(B.cabeca, -0.04, 0, 0.025 * sw);
  bracosSoltos(P, ch);
  P.s(B.coxaE, -0.02, 0.05, -0.03 - 0.03 * sw).s(B.joelhoE, 0.04 + 0.08 * Math.max(0, -sw), 0, 0).s(B.peE, -0.02 - 0.04 * Math.max(0, -sw), -0.05, 0.03 + 0.03 * sw);
  P.s(B.coxaD, -0.02, -0.05, 0.03 - 0.03 * sw).s(B.joelhoD, 0.04 + 0.08 * Math.max(0, sw), 0, 0).s(B.peD, -0.02 - 0.04 * Math.max(0, sw), 0.05, -0.03 + 0.03 * sw);
  respiro(P, t, ch);
}
function passos(P, fase, ch, k = 1, corrida = 0) {
  const s1 = Math.sin(fase), c1 = Math.cos(fase);
  const A = (0.42 + 0.14 * corrida) * k;
  P.hip[0] = 0.008 * s1 * k; P.hip[1] = QUADRIL_Y - 0.012 * k - 0.04 * corrida + (0.014 + 0.02 * corrida) * Math.cos(2 * fase) * k; P.hip[2] = 0;
  P.s(B.quadril, 0.02 + 0.08 * corrida, 0.1 * s1 * k, 0.04 * c1 * k);
  P.s(B.cintura, 0.02 + 0.06 * corrida, -0.05 * s1 * k, -0.02 * c1 * k);
  P.s(B.peito, -0.03 + 0.02 * corrida, -0.07 * s1 * k, 0);
  P.s(B.pescoco, 0.05, 0.03 * s1 * k, 0);
  P.s(B.cabeca, -0.03 - 0.05 * corrida, 0.03 * s1 * k, 0.02 * c1 * k);
  const kneeE = (0.12 + (0.7 + 0.6 * corrida) * Math.pow(Math.max(0, c1), 1.4)) * k;
  const kneeD = (0.12 + (0.7 + 0.6 * corrida) * Math.pow(Math.max(0, -c1), 1.4)) * k;
  const thE = -A * s1 - 0.08 * corrida, thD = A * s1 - 0.08 * corrida;
  P.s(B.coxaE, thE, 0.04, -0.02).s(B.joelhoE, kneeE, 0, 0).s(B.peE, -(thE + kneeE) * 0.75 + 0.15 * Math.max(0, -s1) * k, -0.04, 0.02);
  P.s(B.coxaD, thD, -0.04, 0.02).s(B.joelhoD, kneeD, 0, 0).s(B.peD, -(thD + kneeD) * 0.75 + 0.15 * Math.max(0, s1) * k, 0.04, -0.02);
  const ab = 0.12 + 0.1 * (ch.F.quadril - 1);
  const bE = (0.32 + 0.12 * corrida) * s1 * k, bD = -(0.32 + 0.12 * corrida) * s1 * k;
  const cot = -0.25 - 1.15 * corrida;
  P.s(B.ombroE, bE, 0, ab + 0.04 * corrida).s(B.cotoveloE, cot - 0.18 * Math.max(0, -bE) * k, -0.25, 0).s(B.maoE, 0, 0, -0.08);
  P.s(B.ombroD, bD, 0, -ab - 0.04 * corrida).s(B.cotoveloD, cot - 0.18 * Math.max(0, -bD) * k, 0.25, 0).s(B.maoD, 0, 0, 0.08);
}
function sentar(P, ch, encosto = 0) {
  const s = ch.s;
  const hy = ASSENTO / s + 0.072, hz = -0.03;
  P.hip[0] = 0; P.hip[1] = hy; P.hip[2] = hz;
  P.s(B.quadril, -encosto * 0.5, 0, 0).s(B.cintura, 0.03 + encosto * 0.2, 0, 0).s(B.peito, -0.02 + encosto * 0.1, 0, 0);
  P.s(B.pescoco, 0.06, 0, 0).s(B.cabeca, 0.0, 0, 0);
  for (const lado of [1, -1]) {
    const [cx, kx] = ikPerna(hy, hz, TORNOZELO, hz + 0.40 + 0.02 * lado);
    P.s(lado > 0 ? B.coxaE : B.coxaD, cx + encosto * 0.5, lado * 0.06, -lado * 0.05).s(lado > 0 ? B.joelhoE : B.joelhoD, kx, 0, 0).s(lado > 0 ? B.peE : B.peD, -(cx + kx) - encosto * 0.5, -lado * 0.06, lado * 0.05);
  }
}
// braço direito/esquerdo com ombro/cotovelo/mão em uma linha
const braco = (P, lado, o, c, m) => { const b0 = lado > 0 ? B.ombroE : B.ombroD; P.s(b0, o[0], o[1], o[2]).s(b0 + 1, c[0], c[1], c[2]).s(b0 + 2, m[0], m[1], m[2]); };

// braço esquerdo dobrado na frente da barriga (o tablet se vira pro rosto sozinho)
const segurarTablet = (P, t) => braco(P, 1, [-0.4 + 0.03 * Math.sin(t * 0.6), -0.62, 0.1], [-1.42, 0, 0], [0.15, 0, 0]);

const POSES = {
  parada(P, t, ch) { emPe(P, t, ch); },
  falando(P, t, ch) {
    emPe(P, t, ch, 0.6);
    const g = Math.sin(t * 2.3 + ch.fase), g2 = Math.sin(t * 1.3);
    braco(P, -1, [-0.35 + 0.1 * g, 0.2, -0.3], [-1.1 + 0.25 * g2, 0.6, 0], [0.2, 0, 0.3]);
    P.a(B.cabeca, 0.05 * Math.sin(t * 3.1), 0.06 * g2, 0.04 * g);
    P.boca = 'fala';
  },
  acenando(P, t, ch) {
    emPe(P, t, ch, 0.5);
    const w = Math.sin(t * 9);
    braco(P, -1, [-0.15, 0, -2.55], [-0.25, 0.3 + 0.0, 0.35 * w], [0, 0, 0.15 * w]);
    P.a(B.cabeca, 0.02, 0.1, 0.1); P.a(B.peito, 0, 0, 0.04);
    P.sorriso = true; P.boca = 'sorriso';
    if ((t % 5) < 1.4) P.olhos = 'feliz';
  },
  andando(P, t, ch) { passos(P, ch.fasePasso, ch, 1); },
  computador(P, t, ch, st) {
    sentar(P, ch);
    const s = ch.s; const ombroY = (P.hip[1] + 0.475) * s;
    const alvoCot = MESA + 0.03; const ca = clamp((ombroY - alvoCot) / (BRACO * s), -1, 1); const o = Math.acos(ca);
    P.s(B.cintura, 0.08, 0, 0).s(B.peito, 0.02, 0, 0).s(B.pescoco, 0.05, 0, 0).s(B.cabeca, 0.08 + 0.02 * Math.sin(t * 0.7), 0.04 * Math.sin(t * 0.31 + ch.fase), 0);
    for (const lado of [1, -1]) {
      const ty = Math.sin(t * 11 + lado * 1.7 + ch.fase) * 0.03 + Math.sin(t * 7.3 + lado) * 0.02;
      braco(P, lado, [-o * 0.9 - 0.08, 0, lado * 0.16], [-(Math.PI / 2 - o * 0.9) - 0.12 + ty, -lado * 1.3, 0], [0.2 + ty, 0, -lado * 0.25]);
    }
    respiro(P, t, ch, 0.6);
  },
  'fones-transcrevendo'(P, t, ch, st) { POSES.computador(P, t, ch, st); P.a(B.cabeca, 0.04 * Math.sin(t * 5.2), 0, 0.03 * Math.sin(t * 2.6)); },
  'biblioteca-lendo'(P, t, ch) {
    sentar(P, ch);
    P.s(B.cintura, 0.06, 0, 0).s(B.peito, 0.02, 0, 0).s(B.pescoco, 0.12, 0, 0).s(B.cabeca, 0.2, 0.03 * Math.sin(t * 0.4), 0);
    const pg = (t % 9) < 0.7 ? Math.sin(((t % 9) / 0.7) * Math.PI) : 0;
    braco(P, -1, [-0.75, 0.0, -0.12], [-1.15, 0.9, 0.0], [0.3, 0, -0.1]);
    braco(P, 1, [-0.75 - 0.1 * pg, 0.0, 0.12], [-1.15, -0.9, 0.0], [0.3, 0, 0.1 + 0.4 * pg]);
    respiro(P, t, ch, 0.7);
  },
  cafe(P, t, ch) {
    sentar(P, ch, 0.05);
    const c = t % 7; const gole = c > 4.8 && c < 6.6 ? Math.sin(((c - 4.8) / 1.8) * Math.PI) : 0;
    P.s(B.cabeca, 0.02 - 0.12 * gole, 0.15 * Math.sin(t * 0.3 + ch.fase) * (1 - gole), 0);
    braco(P, -1, [-0.55 - 0.55 * gole, 0.1, -0.12], [-1.1 - 0.75 * gole, 0.6, 0], [0.0, 0, 0]);
    braco(P, 1, [-0.45, 0, 0.14], [-1.15, -1.0, 0], [0.2, 0, -0.2]);
    respiro(P, t, ch);
  },
  'lendo-banco'(P, t, ch) {
    sentar(P, ch, 0.12);
    // pernas cruzadas no tornozelo
    P.a(B.coxaE, 0.04, 0, -0.06); P.a(B.coxaD, 0.04, 0, 0.06); P.a(B.peE, 0, 0, 0.05);
    P.s(B.pescoco, 0.14, 0, 0).s(B.cabeca, 0.25, 0, 0.03);
    braco(P, -1, [-0.42, 0.0, -0.1], [-1.0, 0.85, 0.0], [0.25, 0, -0.1]);
    braco(P, 1, [-0.42, 0.0, 0.1], [-1.0, -0.85, 0.0], [0.25, 0, 0.1]);
    respiro(P, t, ch, 0.8);
  },
  'telefone-andando'(P, t, ch, st) {
    if (st.andandoLocal) passos(P, st.fase, ch, 0.8); else emPe(P, t, ch, 0.5);
    braco(P, -1, [-0.25, 0.25, -0.62], [-2.35, 0.7, 0.2], [0.1, 0, 0.35]);
    const g = Math.sin(t * 1.9);
    if (!st.andandoLocal) braco(P, 1, [-0.25 + 0.15 * g, -0.1, 0.3], [-1.0, -0.6, 0], [0.1, 0, -0.2]);
    P.a(B.cabeca, 0.05, -0.05, -0.12); P.boca = 'fala';
  },
  observatorio(P, t, ch) {
    emPe(P, t, ch, 0.6);
    const olhar = (t % 12) < 7;
    P.a(B.pescoco, -0.1, 0, 0).a(B.cabeca, olhar ? -0.35 : 0.2, 0.25 * Math.sin(t * 0.25), 0);
    segurarTablet(P, t);
    if (olhar) braco(P, -1, [-2.3 + 0.15 * Math.sin(t * 0.8), 0.0, -0.25], [-0.25, 0, 0], [0, 0, 0]);
  },
  'quadro-reuniao'(P, t, ch) {
    emPe(P, t, ch, 0.6);
    const c = t % 8; const vira = c > 5.5;
    P.a(B.cintura, 0, vira ? -0.35 : 0, 0).a(B.peito, 0, vira ? -0.3 : 0, 0).a(B.cabeca, 0, vira ? -0.4 : 0.1, 0);
    braco(P, -1, [-1.25 + 0.12 * Math.sin(t * 1.6), 0.0, -0.5 + 0.15 * Math.sin(t * 0.9)], [-0.25, 0.3, 0], [0.1, 0, 0]);
    braco(P, 1, [-0.35, 0.1, 0.2], [-1.2, -0.7, 0], [0, 0, 0]);
    P.boca = vira ? 'fala' : null;
  },
  recepcao(P, t, ch) {
    emPe(P, t, ch, 0.5);
    const c = (t + ch.fase * 3) % 10; const aceno = c > 8;
    segurarTablet(P, t);
    if (aceno) { const w = Math.sin(t * 9); braco(P, -1, [-0.5, 0, -1.9], [-0.6, 0, 0.3 * w], [0, 0, 0.2 * w]); P.sorriso = true; P.a(B.cabeca, 0, 0, 0.12); }
    else braco(P, -1, [-0.55, -0.1, -0.15], [-1.3, 0.8, 0], [0.4 + 0.15 * Math.sin(t * 6), 0, 0]);
    P.a(B.cabeca, 0.12, 0, 0);
  },
  'fotografando-campo'(P, t, ch) {
    emPe(P, t, ch, 0.4);
    const c = t % 9; const mira = c < 6;
    const pan = 0.35 * Math.sin(t * 0.35);
    P.a(B.cintura, 0, pan * 0.5, 0).a(B.peito, 0, pan * 0.5, 0);
    if (mira) {
      braco(P, -1, [-1.2, 0.15, -0.45], [-1.5, 0.9, 0], [0.0, 0, 0.1]);
      braco(P, 1, [-1.15, -0.25, 0.4], [-1.55, -0.8, 0], [0.2, 0, -0.1]);
      P.a(B.cabeca, 0.05, 0, 0.05);
    } else { braco(P, -1, [-0.45, 0, -0.15], [-1.2, 0.6, 0], [0, 0, 0]); P.a(B.cabeca, 0, 0.4 * Math.sin(t), 0); }
  },
  'sala-servidores'(P, t, ch) {
    emPe(P, t, ch, 0.6);
    const c = (t + ch.fase * 4) % 9; const toca = c > 6;
    P.a(B.cabeca, 0.1, 0.45 * Math.sin(t * 0.4 + ch.fase), 0);
    segurarTablet(P, t);
    if (toca) braco(P, -1, [-1.4, 0.2, -0.2], [-0.2, 0, 0], [0.4 * Math.sin(t * 5), 0, 0]);
  },
  'arquivo-cartas'(P, t, ch) {
    emPe(P, t, ch, 0.4);
    const ph = t * 1.4 + ch.fase;
    P.a(B.cintura, 0.1, 0, 0).a(B.cabeca, 0.25, 0.1 * Math.sin(ph), 0);
    braco(P, -1, [-0.85 + 0.25 * Math.sin(ph), 0.2, -0.15], [-0.9 + 0.3 * Math.cos(ph), 0.5, 0], [0.2, 0, 0]);
    braco(P, 1, [-0.75 - 0.2 * Math.sin(ph + 1.5), -0.2, 0.15], [-1.0, -0.6, 0], [0.2, 0, 0]);
  },
  'gestos-holograma'(P, t, ch) {
    emPe(P, t, ch, 0.4);
    const a = Math.sin(t * 1.3 + ch.fase), b = Math.sin(t * 2.1);
    braco(P, -1, [-1.15 + 0.2 * b, 0.0, -0.25 - 0.3 * a], [-0.6 + 0.2 * a, 0.4, 0], [0.3, 0, 0.3 * a]);
    braco(P, 1, [-1.05 - 0.2 * b, 0.0, 0.25 - 0.3 * a], [-0.7 - 0.2 * a, -0.4, 0], [0.3, 0, 0.3 * a]);
    P.a(B.peito, 0, 0.12 * a, 0).a(B.cabeca, -0.05, 0.15 * a, 0);
    P.sorriso = true;
  },
  'caixa-registradora'(P, t, ch) {
    emPe(P, t, ch, 0.4);
    const k = Math.max(0, Math.sin(t * 7 + ch.fase));
    P.a(B.cintura, 0.06, 0, 0).a(B.cabeca, 0.28, 0.08 * Math.sin(t * 0.5), 0);
    braco(P, -1, [-0.7, 0.1, -0.12], [-1.05 - 0.12 * k, 0.4, 0], [0.4 * k, 0, 0]);
    braco(P, 1, [-0.6, 0, 0.14], [-1.2, -0.7, 0], [0.2, 0, 0]);
  },
  esteira(P, t, ch) { passos(P, ch.fasePasso, ch, 1, 1); },
  halteres(P, t, ch) {
    emPe(P, t, ch, 0.3);
    const e = Math.max(0, Math.sin(t * 2.2)), d = Math.max(0, Math.sin(t * 2.2 + Math.PI));
    braco(P, 1, [0.05, 0, 0.14], [-0.15 - 2.0 * e, -0.9, 0], [0.1 - 0.2 * e, 0, 0]);
    braco(P, -1, [0.05, 0, -0.14], [-0.15 - 2.0 * d, 0.9, 0], [0.1 - 0.2 * d, 0, 0]);
    P.a(B.peito, -0.03, 0, 0);
  },
  yoga(P, t, ch) {
    const br = Math.sin(t * 0.9);
    P.hip[0] = 0.035; P.hip[1] = QUADRIL_Y - 0.008; P.hip[2] = 0;
    P.s(B.quadril, 0, 0, 0.04).s(B.cintura, 0, 0, -0.04).s(B.peito, -0.03 - 0.02 * br, 0, 0).s(B.pescoco, 0, 0, 0).s(B.cabeca, -0.06, 0, 0);
    // perna de apoio (esq) reta; direita dobrada com o pé na coxa
    P.s(B.coxaE, 0.0, 0, -0.04).s(B.joelhoE, 0.02, 0, 0).s(B.peE, 0, 0, 0.0);
    P.s(B.coxaD, -0.55, -0.55, -0.95).s(B.joelhoD, 2.25, 0, 0).s(B.peD, 0.4, 0, 0);
    braco(P, 1, [0.0, 0, 2.85 + 0.03 * br], [-0.3, 0, -0.15], [0, 0, 0]);
    braco(P, -1, [0.0, 0, -2.85 - 0.03 * br], [-0.3, 0, 0.15], [0, 0, 0]);
    P.olhos = 'fechado'; P.sorriso = true;
  },
  'caminhando-jardim'(P, t, ch, st) {
    passos(P, st.fase, ch, 0.75);
    braco(P, 1, [0.35, 0, 0.2], [-0.5, 0, 0], [0, 0, 0]);
    braco(P, -1, [0.35, 0, -0.2], [-0.5, 0, 0], [0, 0, 0]);
    P.a(B.cabeca, -0.06, 0.3 * Math.sin(t * 0.35), 0); P.sorriso = true;
  },
  alongando(P, t, ch) {
    emPe(P, t, ch, 0.2);
    const ciclo = Math.floor((t + ch.fase * 5) / 4) % 3, u = ((t + ch.fase * 5) % 4) / 4, k = Math.sin(u * Math.PI);
    if (ciclo === 0) { // braços pra cima, inclina pro lado
      const lado = Math.floor((t + ch.fase * 5) / 12) % 2 ? 1 : -1;
      braco(P, 1, [0, 0, 2.7], [-0.3, 0, 0], [0, 0, 0]); braco(P, -1, [0, 0, -2.7], [-0.3, 0, 0], [0, 0, 0]);
      P.a(B.cintura, 0, 0, 0.18 * k * lado).a(B.peito, 0, 0, 0.18 * k * lado);
      P.olhos = 'fechado';
    } else if (ciclo === 1) { // quadríceps
      P.s(B.coxaD, 0.25 * k, 0, 0.03).s(B.joelhoD, 2.3 * k, 0, 0);
      braco(P, -1, [0.55 * k, 0, -0.15], [-0.2, 0, 0], [0, 0, 0]);
      braco(P, 1, [-0.2, 0, 0.6 + 0.4 * k], [-0.1, 0, 0], [0, 0, 0]);
    } else { // braço cruzado no peito
      braco(P, -1, [-1.45, -0.9 * k, -0.2], [-0.15, 0, 0], [0, 0, 0]);
      braco(P, 1, [-0.9, 0.0, 0.25], [-1.5 * k, -0.4, 0], [0, 0, 0]);
      P.a(B.cabeca, 0, 0.35 * k, 0);
    }
  },
  bicicleta(P, t, ch, st) {
    const s = ch.s;
    const hy = BIKE.selim / s + 0.07, hz = -0.07;
    P.hip[0] = 0; P.hip[1] = hy; P.hip[2] = hz;
    P.s(B.quadril, 0.32, 0, 0).s(B.cintura, 0.12, 0, 0).s(B.peito, 0.05, 0, 0).s(B.pescoco, -0.18, 0, 0).s(B.cabeca, -0.28, 0, 0);
    const ang = st.pedal;
    for (const lado of [1, -1]) {
      const a = ang + (lado > 0 ? 0 : Math.PI);
      const ty = (BIKE.pedalY + Math.cos(a) * BIKE.pedalR) / s + 0.05, tz = (BIKE.pedalZ + Math.sin(a) * BIKE.pedalR) / s - 0.02;
      // o quadril está girado 0,32 pra frente: compensa no alvo (aprox.)
      const [cx, kx] = ikPerna(hy, hz, ty, tz);
      P.s(lado > 0 ? B.coxaE : B.coxaD, cx - 0.32, lado * 0.02, -lado * 0.03).s(lado > 0 ? B.joelhoE : B.joelhoD, kx, 0, 0).s(lado > 0 ? B.peE : B.peD, -(cx + kx) + 0.25 * Math.sin(a), 0, 0);
    }
    braco(P, 1, [-1.05, 0, 0.2], [-0.35, -0.3, 0], [0.3, 0, 0]);
    braco(P, -1, [-1.05, 0, -0.2], [-0.35, 0.3, 0], [0.3, 0, 0]);
  },
  dormindo(P, t, ch) {
    const s = ch.s; const br = Math.sin(t * 1.1 + ch.fase);
    P.corpoRx = -Math.PI / 2; P.corpoY = CAMA.topo + 0.088 * s; P.corpoZ = 0.86 * s;
    P.hip[0] = 0; P.hip[1] = QUADRIL_Y; P.hip[2] = 0;
    P.s(B.quadril, 0, 0, 0).s(B.cintura, 0, 0, 0).s(B.peito, -0.015 * br, 0, 0).s(B.pescoco, 0.05, 0, 0).s(B.cabeca, 0.0, 0.32, 0.05);
    braco(P, 1, [-0.25, 0, 0.12], [-0.9, -0.6, 0], [0, 0, 0]);
    braco(P, -1, [-0.1, 0, -0.18], [-0.2, 0.3, 0], [0, 0, 0]);
    P.s(B.coxaE, -0.12, 0.05, -0.02).s(B.joelhoE, 0.22, 0, 0).s(B.peE, 0.3, -0.1, 0);
    P.s(B.coxaD, -0.02, -0.05, 0.02).s(B.joelhoD, 0.06, 0, 0).s(B.peD, 0.35, 0.1, 0);
    P.olhos = 'fechado'; P.boca = 0; P.caudas = 'deitada';
  },
};

// ------------------------------------------------------------------ Personagem
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3(), _v5 = new THREE.Vector3(), _v6 = new THREE.Vector3(), _v7 = new THREE.Vector3(), _m = new THREE.Matrix4();

class Personagem {
  constructor(ficha, opcoes = {}) {
    if (!THREE) throw new Error('THREE global ausente');
    const R = recursos();
    this.ficha = ficha || {};
    this.slug = String(this.ficha.slug || 'agente');
    this.q = opcoes.qualidade === 'pc' ? 'pc' : 'celular';
    this.F = resolverFicha(this.ficha);
    this.s = this.F.altura;
    this.fase = (this.F.h % 1000) / 1000 * TAU;
    this.fasePasso = 0;

    // hierarquia: group (app) → suave (absorve "teleportes" do app) → mover (deslocamento local) → corpo (escala/postura)
    this.group = new THREE.Group(); this.group.name = `agente:${this.slug}`; this.group.userData.slug = this.slug;
    this.suave = new THREE.Group(); this.group.add(this.suave);
    this.mover = new THREE.Group(); this.suave.add(this.mover);
    this.corpo = new THREE.Group(); this.corpo.scale.setScalar(this.s); this.mover.add(this.corpo);

    const sk = criarEsqueleto(planoCabelo(this.F));
    this.ossos = sk.ossos; this.bind = sk.bind;
    this.geos = new Map(); this.geosC = new Map();
    this.roupa = 'trabalho';
    const geo = this._geo('trabalho');
    this.malha = new THREE.SkinnedMesh(geo, R.corpo);
    this.malha.add(this.ossos[0]);
    this.malha.bind(new THREE.Skeleton(this.ossos));
    this.ossos[B.cabeca].scale.setScalar(1.075);   // cabeça de anime: ~6,5 cabeças de altura
    this.malha.castShadow = true; this.malha.receiveShadow = false; this.malha.name = 'corpo';
    this.contorno = new THREE.SkinnedMesh(this.geosC.get('trabalho'), R.contorno);
    this.contorno.bind(this.malha.skeleton, this.malha.bindMatrix);
    this.contorno.name = 'contorno';
    this.corpo.add(this.malha, this.contorno);

    // rosto
    this.rostoCanvas = document.createElement('canvas'); this.rostoCanvas.width = this.rostoCanvas.height = this.q === 'pc' ? 512 : 256;
    this.rostoCtx = this.rostoCanvas.getContext('2d');
    this.rostoTex = new THREE.CanvasTexture(this.rostoCanvas); this.rostoTex.encoding = THREE.sRGBEncoding; this.rostoTex.anisotropy = 2;
    const mr = new THREE.MeshToonMaterial({ map: this.rostoTex, gradientMap: R.grad, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    mr.onBeforeCompile = patchToon(true); mr.customProgramCacheKey = () => 'campus-rosto-v3';
    this.rosto = new THREE.Mesh(geoRostoCache(this.q), mr); this.rosto.name = 'rosto';
    this.ossos[B.cabeca].add(this.rosto);
    this.estadoRosto = { olhos: 'aberto', boca: 0, sorriso: false }; this.chaveRosto = '';
    this._desenharRosto();

    // âncora pro balão (centro da cabeça)
    this.cabeca = new THREE.Object3D(); this.cabeca.position.set(HC[0], HC[1], HC[2]); this.cabeca.name = 'cabeca';
    this.ossos[B.cabeca].add(this.cabeca);

    // hitbox
    this.hitbox = new THREE.Mesh(R.geoHit, R.hitbox); this.hitbox.userData.slug = this.slug; this.hitbox.name = 'hitbox';
    this.mover.add(this.hitbox);
    // anel de destaque
    const ma = new THREE.MeshBasicMaterial({ map: R.anelTex, color: new THREE.Color(this.F.accentHex).convertSRGBToLinear(), transparent: true, depthWrite: false, opacity: 0.95 });
    this.anel = new THREE.Mesh(R.geoAnel, ma); this.anel.rotation.x = -Math.PI / 2; this.anel.position.y = 0.012; this.anel.visible = false; this.anel.renderOrder = 2;
    this.mover.add(this.anel);
    this.destaque = false; this.matDestaque = null;

    // objetos
    this.props = []; this.propCache = new Map();
    this.acessoriosSoltos = {};
    if (this.F.roupa.acess?.includes('cameraPescoco')) this._acessorioSolto('cameraPescoco', B.peito, mComp(0.0, 1.17 - 1.18, 0.115, 0.15, 0, 0));
    if (this.F.roupa.acess?.includes('fonesPescoco')) this._acessorioSolto('fonesPescoco', B.pescoco, mComp(0, -0.012, 0.0, 0, 0, 0));

    // estado
    this.atividade = 'parada'; this.poseNome = 'parada';
    this.st = { fase: 0, pedal: 0, x: 0, dir: 1, pausa: 0, ang: 0, andandoLocal: false };
    this.P = new Pose(); this.Pq = Array.from({ length: NB }, () => new THREE.Quaternion());
    this.snap = { ativo: false, t: 0, dur: 0.3, q: Array.from({ length: NB }, () => new THREE.Quaternion()), hip: [0, QUADRIL_Y, 0], rx: 0, y: 0, z: 0 };
    this.cur = { rx: 0, y: 0, z: 0 };
    this.caminhoPts = null; this.aoChegar = null; this.rotFinal = null; this.vel = 0;
    this.falando = false; this.bocaT = 0; this.bocaV = 0;
    this.piscarEm = 2 + Math.random() * 3; this.piscando = 0;
    this.olhar = null; this.olharK = 0; this.olharYaw = 0; this.olharPitch = 0;
    this.cabIdle = { yaw: 0, pitch: 0, alvoYaw: 0, alvoPitch: 0, prox: 3 + Math.random() * 4 };
    this.ultPos = new THREE.Vector3(); this.ultRot = 0; this.velMundo = new THREE.Vector3(); this.inicial = true;
    this.mola = { ax: 0, vx: 0, az: 0, vz: 0, bx: 0, bvx: 0, cx: 0, cvx: 0, cz: 0, cvz: 0 };
    this.zzz = null;
    this.t = 0;
    this._aplicarPostura('parada');
    this._poseAgora(0, true);
  }

  // ---------- geometria por roupa (cache)
  _geo(roupa) {
    if (!this.geos.has(roupa)) {
      const g = construirCorpo(this, roupa);
      // contorno: mesma memória de vértices, mas sem os decalques do fim
      const gc = new THREE.BufferGeometry();
      for (const [nome, at] of Object.entries(g.attributes)) gc.setAttribute(nome, at);
      gc.setIndex(g.index); gc.setDrawRange(0, g.userData.nContorno ?? Infinity); gc.boundingSphere = g.boundingSphere;
      this.geos.set(roupa, g); this.geosC.set(roupa, gc);
    }
    return this.geos.get(roupa);
  }
  setRoupa(roupa) {
    const r = roupa === 'academia' || roupa === 'pijama' ? roupa : 'trabalho';
    if (r === this.roupa) return;
    this.roupa = r;
    const g = this._geo(r);
    this.malha.geometry = g; this.contorno.geometry = this.geosC.get(r);
    for (const [nome, o] of Object.entries(this.acessoriosSoltos)) o.visible = r === 'trabalho' && !this._escondeAcessorio(nome);
  }
  _escondeAcessorio(nome) {
    if (nome === 'cameraPescoco') return this.atividade === 'fotografando-campo';
    if (nome === 'fonesPescoco') return this.atividade === 'fones-transcrevendo';
    return false;
  }
  _acessorioSolto(nome, osso, m) {
    const mesh = new THREE.Mesh(geoProp(nome, this.F), recursos().estatico);
    m.decompose(mesh.position, mesh.quaternion, mesh.scale);
    this.ossos[osso].add(mesh); this.acessoriosSoltos[nome] = mesh; mesh.castShadow = false;
  }

  // ---------- rosto
  _desenharRosto() {
    const e = this.estadoRosto; const k = `${e.olhos}|${e.boca}|${e.sorriso ? 1 : 0}`;
    if (k === this.chaveRosto) return;
    this.chaveRosto = k;
    desenharRosto(this.rostoCtx, this.F, e);
    this.rostoTex.needsUpdate = true;
  }

  // ---------- atividade
  setAtividade(nome) {
    const n = ATIVIDADES.includes(nome) ? nome : 'parada';
    const ant = this.atividade;
    this.atividade = n;
    if (this.caminhoPts && n !== 'andando') return; // aplica quando chegar
    if (n === ant && this.poseNome === n) return;
    this._trocarPose(n);
  }
  _trocarPose(n) {
    if (this.poseNome === n) return;
    const pa = POSTURA(this.poseNome), pn = POSTURA(n);
    this._assentarMover();
    this._snapshot(pa === pn ? 0.3 : (pa === 'deitada' || pn === 'deitada') ? 0.9 : 0.5);
    this.poseNome = n;
    this.st.andandoLocal = false; this.st.fase = 0;
    if (pn !== 'pe' && this.olhar) this.olhar = null;
    this._aplicarPostura(n);
  }
  _snapshot(dur) {
    const S = this.snap;
    for (let i = 0; i < NB; i++) S.q[i].copy(this.ossos[i].quaternion);
    const h = this.ossos[B.quadril].position; S.hip[0] = h.x; S.hip[1] = h.y; S.hip[2] = h.z;
    S.rx = this.cur.rx; S.y = this.cur.y; S.z = this.cur.z;
    S.ativo = true; S.t = 0; S.dur = dur;
  }
  _assentarMover() {
    // incorpora no group o deslocamento local (andar no telefone / jardim) pra não "deslizar" de volta
    const m = this.mover;
    if (Math.abs(m.position.x) + Math.abs(m.position.z) + Math.abs(m.rotation.y) < 1e-4) return;
    _v.set(m.position.x, 0, m.position.z).applyAxisAngle(_v2.set(0, 1, 0), this.group.rotation.y + this.suave.rotation.y);
    this.group.position.add(_v);
    this.group.rotation.y += m.rotation.y;
    this.ultPos.add(_v); this.ultRot += m.rotation.y;
    m.position.set(0, 0, 0); m.rotation.y = 0;
  }
  _aplicarPostura(n) {
    const p = POSTURA(n), H = ALTURA_BASE * this.s;
    const hb = this.hitbox; hb.rotation.set(0, 0, 0);
    if (p === 'pe') { hb.position.set(0, H / 2, 0); hb.scale.set(1, (H - 0.3) / 1.56 + 0.0, 1); this.anel.scale.setScalar(0.95); }
    else if (p === 'sentada') { hb.position.set(0, 0.68, 0.12); hb.scale.set(1.05, 0.95, 1.05); this.anel.scale.setScalar(1.15); }
    else if (p === 'bike') { hb.position.set(0, 0.85, 0.12); hb.scale.set(1.05, 1.05, 1.1); this.anel.scale.setScalar(1.35); }
    else { hb.position.set(0, CAMA.topo + 0.12, 0); hb.rotation.x = Math.PI / 2; hb.scale.set(1.05, (H - 0.2) / 1.56, 0.8); this.anel.scale.setScalar(2.0); }
    // objetos de mão
    for (const o of this.props) o.parent?.remove(o);
    this.props.length = 0;
    for (const [nome, osso] of PROPS_ATIV[n] || []) {
      const chave = nome + ':' + osso;
      let o = this.propCache.get(chave);
      if (!o) {
        if (nome === 'holo') {
          const mat = new THREE.MeshBasicMaterial({ map: recursos().holoTex, color: new THREE.Color(this.F.accentHex).convertSRGBToLinear(), transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
          o = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.38), mat); o.position.set(0, 1.28 * this.s, 0.5); o.renderOrder = 3;
        } else {
          o = new THREE.Mesh(geoProp(nome, this.F), recursos().estatico);
          encaixeProp(nome, osso).decompose(o.position, o.quaternion, o.scale);
          if (nome === 'tablet') o.userData.mira = { lado: osso === B.maoE ? -1 : 1 };
        }
        this.propCache.set(chave, o);
      }
      (osso < 0 ? this.mover : this.ossos[osso]).add(o);
      this.props.push(o);
    }
    for (const [nome, o] of Object.entries(this.acessoriosSoltos)) o.visible = this.roupa === 'trabalho' && !this._escondeAcessorioPose(nome, n);
    // zzz
    if (n === 'dormindo') {
      if (!this.zzz) {
        const m = new THREE.SpriteMaterial({ map: recursos().zzzTex, transparent: true, depthWrite: false });
        this.zzz = new THREE.Sprite(m); this.zzz.scale.set(0.42, 0.42, 1); this.zzz.renderOrder = 4;
      }
      this.mover.add(this.zzz);
    } else if (this.zzz) this.mover.remove(this.zzz);
  }
  _escondeAcessorioPose(nome, n) {
    if (nome === 'cameraPescoco') return n === 'fotografando-campo';
    if (nome === 'fonesPescoco') return n === 'fones-transcrevendo';
    return false;
  }

  // ---------- andar
  andarPara(pontos, aoChegar, rotFinal) {
    const pts = (Array.isArray(pontos) ? pontos : []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.z)).map((p) => new THREE.Vector3(p.x, Number.isFinite(p.y) ? p.y : 0, p.z));
    this._assentarMover();
    this.olhar = null;
    this.caminhoPts = pts; this.iCaminho = 0; this.aoChegar = typeof aoChegar === 'function' ? aoChegar : null;
    this.rotFinal = Number.isFinite(rotFinal) ? rotFinal : null;
    if (!pts.length) { this._chegar(); return; }
    this._trocarPose('andando');
  }
  _chegar() {
    this.caminhoPts = null; this.vel = 0;
    const cb = this.aoChegar; this.aoChegar = null;
    const prox = this.atividade === 'andando' ? 'parada' : this.atividade;
    this.atividade = prox;
    this._trocarPose(prox);
    if (this.rotFinal !== null) { this.virarAlvo = this.rotFinal; this.rotFinal = null; }
    if (cb) { try { cb(); } catch (e) { console.error('[personagem] aoChegar', e); } }
  }
  virarPara(rotY) { if (Number.isFinite(rotY)) this.virarAlvo = rotY; }

  olharPara(ponto) {
    if (!ponto || !Number.isFinite(ponto.x)) { this.olhar = null; return; }
    this.olhar = (this.olhar || new THREE.Vector3()).set(ponto.x, Number.isFinite(ponto.y) ? ponto.y : 0, ponto.z);
    // de pé: vira o corpo de leve na direção (o app espera que ela fique de frente)
    if (POSTURA(this.poseNome) === 'pe' && !this.caminhoPts) {
      const gp = this.group.getWorldPosition(_v);
      const yaw = Math.atan2(ponto.x - gp.x, ponto.z - gp.z);
      this.virarAlvo = yaw;
    }
  }
  setFalando(b) { this.falando = !!b; }
  setDestaque(b) {
    this.destaque = !!b; this.anel.visible = this.destaque;
    if (this.destaque) {
      if (!this.matDestaque) {
        this.matDestaque = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.F.accentHex).convertSRGBToLinear(), side: THREE.BackSide });
        this.matDestaque.onBeforeCompile = patchContorno({ value: 0.0072 });
        this.matDestaque.customProgramCacheKey = () => 'campus-contorno-v3';
      }
      this.contorno.material = this.matDestaque;
    } else this.contorno.material = recursos().contorno;
  }

  // ---------- quadro a quadro
  update(dt, t) {
    dt = clamp(Number.isFinite(dt) ? dt : 0.016, 0, 0.1);
    this.t = Number.isFinite(t) ? t : this.t + dt;
    this._absorverSaltos(dt);
    this._locomocao(dt);
    this._poseAgora(dt, false);
    this._mirarProps();
    this._rosto(dt);
    if (this.destaque) this.anel.material.opacity = 0.75 + 0.2 * Math.sin(this.t * 4);
    if (this.zzz && this.zzz.parent) {
      const u = (this.t * 0.35) % 1;
      this.zzz.position.set(0.18, CAMA.topo + 0.35 + u * 0.35, -0.7 * this.s);
      this.zzz.material.opacity = Math.sin(u * Math.PI) * 0.95;
    }
  }

  _absorverSaltos(dt) {
    const g = this.group;
    if (this.inicial) { this.ultPos.copy(g.position); this.ultRot = g.rotation.y; this.inicial = false; }
    // rotação mudada de fora (ex.: app encaixa rotY no posto): gira visualmente de forma suave
    const dR = anguloCurto(this.ultRot, g.rotation.y);
    if (Math.abs(dR) > 1e-4 && !this._girandoEu) this.suave.rotation.y -= dR;
    this._girandoEu = false;
    // posição teleportada de fora (até 1,2 m): desliza
    _v.copy(g.position).sub(this.ultPos);
    const salto = _v.length();
    if (salto > 0.004 && !this._movendoEu && salto < 1.2) {
      _v.applyAxisAngle(_v2.set(0, 1, 0), -g.rotation.y);
      this.suave.position.sub(_v);
    }
    this.velMundo.copy(g.position).sub(this.ultPos).divideScalar(Math.max(dt, 1e-3));
    if (salto >= 1.2) this.velMundo.set(0, 0, 0);
    this._movendoEu = false;
    // amortece o "suave"
    const k = 1 - Math.exp(-dt / 0.14);
    this.suave.position.multiplyScalar(1 - k);
    if (this.suave.position.lengthSq() < 1e-8) this.suave.position.set(0, 0, 0);
    this.suave.rotation.y *= 1 - (1 - Math.exp(-dt / 0.16));
    this.ultPos.copy(g.position); this.ultRot = g.rotation.y;
  }
  _girar(alvo, taxa, dt) {
    const g = this.group; const d = anguloCurto(g.rotation.y, alvo);
    const passo = clamp(d, -taxa * dt, taxa * dt);
    g.rotation.y += passo; this._girandoEu = true; this.ultRot = g.rotation.y;
    return Math.abs(d - passo);
  }
  _locomocao(dt) {
    const g = this.group;
    if (this.caminhoPts) {
      let alvo = this.caminhoPts[this.iCaminho];
      while (alvo) {
        const dx = alvo.x - g.position.x, dz = alvo.z - g.position.z;
        if (Math.hypot(dx, dz) > 0.06) break;
        this.iCaminho++; alvo = this.caminhoPts[this.iCaminho];
      }
      if (!alvo) { this._chegar(); return; }
      const dx = alvo.x - g.position.x, dz = alvo.z - g.position.z; const dist = Math.hypot(dx, dz);
      const yaw = Math.atan2(dx, dz);
      const resto = this._girar(yaw, 7, dt);
      const vAlvo = 1.3 * (resto < 0.6 ? 1 : Math.max(0.25, 1 - (resto - 0.6)));
      this.vel = lerp(this.vel, vAlvo, 1 - Math.exp(-dt / 0.25));
      const passo = Math.min(dist, this.vel * dt);
      g.position.x += (dx / dist) * passo; g.position.z += (dz / dist) * passo;
      g.position.y = lerp(g.position.y, alvo.y, clamp(passo / Math.max(dist, 1e-3), 0, 1));
      this._movendoEu = true; this.ultPos.copy(g.position);
      this.fasePasso += (this.vel / 1.3) * TAU * dt;
      return;
    }
    if (this.virarAlvo !== undefined && this.virarAlvo !== null) {
      const resto = this._girar(this.virarAlvo, 3.2, dt);
      if (resto < 0.01) this.virarAlvo = null;
    }
    const st = this.st; const n = this.poseNome;
    if (n === 'esteira') this.fasePasso += 1.45 * TAU * dt;
    else if (n === 'andando') this.fasePasso += TAU * dt;
    if (n === 'bicicleta') st.pedal += 1.15 * TAU * dt;
    if (n === 'telefone-andando') {
      // vai e volta ±0,6 m no X local, com pausas e meia-volta
      if (st.pausa > 0) {
        st.pausa -= dt; st.andandoLocal = false;
        const alvoR = st.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        this.mover.rotation.y += anguloCurto(this.mover.rotation.y, alvoR) * (1 - Math.exp(-dt / 0.2));
      } else {
        st.andandoLocal = true;
        st.x += st.dir * 0.7 * dt; st.fase += (0.7 / 1.1) * TAU * dt;
        const alvoR = st.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        this.mover.rotation.y += anguloCurto(this.mover.rotation.y, alvoR) * (1 - Math.exp(-dt / 0.12));
        if (Math.abs(st.x) > 0.6) { st.x = Math.sign(st.x) * 0.6; st.dir *= -1; st.pausa = 1.2 + Math.random() * 1.5; }
      }
      this.mover.position.x = st.x;
    } else if (n === 'caminhando-jardim') {
      const Rr = 0.95; st.ang += (0.55 / Rr) * dt; st.fase += (0.55 / 1.0) * TAU * dt; st.andandoLocal = true;
      this.mover.position.set(Rr * Math.sin(st.ang), 0, Rr * (1 - Math.cos(st.ang)));
      this.mover.rotation.y = Math.PI / 2 - st.ang;
    }
  }

  _poseAgora(dt, forcar) {
    const P = this.P.zerar();
    const nome = this.poseNome;
    const fn = POSES[nome] || POSES.parada;
    fn(P, this.t, this, this.st);
    // camadas: olhar, cabeça ociosa
    const postura = POSTURA(nome);
    this._camadaOlhar(P, dt, postura);
    // mistura com a foto da pose anterior
    const S = this.snap; let w = 1;
    if (S.ativo) { S.t += dt; w = ss(0, 1, S.t / S.dur); if (S.t >= S.dur) S.ativo = false; }
    const o = this.ossos;
    for (let i = 0; i < NB; i++) {
      if (i >= B.a1) continue; // caudas: física própria
      _e.set(P.r[i * 3], P.r[i * 3 + 1], P.r[i * 3 + 2]);
      _q.setFromEuler(_e);
      if (S.ativo && w < 1) o[i].quaternion.copy(S.q[i]).slerp(_q, w); else o[i].quaternion.copy(_q);
    }
    const h = o[B.quadril].position;
    if (S.ativo && w < 1) h.set(lerp(S.hip[0], P.hip[0], w), lerp(S.hip[1], P.hip[1], w), lerp(S.hip[2], P.hip[2], w));
    else h.set(P.hip[0], P.hip[1], P.hip[2]);
    const rx = S.ativo && w < 1 ? lerp(S.rx, P.corpoRx, w) : P.corpoRx;
    const cy = S.ativo && w < 1 ? lerp(S.y, P.corpoY, w) : P.corpoY;
    const cz = S.ativo && w < 1 ? lerp(S.z, P.corpoZ, w) : P.corpoZ;
    this.cur.rx = rx; this.cur.y = cy; this.cur.z = cz;
    this.corpo.rotation.x = rx; this.corpo.position.set(0, cy, cz);
    this._caudas(P, dt, forcar);
    // rosto pedido pela pose
    this.poseRosto = { olhos: P.olhos, boca: P.boca, sorriso: P.sorriso };
  }

  // tablet: segura pela borda de baixo, com a tela virada pro rosto (qualquer que seja a pose do braço)
  _mirarProps() {
    for (const o of this.props) {
      const mi = o.userData.mira; if (!mi || !o.parent) continue;
      const mao = o.parent;
      this.corpo.updateMatrixWorld(true);
      _m.copy(mao.matrixWorld); _m.decompose(_v3, _q, _v4);
      const pega = _v.set(mi.lado * 0.035, -0.075, 0.02).applyMatrix4(mao.matrixWorld);   // ponto entre os dedos
      const rosto = this.cabeca.getWorldPosition(_v2);
      const ny = _v5.copy(rosto).sub(pega).normalize();                 // normal da tela → rosto
      const nx = _v6.set(0, 1, 0).cross(ny); if (nx.lengthSq() < 1e-6) nx.set(1, 0, 0); nx.normalize();
      const nz = _v7.copy(nx).cross(ny).normalize(); if (nz.y < 0) { nz.negate(); nx.negate(); }
      _m.makeBasis(nx, ny, nz);
      _q2.setFromRotationMatrix(_m);
      // centro = pega + metade da altura do tablet na direção "pra cima" da tela
      const centro = _v3.copy(pega).addScaledVector(nz, 0.062 * _v4.x);
      mao.worldToLocal(o.position.copy(centro));
      o.quaternion.copy(_q).invert().multiply(_q2);
    }
  }

  _camadaOlhar(P, dt, postura) {
    // cabeça ociosa: de vez em quando olha pros lados
    const ci = this.cabIdle;
    ci.prox -= dt;
    if (ci.prox <= 0) {
      const calmo = postura === 'deitada';
      ci.alvoYaw = calmo ? 0 : (Math.random() - 0.5) * 0.8; ci.alvoPitch = calmo ? 0 : (Math.random() - 0.5) * 0.18;
      if (Math.random() < 0.35) { ci.alvoYaw = 0; ci.alvoPitch = 0; }
      ci.prox = 3 + Math.random() * 6;
    }
    const k = 1 - Math.exp(-dt / 0.45);
    ci.yaw += (ci.alvoYaw - ci.yaw) * k; ci.pitch += (ci.alvoPitch - ci.pitch) * k;
    const idleK = ['parada', 'andando', 'cafe', 'caminhando-jardim', 'halteres', 'esteira', 'alongando', 'lendo-banco'].includes(this.poseNome) ? 1 : 0.25;
    // olhar pra um ponto
    let ty = 0, tp = 0, want = 0;
    if (this.olhar && postura !== 'deitada') {
      const peito = this.ossos[B.peito];
      peito.updateWorldMatrix(true, false);
      _v.copy(this.olhar); peito.worldToLocal(_v);
      ty = clamp(Math.atan2(_v.x, _v.z), -1.1, 1.1);
      tp = clamp(-Math.atan2(_v.y - 0.35, Math.hypot(_v.x, _v.z)), -0.35, 0.45);
      want = 1;
    }
    this.olharK += (want - this.olharK) * (1 - Math.exp(-dt / 0.25));
    this.olharYaw += (ty - this.olharYaw) * (1 - Math.exp(-dt / 0.2));
    this.olharPitch += (tp - this.olharPitch) * (1 - Math.exp(-dt / 0.2));
    const yaw = this.olharYaw * this.olharK + ci.yaw * idleK * (1 - this.olharK);
    const pit = this.olharPitch * this.olharK + ci.pitch * idleK * (1 - this.olharK);
    P.a(B.pescoco, pit * 0.4, yaw * 0.4, 0);
    P.a(B.cabeca, pit * 0.6, yaw * 0.6, 0);
  }

  _caudas(P, dt, forcar) {
    const o = this.ossos; const m = this.mola;
    if (dt <= 0 && !forcar) return;
    // aceleração/velocidade no referencial da personagem
    const yaw = this.group.rotation.y + this.suave.rotation.y + this.mover.rotation.y;
    const cs = Math.cos(-yaw), sn = Math.sin(-yaw);
    let vx = this.velMundo.x, vz = this.velMundo.z;
    if (this.st.andandoLocal) { vz += this.poseNome === 'caminhando-jardim' ? 0.55 : 0.7; }
    const fwd = vx * sn + vz * cs, lat = vx * cs - vz * sn;
    const andando = this.caminhoPts || this.st.andandoLocal || this.poseNome === 'esteira' || this.poseNome === 'andando';
    const fase = this.st.andandoLocal ? this.st.fase : this.fasePasso;
    const corre = this.poseNome === 'esteira' ? 1.4 : 1;
    // inclinação total da cabeça (pra cauda pender pra baixo)
    let pitch = 0, roll = 0;
    for (const i of [B.quadril, B.cintura, B.peito, B.pescoco, B.cabeca]) { pitch += P.r[i * 3]; roll += P.r[i * 3 + 2]; }
    const deitada = P.caudas === 'deitada' || Math.abs(this.cur.rx) > 0.5;
    let alvoX = clamp(fwd * 0.22, -0.2, 0.45) + (andando ? 0.05 * Math.sin(2 * fase) * corre : 0.015 * Math.sin(this.t * 1.3 + this.fase));
    let alvoZ = clamp(-lat * 0.25, -0.4, 0.4) + (andando ? 0.07 * Math.sin(fase) * corre : 0.02 * Math.sin(this.t * 0.9 + this.fase));
    const k = 38, d = 6.5; const h = Math.min(dt, 1 / 30);
    m.vx += (-(m.ax - alvoX) * k - m.vx * d) * h; m.ax += m.vx * h;
    m.vz += (-(m.az - alvoZ) * k - m.vz * d) * h; m.az += m.vz * h;
    m.bvx += (-(m.bx - m.ax) * 22 - m.bvx * 5) * h; m.bx += m.bvx * h;
    if (forcar) { m.ax = alvoX; m.az = alvoZ; m.bx = m.ax; }
    const est = this.F.estilo;
    const set = (i, x, y, z) => { _e.set(x, y, z); o[i].quaternion.setFromEuler(_e); };
    if (deitada) {
      if (est === 'rabo-de-cavalo') { set(B.a1, -0.2, 0, 1.25); set(B.a2, -0.3, 0, 0.2); set(B.a3, -0.2, 0, 0.1); }
      else { set(B.a1, -0.55, 0, 0.35); set(B.a2, -0.3, 0, 0.1); set(B.a3, -0.1, 0, 0); set(B.b1, -0.55, 0, -0.35); set(B.b2, -0.3, 0, -0.1); set(B.b3, -0.1, 0, 0); }
      o[B.costas].quaternion.set(0, 0, 0, 1);
      return;
    }
    const gx = -pitch * 0.85, gz = -roll * 0.85;
    set(B.a1, gx + m.ax, 0, gz + m.az); set(B.a2, m.bx * 0.6, 0, m.az * 0.4); set(B.a3, m.bx * 0.4, 0, m.az * 0.3);
    set(B.b1, gx + m.ax, 0, gz + m.az); set(B.b2, m.bx * 0.6, 0, m.az * 0.4); set(B.b3, m.bx * 0.4, 0, m.az * 0.3);
    // cabelo comprido: osso das costas balança pouco e compensa a inclinação do peito
    let pp = 0; for (const i of [B.quadril, B.cintura, B.peito]) pp += P.r[i * 3];
    set(B.costas, -pp * 0.6 + m.ax * 0.35, 0, m.az * 0.25);
  }

  _rosto(dt) {
    const e = this.estadoRosto; const pr = this.poseRosto || {};
    // piscar
    this.piscarEm -= dt;
    if (this.piscarEm <= 0) { this.piscando = 0.13; this.piscarEm = 3 + Math.random() * 3 + (Math.random() < 0.15 ? -2.7 : 0); }
    if (this.piscando > 0) this.piscando -= dt;
    let olhos = pr.olhos || 'aberto';
    if (olhos === 'aberto' && this.piscando > 0) olhos = 'fechado';
    // boca
    let boca = pr.boca === 'sorriso' ? 2 : 0;
    const fala = this.falando || pr.boca === 'fala';
    if (fala) {
      this.bocaT -= dt;
      if (this.bocaT <= 0) { this.bocaV = [0, 1, 2, 1, 2, 0][Math.floor(Math.random() * 6)]; this.bocaT = 0.07 + Math.random() * 0.1; }
      boca = this.bocaV;
    }
    e.olhos = olhos; e.boca = boca; e.sorriso = !!pr.sorriso || boca === 2;
    this._desenharRosto();
  }

  // ---------- utilidades
  estatisticas() {
    let malhas = 0, tris = 0;
    this.group.traverseVisible((o) => {
      if (!o.isMesh && !o.isSprite) return;
      malhas++;
      if (o.isSprite) { tris += 2; return; }
      const g = o.geometry; tris += Math.min(g.index ? g.index.count : g.attributes.position.count, g.drawRange.count) / 3;
    });
    return { malhas, triangulos: Math.round(tris) };
  }
  dispose() {
    this.group.parent?.remove(this.group);
    for (const g of this.geos.values()) g.dispose();
    for (const g of this.geosC.values()) g.dispose();
    this.geos.clear(); this.geosC.clear();
    this.rostoTex.dispose(); this.rosto.material.dispose();
    this.anel.material.dispose();
    this.matDestaque?.dispose();
    this.zzz?.material.dispose();
    for (const o of this.propCache.values()) if (o.material && o.material !== recursos().estatico) { o.material.dispose(); o.geometry.dispose(); }
    this.malha.skeleton?.dispose?.();
  }
}

let _geoRosto = {};
function geoRostoCache(q) { return _geoRosto[q] || (_geoRosto[q] = geoRosto(q)); }

export function criarPersonagem(ficha, opcoes = {}) {
  const p = new Personagem(ficha, opcoes);
  return p;
}

// pra testes/dev
export const _interno = { B, POSES, ROUPAS, resolverFicha, POSTURA, BIKE, ASSENTO, MESA, MESA_BORDA, CAMA };
