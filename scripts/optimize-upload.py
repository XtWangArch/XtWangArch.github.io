"""Generate previews for one CMS upload, preserving its original file."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
source = (root / sys.argv[1]).resolve()
source.relative_to(root / 'assets/images/uploads')
manifest_file = root / 'assets/js/image-manifest.js'
raw = manifest_file.read_text(encoding='utf-8')
manifest = json.loads(raw.split('=', 1)[1].strip().removesuffix(';'))
with Image.open(source) as raw_image:
    image = ImageOps.exif_transpose(raw_image).convert('RGBA' if 'A' in raw_image.getbands() else 'RGB')
    width, height = image.size
    variants = []
    for target_width in sorted({min(width, size) for size in (480, 960, 1600)}):
        target = root / 'assets/images/optimized/uploads' / f'{source.name}-{target_width}.webp'
        target.parent.mkdir(parents=True, exist_ok=True)
        image.resize((target_width, max(1, round(height * target_width / width))), Image.Resampling.LANCZOS).save(target, 'WEBP', quality=90, method=4)
        variants.append({'src': target.relative_to(root).as_posix(), 'width': target_width})
manifest[source.relative_to(root).as_posix()] = {'width': width, 'height': height, 'sources': variants}
manifest_file.write_text('window.portfolioImageManifest = ' + json.dumps(manifest, indent=2) + ';\n', encoding='utf-8')
