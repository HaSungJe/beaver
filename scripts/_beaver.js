// Shared helpers for Beaver hook scripts (CommonJS, cross-platform, zero deps).
const fs = require('fs');
const path = require('path');

// Read the JSON payload Claude Code passes on stdin to a PostToolUse hook.
function readHookInput() {
  try {
    const raw = fs.readFileSync(0, 'utf-8');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Project root = where Claude was launched. Hooks run with cwd at project root.
function projectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

const BEAVER_DIR = () => path.join(projectRoot(), '.beaver');

// Load .beaver/config.json (returns null if absent — hooks then no-op).
function loadConfig() {
  const p = path.join(BEAVER_DIR(), 'config.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
}

// Normalize a file path to project-relative, forward slashes.
function relPath(file) {
  if (!file) return '';
  const root = projectRoot();
  let rel = path.isAbsolute(file) ? path.relative(root, file) : file;
  return rel.split(path.sep).join('/');
}

module.exports = { readHookInput, projectRoot, BEAVER_DIR, loadConfig, relPath };
