import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
// A classic inline script can run without a server or module fetches. Build from
// the same source as the hosted edition; never maintain a second copy of the game.
const result = await build({
  configFile: false,
  root,
  mode: 'production',
  build: {
    write: false,
    lib: { entry: fileURLToPath(new URL('../src/main.ts', import.meta.url)), name: 'Skygun', formats: ['iife'] },
    minify: true,
  },
});
const output = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
const scripts = output.filter(item => item.type === 'chunk');
const styles = output.filter(item => item.type === 'asset' && item.fileName.endsWith('.css'));
if (scripts.length !== 1 || scripts[0].imports.length || scripts[0].dynamicImports.length || output.length !== scripts.length + styles.length) {
  throw new Error('Download build must contain exactly one script, CSS, and no separate assets.');
}
const sourceScript = '<script type="module" src="/src/main.ts"></script>';
const template = await readFile(new URL('../index.html', import.meta.url), 'utf8');
if (!template.includes(sourceScript)) throw new Error('Could not locate the game entry in index.html.');
const css = styles.map(item => String(item.source)).join('\n').replace(/<\/style/gi, '<\\/style');
const js = scripts[0].code.replace(/<\/script/gi, '<\\/script');
const html = template
  .replace('</head>', () => `<style>${css}</style>\n</head>`)
  .replace(sourceScript, () => `<script>${js}</script>`);
const directory = new URL('../dist-download/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL('Skygun-play.html', directory), html);
console.log(`Created dist-download/Skygun-play.html (${Buffer.byteLength(html)} bytes). No server or separate assets required.`);
