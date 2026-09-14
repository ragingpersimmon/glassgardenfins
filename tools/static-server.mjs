import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function resolvePath(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, 'http://localhost').pathname);

  if (pathname.includes('..')) return null;

  const normalized = pathname === '/' ? '/index.html' : pathname;
  const withIndex = normalized.endsWith('/') ? `${normalized}index.html` : normalized;

  return path.join(root, withIndex.replace(/^\//, ''));
}

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url || '/');

  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[ext] || 'application/octet-stream';
  const body = fs.readFileSync(filePath);

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  res.end(body);
});

server.listen(port, () => {
  console.log(`Static server listening on http://127.0.0.1:${port}`);
});
