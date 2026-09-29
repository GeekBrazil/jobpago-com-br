"""Motorhome (classe C, cabine de van com capuchino) para o cenário da JobPago.

    blender -b --python motorhome.py -- saida motorhome.glb previa previa.png

Coordenadas do site (ver comum.py): largura x (o lado do toldo é -x), up, frente
(+ = dianteira). Chão em up=0. ILUSTRAÇÃO — não é um veículo real.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from comum import (P, args, caixa, chanfro, cilindro, esfera, exportar, juntar, limpar, mat, perfil, placa,
                   plano, previa, ret_arred, ret_em, srgb, suavizar, tex, tubo, booleano)

import bmesh
import bpy

a = args()
limpar()

# ── materiais ──
pintura = mat("pintura", srgb("#efece4"), 0.1, 0.28)
plastico = mat("plastico_escuro", srgb("#2a2d31"), 0.0, 0.6)
borracha = mat("borracha", srgb("#111111"), 0.0, 0.92)
cromado = mat("cromado", srgb("#d9dde2"), 1.0, 0.16)
aro = mat("aro", srgb("#b9bfc7"), 0.9, 0.28)
vidro = mat("vidro", srgb("#0b1015"), 0.7, 0.05)
janela = mat("luz_janela", srgb("#17120d"), 0.3, 0.08, emissao=srgb("#ffb060"), forca=0.5)
farol = mat("luz_farol", srgb("#eef2f6"), 0.0, 0.1, emissao=srgb("#fff3dc"), forca=2.0)
lanterna = mat("luz_lanterna", srgb("#7a0000"), 0.0, 0.2, emissao=srgb("#ff2020"), forca=2.0)
ambar = mat("luz_ambar", srgb("#9a4a05"), 0.0, 0.2, emissao=srgb("#ffa000"), forca=1.5)
varal = mat("luz_varal", srgb("#ffe2b0"), 0.0, 0.3, emissao=srgb("#ffc070"), forca=6.0)
decal = mat("decalque", (1, 1, 1), 0.0, 0.3, imagem=tex("decal"))
lona = mat("lona_toldo", (1, 1, 1), 0.0, 0.85, imagem=tex("toldo"))
laranja = mat("lona_laranja", srgb("#c96a2b"), 0.0, 0.85)
solar = mat("painel_solar", (1, 1, 1), 0.2, 0.25, imagem=tex("solar"))
placa_m = mat("placa", (1, 1, 1), 0.0, 0.4, imagem=tex("placa"))
grade_m = mat("grade", (1, 1, 1), 0.3, 0.5, imagem=tex("grade"))
acrilico = mat("claraboia", srgb("#dfe8ee"), 0.0, 0.2, alfa=0.7)

W = 1.17   # meia largura da carroceria
WC = 1.04  # meia largura da cabine
RODAS = [-2.2, 3.35]
R_RODA = 0.45

# ── carroceria e cabine ──
casa = perfil("casa", [(-3.62, 0.74), (2.25, 0.74), (2.25, 2.2), (3.0, 2.27), (3.28, 2.36), (3.42, 2.56), (3.42, 2.82),
                       (3.28, 3.06), (2.98, 3.16), (-3.42, 3.2), (-3.6, 3.1), (-3.62, 2.92)], -W, W, pintura, bevel=0.07, seg=4)
cab = perfil("cabine", [(2.1, 0.42), (4.18, 0.42), (4.3, 0.58), (4.3, 1.02), (4.16, 1.26), (3.86, 1.38), (3.36, 2.1),
                        (3.12, 2.25), (2.1, 2.25)], -WC, WC, pintura, bevel=0.08, seg=4)
# caixas de roda recortadas na lataria
for fr in RODAS:
    for alvo in (casa, cab):
        booleano(alvo, cilindro("corte", 0.53, 3.0, (0, R_RODA, fr), "x", lados=40))
for o in (casa, cab):
    suavizar(o)
for fr in RODAS:  # forro escuro dentro da caixa de roda
    cilindro("forro", 0.51, 2.0, (0, R_RODA, fr), "x", plastico, lados=32)

# ── rodas: pneu arredondado, aro com furos, calota e porcas ──
for fr in RODAS:
    for s in (-1, 1):
        cilindro("pneu", R_RODA, 0.25, (s * 0.98, R_RODA, fr), "x", borracha, lados=36, bevel=0.07, seg=4)
        cilindro("aro", 0.28, 0.24, (s * 0.99, R_RODA, fr), "x", aro, lados=36, bevel=0.015)
        cilindro("calota", 0.1, 0.26, (s * 1.0, R_RODA, fr), "x", cromado, lados=20, bevel=0.02)
        for k in range(6):
            ang = k * math.pi / 3
            cilindro("furo", 0.05, 0.02, (s * 1.112, R_RODA + math.sin(ang) * 0.185, fr + math.cos(ang) * 0.185), "x", plastico, lados=14)
            cilindro("porca", 0.018, 0.03, (s * 1.12, R_RODA + math.sin(ang + 0.5) * 0.07, fr + math.cos(ang + 0.5) * 0.07), "x", cromado, lados=6)

# ── saias escuras entre as rodas, para-choques, chassi ──
for s in (-1, 1):
    caixa("saia", 0.05, 0.2, 3.55, (s * (W + 0.01), 0.86, 0.35), plastico, bevel=0.015)
    caixa("saia_tras", 0.05, 0.2, 0.75, (s * (W + 0.01), 0.86, -3.2), plastico, bevel=0.015)
    caixa("lameiro", 0.28, 0.36, 0.02, (s * 0.98, 0.3, -2.8), borracha)
caixa("parachoque", 2.14, 0.3, 0.32, (0, 0.55, 4.3), plastico, bevel=0.08)
caixa("parachoque_tras", 2.36, 0.26, 0.24, (0, 0.86, -3.66), plastico, bevel=0.06)
caixa("chassi", 1.7, 0.28, 5.6, (0, 0.62, -0.4), plastico)
cilindro("escape", 0.04, 0.5, (0.7, 0.5, -3.55), "frente", cromado, lados=12)

# ── frente: grade, faróis, setas, faróis de neblina, placa ──
plano("grade", 1.2, 0.36, (0, 0.82, 4.306), "frente", grade_m)
for s in (-1, 1):
    caixa("farol", 0.44, 0.2, 0.06, (s * 0.72, 0.99, 4.27), farol, bevel=0.035)
    caixa("seta", 0.12, 0.1, 0.05, (s * 0.99, 0.99, 4.24), ambar, bevel=0.02)
    cilindro("neblina", 0.06, 0.05, (s * 0.72, 0.55, 4.46), "frente", farol, lados=16)
plano("placa", 0.52, 0.17, (0, 0.6, 4.465), "frente", placa_m)

# ── para-brisa inclinado com moldura, limpadores ──
ang = math.atan2(3.86 - 3.36, 2.1 - 1.38)  # inclinação em relação à vertical
for nome, larg, alt, material, recuo in (("moldura_pb", 1.98, 0.95, plastico, 0.004), ("parabrisa", 1.9, 0.86, vidro, 0.012)):
    pb = plano(nome, larg, alt, (0, 1.74, 3.61), "frente", material)
    pb.rotation_euler = (-ang, 0, 0)
    pb.location = P(0, 1.74 + recuo * math.sin(ang), 3.61 + recuo * math.cos(ang))
for s in (-0.45, 0.4):
    lp = caixa("limpador", 0.62, 0.02, 0.02, (s, 1.44, 3.84), plastico)
    lp.rotation_euler = (-ang, 0.35, 0)

# ── janelas da cabine (trapézio que acompanha a coluna), retrovisores, maçaneta ──
for s in (-1, 1):
    pts = [(2.32, 1.42), (3.3, 1.42), (2.96, 2.08), (2.32, 2.08)]
    placa("janela_cab_moldura", [(fr - 0.03 if fr < 2.5 else fr + 0.02, up - 0.03 if up < 1.6 else up + 0.02) for fr, up in pts], "x", s * WC, s, 0.012, plastico)
    placa("janela_cab", pts, "x", s * (WC + 0.012), s, 0.004, vidro)
    tubo("braco_retrovisor", [(s * WC, 1.72, 3.28), (s * 1.18, 1.78, 3.32), (s * 1.28, 1.8, 3.34)], 0.018, plastico)
    caixa("retrovisor", 0.12, 0.36, 0.22, (s * 1.33, 1.82, 3.36), plastico, bevel=0.04)
    caixa("espelho", 0.1, 0.3, 0.01, (s * 1.33, 1.82, 3.245), vidro)
    caixa("macaneta_cab", 0.02, 0.04, 0.16, (s * (WC + 0.02), 1.32, 2.5), plastico, bevel=0.01)
    # contorno da porta da cabine
    placa("friso_porta_cab", [(2.2, 0.62), (2.24, 0.62), (2.24, 2.14), (2.2, 2.14)], "x", s * WC, s, 0.004, plastico)

# ── janelas da casa (acrílico escuro com moldura), porta, bagageiros, decalque ──
JANELAS = {
    -1: [(-2.6, 2.28, 1.2, 0.72), (1.25, 2.28, 0.95, 0.66), (2.85, 2.74, 0.5, 0.26)],
    1: [(-1.7, 2.28, 1.4, 0.72), (0.9, 2.28, 1.15, 0.72), (2.85, 2.74, 0.5, 0.26)],
}
for s, js in JANELAS.items():
    for fr, up, lw, lh in js:
        placa("moldura_janela", ret_em(fr, up, lw + 0.12, lh + 0.12, 0.13), "x", s * W, s, 0.026, plastico, bevel=0.01)
        placa("janela", ret_em(fr, up, lw, lh, 0.1), "x", s * (W + 0.026), s, 0.004, janela)
    # decalque de faixas
    d = plano("decalque", 5.9, 1.475, (s * (W + 0.004), 1.62, -0.55), "x", decal)
    if s < 0:
        d.scale = (1, -1, 1)
    # bagageiros
    for fr, lw in ([(-2.95, 0.9), (1.75, 0.7)] if s < 0 else [(-2.7, 1.0), (0.1, 0.8), (1.75, 0.6)]):
        placa("friso_bagageiro", ret_em(fr, 1.12, lw + 0.03, 0.47, 0.06), "x", s * W, s, 0.003, plastico)
        placa("bagageiro", ret_em(fr, 1.12, lw, 0.44, 0.05), "x", s * (W + 0.003), s, 0.006, pintura)
        caixa("fechadura", 0.02, 0.04, 0.04, (s * (W + 0.012), 1.12, fr + lw / 2 - 0.1), cromado)
    # luzes de posição laterais
    for fr in (-3.3, -0.4, 2.0):
        caixa("pisca_lateral", 0.02, 0.05, 0.12, (s * (W + 0.01), 0.99, fr), ambar, bevel=0.01)

# porta de entrada (lado do toldo)
placa("friso_porta", ret_em(0.55, 1.72, 0.74, 1.98, 0.12), "x", -W, -1, 0.004, plastico)
placa("porta", ret_em(0.55, 1.72, 0.7, 1.94, 0.11), "x", -(W + 0.004), -1, 0.01, pintura)
placa("moldura_janela_porta", ret_em(0.55, 2.25, 0.5, 0.56, 0.1), "x", -(W + 0.014), -1, 0.01, plastico)
placa("janela_porta", ret_em(0.55, 2.25, 0.42, 0.48, 0.08), "x", -(W + 0.024), -1, 0.003, janela)
caixa("macaneta", 0.04, 0.05, 0.2, (-(W + 0.04), 1.58, 0.82), cromado, bevel=0.015)
caixa("degrau", 0.36, 0.05, 0.62, (-(W + 0.2), 0.46, 0.55), aro, bevel=0.015)
caixa("luz_entrada", 0.05, 0.08, 0.22, (-(W + 0.03), 2.78, 0.1), varal, bevel=0.02)

# ── traseira: lanternas, janela, escada ──
for s in (-1, 1):
    caixa("lanterna", 0.16, 0.74, 0.06, (s * 1.06, 1.42, -3.64), lanterna, bevel=0.03)
    caixa("lanterna_ambar", 0.16, 0.14, 0.061, (s * 1.06, 1.88, -3.64), ambar, bevel=0.02)
    cilindro("escada_trilho", 0.02, 2.3, (0.3 * s, 2.12, -3.7), "up", aro, lados=10)
placa("moldura_janela_tras", ret_em(0, 2.5, 1.02, 0.46, 0.1), "frente", -3.62, -1, 0.02, plastico)
placa("janela_tras", ret_em(0, 2.5, 0.94, 0.38, 0.08), "frente", -3.64, -1, 0.004, janela)
for k in range(7):
    cilindro("degrau_escada", 0.016, 0.6, (0, 1.05 + k * 0.33, -3.7), "x", aro, lados=8)

# ── teto: ar-condicionado, painéis solares, claraboia, trilhos, antena ──
caixa("ar_condicionado", 0.8, 0.26, 1.0, (0, 3.33, -1.6), pintura, bevel=0.1)
for k in range(6):
    caixa("grelha_ar", 0.62, 0.012, 0.035, (0, 3.465, -1.95 + k * 0.12), plastico)
for fr in (0.15, 1.55):
    caixa("moldura_solar", 1.04, 0.04, 1.34, (0.3, 3.24, fr), aro, bevel=0.01)
    plano("painel_solar", 1.0, 1.3, (0.3, 3.262, fr), "up", solar)
cilindro("claraboia", 0.32, 0.14, (-0.5, 3.27, -3.0), "up", acrilico, lados=24, raio2=0.2)
cilindro("antena", 0.16, 0.05, (-0.55, 3.25, 2.3), "up", pintura, lados=20)

# ── toldo aberto: caixa, lona com barriga, sanefa, braços, pés, varal ──
FR0, FR1 = -3.25, 1.35
X_PAREDE, ALT_TOLDO, ALCANCE = -(W + 0.09), 2.97, 2.5
cilindro("caixa_toldo", 0.085, FR1 - FR0 + 0.2, (X_PAREDE, ALT_TOLDO, (FR0 + FR1) / 2), "frente", pintura, lados=16)
bm = bmesh.new()
uv = bm.loops.layers.uv.new()
nu, nv = 24, 10
grade = [[None] * (nv + 1) for _ in range(nu + 1)]
for i in range(nu + 1):
    for j in range(nv + 1):
        u, v = i / nu, j / nv
        fr = FR0 + u * (FR1 - FR0)
        alcance = v * ALCANCE
        up = ALT_TOLDO - alcance * 0.26 - math.sin(v * math.pi) * 0.07 - math.sin(u * math.pi) * 0.02
        grade[i][j] = bm.verts.new(P(X_PAREDE - alcance, up, fr))
for i in range(nu):
    for j in range(nv):
        f = bm.faces.new([grade[i][j], grade[i + 1][j], grade[i + 1][j + 1], grade[i][j + 1]])
        for l, (du, dv) in zip(f.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]):
            l[uv].uv = ((i + du) / nu * 3, (j + dv) / nv)
me = bpy.data.meshes.new("lona")
bm.to_mesh(me)
bm.free()
lona_o = bpy.data.objects.new("lona", me)
bpy.context.scene.collection.objects.link(lona_o)
lona_o.data.materials.append(lona)
mod = lona_o.modifiers.new("espessura", "SOLIDIFY")
mod.thickness = 0.01
suavizar(lona_o)
X_BARRA = X_PAREDE - ALCANCE
UP_BARRA = ALT_TOLDO - ALCANCE * 0.26
cilindro("barra_toldo", 0.03, FR1 - FR0 + 0.1, (X_BARRA, UP_BARRA, (FR0 + FR1) / 2), "frente", aro, lados=12)
sanefa = plano("sanefa", FR1 - FR0, 0.22, (X_BARRA - 0.035, UP_BARRA - 0.12, (FR0 + FR1) / 2), "x", laranja)
for fr in (FR0 + 0.1, FR1 - 0.1):
    tubo("braco_toldo", [(X_PAREDE + 0.05, 1.05, fr), (X_BARRA + 0.6, UP_BARRA - 0.25, fr), (X_BARRA, UP_BARRA, fr)], 0.02, aro)
    cilindro("pe_toldo", 0.022, UP_BARRA, (X_BARRA, UP_BARRA / 2, fr), "up", aro, lados=10)
    cilindro("sapata", 0.08, 0.02, (X_BARRA, 0.01, fr), "up", aro, lados=12)
fios = []
for k in range(15):
    t = k / 14
    fr = FR0 + 0.15 + t * (FR1 - FR0 - 0.3)
    up = UP_BARRA - 0.2 - math.sin(t * math.pi) * 0.22
    fios.append((X_BARRA - 0.02, up, fr))
    esfera("lampada", 0.055, (X_BARRA - 0.02, up - 0.07, fr), varal, sub=1)
tubo("fio_varal", fios, 0.006, plastico)

# junta tudo por material (menos nós no GLB)
por_mat = {}
for o in list(bpy.context.scene.objects):
    if o.type == "MESH" and o.data.materials:
        por_mat.setdefault(o.data.materials[0].name, []).append(o)
for nome, objs in por_mat.items():
    if len(objs) > 1:
        juntar("mh_" + nome, objs)
    else:
        objs[0].name = "mh_" + nome

if a.get("saida"):
    exportar(a["saida"])
    print("GLB:", a["saida"])
if a.get("previa"):
    previa(a["previa"], cam_site=(-7.5, 2.4, 7.0), alvo_site=(0, 1.5, 0.2), lente=32)
    print("prévia:", a["previa"])
