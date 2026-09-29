"""Funções comuns para modelar o cenário da JobPago no Blender (headless).

Convenção de eixos: os modelos são descritos nas coordenadas do Three.js do
site — x = largura, y = altura (up), z = frente — e convertidos para o Blender
por P(x, up, frente) = (x, -frente, up). O exportador glTF (+Y para cima) devolve
exatamente as coordenadas do site.

Materiais com nome começando por "luz_" têm emissão; o site acende/apaga essas
luzes com a noite pelo nome.
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

PASTA_TEX = os.environ.get("CENARIO_TEX", "/tmp/cenario-tex")
os.makedirs(PASTA_TEX, exist_ok=True)


def P(x, up, frente):
    return Vector((x, -frente, up))


def limpar():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def colecao(nome):
    c = bpy.data.collections.new(nome)
    bpy.context.scene.collection.children.link(c)
    return c


# ─────────────── materiais ───────────────
_mats = {}


def mat(nome, cor, metal=0.0, rug=0.5, emissao=None, forca=0.0, alfa=1.0, imagem=None, imagem_normal=None):
    if nome in _mats:
        return _mats[nome]
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*cor, 1.0)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rug
    if emissao is not None:
        b.inputs["Emission Color"].default_value = (*emissao, 1.0)
        b.inputs["Emission Strength"].default_value = forca
    if alfa < 1.0:
        b.inputs["Alpha"].default_value = alfa
        m.blend_method = "BLEND"
    if imagem:
        t = m.node_tree.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(imagem)
        m.node_tree.links.new(t.outputs["Color"], b.inputs["Base Color"])
        if t.image.depth == 32 or imagem.endswith(".png"):
            m.node_tree.links.new(t.outputs["Alpha"], b.inputs["Alpha"])
        if emissao is not None:
            m.node_tree.links.new(t.outputs["Color"], b.inputs["Emission Color"])
    if imagem_normal:
        t = m.node_tree.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(imagem_normal)
        t.image.colorspace_settings.name = "Non-Color"
        n = m.node_tree.nodes.new("ShaderNodeNormalMap")
        m.node_tree.links.new(t.outputs["Color"], n.inputs["Color"])
        m.node_tree.links.new(n.outputs["Normal"], b.inputs["Normal"])
    _mats[nome] = m
    return m


def srgb(hexcor):
    """#rrggbb -> tupla linear (o Blender trabalha em linear)."""
    h = hexcor.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


# ─────────────── objetos ───────────────
def _novo(nome, me, material=None, colecao_=None):
    o = bpy.data.objects.new(nome, me)
    (colecao_ or bpy.context.scene.collection).objects.link(o)
    if material:
        o.data.materials.append(material)
    return o


def ativo(o):
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o


def aplicar_mods(o):
    ativo(o)
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)


def chanfro(o, largura=0.04, seg=3, angulo=35, aplicar=True):
    m = o.modifiers.new("chanfro", "BEVEL")
    m.width = largura
    m.segments = seg
    m.limit_method = "ANGLE"
    m.angle_limit = math.radians(angulo)
    m.harden_normals = False
    if aplicar:
        aplicar_mods(o)
    suavizar(o)
    return o


def suavizar(o, angulo=35):
    ativo(o)
    # Blender 4.1+: "por ângulo" sem depender do asset de nós (que não existe em modo headless vazio)
    if hasattr(bpy.ops.object, "shade_smooth_by_angle"):
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angulo))
    else:
        bpy.ops.object.shade_smooth()


def caixa(nome, larg, alt, comp, centro, material=None, bevel=0.0, seg=3, col=None):
    """larg (x) × alt (up) × comp (frente), centro em coords do site."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * larg, v.co.y * comp, v.co.z * alt))
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    o = _novo(nome, me, material, col)
    o.location = P(*centro)
    if bevel > 0:
        chanfro(o, bevel, seg)
    return o


def cilindro(nome, raio, compr, centro, eixo="x", material=None, lados=24, bevel=0.0, seg=2, raio2=None, col=None):
    """cilindro com eixo em x, up ou frente (coords do site)."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=lados, radius1=raio, radius2=raio if raio2 is None else raio2, depth=compr)
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    o = _novo(nome, me, material, col)
    o.location = P(*centro)
    if eixo == "x":
        o.rotation_euler = (0, math.pi / 2, 0)
    elif eixo == "frente":
        o.rotation_euler = (math.pi / 2, 0, 0)
    ativo(o)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    if bevel > 0:
        chanfro(o, bevel, seg)
    else:
        suavizar(o)
    return o


def perfil(nome, pontos, x0, x1, material=None, bevel=0.0, seg=4, col=None):
    """Extruda um perfil lateral [(frente, up), ...] de x0 até x1."""
    bm = bmesh.new()
    vs = [bm.verts.new(P(x0, u, f)) for f, u in pontos]
    face = bm.faces.new(vs)
    bmesh.ops.recalc_face_normals(bm, faces=[face])
    r = bmesh.ops.extrude_face_region(bm, geom=[face])
    novos = [e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=novos, vec=Vector((x1 - x0, 0, 0)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    o = _novo(nome, me, material, col)
    if bevel > 0:
        chanfro(o, bevel, seg)
    return o


def ret_arred(larg, alt, raio, passos=6):
    """pontos 2D (a, b) de um retângulo arredondado centrado, sentido anti-horário."""
    pts = []
    cx, cy = larg / 2 - raio, alt / 2 - raio
    for q, (sx, sy) in enumerate([(1, 1), (-1, 1), (-1, -1), (1, -1)]):
        for i in range(passos + 1):
            a = math.pi / 2 * q + (math.pi / 2) * i / passos
            pts.append((sx * cx + raio * math.cos(a), sy * cy + raio * math.sin(a)))
    return pts


def placa_lateral(nome, lado, larg, alt, raio, centro_frente, centro_up, x_face, esp, material, col=None, bevel=0.0):
    """Peça em retângulo arredondado colada numa face lateral (lado = -1 ou +1)."""
    pts = ret_arred(larg, alt, raio)
    bm = bmesh.new()
    vs = [bm.verts.new(P(x_face, centro_up + b, centro_frente + a)) for a, b in pts]
    face = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[face])
    novos = [e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=novos, vec=Vector((lado * esp, 0, 0)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    o = _novo(nome, me, material, col)
    if bevel > 0:
        chanfro(o, bevel, 2)
    return o


def booleano(alvo, cortador, op="DIFFERENCE"):
    m = alvo.modifiers.new("bool", "BOOLEAN")
    m.object = cortador
    m.operation = op
    m.solver = "EXACT"
    ativo(alvo)
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cortador, do_unlink=True)


def plano(nome, larg, alt, centro, normal="x", material=None, col=None):
    """plano retangular: normal em x (lateral), frente ou up."""
    bm = bmesh.new()
    a, b = larg / 2, alt / 2
    if normal == "x":
        cs = [P(0, -b, -a), P(0, -b, a), P(0, b, a), P(0, b, -a)]
    elif normal == "frente":
        cs = [P(-a, -b, 0), P(a, -b, 0), P(a, b, 0), P(-a, b, 0)]
    else:
        cs = [P(-a, 0, -b), P(a, 0, -b), P(a, 0, b), P(-a, 0, b)]
    vs = [bm.verts.new(c) for c in cs]
    bm.faces.new(vs)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uv = bm.loops.layers.uv.new()
    for f in bm.faces:
        for l, (u, v) in zip(f.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]):
            l[uv].uv = (u, v)
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    o = _novo(nome, me, material, col)
    o.location = P(*centro)
    return o


def tubo(nome, pontos, raio, material=None, col=None):
    cu = bpy.data.curves.new(nome, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = raio
    cu.bevel_resolution = 3
    sp = cu.splines.new("NURBS")
    sp.points.add(len(pontos) - 1)
    for p, c in zip(sp.points, pontos):
        v = P(*c)
        p.co = (v.x, v.y, v.z, 1)
    sp.use_endpoint_u = True
    sp.order_u = min(4, len(pontos))
    o = _novo(nome, cu, material, col)
    ativo(o)
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.view_layer.objects.active
    suavizar(o)
    return o


def texto(nome, conteudo, tamanho, centro, material, profundidade=0.05, virado="x+", col=None):
    cu = bpy.data.curves.new(nome, "FONT")
    cu.body = conteudo
    cu.size = tamanho
    cu.extrude = profundidade
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    fonte = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    if os.path.exists(fonte):
        cu.font = bpy.data.fonts.load(fonte)
    o = _novo(nome, cu, material, col)
    o.location = P(*centro)
    # texto nasce no plano XY do Blender (deitado); coloca de pé virado para o lado pedido
    if virado == "x+":
        o.rotation_euler = (math.pi / 2, 0, math.pi / 2)
    elif virado == "frente+":
        o.rotation_euler = (math.pi / 2, 0, math.pi)
    ativo(o)
    bpy.ops.object.convert(target="MESH")
    return bpy.context.view_layer.objects.active


def tex(nome):
    """caminho de uma textura gerada por gerar_texturas.py (Python do sistema, com PIL)."""
    return os.path.join(PASTA_TEX, nome + ".png")


# ─────────────── saída ───────────────
def exportar(caminho, objs=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in (objs or bpy.context.scene.objects):
        if o.type == "MESH":
            o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=caminho, export_format="GLB", use_selection=True, export_apply=True, export_yup=True)


def previa(caminho, cam_site, alvo_site, lente=35, res=(1280, 720), amostras=48, luz_noite=False):
    cena = bpy.context.scene
    cena.render.engine = "CYCLES"
    cena.cycles.samples = amostras
    cena.cycles.use_denoising = False  # o Blender do sistema não tem OpenImageDenoise
    cena.render.resolution_x, cena.render.resolution_y = res
    cena.render.filepath = caminho
    if cena.world is None:
        cena.world = bpy.data.worlds.new("mundo")
    cena.world.use_nodes = True
    bg = cena.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.35, 0.32, 0.38, 1) if not luz_noite else (0.03, 0.03, 0.06, 1)
    bg.inputs["Strength"].default_value = 1.0 if not luz_noite else 0.4
    sol = bpy.data.lights.new("sol", "SUN")
    sol.energy = 3.0 if not luz_noite else 0.2
    sol.color = (1.0, 0.75, 0.55)
    so = bpy.data.objects.new("sol", sol)
    cena.collection.objects.link(so)
    so.rotation_euler = (math.radians(60), 0, math.radians(35))
    cd = bpy.data.cameras.new("cam")
    cd.lens = lente
    co = bpy.data.objects.new("cam", cd)
    cena.collection.objects.link(co)
    co.location = P(*cam_site)
    direcao = P(*alvo_site) - co.location
    co.rotation_euler = direcao.to_track_quat("-Z", "Y").to_euler()
    cena.camera = co
    chao = plano("chao_previa", 80, 80, (0, 0, 0), normal="up", material=mat("chao_previa", (0.25, 0.25, 0.24), rug=0.9))
    bpy.ops.render.render(write_still=True)
    for o in (so, co, chao):
        bpy.data.objects.remove(o, do_unlink=True)


def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return dict(zip(a[::2], a[1::2]))


def placa(nome, pts, eixo, pos, lado, esp, material, col=None, bevel=0.0):
    """Peça plana extrudada. eixo 'x': pts = [(frente, up)] no plano x=pos;
    eixo 'frente': pts = [(x, up)] no plano frente=pos. Cresce `esp` para o `lado` (+1/-1)."""
    bm = bmesh.new()
    if eixo == "x":
        vs = [bm.verts.new(P(pos, b, a)) for a, b in pts]
        desloc = P(lado * esp, 0, 0)
    else:
        vs = [bm.verts.new(P(a, b, pos)) for a, b in pts]
        desloc = P(0, 0, lado * esp)
    face = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[face])
    novos = [e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=novos, vec=desloc)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    o = _novo(nome, me, material, col)
    if bevel > 0:
        chanfro(o, bevel, 2)
    return o


def ret_em(cx, cy, larg, alt, raio, passos=6):
    return [(cx + a, cy + b) for a, b in ret_arred(larg, alt, raio, passos)]


def esfera(nome, raio, centro, material, sub=2, col=None):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=raio)
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    o = _novo(nome, me, material, col)
    o.location = P(*centro)
    suavizar(o)
    return o


def juntar(nome, objs):
    """junta objetos (mesmo material ou não) num só, para exportar menos nós."""
    objs = [o for o in objs if o is not None]
    ativo(objs[0])
    for o in objs[1:]:
        o.select_set(True)
    bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = nome
    return o
