import * as esbuild from 'esbuild';
import { copyFileSync, cpSync, mkdirSync, rmSync } from 'node:fs';
import { writeIcons } from './icons.mjs';

const watch = process.argv.includes('--watch');

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
copyFileSync('manifest.json', 'dist/manifest.json');
cpSync('_locales', 'dist/_locales', { recursive: true });
mkdirSync('dist/icons');
writeIcons('dist/icons');

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
