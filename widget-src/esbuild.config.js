
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['widget-src/code.tsx'],
  bundle: true,
  outfile: 'dist/code.js',
  target: 'es6',
  external: ['figma'],
}).catch(() => process.exit(1));
