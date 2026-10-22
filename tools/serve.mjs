import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const root = process.argv[2] === 'dist' ? resolve(projectRoot, 'dist') : projectRoot;
const port = Number(process.env.PORT || 5500);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer from 1 to 65535.');
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.vcf': 'text/vcard; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end('Method not allowed');
    return;
  }

  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/') pathname = '/index.html';
    const filename = resolve(root, `.${pathname}`);
    const localPath = relative(root, filename);
    const insideRoot = !isAbsolute(localPath) && localPath !== '..' && !localPath.startsWith(`..${sep}`);
    const isSiteFile = pathname === '/index.html' || pathname.startsWith('/assets/');
    if (!insideRoot || !isSiteFile) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const content = await readFile(filename);
    res.writeHead(200, {
      'Content-Type': mime[extname(filename).toLowerCase()] || 'application/octet-stream',
      'Content-Length': content.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) {
    res.writeHead(error instanceof URIError ? 400 : 404);
    res.end(error instanceof URIError ? 'Bad request' : 'Not found');
  }
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is busy. Stop the other server or choose a different PORT.`
    : error.message);
  process.exitCode = 1;
});

// Local development only. Production hosts serve the files in dist directly.
server.listen(port, '127.0.0.1', () => {
  console.log(`Portfolio: http://127.0.0.1:${port}`);
  console.log('Save a file, then refresh the browser. Stop: Ctrl+C.');
});
