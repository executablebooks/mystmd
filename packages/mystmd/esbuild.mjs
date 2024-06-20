#!/usr/bin/env node

import * as esbuild from 'esbuild';
import { glob } from 'glob';
import { fileURLToPath } from 'node:url';
import { join, parse } from 'node:path';
import copyPlugin from 'esbuild-copy-files-plugin';

const pyodideFilePath = fileURLToPath(import.meta.resolve('pyodide'));
const { dir: pyodidePath } = parse(pyodideFilePath);

const names = ['pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: './build/myst.cjs',
  platform: 'node',
  target: 'node14',
  external: ['fsevents'],
  plugins: [
    copyPlugin({
      source: [...(await glob(names.map((p) => join(pyodidePath, p)))), './build/myst.cjs'],
      target: './dist',
      copyWithFolder: false, // will copy "images" folder with all files inside
    }),
  ],
});
