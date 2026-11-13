#!/usr/bin/env python3
"""Fila de prospecção do Campus (Kira) — SOMENTE LEITURA.

Reaproveita a seleção do robô aprovado (central-prospeccao/robo.py: bloqueados,
segundas, primeiras — só PJ, sem contador, sem optout, sem já-contatado, no
máximo 2 toques) e acrescenta o telefone público do CNPJ, normalizado para
WhatsApp quando é celular. Não envia nada, não grava nada:

  * roda com PGOPTIONS='-c default_transaction_read_only=on' (o Postgres recusa escrita);
  * app.garantir_schema / garantir_jobpago viram no-op ANTES de qualquer chamada;
  * robo.chama / robo.main são trocados por funções que explodem (nenhum caminho de envio).

Saída: um JSON no stdout (lido só em memória pelo campus/api.mjs). Nada de log
com e-mail ou telefone.

    PGOPTIONS='-c default_transaction_read_only=on' PYTHONDONTWRITEBYTECODE=1 \
      /home/allan/pncp-etl/pncpvenv/bin/python fila_prospeccao.py [limite]
"""
import json
import os
import re
import sys
from datetime import date

CENTRAL = "/home/allan/central-prospeccao"
sys.path.insert(0, CENTRAL)
os.chdir(CENTRAL)

if "default_transaction_read_only=on" not in os.environ.get("PGOPTIONS", ""):
    print(json.dumps({"erro": "rode com PGOPTIONS somente-leitura"}))
    sys.exit(2)

import app  # noqa: E402  (pools e casamento de nome de cidade da Central)

app.garantir_schema = lambda *a, **k: None
app.garantir_jobpago = lambda *a, **k: None

import robo  # noqa: E402


def _proibido(*_a, **_k):
    raise RuntimeError("envio proibido a partir do campus")


robo.chama = _proibido
robo.main = _proibido


def normaliza_telefone(bruto):
    """'(24) 99999999' → ('5524999999999', 'celular'); fixo → (None, 'fixo')."""
    dig = re.sub(r"\D", "", bruto or "")
    if dig.startswith("55") and len(dig) in (12, 13):
        dig = dig[2:]
    if dig.startswith("0"):
        dig = dig.lstrip("0")
    if len(dig) == 11 and dig[2] == "9" and dig[0] != "0":
        return "55" + dig, "celular"
    if len(dig) == 10 and dig[0] != "0":
        primeiro = dig[2]
        if primeiro in "6789":
            return "55" + dig[:2] + "9" + dig[2:], "celular"
        if primeiro in "2345":
            return None, "fixo"
    return None, None


def telefones(itens):
    if not itens:
        return {}
    cnpjs = [d["cnpj"] for d in itens]
    linhas = app.consulta("cnpj", "SELECT cnpj, NULLIF(telefone, '') telefone FROM empresas WHERE cnpj = ANY(%s)", (cnpjs,))
    tel = {r["cnpj"]: r["telefone"] for r in linhas}
    # telefone repetido em 3+ CNPJs ativos da mesma cidade = escritório de contabilidade
    por_cidade = {}
    for d in itens:
        t = tel.get(d["cnpj"])
        dc = robo._cache.get((d["cidade"], d["uf"]))
        if t and dc:
            por_cidade.setdefault((dc["mun"], d["uf"]), set()).add(t)
    repetidos = set()
    for (mun, uf), tels in por_cidade.items():
        for r in app.consulta("cnpj", """SELECT telefone, COUNT(*) n FROM empresas
                WHERE municipio = %s AND uf = %s AND situacao_cadastral = '02' AND telefone = ANY(%s)
                GROUP BY 1 HAVING COUNT(*) >= 3""", (mun, uf, list(tels))):
            repetidos.add(r["telefone"])
    saida = {}
    for d in itens:
        t = tel.get(d["cnpj"])
        if not t:
            saida[d["cnpj"]] = (None, None)
        elif t in repetidos:
            saida[d["cnpj"]] = (None, "contador")
        else:
            saida[d["cnpj"]] = normaliza_telefone(t)
    return saida


def main():
    try:
        limite = max(1, min(50, int(sys.argv[1]))) if len(sys.argv) > 1 else robo.LIMITE
    except ValueError:
        limite = robo.LIMITE
    emails_b, cnpjs_b = robo.bloqueados()
    itens = robo.segundas()
    itens += robo.primeiras(max(0, limite - len(itens)), emails_b, cnpjs_b)
    tels = telefones(itens)
    saida = []
    for d in itens:
        numero, linha = tels.get(d["cnpj"], (None, None))
        saida.append({
            "cnpj": d["cnpj"],
            "nome": robo_nome(d["nome"]),
            "nomeBruto": d["nome"],
            "cidade": d["cidade"],
            "uf": d["uf"],
            "categoria": d.get("setorId"),
            "setorPlural": d.get("setorPlural"),
            "etapa": d["etapa"],
            "tipo": d.get("tipo"),
            "abertura": d.get("abertura"),
            "refugio": bool(d.get("refugio")),
            "email": d.get("email"),
            "telefone": numero,
            "linha": linha,
            "destino": d,  # exatamente o Destino que o robô mandaria para montar()
        })
    print(json.dumps({"geradoEm": date.today().isoformat(), "limite": limite, "itens": saida}, default=str, ensure_ascii=False))


def robo_nome(bruto):
    """Mesmo espírito do nomeBonito() do site: tira LTDA/ME e o caixa-alta."""
    sem = re.sub(r"\s+INOVA SIMPLES\s*\(I\.?S\.?\)", "", bruto or "", flags=re.I)
    sem = re.sub(r"\s+(LTDA|ME|EPP|EIRELI|S/?A|SLU)\.?$", "", sem, flags=re.I)
    sem = re.sub(r"\s+", " ", sem).strip()
    if sem != sem.upper():
        return sem
    t = " ".join(p[:1].upper() + p[1:] for p in sem.lower().split(" "))
    return re.sub(r"\s(De|Da|Do|Das|Dos|E)\s", lambda m: m.group(0).lower(), t)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # mensagem curta, sem dado pessoal
        print(json.dumps({"erro": type(e).__name__ + ": " + re.sub(r"\S+@\S+|\d{6,}", "•••", str(e))[:200]}))
        sys.exit(1)
