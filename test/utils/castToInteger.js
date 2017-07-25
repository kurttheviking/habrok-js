/* global describe, it */
/* eslint-disable global-require, strict */

const expect = require('chai').expect;

describe('utils/castToInteger', () => {
  const integer = require('../../lib/utils/castToInteger');

  it('is a function', () => {
    expect(integer).to.be.a('function');
  });

  it('casts an integer to an integer', () => {
    const input = Date.now();
    const output = integer(input);

    expect(output).to.equal(input);
  });

  it('casts a float to an integer', () => {
    const input = Date.now();
    const output = integer(input + 0.1);

    expect(output).to.equal(input);
  });

  it('casts an String(integer) to an integer', () => {
    const input = Date.now();
    const output = integer(String(input));

    expect(output).to.equal(input);
  });

  it('supports a max option', () => {
    const max = parseInt(Date.now() / 1000, 10);

    const input = Date.now();
    const output = integer(input, { max });

    expect(output).to.equal(max);
  });

  it('supports a min option', () => {
    const min = parseInt(Date.now() / 1000, 10);

    const input = -1 * Date.now();
    const output = integer(input, { min });

    expect(output).to.equal(min);
  });
});
