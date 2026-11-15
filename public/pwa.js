/* Registro automático de Service Worker + Botão Instalar App no Celular (PWA) */
(function () {
  "use strict";
  if (typeof window === "undefined" || window.__pwaInitDone) return;
  window.__pwaInitDone = true;

  var isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  var basePath = location.pathname.indexOf("/cassarosa") === 0 ? "/cassarosa" : "";
  var swUrl = basePath + "/sw.js";

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register(swUrl).catch(function () {});
    });
  }

  if (isStandalone) return;
  try {
    if (sessionStorage.getItem("pwa_bar_closed") === "1") return;
  } catch (e) {}

  var deferredPrompt = null;
  var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream;
  var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  function mountInstallPill() {
    if (document.getElementById("ac-pwa-pill")) return;
    var wrap = document.createElement("div");
    wrap.id = "ac-pwa-pill";
    wrap.innerHTML =
      "<style>" +
      "#ac-pwa-pill{position:fixed;left:14px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:2147482000;display:flex;align-items:center;gap:6px;background:rgba(10,15,28,0.92);color:#fff;border:1px solid rgba(255,255,255,0.18);border-radius:999px;padding:7px 11px 7px 13px;font:600 12px/1.2 system-ui,-apple-system,sans-serif;box-shadow:0 10px 26px rgba(0,0,0,0.35);backdrop-filter:blur(10px)}" +
      "#ac-pwa-pill button.ac-pwa-go{border:0;background:none;color:#fff;font:700 12px/1.2 system-ui,-apple-system,sans-serif;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:6px}" +
      "#ac-pwa-pill button.ac-pwa-x{border:0;background:rgba(255,255,255,0.12);color:#cbd5e1;width:20px;height:20px;border-radius:50%;font-size:13px;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;margin-left:2px}" +
      "#ac-pwa-ios-modal{position:fixed;inset:0;z-index:2147483001;background:rgba(6,10,20,0.68);display:flex;align-items:flex-end;justify-content:center;padding:16px;font:14px/1.45 system-ui,-apple-system,sans-serif}" +
      "#ac-pwa-ios-modal .card{background:#0f172a;color:#f8fafc;border:1px solid rgba(255,255,255,0.16);border-radius:20px;padding:20px;max-width:380px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,0.5)}" +
      "</style>" +
      "<button type=\"button\" class=\"ac-pwa-go\" aria-label=\"Instalar Aplicativo no Celular\">" +
      "<span>📲 Instalar App</span>" +
      "</button>" +
      "<button type=\"button\" class=\"ac-pwa-x\" aria-label=\"Fechar\">×</button>";

    document.body.appendChild(wrap);

    wrap.querySelector(".ac-pwa-x").addEventListener("click", function () {
      try { sessionStorage.setItem("pwa_bar_closed", "1"); } catch (e) {}
      wrap.remove();
    });

    wrap.querySelector(".ac-pwa-go").addEventListener("click", function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () {
          deferredPrompt = null;
          wrap.remove();
        });
      } else if (isIOS) {
        showInstructions("Para instalar este site como Aplicativo no iPhone/iPad:<br><br>1. Toque no botão <b>Compartilhar (⬆️)</b> na barra do Safari.<br>2. Role para baixo e toque em <b>Adicionar à Tela de Início</b>.");
      } else {
        showInstructions("Para instalar como Aplicativo no seu celular ou computador:<br><br>1. Abra o menu do navegador <b>(⋮)</b> no canto superior.<br>2. Toque em <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.");
      }
    });
  }

  function showInstructions(htmlText) {
    if (document.getElementById("ac-pwa-ios-modal")) return;
    var m = document.createElement("div");
    m.id = "ac-pwa-ios-modal";
    m.innerHTML =
      "<div class=\"card\">" +
      "<div style=\"font-weight:800;font-size:16px;margin-bottom:8px\">📲 Instalar como Aplicativo</div>" +
      "<div style=\"color:#cbd5e1;font-size:13.5px\">" + htmlText + "</div>" +
      "<button type=\"button\" style=\"margin-top:14px;width:100%;padding:11px;border:0;border-radius:12px;background:#10b981;color:#052e16;font-weight:800;cursor:pointer\">Entendi</button>" +
      "</div>";
    document.body.appendChild(m);
    m.addEventListener("click", function () { m.remove(); });
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    mountInstallPill();
  });

  if (isMobile) {
    if (document.readyState === "complete") setTimeout(mountInstallPill, 1500);
    else window.addEventListener("load", function () { setTimeout(mountInstallPill, 1500); });
  }
})();
