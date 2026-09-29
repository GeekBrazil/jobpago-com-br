/* Cenário 3D de fundo da JobPago: a BR-101 beira-mar ao entardecer.
   Tudo procedural (Three.js), no padrão do Kage do Creative Lab: câmera presa
   à rolagem, névoa, luz quente e bloom leve. A rolagem leva a câmera pela
   estrada; a tarde vira noite; no fim ela desacelera e enquadra o ponto de
   apoio (conveniência + motorhome com toldo e varal de luz).
   ILUSTRAÇÃO — não é um lugar real nem um Refúgio verificado. */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export interface OpcoesCenario {
  /** celular / aparelho modesto: menos geometria, sem bloom, 30 fps */
  leve: boolean;
  /** prefers-reduced-motion: sem ondas nem suavização, só redesenha na rolagem */
  reduzido: boolean;
  /** 0..1 da rolagem da página */
  progresso: () => number;
  /** chamado no primeiro quadro desenhado */
  pronto?: () => void;
}

/* ───────────── geografia ───────────── */
const COMPRIMENTO = 900; // metros de estrada
const ALT_ESTRADA = 1.8;
const MEIA_PISTA = 3.6;
const Z_POSTO = -COMPRIMENTO + 40;

const estradaX = (z: number) => 22 * Math.sin(z * 0.006) + 10 * Math.sin(z * 0.017 + 1);
const costa = (z: number) => 26 + 10 * Math.sin(z * 0.011 + 0.5) + 5 * Math.sin(z * 0.031);
const POSTO = new THREE.Vector3(estradaX(Z_POSTO) - 20, ALT_ESTRADA, Z_POSTO);

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function ruido(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < 5; i++) { s += a * ruido(x * f, y * f); f *= 2.03; a *= 0.5; }
  return s;
}
const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** altura do terreno: mar a leste (+x), serra a oeste (-x) */
function altura(x: number, z: number) {
  const d = x - estradaX(z);
  let h: number;
  if (d >= 0) {
    const c = costa(z);
    if (d < MEIA_PISTA + 3) h = ALT_ESTRADA;
    else if (d < c) {
      const t = (d - MEIA_PISTA - 3) / (c - MEIA_PISTA - 3);
      h = ALT_ESTRADA - 0.9 * suave(0, 0.15, t) - 1.3 * t + 0.25 * ruido(x * 0.15, z * 0.15) * (1 - t);
    } else h = -0.4 - (d - c) * 0.12;
  } else {
    const dd = -d - MEIA_PISTA - 4;
    if (dd < 0) h = ALT_ESTRADA;
    else {
      const serra = 18 + 95 * fbm(x * 0.005 + 3, z * 0.005) + dd * 0.12;
      h = ALT_ESTRADA + serra * suave(0, 70, dd) + 1.2 * ruido(x * 0.08, z * 0.08) * suave(0, 10, dd);
    }
  }
  // pátio plano do posto
  const r = Math.hypot(x - POSTO.x, z - POSTO.z);
  const k = 1 - suave(26, 48, r);
  return h * (1 - k) + ALT_ESTRADA * k;
}

/* ───────────── texturas desenhadas ───────────── */
function texturaAsfalto() {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2a2b2f"; g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 1400; i++) {
    const v = 30 + Math.random() * 30;
    g.fillStyle = `rgb(${v},${v},${v + 3})`;
    g.fillRect(Math.random() * 128, Math.random() * 256, 1, 1);
  }
  g.fillStyle = "#e8e6df"; // bordas brancas
  g.fillRect(5, 0, 3, 256); g.fillRect(120, 0, 3, 256);
  g.fillStyle = "#e0a526"; // eixo amarelo tracejado (padrão de rodovia brasileira)
  g.fillRect(62, 0, 4, 150);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturaLetreiro(linhas: { texto: string; tam: number; cor: string }[], fundo: string, w = 512, h = 128) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = fundo; g.fillRect(0, 0, w, h);
  let y = h / 2 - ((linhas.length - 1) * linhas[0].tam * 0.6);
  for (const l of linhas) {
    g.font = `800 ${l.tam}px system-ui, sans-serif`;
    g.fillStyle = l.cor; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(l.texto, w / 2, y);
    y += l.tam * 1.2;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturaToldo() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const g = c.getContext("2d")!;
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f3efe4" : "#d9772b"; g.fillRect(i * 32, 0, 32, 64); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* luz "HDR" para o bloom pegar */
const brilho = (hex: number, forca: number) => new THREE.Color(hex).multiplyScalar(forca);

/* ───────────── cenário ───────────── */
export function iniciarCenario(canvas: HTMLCanvasElement, op: OpcoesCenario) {
  const { leve, reduzido } = op;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: leve, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, leve ? 1 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const cena = new THREE.Scene();
  const neblina = new THREE.FogExp2(0xe8a270, 0.0028);
  cena.fog = neblina;
  const camera = new THREE.PerspectiveCamera(50, 1, 0.3, 3000);

  /* céu: gradiente que vai da tarde dourada à noite, com o sol baixo sobre o mar */
  const sol = new THREE.Vector3(0.82, 0.06, -0.57).normalize();
  const ceuMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uNoite: { value: 0 }, uSol: { value: sol } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uNoite; uniform vec3 uSol; varying vec3 vDir;
      void main(){
        float h = clamp(vDir.y, -0.1, 1.0);
        vec3 topoT = vec3(0.12,0.28,0.6), horT = vec3(1.25,0.62,0.3);
        vec3 topoN = vec3(0.02,0.03,0.09), horN = vec3(0.55,0.22,0.24);
        vec3 topo = mix(topoT, topoN, uNoite), hor = mix(horT, horN, uNoite);
        vec3 c = mix(hor, topo, pow(max(h,0.0), 0.55));
        float s = max(dot(normalize(vDir), uSol), 0.0);
        c += vec3(1.2,0.55,0.22) * (pow(s, 8.0) * 0.8 + pow(s, 600.0) * 6.0) * (1.0 - uNoite * 0.85);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), ceuMat);
  cena.add(ceu);

  /* estrelas que aparecem com a noite */
  const nEstrelas = leve ? 400 : 900;
  const pe = new Float32Array(nEstrelas * 3);
  for (let i = 0; i < nEstrelas; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.acos(0.15 + Math.random() * 0.85);
    pe.set([Math.sin(ph) * Math.cos(th) * 1400, Math.cos(ph) * 1400, Math.sin(ph) * Math.sin(th) * 1400], i * 3);
  }
  const estrelasGeo = new THREE.BufferGeometry();
  estrelasGeo.setAttribute("position", new THREE.BufferAttribute(pe, 3));
  const estrelasMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  cena.add(new THREE.Points(estrelasGeo, estrelasMat));

  /* luzes */
  const hemi = new THREE.HemisphereLight(0xffc9a0, 0x1c2a22, 1.1);
  cena.add(hemi);
  const luzSol = new THREE.DirectionalLight(0xffa15c, 2.2);
  luzSol.position.copy(sol).multiplyScalar(500);
  cena.add(luzSol);

  /* terreno com cor por vértice: areia, mata atlântica, leito da estrada */
  const W = 900, L = 1500, segX = leve ? 110 : 200, segZ = leve ? 180 : 320;
  const terGeo = new THREE.PlaneGeometry(W, L, segX, segZ);
  terGeo.rotateX(-Math.PI / 2);
  terGeo.translate(-170, 0, -COMPRIMENTO / 2);
  const pos = terGeo.attributes.position as THREE.BufferAttribute;
  const cores = new Float32Array(pos.count * 3);
  const areia = new THREE.Color(0xd8bd8c), areiaMolhada = new THREE.Color(0x9c8260), mata = new THREE.Color(0x2e5a2f),
    mataEsc = new THREE.Color(0x173522), leito = new THREE.Color(0x5b5448), tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = altura(x, z);
    pos.setY(i, h);
    const d = x - estradaX(z);
    if (Math.abs(d) < MEIA_PISTA + 1.5 || Math.hypot(x - POSTO.x, z - POSTO.z) < 22) tmp.copy(leito);
    else if (d > 0) tmp.copy(areia).lerp(areiaMolhada, suave(costa(z) - 6, costa(z) + 1, d));
    else tmp.copy(mata).lerp(mataEsc, suave(4, 60, h) * 0.8 + ruido(x * 0.05, z * 0.05) * 0.2);
    cores.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  terGeo.setAttribute("color", new THREE.BufferAttribute(cores, 3));
  terGeo.computeVertexNormals();
  cena.add(new THREE.Mesh(terGeo, new THREE.MeshLambertMaterial({ vertexColors: true })));

  /* mar: ondas no vértice e reflexo do céu/sol no fragmento */
  const marMat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTempo: { value: 0 }, uNoite: { value: 0 }, uSol: { value: sol },
    }]),
    vertexShader: `
      uniform float uTempo; varying vec3 vMundo;
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position;
        p.y += sin(p.x*0.06 + uTempo*0.9)*0.18 + sin(p.z*0.05 - uTempo*0.7)*0.14;
        vec4 mvPosition = modelViewMatrix * vec4(p,1.0);
        vMundo = (modelMatrix * vec4(p,1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform float uTempo; uniform float uNoite; uniform vec3 uSol; varying vec3 vMundo;
      #include <fog_pars_fragment>
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      void main(){
        vec2 q = vMundo.xz;
        vec3 n = normalize(vec3(
          sin(q.x*0.23 + uTempo*1.3)*0.08 + sin(q.x*0.9 + q.y*0.4 + uTempo*2.1)*0.04,
          1.0,
          cos(q.y*0.19 - uTempo*1.1)*0.08 + cos(q.y*0.8 - q.x*0.3 + uTempo*1.7)*0.04));
        vec3 v = normalize(cameraPosition - vMundo);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
        vec3 fundo = mix(vec3(0.03,0.2,0.24), vec3(0.01,0.04,0.08), uNoite);
        vec3 ceu = mix(vec3(0.95,0.6,0.42), vec3(0.3,0.14,0.2), uNoite);
        vec3 c = mix(fundo, ceu, 0.25 + 0.6*fres);
        vec3 r = reflect(-v, n);
        float s = pow(max(dot(r, uSol), 0.0), 180.0);
        c += vec3(1.3,0.75,0.4) * s * (2.5 + 2.5*step(0.985, h(floor(q*3.0)+floor(uTempo*4.0)))) * (1.0 - uNoite*0.8);
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`,
  });
  const mar = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600, leve ? 60 : 120, leve ? 60 : 120).rotateX(-Math.PI / 2), marMat);
  mar.position.set(500, -0.05, -COMPRIMENTO / 2);
  cena.add(mar);

  /* espuma na beira */
  const nEsp = 360, espPos: number[] = [], espUv: number[] = [], espIdx: number[] = [];
  for (let i = 0; i <= nEsp; i++) {
    const z = 60 - (i / nEsp) * (COMPRIMENTO + 160);
    const x = estradaX(z) + costa(z);
    espPos.push(x - 2.5, 0.06, z, x + 3, 0.06, z);
    espUv.push(0, z, 1, z);
    if (i < nEsp) { const a = i * 2; espIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const espGeo = new THREE.BufferGeometry();
  espGeo.setAttribute("position", new THREE.Float32BufferAttribute(espPos, 3));
  espGeo.setAttribute("uv", new THREE.Float32BufferAttribute(espUv, 2));
  espGeo.setIndex(espIdx);
  const espMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTempo: { value: 0 }, uNoite: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTempo; uniform float uNoite; varying vec2 vUv;
      void main(){
        float onda = 0.5 + 0.5*sin(vUv.y*0.35 + uTempo*1.4);
        float a = smoothstep(0.0, 0.35, vUv.x) * (1.0 - smoothstep(0.35 + onda*0.4, 1.0, vUv.x));
        gl_FragColor = vec4(vec3(1.0,0.97,0.92) * (1.0 - uNoite*0.6), a * 0.55);
      }`,
  });
  cena.add(new THREE.Mesh(espGeo, espMat));

  /* estrada: fita ao longo da curva */
  const pontos: THREE.Vector3[] = [];
  for (let z = 60; z >= -COMPRIMENTO - 60; z -= 3) pontos.push(new THREE.Vector3(estradaX(z), ALT_ESTRADA + 0.12, z));
  const curva = new THREE.CatmullRomCurve3(pontos);
  const nSeg = pontos.length * 2;
  const rp: number[] = [], ruv: number[] = [], ri: number[] = [];
  const lado = new THREE.Vector3(), tan = new THREE.Vector3(), cima = new THREE.Vector3(0, 1, 0);
  const comp = curva.getLength();
  for (let i = 0; i <= nSeg; i++) {
    const u = i / nSeg, p = curva.getPointAt(u);
    curva.getTangentAt(u, tan);
    lado.crossVectors(tan, cima).normalize().multiplyScalar(MEIA_PISTA);
    rp.push(p.x - lado.x, p.y, p.z - lado.z, p.x + lado.x, p.y, p.z + lado.z);
    ruv.push(0, (u * comp) / 9, 1, (u * comp) / 9);
    if (i < nSeg) { const a = i * 2; ri.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const estradaGeo = new THREE.BufferGeometry();
  estradaGeo.setAttribute("position", new THREE.Float32BufferAttribute(rp, 3));
  estradaGeo.setAttribute("uv", new THREE.Float32BufferAttribute(ruv, 2));
  estradaGeo.setIndex(ri);
  estradaGeo.computeVertexNormals();
  const asfalto = texturaAsfalto();
  asfalto.anisotropy = renderer.capabilities.getMaxAnisotropy();
  cena.add(new THREE.Mesh(estradaGeo, new THREE.MeshLambertMaterial({ map: asfalto, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 })));

  /* coqueiro: tronco curvo + folhas caídas, uma geometria só, instanciada */
  function geoCoqueiro() {
    const partes: THREE.BufferGeometry[] = [];
    const tronco = new THREE.CylinderGeometry(0.16, 0.26, 9, 6, 10, true);
    tronco.translate(0, 4.5, 0);
    const tp = tronco.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < tp.count; i++) { const y = tp.getY(i); tp.setX(i, tp.getX(i) + 0.022 * y * y); }
    pintar(tronco, 0x6e5a44);
    partes.push(tronco);
    for (let f = 0; f < 9; f++) {
      const folha = new THREE.PlaneGeometry(0.9, 4.2, 1, 6);
      const fp = folha.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < fp.count; i++) {
        const y = fp.getY(i) + 2.1; // 0..4.2 ao longo da folha
        const larg = Math.sin((y / 4.2) * Math.PI) * 1.0;
        fp.setX(i, fp.getX(i) * larg);
        fp.setY(i, y);
        fp.setZ(i, -0.09 * y * y); // cai para baixo
      }
      folha.rotateX(-Math.PI / 2 + 0.35);
      folha.rotateY((f / 9) * Math.PI * 2 + (f % 2) * 0.2);
      folha.translate(0.022 * 81, 9, 0);
      pintar(folha, f % 3 ? 0x3f7a32 : 0x57893a);
      partes.push(folha);
    }
    return mergeGeometries(partes.map((g) => g.toNonIndexed()));
  }
  function pintar(g: THREE.BufferGeometry, hex: number) {
    const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(a, 3));
    g.deleteAttribute("uv");
    g.deleteAttribute("normal");
    g.computeVertexNormals();
  }
  const coqGeo = geoCoqueiro();
  const vegMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const locais: THREE.Matrix4[] = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  const nCoq = leve ? 150 : 300;
  for (let i = 0; i < nCoq * 3 && locais.length < nCoq; i++) {
    const z = 40 - Math.random() * (COMPRIMENTO + 60);
    const d = MEIA_PISTA + 4 + Math.random() * (costa(z) - MEIA_PISTA - 9);
    const x = estradaX(z) + d;
    if (Math.hypot(x - POSTO.x, z - POSTO.z) < 24) continue;
    e.set((Math.random() - 0.5) * 0.12, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.12);
    const k = 0.8 + Math.random() * 0.5;
    locais.push(m4.clone().compose(p3.set(x, altura(x, z) - 0.2, z), q.clone().setFromEuler(e), s3.set(k, k, k).clone()));
  }
  // alguns em volta do posto
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 1.4 + 2.2, r = 20 + Math.random() * 5;
    const x = POSTO.x + Math.cos(ang) * r, z = POSTO.z + Math.sin(ang) * r;
    e.set(0, Math.random() * 6, 0);
    const k = 0.9 + Math.random() * 0.3;
    locais.push(m4.clone().compose(p3.set(x, ALT_ESTRADA - 0.1, z), q.clone().setFromEuler(e), s3.set(k, k, k).clone()));
  }
  const coqueiros = new THREE.InstancedMesh(coqGeo, vegMat, locais.length);
  locais.forEach((m, i) => coqueiros.setMatrixAt(i, m));
  cena.add(coqueiros);

  /* mata atlântica na serra: copas baixas instanciadas */
  const copaGeo = new THREE.IcosahedronGeometry(1, 1);
  copaGeo.scale(1, 0.8, 1);
  const nCopa = leve ? 1400 : 3600;
  const copas = new THREE.InstancedMesh(copaGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), nCopa);
  const corCopa = new THREE.Color();
  let nc = 0;
  for (let i = 0; i < nCopa * 3 && nc < nCopa; i++) {
    const z = 80 - Math.random() * (COMPRIMENTO + 250);
    const dd = 12 + Math.pow(Math.random(), 1.4) * 280;
    const x = estradaX(z) - MEIA_PISTA - dd;
    if (Math.hypot(x - POSTO.x, z - POSTO.z) < 30) continue;
    const k = 1.6 + Math.random() * 2.6;
    copas.setMatrixAt(nc, m4.compose(p3.set(x, altura(x, z) + k * 0.4, z), q.setFromEuler(e.set(0, Math.random() * 6, 0)), s3.set(k, k * (0.8 + Math.random() * 0.5), k)));
    copas.setColorAt(nc, corCopa.setHSL(0.25 + Math.random() * 0.09, 0.5, 0.18 + Math.random() * 0.14));
    nc++;
  }
  copas.count = nc;
  cena.add(copas);

  /* postes com luz quente chegando no posto */
  const nPoste = 9;
  const posteGeo = mergeGeometries([
    new THREE.CylinderGeometry(0.08, 0.1, 7, 5).translate(0, 3.5, 0),
    new THREE.BoxGeometry(1.4, 0.08, 0.08).translate(-0.7, 7, 0),
  ]);
  const postes = new THREE.InstancedMesh(posteGeo, new THREE.MeshLambertMaterial({ color: 0x3a3d42 }), nPoste);
  const lampMat = new THREE.MeshBasicMaterial({ color: brilho(0xffb35c, 3) });
  const lampadas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 8, 6), lampMat, nPoste);
  for (let i = 0; i < nPoste; i++) {
    const z = Z_POSTO + 60 + i * 38;
    const x = estradaX(z) + MEIA_PISTA + 1.6;
    postes.setMatrixAt(i, m4.compose(p3.set(x, ALT_ESTRADA, z), q.identity(), s3.set(1, 1, 1)));
    lampadas.setMatrixAt(i, m4.compose(p3.set(x - 1.35, ALT_ESTRADA + 6.85, z), q.identity(), s3.set(1, 1, 1)));
  }
  cena.add(postes, lampadas);

  /* o ponto de apoio: conveniência com cobertura, bombas, motorhome com toldo e varal de luz */
  const apoio = new THREE.Group();
  apoio.position.copy(POSTO);
  const lambert = (hex: number) => new THREE.MeshLambertMaterial({ color: hex });
  // cobertura das bombas
  const cobertura = new THREE.Mesh(new THREE.BoxGeometry(15, 0.7, 9), lambert(0xf1ede4));
  cobertura.position.set(9, 5.6, 0);
  const faixa = new THREE.Mesh(new THREE.BoxGeometry(15.1, 0.35, 9.1), new THREE.MeshBasicMaterial({ color: brilho(0xf59e0b, 1.6) }));
  faixa.position.set(9, 5.9, 0);
  const tetoLuz = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({ color: brilho(0xfff1d6, 1.5) }));
  tetoLuz.rotation.x = Math.PI / 2; tetoLuz.position.set(9, 5.24, 0);
  apoio.add(cobertura, faixa, tetoLuz);
  for (const [cx, cz] of [[3, -3], [15, -3], [3, 3], [15, 3]]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.3, 0.4), lambert(0xd9d4c8));
    col.position.set(cx, 2.65, cz); apoio.add(col);
  }
  for (const bz of [-1.5, 1.5]) {
    const bomba = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.7, 0.5), lambert(0xc2410c));
    bomba.position.set(9, 0.85, bz); apoio.add(bomba);
  }
  // loja
  const loja = new THREE.Mesh(new THREE.BoxGeometry(8, 4.2, 12), lambert(0xe9e1d0));
  loja.position.set(-4, 2.1, -2);
  const vitrine = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.4), new THREE.MeshBasicMaterial({ color: brilho(0xffd49a, 1.2) }));
  vitrine.rotation.y = Math.PI / 2; vitrine.position.set(0.02, 1.6, -2);
  const telhado = new THREE.Mesh(new THREE.BoxGeometry(9, 0.4, 13), lambert(0x8a4b2c));
  telhado.position.set(-4, 4.4, -2);
  const letreiro = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 2.2),
    new THREE.MeshBasicMaterial({ map: texturaLetreiro([{ texto: "CONVENIÊNCIA", tam: 58, cor: "#1a1206" }, { texto: "PONTO DE APOIO", tam: 30, cor: "#7c2d12" }], "#fbbf24"), color: brilho(0xffffff, 1.35) }),
  );
  letreiro.rotation.y = Math.PI / 2; letreiro.position.set(-1.5, 7.9, -4.5);
  const hasteL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.4, 0.2), lambert(0x3a3d42));
  hasteL.position.set(-1.6, 5.5, -4.5);
  apoio.add(loja, vitrine, telhado, hasteL, letreiro);
  // motorhome estacionado de lado, com toldo listrado e varal de lâmpadas
  const mh = new THREE.Group();
  // girado 180°: o lado do toldo fica virado para a estrada (e para a câmera)
  mh.position.set(-2, 0, 13); mh.rotation.y = Math.PI - 0.12;
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.9, 7.2), lambert(0xf4f1ea));
  corpo.position.set(0, 1.95, 0);
  const saia = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.45, 7.22), lambert(0x0f766e));
  saia.position.set(0, 0.95, 0);
  const cabine = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.6), lambert(0xf4f1ea));
  cabine.position.set(0, 1.35, 4.3);
  const parabrisa = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.8), lambert(0x1e293b));
  parabrisa.position.set(0, 1.75, 5.11);
  mh.add(corpo, saia, cabine, parabrisa);
  for (const [jz, jw] of [[-2, 1.6], [0.6, 1.2]]) {
    const jan = new THREE.Mesh(new THREE.PlaneGeometry(jw, 0.8), new THREE.MeshBasicMaterial({ color: brilho(0xffc47a, 1.1) }));
    jan.rotation.y = -Math.PI / 2; jan.position.set(-1.26, 2.3, jz); mh.add(jan);
  }
  for (const rz of [-2.4, 2.2, 4.3]) {
    const roda = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.6, 12).rotateZ(Math.PI / 2), lambert(0x111111));
    roda.position.set(0, 0.45, rz); mh.add(roda);
  }
  const toldo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.5), new THREE.MeshLambertMaterial({ map: texturaToldo(), side: THREE.DoubleSide }));
  toldo.rotation.set(0, 0, 0); toldo.rotation.order = "YXZ";
  toldo.rotation.y = Math.PI / 2; toldo.rotation.x = -Math.PI / 2 + 0.22;
  toldo.position.set(-2.5, 3.05, -0.6);
  mh.add(toldo);
  const mesa = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 14), lambert(0x9a6b3f));
  mesa.position.set(-3, 0.75, -0.6);
  const pe_ = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 6), lambert(0x333333));
  pe_.position.set(-3, 0.37, -0.6);
  mh.add(mesa, pe_);
  for (const cz of [-1.5, 0.3]) {
    const cad = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.5), lambert(0x1d4ed8));
    cad.position.set(-3.1, 0.45, cz); mh.add(cad);
  }
  const lampVaral = new THREE.MeshBasicMaterial({ color: brilho(0xffc070, 4) });
  for (let i = 0; i < 11; i++) {
    const t = i / 10, z = -3.3 + t * 5.4;
    const y = 3.0 - Math.sin(t * Math.PI) * 0.35;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), lampVaral);
    b.position.set(-3.8, y, z); mh.add(b);
  }
  const luzVaral = new THREE.PointLight(0xffa850, 0, 16, 1.6);
  luzVaral.position.set(-3, 2.4, -0.6);
  mh.add(luzVaral);
  apoio.add(mh);
  const luzPosto = new THREE.PointLight(0xffe0b0, 0, 30, 1.4);
  luzPosto.position.set(9, 4.5, 0);
  apoio.add(luzPosto);
  cena.add(apoio);

  /* poeira dourada no ar (só com movimento liberado) */
  let poeira: THREE.Points | null = null;
  if (!reduzido) {
    const nP = leve ? 120 : 260, pp = new Float32Array(nP * 3);
    for (let i = 0; i < nP; i++) pp.set([(Math.random() - 0.5) * 40, Math.random() * 12, (Math.random() - 0.5) * 40], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pp, 3));
    poeira = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffd9a0, size: 0.07, transparent: true, opacity: 0.55, depthWrite: false }));
    cena.add(poeira);
  }

  /* pós: bloom leve só em aparelho com folga */
  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  if (!leve) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(cena, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.5, 0.92);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  /* câmera presa à rolagem */
  const alvoCam = new THREE.Vector3(), olhar = new THREE.Vector3(), camPos = new THREE.Vector3(), camOlhar = new THREE.Vector3();
  const fimPos = new THREE.Vector3(), fimOlhar = new THREE.Vector3();
  {
    // enquadramento final: da estrada, um pouco antes, olhando o posto e o motorhome
    const z = Z_POSTO + 30;
    fimPos.set(estradaX(z) + 2, ALT_ESTRADA + 3.6, z);
    fimOlhar.copy(POSTO).add(new THREE.Vector3(3, 2.4, 5));
  }
  function posicaoCamera(prog: number, destino: THREE.Vector3, visada: THREE.Vector3) {
    const ida = Math.min(1, prog / 0.8);
    const eased = 1 - Math.pow(1 - ida, 1.6);
    const u = 0.04 + eased * 0.83;
    const p = curva.getPointAt(u);
    const a = curva.getPointAt(Math.min(1, u + 0.035));
    destino.set(p.x + 1.4, p.y + 3.1 + Math.sin(prog * 12) * 0.05, p.z);
    visada.set(a.x + 3, a.y + 1.6, a.z);
    const k = suave(0.62, 0.84, prog);
    destino.lerp(fimPos, k);
    visada.lerp(fimOlhar, k);
  }

  let largura = 0, altura_ = 0;
  function redimensionar() {
    largura = window.innerWidth; altura_ = window.innerHeight;
    renderer.setSize(largura, altura_, false);
    composer?.setSize(largura, altura_);
    bloom?.setSize(largura / 2, altura_ / 2);
    camera.aspect = largura / altura_;
    camera.fov = camera.aspect < 0.8 ? 64 : 50;
    camera.updateProjectionMatrix();
  }
  redimensionar();
  window.addEventListener("resize", redimensionar, { passive: true });

  let atual = op.progresso();
  posicaoCamera(atual, camPos, camOlhar);
  const relogio = new THREE.Clock();
  let tempo = 0, ultimo = 0, id = 0, primeiro = true, vivo = true;
  const intervalo = leve ? 1 / 30 : 0;

  function quadro() {
    if (!vivo) return;
    id = requestAnimationFrame(quadro);
    if (document.hidden) return;
    const dt = Math.min(relogio.getDelta(), 0.1);
    ultimo += dt;
    if (intervalo && ultimo < intervalo) return;
    const passo = ultimo; ultimo = 0;
    if (!reduzido) tempo += passo;

    const alvo = op.progresso();
    atual = reduzido ? alvo : atual + (alvo - atual) * (1 - Math.exp(-passo * 3.2));
    posicaoCamera(atual, alvoCam, olhar);
    camPos.lerp(alvoCam, reduzido ? 1 : 1 - Math.exp(-passo * 6));
    camOlhar.lerp(olhar, reduzido ? 1 : 1 - Math.exp(-passo * 6));
    camera.position.copy(camPos);
    camera.lookAt(camOlhar);
    ceu.position.copy(camPos);

    // a tarde vira noite com a rolagem; as luzes acendem
    const noite = suave(0.25, 0.9, atual);
    ceuMat.uniforms.uNoite.value = noite;
    marMat.uniforms.uNoite.value = noite;
    marMat.uniforms.uTempo.value = tempo;
    espMat.uniforms.uNoite.value = noite;
    espMat.uniforms.uTempo.value = tempo;
    estrelasMat.opacity = suave(0.55, 1, atual) * 0.9;
    neblina.color.setRGB(0.93 - 0.8 * noite, 0.6 - 0.52 * noite, 0.4 - 0.29 * noite);
    neblina.density = 0.0028 - 0.0008 * noite;
    hemi.intensity = 1.1 - 0.75 * noite;
    luzSol.intensity = 2.2 * (1 - noite);
    const acesas = suave(0.35, 0.75, atual);
    luzVaral.intensity = 14 * acesas;
    luzPosto.intensity = 45 * acesas;
    lampMat.color.copy(brilho(0xffb35c, 0.4 + 2.6 * acesas));
    lampVaral.color.copy(brilho(0xffc070, 0.5 + 1.8 * acesas));
    if (poeira) {
      poeira.position.set(camPos.x, camPos.y - 3, camPos.z);
      poeira.rotation.y = tempo * 0.02;
      (poeira.material as THREE.PointsMaterial).opacity = 0.55 * (1 - noite * 0.6);
    }

    if (composer) composer.render(); else renderer.render(cena, camera);
    if (primeiro) { primeiro = false; op.pronto?.(); }
  }
  id = requestAnimationFrame(quadro);

  return () => {
    vivo = false;
    cancelAnimationFrame(id);
    window.removeEventListener("resize", redimensionar);
    cena.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
        (x as THREE.MeshBasicMaterial).map?.dispose();
        x.dispose();
      });
    });
    composer?.dispose();
    renderer.dispose();
  };
}
