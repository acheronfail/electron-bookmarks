import buble from 'rollup-plugin-buble';

const banner = `
// electron-bookmarks, Copyright (c) by acheronfail
// Distributed under an MIT license: https://gitlab.com/acheronfail/electron-bookmarks/blob/master/LICENSE
`;

export default {
  banner: banner,
  entry: "src/index.js",
  format: "cjs",
  dest: "lib/electron-bookmarks.js",
  moduleName: "electronBookmarks",
  plugins: [ buble({ namedFunctionExpressions: false }) ],
  external: [ 'nodobjc', 'electron', 'path', 'crypto', 'fs' ]
};
