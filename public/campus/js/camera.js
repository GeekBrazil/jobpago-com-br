// Câmera orbital própria (sem addons): 1 dedo gira, pinça dá zoom, 2 dedos arrastam,
// roda do mouse dá zoom, botão direito/shift arrasta. Amortecimento, limites
// (nunca dentro do prédio em anel nem abaixo do chão), toque pra escolher e
// voos suaves (focus / follow / voar).

const T = () => window.THREE;

const ANEL_INTERNO = 27.6;   // pátio interno ~29 m, com folga
const ANEL_EXTERNO = 41.0;   // raio médio 34 + faixa de 10 m / 2, com folga
const TETO_ANEL = 10.5;      // 8 m de prédio + folga
const ALVO_MAX = 30;         // o alvo fica dentro do pátio

function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function lerp(a, b, k) { return a + (b - a) * k; }
function angDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function criarCamera(canvas, opcoes = {}) {
  const THREE = T();
  const camera = new THREE.PerspectiveCamera(opcoes.fov ?? 45, 1, 0.3, 900);
  const alvo = new THREE.Vector3(0, 1, 0);
  const esf = new THREE.Spherical(40, 0.9, 0.6);
  const lim = {
    raioMin: opcoes.raioMin ?? 4.5,
    raioMax: opcoes.raioMax ?? 115,
    phiMin: 0.1,
    phiMax: 1.42,
  };

  // velocidades (amortecidas)
  let vTheta = 0, vPhi = 0, vZoom = 0;
  const vPan = new THREE.Vector3();

  let tween = null;       // { de, para, t, dur, aoFim }
  let seguir = null;      // { obj, raio, altura }
  let offsetY = 0, offsetYAlvo = 0, offsetX = 0, offsetXAlvo = 0;
  let largura = 1, altura = 1;
  let reduzido = !!opcoes.reduzido;
  let habilitada = true;

  const ouvintes = { tap: [], interacao: [] };
  const emitir = (ev, ...a) => ouvintes[ev].forEach((f) => { try { f(...a); } catch (e) { console.error(e); } });

  // ---------- entrada ----------
  const ponteiros = new Map(); // id -> {x, y}
  let toqueInicio = null;      // {x, y, t, id, moveu}
  let pinca = null;            // {dist, mx, my}
  let modoMouse = null;        // 'girar' | 'arrastar'

  function largRef() { return Math.max(300, Math.min(largura, altura)); }

  function girar(dx, dy) {
    const s = (Math.PI * 1.6) / largRef();
    vTheta -= dx * s;
    vPhi -= dy * s * 0.8;
  }

  function arrastar(dx, dy) {
    // move o alvo no plano do chão, proporcional à distância
    const escala = (2 * esf.radius * Math.tan((camera.fov * Math.PI) / 360)) / altura;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    if (dir.lengthSq() < 1e-6) dir.set(-Math.sin(esf.theta), 0, -Math.cos(esf.theta));
    dir.normalize();
    const dirX = new THREE.Vector3(-dir.z, 0, dir.x); // direita da câmera no chão
    // arrastar o mundo: dedo vai pra direita => alvo vai pra esquerda
    vPan.addScaledVector(dirX, -dx * escala);
    vPan.addScaledVector(dir, dy * escala * 1.3);
  }

  function zoom(fator) {
    // fator > 1 afasta
    vZoom += Math.log(fator);
    if (seguir) seguir.raio = null; // quem dá zoom é o Allan

  }

  function cancelarAutomacao() {
    if (tween && !tween.travado) tween = null;
    seguir = null;
  }

  function onDown(e) {
    if (!habilitada) return;
    canvas.setPointerCapture?.(e.pointerId);
    ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ponteiros.size === 1) {
      toqueInicio = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, moveu: false };
      if (e.pointerType === 'mouse') {
        modoMouse = (e.button === 2 || e.shiftKey || e.ctrlKey || e.metaKey) ? 'arrastar' : 'girar';
      }
    } else {
      toqueInicio = null;
      if (ponteiros.size === 2) {
        const [a, b] = [...ponteiros.values()];
        pinca = { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      }
    }
  }

  function onMove(e) {
    const p = ponteiros.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (toqueInicio && toqueInicio.id === e.pointerId) {
      if (Math.hypot(e.clientX - toqueInicio.x, e.clientY - toqueInicio.y) > 8) {
        if (!toqueInicio.moveu) { toqueInicio.moveu = true; emitir('interacao'); }
      }
      if (!toqueInicio.moveu) return;
    }
    if (ponteiros.size === 1) {
      if (e.pointerType === 'mouse' && modoMouse === 'arrastar') { cancelarAutomacao(); arrastar(dx, dy); }
      else { if (tween && !tween.travado) tween = null; girar(dx, dy); }
    } else if (ponteiros.size === 2 && pinca) {
      const [a, b] = [...ponteiros.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if (dist > 10 && pinca.dist > 10) zoom(pinca.dist / dist);
      cancelarAutomacao();
      arrastar(mx - pinca.mx, my - pinca.my);
      pinca = { dist, mx, my };
      emitir('interacao');
    }
  }

  function onUp(e) {
    const ini = toqueInicio;
    ponteiros.delete(e.pointerId);
    if (ponteiros.size < 2) pinca = null;
    if (ponteiros.size === 1) {
      // sobrou um dedo: recomeça o giro dele sem salto
      const [id, p] = [...ponteiros.entries()][0];
      toqueInicio = { x: p.x, y: p.y, t: performance.now(), id, moveu: true };
    } else {
      toqueInicio = null;
    }
    if (ini && ini.id === e.pointerId && !ini.moveu && performance.now() - ini.t < 450 && e.type === 'pointerup') {
      const r = canvas.getBoundingClientRect();
      emitir('tap', { x: e.clientX - r.left, y: e.clientY - r.top, clientX: e.clientX, clientY: e.clientY });
    }
    modoMouse = null;
  }

  function onWheel(e) {
    if (!habilitada) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoom(Math.exp(Math.max(-300, Math.min(300, d)) * 0.0012));
    if (tween && !tween.travado) tween = null;
    emitir('interacao');
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('lostpointercapture', (e) => { if (ponteiros.has(e.pointerId)) onUp(e); });
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- limites ----------
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();

  function limitarAlvo() {
    const h = Math.hypot(alvo.x, alvo.z);
    if (h > ALVO_MAX) { alvo.x *= ALVO_MAX / h; alvo.z *= ALVO_MAX / h; }
    alvo.y = Math.max(0, Math.min(4, alvo.y));
  }

  function limitarEsfera() {
    esf.radius = Math.max(lim.raioMin, Math.min(lim.raioMax, esf.radius));
    esf.phi = Math.max(lim.phiMin, Math.min(lim.phiMax, esf.phi));
    // posição candidata
    tmp.setFromSpherical(esf).add(alvo);
    let yMin = 1.1; // nunca abaixo do chão
    const h = Math.hypot(tmp.x, tmp.z);
    if (h > ANEL_INTERNO && h < ANEL_EXTERNO) yMin = TETO_ANEL;
    else if (h >= ANEL_EXTERNO) yMin = TETO_ANEL + (h - ANEL_EXTERNO) * 0.45;
    if (tmp.y < yMin) {
      tmp.y = yMin;
      tmp2.copy(tmp).sub(alvo);
      esf.setFromVector3(tmp2);
      esf.phi = Math.max(lim.phiMin, Math.min(lim.phiMax, esf.phi));
    }
  }

  // ---------- automação ----------
  function estadoAtual() {
    return { alvo: alvo.clone(), raio: esf.radius, theta: esf.theta, phi: esf.phi };
  }

  function iniciarTween(para, dur, aoFim, travado = false) {
    const de = estadoAtual();
    const p = {
      alvo: para.alvo ? para.alvo.clone() : de.alvo.clone(),
      raio: para.raio ?? de.raio,
      theta: para.theta != null ? de.theta + angDiff(de.theta, para.theta) + (para.voltasExtras || 0) : de.theta,
      phi: para.phi ?? de.phi,
    };
    vTheta = vPhi = vZoom = 0; vPan.set(0, 0, 0);
    tween = { de, para: p, t: 0, dur: reduzido ? Math.min(dur, 0.25) : dur, aoFim, travado };
  }

  function focus(ponto, raio, opts = {}) {
    seguir = null;
    const para = { alvo: ponto.clone ? ponto.clone() : new THREE.Vector3(ponto.x, ponto.y, ponto.z), raio };
    if (opts.phi != null) para.phi = opts.phi;
    if (opts.theta != null) para.theta = opts.theta;
    iniciarTween(para, opts.duracao ?? 0.9, opts.aoFim);
  }

  function follow(obj, opts = {}) {
    seguir = { obj, raio: opts.raio ?? null, altura: opts.altura ?? 1.1 };
  }

  function unfollow() { seguir = null; }

  // voo de abertura: de uma posição (pos/alvo) até outra, girando um pouco
  function voar(de, para, dur = 4.2, aoFim) {
    const v = new THREE.Vector3();
    alvo.copy(de.alvo);
    v.copy(de.pos).sub(de.alvo); esf.setFromVector3(v);
    const s2 = new THREE.Spherical(); v.copy(para.pos).sub(para.alvo); s2.setFromVector3(v);
    iniciarTween({ alvo: para.alvo, raio: s2.radius, theta: s2.theta, phi: s2.phi, voltasExtras: 0 }, dur, aoFim, true);
  }

  function posicionar(pos, alvoNovo) {
    tween = null; seguir = null;
    alvo.copy(alvoNovo);
    tmp.copy(pos).sub(alvoNovo);
    esf.setFromVector3(tmp);
    limitarEsfera();
  }

  // ---------- quadro ----------
  function update(dt) {
    dt = Math.min(dt, 0.05);
    if (tween) {
      vTheta = vPhi = vZoom = 0; vPan.set(0, 0, 0);
      tween.t += dt / tween.dur;
      const k = easeInOut(Math.min(1, tween.t));
      alvo.lerpVectors(tween.de.alvo, tween.para.alvo, k);
      // raio interpola em escala log (fica natural em voo longo)
      esf.radius = Math.exp(lerp(Math.log(tween.de.raio), Math.log(tween.para.raio), k));
      esf.theta = lerp(tween.de.theta, tween.para.theta, k);
      esf.phi = lerp(tween.de.phi, tween.para.phi, k);
      if (tween.t >= 1) {
        const f = tween.aoFim; tween = null;
        f && f();
      }
    } else {
      const k = 1 - Math.exp(-dt * (reduzido ? 30 : 9));
      esf.theta += vTheta * k; vTheta -= vTheta * k;
      esf.phi += vPhi * k; vPhi -= vPhi * k;
      esf.radius *= Math.exp(vZoom * k); vZoom -= vZoom * k;
      alvo.addScaledVector(vPan, k); vPan.multiplyScalar(1 - k);
      if (seguir && seguir.obj) {
        seguir.obj.getWorldPosition(tmp2);
        tmp2.y += seguir.altura;
        const kk = 1 - Math.exp(-dt * 4);
        alvo.lerp(tmp2, kk);
        if (seguir.raio) esf.radius = lerp(esf.radius, seguir.raio, kk * 0.5);
      }
    }
    limitarAlvo();
    limitarEsfera();
    camera.position.setFromSpherical(esf).add(alvo);
    camera.lookAt(alvo);

    // deslocamento da imagem (pra agente ficar fora da folha inferior / lateral)
    if (Math.abs(offsetY - offsetYAlvo) > 0.5 || Math.abs(offsetX - offsetXAlvo) > 0.5) {
      const k = 1 - Math.exp(-dt * (reduzido ? 40 : 8));
      offsetY = lerp(offsetY, offsetYAlvo, k);
      offsetX = lerp(offsetX, offsetXAlvo, k);
      aplicarOffset();
    } else if (offsetY !== offsetYAlvo || offsetX !== offsetXAlvo) { offsetY = offsetYAlvo; offsetX = offsetXAlvo; aplicarOffset(); }
  }

  function aplicarOffset() {
    if (Math.abs(offsetY) < 0.5 && Math.abs(offsetX) < 0.5) camera.clearViewOffset();
    else camera.setViewOffset(largura, altura, offsetX, offsetY, largura, altura);
  }

  function resize(w, h) {
    largura = Math.max(1, w); altura = Math.max(1, h);
    camera.aspect = largura / altura;
    camera.fov = (largura / altura) < 0.7 ? 50 : 42; // retrato pede um pouco mais de campo
    camera.updateProjectionMatrix();
    aplicarOffset();
  }

  // ---------- escolha por toque ----------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function escolher(x, y, objetos) {
    ndc.set((x / largura) * 2 - 1, -(y / altura) * 2 + 1);
    camera.updateMatrixWorld();
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(objetos, true);
  }

  return {
    camera, alvo, esf,
    update, resize, focus, follow, unfollow, voar, posicionar, escolher,
    setOffset(px, py) { offsetXAlvo = px || 0; offsetYAlvo = py || 0; },
    get seguindo() { return seguir?.obj || null; },
    get emVoo() { return !!tween; },
    set reduzido(v) { reduzido = !!v; },
    set habilitada(v) { habilitada = !!v; if (!v) ponteiros.clear(); },
    on(ev, fn) { ouvintes[ev]?.push(fn); },
    distanciaAte(p) { return camera.position.distanceTo(p); },
  };
}
