/* global describe, it, beforeEach, afterEach */
/* eslint-disable global-require, strict */

'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');
const uuid = require('uuid-with-v6');

describe('Habrok#request', () => {
  const body = { x: uuid.v4() };

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(null, { statusCode: 200 }, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')();
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('invokes requestjs with a valid method and uri', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.method).to.equal(method);
      expect(req.uri).to.equal(uri);
    });
  });

  it('invokes requestjs with default headers', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.headers['User-Agent']).to.match(/^habrok/);
      expect(req.headers).to.have.property('X-Node-Platform');
      expect(req.headers).to.have.property('X-Node-Version');
    });
  });

  it('invokes requestjs with default json parameter', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.json).to.equal(true);
    });
  });

  it('resolves to the parsed response', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then((out) => {
      expect(out).to.deep.equal(body);
    });
  });
});

describe('Habrok#request with disabled custom headers', () => {
  const body = { x: uuid.v4() };

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(null, { statusCode: 200 }, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')({ disableCustomHeaders: true });
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('invokes requestjs without default headers', () => {
    const headers = { z: uuid.v4() };
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ headers, method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.headers).to.not.have.property('User-Agent');
      expect(req.headers).to.not.have.property('X-Node-Platform');
      expect(req.headers).to.not.have.property('X-Node-Version');
    });
  });

  it('invokes requestjs with invocation headers', () => {
    const headers = { z: uuid.v4() };
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ headers, method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.headers).to.deep.equal(headers);
    });
  });
});

describe('Habrok#request with disabled json parsing', () => {
  const body = `<x>${uuid.v4()}</x>`;

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(null, { statusCode: 200 }, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')({ disableJsonBody: true });
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('invokes requestjs without json parameter', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then(() => {
      const req = request.getCall(0).args[0];

      expect(req.json).to.equal(undefined);
    });
  });

  it('resolves to the parsed response', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri }).then((out) => {
      expect(out).to.equal(body);
    });
  });
});

describe('Habrok#request with a retried HTTP error (429)', () => {
  const body = { x: uuid.v4() };

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(null, { statusCode: 429 }, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')({ retryMinDelay: 0 });
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('retries request up to retry limit', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      expect(request.callCount).to.equal(habrok.RETRIES);
    });
  });

  it('rejects with a Boom#tooManyRequests error', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch((err) => {
      expect(err).to.match(/Too Many Requests/);
      expect(err.isBoom).to.equal(true);
      expect(err.output.statusCode).to.equal(429);
    });
  });

  it('rejected Boom#tooManyRequests contains response body', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch((err) => {
      expect(err.data).to.deep.equal(body);
    });
  });

  it('rejects within expected elapsed time', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    const start = Date.now();

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      // [KE] rough heuristic; empirically the observed elapsed time is between 9-10ms;
      //      this test is sufficient to demonstrate elapsed time is substantially below default
      const observed = Date.now() - start;

      expect(observed).to.be.below(20);
    });
  });
});

describe('Habrok#request with a retried HTTP error (429) and max wait', () => {
  const body = { x: uuid.v4() };

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(null, { statusCode: 429 }, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')({ retryMaxDelay: 0 });
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('retries request up to retry limit', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      expect(request.callCount).to.equal(habrok.RETRIES);
    });
  });

  it('rejects within expected elapsed time', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    const start = Date.now();

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      // [KE] rough heuristic; empirically the observed elapsed time is between 9-10ms;
      //      this test is sufficient to demonstrate elapsed time is substantially below default
      const observed = Date.now() - start;

      expect(observed).to.be.below(20);
    });
  });
});

describe('Habrok#request with a non-retried HTTP error (500)', () => {
  const body = { x: uuid.v4() };

  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(null, { statusCode: 500 }, body);
    mockery.registerMock('request', request);

    habrok = require('../../index')({ retryMinDelay: 1 });
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('does not retry request', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      expect(request.callCount).to.equal(1);
    });
  });

  it('rejects with a Boom#badImplementation error', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch((err) => {
      expect(err).to.match(/Internal Server Error/);
      expect(err.isBoom).to.equal(true);
      expect(err.output.statusCode).to.equal(500);
    });
  });

  it('rejected Boom#badImplementation contains response body', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch((err) => {
      expect(err.data).to.deep.equal(body);
    });
  });
});

describe('Habrok#request with request.js error', () => {
  let habrok;
  let request;

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    request = sinon.stub().yields(new Error('invalid input'), {}, {});
    mockery.registerMock('request', request);

    habrok = require('../../index')();
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.disable();
  });

  it('does not retry request', () => {
    const method = undefined;
    const uri = undefined;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch(() => {
      expect(request.callCount).to.equal(1);
    });
  });

  it('rejects with a generic error', () => {
    const method = 'GET';
    const uri = `https://api.viki.ng/longships/${uuid.v4()}`;

    return habrok.request({ method, uri })
    .then(() => { throw new Error('fail test'); })
    .catch((err) => {
      expect(err).to.match(/invalid input/);
      expect(err.isBoom).to.equal(undefined);
    });
  });
});
