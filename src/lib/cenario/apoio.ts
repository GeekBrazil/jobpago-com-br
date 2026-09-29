/* O ponto de apoio do fim da rolagem: posto com conveniência e um motorhome
   estacionado com toldo aberto. Modelado em código (peças arredondadas, vidro que
   reflete o céu, sombra de contato no chão). ILUSTRAÇÃO — não é um lugar real.

   Eixos locais: a estrada fica em +x. A fachada da loja e o lado do toldo do
   motorhome ficam virados para +x (para a câmera). */

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const brilho = (hex: number, f: number) => new THREE.Color(hex).multiplyScalar(f);

function canvasTex(w: number, h: number, desenhar: (g: CanvasRenderingContext2D) => void, repetir = false) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  desenhar(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function retArred(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/* ───── texturas específicas ───── */
function texConcreto(t: number) {
  return canvasTex(t, t, (g) => {
    g.fillStyle = "#8d8a84"; g.fillRect(0, 0, t, t);
    for (let i = 0; i < t * t * 0.06; i++) {
      const v = 120 + Math.random() * 40;
      g.fillStyle = `rgba(${v},${v - 3},${v - 8},0.35)`;
      g.fillRect(Math.random() * t, Math.random() * t, 1.5, 1.5);
    }
    for (let i = 0; i < 2; i++) { // manchas de óleo e água (poucas: a textura se repete)
      const x = Math.random() * t, y = Math.random() * t, r = t * (0.04 + Math.random() * 0.08);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(40,38,34,0.16)"); gr.addColorStop(1, "rgba(40,38,34,0)");
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.strokeStyle = "rgba(50,48,44,0.7)"; g.lineWidth = Math.max(1, t / 256); // juntas das placas
    g.strokeRect(0.5, 0.5, t - 1, t - 1);
  }, true);
}

function texFaixaZebrada() {
  return canvasTex(256, 32, (g) => {
    g.fillStyle = "#1c1c1c"; g.fillRect(0, 0, 256, 32);
    g.fillStyle = "#f2b705";
    for (let x = -32; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 16, 32); g.lineTo(x + 32, 0); g.lineTo(x + 16, 0); g.fill(); }
  }, true);
}

function texBomba() {
  return canvasTex(128, 256, (g) => {
    g.fillStyle = "#f4f2ec"; g.fillRect(0, 0, 128, 256);
    g.fillStyle = "#f59e0b"; g.fillRect(0, 0, 128, 40);
    g.fillStyle = "#1a1206"; g.font = "800 20px system-ui"; g.textAlign = "center"; g.fillText("COMBUSTÍVEL", 64, 27);
    g.fillStyle = "#0b0f14"; g.fillRect(14, 60, 100, 70); // visor
    g.fillStyle = "#34d399"; g.font = "700 22px monospace"; g.fillText("0,00", 64, 92); g.fillText("0,000", 64, 120);
    g.fillStyle = "#9ca3af";
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g.fillRect(30 + c * 24, 150 + r * 20, 18, 14); // teclado
    g.fillStyle = "#c2410c"; g.fillRect(0, 226, 128, 30);
  });
}

function texProdutos() {
  return canvasTex(256, 128, (g) => {
    g.fillStyle = "#e9e5dc"; g.fillRect(0, 0, 256, 128);
    const cores = ["#dc2626", "#f59e0b", "#16a34a", "#2563eb", "#f8fafc", "#7c3aed", "#ea580c", "#0891b2"];
    for (let prat = 0; prat < 4; prat++) {
      const y = prat * 32;
      g.fillStyle = "#9ca3af"; g.fillRect(0, y + 29, 256, 3);
      let x = 2;
      while (x < 254) {
        const w = 6 + Math.random() * 12, h = 12 + Math.random() * 14;
        g.fillStyle = cores[Math.floor(Math.random() * cores.length)];
        g.fillRect(x, y + 29 - h, w, h);
        x += w + 1;
      }
    }
  });
}

function texGeladeira() {
  return canvasTex(256, 128, (g) => {
    g.fillStyle = "#f1f5f9"; g.fillRect(0, 0, 256, 128);
    const cores = ["#dc2626", "#16a34a", "#f59e0b", "#1d4ed8", "#e2e8f0"];
    for (let porta = 0; porta < 4; porta++) {
      const x0 = porta * 64;
      for (let prat = 0; prat < 4; prat++) for (let i = 0; i < 7; i++) {
        g.fillStyle = cores[(porta + prat + i) % cores.length];
        g.fillRect(x0 + 6 + i * 8, 10 + prat * 28, 6, 20);
      }
      g.fillStyle = "#94a3b8"; g.fillRect(x0, 0, 3, 128);
    }
  });
}

function texPlaca() {
  return canvasTex(256, 84, (g) => {
    g.fillStyle = "#f8fafc"; g.fillRect(0, 0, 256, 84);
    g.fillStyle = "#1e3a8a"; g.fillRect(0, 0, 256, 18);
    g.fillStyle = "#fff"; g.font = "700 12px system-ui"; g.textAlign = "center"; g.fillText("BRASIL", 128, 13);
    g.fillStyle = "#111"; g.font = "700 44px monospace"; g.fillText("JBP1A26", 128, 68);
    g.strokeStyle = "#111"; g.lineWidth = 4; g.strokeRect(2, 2, 252, 80);
  });
}

function texDecal() {
  return canvasTex(1024, 256, (g) => {
    g.clearRect(0, 0, 1024, 256);
    const faixa = (cor: string, y0: number, esp: number) => {
      g.fillStyle = cor; g.beginPath();
      g.moveTo(0, y0); g.bezierCurveTo(300, y0 - 10, 520, y0 - 70, 1024, y0 - 110);
      g.lineTo(1024, y0 - 110 + esp); g.bezierCurveTo(520, y0 - 70 + esp, 300, y0 - 10 + esp, 0, y0 + esp);
      g.closePath(); g.fill();
    };
    faixa("#0f766e", 190, 26); faixa("#d9772b", 222, 12); faixa("#f2b705", 238, 6);
  });
}

function texPainelSolar() {
  return canvasTex(128, 256, (g) => {
    g.fillStyle = "#0f1f3d"; g.fillRect(0, 0, 128, 256);
    g.strokeStyle = "#6b7fa6"; g.lineWidth = 1.2;
    for (let x = 0; x <= 128; x += 21.3) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
    for (let y = 0; y <= 256; y += 21.3) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
    g.strokeStyle = "#c0c6d0"; g.lineWidth = 6; g.strokeRect(0, 0, 128, 256);
  });
}

function texToldo() {
  return canvasTex(512, 128, (g) => {
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#f3efe4" : "#c96a2b"; g.fillRect(i * 32, 0, 32, 128); }
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, "rgba(0,0,0,0.15)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 512, 128);
  }, true);
}

function texTapete() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = "#1f4e5f"; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "#e6c79c"; g.lineWidth = 6;
    for (let i = 0; i < 6; i++) g.strokeRect(16 + i * 18, 16 + i * 18, 224 - i * 36, 224 - i * 36);
  });
}

function texLetreiro() {
  return canvasTex(1024, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#fcd34d"); gr.addColorStop(1, "#f59e0b");
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 256);
    g.fillStyle = "#1a1206"; g.font = "900 120px system-ui"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("CONVENIÊNCIA", 512, 105);
    g.fillStyle = "#7c2d12"; g.font = "800 50px system-ui"; g.fillText("PONTO DE APOIO · 24H", 512, 200);
  });
}

function texSombra() {
  return canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 8, 64, 64, 64);
    gr.addColorStop(0, "rgba(0,0,0,0.75)"); gr.addColorStop(0.6, "rgba(0,0,0,0.35)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
}

/* ─────────────────────────────────────────── */
export function criarApoio(T: number, leve: boolean) {
  const grupo = new THREE.Group();
  const std = (hex: number, rough = 0.6, metal = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal, ...extra });
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number, pai: THREE.Object3D = grupo) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); pai.add(m); return m;
  };
  const rb = (w: number, h: number, d: number, r = 0.05, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));

  const sombraTx = texSombra();
  const sombra = (w: number, d: number, x: number, z: number, pai: THREE.Object3D = grupo, forca = 1) => {
    const m = add(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: sombraTx, transparent: true, depthWrite: false, opacity: forca }), x, 0.04, z, pai);
    m.renderOrder = 1;
    return m;
  };

  /* materiais compartilhados */
  const branco = std(0xf2efe8, 0.45);
  const cinzaMetal = std(0x9aa3ad, 0.35, 0.7);
  const escuro = std(0x1f2328, 0.7);
  const borracha = std(0x151515, 0.9);
  const amarelo = std(0xf59e0b, 0.45);
  const vidro = std(0x1b2632, 0.06, 0.85, { envMapIntensity: 1.3 });
  const vidroCasa = new THREE.MeshStandardMaterial({ color: 0x1b2632, roughness: 0.05, metalness: 0.5, emissive: new THREE.Color(0xffb060), emissiveIntensity: 0 });
  const luzesQuentes: THREE.MeshBasicMaterial[] = [];
  const quente = (hex: number, f: number) => { const m = new THREE.MeshBasicMaterial({ color: brilho(hex, f) }); m.userData.base = [hex, f]; luzesQuentes.push(m); return m; };

  /* ══════════ PÁTIO ══════════ */
  const txConc = texConcreto(T);
  txConc.repeat.set(9, 8);
  const patioMat = std(0xffffff, 0.85, 0, { map: txConc });
  add(new THREE.PlaneGeometry(46, 42).rotateX(-Math.PI / 2), patioMat, 6, 0.02, 2);
  // vagas pintadas na frente da loja
  const tinta = std(0xe8e6df, 0.7);
  for (let i = 0; i < 4; i++) add(new THREE.PlaneGeometry(0.12, 4.5).rotateX(-Math.PI / 2), tinta, 1.8 + i * 0, 0.03, -7.5 + i * 2.6).rotation.y = Math.PI / 2;

  /* ══════════ COBERTURA E BOMBAS ══════════ */
  const cob = new THREE.Group(); cob.position.set(9.5, 0, 0); grupo.add(cob);
  const txFascia = canvasTex(1024, 96, (g) => {
    g.fillStyle = "#f4f2ec"; g.fillRect(0, 0, 1024, 96);
    g.fillStyle = "#f59e0b"; g.fillRect(0, 34, 1024, 28);
    g.fillStyle = "#c2410c"; g.fillRect(0, 62, 1024, 6);
    g.fillStyle = "#1f2328"; g.fillRect(0, 86, 1024, 10);
  }, true);
  add(rb(15.6, 1.1, 9.6, 0.12, 3), std(0xffffff, 0.4, 0, { map: txFascia }), 0, 6.05, 0, cob);
  // forro com painéis de LED
  add(new THREE.PlaneGeometry(15.2, 9.2).rotateX(Math.PI / 2), std(0xd6d3cc, 0.6), 0, 5.49, 0, cob);
  const led = quente(0xfff4dc, 1.15);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++)
    add(new THREE.PlaneGeometry(1.6, 0.9).rotateX(Math.PI / 2), led, -6 + i * 3, 5.47, -3 + j * 3, cob);
  // colunas revestidas
  for (const [cx, cz] of [[-4.2, -2.4], [4.2, -2.4], [-4.2, 2.4], [4.2, 2.4]]) {
    add(rb(0.55, 5.5, 0.55, 0.08), branco, cx, 2.75, cz, cob);
    add(rb(0.62, 0.8, 0.62, 0.06), amarelo, cx, 0.4, cz, cob);
  }
  // ilhas com bombas, mangueiras e frades
  const txZebra = texFaixaZebrada(); txZebra.repeat.set(4, 1);
  const txBomba = texBomba();
  const bombaMat = [std(0xf4f2ec, 0.4), std(0xf4f2ec, 0.4), std(0xf59e0b, 0.4), std(0x333333, 0.8), std(0xffffff, 0.35, 0, { map: txBomba }), std(0xffffff, 0.35, 0, { map: txBomba })];
  for (const iz of [-2.4, 2.4]) {
    add(rb(6.4, 0.25, 1.3, 0.08), std(0xbdbab2, 0.8), 0, 0.125, iz, cob);
    const faixaIlha = add(new THREE.PlaneGeometry(6.4, 0.25), std(0xffffff, 0.6, 0, { map: txZebra }), 0, 0.125, iz + 0.655, cob);
    faixaIlha.renderOrder = 1;
    for (const bx of [-1.6, 1.6]) {
      add(rb(0.9, 1.95, 0.55, 0.08), bombaMat, bx, 1.225, iz, cob);
      add(rb(0.95, 0.12, 0.6, 0.04), escuro, bx, 2.25, iz, cob);
      // mangueira pendurada até o bico
      const lado = iz > 0 ? 1 : -1;
      const curva = new THREE.CatmullRomCurve3([
        new THREE.Vector3(bx - 0.3, 1.9, iz + lado * 0.28), new THREE.Vector3(bx - 0.55, 1.2, iz + lado * 0.5),
        new THREE.Vector3(bx - 0.5, 0.55, iz + lado * 0.45), new THREE.Vector3(bx - 0.35, 1.1, iz + lado * 0.3),
      ]);
      add(new THREE.TubeGeometry(curva, 20, 0.025, 6), borracha, 0, 0, 0, cob);
      add(rb(0.12, 0.28, 0.1, 0.03), escuro, bx - 0.35, 1.2, iz + lado * 0.3, cob);
    }
    for (const fx of [-3.3, 3.3]) add(new THREE.CylinderGeometry(0.09, 0.09, 1, 10), amarelo, fx, 0.75, iz, cob);
  }
  sombra(15, 10, 9.5, 0, grupo, 0.55);

  /* totem com os combustíveis (sem preço — não inventar número) */
  const txTotem = canvasTex(128, 512, (g) => {
    g.fillStyle = "#f4f2ec"; g.fillRect(0, 0, 128, 512);
    g.fillStyle = "#f59e0b"; g.fillRect(0, 0, 128, 120);
    g.fillStyle = "#1a1206"; g.font = "900 34px system-ui"; g.textAlign = "center"; g.fillText("POSTO", 64, 72);
    g.font = "800 18px system-ui";
    ["GASOLINA", "ETANOL", "DIESEL S10"].forEach((n, i) => {
      g.fillStyle = "#1f2328"; g.fillRect(8, 150 + i * 110, 112, 90);
      g.fillStyle = "#fbbf24"; g.fillText(n, 64, 200 + i * 110);
    });
  });
  add(rb(1.4, 6, 0.5, 0.1), [std(0xf4f2ec, 0.5), std(0xf4f2ec, 0.5), std(0xf4f2ec, 0.5), std(0xf4f2ec, 0.5),
    new THREE.MeshBasicMaterial({ map: txTotem, color: brilho(0xffffff, 1.1) }), new THREE.MeshBasicMaterial({ map: txTotem, color: brilho(0xffffff, 1.1) })], 19.5, 3, -8).rotation.y = Math.PI / 2;

  /* ══════════ LOJA DE CONVENIÊNCIA ══════════ */
  const loja = new THREE.Group(); loja.position.set(-4, 0, -2); grupo.add(loja);
  const reboco = canvasTex(T, T, (g) => {
    g.fillStyle = "#ece2cf"; g.fillRect(0, 0, T, T);
    for (let i = 0; i < T * T * 0.05; i++) { const v = 200 + Math.random() * 40; g.fillStyle = `rgba(${v},${v - 10},${v - 25},0.3)`; g.fillRect(Math.random() * T, Math.random() * T, 2, 2); }
    const gr = g.createLinearGradient(0, T * 0.7, 0, T); gr.addColorStop(0, "rgba(90,70,50,0)"); gr.addColorStop(1, "rgba(90,70,50,0.35)");
    g.fillStyle = gr; g.fillRect(0, 0, T, T);
  }, true);
  const paredeMat = std(0xffffff, 0.85, 0, { map: reboco });
  // corpo (fachada +x aberta para a vitrine)
  add(rb(8, 4.4, 12, 0.08), paredeMat, -0.4, 2.2, 0, loja);
  add(rb(8.6, 0.5, 12.6, 0.1), std(0xd8d0c0, 0.7), -0.4, 4.6, 0, loja); // platibanda
  add(rb(1.2, 0.35, 12.2, 0.05), std(0x6b7280, 0.6), 3.9, 0.17, 0, loja); // calçada
  // vitrine: montantes de alumínio + vidro que deixa ver o interior
  const fachadaX = 3.62;
  add(rb(0.12, 3.3, 11.4, 0.02), std(0x2d3238, 0.5, 0.6), fachadaX - 0.08, 1.95, 0, loja).scale.set(1, 1, 1);
  const aluminio = std(0xb8bec6, 0.3, 0.9);
  for (let i = 0; i <= 6; i++) add(rb(0.12, 3.2, 0.1, 0.02), aluminio, fachadaX, 1.95, -5.5 + i * (11 / 6), loja);
  add(rb(0.12, 0.1, 11.2, 0.02), aluminio, fachadaX, 3.55, 0, loja);
  add(rb(0.12, 0.1, 11.2, 0.02), aluminio, fachadaX, 0.4, 0, loja);
  const vidroLoja = new THREE.MeshStandardMaterial({ color: 0x9fb7c9, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.28, depthWrite: false });
  const vitrine = add(new THREE.PlaneGeometry(11, 3.1).rotateY(Math.PI / 2), vidroLoja, fachadaX + 0.02, 1.98, 0, loja);
  vitrine.renderOrder = 2;
  // interior: piso, teto iluminado, prateleiras, geladeiras e balcão
  add(new THREE.PlaneGeometry(7.4, 11.4).rotateX(-Math.PI / 2), std(0xd9d4ca, 0.3), -0.4, 0.36, 0, loja);
  const tetoLuz = quente(0xfff1d6, 1.3);
  add(new THREE.PlaneGeometry(7, 11).rotateX(Math.PI / 2), tetoLuz, -0.4, 4.1, 0, loja);
  const txProd = texProdutos();
  const prateleira = [std(0xd1d5db, 0.5), std(0xd1d5db, 0.5), std(0xd1d5db, 0.5), std(0xd1d5db, 0.5), std(0xffffff, 0.6, 0, { map: txProd }), std(0xffffff, 0.6, 0, { map: txProd })];
  for (let i = 0; i < (leve ? 2 : 3); i++) add(rb(0.9, 1.6, 4.2, 0.03), prateleira, 1.4 - i * 1.8, 1.16, -2.4, loja).rotation.y = Math.PI / 2 * 0;
  const txGel = texGeladeira();
  const gelMat = new THREE.MeshBasicMaterial({ map: txGel, color: brilho(0xffffff, 1.2) });
  gelMat.userData.base = [0xffffff, 1.2]; luzesQuentes.push(gelMat);
  add(rb(0.8, 2.4, 6, 0.05), [gelMat, std(0xe5e7eb), std(0xe5e7eb), std(0xe5e7eb), std(0xe5e7eb), std(0xe5e7eb)], -3.9, 1.56, 1.5, loja);
  add(rb(1.1, 1.1, 3, 0.06), std(0x7c2d12, 0.5), 1.8, 0.91, 3.4, loja); // balcão
  add(rb(1.15, 0.06, 3.05, 0.02), std(0x1f2328, 0.3, 0.3), 1.8, 1.49, 3.4, loja);
  // marquise sobre a vitrine, com spots
  add(rb(1.6, 0.18, 12.4, 0.05), std(0x2d3238, 0.5, 0.4), 4.3, 3.95, 0, loja);
  const spot = quente(0xffe2b0, 2.2);
  for (let i = 0; i < 6; i++) add(new THREE.CircleGeometry(0.1, 12).rotateX(Math.PI / 2), spot, 4.6, 3.85, -5 + i * 2, loja);
  // letreiro iluminado em caixa
  const txLet = texLetreiro();
  const letMat = new THREE.MeshBasicMaterial({ map: txLet, color: brilho(0xffffff, 1.25) });
  luzesQuentes.push(letMat); letMat.userData.base = [0xffffff, 1.25];
  add(rb(0.35, 1.8, 7.2, 0.06), [letMat, std(0x2d3238), std(0x2d3238), std(0x2d3238), std(0x2d3238), std(0x2d3238)], 3.3, 5.8, 0, loja);
  // caixa d'água azul no telhado (bem brasileiro)
  add(new THREE.CylinderGeometry(0.9, 0.8, 1.3, 20), std(0x1e5aa8, 0.45), -2.2, 5.5, -3.5, loja);
  add(new THREE.CylinderGeometry(0.95, 0.95, 0.12, 20), std(0x1e5aa8, 0.45), -2.2, 6.2, -3.5, loja);
  // ar-condicionado na lateral, freezer de gelo, lixeiras, banco, extintor
  for (const z of [-3, -0.5]) {
    add(rb(0.35, 0.6, 0.85, 0.04), std(0xe5e7eb, 0.5), -0.4, 3.0, z - 6.18, loja).rotation.y = Math.PI / 2;
  }
  const txGelo = canvasTex(256, 128, (g) => {
    g.fillStyle = "#f8fafc"; g.fillRect(0, 0, 256, 128);
    g.fillStyle = "#1d4ed8"; g.font = "900 64px system-ui"; g.textAlign = "center"; g.fillText("GELO", 128, 82);
  });
  add(rb(0.8, 1.1, 1.6, 0.06), [new THREE.MeshStandardMaterial({ map: txGelo, roughness: 0.4 }), std(0xf8fafc, 0.4), std(0xf8fafc, 0.4), std(0xf8fafc, 0.4), std(0xf8fafc, 0.4), std(0xf8fafc, 0.4)], 4.3, 0.9, -5.6, loja);
  ["#2563eb", "#dc2626", "#16a34a", "#f59e0b"].forEach((c, i) => add(rb(0.45, 0.8, 0.45, 0.05), std(new THREE.Color(c).getHex(), 0.5), 4.5, 0.75, 4.2 + i * 0.52, loja));
  add(rb(0.5, 0.08, 2, 0.03), std(0x8a5a33, 0.6), 4.5, 0.75, -3.3, loja);
  for (const bz of [-4.1, -2.5]) add(rb(0.45, 0.4, 0.08, 0.02), escuro, 4.5, 0.55, bz, loja);
  add(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 12), std(0xdc2626, 0.4), 3.75, 1.2, -5.85, loja);
  sombra(10, 14, -4.4, -2, grupo, 0.6);

  /* ══════════ MOTORHOME ══════════ */
  const mh = new THREE.Group();
  mh.position.set(-1.5, 0, 14); mh.rotation.y = Math.PI - 0.1; // lado do toldo (-x local) virado para a estrada
  grupo.add(mh);
  const L = 2.3; // largura da carroceria
  const pintura = std(0xf3f1ea, 0.32, 0.15);
  const extr = (shape: THREE.Shape, larg: number, bevel = 0.06) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth: larg - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 10 });
    g.rotateY(-Math.PI / 2); // x do perfil -> z; profundidade -> -x
    g.translate(larg / 2 - bevel, 0, 0);
    g.computeVertexNormals();
    return g;
  };
  // perfil da carroceria (z,y) com o "capuchino" sobre a cabine
  const perfil = new THREE.Shape();
  perfil.moveTo(-3.6, 0.72);
  perfil.lineTo(2.25, 0.72);
  perfil.lineTo(2.25, 2.2);
  perfil.lineTo(3.05, 2.28);
  perfil.quadraticCurveTo(3.45, 2.35, 3.42, 2.7);
  perfil.quadraticCurveTo(3.35, 3.12, 2.9, 3.15);
  perfil.lineTo(-3.35, 3.2);
  perfil.quadraticCurveTo(-3.6, 3.2, -3.62, 2.95);
  perfil.lineTo(-3.62, 0.95);
  perfil.quadraticCurveTo(-3.62, 0.72, -3.6, 0.72);
  add(extr(perfil, L), pintura, 0, 0, 0, mh);
  // cabine (chassi tipo van), mais estreita
  const cab = new THREE.Shape();
  cab.moveTo(2.1, 0.5);
  cab.lineTo(4.15, 0.5);
  cab.quadraticCurveTo(4.25, 0.5, 4.25, 0.62);
  cab.lineTo(4.22, 1.1);
  cab.quadraticCurveTo(4.1, 1.3, 3.85, 1.38); // capô
  cab.lineTo(3.35, 2.1);                        // para-brisa
  cab.quadraticCurveTo(3.2, 2.26, 2.95, 2.26);
  cab.lineTo(2.1, 2.26);
  cab.lineTo(2.1, 0.5);
  add(extr(cab, 2.12, 0.08), pintura, 0, 0, 0, mh);
  // saia escura e para-choques
  add(rb(L + 0.02, 0.28, 5.9, 0.06), std(0x3a3f45, 0.6), 0, 0.82, -0.7, mh);
  add(rb(2.2, 0.32, 0.3, 0.1), std(0x2b2f34, 0.55), 0, 0.62, 4.28, mh);
  add(rb(2.3, 0.3, 0.25, 0.08), std(0x2b2f34, 0.55), 0, 0.85, -3.72, mh);
  // grade, faróis, placa
  const txGrade = canvasTex(256, 64, (g) => { g.fillStyle = "#15181c"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#3b4148"; for (let y = 6; y < 64; y += 12) g.fillRect(8, y, 240, 5); });
  add(new THREE.PlaneGeometry(1.1, 0.36), std(0xffffff, 0.5, 0.4, { map: txGrade }), 0, 1.0, 4.235, mh);
  const farol = quente(0xfff6e0, 1.4);
  for (const fx of [-0.78, 0.78]) add(rb(0.42, 0.2, 0.08, 0.04), farol, fx, 1.07, 4.2, mh);
  add(new THREE.PlaneGeometry(0.52, 0.17), new THREE.MeshStandardMaterial({ map: texPlaca(), roughness: 0.4 }), 0, 0.62, 4.44, mh);
  // para-brisa (acompanha a inclinação do perfil da cabine)
  const pb = add(new THREE.PlaneGeometry(1.9, 0.86), vidro, 0, 1.76, 3.63, mh);
  pb.rotation.x = -Math.atan2(2.1 - 1.38, 3.85 - 3.35) + Math.PI / 2;
  // janelas da cabine e retrovisores
  for (const s of [-1, 1]) {
    const jc = add(new THREE.ShapeGeometry(retArred(0.8, 0.55, 0.08)), vidro, s * 1.075, 1.85, 2.72, mh);
    jc.rotation.y = s * Math.PI / 2;
    add(rb(0.08, 0.32, 0.2, 0.03), escuro, s * 1.3, 1.9, 3.35, mh);
    add(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6).rotateZ(Math.PI / 2), escuro, s * 1.18, 1.9, 3.35, mh);
  }
  // decalque lateral e janelas da casa (os dois lados)
  const txDec = texDecal();
  const decMat = new THREE.MeshStandardMaterial({ map: txDec, transparent: true, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
  const moldura = std(0x16191d, 0.6);
  for (const s of [-1, 1]) {
    const dec = add(new THREE.PlaneGeometry(6.8, 1.7), decMat, s * (L / 2 + 0.012), 1.5, -0.3, mh);
    dec.rotation.y = s * Math.PI / 2;
    if (s > 0) dec.scale.x = -1;
    const janelas: [number, number, number, number][] = s < 0 ? [[-2.35, 2.25, 1.3, 0.75], [1.55, 2.25, 0.9, 0.65], [-0.1, 2.3, 0.7, 0.5]] : [[-1.2, 2.25, 1.5, 0.75], [1.2, 2.25, 1.1, 0.7]];
    for (const [jz, jy, jw, jh] of janelas) {
      const m = add(new THREE.ShapeGeometry(retArred(jw + 0.1, jh + 0.1, 0.12)), moldura, s * (L / 2 + 0.015), jy, jz, mh);
      m.rotation.y = s * Math.PI / 2;
      const v = add(new THREE.ShapeGeometry(retArred(jw, jh, 0.1)), vidroCasa, s * (L / 2 + 0.022), jy, jz, mh);
      v.rotation.y = s * Math.PI / 2;
    }
    // bagageiros (portinholas) embaixo
    for (const [bz, bw] of [[-2.6, 0.9], [2.0 * (s < 0 ? -0.3 : 0.4), 0.8]] as [number, number][]) {
      const bag = add(new THREE.ShapeGeometry(retArred(bw, 0.42, 0.06)), std(0xe6e3dc, 0.4), s * (L / 2 + 0.016), 1.18, bz, mh);
      bag.rotation.y = s * Math.PI / 2;
    }
  }
  // porta de entrada no lado do toldo (-x), com janelinha, maçaneta e degrau
  const porta = add(new THREE.ShapeGeometry(retArred(0.72, 1.95, 0.12)), std(0xe9e6de, 0.35), -(L / 2 + 0.02), 1.72, 0.55, mh);
  porta.rotation.y = -Math.PI / 2;
  const jp = add(new THREE.ShapeGeometry(retArred(0.42, 0.5, 0.08)), vidroCasa, -(L / 2 + 0.03), 2.2, 0.55, mh);
  jp.rotation.y = -Math.PI / 2;
  add(rb(0.05, 0.05, 0.2, 0.02), cinzaMetal, -(L / 2 + 0.05), 1.6, 0.8, mh);
  add(rb(0.5, 0.08, 0.7, 0.03), cinzaMetal, -(L / 2 + 0.25), 0.45, 0.55, mh);
  // lanternas traseiras
  const lanterna = quente(0xff2d2d, 1.2);
  for (const lx of [-1.05, 1.05]) add(rb(0.14, 0.7, 0.06, 0.03), lanterna, lx, 1.35, -3.66, mh);
  // teto: ar-condicionado, painéis solares, claraboia, escada
  add(rb(0.8, 0.28, 1.0, 0.1), std(0xf8f8f5, 0.4), 0, 3.34, -1.9, mh);
  const txSolar = texPainelSolar();
  for (const pz of [-0.2, 1.1]) {
    add(rb(1.0, 0.05, 1.2, 0.02), std(0xffffff, 0.25, 0.3, { map: txSolar }), 0.2, 3.27, pz, mh);
  }
  add(rb(0.55, 0.14, 0.55, 0.05), new THREE.MeshStandardMaterial({ color: 0xdfe8ee, roughness: 0.2, transparent: true, opacity: 0.7 }), -0.5, 3.28, -3.0, mh);
  for (const ex of [-0.3, 0.3]) add(new THREE.CylinderGeometry(0.02, 0.02, 2.5, 6), cinzaMetal, ex, 2.0, -3.7, mh);
  for (let i = 0; i < 7; i++) add(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6).rotateZ(Math.PI / 2), cinzaMetal, 0, 1.0 + i * 0.33, -3.7, mh);
  // rodas: pneu com perfil arredondado + aro + caixa de roda escura
  const pneuPerfil: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + (i / 12) * Math.PI; pneuPerfil.push(new THREE.Vector2(0.31 + Math.cos(a) * 0.14, Math.sin(a) * 0.12)); }
  const pneuGeo = new THREE.LatheGeometry(pneuPerfil, 24).rotateZ(Math.PI / 2);
  const aroGeo = mergeGeometries([
    new THREE.CylinderGeometry(0.27, 0.27, 0.2, 24).rotateZ(Math.PI / 2),
    new THREE.CylinderGeometry(0.08, 0.08, 0.26, 12).rotateZ(Math.PI / 2),
  ]);
  const caixaRoda = std(0x0d0f12, 0.9);
  for (const rz of [-2.2, 3.35]) for (const s of [-1, 1]) {
    add(pneuGeo, borracha, s * 1.0, 0.45, rz, mh);
    add(aroGeo, cinzaMetal, s * 1.02, 0.45, rz, mh);
    const arco = add(new THREE.CircleGeometry(0.55, 20, 0, Math.PI), caixaRoda, s * (L / 2 + 0.01), 0.45, rz, mh);
    arco.rotation.y = s * Math.PI / 2;
  }
  sombra(3.4, 9, 0, 0.3, mh, 0.85);

  /* toldo aberto: caixa enrolada, lona com barriga, sanefa e pés */
  const toldoCaixa = add(new THREE.CylinderGeometry(0.09, 0.09, 4.6, 12).rotateX(Math.PI / 2), std(0xd6d3cc, 0.4, 0.3), -(L / 2 + 0.1), 2.95, -0.8, mh);
  toldoCaixa.castShadow = false;
  const txTol = texToldo(); txTol.repeat.set(2, 1);
  const lona = new THREE.PlaneGeometry(4.5, 2.4, 20, 8);
  {
    const lp = lona.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < lp.count; i++) {
      const u = lp.getX(i), v = lp.getY(i) + 1.2; // v: 0 (parede) .. 2.4 (ponta)
      lp.setXYZ(i, -(L / 2 + 0.1) - v, 2.93 - v * 0.26 - Math.sin((v / 2.4) * Math.PI) * 0.08 - Math.cos((u / 4.5) * Math.PI) * 0.03, u);
    }
    lona.computeVertexNormals();
  }
  add(lona, std(0xffffff, 0.8, 0, { map: txTol, side: THREE.DoubleSide }), 0, 0, -0.8, mh);
  add(new THREE.PlaneGeometry(4.5, 0.22).rotateY(-Math.PI / 2), std(0xc96a2b, 0.8, 0, { side: THREE.DoubleSide }), -(L / 2 + 2.52), 2.2, -0.8, mh);
  for (const pz of [-2.95, 1.35]) add(new THREE.CylinderGeometry(0.025, 0.025, 2.3, 8), cinzaMetal, -(L / 2 + 2.45), 1.15, pz, mh);
  // varal de lâmpadas pendendo da ponta do toldo
  const lampVaral = quente(0xffc070, 2.2);
  for (let i = 0; i < 13; i++) {
    const t = i / 12, z = -3 + t * 4.4, y = 2.18 - Math.sin(t * Math.PI) * 0.25;
    add(new THREE.SphereGeometry(0.055, 8, 6), lampVaral, -(L / 2 + 2.5), y - 0.08, z, mh);
  }
  // tapete, mesa dobrável, cadeiras de camping, lampião
  add(new THREE.PlaneGeometry(2.2, 3.2).rotateX(-Math.PI / 2), std(0xffffff, 0.95, 0, { map: texTapete() }), -(L / 2 + 1.3), 0.05, -0.9, mh);
  const mesa = new THREE.Group(); mesa.position.set(-(L / 2 + 1.35), 0, -1.0); mh.add(mesa);
  const cadeiras: THREE.Group[] = [];
  add(rb(0.7, 0.04, 1.1, 0.02), std(0xe5e0d5, 0.5), 0, 0.72, 0, mesa);
  for (const s of [-1, 1]) {
    const perna = add(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6), cinzaMetal, 0, 0.36, s * 0.4, mesa);
    perna.rotation.x = s * 0.35;
    const perna2 = add(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6), cinzaMetal, 0, 0.36, s * 0.4, mesa);
    perna2.rotation.x = -s * 0.35;
  }
  const lampiao = quente(0xffb050, 2.8);
  add(new THREE.CylinderGeometry(0.06, 0.07, 0.18, 10), lampiao, 0.1, 0.84, 0.2, mesa);
  add(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 10), escuro, 0.1, 0.945, 0.2, mesa);
  add(new THREE.CylinderGeometry(0.05, 0.04, 0.1, 10), std(0x1d4ed8, 0.5), -0.15, 0.79, -0.25, mesa); // caneca
  const lona2 = std(0x1d4ed8, 0.85, 0, { side: THREE.DoubleSide });
  for (const [cz, ang] of [[-2.1, 0.3], [0.2, Math.PI - 0.4]] as [number, number][]) {
    const cad = new THREE.Group(); cad.position.set(-(L / 2 + 1.5), 0, cz); cad.rotation.y = ang; mh.add(cad); cadeiras.push(cad);
    const assento = new THREE.PlaneGeometry(0.5, 0.45, 4, 4);
    { const ap = assento.attributes.position as THREE.BufferAttribute; for (let i = 0; i < ap.count; i++) ap.setZ(i, -Math.cos((ap.getX(i) / 0.5) * Math.PI) * 0.04); }
    add(assento.rotateX(-Math.PI / 2), lona2, 0, 0.42, 0, cad);
    const encosto = add(new THREE.PlaneGeometry(0.5, 0.5), lona2, 0, 0.7, -0.24, cad);
    encosto.rotation.x = -0.25;
    for (const [px, pz] of [[-0.25, -0.22], [0.25, -0.22], [-0.25, 0.22], [0.25, 0.22]]) add(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 6), escuro, px, 0.22, pz, cad);
    for (const px of [-0.26, 0.26]) add(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), escuro, px, 0.68, -0.24, cad).rotation.x = -0.25;
  }

  /* luzes que acendem com a noite */
  const luzVaral = new THREE.PointLight(0xffa850, 0, 12, 1.6);
  luzVaral.position.set(-(L / 2 + 1.6), 1.9, -0.9); mh.add(luzVaral);
  const luzCob = new THREE.PointLight(0xfff0d0, 0, 26, 1.3);
  luzCob.position.set(9.5, 4.8, 0); grupo.add(luzCob);
  const luzLoja = new THREE.PointLight(0xffe2b0, 0, 14, 1.5);
  luzLoja.position.set(1.5, 2.5, -2); grupo.add(luzLoja);

  function atualizar(acesas: number) {
    luzVaral.intensity = 10 * acesas;
    luzCob.intensity = 26 * acesas;
    luzLoja.intensity = 18 * acesas;
    vidroCasa.emissiveIntensity = 0.15 + 0.85 * acesas;
    for (const m of luzesQuentes) {
      const [hex, f] = m.userData.base as [number, number];
      m.color.copy(brilho(hex, f * (0.35 + 0.65 * acesas)));
    }
  }
  atualizar(0);
  return { grupo, atualizar, mh, loja, mesa, cadeiras, patioMat, paredeMat, larguraMH: L };
}
