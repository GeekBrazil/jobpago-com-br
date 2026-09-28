import json, psycopg2, datetime
base=json.load(open("base.json")); km1=json.load(open("km1.json"))
try: ac=json.load(open("acostamento.json"))
except FileNotFoundError: ac={"acostamento":"?"*len(km1),"km":{"s":0,"n":0,"?":len(km1)}}
cidades=json.load(open("cidades.json"))
try: pi=json.load(open("pista.json"))
except FileNotFoundError: pi={"pista":"?"*len(km1),"km":{"d":0,"s":0,"?":len(km1)}}
osrm=json.load(open("osrm.json"))
PARADAS=[("Paraty","RJ","3303807"),("Angra dos Reis","RJ","3300100"),("Rio de Janeiro","RJ","3304557"),("Campos dos Goytacazes","RJ","3301009"),("Vitória","ES","3205309"),("Prado","BA","2925501"),("Porto Seguro","BA","2925303"),("Ilhéus","BA","2913606"),("Salvador","BA","2927408"),("Aracaju","SE","2800308"),("Maceió","AL","2704302"),("Recife","PE","2611606"),("João Pessoa","PB","2507507"),("Natal","RN","2408102"),("Fortaleza","CE","2304400")]
wps=osrm["waypoints"]
paradas=[{"nome":n,"uf":u,"ibge":i,"lat":round(w["location"][1],5),"lon":round(w["location"][0],5)} for (n,u,i),w in zip(PARADAS,wps)]
c=psycopg2.connect(open('/home/allan/.config/pncp/database_url').read().strip()); cur=c.cursor()
for cid in cidades:
    cur.execute("""SELECT municipio_ibge FROM score_municipios WHERE uf=%s AND lower(unaccent(municipio_nome))=lower(unaccent(%s)) LIMIT 1""",(cid["uf"],cid["nome"]))
    r=cur.fetchone(); cid["ibge"]=str(r[0]) if r else None
# dedup mantendo a ordem do caminho
vistos=set(); cid_ok=[]
for cid in cidades:
    k=(cid["nome"],cid["uf"])
    if k in vistos: continue
    vistos.add(k); cid_ok.append({"nome":cid["nome"],"uf":cid["uf"],"km_rota":cid["km_rota"],"ibge":cid["ibge"]})
out={"km_total":base["km_total"],"horas_carro":base["horas_carro"],"rodovias":base["rodovias"],
     "pedagios":[{k:p[k] for k in ("nome","rodovia","concessionaria","km_rota","lat","lon")} for p in base["pedagios"]],
     "legs":base["legs"],"paradas":paradas,"cidades":cid_ok,
     "geometria":[[round(c2[1],5),round(c2[0],5)] for _,c2 in km1],"acostamento":ac["acostamento"],"acostamento_km":ac["km"],"pista":pi["pista"],"pista_km":pi["km"],
     "gerado_em":datetime.date.today().strftime("%d/%m/%Y")}
json.dump(out,open(__import__("os").path.expanduser("~/jobpago.com.br/src/data/expedicao-rota.json"),"w"),ensure_ascii=False,separators=(",",":"))
print("ok", len(out["geometria"]), "pts", len(cid_ok), "cidades", sum(1 for x in cid_ok if x["ibge"]), "com ibge", ac["km"])
