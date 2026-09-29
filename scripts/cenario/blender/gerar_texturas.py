"""Texturas desenhadas para os modelos do Blender (motorhome e posto).
Roda no Python do sistema (precisa de PIL):  python3 gerar_texturas.py [pasta]
"""
import math
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

PASTA = sys.argv[1] if len(sys.argv) > 1 else "/tmp/cenario-tex"
os.makedirs(PASTA, exist_ok=True)
random.seed(7)
FONTE = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"


def f(tam, mono=False):
    return ImageFont.truetype(MONO if mono else FONTE, tam)


def salvar(im, nome):
    im.save(os.path.join(PASTA, nome + ".png"))


# decalque lateral do motorhome: três faixas em curva (verde-mar, laranja, amarelo)
im = Image.new("RGBA", (2048, 512), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
def faixa(cor, y0, esp):
    pts_a, pts_b = [], []
    for i in range(0, 2049, 16):
        t = i / 2048
        y = y0 - 230 * (t ** 2.2)
        pts_a.append((i, y)); pts_b.append((i, y + esp))
    d.polygon(pts_a + pts_b[::-1], fill=cor)
faixa((15, 118, 110, 255), 400, 56); faixa((217, 119, 43, 255), 464, 26); faixa((242, 183, 5, 255), 498, 12)
salvar(im, "decal")

# lona do toldo
im = Image.new("RGB", (1024, 256)); d = ImageDraw.Draw(im)
for i in range(16):
    d.rectangle([i * 64, 0, i * 64 + 63, 255], fill=(243, 239, 228) if i % 2 else (201, 106, 43))
salvar(im.filter(ImageFilter.GaussianBlur(0.6)), "toldo")

# painel solar
im = Image.new("RGB", (256, 512), (15, 31, 61)); d = ImageDraw.Draw(im)
for x in range(0, 257, 42): d.line([(x, 0), (x, 512)], fill=(100, 120, 160), width=2)
for y in range(0, 513, 42): d.line([(0, y), (256, y)], fill=(100, 120, 160), width=2)
d.rectangle([0, 0, 255, 511], outline=(200, 205, 212), width=10)
salvar(im, "solar")

# placa Mercosul
im = Image.new("RGB", (512, 168), (248, 250, 252)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 511, 34], fill=(30, 58, 138))
d.text((256, 17), "BRASIL", font=f(22), fill="white", anchor="mm")
d.text((256, 102), "JBP1A26", font=f(92, True), fill=(17, 17, 17), anchor="mm")
d.rectangle([2, 2, 509, 165], outline=(17, 17, 17), width=6)
salvar(im, "placa")

# grade dianteira
im = Image.new("RGB", (512, 128), (18, 20, 24)); d = ImageDraw.Draw(im)
for y in range(10, 128, 22): d.rounded_rectangle([14, y, 498, y + 10], 5, fill=(58, 64, 72))
salvar(im, "grade")

# faixa da cobertura do posto
im = Image.new("RGB", (2048, 192), (244, 242, 236)); d = ImageDraw.Draw(im)
d.rectangle([0, 66, 2048, 122], fill=(245, 158, 11)); d.rectangle([0, 122, 2048, 134], fill=(194, 65, 12))
d.rectangle([0, 172, 2048, 192], fill=(31, 35, 40))
salvar(im, "fascia")

# faixa zebrada das ilhas
im = Image.new("RGB", (512, 64), (28, 28, 28)); d = ImageDraw.Draw(im)
for x in range(-64, 512, 64): d.polygon([(x, 64), (x + 32, 64), (x + 64, 0), (x + 32, 0)], fill=(242, 183, 5))
salvar(im, "zebra")

# frente da bomba (sem preço: visor zerado)
im = Image.new("RGB", (256, 512), (244, 242, 236)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 256, 70], fill=(245, 158, 11)); d.text((128, 36), "COMBUSTÍVEL", font=f(26), fill=(26, 18, 6), anchor="mm")
d.rounded_rectangle([24, 100, 232, 250], 10, fill=(11, 15, 20))
d.text((128, 145), "0,00", font=f(44, True), fill=(52, 211, 153), anchor="mm"); d.text((128, 210), "0,000", font=f(40, True), fill=(52, 211, 153), anchor="mm")
for r in range(4):
    for c in range(3): d.rounded_rectangle([60 + c * 48, 290 + r * 38, 96 + c * 48, 318 + r * 38], 4, fill=(156, 163, 175))
d.rectangle([0, 452, 256, 512], fill=(194, 65, 12))
salvar(im, "bomba")

# letreiro da conveniência (fundo; as letras são 3D)
im = Image.new("RGB", (1024, 256)); d = ImageDraw.Draw(im)
for y in range(256): d.line([(0, y), (1024, y)], fill=(252 - y // 12, 211 - y // 4, 77 - y // 12))
salvar(im, "letreiro_fundo")

# totem (sem preço)
im = Image.new("RGB", (256, 1024), (244, 242, 236)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 256, 240], fill=(245, 158, 11)); d.text((128, 130), "POSTO", font=f(64), fill=(26, 18, 6), anchor="mm")
for i, n in enumerate(["GASOLINA", "ETANOL", "DIESEL S10"]):
    d.rounded_rectangle([16, 300 + i * 220, 240, 480 + i * 220], 12, fill=(31, 35, 40)); d.text((128, 390 + i * 220), n, font=f(34), fill=(251, 191, 36), anchor="mm")
salvar(im, "totem")

# prateleira com produtos
im = Image.new("RGB", (512, 256), (233, 229, 220)); d = ImageDraw.Draw(im)
cores = [(220, 38, 38), (245, 158, 11), (22, 163, 74), (37, 99, 235), (248, 250, 252), (124, 58, 237), (234, 88, 12), (8, 145, 178)]
for p in range(4):
    y = p * 64; d.rectangle([0, y + 58, 512, y + 63], fill=(156, 163, 175)); x = 4
    while x < 508:
        w, h = random.randint(12, 30), random.randint(24, 52); d.rectangle([x, y + 58 - h, x + w, y + 58], fill=random.choice(cores)); x += w + 2
salvar(im, "produtos")

# portas da geladeira
im = Image.new("RGB", (512, 256), (241, 245, 249)); d = ImageDraw.Draw(im)
cor2 = [(220, 38, 38), (22, 163, 74), (245, 158, 11), (29, 78, 216), (226, 232, 240)]
for porta in range(4):
    x0 = porta * 128
    for p in range(4):
        for i in range(8): d.rounded_rectangle([x0 + 10 + i * 14, 18 + p * 58, x0 + 20 + i * 14, 58 + p * 58], 3, fill=cor2[(porta + p + i) % 5])
    d.rectangle([x0, 0, x0 + 6, 256], fill=(148, 163, 184))
salvar(im, "geladeira")

# tapete de acampamento
im = Image.new("RGB", (512, 512), (31, 78, 95)); d = ImageDraw.Draw(im)
for i in range(7): d.rectangle([30 + i * 36, 30 + i * 36, 482 - i * 36, 482 - i * 36], outline=(230, 199, 156), width=10)
salvar(im, "tapete")

# gelo
im = Image.new("RGB", (512, 256), (248, 250, 252)); d = ImageDraw.Draw(im)
d.text((256, 128), "GELO", font=f(140), fill=(29, 78, 216), anchor="mm")
salvar(im, "gelo")

print("texturas em", PASTA)
