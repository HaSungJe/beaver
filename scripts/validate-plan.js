#!/usr/bin/env node
// CLI: node validate-plan.js <path-to-plan.md>
// Used by the build skill to gate implementation. Exits non-zero on structural errors.
const { validate, requiredFromConfig } = require('./validate-lib.js');
const { loadConfig } = require('./_beaver.js');

const file = process.argv[2];
if (!file) { console.error('usage: validate-plan.js <plan.md>'); process.exit(2); }

const cfg = loadConfig();
const res = validate(file, requiredFromConfig(cfg, 'plan'));

res.warnings.forEach((w) => console.log(`[beaver:warn] ${w}`));
if (!res.ok) {
  res.errors.forEach((e) => console.error(`[beaver:error] ${e}`));
  process.exit(1);
}
if (res.unanswered && res.unanswered.length) {
  console.error('[beaver:error] 미답 설계 결정사항이 있어 구현 진입 불가.');
  process.exit(1);
}
if (res.prereq && res.prereq.length) {
  console.error('[beaver:error] 사전 구현 필요 항목이 미완료라 구현 진입 불가.');
  process.exit(1);
}
console.log('[beaver] plan.md 검증 통과');
