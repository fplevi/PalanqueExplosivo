import { cp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await mkdir(output, { recursive: true });

// Publish only the files the browser needs, independently of repository layout.
for (const entry of ['index.html', 'style.css', 'sitemap.xml', 'src', 'assets']) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}
await writeFile(path.join(output, '.nojekyll'), '');
console.log('Jogo pronto para publicar: dist/');
