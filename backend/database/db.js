const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

let sqlDb = null;

function saveDB() {
  if (!sqlDb) return;
  const data = sqlDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.database.path, buffer);
}

function prepare(sql) {
  return {
    get(...params) {
      const stmt = sqlDb.prepare(sql);
      if (params.length > 0 && Array.isArray(params[0])) stmt.bind(params[0]);
      else if (params.length > 0) stmt.bind(params);
      let result = undefined;
      if (stmt.step()) result = stmt.getAsObject();
      stmt.free();
      return result;
    },
    all(...params) {
      const stmt = sqlDb.prepare(sql);
      if (params.length > 0 && Array.isArray(params[0])) stmt.bind(params[0]);
      else if (params.length > 0) stmt.bind(params);
      const results = [];
      while (stmt.step()) results.push(stmt.getAsObject());
      stmt.free();
      return results;
    },
    run(...params) {
      const flat = params.length > 0 && Array.isArray(params[0]) ? params[0] : params;
      sqlDb.run(sql, flat);
      const lastId = prepare('SELECT last_insert_rowid() as id').get()?.id;
      const changes = sqlDb.getRowsModified();
      saveDB();
      return { lastInsertRowid: lastId, changes };
    }
  };
}

function findNextId(table) {
  const rows = sqlDb.exec(`SELECT id FROM ${table} ORDER BY id`);
  if (rows.length === 0 || rows[0].values.length === 0) return 1;
  const ids = rows[0].values.map(r => r[0]).sort((a, b) => a - b);
  if (ids[0] > 1) return 1;
  for (let i = 0; i < ids.length - 1; i++) {
    if (ids[i + 1] - ids[i] > 1) return ids[i] + 1;
  }
  return ids[ids.length - 1] + 1;
}

function exec(sql) {
  sqlDb.exec(sql);
  saveDB();
}

async function initDB() {
  const SQL = await initSqlJs();
  const dbDir = path.dirname(config.database.path);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  let existingData = null;
  if (fs.existsSync(config.database.path)) {
    existingData = fs.readFileSync(config.database.path);
  }
  sqlDb = existingData ? new SQL.Database(existingData) : new SQL.Database();
  sqlDb.run('PRAGMA journal_mode = WAL');
  sqlDb.run('PRAGMA foreign_keys = ON');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  sqlDb.exec(schema);

  const colsResult = sqlDb.exec("PRAGMA table_info(users)");
  const cols = colsResult.length > 0 ? colsResult[0].values.map(r => r[1]) : [];
  if (!cols.includes('signature')) sqlDb.exec("ALTER TABLE users ADD COLUMN signature TEXT DEFAULT ''");
  if (!cols.includes('bio')) sqlDb.exec("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''");
  if (!cols.includes('provider')) sqlDb.exec("ALTER TABLE users ADD COLUMN provider TEXT DEFAULT ''");
  if (!cols.includes('rating')) sqlDb.exec("ALTER TABLE users ADD COLUMN rating INTEGER DEFAULT 1500");

  const probColsResult = sqlDb.exec("PRAGMA table_info(problems)");
  const probCols = probColsResult.length > 0 ? probColsResult[0].values.map(r => r[1]) : [];
  if (!probCols.includes('provider')) sqlDb.exec("ALTER TABLE problems ADD COLUMN provider TEXT DEFAULT ''");
  saveDB();

  const langCount = prepare('SELECT COUNT(*) as c FROM languages').get()?.c || 0;
  if (langCount === 0) {
    const ins = prepare('INSERT INTO languages (name, display_name, compile_cmd, run_cmd, extension) VALUES (?, ?, ?, ?, ?)');
    ins.run('c', 'C', 'gcc -O2 -Wall -o "{exe}" "{src}"', '"{exe}"', '.c');
    ins.run('cpp', 'C++', 'g++ -O2 -Wall -std=c++17 -o "{exe}" "{src}"', '"{exe}"', '.cpp');
    ins.run('python3', 'Python 3', '', 'python "{src}"', '.py');
    ins.run('java', 'Java', 'javac "{src}" -d "{workdir}"', 'java -cp "{workdir}" Main', '.java');
    ins.run('javascript', 'JavaScript', '', 'node "{src}"', '.js');
  }

  const adminCount = prepare("SELECT COUNT(*) as c FROM users WHERE username = 'admin'").get()?.c || 0;
  if (adminCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    prepare('INSERT INTO users (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)').run('admin', hash, 'Super Admin', 'su');
  }
  saveDB();
}

const db = { prepare, exec, saveDB, findNextId };
module.exports = db;
module.exports.initDB = initDB;
