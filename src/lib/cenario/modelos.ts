/* Modelos e texturas fotográficas do Poly Haven (CC0, polyhaven.com), comprimidos
   em public/cenario/ (GLB com meshopt + WebP 512). Carregam depois que o cenário
   já está na tela e só trocam o que existe: se algo falhar, fica a versão desenhada. */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { asfaltoFoto } from "./texturas";

const BASE = "/cenario";

function imagem(url: string) {
  return new Promise<HTMLImageElement>((ok, erro) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = erro;
    i.src = url;
  });
}

function tex(img: HTMLImageElement, srgb: boolean, rx: number, ry: number) {
  const t = new THREE.Texture(img);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export interface Alvos {
  uTerreno: { tAreia: { value: THREE.Texture } };
  estradaMat: THREE.MeshStandardMaterial;
  T: number;
  apoio: {
    mh: THREE.Group; loja: THREE.Group; mesa: THREE.Group; cadeiras: THREE.Group[];
    patioMat: THREE.MeshStandardMaterial; paredeMat: THREE.MeshStandardMaterial; larguraMH: number;
  };
}

export async function carregarFotos(a: Alvos) {
  const par = (nome: string) => Promise.all([imagem(`${BASE}/tex/${nome}_Diffuse.webp`), imagem(`${BASE}/tex/${nome}_nor_gl.webp`)]);
  // areia e reboco fotográficos foram testados e saíram: repetiam manchas / escureciam a loja
  const [asfalto, concreto] = await Promise.allSettled([par("asphalt_02"), par("concrete_pavement")]);

  if (asfalto.status === "fulfilled") {
    const f = asfaltoFoto(asfalto.value[0], asfalto.value[1], a.T);
    f.cor.wrapS = f.normal.wrapS = THREE.ClampToEdgeWrapping;
    a.estradaMat.map = f.cor; a.estradaMat.normalMap = f.normal; a.estradaMat.needsUpdate = true;
  }
  if (concreto.status === "fulfilled") {
    a.apoio.patioMat.map = tex(concreto.value[0], true, 14, 13);
    a.apoio.patioMat.normalMap = tex(concreto.value[1], false, 14, 13);
    a.apoio.patioMat.needsUpdate = true;
  }
}

export async function carregarModelos(a: Alvos) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const carregar = (nome: string) => loader.loadAsync(`${BASE}/mod/${nome}.glb`).then((g) => g.scene);
  const nomes = ["outdoor_table_chair_set_01", "Lantern_01", "propane_tank", "plastic_monobloc_chair_01", "plastic_crate_01", "potted_plant_02", "rollershutter_door"] as const;
  const res = await Promise.allSettled(nomes.map(carregar));
  const m: Partial<Record<(typeof nomes)[number], THREE.Object3D>> = {};
  res.forEach((r, i) => { if (r.status === "fulfilled") m[nomes[i]] = r.value; });

  /** coloca uma cópia apoiada no chão (base em y=0), centrada em x/z */
  const caixa = new THREE.Box3(), tam = new THREE.Vector3(), centro = new THREE.Vector3();
  const colocar = (orig: THREE.Object3D | undefined, pai: THREE.Object3D, x: number, y: number, z: number, rotY = 0, escala = 1) => {
    if (!orig) return null;
    const o = orig.clone(true);
    const embrulho = new THREE.Group();
    o.scale.setScalar(escala);
    embrulho.add(o);
    caixa.setFromObject(o); caixa.getSize(tam); caixa.getCenter(centro);
    o.position.set(-centro.x, -caixa.min.y, -centro.z);
    embrulho.position.set(x, y, z);
    embrulho.rotation.y = rotY;
    pai.add(embrulho);
    return { obj: embrulho, altura: tam.y };
  };

  const { mh, loja, mesa, cadeiras, larguraMH: L } = a.apoio;
  // embaixo do toldo: conjunto de mesa e cadeiras de verdade no lugar das peças desenhadas
  const conj = colocar(m.outdoor_table_chair_set_01, mh, -(L / 2 + 1.45), 0.05, -0.9, Math.PI / 2);
  if (conj) {
    mesa.visible = false; cadeiras.forEach((c) => (c.visible = false));
    colocar(m.Lantern_01, mh, -(L / 2 + 1.45), 0.05 + conj.altura * 0.62, -0.7, 0.3, 0.8);
  }
  colocar(m.propane_tank, mh, -(L / 2 + 0.45), 0, -3.1, 0.4);
  // frente da loja: cadeiras de plástico, engradados, vasos e a porta de enrolar
  colocar(m.plastic_monobloc_chair_01, loja, 5.2, 0.35, -1.4, Math.PI / 2 + 0.3);
  colocar(m.plastic_monobloc_chair_01, loja, 5.3, 0.35, -0.4, Math.PI / 2 - 0.2);
  const e1 = colocar(m.plastic_crate_01, loja, 4.5, 0.35, 6.9, 0.1);
  if (e1) {
    colocar(m.plastic_crate_01, loja, 4.5, 0.35 + e1.altura, 6.9, -0.15);
    colocar(m.plastic_crate_01, loja, 4.5, 0.35, 7.6, 0.05);
  }
  colocar(m.potted_plant_02, loja, 4.4, 0.35, -6.4, 0);
  colocar(m.potted_plant_02, loja, 4.4, 0.35, 6.3, 1.2);
  colocar(m.rollershutter_door, loja, -1.6, 0, 6.03, 0);
}
