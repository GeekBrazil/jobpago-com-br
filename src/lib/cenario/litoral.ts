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
import * as TX from "./texturas";
import { criarApoio } from "./apoio";
import { carregarFotos, carregarModelos } from "./modelos";

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
      // perto do posto a serra fica baixa e recuada, para o céu do fim de tarde aparecer atrás da loja
      const perto = 0.18 + 0.82 * suave(60, 340, Math.hypot(x - POSTO.x, z - POSTO.z));
      const serra = (18 + 95 * fbm(x * 0.005 + 3, z * 0.005) + dd * 0.12) * perto;
      h = ALT_ESTRADA + serra * suave(0, 70, dd) + 1.2 * ruido(x * 0.08, z * 0.08) * suave(0, 10, dd);
    }
  }
  // pátio plano do posto
  const r = Math.hypot(x - POSTO.x, z - POSTO.z);
  const k = 1 - suave(26, 48, r);
  return h * (1 - k) + ALT_ESTRADA * k;
}

/* ───────────── texturas desenhadas ───────────── */
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
  renderer.toneMappingExposure = 1.3;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const cena = new THREE.Scene();
  // névoa só para esconder o fim do terreno lá longe (pedido: sem névoa na cena)
  const neblina = new THREE.FogExp2(0xe8a270, 0.0011);
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
        vec3 topoN = vec3(0.1,0.12,0.3), horN = vec3(1.25,0.5,0.2);
        vec3 topo = mix(topoT, topoN, uNoite), hor = mix(horT, horN, uNoite);
        vec3 c = mix(hor, topo, pow(max(h,0.0), 0.55));
        float s = max(dot(normalize(vDir), uSol), 0.0);
        c += vec3(1.2,0.55,0.22) * (pow(s, 8.0) * 0.8 + pow(s, 600.0) * 6.0) * (1.0 - uNoite * 0.85);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), ceuMat);
  cena.add(ceu);
  {
    // mapa de ambiente tirado do próprio céu (entardecer), para o vidro e a pintura refletirem
    const pm = new THREE.PMREMGenerator(renderer);
    const envCena = new THREE.Scene();
    const envMat = ceuMat.clone();
    envMat.uniforms.uNoite.value = 0.35;
    envCena.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), envMat));
    cena.environment = pm.fromScene(envCena, 0, 0.1, 200).texture;
    cena.environmentIntensity = 0.6;
    pm.dispose();
  }

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
  const hemi = new THREE.HemisphereLight(0xffd2aa, 0x3a4a36, 1.4);
  cena.add(hemi);
  const luzSol = new THREE.DirectionalLight(0xffa15c, 2.6);
  luzSol.position.copy(sol).multiplyScalar(500);
  cena.add(luzSol);

  /* texturas desenhadas na hora (src/lib/cenario/texturas.ts) */
  const T = leve ? 256 : 512;
  const txAreia = TX.areia(T), txGrama = TX.grama(T), txRocha = TX.rocha(T), txCasc = TX.cascalho(T), txMacro = TX.macro(256);

  /* terreno: pesos por vértice (areia, grama, leito, areia molhada) misturando as texturas no shader */
  const W = 900, L = 1500, segX = leve ? 110 : 200, segZ = leve ? 180 : 320;
  const terGeo = new THREE.PlaneGeometry(W, L, segX, segZ);
  terGeo.rotateX(-Math.PI / 2);
  terGeo.translate(-170, 0, -COMPRIMENTO / 2);
  const pos = terGeo.attributes.position as THREE.BufferAttribute;
  const pesos = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, altura(x, z));
    const d = x - estradaX(z);
    const leitoK = Math.max(1 - suave(MEIA_PISTA + 1.5, MEIA_PISTA + 4, Math.abs(d)), 1 - suave(20, 30, Math.hypot(x - POSTO.x, z - POSTO.z)));
    let a = 0, g = 0, m = 0;
    if (d > 0) { m = suave(costa(z) - 7, costa(z) + 1, d); a = 1 - m; } else g = 1;
    pesos.set([a * (1 - leitoK), g * (1 - leitoK), leitoK, m * (1 - leitoK)], i * 4);
  }
  terGeo.setAttribute("aPeso", new THREE.BufferAttribute(pesos, 4));
  terGeo.computeVertexNormals();
  // objeto único: trocar .value depois (textura fotográfica) atualiza o shader
  const uTerreno = { tAreia: { value: txAreia.cor as THREE.Texture }, tGrama: { value: txGrama }, tRocha: { value: txRocha.cor }, tCasc: { value: txCasc.cor }, tMacro: { value: txMacro } };
  const terMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  terMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uTerreno);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 aPeso; varying vec4 vPeso; varying vec3 vW; varying float vInclina;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPeso = aPeso; vW = (modelMatrix * vec4(transformed, 1.0)).xyz; vInclina = 1.0 - normalize(mat3(modelMatrix) * objectNormal).y;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D tAreia, tGrama, tRocha, tCasc, tMacro; varying vec4 vPeso; varying vec3 vW; varying float vInclina;")
      .replace("#include <map_fragment>", `
        vec2 uvw = vW.xz * 0.22;
        float mac = texture2D(tMacro, vW.xz * 0.0035).r;
        vec3 cA = mix(texture2D(tAreia, uvw).rgb, texture2D(tAreia, uvw * 0.23 + 0.37).rgb, 0.35);
        vec3 cG = mix(texture2D(tGrama, uvw * 0.6).rgb, texture2D(tGrama, uvw * 0.13).rgb, 0.45);
        vec3 cR = texture2D(tRocha, vW.xz * 0.05 + vec2(vW.y * 0.04)).rgb;
        vec3 cL = texture2D(tCasc, uvw * 0.8).rgb;
        vec3 cM = cA * vec3(0.6, 0.57, 0.54);
        vec3 col = cA * vPeso.x + cG * vPeso.y + cL * vPeso.z + cM * vPeso.w;
        col = mix(col, cR, smoothstep(0.5, 0.8, vInclina) * vPeso.y * 0.55);
        col *= mix(vec3(1.0), vec3(0.8, 1.12, 0.72), vPeso.y); // mata atlântica mais verde
        col *= 0.8 + 0.4 * mac;
        diffuseColor.rgb *= col;`);
  };
  cena.add(new THREE.Mesh(terGeo, terMat));

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
  const asfalto = TX.asfalto(T);
  asfalto.cor.anisotropy = asfalto.normal.anisotropy = renderer.capabilities.getMaxAnisotropy();
  asfalto.cor.wrapS = asfalto.normal.wrapS = THREE.ClampToEdgeWrapping;
  const estradaMat = new THREE.MeshStandardMaterial({
    map: asfalto.cor, normalMap: asfalto.normal, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.88, metalness: 0,
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2,
  });
  cena.add(new THREE.Mesh(estradaGeo, estradaMat));

  /* coqueiro: tronco curvo com casca + folhas com folíolos recortados (duas malhas instanciadas) */
  const CURVA_TRONCO = 0.022;
  const troncoGeo = new THREE.CylinderGeometry(0.16, 0.26, 9, 7, 12, true);
  troncoGeo.translate(0, 4.5, 0);
  {
    const tp = troncoGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < tp.count; i++) { const y = tp.getY(i); tp.setX(i, tp.getX(i) + CURVA_TRONCO * y * y); }
    troncoGeo.computeVertexNormals();
  }
  const folhas: THREE.BufferGeometry[] = [];
  for (let f = 0; f < 11; f++) {
    const folha = new THREE.PlaneGeometry(2.0, 4.4, 2, 8);
    const fp = folha.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < fp.count; i++) {
      const y = fp.getY(i) + 2.2; // 0..4.4 ao longo da folha
      fp.setY(i, y);
      fp.setZ(i, -0.085 * y * y + Math.abs(fp.getX(i)) * 0.25); // cai e forma um "V"
    }
    folha.rotateX(-Math.PI / 2 + 0.3 + (f % 3) * 0.12);
    folha.rotateY((f / 11) * Math.PI * 2 + (f % 2) * 0.25);
    folha.translate(CURVA_TRONCO * 81, 9, 0);
    folhas.push(folha);
  }
  const folhaGeo = mergeGeometries(folhas);
  folhaGeo.computeVertexNormals();
  const txCasca = TX.casca(T);
  txCasca.repeat.set(2, 3);
  const troncoMat = new THREE.MeshLambertMaterial({ map: txCasca });
  const folhaMat = new THREE.MeshLambertMaterial({ map: TX.folhaCoqueiro(T), alphaTest: 0.45, side: THREE.DoubleSide });
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
  const troncos = new THREE.InstancedMesh(troncoGeo, troncoMat, locais.length);
  const coqueiros = new THREE.InstancedMesh(folhaGeo, folhaMat, locais.length);
  const corFolha = new THREE.Color();
  locais.forEach((m, i) => {
    troncos.setMatrixAt(i, m);
    coqueiros.setMatrixAt(i, m);
    coqueiros.setColorAt(i, corFolha.setHSL(0.22 + Math.random() * 0.06, 0.3, 0.8 + Math.random() * 0.2));
  });
  cena.add(troncos, coqueiros);

  /* mata atlântica na serra: copas baixas instanciadas */
  const copaGeo = new THREE.IcosahedronGeometry(1, 1);
  {
    const cp = copaGeo.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
    for (let i = 0; i < cp.count; i++) {
      v.fromBufferAttribute(cp, i);
      const k = 0.78 + 0.4 * ruido(v.x * 2.1 + 5, v.z * 2.1 + v.y * 1.7);
      cp.setXYZ(i, v.x * k, v.y * k * 0.8, v.z * k);
    }
    copaGeo.computeVertexNormals();
  }
  const txCopa = TX.copa(T);
  txCopa.cor.repeat.set(3, 2); txCopa.normal.repeat.set(3, 2);
  const nCopa = leve ? 1400 : 3600;
  const copas = new THREE.InstancedMesh(copaGeo, new THREE.MeshLambertMaterial({ map: txCopa.cor, normalMap: txCopa.normal }), nCopa);
  const corCopa = new THREE.Color();
  let nc = 0;
  for (let i = 0; i < nCopa * 3 && nc < nCopa; i++) {
    const z = 80 - Math.random() * (COMPRIMENTO + 250);
    const dd = 12 + Math.pow(Math.random(), 1.4) * 280;
    const x = estradaX(z) - MEIA_PISTA - dd;
    if (Math.hypot(x - POSTO.x, z - POSTO.z) < 30) continue;
    const k = 1.6 + Math.random() * 2.6;
    copas.setMatrixAt(nc, m4.compose(p3.set(x, altura(x, z) + k * 0.4, z), q.setFromEuler(e.set(0, Math.random() * 6, 0)), s3.set(k, k * (0.8 + Math.random() * 0.5), k)));
    copas.setColorAt(nc, corCopa.setHSL(0.25 + Math.random() * 0.08, 0.5, 0.6 + Math.random() * 0.3));
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

  /* o ponto de apoio (src/lib/cenario/apoio.ts): posto, conveniência e motorhome com toldo */
  const apoio = criarApoio(T, leve);
  apoio.grupo.position.copy(POSTO);
  cena.add(apoio.grupo);
  // texturas fotográficas e objetos do Poly Haven: chegam depois, sem travar a abertura
  const esperaFotos = setTimeout(() => {
    const alvos = { uTerreno, estradaMat, T, apoio };
    carregarFotos(alvos).catch(() => {});
    carregarModelos(alvos).catch(() => {});
  }, 1200);

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
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.35, 1.05);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  /* câmera presa à rolagem */
  const alvoCam = new THREE.Vector3(), olhar = new THREE.Vector3(), camPos = new THREE.Vector3(), camOlhar = new THREE.Vector3();
  const fimPos = new THREE.Vector3(), fimOlhar = new THREE.Vector3(), fimPosV = new THREE.Vector3(), fimOlharV = new THREE.Vector3();
  {
    // enquadramento final: da estrada, um pouco antes, olhando o posto e o motorhome
    // mais perto: o motorhome em primeiro plano e a conveniência atrás
    // perto: o motorhome ocupa metade da tela, a loja aparece atrás
    fimPos.copy(POSTO).add(new THREE.Vector3(7.5, 1.9, 19.5));
    fimOlhar.copy(POSTO).add(new THREE.Vector3(-1.8, 2.3, 12.5));
    // tela em pé: mais recuado e mirando entre o motorhome e a loja
    fimPosV.copy(POSTO).add(new THREE.Vector3(9, 2.3, 25));
    fimOlharV.copy(POSTO).add(new THREE.Vector3(-1.6, 2.4, 13.2));
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
    const empe = camera.aspect < 0.8;
    destino.lerp(empe ? fimPosV : fimPos, k);
    visada.lerp(empe ? fimOlharV : fimOlhar, k);
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
    // termina em golden hour (sol baixo e dourado), não em noite fechada
    const noite = suave(0.25, 0.9, atual) * 0.35;
    ceuMat.uniforms.uNoite.value = noite;
    marMat.uniforms.uNoite.value = noite;
    marMat.uniforms.uTempo.value = tempo;
    espMat.uniforms.uNoite.value = noite;
    espMat.uniforms.uTempo.value = tempo;
    estrelasMat.opacity = 0;
    neblina.color.setRGB(0.93 - 0.8 * noite, 0.6 - 0.52 * noite, 0.4 - 0.29 * noite);
    neblina.density = 0.0011;
    hemi.intensity = 1.4 - 0.95 * noite;
    cena.environmentIntensity = 0.6 - 0.4 * noite;
    luzSol.intensity = 2.6 * (1 - noite);
    const acesas = suave(0.35, 0.75, atual);
    apoio.atualizar(acesas);
    lampMat.color.copy(brilho(0xffb35c, 0.4 + 2.6 * acesas));
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
    clearTimeout(esperaFotos);
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
