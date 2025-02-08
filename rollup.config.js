import commonjs from '@rollup/plugin-commonjs';
import legacy from '@rollup/plugin-legacy'
// import nodePolyfills from 'rollup-plugin-node-polyfills'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

var onwarn = function(message) {
  // autobahn... not much we can do
  if (/Use of eval in "node_modules\/autobahn-browser\/autobahn.min.js" is strongly discouraged/.test(message)) {
    return
  }
  console.error(message)
}

var tasks = [
  {
    input: 'src/js_src/main.js',
    external: ['jquery'],
    onwarn: onwarn,
    output: {
      file: 'src/js/main.js',
      format: 'iife', // immediately invoked function expression
      globals: {
        jquery: 'window.jQuery'
      },
      // sourcemap: 'inline',
    },
    plugins: plugins = [
      // nodePolyfills(),
      nodeResolve({
        // jsnext: true,
        // main: true,
        mainFields: ['jsnext:main'],
        browser: true,
      }),
      commonjs({
        include: ['node_modules/**'],
      }),
      legacy({
        // add a default export, corresponding to `someLibrary`
        'src/js_src/Queue.js': 'Queue',
        /*
        // add named exports
        'js_src/Queue.js': {
          foo: 'anotherLib.foo',
          bar: 'anotherLib.bar',
          baz: 'anotherLib.baz'
        }
        */
      }),
    ]
  }
]

if (process.env.NODE_ENV !== 'watch') {
  var plugins = [
    // nodePolyfills(),
    nodeResolve({
      // jsnext: true,
      // main: true,
      mainFields: ['jsnext:main'],
      browser: true,
    }),
    commonjs({
      include: ['node_modules/**'],
    }),
    legacy({
      // add a default export, corresponding to `someLibrary`
      'src/js_src/Queue.js': 'Queue',
      /*
      // add named exports
      'js_src/Queue.js': {
        foo: 'anotherLib.foo',
        bar: 'anotherLib.bar',
        baz: 'anotherLib.baz'
      }
      */
    }),
    /*
    uglify({
      compress: {
        drop_console: true
      }
    })
    */
    terser()
  ]
  tasks.push({
    input: 'src/js_src/main.js',
    external: ['jquery'],
    onwarn: onwarn,
    output: {
      file: 'src/js/main.min.js',
      format: 'iife', // immediately invoked function expression
      globals: {
        jquery: 'window.jQuery'
      },
    },
    plugins: plugins,
  })
}

export default tasks
