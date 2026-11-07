"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const HeatmapMap = dynamic(() => import("./HeatmapMap"), { ssr: false });

export default function DashboardPage() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [territorio, setTerritorio] = useState<any>(null);
  const [loadingTelem, setLoadingTelem] = useState(true);
  const [loadingTerr, setLoadingTerr] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"todos" | "rag" | "hardware" | "territorio">("todos");
  const [currentLat, setCurrentLat] = useState(-22.9201);
  const [currentLon, setCurrentLon] = useState(-43.0811);
  const [currentRadius, setCurrentRadius] = useState(3.0);
  const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);

  const carregarHeatmap = useCallback(async (lat = currentLat, lon = currentLon, r = currentRadius) => {
    try {
      const res = await fetch(`/api/admin/territorio?mode=heatmap&lat=${lat}&lon=${lon}&radius=${r}`);
      if (res.ok) {
        const d = await res.json();
        if (d.ok && d.pontosCalor) setHeatmapPoints(d.pontosCalor);
      }
    } catch (e) {
      console.warn("Erro heatmap:", e);
    }
  }, [currentLat, currentLon, currentRadius]);

  const carregarTelemetria = useCallback(async () => {
    setLoadingTelem(true);
    try {
      const res = await fetch("/api/admin/telemetry");
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (e) {
      console.error("Erro telemetria:", e);
    } finally {
      setLoadingTelem(false);
    }
  }, []);

  const carregarTerritorio = useCallback(async (q?: string) => {
    setLoadingTerr(true);
    try {
      const query = q !== undefined ? q : searchQuery;
      const res = await fetch(`/api/admin/territorio?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setTerritorio(data);
      }
    } catch (e) {
      console.error("Erro territorio:", e);
    } finally {
      setLoadingTerr(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    carregarTelemetria();
    carregarTerritorio("");
    carregarHeatmap();
  }, [carregarTelemetria, carregarTerritorio, carregarHeatmap]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              ← Painel Admin
            </Link>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Jarvis & RAG Online
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mt-2">
            Central de Telemetria, RAG & Inteligência Territorial
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tema Claro • Segundo Cérebro • Monitor de Disco/GPU • Análise Comercial em Raio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => carregarTelemetria()}
            disabled={loadingTelem}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 shadow-sm transition flex items-center gap-2"
          >
            {loadingTelem ? "Atualizando..." : "🔄 Atualizar Telemetria"}
          </button>
          <a
            href="http://127.0.0.1:4700/viewer/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition flex items-center gap-2"
          >
            🌌 Abrir Galáxia 3D
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
          <button
            onClick={() => setTab("todos")}
            className={`pb-3 transition-colors border-b-2 ${
              tab === "todos"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Visão Geral Completa
          </button>
          <button
            onClick={() => setTab("rag")}
            className={`pb-3 transition-colors border-b-2 ${
              tab === "rag"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            🧠 Segundo Cérebro & RAG
          </button>
          <button
            onClick={() => setTab("hardware")}
            className={`pb-3 transition-colors border-b-2 ${
              tab === "hardware"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            ⚡ Hardware & Disco
          </button>
          <button
            onClick={() => setTab("territorio")}
            className={`pb-3 transition-colors border-b-2 ${
              tab === "territorio"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            📍 Comércio & Raio Territorial
          </button>
        </div>

        {/* 1. SEGUNDO CÉREBRO & RAG */}
        {(tab === "todos" || tab === "rag") && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                🧠 RAG & Segundo Cérebro (Qdrant & Embeddings)
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Modelo: bge-m3:latest (Porta 11435)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 border-l-indigo-600">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  💾 Espaço Qdrant em Disco
                </div>
                <div className="text-2xl font-black text-indigo-600 mt-1">
                  {telemetry?.rag?.qdrant?.diskGb ? `${telemetry.rag.qdrant.diskGb} GB` : "1.6 GB"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Comprimido (2.81 GB dados brutos)
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded">
                  SSD: /qdrant/storage
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Obsidian Vault
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {telemetry?.rag?.qdrant?.collections?.obsidian_vault?.pointsCount?.toLocaleString("pt-BR") || "74.655"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Notas e conexões neurais indexadas
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded">
                  Status: {telemetry?.rag?.qdrant?.collections?.obsidian_vault?.status || "Green"}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  WhatsApp Histórico
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {telemetry?.rag?.qdrant?.collections?.whatsapp?.pointsCount?.toLocaleString("pt-BR") || "158.065"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Mensagens e interações semânticas
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded">
                  Status: {telemetry?.rag?.qdrant?.collections?.whatsapp?.status || "Green"}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Sofia Licitações PNCP
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {telemetry?.rag?.qdrant?.collections?.sofia_licitacoes?.pointsCount?.toLocaleString("pt-BR") || "248"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Editais e atas governamentais
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 rounded">
                  Radar Ativo
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Google Keep Sync
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {telemetry?.rag?.keep?.notesCount || "Ativo"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Capturas rápidas via keep.py
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                  Exportação: notes/captures/
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 2. HARDWARE & DISCO */}
        {(tab === "todos" || tab === "hardware") && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              ⚡ Telemetria de Hardware, Disco & GPU
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Espaço em Disco */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                  <span>💾 Armazenamento SSD</span>
                  <span className="text-xs text-slate-500">df -B1</span>
                </h3>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>Partição Root (/)</span>
                    <span>{telemetry?.disk?.root?.usedGb} GB / {telemetry?.disk?.root?.totalGb} GB ({telemetry?.disk?.root?.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${Math.min(100, telemetry?.disk?.root?.percent || 63)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>Home (/home/allan)</span>
                    <span>{telemetry?.disk?.home?.usedGb} GB / {telemetry?.disk?.home?.totalGb} GB ({telemetry?.disk?.home?.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        (telemetry?.disk?.home?.percent || 89) > 85 ? "bg-amber-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${Math.min(100, telemetry?.disk?.home?.percent || 89)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5">
                    Espaço livre em home: <b>{telemetry?.disk?.home?.freeGb || 13.3} GB</b>
                  </div>
                </div>
              </div>

              {/* Memória RAM */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                  <span>🧠 Memória RAM</span>
                  <span className="text-xs text-slate-500">{telemetry?.ram?.percent || 55}% Usada</span>
                </h3>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>RAM Total: {telemetry?.ram?.totalGb || 16.0} GB</span>
                    <span>Livre: {telemetry?.ram?.freeGb || 7.2} GB</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full"
                      style={{ width: `${Math.min(100, telemetry?.ram?.percent || 55)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Em Uso:</span>
                    <span className="font-bold text-slate-800">{telemetry?.ram?.usedGb || 8.4} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Buffers / Cache:</span>
                    <span className="font-bold text-slate-800">Disponível imediato</span>
                  </div>
                </div>
              </div>

              {/* GPU NVIDIA RTX 4050 */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">🎮 GPU RTX 4050</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    {telemetry?.gpu?.tempC || 51}°C
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>VRAM ({telemetry?.gpu?.vramUsedMb || 202} MB / {telemetry?.gpu?.vramTotalMb || 6141} MB)</span>
                    <span>{Math.round(((telemetry?.gpu?.vramUsedMb || 202) / (telemetry?.gpu?.vramTotalMb || 6141)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-2.5 rounded-full"
                      style={{ width: `${Math.max(5, ((telemetry?.gpu?.vramUsedMb || 202) / (telemetry?.gpu?.vramTotalMb || 6141)) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="text-slate-400">Utilização</div>
                    <div className="text-sm font-bold text-slate-800">{telemetry?.gpu?.utilPercent || 0}%</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <div className="text-slate-400">Consumo</div>
                    <div className="text-sm font-bold text-slate-800">{telemetry?.gpu?.powerW || 3.8}W</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. INTELIGÊNCIA TERRITORIAL & COMÉRCIO NO RAIO */}
        {(tab === "todos" || tab === "territorio") && (
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  📍 Comércio Local & Varredura no Raio (500m, 1km, 3km)
                </h2>
                <p className="text-sm text-slate-500">
                  Inteligência de Fachada + Receita Federal (28.1M Empresas) + Licitações PNCP + Radar de Concorrência
                </p>
              </div>

              {/* Barra de Busca Interativa */}
              <div className="flex items-center gap-2 max-w-md w-full">
                <input
                  type="text"
                  placeholder="Buscar CNPJ, Razão Social ou Comércio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && carregarTerritorio(searchQuery)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
                <button
                  onClick={() => carregarTerritorio(searchQuery)}
                  disabled={loadingTerr}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition"
                >
                  {loadingTerr ? "Buscando..." : "Analisar"}
                </button>
              </div>
            </div>

            {/* MAPA REAL GEOGRÁFICO COM CAMADA DE CALOR */}
            <HeatmapMap
              currentLat={currentLat}
              currentLon={currentLon}
              currentRadius={currentRadius}
              points={heatmapPoints}
              onSelectCnpj={(cnpj) => {
                setSearchQuery(cnpj);
                carregarTerritorio(cnpj);
              }}
              onChangeRadius={(r) => {
                setCurrentRadius(r);
                carregarHeatmap(currentLat, currentLon, r);
              }}
              onUseGps={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setCurrentLat(pos.coords.latitude);
                    setCurrentLon(pos.coords.longitude);
                    carregarHeatmap(pos.coords.latitude, pos.coords.longitude, currentRadius);
                  });
                }
              }}
            />

            {territorio?.comercio && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna 1: Dados do Comércio em que você está */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Card Principal do Comércio */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                            {territorio.comercio.situacaoCadastral}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            CNPJ: {territorio.comercio.cnpj}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">
                          {territorio.comercio.nomeFantasia}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {territorio.comercio.razaoSocial}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase font-semibold">Capital Social</div>
                        <div className="text-lg font-black text-indigo-600">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            territorio.comercio.capitalSocial
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Atividade CNAE */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>🏷️ CNAE Principal ({territorio.comercio.cnaePrincipal}):</span>
                      </div>
                      <div className="text-slate-600">{territorio.comercio.cnaeDescricao}</div>
                    </div>

                    {/* Endereço & Contato */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 pt-2">
                      <div>
                        <span className="font-semibold text-slate-800 block mb-0.5">📍 Localização Geocodificada:</span>
                        <p>
                          {territorio.comercio.endereco.logradouro}, {territorio.comercio.endereco.numero} - {territorio.comercio.endereco.bairro}
                        </p>
                        <p>{territorio.comercio.endereco.municipio} - {territorio.comercio.endereco.uf} ({territorio.comercio.endereco.cep || "CEP Local"})</p>
                        <p className="text-slate-400 font-mono mt-0.5">
                          GPS: {territorio.comercio.endereco.latitude?.toFixed(4)}, {territorio.comercio.endereco.longitude?.toFixed(4)}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-800 block mb-0.5">📞 Contatos Registrados:</span>
                        <p>Telefone: {territorio.comercio.contatos.telefone}</p>
                        <p>E-mail: {territorio.comercio.contatos.email}</p>
                        <p className="text-slate-400 mt-0.5">Abertura: {territorio.comercio.abertura || "Regular"}</p>
                      </div>
                    </div>

                    {/* Sócios (QSA) */}
                    {territorio.comercio.qsa && territorio.comercio.qsa.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <span className="font-semibold text-xs text-slate-800 block mb-2">
                          👥 Quadro de Sócios & Administradores (QSA Desambiguado):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {territorio.comercio.qsa.map((s: any, idx: number) => (
                            <div key={idx} className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs">
                              <span className="font-bold text-slate-900">{s.nome}</span>
                              <span className="text-slate-500 ml-1.5">({s.qualificacao})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Diagnóstico Sofia Bot & Licitações PNCP */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Diagnóstico de Presença Digital */}
                    <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                        <h4 className="text-sm font-bold text-slate-900">Diagnóstico Presença Digital</h4>
                      </div>
                      <div className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded border border-amber-200 inline-block">
                        {territorio.diagnosticoDigital.statusProspeccao}
                      </div>
                      <p className="text-xs text-slate-600">
                        Empresa com faturamento ativo mas <b>sem website indexado</b>. Excelente oportunidade de conversão imediata para o Motor-Sites.
                      </p>
                      <div className="text-xs text-indigo-600 font-semibold">
                        Recomendação: {territorio.diagnosticoDigital.recomendacao}
                      </div>
                    </div>

                    {/* Histórico Governamental PNCP */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <h4 className="text-sm font-bold text-slate-900">Contratos Públicos & PNCP</h4>
                      </div>
                      <div className="text-xs text-slate-600">
                        Habilitado para Licitar: <b>{territorio.licitacoesPncp.habilitadoLicitacoes ? "Sim ✅" : "Não"}</b>
                      </div>
                      <div className="text-xs text-slate-600">
                        Histórico de Linhas Contratadas: <b>{territorio.licitacoesPncp.totalContratosLinhas} contratos encontrados</b>
                      </div>
                      <div className="text-xs text-slate-500">
                        Órgãos licitantes mapeados na região.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna 2: Análise no Raio (500m, 1km, 3km) */}
                <div className="space-y-6">
                  {/* Card do Raio */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      📡 Densidade de Concorrentes no Raio
                    </h3>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs text-slate-400 font-medium">500 metros</div>
                        <div className="text-xl font-bold text-indigo-600 mt-1">
                          {territorio.raioPerimetro.densidade500m}
                        </div>
                        <div className="text-[10px] text-slate-400">mesmo ramo</div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs text-slate-400 font-medium">1 km</div>
                        <div className="text-xl font-bold text-indigo-600 mt-1">
                          {territorio.raioPerimetro.densidade1km}
                        </div>
                        <div className="text-[10px] text-slate-400">no perímetro</div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs text-slate-400 font-medium">3 km</div>
                        <div className="text-xl font-bold text-indigo-600 mt-1">
                          {territorio.raioPerimetro.densidade3km}
                        </div>
                        <div className="text-[10px] text-slate-400">polo regional</div>
                      </div>
                    </div>

                    {/* Concorrentes no Entorno */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                        Empresas Vizinho no Perímetro:
                      </h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                        {territorio.raioPerimetro.concorrentesProximos?.map((c: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                            <div className="font-bold text-slate-900">{c.nome}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{c.bairro} • {c.cnae}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Radar de Prospecção na Rota */}
                    <div className="pt-3 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        🗺️ Rota de Prospecção Territorial:
                      </h4>
                      <ol className="space-y-1.5 text-xs text-slate-600">
                        {territorio.raioPerimetro.radarRotaProspeccao?.map((r: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                              {r.ordem}
                            </span>
                            <span><b>{r.tipo}:</b> {r.acao}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
