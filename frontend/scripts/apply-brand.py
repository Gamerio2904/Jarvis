#!/usr/bin/env python3
"""Rasterize Jarvis brand masters into Android mipmaps, splash, and web icons."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "native" / "brand"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
PUBLIC = ROOT / "public"
BG = (7, 9, 14, 255)

LAUNCHER = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}
FOREGROUND = {
    "mdpi": 108,
    "hdpi": 162,
    "xhdpi": 216,
    "xxhdpi": 324,
    "xxxhdpi": 432,
}
SPLASH = {
    "drawable": (480, 320),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
}


def draw_ultron(size: int) -> Image.Image:
    """Rotes Auge auf einer dunklen Scheibe. Kein Buchstabe."""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((1, 1, size - 2, size - 2), fill=(7, 9, 14, 255))
    ring = int(size * 0.08)
    d.ellipse((ring, ring, size - 1 - ring, size - 1 - ring), fill=(22, 28, 40, 255))
    iris = int(size * 0.22)
    c = size / 2
    d.ellipse((c - iris, c - iris, c + iris, c + iris), fill=(255, 42, 54, 255))
    pupil = max(2, int(size * 0.07))
    d.ellipse((c - pupil, c - pupil, c + pupil, c + pupil), fill=(255, 255, 255, 255))
    return im


def load(name: str) -> Image.Image:
    path = BRAND / name
    if path.exists():
        return Image.open(path).convert("RGBA")
    print(f"[apply-brand] {path.name} fehlt, Ultron-Auge wird gezeichnet.")
    return draw_ultron(512)


def cover_fit(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    tw, th = size
    scale = max(tw / im.width, th / im.height)
    nw, nh = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - tw) // 2)
    top = max(0, (nh - th) // 2)
    return resized.crop((left, top, left + tw, top + th))


def contain_on_bg(im: Image.Image, size: int, pad: float = 0.18) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), BG)
    inner = max(1, int(size * (1 - pad * 2)))
    mark = im.resize((inner, inner), Image.Resampling.LANCZOS)
    xy = (size - inner) // 2
    canvas.alpha_composite(mark, (xy, xy))
    return canvas


def circle(im: Image.Image) -> Image.Image:
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, im.size[0] - 1, im.size[1] - 1), fill=255)
    out = im.copy()
    out.putalpha(mask)
    return out


def save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, format="PNG", optimize=True)


def write_background_color() -> None:
    values = ANDROID_RES / "values" / "ic_launcher_background.xml"
    values.parent.mkdir(parents=True, exist_ok=True)
    values.write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        "<resources>\n"
        '    <color name="ic_launcher_background">#07090E</color>\n'
        "</resources>\n",
        encoding="utf-8",
    )


def make_splash(icon: Image.Image, size: tuple[int, int]) -> Image.Image:
    canvas = Image.new("RGBA", size, BG)
    mark = max(64, int(min(size) * 0.28))
    emblem = contain_on_bg(icon, mark, pad=0.06)
    x = (size[0] - mark) // 2
    y = (size[1] - mark) // 2
    canvas.alpha_composite(emblem, (x, y))
    return canvas


def apply_android(icon: Image.Image, splash: Image.Image, cover: Image.Image) -> None:
    if not ANDROID_RES.exists():
        print("[apply-brand] android/res fehlt — überspringe native Icons")
        return
    write_background_color()
    for density, size in LAUNCHER.items():
        folder = ANDROID_RES / f"mipmap-{density}"
        launcher = contain_on_bg(icon, size, pad=0.08)
        save_png(launcher, folder / "ic_launcher.png")
        save_png(circle(launcher), folder / "ic_launcher_round.png")
    for density, size in FOREGROUND.items():
        folder = ANDROID_RES / f"mipmap-{density}"
        save_png(contain_on_bg(icon, size, pad=0.22), folder / "ic_launcher_foreground.png")
    for folder, size in SPLASH.items():
        save_png(make_splash(icon, size), ANDROID_RES / folder / "splash.png")


def apply_web(icon: Image.Image) -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    save_png(contain_on_bg(icon, 64, pad=0.08), PUBLIC / "favicon.png")
    save_png(contain_on_bg(icon, 180, pad=0.08), PUBLIC / "apple-touch-icon.png")
    save_png(contain_on_bg(icon, 192, pad=0.08), PUBLIC / "icon-192.png")
    favicon_svg = PUBLIC / "favicon.svg"
    favicon_svg.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n'
        '  <rect width="64" height="64" rx="14" fill="#07090E"/>\n'
        '  <circle cx="32" cy="32" r="22" fill="#161c28"/>\n'
        '  <circle cx="32" cy="32" r="10" fill="#ff2a36"/>\n'
        '  <circle cx="32" cy="32" r="3.5" fill="#ffffff"/>\n'
        "</svg>\n",
        encoding="utf-8",
    )


def draw_splash(size: tuple[int, int]) -> Image.Image:
    canvas = Image.new("RGBA", size, BG)
    mark = max(96, int(min(size) * 0.28))
    emblem = draw_ultron(mark)
    x = (size[0] - mark) // 2
    y = (size[1] - mark) // 2 - int(size[1] * 0.04)
    canvas.alpha_composite(emblem, (x, y))
    draw = ImageDraw.Draw(canvas)
    try:
        from PIL import ImageFont

        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            max(18, int(min(size) * 0.045)),
        )
    except Exception:
        font = None
    text = "ULTRON"
    if font:
        box = draw.textbbox((0, 0), text, font=font)
        tw = box[2] - box[0]
        draw.text(((size[0] - tw) / 2, y + mark + int(size[1] * 0.03)), text, fill=(231, 237, 245, 255), font=font)
    return canvas


def main() -> None:
    icon = draw_ultron(1024)
    splash = draw_splash((1080, 1920))
    cover = draw_splash((1920, 1080))
    BRAND.mkdir(parents=True, exist_ok=True)
    save_png(icon, BRAND / "icon.png")
    save_png(splash, BRAND / "splash.png")
    save_png(cover, BRAND / "cover.png")
    apply_android(icon, splash, cover)
    apply_web(icon)
    print("[apply-brand] Ultron-Auge, Splash, Web-Favicon geschrieben.")


if __name__ == "__main__":
    main()
