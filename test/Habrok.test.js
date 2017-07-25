/* global describe, it */
/* eslint-disable global-require, strict */

const expect = require('chai').expect;

describe('Habrok', () => {
  it('is a constructor', () => {
    const Habrok = require('../index');

    expect(Habrok).to.be.a('function');
  });

  describe('default configuration', () => {
    const Habrok = require('../index');
    const habrok = new Habrok();

    it('sets the DISABLE_CUSTOM_HEADERS constant', () => {
      expect(habrok.DISABLE_CUSTOM_HEADERS).to.equal(false);
    });

    it('sets the DISABLE_JSON_BODY constant', () => {
      expect(habrok.DISABLE_JSON_BODY).to.equal(false);
    });

    it('sets the RETRIES constant', () => {
      expect(habrok.RETRIES).to.equal(5);
    });

    it('sets the RETRY_CODES constant', () => {
      expect(habrok.RETRY_CODES).to.deep.equal([429, 502, 503, 504]);
    });

    it('sets the RETRY_MS_MAX constant', () => {
      expect(habrok.RETRY_MS_MAX).to.equal(null);
    });

    it('sets the RETRY_MS_MIN constant', () => {
      expect(habrok.RETRY_MS_MIN).to.equal(100);
    });

    it('has a request method', () => {
      expect(habrok.request).to.be.a('function');
    });
  });

  describe('explicit configuration', () => {
    const Habrok = require('../index');

    const config = {
      disableCustomHeaders: true,
      disableJsonBody: true,
      retries: 3,
      retryCodes: [404, '503'],
      retryMaxDelay: 1 + parseInt(Math.random() * 1000, 10),
      retryMinDelay: 1 + parseInt(Math.random() * 1000, 10)
    };

    const habrok = new Habrok(config);

    it('sets the DISABLE_CUSTOM_HEADERS constant', () => {
      expect(habrok.DISABLE_CUSTOM_HEADERS).to.equal(config.disableCustomHeaders);
    });

    it('sets the DISABLE_JSON_BODY constant', () => {
      expect(habrok.DISABLE_JSON_BODY).to.equal(config.disableJsonBody);
    });

    it('sets the RETRIES constant', () => {
      expect(habrok.RETRIES).to.equal(config.retries);
    });

    it('sets the RETRY_CODES constant', () => {
      expect(habrok.RETRY_CODES).to.deep.equal([404, 503]);
    });

    it('sets the RETRY_MS_MAX constant', () => {
      expect(habrok.RETRY_MS_MAX).to.equal(config.retryMaxDelay);
    });

    it('sets the RETRY_MS_MIN constant', () => {
      expect(habrok.RETRY_MS_MIN).to.equal(config.retryMinDelay);
    });

    it('has a request method', () => {
      expect(habrok.request).to.be.a('function');
    });
  });
});
