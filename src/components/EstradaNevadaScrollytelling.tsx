"use client";

import { useEffect, useRef } from "react";

interface Snowflake {
  x: number;
  y: number;
  z: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
}

interface Tree {
  distance: number;
  side: -1 | 1;
  offset: number;
  scale: number;
}

export default function EstradaNevadaScrollytelling() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Estado de scroll interpolado (lerp a 120 FPS)
    let currentScroll = 0;
    let targetScroll = 0;
    let scrollVelocity = 0;
    let prevScrollY = 0;
    let time = 0;

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    };

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      targetScroll = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      const delta = Math.abs(scrollY - prevScrollY);
      scrollVelocity = Math.min(delta / 15, 4);
      prevScrollY = scrollY;
    };

    handleResize();
    handleScroll();

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Flocos de neve 3D
    const FLAKES_COUNT = 140;
    const flakes: Snowflake[] = [];
    for (let i = 0; i < FLAKES_COUNT; i++) {
      flakes.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 1200 - 600,
        z: Math.random() * 800 + 50,
        size: Math.random() * 2.2 + 0.8,
        vx: (Math.random() - 0.5) * 0.4,
        vy: Math.random() * 0.8 + 0.6,
        alpha: Math.random() * 0.6 + 0.3,
      });
    }

    // Árvores de pinheiro nas margens da estrada
    const trees: Tree[] = [];
    for (let i = 0; i < 30; i++) {
      trees.push({
        distance: (i / 30) * 1200,
        side: i % 2 === 0 ? -1 : 1,
        offset: 1.25 + Math.random() * 0.8,
        scale: 0.8 + Math.random() * 0.5,
      });
    }

    // Estrelas discretas no céu mediterrâneo
    const stars: Array<{ x: number; y: number; r: number; twinkle: number }> = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.45,
        r: Math.random() * 1.2 + 0.4,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      time += 0.012;
      // Interpolação suave do scroll (lerp desacoplado)
      currentScroll += (targetScroll - currentScroll) * 0.055;
      scrollVelocity *= 0.92;

      ctx.save();
      ctx.scale(dpr, dpr);

      const horizonY = height * 0.48;
      const roadTravel = currentScroll * 2200 + time * 28;

      // ── 1. CÉU COSTA AMALFITANA (Dusk / Sunset profundo) ──
      // Gradiente: Azul Mediterrâneo Meia-Noite -> Safira Crepúsculo -> Brilho Terracotta / Pôr do Sol
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY + 20);
      skyGrad.addColorStop(0, "#030611");      // Noite profunda
      skyGrad.addColorStop(0.38, "#091328");   // Safira crepuscular
      skyGrad.addColorStop(0.72, "#19243c");   // Céu alpino superior
      skyGrad.addColorStop(0.88, "#7c2d12");   // Terracotta quente de Positano
      skyGrad.addColorStop(0.96, "#ea580c");   // Laranja pôr do sol
      skyGrad.addColorStop(1, "#f59e0b");      // Sol Limoncello dourado no horizonte
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY + 25);

      // Estrelas no céu superior
      for (const s of stars) {
        const sx = s.x * width;
        const sy = s.y * height;
        const alpha = 0.3 + 0.5 * Math.sin(time * 2 + s.twinkle);
        ctx.fillStyle = `rgba(248, 250, 252, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Brilho solar no ponto de fuga do horizonte
      const sunX = width * 0.5 + Math.sin(currentScroll * 4) * 80;
      const sunGlow = ctx.createRadialGradient(
        sunX,
        horizonY,
        5,
        sunX,
        horizonY,
        width * 0.45
      );
      sunGlow.addColorStop(0, "rgba(251, 191, 36, 0.45)");
      sunGlow.addColorStop(0.25, "rgba(234, 88, 12, 0.25)");
      sunGlow.addColorStop(0.6, "rgba(124, 45, 18, 0.1)");
      sunGlow.addColorStop(1, "transparent");
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, horizonY - 140, width, 180);

      // ── 2. MONTANHAS ALPINAS NEVADAS (Parallax duplo) ──
      // Montanhas de fundo
      const drawMountains = (
        baseY: number,
        hScale: number,
        colorFill: string,
        snowColor: string,
        freq: number,
        shift: number
      ) => {
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 0; x <= width; x += 16) {
          const nx = (x + shift) * freq;
          const peak =
            Math.sin(nx * 0.003) * 60 +
            Math.cos(nx * 0.007) * 35 +
            Math.sin(nx * 0.015) * 18;
          const my = baseY - Math.abs(peak) * hScale;
          ctx.lineTo(x, my);
        }
        ctx.lineTo(width, baseY);
        ctx.closePath();
        ctx.fillStyle = colorFill;
        ctx.fill();

        // Linha de neve no topo
        ctx.strokeStyle = snowColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      };

      // Cordilheira distante (azul ardósia + neve dourada pelo pôr do sol)
      drawMountains(
        horizonY + 6,
        1.3,
        "#0f172a",
        "rgba(254, 215, 170, 0.65)",
        0.7,
        currentScroll * 180
      );

      // Cordilheira média (silhueta rochosa escura com neve branca-azulada)
      drawMountains(
        horizonY + 12,
        0.85,
        "#131d33",
        "rgba(226, 232, 240, 0.75)",
        1.2,
        currentScroll * 380 + 200
      );

      // ── 3. ESTRADA NEVADA PROCEDURAL (Projeção 3D) ──
      // O chão abaixo do horizonte é preenchido com a camada base de neve fria
      const snowGroundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      snowGroundGrad.addColorStop(0, "#141c2c");     // Neve distante no crepúsculo
      snowGroundGrad.addColorStop(0.3, "#1b253b");
      snowGroundGrad.addColorStop(0.65, "#1f2a42");
      snowGroundGrad.addColorStop(1, "#182238");     // Neve próxima
      ctx.fillStyle = snowGroundGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Curvatura paramétrica da estrada
      const getRoadCurve = (z: number) => {
        const offset = z + roadTravel;
        return (
          Math.sin(offset * 0.0016) * 320 +
          Math.cos(offset * 0.0008) * 160 +
          Math.sin(currentScroll * 3.14) * 80
        );
      };

      const SEGMENTS = 90;
      const roadPoints: Array<{
        screenY: number;
        screenX: number;
        roadW: number;
        snowBankW: number;
        z: number;
      }> = [];

      for (let i = SEGMENTS; i >= 1; i--) {
        const p = i / SEGMENTS;
        // z vai de longe (1000) até perto (25)
        const z = p * p * 950 + 22;
        const scale = 380 / z;
        const screenY = horizonY + (height - horizonY) * Math.pow(1 - p, 1.9);
        const curveX = getRoadCurve(z);
        const screenX = width * 0.5 + curveX * scale * 0.75;
        const roadW = Math.max(width * 0.58 * scale, 6);
        const snowBankW = roadW * 1.35;

        roadPoints.push({ screenY, screenX, roadW, snowBankW, z });
      }

      // Desenhar segmentos da estrada e bancos de neve de trás para frente
      for (let i = 0; i < roadPoints.length - 1; i++) {
        const p1 = roadPoints[i];
        const p2 = roadPoints[i + 1];

        // 3a. Bancos de Neve Laterais (Branco e azulado com reflexo quente)
        const bankGrad = ctx.createLinearGradient(0, p1.screenY, 0, p2.screenY);
        bankGrad.addColorStop(0, "rgba(203, 213, 225, 0.45)");
        bankGrad.addColorStop(1, "rgba(241, 245, 249, 0.7)");

        ctx.fillStyle = bankGrad;
        ctx.beginPath();
        ctx.moveTo(p1.screenX - p1.snowBankW, p1.screenY);
        ctx.lineTo(p1.screenX + p1.snowBankW, p1.screenY);
        ctx.lineTo(p2.screenX + p2.snowBankW, p2.screenY);
        ctx.lineTo(p2.screenX - p2.snowBankW, p2.screenY);
        ctx.closePath();
        ctx.fill();

        // 3b. Asfalto Úmido / Gelo Negro (Cinza escuro com reflexo de pôr do sol)
        const asphaltGrad = ctx.createLinearGradient(0, p1.screenY, 0, p2.screenY);
        asphaltGrad.addColorStop(0, "#131926");
        asphaltGrad.addColorStop(1, "#1a2334");

        ctx.fillStyle = asphaltGrad;
        ctx.beginPath();
        ctx.moveTo(p1.screenX - p1.roadW * 0.5, p1.screenY);
        ctx.lineTo(p1.screenX + p1.roadW * 0.5, p1.screenY);
        ctx.lineTo(p2.screenX + p2.roadW * 0.5, p2.screenY);
        ctx.lineTo(p2.screenX - p2.roadW * 0.5, p2.screenY);
        ctx.closePath();
        ctx.fill();

        // 3c. Faixas Laterais da Pista (Branco Refletivo)
        const edgeW = Math.max(p2.roadW * 0.04, 1.2);
        ctx.fillStyle = "rgba(248, 250, 252, 0.75)";
        // Esquerda
        ctx.fillRect(p2.screenX - p2.roadW * 0.5, p2.screenY, edgeW, p1.screenY - p2.screenY + 1);
        // Direita
        ctx.fillRect(p2.screenX + p2.roadW * 0.5 - edgeW, p2.screenY, edgeW, p1.screenY - p2.screenY + 1);

        // 3d. Faixa Central Tracejada — Ouro Limoncello / Amalfi Sun (#f59e0b)
        const dashCycle = (p1.z + roadTravel * 1.5) % 80;
        if (dashCycle < 42) {
          const centerW = Math.max(p2.roadW * 0.035, 1.5);
          ctx.fillStyle = "rgba(245, 158, 11, 0.85)"; // Âmbar Amalfi vibrante
          ctx.shadowColor = "rgba(245, 158, 11, 0.5)";
          ctx.shadowBlur = 6;
          ctx.fillRect(
            p2.screenX - centerW * 0.5,
            p2.screenY,
            centerW,
            p1.screenY - p2.screenY + 1
          );
          ctx.shadowBlur = 0;
        }

        // 3e. Delineadores / Balizadores de Neve com Refletor Laranja Terracotta
        if (Math.floor((p1.z + roadTravel) / 90) !== Math.floor((p2.z + roadTravel) / 90)) {
          const postH = Math.max(34 * (300 / p2.z), 3);
          const postW = Math.max(3 * (300 / p2.z), 1);
          // Balizador esquerdo
          ctx.fillStyle = "#e2e8f0";
          ctx.fillRect(p2.screenX - p2.snowBankW * 0.85, p2.screenY - postH, postW, postH);
          // Refletor terracotta
          ctx.fillStyle = "#ea580c";
          ctx.fillRect(
            p2.screenX - p2.snowBankW * 0.85,
            p2.screenY - postH + postH * 0.25,
            postW,
            postH * 0.35
          );

          // Balizador direito
          ctx.fillStyle = "#e2e8f0";
          ctx.fillRect(p2.screenX + p2.snowBankW * 0.85 - postW, p2.screenY - postH, postW, postH);
          ctx.fillStyle = "#ea580c";
          ctx.fillRect(
            p2.screenX + p2.snowBankW * 0.85 - postW,
            p2.screenY - postH + postH * 0.25,
            postW,
            postH * 0.35
          );
        }
      }

      // ── 4. PINHEIROS NEVADOS AO LONGO DA ESTRADA ──
      for (const tree of trees) {
        // Distância animada que se aproxima com o scroll
        const currentDist = (tree.distance - (roadTravel % 1200) + 1200) % 1200;
        if (currentDist < 30 || currentDist > 900) continue;

        const p = currentDist / 900;
        const scale = (350 / currentDist) * tree.scale;
        const treeY = horizonY + (height - horizonY) * Math.pow(1 - p, 1.85);
        const curveX = getRoadCurve(currentDist);
        const roadW = Math.max(width * 0.58 * scale, 6);
        const treeX =
          width * 0.5 +
          curveX * scale * 0.75 +
          tree.side * (roadW * tree.offset);

        const treeH = 95 * scale;
        const treeW = 42 * scale;

        if (treeY < horizonY || treeY > height + 50) continue;

        // Desenhar pinheiro em camadas com neve
        ctx.fillStyle = "#0c1322"; // Sombra do pinheiro
        ctx.beginPath();
        ctx.moveTo(treeX, treeY - treeH);
        ctx.lineTo(treeX + treeW * 0.5, treeY);
        ctx.lineTo(treeX - treeW * 0.5, treeY);
        ctx.closePath();
        ctx.fill();

        // Camada de neve no pinheiro (com tom quente de pôr do sol)
        ctx.fillStyle = "rgba(241, 245, 249, 0.85)";
        ctx.beginPath();
        ctx.moveTo(treeX, treeY - treeH);
        ctx.lineTo(treeX + treeW * 0.3, treeY - treeH * 0.5);
        ctx.lineTo(treeX - treeW * 0.3, treeY - treeH * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(treeX, treeY - treeH * 0.55);
        ctx.lineTo(treeX + treeW * 0.45, treeY - treeH * 0.15);
        ctx.lineTo(treeX - treeW * 0.45, treeY - treeH * 0.15);
        ctx.closePath();
        ctx.fill();
      }

      // ── 5. FLAKES DE NEVE 3D REATIVOS AO SCROLLYTELLING ──
      for (const flake of flakes) {
        // Velocidade aumentada pelo scroll
        flake.y += flake.vy + scrollVelocity * 1.5;
        flake.x += flake.vx + Math.sin(time + flake.z) * 0.5;

        // Se sair da tela, reciclar no topo
        if (flake.y > height * 0.5 + 500) {
          flake.y = -200;
          flake.x = Math.random() * width * 1.6 - width * 0.3;
        }

        const fScale = 300 / flake.z;
        const fx = width * 0.5 + flake.x * fScale;
        const fy = height * 0.5 + flake.y * fScale;
        const fr = flake.size * fScale;

        if (fx >= -20 && fx <= width + 20 && fy >= 0 && fy <= height + 20) {
          ctx.fillStyle = `rgba(255, 255, 255, ${flake.alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(fx, fy, Math.max(fr, 0.6), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Névoa volumétrica suave rente ao chão (Soft vignette)
      const fogGrad = ctx.createLinearGradient(0, height - 120, 0, height);
      fogGrad.addColorStop(0, "rgba(6, 9, 19, 0)");
      fogGrad.addColorStop(1, "rgba(6, 9, 19, 0.7)");
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, height - 120, width, 120);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
