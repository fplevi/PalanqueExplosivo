import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf' };
http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(root + path.sep) || relative.split(/[\\/]/).some(part => part.startsWith('.')) || !mime[path.extname(filename)]) {
      response.writeHead(404); response.end('Não encontrado'); return;
    }
    const data = await readFile(filename);
    response.writeHead(200, { 'Content-Type': mime[path.extname(filename)], 'Cache-Control': 'no-store' });
    response.end(data);
  } catch {
    response.writeHead(404); response.end('Não encontrado');
  }
}).listen(port, '127.0.0.1', () => console.log(`Bomber Políticos: http://localhost:${port}`));
