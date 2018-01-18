import buble from 'rollup-plugin-buble';

const banner = `
// electron-bookmarks, Copyright (c) by acheronfail
// Distributed under an MIT license: https://github.com/acheronfail/electron-bookmarks/blob/master/LICENSE
//
// This is a library for enabling macOS sandbox Security-Scoped  bookmarks
// inside an electron application.

// Give node support for stack traces.
require('source-map-support').install();
`;

export default {
  banner: banner,
  entry: "src/index.js",
  format: "cjs",
  dest: "lib/electron-bookmarks.js",
  sourceMap: true,
  sourceMapFile: 'lib/electronBookmarks.js.map',
  moduleName: "electronBookmarks",
  plugins: [ buble({ namedFunctionExpressions: false }) ],
  external: [ 'nodobjc', 'electron', 'path', 'crypto', 'fs' ]
};
