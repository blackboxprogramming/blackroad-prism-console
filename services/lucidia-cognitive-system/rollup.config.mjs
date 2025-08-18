import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const prod = process.env.NODE_ENV === 'production';

export default {
  input: 'src/comprehensive-lucidia-system.js',
  output: {
    file: 'dist/comprehensive-lucidia-system.js',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [nodeResolve({ preferBuiltins: true }), commonjs(), prod && terser()],
};
