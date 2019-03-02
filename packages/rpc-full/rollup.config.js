import includePaths from 'rollup-plugin-includepaths';
import resolve from "rollup-plugin-node-resolve";
import commonjs from 'rollup-plugin-commonjs';
const path = require('path');


export default {
  // I gave up on the rollup plugin for typescript. Rollup must run after tsc compilation
  input: 'out/rpc-full/src/wranggle-rpc.js',
  output: [
    {
      file: 'dist/wranggle-rpc.js',
      format: 'cjs', // or 'umd', // or cjs
      name: 'WranggleRpc',
    },
    // todo: for es6 build, post each package on npm and exclude them from the bundle
    // {
    //   file: 'dist/wranggle-rpc.es.js',
    //   format: 'es',
    // },
  ],
  // external: [
  //   ...Object.keys(pkg.dependencies || {}),
  //   ...Object.keys(pkg.peerDependencies || {}),
  // ],

  plugins: [
    includePaths({
      include: {},
      paths: [ 'out' ], // path.resolve(projectDir, 'out')
      extensions: ['.js', '.json'],
      external: [],
    }),
    // resolve({
    //   jsnext: true,
    //   // jail: 'out/rpc-full/src',
    //   only: [ /^rpc-.*$/, /^@wranggle\/.*$/ ],
    //   // only: [ /.*/ ],
    //   // only: () => true,
    //   // main: false,
    //   // module: true,
    // }),
    resolve({
      jsnext: true,
    }),
    commonjs()

    // note: didn't get rollup-plugin-typescript2 working so using rollup on output of tsc-
    // typescript({
    //   verbosity: 3,
    //   typescript: require('typescript'),
    //   tsconfigOverride: {
    //     compilerOptions: {
    //       rootDir: packagesDir,
    //     },
    //     include: [ packagesDir ],
    //   },
    // }),
  ],
  
}
