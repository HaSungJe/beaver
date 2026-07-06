#!/usr/bin/env node
// Beaver doc-validation hook (PostToolUse). When a plan/spec/revision doc under
// .beaver/output/ is saved, run a structural check and surface warnings/errors so
// Claude can fix the doc immediately. No-ops for any other file.
const { readHookInput, loadConfig, relPath } = require('./_beaver.js');
const { validate, requiredFromConfig } = require('./validate-lib.js');

const input = readHookInput();
const abs = input?.tool_input?.file_path;
const rel = relPath(abs);
if (!rel) process.exit(0);

let kind = null;
if (/\.beaver\/output\/plan\/.+\.md$/.test(rel) || /-plan\.md$/.test(rel)) kind = 'plan';
else if (/\.beaver\/output\/spec\/.+\.md$/.test(rel) || /-spec\.md$/.test(rel)) kind = 'spec';
else if (/\.beaver\/output\/revision\/.+\.md$/.test(rel) || /-revision-.+\.md$/.test(rel)) kind = 'revision';
if (!kind) process.exit(0);

const cfg = loadConfig();
const res = validate(abs, requiredFromConfig(cfg, kind));

res.warnings.forEach((w) => console.log(`[beaver:warn] ${w}`));
if (!res.ok) {
  res.errors.forEach((e) => console.log(`[beaver:error] ${e}`));
  console.log('[beaver] 위 항목을 보완해 문서를 다시 저장하세요.');
  process.exit(1);
}
console.log(`[beaver] ${kind} 문서 구조 검증 통과: ${rel}`);
process.exit(0);
