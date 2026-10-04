import base64
import io
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).parent
frames = [Image.open(io.BytesIO(base64.b64decode(frame))).convert('RGB')
          for frame in json.loads((root / 'frames-clean.json').read_text())]
for name, group in [('lula-vence', frames[:42]), ('flavio-vence', frames[42:])]:
    group[0].save(root / f'{name}.gif', save_all=True, append_images=group[1:],
                  duration=[100] * 41 + [1800], loop=0, optimize=False, disposal=2)
    group[37].save(root / f'{name}-explosao.png')
    group[-1].save(root / f'{name}-final.png')
    print(root / f'{name}.gif')
