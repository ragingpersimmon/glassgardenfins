const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function fileForUrl(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = clean.endsWith('/') ? `${clean}index.html` : clean;
  const relative = normalized.replace(/^\//, '');
  const fullPath = path.resolve(ROOT, relative);

  if (!fullPath.startsWith(ROOT)) return null;
  return fullPath;
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const target = fileForUrl(req.url || '/');
      if (!target) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(target, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not found');
          return;
        }

        const ext = path.extname(target).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise((done) => server.close(done))
      });
    });
  });
}

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

module.exports = {
  startServer,
  createSeededRandom
};
