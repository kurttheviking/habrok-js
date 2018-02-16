const cwd = __dirname;

const boom = require('boom');
const debug = require('debug')('@agilemd/habrok');
const has = require('has');
const path = require('path');
const requestjs = require('request');

const pjson = require(path.join(cwd, '../package.json')); // eslint-disable-line import/no-dynamic-require, max-len

const integer = require('./utils/castToInteger');

const ECONNRESET = 'ECONNRESET';
const USER_AGENT = `habrok/${pjson.version}`;
const NODE_VERSION = process.version.substr(1);
const NODE_PLATFORM = process.platform;

function Habrok(config) {
  if (!(this instanceof Habrok)) {
    return new Habrok(config);
  }

  debug('initialize', config);

  const conf = config || {};

  this.DISABLE_AUTO_JSON = Boolean(conf.disableAutomaticJson);
  this.DISABLE_CUSTOM_HEADERS = Boolean(conf.disableCustomHeaders);
  this.DISABLE_RETRY_ECONNRESET = Boolean(conf.disableRetryEconnreset);
  this.RETRIES = has(conf, 'retries') ? integer(conf.retries, { min: 0 }) : 5;
  this.RETRY_CODES = has(conf, 'retryCodes') ? [].concat(conf.retryCodes).map(integer) : [429, 502, 503, 504]; // eslint-disable-line max-len
  this.RETRY_MS_MAX = has(conf, 'retryMaxDelay') ? integer(conf.retryMaxDelay, { min: 0 }) : null;
  this.RETRY_MS_MIN = has(conf, 'retryMinDelay') ? integer(conf.retryMinDelay, { min: 0 }) : 100;

  return this;
}

Habrok.prototype.request = function request(raw, opts) {
  debug('prepare', raw, opts);

  const options = opts || {};

  const attempt = has(options, 'attempt') ? integer(options.attempt, { min: 0 }) : 1;
  const req = Object.assign({}, raw);
  const self = this;

  if (self.DISABLE_CUSTOM_HEADERS === false) {
    req.headers = Object.assign(
      {
        'User-Agent': USER_AGENT,
        'X-Node-Platform': NODE_PLATFORM,
        'X-Node-Version': NODE_VERSION
      },
      req.headers
    );
  }

  if (self.DISABLE_AUTO_JSON === false && has(req, 'json') === false) {
    req.json = true;
  }

  debug('request', req);

  return new Promise((resolve, reject) => requestjs(req, (err, res, body) => {
    // [KE] if/else is purely for debug so ignore code coverage requirements
    /* istanbul ignore next */
    if (res) {
      debug('response', req.method, req.uri || req.url, res.statusCode, body);
    } else {
      debug('no response');
    }

    const errorCode = (err && err.code) || null;
    const statusCode = (res && res.statusCode) || 500;

    if (err && (errorCode !== ECONNRESET || self.disableRetryEconnreset)) {
      return reject(err);
    } else if (errorCode === ECONNRESET || statusCode > 299) {
      if ((!err && self.RETRY_CODES.indexOf(statusCode) === -1) || attempt >= self.RETRIES) {
        debug('fail', req);
        if (has(options, 'debugRequest')) resolve(options.debugRequest({ attempt }));
        return reject(err || boom.create(statusCode, null, body));
      }

      return setTimeout(
        () => {
          debug('retry', raw);
          if (has(options, 'onRetriableFailure')) {
            const returnedError = err || boom.create(statusCode, null, body);
            options.onRetriableFailure(returnedError);
          }
          resolve(self.request(raw, Object.assign({}, options, { attempt: attempt + 1 })));
        },
        integer(
          self.RETRY_MS_MIN * Math.pow(attempt, 2), // eslint-disable-line no-restricted-properties
          { max: self.RETRY_MS_MAX }
        )
      );
    }

    debug('succees', req);

    return resolve({
      statusCode: res.statusCode,
      headers: res.headers,
      body
    });
  }));
};

module.exports = Habrok;
