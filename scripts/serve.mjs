import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';

const root = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? '0.0.0.0';

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const compressibleExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.map',
  '.svg',
  '.webmanifest',
]);

function send(response, status, message) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(message);
}

const server = createServer((request, response) => {
  const method = request.method ?? 'GET';

  if (method !== 'GET' && method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    send(response, 405, 'Method not allowed');
    return;
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  let pathname;

  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    send(response, 400, 'Bad request');
    return;
  }

  if (pathname.endsWith('/')) {
    pathname += 'index.html';
  }

  let filePath = resolve(root, `.${pathname}`);

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    send(response, 403, 'Forbidden');
    return;
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    if (extname(pathname)) {
      send(response, 404, 'Not found');
      return;
    }

    filePath = join(root, 'index.html');
  }

  const extension = extname(filePath).toLowerCase();
  const acceptsGzip = /\bgzip\b/i.test(request.headers['accept-encoding'] ?? '');
  const shouldCompress = compressibleExtensions.has(extension) && acceptsGzip;

  response.setHeader('Content-Type', contentTypes[extension] ?? 'application/octet-stream');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader(
    'Cache-Control',
    extension === '.html' || pathname === '/sw.js'
      ? 'no-cache'
      : 'public, max-age=31536000, immutable',
  );

  if (compressibleExtensions.has(extension)) {
    response.setHeader('Vary', 'Accept-Encoding');
  }

  if (shouldCompress) {
    response.setHeader('Content-Encoding', 'gzip');
  }

  if (method === 'HEAD') {
    response.writeHead(200);
    response.end();
    return;
  }

  const stream = createReadStream(filePath);
  stream.on('error', () => {
    if (!response.headersSent) {
      send(response, 500, 'Internal server error');
    } else {
      response.destroy();
    }
  });

  if (shouldCompress) {
    stream
      .pipe(createGzip())
      .on('error', () => response.destroy())
      .pipe(response);
    return;
  }

  stream.pipe(response);
});

server.listen(port, host, () => {
  console.log(`Prompt Diary is available on http://${host}:${port}`);
});
