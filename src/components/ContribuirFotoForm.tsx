"use client";

import { useState } from "react";
import { CATEGORIAS } from "@/data/categorias";
import { Icon } from "@/components/Icons";

const PONTOS_FOTO_API = "https://allancandido.com/api/pontos-fotograficos";

export default function ContribuirFotoForm() {
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
      setError("Escolha uma foto do estabelecimento ou ponto de apoio.");
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
          setError("Essa foto não tem localização (a maioria das fotos comprimidas perde isso). Marque onde foi tirada abaixo.");
          return;
        }
        throw new Error(data.error || "Falha ao enviar.");
      }

      setSucesso(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  function pedirLocalizacaoAtual() {
    if (!navigator.geolocation) {
      setError("Seu navegador não suporta localização automática — tente outra foto.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLatManual({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Não foi possível pegar sua localização. Permita o acesso e tente de novo.")
    );
  }

  if (sucesso) {
    return (
      <div className="glass-panel glass-emerald p-8 sm:p-14 rounded-3xl text-center max-w-2xl mx-auto shadow-2xl border border-emerald-500/30">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-6">
          <Icon name="check" width={56} height={56} />
        </div>
        <h3 className="text-2xl font-black text-white">Foto enviada!</h3>
        <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-lg mx-auto">
          Fica pendente até o Allan revisar e aprovar. Quando aprovada, aparece
          na camada &quot;Fotos da Comunidade&quot; do mapa e em{" "}
          <a href="https://jobpago.com.br/certificados" className="text-emerald-400 underline">
            /certificados
          </a>
          , se for o caso.
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
          Enviar outra foto
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
            tipo === "viajante" ? "bg-emerald-500 text-black shadow-lg" : "text-slate-400 hover:text-white"
          }`}
        >
          <Icon name="compass" width={32} height={32} /> Sou Viajante
        </button>
        <button
          type="button"
          onClick={() => setTipo("empresario")}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            tipo === "empresario" ? "bg-emerald-500 text-black shadow-lg" : "text-slate-400 hover:text-white"
          }`}
        >
          <Icon name="building" width={32} height={32} /> Sou Empresário
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
          <Icon name="warning" width={32} height={32} className="shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-extrabold text-slate-300 block mb-1">Foto do local *</label>
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => {
              setFoto(e.target.files?.[0] || null);
              setPrecisaManual(false);
              setLatManual(null);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:text-black file:font-bold file:text-xs"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Se a foto tiver GPS (a maioria das câmeras de celular tem), a localização é automática.
          </p>
        </div>

        {precisaManual && (
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-400/20 flex items-center justify-between gap-3">
            <span className="text-xs text-amber-200">
              {latManual ? "Localização marcada ✓" : "Marque sua localização atual:"}
            </span>
            <button
              type="button"
              onClick={pedirLocalizacaoAtual}
              className="text-xs font-black px-3 py-2 rounded-lg bg-amber-400 text-black shrink-0"
            >
              <Icon name="pin" width={28} height={28} className="inline mr-1" /> Usar Minha Posição
            </button>
          </div>
        )}

        <div>
          <label className="text-xs font-extrabold text-slate-300 block mb-1">Título *</label>
          <input
            type="text"
            required
            placeholder="Ex: Posto com chuveiro e 220V"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div>
          <label className="text-xs font-extrabold text-slate-300 block mb-1">Categoria</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-emerald-400"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-extrabold text-slate-300 block mb-1">Descrição</label>
          <textarea
            rows={3}
            placeholder="O que tem nesse ponto? Chuveiro, tomada, Wi-Fi, socorro mecânico..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-extrabold text-slate-300 block mb-1">Seu nome</label>
            <input
              type="text"
              placeholder="Opcional"
              value={nomeContribuidor}
              onChange={(e) => setNomeContribuidor(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="text-xs font-extrabold text-slate-300 block mb-1">WhatsApp ou e-mail</label>
            <input
              type="text"
              placeholder="Opcional"
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary-emerald mt-2 py-4 rounded-2xl text-sm font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
          ) : (
            <>
              <Icon name="rocket" width={36} height={36} /> Enviar Foto
            </>
          )}
        </button>
      </form>
    </div>
  );
}
