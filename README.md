habrok [![Build Status](https://travis-ci.org/kurttheviking/habrok-js.svg?branch=master)](https://travis-ci.org/kurttheviking/habrok-js) [![Coverage Status](https://coveralls.io/repos/github/kurttheviking/habrok-js/badge.svg?branch=master)](https://coveralls.io/github/kurttheviking/habrok-js?branch=master)
======

[Promises/A+](https://promisesaplus.com/), [request](https://www.npmjs.com/package/request)-powered, [boom](https://www.npmjs.com/package/boom)-enabled, JSON-first HTTP API client with automatic retry


## Quick start

### Prerequisites

- [Node.js LTS (4+)](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Installing

Install with `npm`:

```sh
npm install habrok --save
```

### Example

```js
const Habrok = require('habrok');

const habrok = new Habrok();

habrok.request({
  method: 'GET',
  uri: 'https://api.github.com/repositories'
})
.then(console.log);
```

```json
{
  "statusCode": 200,
  "headers": {
    "content-length": "4477",
    "content-type": "application/json; charset=utf-8",
    "etag": "6ffc6a0dbbe2613e4d8b3f7444e5c604",
    ...
  },
  "body": [
    {
      "id": 1296269,
      "private": false,
      "owner": {
        "id": 1,
        "login": "octocat",
        "avatar_url": "https://github.com/images/error/octocat_happy.gif",
        ...
      },
      "name": "hello-World",
      "full_name": "octocat/hello-world",
      "description": "Octocat's first repo!",
      "url": "https://api.github.com/repos/octocat/hello-world",
      ...
    },
    ...
  ]
}
```


## API

### `Habrok` (Constructor)

#### Definition

```js
Habrok([configuration])
```

#### Required arguments

*None*

#### Optional arguments

- `configuration`: `Object` with one or more of the below properties:

| Property | Type | Description | Default |
| :------- | :--- | :---------- | :------ |
| `disableAutomaticJson` | `Boolean` | Disable JSON headers and request/response bodies | `false` |
| `disableCustomHeaders` | `Boolean` | Disable request headers added by Habrok | `false` |
| `disableRetryEconnreset` | `Boolean` | Disable retry for connection reset errors | `false` |
| `retries` | `Number` | Number of times to retry a failed request | `5` |
| `retryMinDelay` | `Number` | Minimum milliseconds to wait before retrying a request | `100` |
| `retryMaxDelay` | `Number` | Maximum milliseconds to wait before retrying a request | *None* |
| `retryCodes` | `Array<Number>` | 	HTTP status codes that trigger a retry | `[429, 502, 503, 504]` |

By default, each request includes the following headers (which can be prevented with `disableCustomHeaders`):

- `User-Agent`: `habrok/[MAJOR.MINOR.PATCH]`, versioned according to [`package.json`](./package.json) (e.g. `habrok/1.0.0`)
- `X-Node-Platform`: Directly from [`process.platform`](https://nodejs.org/api/process.html#process_process_platform) (e.g. `linux`)
- `X-Node-Version`: Derived from [`process.version`](https://nodejs.org/api/process.html#process_process_version) (e.g. `6.11.1`)

The retry logic follows exponential backoff, summarized as:

```
MINIMUM(retryMaxDelay, retryMinDelay * (attempt ** 2))
```

With the default `configuration`, a failing request observes a delay sequence of `100`, `400`, `900`, and `1600` milliseconds before rejecting with an error.

#### Returns

A Habrok HTTP API Client instance.

#### Examples

Construct a default client:

```js
const Habrok = require('habrok');

const habrok = new Habrok();
```

Construct a client with a minimum retry delay of 250 milliseconds:

```js
const Habrok = require('habrok');

const habrok = new Habrok({ retryMinDelay: 250 });
```

Construct a client that does not send Habrok-generated headers:

```js
const Habrok = require('habrok');

const habrok = new Habrok({ disableCustomHeaders: true });
```

### `Habrok#request`

#### Definition

```js
habrok.request(req[, options])
```

#### Required arguments

- `req`: `Object`, a [request-compatible](https://www.npmjs.com/package/request#requestoptions-callback) object

#### Optional arguments

- `options`: `Object` with one or more of the below properties:

| Property | Type | Description | Default |
| :------- | :--- | :---------- | :------ |
| `attempt` | `Number` | Integer indicating current request sequence number | *None* |
| `onRetriableFailure` | `Function` | A function executed whenever Habrok retries a request. As an argument, it will pass in an object with same properties returned by a `habrok.request`. | *None* |
| `debugRequest` | `Function` | A function called after making a successful request or after the maximum number of attempts is met.  As an argument, it will pass in an object with the property `attempt`, the number of attempts made.| *None* |

Generally, `attempt` is not needed. The internal retry engine will pass the current attempt count into the next request. Override only as necessary &ndash; e.g. in cases where the retry logic should be bypassed.

#### Returns

A `Promise` that resolves to an `Object` with the following properties:

- `statusCode`: `Number`, the HTTP status code provided in the response
- `headers`: `Object`, HTTP headers (lower-cased) and their values provided in the response
- `body`: `Any`, the JSON-parsed response body (or the raw body if `disableAutomaticJson` was set)

The `Promise` is rejected with a [Boom](https://www.npmjs.com/package/boom)-wrapped error if an HTTP error occurs. The `Promise` is rejected with a generic `Error` if an error is returned by the underlying request library (usually from [http.ClientRequest](https://nodejs.org/api/http.html#http_class_http_clientrequest)).

#### Examples

Send a `GET` request:

```js
habrok.request({
  method: 'GET',
  uri: 'https://api.viki.ng/longships'
})
```

Send a `POST` request:

```js
habrok.request({
  method: 'POST',
  uri: 'https://api.viki.ng/longships',
  json: {
    name: 'Oseberg'
  }
})
```


## Development

### Debug

The [debug](https://www.npmjs.com/package/debug) module is used for runtime logging. Omit the `DEBUG` environment variable to squelch all logging. Set `DEBUG` to the desired level (e.g. `DEBUG=habrok`) to restrict logging to a desired service. Or, use `DEBUG=*` to get all debug output from everywhere, including dependencies.

```sh
DEBUG=@agilemd/habrok* node index
```

### Tests

To run the unit tests:

```sh
npm test
```

This project maintains ~100% coverage of statements, branches, and functions. To determine unit test coverage:

```sh
npm run coverage
```

### Contribute

PRs are welcome! PRs must pass unit tests and linting prior to merge. PRs must not reduce unit coverage. For bugs, please include a failing test which passes when your PR is applied. To enable a git hook that runs `npm test` prior to pushing, `cd` into your repo and run:

```sh
touch .git/hooks/pre-push
chmod +x .git/hooks/pre-push
echo "npm test" > .git/hooks/pre-push
```

### Versioning

This project follows [semantic versioning](http://semver.org/). See the [changelog](CHANGELOG.md) for release information.


## License

- This module is licensed under the [ISC License](./LICENSE)
- The underlying `boom` module is licensed under the [BSD 3-Clause License](https://github.com/hapijs/boom/blob/8b35a4c5f6dc706f3396cfed3f5cc5f60a5f6eb1/LICENSE)
- The underlying `debug` module is licensed under the [MIT License](https://github.com/visionmedia/debug/blob/a45d4a0239f071634804dd7901dd33b0d0d407c9/LICENSE)
- The underlying `has` module is licensed under the [MIT License](https://github.com/tarruda/has/blob/535c5c8ed1dc255c9e223829e702548dd514d2a5/LICENSE-MIT)
- The underlying `request` module is licensed under the [Apache 2.0](https://github.com/request/request/blob/643c43ab7be269a1efaa080ff05a18fff3f64cd7/LICENSE)


## Etymology

From [Grímnismál](https://en.wikipedia.org/wiki/Gr%C3%ADmnism%C3%A1l), [Stanza 44](http://www.voluspa.org/grimnismal41-45.htm):

> The best of trees must Yggdrasil be,
> Skithblathnir best of boats;
> Of all the gods is Odin the greatest,
> And Sleipnir the best of steeds;
> Bifrost of bridges, Bragi of skalds,
> Habrok of hawks, and Garm of hounds.

Habrok, data-in-flight at its best.
