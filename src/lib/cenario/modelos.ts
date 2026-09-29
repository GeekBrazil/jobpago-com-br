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
    cob: THREE.Group; totem: THREE.Object3D; luzesModelo: THREE.MeshStandardMaterial[];
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
  const nomes = ["motorhome", "posto", "outdoor_table_chair_set_01", "Lantern_01", "propane_tank", "plastic_monobloc_chair_01", "plastic_crate_01", "potted_plant_02"] as const;
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

  /* motorhome e posto modelados no Blender (scripts/cenario/blender/) entram no lugar
     das peças desenhadas em código; as luzes "luz_*" passam a acender com a noite */
  const registrarLuzes = (raiz: THREE.Object3D) => raiz.traverse((o) => {
    const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (mat?.name?.startsWith("luz_") && mat.userData.base === undefined) {
      // a força do Blender é pensada para o Cycles; no site, com bloom, vira névoa — reduz
      const reducao: Record<string, number> = { luz_led: 0.12, luz_spot: 0.15, luz_teto: 0.25, luz_varal: 0.3, luz_letreiro: 0.6, luz_totem: 0.6, luz_geladeira: 0.55, luz_arandela: 0.3, luz_farol: 0.4, luz_janela: 1 };
      mat.userData.base = (mat.emissiveIntensity || 1) * (reducao[mat.name] ?? 0.5);
      a.apoio.luzesModelo.push(mat);
    }
  });
  const esconderFilhos = (g: THREE.Object3D) => g.children.forEach((c) => { if (!(c as THREE.Light).isLight && c.name !== "sombra") c.visible = false; });
  if (m.motorhome) {
    esconderFilhos(mh);
    mh.add(m.motorhome);
    registrarLuzes(m.motorhome);
  }
  if (m.posto) {
    a.apoio.cob.visible = false;
    a.apoio.totem.visible = false;
    esconderFilhos(loja);
    a.apoio.mh.parent?.add(m.posto);
    registrarLuzes(m.posto);
  }
  // embaixo do toldo: conjunto de mesa e cadeiras de verdade no lugar das peças desenhadas
  const conj = colocar(m.outdoor_table_chair_set_01, mh, -(L / 2 + 1.45), 0.05, -0.9, Math.PI / 2);
  if (conj) {
    mesa.visible = false; cadeiras.forEach((c) => (c.visible = false));
    colocar(m.Lantern_01, mh, -(L / 2 + 1.45), 0.05 + conj.altura * 0.62, -0.7, 0.3, 0.8);
  }
  colocar(m.propane_tank, mh, -(L / 2 + 0.45), 0, -3.1, 0.4);
  // frente da loja (coords do grupo da loja): cadeiras de plástico, engradados e vasos
  colocar(m.plastic_monobloc_chair_01, loja, 5.3, 0, -1.6, Math.PI / 2 + 0.3);
  colocar(m.plastic_monobloc_chair_01, loja, 5.35, 0, -0.8, Math.PI / 2 - 0.2);
  const e1 = colocar(m.plastic_crate_01, loja, 4.5, 0.3, 6.9, 0.1);
  if (e1) {
    colocar(m.plastic_crate_01, loja, 4.5, 0.3 + e1.altura, 6.9, -0.15);
    colocar(m.plastic_crate_01, loja, 4.5, 0.3, 7.6, 0.05);
  }
  colocar(m.potted_plant_02, loja, 4.35, 0.3, -6.4, 0);
  colocar(m.potted_plant_02, loja, 4.35, 0.3, 1.1, 1.2);
}
