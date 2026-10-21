// Inlines the scripts and styles of the Vite build into one HTML file that
// runs from file:// without a server and without an internet connection.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const build = join(root, 'build');
const outDir = join(root, 'dist');
let html = readFileSync(join(build, 'index.html'), 'utf8');

const assets = join(build, 'assets');
const read = (ref) => readFileSync(join(build, ref.replace(/^\.\//, '')), 'utf8');

html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_m, href) => {
  return `<style>\n${read(href)}\n</style>`;
});
// A classic script at the end of the body: modules do not run from file:// in
// every browser when loaded by URL, and an inline module cannot contain the
// closing script tag, so it is escaped.
let script = '';
html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_m, src) => {
  script += read(src).replace(/<\/script/gi, '<\\/script');
  return '';
});
// a function as replacement: the script contains "$'" and similar sequences
html = html.replace('</body>', () => `<script type="module">\n${script}\n</script>\n</body>`);
if (/<script[^>]+src=|<link[^>]+href="\.?\/?assets/.test(html)) {
  throw new Error('external reference left in the built file');
}
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'pipwerk-replay-prototyp.html'), html);
console.log('written dist/pipwerk-replay-prototyp.html', html.length, 'bytes', readdirSync(assets).length, 'assets inlined');
