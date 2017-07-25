const has = require('has');

function integer(value, opts) {
  const options = opts || {};

  const max = has(options, 'max') ? options.max : null;
  const min = has(options, 'min') ? options.min : null;

  return Math.min(
    Math.max(
      parseInt(value, 10),
      min === null ? Number.NEGATIVE_INFINITY : min
    ),
    max === null ? Number.POSITIVE_INFINITY : max
  );
}

module.exports = integer;
