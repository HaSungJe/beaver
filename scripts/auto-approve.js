#!/usr/bin/env node
// Beaver PreToolUse hook: auto-approve the in-project file edits beaver's stages
// (plan/build/ship/refactor/analyze) make, so Claude Code does not prompt on every
// Write/Edit. This cuts the most frequent confirmation prompts while keeping the
// risky surface gated.
//
// SCOPE (intentionally narrow for safety):
//   - Auto-approves Write/Edit/MultiEdit/NotebookEdit ONLY for paths INSIDE the
//     project root. Edits to files outside the repo still prompt.
//   - Does NOT touch Bash — every shell command (tests, git push, etc.) still goes
//     through Claude Code's normal confirmation. Arbitrary shell execution is the
//     real risk, so it is never auto-approved here.
//
// DEFAULT: on for any beaver-managed project (one with `.beaver/config.json`).
//   Set `"auto_approve": false` in `.beaver/config.json` to turn it off and get the
//   normal per-edit confirmation back. Projects without a beaver config are untouched.
//
// Output: a PreToolUse "allow" decision, or nothing (normal prompt). Never denies.

const { readHookInput, loadConfig, relPath } = require('./_beaver.js');
const path = require('path');

// No decision -> Claude Code falls back to its normal permission flow (prompt).
function passthrough() { process.exit(0); }

const cfg = loadConfig();
// Only act inside a beaver-managed project, and only when not explicitly disabled.
if (!cfg || cfg.auto_approve === false) passthrough();

const input = readHookInput();
const tool = input.tool_name || '';
if (tool !== 'Write' && tool !== 'Edit' && tool !== 'MultiEdit' && tool !== 'NotebookEdit') passthrough();

const ti = input.tool_input || {};
const file = ti.file_path || ti.notebook_path || '';
if (!file) passthrough();

const rel = relPath(file);
const inside = rel && !rel.startsWith('..') && !path.isAbsolute(rel);
if (!inside) passthrough();

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'allow',
    permissionDecisionReason: `beaver auto_approve: in-project ${tool}`,
  },
}));
