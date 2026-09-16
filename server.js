// ============ الاستيرادات ============
const express = require('express');
const { Octokit } = require('octokit');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// ============ الإعدادات ============
const app = express();
app.use(express.json());

// خدمة index.html من الجذر مباشرة
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ============ GitHub ============
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = process.env.GITHUB_OWNER;
const REPO  = process.env.GITHUB_REPO;
const WORKFLOW_FILE = process.env.WORKFLOW_FILE || 'rdp.yml';

// ============ قاعدة البيانات ============
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');
const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT UNIQUE,
    status TEXT,
    conclusion TEXT,
    ip TEXT,
    username TEXT,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ============ دوال مساعدة ============
function upsertRun({ run_id, status, conclusion, ip, username, password }) {
  const ex = db.prepare(`SELECT id FROM runs WHERE run_id = ?`).get(String(run_id));
  if (ex) {
    db.prepare(`
      UPDATE runs SET
        status = COALESCE(?, status),
        conclusion = COALESCE(?, conclusion),
        ip = COALESCE(?, ip),
        username = COALESCE(?, username),
        password = COALESCE(?, password),
        updated_at = CURRENT_TIMESTAMP
      WHERE run_id = ?
    `).run(status, conclusion, ip, username, password, String(run_id));
  } else {
    db.prepare(`
      INSERT INTO runs (run_id, status, conclusion, ip, username, password)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(String(run_id), status, conclusion, ip, username, password);
  }
}

// ============ API Routes ============

// 1. تشغيل workflow
app.post('/api/dispatch', async (req, res) => {
  try {
    await octokit.rest.actions.createWorkflowDispatch({
      owner: OWNER, repo: REPO,
      workflow_id: WORKFLOW_FILE,
      ref: req.body.ref || 'main'
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('Dispatch:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 2. قائمة التشغيلات
app.get('/api/runs', (req, res) => {
  const rows = db.prepare(`SELECT * FROM runs ORDER BY id DESC LIMIT 100`).all();
  res.json(rows);
});

// 3. استقبال نتائج من الـ workflow
app.post('/api/report', (req, res) => {
  const { run_id, ip, username, password, status } = req.body;
  upsertRun({ run_id, ip, username, password, status: status || 'ready' });
  res.json({ ok: true });
});

// 4. إلغاء
app.post('/api/runs/:id/cancel', async (req, res) => {
  try {
    await octokit.rest.actions.cancelWorkflowRun({
      owner: OWNER, repo: REPO, run_id: req.params.id
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. حذف من الذاكرة
app.delete('/api/runs/:id', (req, res) => {
  db.prepare(`DELETE FROM runs WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// ============ مزامنة تلقائية مع GitHub ============
async function syncFromGitHub() {
  try {
    const { data } = await octokit.rest.actions.listWorkflowRuns({
      owner: OWNER, repo: REPO,
      workflow_id: WORKFLOW_FILE,
      per_page: 20
    });
    for (const run of data.workflow_runs) {
      upsertRun({
        run_id: String(run.id),
        status: run.status,
        conclusion: run.conclusion
      });
    }
    console.log(`[Sync] ${data.workflow_runs.length} runs`);
  } catch (e) {
    console.error('Sync:', e.message);
  }
}

setInterval(syncFromGitHub, 30000);
syncFromGitHub();

// ============ الإقلاع ============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
