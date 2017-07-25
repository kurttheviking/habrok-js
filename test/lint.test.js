/* eslint-disable global-require, strict */

require('eslint');  // [KE] establish the dependency for dependency checkers

const lint = require('mocha-eslint');

const options = {
  formatter: 'compact'
};

const paths = [
  'index.js',
  'lib'
];

lint(paths, options);
