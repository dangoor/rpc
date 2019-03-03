import includePaths from 'rollup-plugin-includepaths';
import resolve from "rollup-plugin-node-resolve";
import commonjs from 'rollup-plugin-commonjs';


export default {
  // I gave up on the rollup plugin for typescript. Rollup must run after tsc compilation. (see commented typescript plugin code below)
  input: 'out/rpc-full/src/wranggle-rpc.js',
  output: [
    {
      file: 'dist/wranggle-rpc.js',
      format: 'cjs', // or 'umd', // or cjs
      name: 'WranggleRpc',
      exports: 'named',
    }
  ],
  // todo: if any large-ish dependencies are added, will need to use external option, and/or the "jail" or "only" options on resolve plugin
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
    resolve({
      jsnext: true,
    }),
    commonjs()

    // note: didn't get rollup-plugin-typescript2 working so using rollup on output of tsc. todo: try again harder:
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
