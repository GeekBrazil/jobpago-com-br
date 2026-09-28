import json, math, time, urllib.request, urllib.parse, re, sys
UA={"User-Agent":"jobpago-expedicao/1.0 (candidoallan@gmail.com)"}
d=json.load(open("osrm.json")); r=d["routes"][0]
coords=r["geometry"]["coordinates"]  # [lon,lat]
def hav(a,b):
    R=6371.0; la1,lo1,la2,lo2=map(math.radians,(a[1],a[0],b[1],b[0]))
    h=math.sin((la2-la1)/2)**2+math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 2*R*math.asin(math.sqrt(h))
# km acumulado por ponto
acc=[0.0]
for i in range(1,len(coords)): acc.append(acc[-1]+hav(coords[i-1],coords[i]))
total=acc[-1]
def amostra(passo):
    out=[]; alvo=0.0; j=0
    while alvo<=total:
        while j<len(acc)-1 and acc[j]<alvo: j+=1
        out.append((round(alvo,1),coords[j])); alvo+=passo
    return out
# 1) rodovias por km (steps do OSRM)
rod={}
for leg in r["legs"]:
    for st in leg["steps"]:
        ref=(st.get("ref") or "").split(";")[0].strip()
        nome=ref or st.get("name") or ""
        m=re.match(r"^(BR|RJ|ES|BA|SE|AL|PE|PB|RN|CE)[- ]?(\d{3})",nome)
        chave=f"{m.group(1)}-{m.group(2)}" if m else "outras vias"
        rod[chave]=rod.get(chave,0)+st["distance"]/1000
rodovias=sorted(({"rodovia":k,"km":round(v)} for k,v in rod.items() if v>=5),key=lambda x:-x["km"])
# 2) pedágios ANTT a até 1,5 km do traçado
ped=json.load(open("pedagio.json",encoding="utf-8-sig")); ped=list(ped.values())[0] if isinstance(ped,dict) else ped
fino=amostra(0.3)
pedagios=[]
for p in ped:
    if p.get("situacao")!="Ativo": continue
    try: pt=[float(p["longitude"]),float(p["latitude"])]
    except: continue
    melhor=min(fino,key=lambda s: hav(s[1],pt))
    if hav(melhor[1],pt)<=1.5:
        pedagios.append({"nome":p["praca_de_pedagio"],"concessionaria":p["concessionaria"],"rodovia":p["rodovia"],"uf":p["uf"],"municipio":p["municipio"],"km_rota":melhor[0],"lat":pt[1],"lon":pt[0]})
# pistas duplas da mesma praça: 1 por nome
vistos={}; 
for p in sorted(pedagios,key=lambda x:x["km_rota"]): vistos.setdefault((p["nome"],p["rodovia"]),p)
pedagios=sorted(vistos.values(),key=lambda x:x["km_rota"])
print("pedagios",len(pedagios),file=sys.stderr)

geo=[[round(c[1],5),round(c[0],5)] for _,c in amostra(0.5)]+[[round(coords[-1][1],5),round(coords[-1][0],5)]]
json.dump({"km_total":round(total),"horas_carro":round(r["duration"]/3600,1),"rodovias":rodovias,"pedagios":pedagios,"geometria":geo,
  "legs":[{"km":round(l["distance"]/1000),"horas":round(l["duration"]/3600,1)} for l in r["legs"]]},open("base.json","w"),ensure_ascii=False)
json.dump([[km,c] for km,c in amostra(1.0)],open("km1.json","w"))
print("base ok",file=sys.stderr)
