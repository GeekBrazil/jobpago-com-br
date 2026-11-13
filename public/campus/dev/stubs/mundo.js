// STUB de teste do mundo (mesma interface de campus/js/mundo.js, do contrato).
// Só pra a frente de app/UI testar sem depender do mundo de verdade. Visual simples.
const THREE = window.THREE;

const ZONAS = [
  ['escritorio-aberto', 'Escritório aberto'],
  ['biblioteca', 'Biblioteca'],
  ['academia', 'Academia'],
  ['cafe', 'Café'],
  ['auditorio', 'Auditório'],
  ['jardim', 'Jardim'],
  ['observatorio', 'Observatório'],
  ['sala-servidores', 'Sala dos servidores'],
  ['recepcao', 'Recepção'],
  ['estudio', 'Estúdio'],
  ['dormitorio', 'Dormitório'],
];

const ATIV_ZONA = {
  computador: 'escritorio-aberto', 'telefone-andando': 'escritorio-aberto',
  'biblioteca-lendo': 'biblioteca', 'arquivo-cartas': 'biblioteca',
  observatorio: 'observatorio', 'fones-transcrevendo': 'estudio', 'gestos-holograma': 'estudio',
  'quadro-reuniao': 'auditorio', recepcao: 'recepcao', 'fotografando-campo': 'jardim',
  'sala-servidores': 'sala-servidores', 'caixa-registradora': 'cafe',
  esteira: 'academia', halteres: 'academia', yoga: 'academia', alongando: 'academia', bicicleta: 'academia',
  cafe: 'cafe', 'lendo-banco': 'jardim', 'caminhando-jardim': 'jardim',
  dormindo: 'dormitorio',
};

export function criarMundo(scene, renderer, opcoes = {}) {
  const qualidade = opcoes.qualidade || 'celular';
  const R_PAV = 17;
  const zonas = {};
  ZONAS.forEach(([id, nome], i) => {
    const a = (i / ZONAS.length) * Math.PI * 2 + 0.3;
    zonas[id] = { nome, centro: new THREE.Vector3(Math.sin(a) * R_PAV, 0, Math.cos(a) * R_PAV), raio: 4.5, ang: a };
  });
  zonas.praca = { nome: 'Praça', centro: new THREE.Vector3(0, 0, 0), raio: 5, ang: 0 };

  // ---- luz e céu ----
  const hemi = new THREE.HemisphereLight(0xfff1dc, 0x8a7a5a, 0.75);
  scene.add(hemi);
  const sol = new THREE.DirectionalLight(0xffe2b0, 1.0);
  sol.castShadow = true;
  const sm = qualidade === 'pc' ? 2048 : 1024;
  sol.shadow.mapSize.set(sm, sm);
  Object.assign(sol.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 160 });
  sol.shadow.bias = -0.0008;
  scene.add(sol, sol.target);
  scene.fog = new THREE.Fog(0xf6dcc0, 90, 260);

  const mat = (c, extra = {}) => new THREE.MeshLambertMaterial({ color: c, ...extra });

  // ---- chão ----
  const chao = new THREE.Mesh(new THREE.CircleGeometry(220, 64), mat(0x9fb36a));
  chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; scene.add(chao);
  const patio = new THREE.Mesh(new THREE.CircleGeometry(29, 64), mat(0xb4c27a));
  patio.rotation.x = -Math.PI / 2; patio.position.y = 0.01; patio.receiveShadow = true; scene.add(patio);
  const praca = new THREE.Mesh(new THREE.CircleGeometry(5, 48), mat(0xeadbc2));
  praca.rotation.x = -Math.PI / 2; praca.position.y = 0.03; praca.receiveShadow = true; scene.add(praca);
  const anelCaminho = new THREE.Mesh(new THREE.RingGeometry(10.4, 11.6, 72), mat(0xe2cfae));
  anelCaminho.rotation.x = -Math.PI / 2; anelCaminho.position.y = 0.02; anelCaminho.receiveShadow = true; scene.add(anelCaminho);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const r = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 24), mat(0xe2cfae));
    r.rotation.x = -Math.PI / 2; r.rotation.z = a; r.position.set(Math.sin(a) * 17, 0.021, Math.cos(a) * 17);
    r.receiveShadow = true; scene.add(r);
  }
  const lago = new THREE.Mesh(new THREE.CircleGeometry(3.6, 40), mat(0x6aa6c8));
  lago.rotation.x = -Math.PI / 2; lago.position.set(-7, 0.035, 6); scene.add(lago);

  // ---- prédio em anel ----
  const vidro = new THREE.MeshLambertMaterial({ color: 0xcfe3ea, transparent: true, opacity: 0.55 });
  const ext = new THREE.Mesh(new THREE.CylinderGeometry(39, 39, 8, 96, 1, true), vidro);
  ext.position.y = 4; scene.add(ext);
  const int = new THREE.Mesh(new THREE.CylinderGeometry(29, 29, 8, 96, 1, true), vidro);
  int.position.y = 4; scene.add(int);
  const teto = new THREE.Mesh(new THREE.RingGeometry(29, 39, 96), mat(0xf3efe6, { side: THREE.DoubleSide }));
  teto.rotation.x = -Math.PI / 2; teto.position.y = 8; teto.castShadow = true; teto.receiveShadow = true; scene.add(teto);
  const solar = new THREE.Mesh(new THREE.RingGeometry(31, 37, 96), mat(0x34465e, { side: THREE.DoubleSide }));
  solar.rotation.x = -Math.PI / 2; solar.position.y = 8.03; scene.add(solar);

  // ---- pavilhões ----
  for (const [id] of ZONAS) {
    const z = zonas[id];
    const g = new THREE.Group();
    const piso = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 7), mat(id === 'dormitorio' ? 0xd9c7e8 : 0xf1e4cf));
    piso.position.y = 0.06; piso.receiveShadow = true; g.add(piso);
    const tetoP = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.15, 7.4), mat(0xffffff, { transparent: true, opacity: 0.25 }));
    tetoP.position.y = 3.2; g.add(tetoP);
    for (const [x, zz] of [[-4.4, -3.4], [4.4, -3.4], [-4.4, 3.4], [4.4, 3.4]]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), mat(0xffffff));
      col.position.set(x, 1.6, zz); col.castShadow = true; g.add(col);
    }
    g.position.copy(z.centro);
    g.rotation.y = z.ang;
    scene.add(g);
  }

  // ---- árvores ----
  const nArv = qualidade === 'pc' ? 70 : 40;
  const copa = new THREE.InstancedMesh(new THREE.SphereGeometry(1.4, 10, 8), mat(0x5f8a3a), nArv);
  const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.2, 1.6, 6), mat(0x7a5a3a), nArv);
  copa.castShadow = true; tronco.castShadow = true;
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < nArv; i++) {
    const a = (i / nArv) * Math.PI * 2 + Math.sin(i * 7.1) * 0.2;
    const r = i % 2 ? 24 + Math.sin(i) * 2 : 46 + Math.cos(i * 3) * 6;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    m4.makeTranslation(x, 0.8, z); tronco.setMatrixAt(i, m4);
    m4.makeTranslation(x, 2.3, z); copa.setMatrixAt(i, m4);
  }
  scene.add(copa, tronco);

  // ---- quadro de monetização na praça ----
  const quadro = new THREE.Group();
  const placa = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 0.1), mat(0xf2a33a));
  placa.position.y = 1.5; placa.castShadow = true; quadro.add(placa);
  const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6), mat(0x6b4a2a));
  pe.position.y = 0.5; quadro.add(pe);
  quadro.position.set(3.2, 0, -3.2); quadro.rotation.y = -0.6;
  quadro.userData.acao = 'monetizacao';
  scene.add(quadro);

  // ---- postos ----
  const postos = {}; // atividade -> [{pos, rotY, zona, atividade, dono}]
  for (const [ativ, zonaId] of Object.entries(ATIV_ZONA)) {
    const z = zonas[zonaId];
    const n = ativ === 'dormindo' ? 20 : 3;
    const lista = [];
    const fwd = new THREE.Vector3(Math.sin(z.ang), 0, Math.cos(z.ang));
    const lado = new THREE.Vector3(fwd.z, 0, -fwd.x);
    const idx = Object.keys(ATIV_ZONA).filter((k) => ATIV_ZONA[k] === zonaId).indexOf(ativ);
    for (let i = 0; i < n; i++) {
      let p;
      if (ativ === 'dormindo') {
        const col = i % 5, lin = Math.floor(i / 5);
        p = z.centro.clone().addScaledVector(lado, (col - 2) * 1.7).addScaledVector(fwd, (lin - 1.5) * 1.6);
      } else {
        p = z.centro.clone().addScaledVector(lado, (i - 1) * 1.6).addScaledVector(fwd, (idx - 1) * 1.8);
      }
      p.y = ativ === 'esteira' ? 0.18 : 0.12;
      lista.push({ pos: p, rotY: z.ang + Math.PI, zona: zonaId, atividade: ativ, dono: null });
    }
    postos[ativ] = lista;
  }

  function reservarPosto(atividade, slug) {
    liberarPosto(slug);
    let lista = postos[atividade];
    let livre = lista && lista.find((p) => !p.dono);
    if (!livre && lista) {
      const zona = lista[0].zona;
      for (const l of Object.values(postos)) { livre = l.find((p) => !p.dono && p.zona === zona); if (livre) break; }
    }
    if (!livre) return null;
    livre.dono = slug;
    return { pos: livre.pos.clone(), rotY: livre.rotY, zona: livre.zona, atividade: livre.atividade };
  }
  function liberarPosto(slug) {
    for (const l of Object.values(postos)) for (const p of l) if (p.dono === slug) p.dono = null;
  }

  function caminho(de, para) {
    const d = de.distanceTo(para);
    if (d < 7) return [para.clone()];
    const a1 = Math.atan2(de.x, de.z), a2 = Math.atan2(para.x, para.z);
    const pts = [];
    const R = 11;
    pts.push(new THREE.Vector3(Math.sin(a1) * R, 0, Math.cos(a1) * R));
    let da = a2 - a1;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    const passos = Math.max(1, Math.ceil(Math.abs(da) / 0.3));
    for (let i = 1; i < passos; i++) {
      const a = a1 + (da * i) / passos;
      pts.push(new THREE.Vector3(Math.sin(a) * R, 0, Math.cos(a) * R));
    }
    if (Math.hypot(para.x, para.z) < 6) pts.push(new THREE.Vector3(para.x, 0, para.z));
    else pts.push(new THREE.Vector3(Math.sin(a2) * R, 0, Math.cos(a2) * R), para.clone());
    return pts;
  }

  const cor = new THREE.Color();
  function setHora(h) {
    const dia = h >= 6 && h < 18.5;
    const manha = h >= 5 && h < 10;
    const noite = h < 5 || h >= 19.5;
    if (noite) cor.set(0x1d2140); else if (manha) cor.set(0xf8d9b4); else if (dia) cor.set(0xbfdcef); else cor.set(0xf0a878);
    scene.background = cor.clone();
    scene.fog.color.copy(cor);
    const ang = ((h - 6) / 12) * Math.PI;
    sol.position.set(Math.cos(ang) * 60, Math.max(8, Math.sin(ang) * 70), 30);
    sol.intensity = noite ? 0.15 : manha ? 0.95 : 1.05;
    sol.color.set(manha ? 0xffd39a : 0xfff4e0);
    hemi.intensity = noite ? 0.35 : 0.75;
  }
  setHora(8);

  return {
    pontoAllan: new THREE.Vector3(0, 0, 0),
    camerainicial: { pos: new THREE.Vector3(10, 17, 24), alvo: new THREE.Vector3(0, 1, 0) },
    zonas,
    reservarPosto,
    liberarPosto,
    caminho,
    setHora,
    update() {},
    objetosClicaveis: [quadro],
  };
}
