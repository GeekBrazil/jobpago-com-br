# Dados da página /expedicao

Gera `src/data/expedicao-rota.json`. Rodar numa pasta de trabalho (fora do repo):

1. `python3 rota.py` — traçado pelo litoral (OSRM) → `osrm.json`
2. baixar `pedagio.json` (ANTT, "Dados das Praças de Pedágio", JSON) e `python3 base.py` — rodovias, pedágios a ≤ 1,5 km, geometria → `base.json`, `km1.json`
3. `python3 cidades.py` — cidades a cada 12 km (Nominatim, 1 req/s) → `cidades.json`
4. baixar `sudeste-latest.osm.pbf` e `nordeste-latest.osm.pbf` (Geofabrik) e, num venv com `pip install osmium`:
   `python acostamento.py sudeste.pbf nordeste.pbf` e `python pista.py sudeste.pbf nordeste.pbf`
5. `python montar.py` (precisa do túnel pncp-tunnel: casa as cidades com o código IBGE)

Trocar o roteiro = mudar a lista `P` em `rota.py` e `PARADAS` em `montar.py` (e `CIDADES_DESTAQUE` em `src/lib/relatorioCidade.ts`).
