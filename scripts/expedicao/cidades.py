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
# 4) cidades no caminho (Nominatim, 1 req/s) a cada 12 km
cidades=[]; ult=None
for km,c in amostra(12.0):
    u="https://nominatim.openstreetmap.org/reverse?"+urllib.parse.urlencode({"lat":c[1],"lon":c[0],"format":"jsonv2","zoom":10,"accept-language":"pt-BR"})
    try:
        a=json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30)).get("address",{})
    except Exception as e:
        print("nominatim",e,file=sys.stderr); time.sleep(2); continue
    nome=a.get("city") or a.get("town") or a.get("municipality") or a.get("village")
    uf=(a.get("ISO3166-2-lvl4") or "").replace("BR-","")
    if nome and (nome,uf)!=ult:
        cidades.append({"nome":nome,"uf":uf,"km_rota":km,"lat":round(c[1],5),"lon":round(c[0],5)}); ult=(nome,uf)
    time.sleep(1.1)
print("cidades",len(cidades),file=sys.stderr)

json.dump(cidades,open("cidades.json","w"),ensure_ascii=False)
print("cidades ok",file=sys.stderr)
