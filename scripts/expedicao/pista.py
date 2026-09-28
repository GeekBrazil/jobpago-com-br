import json, math, re, sys, osmium
km1=json.load(open("km1.json"))
PRINC=re.compile(r"^(motorway|trunk|primary|secondary)$")
lats=[c[1] for _,c in km1]; lons=[c[0] for _,c in km1]
caixa=(min(lats)-.05,max(lats)+.05,min(lons)-.05,max(lons)+.05)
ways=[]
for arq in sys.argv[1:]:
    for w in osmium.FileProcessor(arq, osmium.osm.WAY):
        t=w.tags; hw=t.get("highway","")
        if not PRINC.match(hw): continue
        dup = hw=="motorway" or t.get("oneway") in ("yes","1") or t.get("dual_carriageway")=="yes"
        ways.append(("d" if dup else "s",[n.ref for n in w.nodes]))
    print("vias principais:",len(ways),arq,file=sys.stderr)
precisa=set(n for _,ns in ways for n in ns); print("refs",len(precisa),file=sys.stderr)
pos={}
for arq in sys.argv[1:]:
    for n in osmium.FileProcessor(arq, osmium.osm.NODE):
        if n.id in precisa:
            la,lo=n.location.lat,n.location.lon
            if caixa[0]<=la<=caixa[1] and caixa[2]<=lo<=caixa[3]: pos[n.id]=(lo,la)
del precisa
print("nós na caixa:",len(pos),file=sys.stderr)
# só grade perto do traçado (células vizinhas dos pontos do km)
alvo=set()
for _,c in km1:
    gx,gy=int(c[0]*100),int(c[1]*100)
    for dx in (-1,0,1):
        for dy in (-1,0,1): alvo.add((gx+dx,gy+dy))
grade={}
for cl,ns in ways:
    pts=[pos[n] for n in ns if n in pos]
    for a,b in zip(pts,pts[1:]+pts[-1:]):
        passos=max(1,int(math.hypot(b[0]-a[0],b[1]-a[1])/0.001))
        for k in range(passos):
            p=(a[0]+(b[0]-a[0])*k/passos, a[1]+(b[1]-a[1])*k/passos)
            cel=(int(p[0]*100),int(p[1]*100))
            if cel in alvo: grade.setdefault(cel,[]).append((p,cl))
def hav(a,b):
    R=6371.0; la1,lo1,la2,lo2=map(math.radians,(a[1],a[0],b[1],b[0]))
    h=math.sin((la2-la1)/2)**2+math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 2*R*math.asin(math.sqrt(h))
out=[]
for km,c in km1:
    gx,gy=int(c[0]*100),int(c[1]*100); melhor=None; bd=9
    for dx in (-1,0,1):
        for dy in (-1,0,1):
            for p,cl in grade.get((gx+dx,gy+dy),()):
                d=hav(c,p)
                if d<bd: bd=d; melhor=cl
    out.append(melhor if melhor and bd<=0.06 else "?")
s="".join(out)
json.dump({"pista":s,"km":{k:s.count(k) for k in "ds?"}},open("pista.json","w"))
print("resumo",{k:s.count(k) for k in "ds?"},file=sys.stderr)
