const { execSync, spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const db = require('../database/db');

const MEMWATCH_PATH = path.join(__dirname, 'memwatch.exe');
const hasMemwatch = process.platform === 'win32' && fs.existsSync(MEMWATCH_PATH);

const LANG_MAP = {
  c: { compile: 'gcc -O2 -Wall -o "{exe}" "{src}"', run: '"{exe}"', ext: '.c', runUnix: './{exe}', compiled: true },
  cpp: { compile: 'g++ -O2 -Wall -std=c++17 -o "{exe}" "{src}"', run: '"{exe}"', ext: '.cpp', runUnix: './{exe}', compiled: true },
  python3: { compile: '', run: 'python "{src}"', ext: '.py' },
  java: { compile: 'javac "{src}" -d "{workdir}"', run: 'java -cp "{workdir}" Main', ext: '.java', compiled: true },
  javascript: { compile: '', run: 'node "{src}"', ext: '.js' }
};

function loadLanguageConfig() {
  const rows = db.prepare('SELECT name, compile_cmd, run_cmd, extension FROM languages WHERE is_enabled = 1').all();
  const map = {};
  for (const row of rows) {
    const base = LANG_MAP[row.name] || {};
    map[row.name] = {
      compile: row.compile_cmd || base.compile || '',
      run: row.run_cmd || base.run || '',
      ext: row.extension || base.ext || '.txt',
      runUnix: base.runUnix,
      compiled: base.compiled || false
    };
  }
  return { ...LANG_MAP, ...map };
}

function prepareWorkDir(language, sourceCode) {
  const id = uuidv4();
  const workDir = path.join(config.sandbox.tempDir, id);
  fs.mkdirSync(workDir, { recursive: true });

  const langConfig = loadLanguageConfig();
  const lang = langConfig[language];
  if (!lang) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const srcFile = path.join(workDir, `Main${lang.ext}`);
  fs.writeFileSync(srcFile, sourceCode, 'utf8');

  const isWindows = process.platform === 'win32';
  const exeFile = path.join(workDir, 'Main');

  return { workDir, srcFile, exeFile, lang, isWindows };
}

function compile(workDir, srcFile, exeFile, lang, isWindows) {
  if (!lang.compile) return { success: true, output: '' };

  const actualExe = isWindows ? exeFile + '.exe' : exeFile;
  const cmd = lang.compile
    .replace('{src}', srcFile)
    .replace('{exe}', actualExe)
    .replace('{workdir}', workDir);

  try {
    const output = execSync(cmd, {
      cwd: workDir,
      timeout: 30000,
      maxBuffer: 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });
    return { success: true, output: output.toString() };
  } catch (err) {
    return { success: false, output: String(err.stderr || err.stdout || err.message || 'Compilation failed') };
  }
}

function killProc(proc, isWindows) {
  try {
    if (isWindows && proc.pid) {
      exec(`taskkill /F /PID ${proc.pid} /T`, () => {});
    } else {
      proc.kill('SIGKILL');
    }
  } catch {}
}

function runCode(workDir, srcFile, exeFile, lang, stdin, timeLimitMs, memoryLimitMb, isWindows) {
  return new Promise((resolve) => {
    const actualExe = isWindows ? exeFile + '.exe' : exeFile;
    const runCmd = (!isWindows && lang.runUnix) ? lang.runUnix : lang.run;
    const cmd = runCmd
      .replace('{src}', srcFile)
      .replace('{exe}', actualExe)
      .replace('{workdir}', workDir);

    const parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [cmd];
    const execFile = parts[0].replace(/^"|"$/g, '');
    const execArgs = parts.slice(1).map(a => a.replace(/^"|"$/g, ''));

    const useMemwatch = isWindows && hasMemwatch;
    const spawnFile = useMemwatch ? MEMWATCH_PATH : execFile;
    const spawnArgs = useMemwatch ? [execFile, ...execArgs] : execArgs;

    const startTime = Date.now();
    let killed = false;
    let peakMemoryKB = 0;
    let memoryLimitKB = memoryLimitMb * 1024;

    const proc = spawn(spawnFile, spawnArgs, {
      cwd: workDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > config.sandbox.maxOutputSize) {
        killed = true;
        killProc(proc, isWindows);
      }
    });

    proc.stderr.on('data', (data) => {
      const chunk = data.toString();
      if (useMemwatch) {
        const memMatch = chunk.match(/MEMWATCH:(\d+)/);
        if (memMatch) {
          peakMemoryKB = parseInt(memMatch[1]) || 0;
        } else {
          stderr += chunk;
        }
      } else {
        stderr += chunk;
      }
      if (stderr.length > config.sandbox.maxOutputSize) {
        killed = true;
        killProc(proc, isWindows);
      }
    });

    if (stdin) {
      proc.stdin.write(stdin);
    }
    proc.stdin.end();

    const timer = setTimeout(() => {
      killed = true;
      killProc(proc, isWindows);
    }, timeLimitMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      const timeUsed = Date.now() - startTime;
      const oom = memoryLimitKB > 0 && peakMemoryKB > memoryLimitKB;
      resolve({
        stdout,
        stderr,
        exitCode: code !== null ? code : -1,
        timeUsed,
        memoryUsed: peakMemoryKB,
        signal: killed ? (oom ? 'MEMORY_LIMIT' : 'SIGKILL') : null
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: stderr + '\n' + (err.message || 'Process error'),
        exitCode: -1,
        timeUsed: Date.now() - startTime,
        memoryUsed: peakMemoryKB,
        signal: null
      });
    });
  });
}

function cleanupWorkDir(workDir) {
  try {
    fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 3 });
  } catch {}
}

module.exports = { prepareWorkDir, compile, runCode, cleanupWorkDir, loadLanguageConfig };
