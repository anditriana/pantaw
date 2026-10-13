import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';

const watch = process.argv.includes('--watch');

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
copyFileSync('manifest.json', 'dist/manifest.json');

const options = {
  entryPoints: { content: 'src/content.ts', 'main-world': 'src/main-world.ts' },
  outdir: 'dist',
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  logLevel: 'info',
};

if (watch) {
  await (await esbuild.context(options)).watch();
} else {
  await esbuild.build(options);
}
