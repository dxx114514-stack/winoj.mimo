const express = require('express');
const db = require('../database/db');
const { optionalAuth } = require('../middleware/auth');
const { createRateLimit } = require('../middleware/ratelimit');
const { prepareWorkDir, compile, runCode, cleanupWorkDir, loadLanguageConfig } = require('../sandbox/executor');
const config = require('../config/config');
const { reviewCode, CODE_LENGTH_LIMIT } = require('../services/security');

const router = express.Router();
const rateLimit = createRateLimit(config.rateLimit.ideRun);

router.get('/languages', (req, res) => {
  const languages = db.prepare('SELECT name, display_name, extension FROM languages WHERE is_enabled = 1').all();
  res.json(languages);
});

router.post('/run', optionalAuth, rateLimit, async (req, res) => {
  const { language, source_code, stdin } = req.body;

  if (!language || !source_code) {
    return res.status(400).json({ code: 1, reason: 'ERR_INVALID_ARGUMENT', message: 'language and source_code are required.' });
  }
  if (source_code.length > CODE_LENGTH_LIMIT) {
    return res.status(400).json({ code: 1, reason: 'ERR_INVALID_ARGUMENT', message: `Source code too large. Maximum ${CODE_LENGTH_LIMIT} characters.` });
  }

  const langCheck = db.prepare('SELECT id FROM languages WHERE name = ? AND is_enabled = 1').get(language);
  if (!langCheck) {
    return res.status(400).json({ code: 1, reason: 'ERR_INVALID_ARGUMENT', message: `Language '${language}' is not available.` });
  }

  const langConfig = loadLanguageConfig();
  const lang = langConfig[language];
  if (!lang) {
    return res.status(400).json({ code: 1, reason: 'ERR_INVALID_ARGUMENT', message: `Language configuration not found for '${language}'.` });
  }

  const securityReview = await reviewCode(source_code, language);
  if (!securityReview.safe) {
    if (req.user) {
      db.prepare('UPDATE users SET banned = 1 WHERE id = ?').run(req.user.id);
      db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.user.id);
    }
    return res.status(403).json({
      code: 6,
      reason: 'ERR_FORBIDDEN',
      message: `代码安全审查未通过: ${securityReview.reason}。威胁等级: ${securityReview.threat_level}。账号已被封禁。`
    });
  }

  let workDir, srcFile, exeFile;
  try {
    const prepared = prepareWorkDir(language, source_code);
    workDir = prepared.workDir;
    srcFile = prepared.srcFile;
    exeFile = prepared.exeFile;

    const compileResult = compile(workDir, srcFile, exeFile, lang, prepared.isWindows);
    if (!compileResult.success) {
      cleanupWorkDir(workDir);
      if (req.user) {
        db.prepare('INSERT INTO ide_runs (user_id, language, source_code, stdin, stderr, exit_code) VALUES (?, ?, ?, ?, ?, ?)').run(
          req.user.id, language, source_code, stdin || '', compileResult.output, -1
        );
      }
      return res.json({
        stdout: '',
        stderr: compileResult.output,
        exit_code: -1,
        time_used: 0,
        compile_error: true
      });
    }

    const timeLimitMs = 10000;
    const result = await runCode(workDir, srcFile, exeFile, lang, stdin || '', timeLimitMs, 256, prepared.isWindows);
    cleanupWorkDir(workDir);

    if (req.user) {
      db.prepare('INSERT INTO ide_runs (user_id, language, source_code, stdin, stdout, stderr, exit_code, time_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        req.user.id, language, source_code, stdin || '', result.stdout, result.stderr, result.exitCode, result.timeUsed
      );
    }

    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exit_code: result.exitCode,
      time_used: result.timeUsed,
      compile_error: false
    });
  } catch (err) {
    if (workDir) cleanupWorkDir(workDir);
    res.status(500).json({ code: 2, reason: 'ERR_INVALID_STATE', message: `Execution error: ${err.message}` });
  }
});

module.exports = router;
