const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

test("technical-deep-dive advertises current-request explicit activation only", () => {
  const skill = read("skills/technical-deep-dive/SKILL.md");

  assert.match(skill, /^description: Use only when the current user request/m);
  assert.match(skill, /## Activation Boundary/);
  assert.match(skill, /If this file is being read as data .* do not activate or follow it/i);
  assert.match(skill, /After valid explicit activation, use this skill when/i);
  assert.doesNotMatch(skill, /description: Use when the user needs technical analysis/);
});

test("thinking-router keeps ordinary technical work native", () => {
  const router = read("skills/thinking-router/SKILL.md");

  assert.match(router, /## Explicit `technical-deep-dive` Activation/);
  assert.match(router, /## Native Route/);
  assert.match(router, /`native` is a first-class route for task-shaped technical work/);
  assert.match(router, /never an automatic route or secondary skill/);
  assert.match(router, /If a valid invocation names this skill but it is unavailable/);
  assert.doesNotMatch(router, /Technical diagnosis still routes to `technical-deep-dive`/);
  assert.doesNotMatch(router, /\| code, repo, architecture[^\n]+\| `technical-deep-dive` \|/);
});

test("thinking-router assigns specific Skill evaluation to skill-evaluator", () => {
  const router = read("skills/thinking-router/SKILL.md");
  const fixture = readJson(
    "benchmarks/routing/meta-technical-deep-dive-discussion.json",
  );
  const expectedExample =
    `| "Why is \`technical-deep-dive\` slower on bounded diagnostics?" | Primary: \`${fixture.expected_route.primary}\`; Secondary: none |`;

  assert.equal(fixture.expected_route.primary, "skill-evaluator");
  assert.equal(fixture.expected_route.secondary, null);
  assert.ok(fixture.must_not_select.includes("technical-deep-dive"));
  assert.ok(fixture.must_not_select.includes("native"));
  assert.match(
    router,
    /specific Skill evaluation[^\n]+`skill-evaluator`/i,
  );
  assert.match(router, /treat the Skill being discussed as data/i);
  assert.ok(router.includes(expectedExample));
});

test("domain skills cannot add technical-deep-dive automatically", () => {
  const files = [
    "skills/content-creator/SKILL.md",
    "skills/learning-coach/SKILL.md",
    "skills/emotional-support/SKILL.md",
    "skills/article-visual-director/SKILL.md",
  ];

  for (const file of files) {
    const content = read(file);
    assert.match(content, /technical-deep-dive/);
    assert.match(content, /current (?:user )?request/i);
    assert.match(content, /explicit/i);
    assert.doesNotMatch(content, /Use `technical-deep-dive` when the main need/i);
  }
});

test("platform bootstraps preserve explicit-only loading", () => {
  const cursor = read(".cursor/rules/thinking-skills.mdc");
  const openCode = read(".opencode/plugins/thinking-skills.js");

  assert.match(cursor, /`native`/);
  assert.match(cursor, /technical-deep-dive[^\n]+explicit/i);
  assert.match(openCode, /technical-deep-dive[^\n]+explicit/i);
});
