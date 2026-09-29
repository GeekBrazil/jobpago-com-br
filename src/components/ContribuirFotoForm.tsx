"use client";

import { useState } from "react";
import { CATEGORIAS } from "@/data/categorias";
import { Icon } from "@/components/Icons";
import { useIdioma } from "@/components/useIdioma";
import { L } from "@/lib/i18n";
import { tCategoria } from "@/lib/traducoesCadastro";

const PONTOS_FOTO_API = "https://allancandido.com/api/pontos-fotograficos";

export default function ContribuirFotoForm() {
  const [i] = useIdioma();
  const t = (pt: string, es: string, en: string) => L(i, pt, es, en);
  const [tipo, setTipo] = useState<"empresario" | "viajante">("viajante");
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0].nome);
  const [descricao, setDescricao] = useState("");
  const [nomeContribuidor, setNomeContribuidor] = useState("");
  const [contato, setContato] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [latManual, setLatManual] = useState<{ lat: number; lng: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [precisaManual, setPrecisaManual] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!foto) {
      setError(t("Escolha uma foto do estabelecimento ou ponto de apoio.", "Elegí una foto del establecimiento o punto de apoyo.", "Choose a photo of the place or support point."));
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("origem", "jobpago");
      form.append("tipoContribuidor", tipo);
      form.append("titulo", titulo);
      form.append("categoria", categoria);
      if (descricao) form.append("descricao", descricao);
      if (nomeContribuidor) form.append("nomeContribuidor", nomeContribuidor);
      if (contato) form.append("contato", contato);
      form.append("foto", foto);
      if (latManual) {
        form.append("latManual", String(latManual.lat));
        form.append("lngManual", String(latManual.lng));
      }

      const res = await fetch(PONTOS_FOTO_API, { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        // 422 = sem GPS no EXIF e sem pin manual — pede a localização e reenvia.
        if (res.status === 422 && !latManual) {
          setPrecisaManual(true);
          setError(t("Essa foto não tem localização (a maioria das fotos comprimidas perde isso). Marque onde foi tirada abaixo.", "Esta foto no tiene ubicación (la mayoría de las fotos comprimidas la pierde). Marcá abajo dónde fue sacada.", "This photo has no location (most compressed photos lose it). Mark where it was taken below."));
          return;
        }
        throw new Error(i === "pt" && data.error ? data.error : t("Falha ao enviar.", "No se pudo enviar.", "Sending failed."));
      }

      setSucesso(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao conectar com o servidor.", "No se pudo conectar con el servidor.", "Couldn't reach the server."));
    } finally {
      setLoading(false);
    }
  }

  function pedirLocalizacaoAtual() {
    if (!navigator.geolocation) {
      setError(t("Seu navegador não suporta localização automática — tente outra foto.", "Tu navegador no admite ubicación automática; probá con otra foto.", "Your browser doesn't support location — try another photo."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLatManual({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError(t("Não foi possível pegar sua localização. Permita o acesso e tente de novo.", "No se pudo obtener tu ubicación. Permití el acceso y probá de nuevo.", "Couldn't get your location. Allow access and try again."))
    );
  }

  if (sucesso) {
    return (
      <div className="glass-panel glass-amalfi p-8 sm:p-14 rounded-3xl text-center max-w-2xl mx-auto shadow-2xl border border-amber-500/30">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-6">
          <Icon name="check" width={56} height={56} />
        </div>
        <h3 className="text-2xl font-black text-white">{t("Foto enviada!", "¡Foto enviada!", "Photo sent!")}</h3>
        <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-lg mx-auto">
          {t("Fica pendente até o Allan revisar e aprovar. Quando aprovada, aparece na camada “Fotos da Comunidade” do mapa e em", "Queda pendiente hasta que Allan la revise y apruebe. Cuando se aprueba, aparece en la capa “Fotos de la Comunidad” del mapa y en", "It stays pending until Allan reviews and approves it. Once approved, it appears in the map’s “Community Photos” layer and on")}{" "}
          <a href="https://jobpago.com.br/certificados" className="text-amber-400 underline">
            /certificados
          </a>
          {t(", se for o caso.", ", si corresponde.", ", where relevant.")}
        </p>
        <button
          onClick={() => {
            setSucesso(false);
            setTitulo("");
            setDescricao("");
            setFoto(null);
            setLatManual(null);
            setPrecisaManual(false);
          }}
          className="btn-secondary-glass px-6 py-3 rounded-2xl text-sm font-bold cursor-pointer mt-6"
        >
          {t("Enviar outra foto", "Enviar otra foto", "Send another photo")}
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl max-w-2xl mx-auto">
      {/* SELETOR SEGMENTADO */}
      <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5 mb-6">
        <button
          type="button"
          onClick={() => setTipo("viajante")}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            tipo === "viajante" ? "bg-amber-500 text-black shadow-lg" : "text-slate-400 hover:text-white"
          }`}
        >
          <Icon name="compass" width={32} height={32} /> {t("Sou Viajante", "Soy viajero", "I'm a traveller")}
        </button>
        <button
          type="button"
          onClick={() => setTipo("empresario")}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            tipo === "empresario" ? "bg-amber-500 text-black shadow-lg" : "text-slate-400 hover:text-white"
          }`}
        >
          <Icon name="building" width={32} height={32} /> {t("Sou Empresário", "Soy empresario", "I own a business")}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
          <Icon name="warning" width={32} height={32} className="shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-extrabold text-slate-300 block mb-1">{t("Foto do local", "Foto del lugar", "Photo of the place")} *</label>
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => {
              setFoto(e.target.files?.[0] || null);
              setPrecisaManual(false);
              setLatManual(null);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-500 file:text-black file:font-bold file:text-xs"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            {t("Se a foto tiver GPS (a maioria das câmeras de celular tem), a localização é automática.", "Si la foto tiene GPS (la mayoría de las cámaras de celular lo tienen), la ubicación es automática.", "If the photo has GPS (most phone cameras do), the location is automatic.")}
          </p>
        </div>

        {precisaManual && (
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-400/20 flex items-center justify-between gap-3">
            <span className="text-xs text-amber-200">
              {latManual ? t("Localização marcada ✓", "Ubicación marcada ✓", "Location set ✓") : t("Marque sua localização atual:", "Marcá tu ubicación actual:", "Set your current location:")}
            </span>
            <button
              type="button"
              onClick={pedirLocalizacaoAtual}
              className="text-xs font-black px-3 py-2 rounded-lg bg-amber-400 text-black shrink-0"
            >
              <Icon name="pin" width={28} height={28} className="inline mr-1" /> {t("Usar Minha Posição", "Usar mi ubicación", "Use my location")}
            </button>
          </div>
        )}

        <div>
          <label className="text-xs font-extrabold text-slate-300 block mb-1">{t("Título", "Título", "Title")} *</label>
          <input
            type="text"
            required
            placeholder={t("Ex: Posto com chuveiro e 220V", "Ej.: Estación con ducha y 220V", "E.g. Gas station with shower and 220V")}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="text-xs font-extrabold text-slate-300 block mb-1">{t("Categoria", "Categoría", "Category")}</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.id} value={c.nome}>
                {tCategoria(i, c.id, c.nome)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-extrabold text-slate-300 block mb-1">{t("Descrição", "Descripción", "Description")}</label>
          <textarea
            rows={3}
            placeholder={t("O que tem nesse ponto? Chuveiro, tomada, Wi-Fi, socorro mecânico...", "¿Qué hay en este punto? Ducha, enchufe, Wi-Fi, auxilio mecánico...", "What's there? Shower, power, Wi-Fi, breakdown help...")}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-extrabold text-slate-300 block mb-1">{t("Seu nome", "Tu nombre", "Your name")}</label>
            <input
              type="text"
              placeholder={t("Opcional", "Opcional", "Optional")}
              value={nomeContribuidor}
              onChange={(e) => setNomeContribuidor(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs font-extrabold text-slate-300 block mb-1">{t("WhatsApp ou e-mail", "WhatsApp o e-mail", "WhatsApp or e-mail")}</label>
            <input
              type="text"
              placeholder={t("Opcional", "Opcional", "Optional")}
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary-amalfi mt-2 py-4 rounded-2xl text-sm font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
          ) : (
            <>
              <Icon name="rocket" width={36} height={36} /> {t("Enviar Foto", "Enviar foto", "Send photo")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
