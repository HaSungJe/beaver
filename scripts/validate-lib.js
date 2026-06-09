// Beaver doc validators (CommonJS, zero deps). Structural checks for plan/spec docs.
// Lenient by design (multi-language): warns on missing structure, errors only on the
// minimum required sections. Required sections can be overridden in .beaver/config.json
// under validation.required_plan_sections / required_spec_sections.
const fs = require('fs');

const DEFAULT_REQUIRED_PLAN = ['## File List', '## Test Cases'];
const DEFAULT_REQUIRED_SPEC = ['## Feature Description', '## API'];

function hasSection(content, heading) {
  // Match heading allowing English/Korean variants loosely: exact prefix on a line.
  const esc = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('^' + esc, 'm').test(content);
}

function checkUnanswered(content) {
  // Unanswered design decisions: an unchecked box "- [ ]" under a 확정 설계 결정사항 / Decisions section.
  const lines = content.split('\n');
  let inDecisions = false;
  const open = [];
  for (const line of lines) {
    if (/^##\s/.test(line)) inDecisions = /(확정\s*설계\s*결정사항|결정사항|decisions?)/i.test(line);
    if (inDecisions && /^\s*-\s*\[\s\]/.test(line)) open.push(line.trim());
  }
  return open;
}

function checkPrereqIncomplete(content) {
  // 사전 구현 필요 항목 with unchecked boxes block build.
  const lines = content.split('\n');
  let inPrereq = false;
  const open = [];
  for (const line of lines) {
    if (/^##\s/.test(line)) inPrereq = /(사전\s*구현\s*필요|prerequisite|pre-?implementation)/i.test(line);
    if (inPrereq && /^\s*-\s*\[\s\]/.test(line)) open.push(line.trim());
  }
  return open;
}

// Strip HTML comments so example checkboxes/sections inside <!-- ... --> don't count.
function stripComments(content) {
  return content.replace(/<!--[\s\S]*?-->/g, '');
}

function validate(filePath, required) {
  const errors = [];
  const warnings = [];
  if (!fs.existsSync(filePath)) return { ok: false, errors: [`file not found: ${filePath}`], warnings };
  const content = stripComments(fs.readFileSync(filePath, 'utf-8'));
  for (const sec of required) {
    if (!hasSection(content, sec)) errors.push(`missing required section: ${sec}`);
  }
  const unanswered = checkUnanswered(content);
  if (unanswered.length) warnings.push(`unanswered design decisions (${unanswered.length}): ${unanswered.join(' | ')}`);
  const prereq = checkPrereqIncomplete(content);
  if (prereq.length) warnings.push(`incomplete prerequisites (${prereq.length}): ${prereq.join(' | ')}`);
  return { ok: errors.length === 0, errors, warnings, unanswered, prereq };
}

function requiredFromConfig(config, kind) {
  const v = config && config.validation;
  if (kind === 'plan') return (v && v.required_plan_sections) || DEFAULT_REQUIRED_PLAN;
  return (v && v.required_spec_sections) || DEFAULT_REQUIRED_SPEC;
}

module.exports = { validate, requiredFromConfig, DEFAULT_REQUIRED_PLAN, DEFAULT_REQUIRED_SPEC };
