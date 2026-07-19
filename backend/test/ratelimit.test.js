const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimit } = require('../middleware/ratelimit');

describe('RateLimiter', () => {
  it('should allow requests within limit', () => {
    const limiter = createRateLimit({ windowMs: 60000, max: 3 });
    const req = { ip: '127.0.0.1', baseUrl: '/api/v1', path: '/test' };
    const res = { status: () => res, json: () => {} };
    let called = false;
    const next = () => { called = true; };

    limiter(req, res, next);
    limiter(req, res, next);
    limiter(req, res, next);
    assert.ok(called);
  });

  it('should block requests over limit', () => {
    const limiter = createRateLimit({ windowMs: 60000, max: 2 });
    const req = { ip: '127.0.0.1', baseUrl: '/api/v1', path: '/test2' };
    let blocked = false;
    const res = {
      status: (code) => {
        if (code === 429) blocked = true;
        return res;
      },
      json: () => {}
    };

    limiter(req, res, () => {});
    limiter(req, res, () => {});
    limiter(req, res, () => {});
    assert.ok(blocked);
  });

  it('should use different buckets for different routes', () => {
    const limiter = createRateLimit({ windowMs: 60000, max: 1 });
    const req1 = { ip: '127.0.0.1', baseUrl: '/api/v1', path: '/a' };
    const req2 = { ip: '127.0.0.1', baseUrl: '/api/v1', path: '/b' };
    let blocked = false;
    const res = {
      status: (code) => {
        if (code === 429) blocked = true;
        return res;
      },
      json: () => {}
    };

    limiter(req1, res, () => {});
    limiter(req2, res, () => {});
    assert.ok(!blocked);
  });
});
