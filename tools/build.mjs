import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = resolve(root, 'dist');

// Only generated output is replaced; source files stay in the project root.
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(resolve(root, 'index.html'), resolve(out, 'index.html'));
await cp(resolve(root, 'assets'), resolve(out, 'assets'), { recursive: true });
console.log('Ready: dist/index.html + dist/assets/');
