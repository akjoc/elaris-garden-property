"""Generate procedural alpha assets, Ken Burns films and PDFs for Elaris Gardens.
All outputs are original to this prototype. Run: python3 scripts/make_assets.py
"""
import math, os, random, subprocess, sys
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFilter

FF = imageio_ffmpeg.get_ffmpeg_exe()
random.seed(7)
os.makedirs("public/images/aerial", exist_ok=True)
os.makedirs("public/images/cutouts", exist_ok=True)
os.makedirs("public/images/footer", exist_ok=True)
os.makedirs("public/media", exist_ok=True)
os.makedirs("public/documents", exist_ok=True)

# ---------- alpha clouds ----------
for n in (1, 2, 3):
    im = Image.new("RGBA", (900, 420), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for _ in range(70):
        x, y = random.randint(80, 820), random.randint(130, 290)
        r = random.randint(40, 140)
        d.ellipse([x - r, y - r // 2, x + r, y + r // 2], fill=(255, 255, 255, random.randint(26, 80)))
    im.filter(ImageFilter.GaussianBlur(26)).save(f"public/images/aerial/cloud-0{n}.png")

# ---------- plant cutout ----------
im = Image.new("RGBA", (520, 740), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
d.rectangle([254, 200, 266, 720], fill=(92, 82, 62, 255))
for i in range(30):
    side = 1 if i % 2 else -1
    y = 700 - i * 17
    x = 260 + side * random.randint(40, 150)
    d.ellipse([x - 85, y - 30, x + 85, y + 30], fill=(70 + random.randint(0, 25), 98, 58, 238))
    d.line([260, y + 10, x, y], fill=(80, 95, 60, 255), width=5)
im.filter(ImageFilter.GaussianBlur(1)).save("public/images/cutouts/plant.png")

# ---------- footer trees ----------
def tree(path, seed, w=560, h=760):
    r = random.Random(seed)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([w // 2 - 12, h - 300, w // 2 + 12, h], fill=(96, 78, 58, 255))
    for _ in range(260):
        x = int(r.gauss(w // 2, w * 0.24)); y = int(r.gauss(h * 0.36, h * 0.2))
        rad = r.randint(22, 70)
        g = r.randint(78, 125)
        d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=(g - 25, g, 52, 225))
    im.filter(ImageFilter.GaussianBlur(1.2)).save(path)
tree("public/images/footer/tree-left.png", 11)
tree("public/images/footer/tree-right.png", 23)

# footer building: wide crop kept as JPG (masked in CSS)
src = Image.open("public/images/hero/anchor.jpg").convert("RGB")
w, h = src.size
src.crop((0, int(h * 0.28), w, h)).resize((2200, 620)).save("public/images/footer/building.jpg", quality=88)

# ---------- videos (slow architectural Ken Burns moves from original stills) ----------
def kb(img, out, dur, size="1280x720", zoom_from=1.0, zoom_to=1.12, fps=25):
    frames = int(dur * fps)
    vf = (f"scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440,zoompan=z='{zoom_from}+({zoom_to-zoom_from})*on/{frames}'"
          f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s={size}:fps={fps},format=yuv420p")
    subprocess.run([FF, "-y", "-loop", "1", "-i", img, "-vf", vf, "-t", str(dur),
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-an",
                    "-movflags", "+faststart", out], check=True, capture_output=True)
    print("video", out)

kb("public/images/hero/anchor.jpg", "public/media/arrival-desktop.mp4", 14)
kb("public/images/hero/poster-mobile.jpg", "public/media/arrival-mobile.mp4", 12, size="720x1280")
kb("public/images/editorial/location.jpg", "public/media/location-loop.mp4", 8, zoom_to=1.08)
kb("public/images/story/interior-02.jpg", "public/media/interior-loop.mp4", 8, size="896x1120", zoom_to=1.08)
kb("public/images/editorial/work.jpg", "public/media/work-loop.mp4", 8, zoom_to=1.1)
kb("public/images/living/02.jpg", "public/media/living-loop.mp4", 8, size="896x1120", zoom_to=1.08)
kb("public/images/editorial/amenities.jpg", "public/media/amenities-loop.mp4", 8, zoom_to=1.08)
kb("public/images/story/exterior-01.jpg", "public/media/not-found-loop.mp4", 8, size="1280x720", zoom_to=1.06)
kb("public/images/work/panorama.jpg", "public/media/presentation-film.mp4", 16, zoom_to=1.14)

# ---------- PDFs ----------
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.colors import HexColor

def guide(path, title, lines):
    c = pdfcanvas.Canvas(path, pagesize=A4)
    c.setTitle(f"Elaris Gardens — {title}")
    c.setAuthor("Elaris Development Studio")
    W, H = A4
    c.setFillColor(HexColor("#2E3A26")); c.rect(0, H - 70 * mm, W, 70 * mm, fill=1, stroke=0)
    try:
        c.drawImage("public/images/hero/anchor.jpg", 0, H - 70 * mm, W, 70 * mm, preserveAspectRatio=True, anchor="c", mask="auto")
    except Exception:
        pass
    c.setFillColor(HexColor("#2E3A26")); c.setFont("Times-Roman", 26)
    c.drawString(20 * mm, H - 90 * mm, title)
    c.setFont("Helvetica", 9); c.setFillColor(HexColor("#A68150"))
    c.drawString(20 * mm, H - 97 * mm, "ELARIS GARDENS  ·  24 GROVE AVENUE, EASTBANK DISTRICT  ·  HELLO@ELARIS.EXAMPLE")
    y = H - 112 * mm
    c.setFillColor(HexColor("#3C3C3C")); c.setFont("Helvetica", 10.5)
    for ln in lines:
        for part in [ln[i:i + 95] for i in range(0, max(len(ln), 1), 95)] or [""]:
            c.drawString(20 * mm, y, part); y -= 6 * mm
        y -= 3 * mm
    c.setFont("Helvetica-Oblique", 8); c.setFillColor(HexColor("#60735C"))
    c.drawString(20 * mm, 22 * mm, "Illustrative presentation document. Layouts, finishes, availability and payment stages are")
    c.drawString(20 * mm, 17 * mm, "illustrative and subject to an approved project specification. © Elaris Development Studio.")
    c.save()
    print("pdf", path)

guide("public/documents/project-guide.pdf", "Project Guide", [
    "Elaris Gardens is an illustrative mixed-use development of 216 homes, 30 workspaces and",
    "18 street-level retail spaces arranged around planted courtyards in the Eastbank District.",
    "Illustrative payment journey: 15% reservation agreement · 25% groundworks milestone ·",
    "25% structural completion · 25% interior completion · 10% final handover (total 100%).",
    "Homes range from studios to four-bedroom residences across the East and West wings.",
    "Residents' spaces include sky gardens, private fitness, parking and rooftop dining.",
])
guide("public/documents/workspace-brochure.pdf", "Workspaces Brochure", [
    "Flexible workspaces across the East, West and Courtyard wings, with street-level retail",
    "along Grove Avenue. Daylight-first layouts, adaptable floorplates and a planted courtyard",
    "setting give independent ideas and growing teams room to do their best work.",
    "Illustrative floor areas from 42 m² to 480 m². Business enquiries: hello@elaris.example.",
])
print("done")
