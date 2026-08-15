#!/usr/bin/env python3
"""Rasterize Jarvis brand masters into Android mipmaps, splash, and web icons."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "native" / "brand"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
PUBLIC = ROOT / "public"
BG = (10, 12, 11, 255)

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


def load(name: str) -> Image.Image:
    path = BRAND / name
    if not path.exists():
        raise SystemExit(f"[apply-brand] fehlt: {path}")
    return Image.open(path).convert("RGBA")


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
        '    <color name="ic_launcher_background">#0A0C0B</color>\n'
        "</resources>\n",
        encoding="utf-8",
    )


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
        src = cover if size[0] >= size[1] else splash
        save_png(cover_fit(src, size), ANDROID_RES / folder / "splash.png")


def apply_web(icon: Image.Image) -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    save_png(contain_on_bg(icon, 64, pad=0.08), PUBLIC / "favicon.png")
    save_png(contain_on_bg(icon, 180, pad=0.08), PUBLIC / "apple-touch-icon.png")
    save_png(contain_on_bg(icon, 192, pad=0.08), PUBLIC / "icon-192.png")
    favicon_svg = PUBLIC / "favicon.svg"
    favicon_svg.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n'
        '  <rect width="64" height="64" rx="14" fill="#0A0C0B"/>\n'
        '  <text x="32" y="46" text-anchor="middle" font-size="42" '
        'font-family="Georgia, serif" fill="#F4F1EA">J</text>\n'
        "</svg>\n",
        encoding="utf-8",
    )


def main() -> None:
    icon = load("icon.png")
    splash = load("splash.png")
    cover = load("cover.png")
    apply_android(icon, splash, cover)
    apply_web(icon)
    print("[apply-brand] Icon, Splash, Web-Favicon geschrieben.")


if __name__ == "__main__":
    main()
