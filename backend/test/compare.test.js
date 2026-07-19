const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { compareOutput } = require('../services/judge');

describe('compareOutput', () => {
  const strictProblem = { compare_mode: 'text_strict' };
  const relaxedProblem = { compare_mode: 'text_relaxed' };
  const floatProblem = {
    compare_mode: 'real_number',
    real_number_tolerance: JSON.stringify({ absolute: 0.001, relative: 0.001 })
  };

  describe('text_strict', () => {
    it('should match identical strings', () => {
      assert.ok(compareOutput('hello', 'hello', strictProblem));
    });

    it('should reject different strings', () => {
      assert.ok(!compareOutput('hello', 'world', strictProblem));
    });

    it('should handle trailing newlines', () => {
      assert.ok(compareOutput('hello\n', 'hello', strictProblem));
    });

    it('should handle trailing spaces', () => {
      assert.ok(compareOutput('hello  ', 'hello', strictProblem));
    });
  });

  describe('text_relaxed', () => {
    it('should match normalized strings', () => {
      assert.ok(compareOutput('hello  world', 'hello world', relaxedProblem));
    });

    it('should handle extra newlines', () => {
      assert.ok(compareOutput('hello\n\n\nworld', 'hello\nworld', relaxedProblem));
    });

    it('should handle tabs', () => {
      assert.ok(compareOutput('hello\tworld', 'hello world', relaxedProblem));
    });

    it('should handle leading/trailing whitespace', () => {
      assert.ok(compareOutput('  hello  ', 'hello', relaxedProblem));
    });
  });

  describe('real_number', () => {
    it('should match exact numbers', () => {
      assert.ok(compareOutput('3.14159', '3.14159', floatProblem));
    });

    it('should match within absolute tolerance', () => {
      assert.ok(compareOutput('3.141', '3.142', floatProblem));
    });

    it('should reject outside tolerance', () => {
      assert.ok(!compareOutput('3.14', '3.20', floatProblem));
    });

    it('should handle multiple numbers', () => {
      assert.ok(compareOutput('1.0 2.0 3.0', '1.0 2.0 3.0', floatProblem));
    });

    it('should handle different line counts', () => {
      assert.ok(!compareOutput('1.0', '1.0 2.0', floatProblem));
    });
  });
});
