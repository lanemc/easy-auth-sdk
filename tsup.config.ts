import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'adapters/next/index': 'src/adapters/next/index.ts',
    'ui/react/index': 'src/ui/react/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  external: [
    'react',
    'react-dom',
    'next',
    'postgres',
    '@radix-ui/react-alert-dialog',
    '@radix-ui/react-button',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-form',
    '@radix-ui/react-icons',
    '@radix-ui/react-input',
    '@radix-ui/react-label',
    '@radix-ui/react-separator',
    '@radix-ui/react-slot',
    'class-variance-authority',
    'clsx',
    'tailwind-merge'
  ]
})