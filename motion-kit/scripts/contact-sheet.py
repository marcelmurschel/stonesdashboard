"""Legt QA-Standbilder zu einem Kontaktabzug zusammen (nur für die Entwicklung).

python3 scripts/contact-sheet.py out/qa/Intro-*.png -o out/qa/sheet-intro.png --cols 4
"""
import argparse
import glob
import os

from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('files', nargs='+')
ap.add_argument('-o', '--out', required=True)
ap.add_argument('--cols', type=int, default=4)
ap.add_argument('--width', type=int, default=360, help='Breite je Kachel')
args = ap.parse_args()

files = []
for f in args.files:
    files.extend(sorted(glob.glob(f)))
imgs = [Image.open(f).convert('RGB') for f in files]
w = args.width
tiles = []
for im, f in zip(imgs, files):
    h = int(im.height * w / im.width)
    t = im.resize((w, h), Image.LANCZOS)
    d = ImageDraw.Draw(t)
    label = os.path.basename(f).rsplit('.', 1)[0]
    d.rectangle([0, 0, w, 22], fill=(0, 0, 0))
    d.text((6, 4), label, fill=(255, 255, 255))
    tiles.append(t)
cols = min(args.cols, len(tiles))
rows = (len(tiles) + cols - 1) // cols
th = max(t.height for t in tiles)
sheet = Image.new('RGB', (cols * w + (cols - 1) * 6, rows * th + (rows - 1) * 6), (40, 40, 40))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * (w + 6), (i // cols) * (th + 6)))
sheet.save(args.out)
print(args.out, sheet.size)
