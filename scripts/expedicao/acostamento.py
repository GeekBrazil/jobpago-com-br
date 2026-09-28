import json, math, re, sys, osmium
km1=json.load(open("km1.json"))  # [[km,[lon,lat]],...]
PRINC=re.compile(r"^(motorway|trunk|primary|secondary|tertiary)(_link)?$")
SIM=re.compile(r"^(yes|both|left|right)$"); NAO=re.compile(r"^no$")
def classe(tags):
    vals=[v for k,v in tags if k=="shoulder" or k.startswith("shoulder:") and k.split(":")[1] in ("both","left","right")]
    if any(SIM.match(v) for v in vals): return "s"
    if vals and all(NAO.match(v) for v in vals): return "n"
    return None
# caixa em volta do traçado (0,05°) para descartar o resto do Brasil
lats=[c[1] for _,c in km1]; lons=[c[0] for _,c in km1]
caixa=(min(lats)-.05,max(lats)+.05,min(lons)-.05,max(lons)+.05)
ways={}  # id -> (classe, [node ids])
for arq in sys.argv[1:]:
    for w in osmium.FileProcessor(arq, osmium.osm.WAY):
        t=w.tags
        if not PRINC.match(t.get("highway","")): continue
        c=classe([(tag.k,tag.v) for tag in t])
        if c: ways[w.id]=(c,[n.ref for n in w.nodes])
    print("vias com acostamento marcado:",len(ways),arq,file=sys.stderr)
precisa=set(n for _,ns in ways.values() for n in ns)
pos={}
for arq in sys.argv[1:]:
    for n in osmium.FileProcessor(arq, osmium.osm.NODE):
        if n.id in precisa:
            la,lo=n.location.lat,n.location.lon
            if caixa[0]<=la<=caixa[1] and caixa[2]<=lo<=caixa[3]: pos[n.id]=(lo,la)
print("nós:",len(pos),file=sys.stderr)
# grade 0,01° -> classes dos nós
grade={}
for c,ns in ways.values():
    pts=[pos[n] for n in ns if n in pos]
    for a,b in zip(pts,pts[1:]+pts[-1:]):
        # interpola a cada ~100 m: reta longa tem nós espaçados
        passos=max(1,int(math.hypot(b[0]-a[0],b[1]-a[1])/0.001))
        for k in range(passos):
            p=(a[0]+(b[0]-a[0])*k/passos, a[1]+(b[1]-a[1])*k/passos)
            grade.setdefault((int(p[0]*100),int(p[1]*100)),[]).append((p,c))
def hav(a,b):
    R=6371.0; la1,lo1,la2,lo2=map(math.radians,(a[1],a[0],b[1],b[0]))
    h=math.sin((la2-la1)/2)**2+math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 2*R*math.asin(math.sqrt(h))
saida=[]
for km,c in km1:
    gx,gy=int(c[0]*100),int(c[1]*100); melhor=None; bd=9
    for dx in (-1,0,1):
        for dy in (-1,0,1):
            for p,cl in grade.get((gx+dx,gy+dy),()):
                d=hav(c,p)
                if d<bd: bd=d; melhor=cl
    # nó do OSM a até 150 m do ponto do traçado (já interpolado)
    saida.append(melhor if melhor and bd<=0.06 else "?")
s="".join(saida)
json.dump({"acostamento":s,"km":{k:s.count(k) for k in "sn?"}},open("acostamento.json","w"))
print("resumo",{k:s.count(k) for k in "sn?"},file=sys.stderr)
