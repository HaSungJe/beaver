#!/usr/bin/env node
// Beaver self-heal hook (PostToolUse, cross-platform, config-driven).
//
// When a spec/test file is saved -> run the project's single-test command for it.
// While a retry is in progress and an implementation file is saved -> re-run.
// On failure, increment .beaver/.retry-count and surface the error so Claude fixes it.
// On unit pass, mark the feature done; full regression is deferred to release. Resets state.
//
// No-ops silently unless .beaver/config.json exists and the changed file looks like
// source/test under the configured source_root. Requires Node on PATH.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { readHookInput, projectRoot, BEAVER_DIR, loadConfig, relPath } = require('./_beaver.js');

function out(msg) { process.stdout.write(msg + '\n'); }

const cfg = loadConfig();
if (!cfg || !cfg.commands || !cfg.commands.test_one) process.exit(0);

const input = readHookInput();
const file = relPath(input?.tool_input?.file_path);
if (!file) process.exit(0);

const root = projectRoot();
const sourceRoot = (cfg.paths && cfg.paths.source_root) || 'src';
const testGlob = (cfg.paths && cfg.paths.test_glob) || '';
const MAX_RETRY = cfg.self_heal_retry_limit || 5;

const RETRY_FILE = path.join(BEAVER_DIR(), '.retry-count');
const SPEC_FILE = path.join(BEAVER_DIR(), '.current-spec');

// Heuristic: is this a test/spec file? (covers .spec.ts/.test.ts/_test.go/test_*.py/*Test.java)
const isSpec = /(\.spec\.|\.test\.|_test\.|Test\.|\/test_|\/tests?\/)/.test(file)
  || (testGlob && file.endsWith(testGlob.replace(/^\*\*\//, '').replace(/^\*/, '')));

const underSource = file.startsWith(sourceRoot + '/') || file.startsWith(sourceRoot);
const isImpl = underSource && !isSpec && /\.(ts|js|java|py|go|rs|kt)$/.test(file);

const retryActive = fs.existsSync(RETRY_FILE);
if (!isSpec && !(isImpl && retryActive)) process.exit(0);

if (isSpec) {
  try { fs.mkdirSync(BEAVER_DIR(), { recursive: true }); } catch {}
  fs.writeFileSync(SPEC_FILE, file);
}

let count = 0;
if (fs.existsSync(RETRY_FILE)) count = parseInt(fs.readFileSync(RETRY_FILE, 'utf-8'), 10) || 0;

if (count >= MAX_RETRY) {
  out(`[beaver] STOP: ${MAX_RETRY}회 자가수복 실패 — 추측 수정 중단. 근본원인 격리 후 plan 단계로 돌아가 접근을 재검토하세요 (build 막힘 fallback).`);
  cleanup();
  process.exit(1);
}

const currentSpec = fs.existsSync(SPEC_FILE) ? fs.readFileSync(SPEC_FILE, 'utf-8').trim() : file;
const name = path.basename(currentSpec).replace(/\.[^.]+$/, '');
const testOneCmd = cfg.commands.test_one.replace(/\$NAME/g, name);

out(`[beaver] 단위 테스트 실행: ${currentSpec} (시도 ${count + 1}/${MAX_RETRY})`);
const unit = run(testOneCmd);
if (unit.code !== 0) {
  count++;
  fs.writeFileSync(RETRY_FILE, String(count));
  out(`[beaver] ❌ 단위 테스트 실패 (${count}/${MAX_RETRY})\n\n${unit.output}\n`);
  out(count < MAX_RETRY
    ? `[beaver] 위 에러를 분석해 코드를 수정하세요. (남은 시도: ${MAX_RETRY - count}회)`
    : `[beaver] 마지막 시도입니다. 수정 후 저장하면 다시 실행됩니다.`);
  process.exit(1);
}
out('[beaver] ✅ 단위 테스트 통과 — 이 기능 구현 완료 (전체 회귀는 release에서)');
cleanup();
process.exit(0);

function run(cmd) {
  try {
    const output = execSync(cmd, { cwd: root, stdio: 'pipe', encoding: 'utf-8' });
    return { code: 0, output };
  } catch (e) {
    return { code: e.status || 1, output: `${e.stdout || ''}${e.stderr || ''}` };
  }
}
function cleanup() {
  try { fs.rmSync(RETRY_FILE, { force: true }); } catch {}
  try { fs.rmSync(SPEC_FILE, { force: true }); } catch {}
}
