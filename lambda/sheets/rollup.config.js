// https://www.learnwithjason.dev/blog/learn-rollup-js/
import babel from "@rollup/plugin-babel";
import replace from '@rollup/plugin-replace';

// https://github.com/rollup/plugins/tree/master/packages/replace
export default {
  input: "src/index.js",
  output: {
    file: "functions/index.js",
    format: "cjs",
    // sourcemap: "inline"
  },
  plugins: [
    replace({
      development: "."+(process.env.CONF_TARGET || 'development')+'.',
      delimiters: ['.', '.']
    }),
    babel({
      // babelrc: false,
      comments: false,
      exclude: "node_modules/**",
      // presets: [
      //   ["@babel/preset-env", { modules: false }],
      //   "babel-preset-minify"
      // ]
    })
  ]
};
