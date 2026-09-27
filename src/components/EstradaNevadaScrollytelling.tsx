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

    // Estado de scroll interpolado (lerp 120 FPS padrão Creative Lab)
    let currentScroll = 0;
    let targetScroll = 0;
    let scrollVelocity = 0;
    let prevScrollY = 0;
    let time = 0;

    // ── CARREGAMENTO DAS CAMADAS 3D FOTORREALISTAS (CREATIVE LAB STANDARD) ──
    const imgRoad = new Image();
    imgRoad.src = "/images/estrada-nevada-cinema-3d.webp";
    let roadLoaded = false;
    imgRoad.onload = () => {
      roadLoaded = true;
    };

    const imgOutpost = new Image();
    imgOutpost.src = "/images/conveniencia-fundo-portugues.webp";
    let outpostLoaded = false;
    imgOutpost.onload = () => {
      outpostLoaded = true;
    };

    // ── 90 FLAKES DE NEVE 3D COM PROFUNDIDADE Z ──
    const flakes: Snowflake[] = [];
    const NUM_FLAKES = 90;

    function initFlakes(w: number, h: number) {
      flakes.length = 0;
      for (let i = 0; i < NUM_FLAKES; i++) {
        const z = 0.2 + Math.random() * 2.6; // 0.2 (perto/rápido) a 2.8 (longe/lento)
        flakes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          size: (1.6 / z) * (dpr > 1 ? 1.3 : 1),
          vx: (Math.random() - 0.5) * (0.35 / z),
          vy: (0.7 / z) + Math.random() * 0.4,
          alpha: Math.min(0.85, 0.45 / z + 0.2),
        });
      }
    }

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      if (flakes.length === 0) {
        initFlakes(width, height);
      }
    };

    window.addEventListener("resize", resize, { passive: true });
    resize();

    const updateScrollTarget = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      targetScroll = Math.min(Math.max(scrollY / maxScroll, 0), 1);

      scrollVelocity = (scrollY - prevScrollY) * 0.05;
      prevScrollY = scrollY;
    };

    window.addEventListener("scroll", updateScrollTarget, { passive: true });
    updateScrollTarget();
    currentScroll = targetScroll;

    // ── FUNÇÃO DE DESENHO EM COBERTURA PANORÂMICA (OBJECT-FIT: COVER) ──
    function drawCover(
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      targetW: number,
      targetH: number,
      scaleMultiplier = 1,
      offsetX = 0,
      offsetY = 0,
      alpha = 1
    ) {
      if (alpha <= 0) return;
      const imgW = img.naturalWidth || img.width || 1920;
      const imgH = img.naturalHeight || img.height || 1071;
      const ratio = Math.max(targetW / imgW, targetH / imgH) * scaleMultiplier;
      const drawW = imgW * ratio;
      const drawH = imgH * ratio;
      const drawX = (targetW - drawW) * 0.5 + offsetX;
      const drawY = (targetH - drawH) * 0.5 + offsetY;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    }

    // ── LOOP DE RENDERIZAÇÃO 120 FPS NATIVO ──
    const render = () => {
      time += 0.016;

      // Interpolação suave do scroll (lerp 0.08)
      currentScroll += (targetScroll - currentScroll) * 0.08;
      scrollVelocity *= 0.9;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Fundo escuro base obsidian (#060913)
      ctx.fillStyle = "#060913";
      ctx.fillRect(0, 0, width, height);

      // ── CÁLCULO DE TRANSIÇÃO DO SCROLLYTELLING ──
      // 0.0 -> 0.60: Viagem pela Estrada Nevada 3D
      // 0.60 -> 0.82: Aproximação e Crossfade com iluminação de chegada
      // 0.82 -> 1.00: Chegada ao Refúgio, Conveniência e Motorhome em 100% de foco
      const blendOutpost = Math.min(1, Math.max(0, (currentScroll - 0.58) / 0.24));
      const roadAlpha = 1 - blendOutpost;
      const outpostAlpha = blendOutpost;

      // ── CAMADA 1: ESTRADA NEVADA CINEMATOGRÁFICA 3D ──
      if (roadAlpha > 0.005) {
        if (roadLoaded) {
          // Efeito de movimento contínuo da câmera ao longo da estrada
          const roadScale = 1.02 + currentScroll * 0.09;
          const roadPanX = Math.sin(currentScroll * Math.PI) * (width * 0.02);
          const roadPanY = currentScroll * (height * 0.03);

          drawCover(ctx, imgRoad, width, height, roadScale, roadPanX, roadPanY, roadAlpha);
        } else {
          // Gradiente temporário enquanto carrega o webp
          const tempGrad = ctx.createLinearGradient(0, 0, 0, height);
          tempGrad.addColorStop(0, "#0d1b2a");
          tempGrad.addColorStop(1, "#060913");
          ctx.fillStyle = tempGrad;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // ── CAMADA 2: CONVENIÊNCIA, MOTORHOME & JANTAR AO AR LIVRE EM PORTUGUÊS ──
      if (outpostAlpha > 0.005) {
        if (outpostLoaded) {
          // Câmera pousa suavemente no refúgio conforme o usuário chega ao fim da página
          const settleScale = 1.04 - (1 - outpostAlpha) * 0.04;
          const subtleBreathe = Math.sin(time * 0.8) * 2;
          const outpostPanY = (1 - outpostAlpha) * 35 + subtleBreathe;

          drawCover(ctx, imgOutpost, width, height, settleScale, 0, outpostPanY, outpostAlpha);

          // Brilho volumétrico quente dos letreiros da conveniência e lâmpadas do motorhome
          const warmPulse = 0.18 + Math.sin(time * 1.5) * 0.05;
          const warmGlow = ctx.createRadialGradient(
            width * 0.38,
            height * 0.45,
            20,
            width * 0.38,
            height * 0.45,
            width * 0.55
          );
          warmGlow.addColorStop(0, `rgba(245, 158, 11, ${(warmPulse * outpostAlpha).toFixed(3)})`);
          warmGlow.addColorStop(0.4, `rgba(234, 88, 12, ${(warmPulse * 0.6 * outpostAlpha).toFixed(3)})`);
          warmGlow.addColorStop(1, "transparent");

          ctx.fillStyle = warmGlow;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // ── CAMADA 3: PARTÍCULAS DE NEVE 3D COM FÍSICA E SCROLL-ACCELERATION ──
      for (const flake of flakes) {
        flake.y += flake.vy + Math.abs(scrollVelocity) * 1.8;
        flake.x += flake.vx + Math.sin(time * 1.2 + flake.z * 5) * (0.35 / flake.z);

        if (flake.y > height + 20) {
          flake.y = -20;
          flake.x = Math.random() * width;
        } else if (flake.y < -20) {
          flake.y = height + 20;
        }

        if (flake.x > width + 20) flake.x = -20;
        else if (flake.x < -20) flake.x = width + 20;

        ctx.fillStyle = `rgba(248, 250, 252, ${flake.alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── CAMADA 4: VIGNETTE & CONTRASTE DINÂMICO CREATIVE LAB ──
      // No topo e meio do site, a vinheta dá alto contraste aos textos editoriais.
      // No final do site (Refúgio da Estrada), o centro fica limpo e desobstruído.
      const vignetteCenterAlpha = currentScroll > 0.8 ? 0.12 : 0.45;
      const vignetteEdgeAlpha = currentScroll > 0.8 ? 0.65 : 0.85;

      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.35,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, `rgba(6, 9, 19, ${vignetteCenterAlpha})`);
      vignette.addColorStop(1, `rgba(6, 9, 19, ${vignetteEdgeAlpha})`);

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateScrollTarget);
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
