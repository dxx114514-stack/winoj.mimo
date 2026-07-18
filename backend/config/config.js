const path = require('path');
const os = require('os');

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'winoj-access-secret-key-2024',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'winoj-refresh-secret-key-2024',
    accessExpiry: '15m',
    refreshExpiry: '7d',
    refreshExpiryMs: 7 * 24 * 60 * 60 * 1000
  },
  database: {
    path: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'winoj.db')
  },
  sandbox: {
    timeLimitMultiplier: 2,
    maxProcesses: 64,
    tempDir: process.env.SANDBOX_TEMP || path.join(os.tmpdir(), 'winoj-sandbox'),
    maxOutputSize: 64 * 1024,
    maxSourceSize: 64 * 1024
  },
  rateLimit: {
    submissions: { windowMs: 60000, max: 10 },
    ideRun: { windowMs: 60000, max: 20 }
  },
  security: {
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434/api/chat',
    ollamaModel: process.env.OLLAMA_MODEL || 'qwen3:1.7b',
    codeLengthLimit: parseInt(process.env.CODE_LENGTH_LIMIT || '131072')
  }
};
