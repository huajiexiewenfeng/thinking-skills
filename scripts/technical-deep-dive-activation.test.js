const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadActivationPolicy } = require("./activation-policy");
const {
  hasValidTechnicalDeepDiveInvocation,
} = require("./run-benchmark");
const {
  markerPair,
  renderCursorPolicy,
  renderOpenCodePolicy,
  renderRouterPolicy,
  renderSkillActivationGuard,
  renderSkillFrontmatterDescription,
} = require("./sync-activation-policy");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function normalize(text) {
  return text.replace(/\r\n?/g, "\n");
}

function countExactLines(text, marker) {
  return normalize(text).split("\n").filter((line) => line === marker).length;
}

function ownedBody(text, regionId, filePath) {
  const normalized = normalize(text);
  const [start, end] = markerPair(regionId, filePath);
  assert.equal(countExactLines(normalized, start), 1, `${filePath}: ${start}`);
  assert.equal(countExactLines(normalized, end), 1, `${filePath}: ${end}`);
  return normalized.split(`${start}\n`)[1].split(`\n${end}`)[0];
}

test("all first-party Skills expose unique manifest-owned activation surfaces", () => {
  const policy = loadActivationPolicy({ repoRoot: root });

  for (const [skillId, entry] of Object.entries(policy.skills)) {
    const filePath = path.join(root, "skills", skillId, "SKILL.md");
    const skill = read(path.join("skills", skillId, "SKILL.md"));

    assert.equal(
      ownedBody(skill, "frontmatter", filePath),
      `description: ${renderSkillFrontmatterDescription(entry, skillId)}`,
    );
    assert.equal(
      ownedBody(skill, "guard", filePath),
      renderSkillActivationGuard(entry, skillId),
    );
    assert.match(
      ownedBody(skill, "guard", filePath),
      new RegExp("Activation mode: `" + entry.mode + "`"),
    );
  }
});

test("Explicit and Disabled guards enforce their generic manifest semantics", () => {
  const policy = loadActivationPolicy({ repoRoot: root });
  const explicitIds = Object.keys(policy.skills)
    .filter((skillId) => policy.skills[skillId].mode === "explicit");
  assert.ok(explicitIds.length > 0, "fixture policy must exercise Explicit semantics");

  for (const skillId of explicitIds) {
    const guard = renderSkillActivationGuard(policy.skills[skillId], skillId);
    assert.match(guard, /verify a valid exact invocation/i);
    assert.match(guard, /current final user request/i);
    assert.match(guard, /return control to `thinking-router`/i);
    assert.match(guard, /do not claim this Skill ran/i);
  }

  const disabledGuard = renderSkillActivationGuard(
    { mode: "disabled", auto_description: "Unused disabled fixture." },
    "disabled-fixture",
  );
  assert.match(disabledGuard, /Activation mode: `disabled`/);
  assert.match(disabledGuard, /Return control to `thinking-router`/);
  assert.match(disabledGuard, /Do not follow this file/);
  assert.match(disabledGuard, /even after explicit invocation/);
});

test("technical-deep-dive preserves its authored method and workflow handoff", () => {
  const skill = read("skills/technical-deep-dive/SKILL.md");

  assert.match(skill, /^description: Use only when the current user request/m);
  assert.match(skill, /## Purpose/);
  assert.match(skill, /After valid explicit activation, use this skill when/i);
  assert.match(skill, /## Method Bases/);
  assert.match(skill, /## Overlapping Workflow Handoff/);
  assert.match(skill, /one unified technical artifact/i);
  assert.doesNotMatch(skill, /description: Use when the user needs technical analysis/);
});

test("Router, Cursor, and OpenCode expose unique manifest-rendered policy blocks", () => {
  const policy = loadActivationPolicy({ repoRoot: root });
  const router = read("skills/thinking-router/SKILL.md");
  const cursor = read(".cursor/rules/thinking-skills.mdc");
  const openCode = read(".opencode/plugins/thinking-skills.js");

  assert.equal(
    ownedBody(router, "router", path.join(root, "skills", "thinking-router", "SKILL.md")),
    renderRouterPolicy(policy),
  );
  assert.equal(
    ownedBody(cursor, "cursor", path.join(root, ".cursor", "rules", "thinking-skills.mdc")),
    renderCursorPolicy(policy),
  );
  assert.equal(
    ownedBody(openCode, "runtime", path.join(root, ".opencode", "plugins", "thinking-skills.js")),
    renderOpenCodePolicy(policy),
  );

  assert.match(router, /## Native Route/);
  assert.match(router, /`native` is a first-class resolved route for task-shaped work/);
  assert.match(router, /An Explicit or Disabled Skill cannot be added as secondary/i);
  assert.match(router, /Evaluation of a named Skill remains `skill-evaluator`/i);
  assert.match(router, /\| code, repo, architecture[^\n]+\| `technical-deep-dive` \|/);
  assert.match(router, /\| learn, study, understand[^\n]+\| `learning-coach` \|/);
  assert.doesNotMatch(router, /"Explain Kafka[^\n]+Primary: `native`/);
  assert.doesNotMatch(router, /"Use `learning-coach`[^\n]+Primary:/);
  assert.doesNotMatch(router, /"Please use `technical-deep-dive`[^\n]+Primary:/);

  assert.match(openCode, /const enabledSkills = Object\.freeze\(\[/);
  assert.match(openCode, /\.\.\.activationPolicy\.auto/);
  assert.match(openCode, /\.\.\.activationPolicy\.explicit/);
  assert.match(openCode, /activationPolicy\.disabled\.length > 0/);
  assert.match(openCode, /filtered package/i);
});

test("thinking-router assigns specific Skill evaluation to the skill-evaluator candidate", () => {
  const router = read("skills/thinking-router/SKILL.md");
  const fixture = readJson(
    "benchmarks/routing/meta-technical-deep-dive-discussion.json",
  );
  const expectedExample =
    `| "Why is \`technical-deep-dive\` slower on bounded diagnostics?" | \`${fixture.expected_route.primary}\` | none |`;

  assert.equal(fixture.expected_route.primary, "skill-evaluator");
  assert.equal(fixture.expected_route.secondary, null);
  assert.ok(fixture.must_not_select.includes("technical-deep-dive"));
  assert.ok(fixture.must_not_select.includes("native"));
  assert.match(
    router,
    /Evaluation of a named Skill remains `skill-evaluator`/i,
  );
  assert.match(router, /named Skill treated as data/i);
  assert.ok(router.includes(expectedExample));
});

test("domain Skills return cross-domain activation decisions to the Router", () => {
  const files = [
    "skills/content-creator/SKILL.md",
    "skills/learning-coach/SKILL.md",
    "skills/emotional-support/SKILL.md",
    "skills/article-visual-director/SKILL.md",
  ];

  for (const file of files) {
    const content = read(file);
    assert.match(content, /return routing control to `thinking-router`/i);
    assert.match(content, /Do not infer another Skill's activation mode from this file/i);
    assert.match(content, /generated activation policy decides whether that Skill is Auto, Explicit, or Disabled/i);
    assert.doesNotMatch(content, /technical-deep-dive/i);
    assert.doesNotMatch(content, /Use `technical-deep-dive` when the main need/i);
  }
});

test("Router metadata and public diagrams expose the three-way primary route", () => {
  const router = read("skills/thinking-router/SKILL.md").replace(/\r\n?/g, "\n");
  const cursor = read(".cursor/rules/thinking-skills.mdc");
  const english = read("README.md");
  const chinese = read("README.zh.md");
  const frontmatter = router.match(/^---\n([\s\S]*?)\n---/)?.[1] || "";
  const purpose = router.match(/## Purpose\n([\s\S]*?)\n## /)?.[1] || "";

  assert.match(frontmatter, /description: Use when a user request needs intent classification/i);
  assert.doesNotMatch(frontmatter, /route to the most appropriate domain-specific thinking skill/i);
  assert.match(
    purpose,
    /exactly one primary route: a Domain Skill, `native`, or `no-skill`/i,
  );
  assert.match(
    cursor,
    /`thinking-router`: Use at the start of a request to choose exactly one primary route: a Domain Skill, `native`, or `no-skill`\./,
  );

  for (const readme of [english, chinese]) {
    const top = readme.slice(0, 1800);
    assert.doesNotMatch(top, /thinking-skills-stage2-(?:en|zh)\.png/);
    assert.match(top, /Router\s*-->\s*Domain/);
    assert.match(top, /Router\s*-->\s*Native/);
    assert.match(top, /Router\s*-->\s*NoSkill/);
    assert.match(top, /Explicit\s*-->\s*TDD/);
    assert.doesNotMatch(top, /Tech\s*-->\s*TDD/);
  }
});

test("golden-case input is raw and passes the shared invocation predicate", () => {
  const goldenCase = read("docs/golden-cases.md")
    .replace(/\r\n?/g, "\n")
    .split("# Golden Case: Multi-Skill Collaboration Improvement Loop")[1];
  const input = goldenCase.match(/## Eval Form\s+Input:\s*\n([\s\S]*?)\n\s*Expected:/)?.[1].trim();

  assert.ok(input, "golden-case Eval Form must include a raw input");
  assert.match(input, /^\$thinking-skills:technical-deep-dive\b/);
  assert.equal(hasValidTechnicalDeepDiveInvocation(input), true);
});

test("exploratory technical case distinguishes native and explicit invocation paths", () => {
  const historicalCase = read(
    "cases/framework/exploratory-technical-discussion-over-systematized.md",
  );

  assert.match(historicalCase, /## Historical Evidence/);
  assert.match(historicalCase, /## Current Route Reassessment/);
  assert.match(historicalCase, /ordinary exploratory technical prompt[^\n]+`native`/i);
  assert.match(historicalCase, /must not load `technical-deep-dive`/i);
  assert.match(historicalCase, /explicitly invokes `technical-deep-dive`/i);
  assert.match(historicalCase, /may remain lightweight/i);
});
