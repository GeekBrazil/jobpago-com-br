"""Posto com loja de conveniência para o cenário da JobPago.

    blender -b --python posto.py -- saida posto.glb previa previa.png

Coordenadas do site, relativas ao centro do pátio (o mesmo grupo "apoio" do
Three.js): a estrada fica em +x; a fachada da loja olha para +x.
Sem preço em lugar nenhum (não inventar número). ILUSTRAÇÃO — não é um lugar real.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import (P, args, booleano, caixa, cilindro, esfera, exportar, juntar, limpar, mat, placa, plano, previa,
                   ret_em, srgb, suavizar, tex, texto, tubo)

import bpy

a = args()
limpar()

# ── materiais ──
parede = mat("parede", srgb("#ece2cf"), 0.0, 0.85)
branco = mat("branco", srgb("#f4f2ec"), 0.0, 0.45)
cinza = mat("cinza_claro", srgb("#d6d3cc"), 0.0, 0.6)
concreto = mat("concreto", srgb("#b9b6ae"), 0.0, 0.9)
rodape = mat("rodape", srgb("#6b6358"), 0.0, 0.8)
amarelo = mat("amarelo", srgb("#f59e0b"), 0.0, 0.45)
escuro = mat("escuro", srgb("#1f2328"), 0.0, 0.6)
aluminio = mat("aluminio", srgb("#c3c8cf"), 0.9, 0.3)
metal = mat("metal_escuro", srgb("#3a3f46"), 0.6, 0.45)
vidro = mat("vidro_loja", srgb("#9fb7c9"), 0.3, 0.04, alfa=0.3)
borracha = mat("borracha", srgb("#111111"), 0.0, 0.9)
vermelho = mat("vermelho", srgb("#c62828"), 0.1, 0.35)
azul = mat("azul_caixa", srgb("#1e5aa8"), 0.0, 0.45)
azul_gas = mat("azul_botijao", srgb("#2b5fa8"), 0.3, 0.4)
madeira = mat("madeira", srgb("#8a5a33"), 0.0, 0.6)
piso = mat("piso_loja", srgb("#e3ddd2"), 0.0, 0.25)
fascia = mat("faixa_cobertura", (1, 1, 1), 0.0, 0.4, imagem=tex("fascia"))
zebra = mat("zebrada", (1, 1, 1), 0.0, 0.6, imagem=tex("zebra"))
bomba_face = mat("bomba_frente", (1, 1, 1), 0.0, 0.35, imagem=tex("bomba"))
produtos = mat("produtos", (1, 1, 1), 0.0, 0.6, imagem=tex("produtos"))
gelo = mat("gelo", (1, 1, 1), 0.0, 0.4, imagem=tex("gelo"))
led = mat("luz_led", srgb("#fff4dc"), 0.0, 0.3, emissao=srgb("#fff4dc"), forca=4.0)
teto_luz = mat("luz_teto", srgb("#fff1d6"), 0.0, 0.3, emissao=srgb("#fff1d6"), forca=2.5)
spot = mat("luz_spot", srgb("#ffe2b0"), 0.0, 0.3, emissao=srgb("#ffe2b0"), forca=6.0)
geladeira = mat("luz_geladeira", (1, 1, 1), 0.0, 0.3, emissao=(1, 1, 1), forca=1.6, imagem=tex("geladeira"))
letreiro = mat("luz_letreiro", (1, 1, 1), 0.0, 0.4, emissao=(1, 1, 1), forca=1.4, imagem=tex("letreiro_fundo"))
totem_m = mat("luz_totem", (1, 1, 1), 0.0, 0.4, emissao=(1, 1, 1), forca=1.2, imagem=tex("totem"))
arandela = mat("luz_arandela", srgb("#ffd9a0"), 0.0, 0.3, emissao=srgb("#ffc27a"), forca=5.0)
letra = mat("letras", srgb("#1a1206"), 0.0, 0.5)
letra2 = mat("letras_vinho", srgb("#7c2d12"), 0.0, 0.5)

# ══════════════ COBERTURA DAS BOMBAS ══════════════
CX, CZ = 9.5, 0.0
caixa("cobertura", 15.5, 1.0, 9.5, (CX, 6.05, CZ), branco, bevel=0.06)
for z in (-1, 1):
    plano("faixa", 15.6, 1.1, (CX, 6.05, CZ + z * 4.81), "frente", fascia)
for x in (-1, 1):
    plano("faixa", 9.6, 1.1, (CX + x * 7.81, 6.05, CZ), "x", fascia)
forro = plano("forro", 15.2, 9.2, (CX, 5.53, CZ), "up", cinza)
forro.rotation_euler = (math.pi, 0, 0)
for i in range(5):
    for j in range(3):
        caixa("painel_led", 1.6, 0.05, 0.9, (CX - 6 + i * 3, 5.5, CZ - 3 + j * 3), led, bevel=0.01)
for cx in (-4.2, 4.2):
    for cz in (-2.4, 2.4):
        caixa("coluna", 0.55, 5.5, 0.55, (CX + cx, 2.75, CZ + cz), branco, bevel=0.06)
        caixa("coluna_base", 0.66, 0.85, 0.66, (CX + cx, 0.425, CZ + cz), amarelo, bevel=0.05)
        caixa("coluna_topo", 0.75, 0.25, 0.75, (CX + cx, 5.4, CZ + cz), branco, bevel=0.05)
tubo("calha", [(CX + 4.45, 5.5, CZ + 2.4), (CX + 4.5, 3.0, CZ + 2.4), (CX + 4.5, 0.1, CZ + 2.55)], 0.05, cinza)

# ilhas, bombas, mangueiras, frades, extintor
for iz in (-2.4, 2.4):
    Z = CZ + iz
    caixa("ilha", 6.4, 0.25, 1.3, (CX, 0.125, Z), concreto, bevel=0.06)
    for lado in (-1, 1):
        plano("faixa_ilha", 6.4, 0.24, (CX, 0.125, Z + lado * 0.656), "frente", zebra)
    for bx in (-1.6, 1.6):
        X = CX + bx
        caixa("bomba", 0.95, 1.9, 0.55, (X, 1.2, Z), branco, bevel=0.05)
        caixa("bomba_base", 1.02, 0.14, 0.62, (X, 0.32, Z), escuro, bevel=0.02)
        caixa("bomba_topo", 1.05, 0.16, 0.66, (X, 2.22, Z), escuro, bevel=0.03)
        caixa("bomba_aba", 1.1, 0.08, 0.7, (X, 2.34, Z), amarelo, bevel=0.02)
        for lado in (-1, 1):
            plano("bomba_painel", 0.85, 1.7, (X, 1.22, Z + lado * 0.281), "frente", bomba_face)
        for lado in (-1, 1):
            caixa("suporte_bico", 0.08, 0.3, 0.16, (X + lado * 0.5, 1.35, Z), escuro, bevel=0.02)
            caixa("bico", 0.07, 0.24, 0.1, (X + lado * 0.55, 1.28, Z), borracha, bevel=0.02)
            tubo("mangueira", [(X + lado * 0.45, 2.1, Z), (X + lado * 0.78, 1.7, Z + 0.1), (X + lado * 0.85, 0.6, Z + 0.25),
                               (X + lado * 0.7, 0.45, Z + 0.15), (X + lado * 0.58, 1.1, Z)], 0.025, borracha)
    for fx in (-3.35, 3.35):
        cilindro("frade", 0.09, 1.0, (CX + fx, 0.75, Z), "up", amarelo, lados=16)
        for h in (0.55, 0.85):
            cilindro("frade_faixa", 0.092, 0.08, (CX + fx, h, Z), "up", escuro, lados=16)
        esfera("frade_topo", 0.09, (CX + fx, 1.25, Z), amarelo, sub=2)
    cilindro("extintor", 0.1, 0.5, (CX, 0.52, Z + 0.45), "up", vermelho, lados=16)
    cilindro("extintor_topo", 0.05, 0.1, (CX, 0.82, Z + 0.45), "up", escuro, lados=12)
    caixa("papeleira", 0.3, 0.4, 0.14, (CX - 0.6, 1.0, Z + 0.33), cinza, bevel=0.03)
    cilindro("balde_rodo", 0.14, 0.28, (CX + 0.6, 0.39, Z + 0.45), "up", mat("azul_balde", srgb("#1d4ed8"), 0, 0.5), lados=16)

# calibrador de pneus
cilindro("calibrador_poste", 0.06, 1.3, (CX + 6.8, 0.65, CZ + 5.6), "up", metal, lados=12)
caixa("calibrador", 0.4, 0.55, 0.25, (CX + 6.8, 1.3, CZ + 5.6), amarelo, bevel=0.04)
tubo("calibrador_mangueira", [(CX + 6.8, 1.1, CZ + 5.73), (CX + 6.95, 0.6, CZ + 5.9), (CX + 6.7, 0.35, CZ + 5.95), (CX + 6.6, 0.8, CZ + 5.75)], 0.015, borracha)

# totem (sem preço)
TX, TZ = 19.5, -8.0
for dz in (-0.45, 0.45):
    cilindro("totem_poste", 0.12, 3.2, (TX, 1.6, TZ + dz), "up", metal, lados=16)
caixa("totem_caixa", 0.45, 5.4, 1.5, (TX, 5.9, TZ), branco, bevel=0.06)
for lado in (-1, 1):
    p = plano("totem_face", 1.36, 5.3, (TX + lado * 0.23, 5.9, TZ), "x", totem_m)
    if lado < 0:
        p.scale = (1, -1, 1)

# ══════════════ LOJA DE CONVENIÊNCIA ══════════════
LX0, LX1 = -8.4, -0.4       # fundo … fachada
LZ0, LZ1 = -8.0, 4.0
LH = 4.4
lcx, lcz = (LX0 + LX1) / 2, (LZ0 + LZ1) / 2
corpo = caixa("loja", LX1 - LX0, LH, LZ1 - LZ0, (lcx, LH / 2, lcz), parede)
booleano(corpo, caixa("oco", LX1 - LX0 - 0.4, LH - 0.4, LZ1 - LZ0 - 0.4, (lcx, LH / 2, lcz)))
booleano(corpo, caixa("vao_vitrine", 1.0, 3.2, 10.6, (LX1, 1.95, lcz + 0.2)))
booleano(corpo, caixa("vao_janela_lateral", 1.6, 1.0, 1.0, (-6.0, 2.0, LZ1)))
suavizar(corpo)
caixa("rodape", LX1 - LX0 + 0.06, 0.45, LZ1 - LZ0 + 0.06, (lcx, 0.22, lcz), rodape)
caixa("platibanda", LX1 - LX0 + 0.5, 0.7, LZ1 - LZ0 + 0.5, (lcx, LH + 0.3, lcz), parede, bevel=0.03)
caixa("pingadeira", LX1 - LX0 + 0.7, 0.1, LZ1 - LZ0 + 0.7, (lcx, LH + 0.7, lcz), cinza, bevel=0.02)
caixa("laje", LX1 - LX0 - 0.2, 0.2, LZ1 - LZ0 - 0.2, (lcx, LH - 0.1, lcz), cinza)
caixa("calcada", 1.4, 0.3, LZ1 - LZ0 + 0.4, (LX1 + 0.7, 0.15, lcz), concreto, bevel=0.03)
# vitrine de alumínio com porta dupla no meio
VZ0, VZ1 = lcz + 0.2 - 5.2, lcz + 0.2 + 5.2
n = 8
for k in range(n + 1):
    z = VZ0 + (VZ1 - VZ0) * k / n
    caixa("montante", 0.12, 3.2, 0.1, (LX1 - 0.02, 1.95, z), aluminio, bevel=0.01)
for up in (0.4, 3.5, 2.6):
    caixa("travessa", 0.12, 0.1, VZ1 - VZ0, (LX1 - 0.02, up, lcz + 0.2), aluminio, bevel=0.01)
plano("vidro_vitrine", VZ1 - VZ0, 3.1, (LX1 - 0.05, 1.95, lcz + 0.2), "x", vidro)
for dz in (-0.35, 0.35):
    zp = lcz + 0.2 + dz
    cilindro("puxador", 0.02, 0.5, (LX1 + 0.06, 1.1, zp), "frente", aluminio, lados=10)
plano("tapete_entrada", 1.4, 1.6, (LX1 + 0.8, 0.31, lcz + 0.2), "up", escuro)
# marquise com spots
caixa("marquise", 1.8, 0.2, LZ1 - LZ0 + 0.4, (LX1 + 0.9, 3.95, lcz), metal, bevel=0.03)
for k in range(7):
    cilindro("spot", 0.09, 0.03, (LX1 + 1.2, 3.84, LZ0 + 0.7 + k * 1.75), "up", spot, lados=16)
# letreiro em caixa com letras 3D
caixa("letreiro_caixa", 0.35, 1.9, 7.6, (LX1 + 0.05, 5.55, lcz + 0.2), escuro, bevel=0.05)
plano("letreiro_frente", 7.4, 1.72, (LX1 + 0.23, 5.55, lcz + 0.2), "x", letreiro)
texto("letras", "CONVENIÊNCIA", 0.78, (LX1 + 0.25, 5.8, lcz + 0.2), letra, profundidade=0.06, virado="x+")
texto("letras2", "PONTO DE APOIO · 24H", 0.3, (LX1 + 0.25, 5.1, lcz + 0.2), letra2, profundidade=0.04, virado="x+")
# interior visível pela vitrine
plano("piso", LX1 - LX0 - 0.4, LZ1 - LZ0 - 0.4, (lcx, 0.31, lcz), "up", piso)
tl = plano("teto_luz", 6.4, 10.4, (lcx + 0.4, LH - 0.22, lcz), "up", teto_luz)
tl.rotation_euler = (math.pi, 0, 0)
for k in range(3):
    gx = LX1 - 1.4 - k * 1.8
    caixa("gondola", 0.8, 1.6, 4.2, (gx, 1.1, lcz - 1.6), cinza, bevel=0.03)
    for lado in (-1, 1):
        p = plano("gondola_produtos", 4.1, 1.5, (gx + lado * 0.41, 1.12, lcz - 1.6), "x", produtos)
caixa("geladeiras", 0.8, 2.4, 6.0, (LX0 + 0.6, 1.5, lcz + 1.2), cinza, bevel=0.03)
plano("geladeiras_portas", 5.9, 2.3, (LX0 + 1.01, 1.5, lcz + 1.2), "x", geladeira)
caixa("balcao", 1.1, 1.1, 3.0, (LX1 - 1.6, 0.85, LZ1 - 1.4), madeira, bevel=0.04)
caixa("balcao_tampo", 1.2, 0.06, 3.1, (LX1 - 1.6, 1.43, LZ1 - 1.4), escuro, bevel=0.02)
caixa("caixa_registradora", 0.4, 0.3, 0.35, (LX1 - 1.6, 1.6, LZ1 - 0.6), escuro, bevel=0.03)
# janela lateral com grade
for k in range(6):
    cilindro("grade_janela", 0.012, 1.0, (-6.75 + k * 0.3, 2.0, LZ1 + 0.02), "up", metal, lados=6)
plano("vidro_lateral", 1.6, 1.0, (-6.0, 2.0, LZ1 - 0.02), "frente", vidro)
# caixa d'água azul no telhado
cilindro("caixa_agua", 0.9, 1.3, (-6.4, LH + 0.95, -5.5), "up", azul, lados=32, raio2=0.82, bevel=0.03)
cilindro("caixa_agua_tampa", 0.95, 0.12, (-6.4, LH + 1.65, -5.5), "up", azul, lados=32, bevel=0.03)
for h in (0.6, 1.0):
    cilindro("caixa_agua_friso", 0.905, 0.04, (-6.4, LH + h, -5.5), "up", azul, lados=32)
caixa("caixa_agua_base", 2.0, 0.2, 2.0, (-6.4, LH + 0.2, -5.5), concreto)
# ar-condicionado na parede lateral (+z), arandelas, calhas
for zx in (-3.0, -1.6):
    caixa("condensadora", 0.85, 0.62, 0.35, (zx, 3.0, LZ1 + 0.2), branco, bevel=0.04)
    cilindro("ventilador", 0.24, 0.02, (zx - 0.12, 3.0, LZ1 + 0.38), "frente", escuro, lados=24)
    tubo("dreno", [(zx + 0.3, 2.7, LZ1 + 0.05), (zx + 0.3, 1.5, LZ1 + 0.05)], 0.012, cinza)
for zx in (-7.5, -4.5, -1.2):
    caixa("arandela", 0.3, 0.2, 0.14, (zx, 3.4, LZ1 + 0.08), metal, bevel=0.02)
    caixa("arandela_luz", 0.26, 0.05, 0.12, (zx, 3.29, LZ1 + 0.1), arandela)
for zz in (LZ0 + 0.1, LZ1 - 0.1):
    tubo("calha_loja", [(LX1 + 0.1, LH + 0.6, zz), (LX1 + 0.12, 2.0, zz), (LX1 + 0.2, 0.35, zz)], 0.05, cinza)
# gaiola de botijões (bem brasileiro) junto à parede lateral
GX, GZ = -3.9, LZ1 + 1.2
caixa("gaiola_base", 2.2, 0.08, 0.9, (GX, 0.04, GZ), metal)
caixa("gaiola_teto", 2.2, 0.06, 0.9, (GX, 1.35, GZ), metal)
for k in range(12):
    x = GX - 1.08 + k * (2.16 / 11)
    cilindro("gaiola_barra", 0.012, 1.3, (x, 0.7, GZ + 0.44), "up", metal, lados=6)
for k in range(4):
    x = GX - 0.75 + k * 0.5
    cilindro("botijao", 0.18, 0.55, (x, 0.36, GZ), "up", azul_gas, lados=20, bevel=0.05)
    cilindro("botijao_alca", 0.1, 0.1, (x, 0.7, GZ), "up", azul_gas, lados=16, raio2=0.08)
# freezer de gelo, lixeiras seletivas, banco
caixa("freezer", 0.8, 1.1, 1.6, (LX1 + 0.35, 0.85, LZ0 + 0.6), branco, bevel=0.06)
plano("freezer_marca", 1.4, 0.6, (LX1 + 0.76, 0.95, LZ0 + 0.6), "x", gelo)
for k, cor in enumerate(["#2563eb", "#dc2626", "#16a34a", "#f59e0b"]):
    z = LZ1 + 0.1 - k * 0.52
    caixa("lixeira", 0.45, 0.75, 0.45, (LX1 + 1.15, 0.67, z), mat("lixeira_" + str(k), srgb(cor), 0, 0.5), bevel=0.05)
    caixa("lixeira_tampa", 0.48, 0.06, 0.48, (LX1 + 1.15, 1.07, z), escuro, bevel=0.02)
for k in range(4):
    caixa("banco_ripa", 0.1, 0.04, 1.8, (LX1 + 1.0 + k * 0.12, 0.75, lcz - 3.2), madeira, bevel=0.01)
for dz in (-0.75, 0.75):
    caixa("banco_pe", 0.5, 0.45, 0.06, (LX1 + 1.18, 0.52, lcz - 3.2 + dz), metal)

# junta por material
por_mat = {}
for o in list(bpy.context.scene.objects):
    if o.type == "MESH" and o.data.materials:
        por_mat.setdefault(o.data.materials[0].name, []).append(o)
for nome, objs in por_mat.items():
    if len(objs) > 1:
        juntar("posto_" + nome, objs)
    else:
        objs[0].name = "posto_" + nome

if a.get("saida"):
    exportar(a["saida"])
    print("GLB:", a["saida"])
if a.get("previa"):
    previa(a["previa"], cam_site=(22, 5.5, 16), alvo_site=(3, 2.4, -1), lente=26)
    print("prévia:", a["previa"])
