# 1) traçado Fortaleza → Paraty pelo litoral (OSRM público) → osrm.json
import json, urllib.request
P=[("Fortaleza",-38.5267,-3.7319),("Natal",-35.2094,-5.7945),("João Pessoa",-34.8610,-7.1195),("Recife",-34.8770,-8.0476),("Maceió",-35.7353,-9.6658),("Aracaju",-37.0717,-10.9472),("Salvador",-38.5014,-12.9714),("Ilhéus",-39.0493,-14.7889),("Porto Seguro",-39.0644,-16.4497),("Prado",-39.2212,-17.3411),("Vitória",-40.3080,-20.3155),("Campos dos Goytacazes",-41.3244,-21.7540),("Rio de Janeiro",-43.1964,-22.9083),("Angra dos Reis",-44.3181,-23.0067),("Paraty",-44.7131,-23.2178)]
u="https://router.project-osrm.org/route/v1/driving/"+";".join(f"{lon},{lat}" for _,lon,lat in P)+"?overview=full&geometries=geojson&steps=true"
d=json.load(urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"jobpago-expedicao/1.0"}),timeout=120))
json.dump(d,open("osrm.json","w"))
