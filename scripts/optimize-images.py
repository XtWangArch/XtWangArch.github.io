"""Build responsive WebP previews without modifying the original images."""

import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
IMAGE_ROOT = ROOT / "assets" / "images"
OUTPUT = IMAGE_ROOT / "optimized"
MANIFEST = ROOT / "assets" / "js" / "image-manifest.js"
WIDTHS = (480, 960, 1600)


def build():
    manifest = {}
    original_bytes = 0
    preview_bytes = 0
    images = sorted(
        source for source in IMAGE_ROOT.rglob("*")
        if OUTPUT not in source.parents
        and source.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
    )
    for source in images:
        with Image.open(source) as raw:
            image = ImageOps.exif_transpose(raw)
            if image.mode not in {"RGB", "RGBA"}:
                image = image.convert("RGBA" if "transparency" in raw.info else "RGB")
            width, height = image.size
            variants = []
            for target_width in sorted({min(width, value) for value in WIDTHS}):
                target = OUTPUT / source.relative_to(IMAGE_ROOT).parent / f"{source.name}-{target_width}.webp"
                target.parent.mkdir(parents=True, exist_ok=True)
                if not target.exists() or target.stat().st_mtime < source.stat().st_mtime:
                    resized = image.resize((target_width, max(1, round(height * target_width / width))), Image.Resampling.LANCZOS)
                    resized.save(target, "WEBP", quality=92 if source.suffix.lower() == ".png" else 88, method=4)
                variants.append({"src": target.relative_to(ROOT).as_posix(), "width": target_width})
            manifest[source.relative_to(ROOT).as_posix()] = {"width": width, "height": height, "sources": variants}
            original_bytes += source.stat().st_size
            preview_bytes += sum((ROOT / item["src"]).stat().st_size for item in variants)
    MANIFEST.write_text("window.portfolioImageManifest = " + json.dumps(manifest, indent=2) + ";\n", encoding="utf-8")
    print(json.dumps({"images": len(manifest), "original_mib": round(original_bytes / 1048576, 2), "all_preview_sizes_mib": round(preview_bytes / 1048576, 2)}))


if __name__ == "__main__":
    build()
