const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const skill = fs.readFileSync(
  path.join(root, 'skills/content-creator/SKILL.md'),
  'utf8',
);
const evals = fs.readFileSync(
  path.join(root, 'evals/content-creator-cases.md'),
  'utf8',
);

assert.match(
  skill,
  /### Output Artifact Contract/,
  'content-creator must define an explicit output artifact contract',
);
assert.match(
  skill,
  /preserve the existing artifact type/i,
  'the contract must preserve an existing Markdown artifact during revisions',
);
assert.match(
  skill,
  /only when the user explicitly asks for HTML/i,
  'standalone HTML must require an explicit user request',
);
assert.match(
  skill,
  /do not recolor, regenerate, or replace confirmed images/i,
  'layout-only Green requests must leave confirmed images unchanged',
);
assert.match(
  evals,
  /content-wechat-green-markdown-artifact-001/,
  'the regression must be represented in content-creator eval cases',
);

console.log('content-creator output artifact contract: passed');
