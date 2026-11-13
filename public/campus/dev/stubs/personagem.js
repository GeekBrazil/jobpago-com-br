// STUB de teste da personagem (mesma interface de campus/js/personagem.js, do contrato).
// Bonequinha simples: corpo em cápsula, cabeça, cabelo, anel de destaque.
const THREE = window.THREE;

export const ATIVIDADES = [
  'computador', 'biblioteca-lendo', 'telefone-andando', 'observatorio', 'fones-transcrevendo', 'quadro-reuniao',
  'recepcao', 'fotografando-campo', 'sala-servidores', 'arquivo-cartas', 'gestos-holograma', 'caixa-registradora',
  'esteira', 'halteres', 'yoga', 'cafe', 'lendo-banco', 'caminhando-jardim', 'alongando', 'bicicleta',
  'dormindo', 'andando', 'parada', 'acenando', 'falando',
];

const SENTADA = new Set(['computador', 'biblioteca-lendo', 'fones-transcrevendo', 'cafe', 'lendo-banco', 'bicicleta']);

export function criarPersonagem(ficha, opcoes = {}) {
  const alt = 1.65 * (ficha.altura || 1);
  const group = new THREE.Group();
  const corpo = new THREE.Group();
  group.add(corpo);

  const lamb = (c) => new THREE.MeshLambertMaterial({ color: c });
  const matRoupa = lamb(ficha.roupaTrabalho?.corPrincipal || '#ddd');
  const matPerna = lamb(ficha.roupaTrabalho?.corSecundaria || '#555');
  const matPele = lamb(ficha.pele || '#f2d0b8');
  const matCabelo = lamb(ficha.cabelo?.cor || '#333');

  const pernas = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, alt * 0.38, 4, 8), matPerna);
  pernas.position.y = alt * 0.26; pernas.castShadow = true; corpo.add(pernas);
  const tronco = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, alt * 0.22, 4, 10), matRoupa);
  tronco.position.y = alt * 0.62; tronco.castShadow = true; corpo.add(tronco);
  const braco = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, alt * 0.25, 3, 6), matRoupa);
  braco.position.set(0.22, alt * 0.62, 0); corpo.add(braco);
  const braco2 = braco.clone(); braco2.position.x = -0.22; corpo.add(braco2);
  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), matPele);
  cabeca.position.y = alt * 0.88; cabeca.castShadow = true; corpo.add(cabeca);
  const cabelo = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), matCabelo);
  cabelo.position.set(0, alt * 0.9, -0.02); corpo.add(cabelo);
  const rabo = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.35, 3, 6), matCabelo);
  rabo.position.set(0, alt * 0.75, -0.14); corpo.add(rabo);
  const olho = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), lamb(ficha.olhos || '#333'));
  olho.position.set(0.05, alt * 0.89, 0.135); corpo.add(olho);
  const olho2 = olho.clone(); olho2.position.x = -0.05; corpo.add(olho2);

  const anel = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 40), new THREE.MeshBasicMaterial({ color: ficha.accentHex || '#f2a33a', transparent: true, opacity: 0.85 }));
  anel.rotation.x = -Math.PI / 2; anel.position.y = 0.04; anel.visible = false; group.add(anel);

  const hitbox = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.38, alt - 0.6, 4, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hitbox.position.y = alt / 2; hitbox.userData.slug = ficha.slug; corpo.add(hitbox);

  let atividade = 'parada';
  let rota = null, aoChegar = null;
  let falando = false;
  const v = new THREE.Vector3();

  function setRoupa(tipo) {
    if (tipo === 'academia') { matRoupa.color.set(ficha.roupaAcademia?.corTop || '#f66'); matPerna.color.set(ficha.roupaAcademia?.corLegging || '#333'); }
    else if (tipo === 'pijama') { matRoupa.color.set('#c9b8e8'); matPerna.color.set('#a99ad0'); }
    else { matRoupa.color.set(ficha.roupaTrabalho?.corPrincipal || '#ddd'); matPerna.color.set(ficha.roupaTrabalho?.corSecundaria || '#555'); }
  }

  function setAtividade(nome) {
    atividade = nome;
    corpo.rotation.set(0, 0, 0); corpo.position.set(0, 0, 0);
    if (nome === 'dormindo') { corpo.rotation.x = -Math.PI / 2; corpo.position.set(0, 0.32 + 0.15, 0.8); }
    else if (SENTADA.has(nome)) corpo.position.y = -0.25;
  }

  function andarPara(pontos, cb) {
    rota = (pontos || []).map((p) => p.clone());
    aoChegar = cb || null;
    setAtividade('andando');
    if (!rota.length) { const f = aoChegar; rota = null; aoChegar = null; f && f(); }
  }

  function olharPara(p) {
    v.copy(p).sub(group.position);
    group.rotation.y = Math.atan2(v.x, v.z);
  }

  function update(dt, t) {
    if (rota && rota.length) {
      const alvo = rota[0];
      v.set(alvo.x - group.position.x, 0, alvo.z - group.position.z);
      const d = v.length();
      const passo = 1.3 * dt;
      if (d <= passo) {
        group.position.x = alvo.x; group.position.z = alvo.z; group.position.y = alvo.y || 0;
        rota.shift();
        if (!rota.length) { rota = null; const f = aoChegar; aoChegar = null; setAtividade('parada'); f && f(); }
      } else {
        v.multiplyScalar(passo / d);
        group.position.add(v);
        group.position.y = 0;
        const alvoRot = Math.atan2(v.x, v.z);
        let dr = alvoRot - group.rotation.y;
        while (dr > Math.PI) dr -= Math.PI * 2; while (dr < -Math.PI) dr += Math.PI * 2;
        group.rotation.y += dr * Math.min(1, dt * 10);
        corpo.position.y = Math.abs(Math.sin(t * 9)) * 0.04;
      }
    } else if (atividade === 'acenando') {
      braco.rotation.z = 2.4 + Math.sin(t * 10) * 0.4; braco.position.y = alt * 0.8;
    } else if (atividade === 'esteira' || atividade === 'caminhando-jardim' || atividade === 'telefone-andando') {
      corpo.position.y = Math.abs(Math.sin(t * 8)) * 0.03;
    } else if (atividade !== 'dormindo') {
      braco.rotation.z = 0; braco.position.y = alt * 0.62;
      tronco.scale.y = 1 + Math.sin(t * 2) * 0.01;
    }
    if (falando) cabeca.scale.y = 1 + Math.abs(Math.sin(t * 18)) * 0.05; else cabeca.scale.y = 1;
  }

  return {
    slug: ficha.slug, ficha, group, hitbox, cabeca,
    setAtividade, setRoupa, andarPara, olharPara,
    setFalando(b) { falando = !!b; },
    setDestaque(b) { anel.visible = !!b; },
    update,
    dispose() { group.traverse((o) => { o.geometry?.dispose?.(); }); },
  };
}
