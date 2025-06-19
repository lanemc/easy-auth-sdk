import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'path',
  'fs',
  'crypto',
  'http',
  'https',
  'stream',
  'util',
  'url',
  'zlib',
  'os',
  'process',
  'next/server',
  'next/headers',
  'react/jsx-runtime'
];

const plugins = [
  resolve({
    preferBuiltins: true,
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }),
  commonjs(),
  json(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationMap: false,
    module: 'ESNext',
    target: 'ES2020'
  })
];

export default [
  // Main entry - CommonJS
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'auto'
    },
    external,
    plugins
  },
  // Main entry - ESM
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'es'
    },
    external,
    plugins
  },
  // Main entry - Types
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    external,
    plugins: [dts()]
  },
  // Next adapter - CommonJS
  {
    input: 'src/adapters/next/index.ts',
    output: {
      file: 'dist/adapters/next/index.js',
      format: 'cjs',
      exports: 'auto'
    },
    external,
    plugins
  },
  // Next adapter - ESM
  {
    input: 'src/adapters/next/index.ts',
    output: {
      file: 'dist/adapters/next/index.mjs',
      format: 'es'
    },
    external,
    plugins
  },
  // Next adapter - Types
  {
    input: 'src/adapters/next/index.ts',
    output: {
      file: 'dist/adapters/next/index.d.ts',
      format: 'es'
    },
    external,
    plugins: [dts()]
  },
  // React UI - CommonJS
  {
    input: 'src/ui/react/index.ts',
    output: {
      file: 'dist/ui/react/index.js',
      format: 'cjs',
      exports: 'auto'
    },
    external,
    plugins
  },
  // React UI - ESM
  {
    input: 'src/ui/react/index.ts',
    output: {
      file: 'dist/ui/react/index.mjs',
      format: 'es'
    },
    external,
    plugins
  },
  // React UI - Types
  {
    input: 'src/ui/react/index.ts',
    output: {
      file: 'dist/ui/react/index.d.ts',
      format: 'es'
    },
    external,
    plugins: [dts()]
  }
];