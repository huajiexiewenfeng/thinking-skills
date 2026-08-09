const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { loadActivationPolicy } = require("./activation-policy");
const { hasCurrentRequestExplicitSkillInvocation } = require("./explicit-skill-invocation");
const {
  applyActivationSyncPlan,
  buildActivationSyncPlan,
  checkActivationSyncPlan,
  main,
  renderActivationBenchmarkCases,
  renderCursorPolicy,
  renderOpenCodePolicy,
  renderReadmeActivationTable,
  renderRouterPolicy,
  renderSkillActivationGuard,
  renderSkillFrontmatterDescription,
  replaceOwnedRegion,
} = require("./sync-activation-policy");

const tempRoots = [];

test.afterEach(() => {
  for (const repoRoot of tempRoots.splice(0)) {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

function makePolicy(entries) {
  return {
    schema_version: 1,
    default_mode: "auto",
    skills: Object.fromEntries(entries.map(([skillId, mode, autoDescription]) => [
      skillId,
      { mode, auto_description: autoDescription },
    ])),
  };
}

function skillText(description = "Old generated text.", guard = "Old generated guard.") {
  return [
    "---",
    "name: demo",
    "# activation-policy:frontmatter:start",
    `description: ${description}`,
    "# activation-policy:frontmatter:end",
    "---",
    "",
    "# Demo",
    "",
    "<!-- activation-policy:guard:start -->",
    guard,
    "<!-- activation-policy:guard:end -->",
    "",
    "Human-authored method text.",
    "",
  ].join("\n");
}

function routerText(policy) {
  return skillText().replace(
    "Human-authored method text.",
    [
      "<!-- activation-policy:router:start -->",
      renderRouterPolicy(policy),
      "<!-- activation-policy:router:end -->",
      "",
      "| User Signals | Candidate Domain |",
      "|---|---|",
      "| code, repo, architecture, bug | `technical-deep-dive` |",
      "| learn, explain, concept, mental model | `learning-coach` |",
      "",
      "Human-authored method text.",
    ].join("\n"),
  );
}

function cursorText(policy) {
  return [
    "<!-- activation-policy:cursor:start -->",
    renderCursorPolicy(policy),
    "<!-- activation-policy:cursor:end -->",
    "",
  ].join("\n");
}

function openCodeText(policy) {
  return [
    "// activation-policy:runtime:start",
    renderOpenCodePolicy(policy),
    "// activation-policy:runtime:end",
    "const enabledSkills = [...activationPolicy.auto, ...activationPolicy.explicit];",
    "const bootstrap = enabledSkills.map((skillId) => `thinking-skills/${skillId}`).join(\"\\n\");",
    "",
  ].join("\n");
}

function makeFixtureRepo(entries = [["demo", "auto", "Use automatically for demos."]]) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-policy-"));
  tempRoots.push(repoRoot);
  fs.mkdirSync(path.join(repoRoot, "config"), { recursive: true });
  fs.mkdirSync(path.join(repoRoot, "benchmarks", "generated", "activation-policy"), { recursive: true });

  const policy = makePolicy(entries);
  for (const skillId of Object.keys(policy.skills)) {
    const skillRoot = path.join(repoRoot, "skills", skillId);
    fs.mkdirSync(skillRoot, { recursive: true });
    fs.writeFileSync(
      path.join(skillRoot, "SKILL.md"),
      skillId === "thinking-router" ? routerText(policy) : skillText(),
      "utf8",
    );
  }

  const cursorPath = path.join(repoRoot, ".cursor", "rules", "thinking-skills.mdc");
  fs.mkdirSync(path.dirname(cursorPath), { recursive: true });
  fs.writeFileSync(cursorPath, cursorText(policy), "utf8");
  const openCodePath = path.join(repoRoot, ".opencode", "plugins", "thinking-skills.js");
  fs.mkdirSync(path.dirname(openCodePath), { recursive: true });
  fs.writeFileSync(openCodePath, openCodeText(policy), "utf8");

  const yaml = [
    "schema_version: 1",
    "default_mode: auto",
    "skills:",
    ...Object.entries(policy.skills).flatMap(([skillId, entry]) => [
      `  ${skillId}:`,
      `    mode: ${entry.mode}`,
      `    auto_description: ${JSON.stringify(entry.auto_description)}`,
    ]),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(repoRoot, "config", "activation-policy.yaml"), yaml, "utf8");
  return { repoRoot, policy };
}

function countExactLines(text, line) {
  return text.split(/\r?\n/).filter((candidate) => candidate === line).length;
}

function withoutGeneratedSkillRegions(text) {
  return text
    .replace(
      /# activation-policy:frontmatter:start[\s\S]*?# activation-policy:frontmatter:end/,
      "# generated frontmatter",
    )
    .replace(
      /<!-- activation-policy:guard:start -->[\s\S]*?<!-- activation-policy:guard:end -->/,
      "<!-- generated guard -->",
    )
    .replace(
      /<!-- activation-policy:router:start -->[\s\S]*?<!-- activation-policy:router:end -->/,
      "<!-- generated router policy -->",
    );
}

test("checked-in activation surfaces match the manifest", () => {
  const repoRoot = path.resolve(__dirname, "..");
  const policy = loadActivationPolicy({ repoRoot });
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  assert.deepEqual(checkActivationSyncPlan(plan), []);
});

test("checked-in runtime surfaces each expose exactly one owned activation region", () => {
  const repoRoot = path.resolve(__dirname, "..");
  const policy = loadActivationPolicy({ repoRoot });

  for (const skillId of Object.keys(policy.skills)) {
    const contents = fs.readFileSync(path.join(repoRoot, "skills", skillId, "SKILL.md"), "utf8");
    for (const marker of [
      "# activation-policy:frontmatter:start",
      "# activation-policy:frontmatter:end",
      "<!-- activation-policy:guard:start -->",
      "<!-- activation-policy:guard:end -->",
    ]) {
      assert.equal(countExactLines(contents, marker), 1, `${skillId}: ${marker}`);
    }
  }

  for (const [filePath, start, end] of [
    [path.join(repoRoot, "skills", "thinking-router", "SKILL.md"), "<!-- activation-policy:router:start -->", "<!-- activation-policy:router:end -->"],
    [path.join(repoRoot, ".cursor", "rules", "thinking-skills.mdc"), "<!-- activation-policy:cursor:start -->", "<!-- activation-policy:cursor:end -->"],
    [path.join(repoRoot, ".opencode", "plugins", "thinking-skills.js"), "// activation-policy:runtime:start", "// activation-policy:runtime:end"],
  ]) {
    const contents = fs.readFileSync(filePath, "utf8");
    assert.equal(countExactLines(contents, start), 1, `${filePath}: ${start}`);
    assert.equal(countExactLines(contents, end), 1, `${filePath}: ${end}`);
  }

});

test("OpenCode rejects disabled policy with the unfiltered source Skills directory", () => {
  const repoRoot = path.resolve(__dirname, "..");
  const openCode = fs.readFileSync(
    path.join(repoRoot, ".opencode", "plugins", "thinking-skills.js"),
    "utf8",
  );
  assert.match(openCode, /activationPolicy\.disabled\.length > 0/);
  assert.match(openCode, /unfiltered source Skills directory/i);
  assert.match(openCode, /filtered package/i);
});

test("OpenCode generated enabled Skills exclude fixture-disabled Skills", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["thinking-router", "auto", "Route requests."],
    ["auto-skill", "auto", "Use automatically."],
    ["explicit-skill", "explicit", "Explicit."],
    ["disabled-skill", "disabled", "Disabled."],
  ]);
  const pluginPath = path.join(repoRoot, ".opencode", "plugins", "thinking-skills.js");

  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const plugin = plan.find((item) => item.path === pluginPath);
  assert.ok(plugin, "expected OpenCode to be a registered sync target");
  assert.match(plugin.after, /disabled: Object\.freeze\(\[\s+"disabled-skill",/);
  assert.match(plugin.after, /const enabledSkills = \[\.\.\.activationPolicy\.auto, \.\.\.activationPolicy\.explicit\];/);
  assert.doesNotMatch(plugin.after, /thinking-skills\/disabled-skill/);
});

test("Router examples reject an uninvoked Explicit or selected Disabled Skill", () => {
  for (const [mode, request] of [
    ["explicit", "Explain this topic."],
    ["disabled", "Use disabled-skill to explain this topic."],
  ]) {
    const { repoRoot, policy } = makeFixtureRepo([
      ["thinking-router", "auto", "Route requests."],
      [`${mode}-skill`, mode, `${mode} description.`],
    ]);
    const routerPath = path.join(repoRoot, "skills", "thinking-router", "SKILL.md");
    const router = fs.readFileSync(routerPath, "utf8").replace(
      "Human-authored method text.",
      [
        "Human-authored method text.",
        "",
        "| Request | Route |",
        "|---|---|",
        `| \"${request}\" | Primary: \`${mode}-skill\`; Secondary: none |`,
      ].join("\n"),
    );
    fs.writeFileSync(routerPath, router, "utf8");

    assert.throws(
      () => buildActivationSyncPlan({ repoRoot, policy }),
      new RegExp(`${mode}-skill.*example.*${mode}`, "i"),
    );
  }
});

test("Router example validation shares canonical invocation semantics", () => {
  const skillId = "explicit-skill";
  const negativeCases = [
    ["question", `Should we use ${skillId}?`],
    ["negated", `Do not use ${skillId}.`],
    ["reported", `The documentation says, use ${skillId}.`],
    ["quoted", `Example: \"Please use ${skillId}.\"`],
  ];

  for (const [name, request] of negativeCases) {
    assert.equal(
      hasCurrentRequestExplicitSkillInvocation(request, skillId),
      false,
      `${name} must be non-activating under the canonical predicate`,
    );
    const { repoRoot, policy } = makeFixtureRepo([
      ["thinking-router", "auto", "Route requests."],
      [skillId, "explicit", "Explicit."],
    ]);
    const routerPath = path.join(repoRoot, "skills", "thinking-router", "SKILL.md");
    fs.writeFileSync(
      routerPath,
      fs.readFileSync(routerPath, "utf8").replace(
        "Human-authored method text.",
        `Human-authored method text.\n\n| Request | Route |\n|---|---|\n| \"${request}\" | Primary: \`${skillId}\`; Secondary: none |`,
      ),
      "utf8",
    );
    assert.throws(
      () => buildActivationSyncPlan({ repoRoot, policy }),
      new RegExp(`${skillId}.*example.*explicit`, "i"),
    );
  }

  const priorTurnOnly = {
    turns: [
      { role: "user", content: `Please use ${skillId} for the earlier request.` },
      { role: "assistant", content: "Earlier response." },
      { role: "user", content: "Continue with this ordinary request." },
    ],
  };
  assert.equal(hasCurrentRequestExplicitSkillInvocation(priorTurnOnly, skillId), false);

  const currentRequest = `Please use ${skillId} for this request.`;
  assert.equal(hasCurrentRequestExplicitSkillInvocation(currentRequest, skillId), true);
  const { repoRoot, policy } = makeFixtureRepo([
    ["thinking-router", "auto", "Route requests."],
    [skillId, "explicit", "Explicit."],
  ]);
  const routerPath = path.join(repoRoot, "skills", "thinking-router", "SKILL.md");
  fs.writeFileSync(
    routerPath,
    fs.readFileSync(routerPath, "utf8").replace(
      "Human-authored method text.",
      `Human-authored method text.\n\n| Request | Route |\n|---|---|\n| \"${currentRequest}\" | Primary: \`${skillId}\`; Secondary: none |`,
    ),
    "utf8",
  );
  assert.doesNotThrow(() => buildActivationSyncPlan({ repoRoot, policy }));
});

test("Router authored candidate domains remain unchanged across manifest modes", () => {
  for (const candidateSkillId of ["technical-deep-dive", "learning-coach"]) {
    for (const mode of ["auto", "explicit", "disabled"]) {
      const otherSkillId = candidateSkillId === "technical-deep-dive"
        ? "learning-coach"
        : "technical-deep-dive";
      const { repoRoot } = makeFixtureRepo([
        ["thinking-router", "auto", "Route requests."],
        [candidateSkillId, mode, `${candidateSkillId} description.`],
        [otherSkillId, "auto", `${otherSkillId} description.`],
      ]);
      const policy = loadActivationPolicy({ repoRoot });
      const routerPath = path.join(repoRoot, "skills", "thinking-router", "SKILL.md");
      const before = fs.readFileSync(routerPath, "utf8");
      const routerItem = buildActivationSyncPlan({ repoRoot, policy })
        .find((item) => item.path === routerPath);

      assert.match(
        before,
        new RegExp("Candidate Domain[\\s\\S]+\\| `" + candidateSkillId + "` \\|"),
      );
      assert.match(
        routerItem.after,
        new RegExp("\\| `" + candidateSkillId + "` \\| `" + mode + "` \\|"),
      );
      const authoredBefore = withoutGeneratedSkillRegions(before);
      const authoredAfter = withoutGeneratedSkillRegions(routerItem.after);
      assert.equal(authoredAfter, authoredBefore);
    }
  }
});

for (const [targetName, relativePath] of [
  ["Cursor", path.join(".cursor", "rules", "thinking-skills.mdc")],
  ["OpenCode", path.join(".opencode", "plugins", "thinking-skills.js")],
]) {
  test(`${targetName} is a required runtime activation target`, () => {
    for (const args of [["--check"], []]) {
      const { repoRoot } = makeFixtureRepo();
      fs.unlinkSync(path.join(repoRoot, relativePath));
      assert.throws(
        () => main(args, { repoRoot }),
        new RegExp(`${targetName}.*required.*missing`, "i"),
      );
    }
  });
}

test("every manifest Skill file is a required activation target", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["alpha-skill", "auto", "Alpha."],
    ["zeta-skill", "explicit", "Zeta."],
  ]);
  fs.unlinkSync(path.join(repoRoot, "skills", "zeta-skill", "SKILL.md"));
  assert.throws(
    () => buildActivationSyncPlan({ repoRoot, policy }),
    /zeta-skill.*required.*missing/i,
  );
});

test("replaceOwnedRegion changes one region and preserves all authored bytes", () => {
  const filePath = path.join("fixture", "SKILL.md");
  const before = skillText();
  const after = replaceOwnedRegion(before, "guard", "Generated line one.\r\nGenerated line two.", filePath);

  assert.equal(after, before.replace("Old generated guard.", "Generated line one.\nGenerated line two."));
  assert.equal(after.endsWith("\n"), true);
  assert.equal(
    replaceOwnedRegion(before.slice(0, -1), "guard", "Generated.", filePath).endsWith("\n"),
    false,
  );

  const crlfBefore = before.replace(/\n/g, "\r\n");
  const crlfAfter = replaceOwnedRegion(crlfBefore, "guard", "Generated A.\r\nGenerated B.", filePath);
  assert.equal(crlfAfter.endsWith("\r\n"), true);
  assert.equal(
    crlfAfter,
    crlfBefore.replace("Old generated guard.", "Generated A.\nGenerated B."),
  );
});

test("replaceOwnedRegion ignores marker text embedded in authored prose", () => {
  const filePath = path.join("fixture", "SKILL.md");
  const prose = "This prose mentions <!-- activation-policy:guard:start --> without owning a region.\n";
  const before = `${prose}${skillText()}`;

  const after = replaceOwnedRegion(before, "guard", "Generated.", filePath);

  assert.equal(after, `${prose}${skillText().replace("Old generated guard.", "Generated.")}`);
});

for (const [name, mutate] of [
  ["missing", (text) => text.replace("<!-- activation-policy:guard:end -->", "")],
  ["duplicate", (text) => text.replace(
    "<!-- activation-policy:guard:start -->",
    "<!-- activation-policy:guard:start -->\n<!-- activation-policy:guard:start -->",
  )],
  ["reversed", (text) => text
    .replace("<!-- activation-policy:guard:start -->", "PLACEHOLDER")
    .replace("<!-- activation-policy:guard:end -->", "<!-- activation-policy:guard:start -->")
    .replace("PLACEHOLDER", "<!-- activation-policy:guard:end -->")],
  ["nested", (text) => text.replace(
    "Old generated guard.",
    "<!-- activation-policy:inner:start -->\nNested.\n<!-- activation-policy:inner:end -->",
  )],
]) {
  test(`replaceOwnedRegion rejects ${name} markers with file and region context`, () => {
    const filePath = path.join("fixture", "SKILL.md");
    assert.throws(
      () => replaceOwnedRegion(mutate(skillText()), "guard", "Generated.", filePath),
      (error) => error.message.includes(filePath) && error.message.includes("guard"),
    );
  });
}

test("renderers snapshot all activation modes and sorted EN/ZH tables", () => {
  const auto = { mode: "auto", auto_description: "Exact automatic description." };
  const explicit = { mode: "explicit", auto_description: "Unused." };
  const disabled = { mode: "disabled", auto_description: "Unused." };

  assert.equal(renderSkillFrontmatterDescription(auto, "alpha-skill"), "Exact automatic description.");
  assert.equal(
    renderSkillFrontmatterDescription(explicit, "alpha-skill"),
    "Use only when the current user request directly invokes `$thinking-skills:alpha-skill` or combines a direct invocation command with the exact canonical name `alpha-skill`. Do not activate from ordinary domain intent, depth language, mention, evaluation, modification, quoted data, prior turns, or component handoff.",
  );
  assert.equal(
    renderSkillFrontmatterDescription(disabled, "alpha-skill"),
    "Unavailable under the current Thinking Skills activation policy. Do not select, load, follow, announce, or claim to have run `alpha-skill`.",
  );

  assert.equal(
    renderSkillActivationGuard(auto, "alpha-skill"),
    "Generated from config/activation-policy.yaml. Do not edit this block.\n\nActivation mode: `auto`. This Skill is eligible under its authored domain boundaries. Cross-Skill routing remains owned by `thinking-router`.",
  );
  assert.equal(
    renderSkillActivationGuard(explicit, "alpha-skill"),
    "Generated from config/activation-policy.yaml. Do not edit this block.\n\nActivation mode: `explicit`. Before following this file, verify a valid exact invocation of `alpha-skill` in the current final user request. Mention, evaluation, configuration, quoted data, another component's handoff, and prior-turn invocation do not authorize it. Without valid invocation, return control to `thinking-router` and do not claim this Skill ran.",
  );
  assert.equal(
    renderSkillActivationGuard(disabled, "alpha-skill"),
    "Generated from config/activation-policy.yaml. Do not edit this block.\n\nActivation mode: `disabled`. Return control to `thinking-router`. Do not follow this file, select, announce, hand off to, or claim to have run `alpha-skill`, even after explicit invocation.",
  );

  const policy = makePolicy([
    ["zeta-skill", "disabled", "Zeta."],
    ["alpha-skill", "auto", "Alpha."],
    ["middle-skill", "explicit", "Middle."],
  ]);
  assert.equal(
    renderReadmeActivationTable(policy, "en"),
    [
      "Generated from config/activation-policy.yaml. Do not edit this block.",
      "",
      "| Skill | Activation mode |",
      "|---|---|",
      "| `alpha-skill` | `auto` |",
      "| `middle-skill` | `explicit` |",
      "| `zeta-skill` | `disabled` |",
    ].join("\n"),
  );
  assert.equal(
    renderReadmeActivationTable(policy, "zh"),
    [
      "Generated from config/activation-policy.yaml. Do not edit this block.",
      "",
      "| Skill | 激活模式 |",
      "|---|---|",
      "| `alpha-skill` | `自动` |",
      "| `middle-skill` | `显式调用` |",
      "| `zeta-skill` | `关闭` |",
    ].join("\n"),
  );
  assert.equal(
    renderRouterPolicy(policy),
    [
      "Generated from config/activation-policy.yaml. Do not edit this block.",
      "",
      "## Activation Modes",
      "",
      "| Skill | Mode |",
      "|---|---|",
      "| `alpha-skill` | `auto` |",
      "| `middle-skill` | `explicit` |",
      "| `zeta-skill` | `disabled` |",
      "",
      "### Candidate Resolution",
      "",
      "Authored routing identifies a domain candidate from domain ownership only. Apply the candidate's generated mode before selection:",
      "",
      "- `auto`: the candidate may be selected.",
      "- `explicit`: the candidate may be selected only after valid exact canonical invocation in the current final user request.",
      "- `disabled`: the candidate is never selectable; a direct invocation receives an unavailable response.",
      "",
      "When a candidate is not selectable, continue among other appropriate eligible routes or `native`. Task-shaped technical work may resolve to `native`; other intent keeps its authored domain ownership while eligibility is resolved.",
      "",
      "An Explicit or Disabled Skill cannot be added as secondary merely because its subject matter is relevant. Evaluation of a named Skill remains `skill-evaluator`, with the named Skill treated as data, unless the same request validly invokes an enabled Explicit Skill.",
    ].join("\n"),
  );
  assert.equal(
    renderCursorPolicy(policy),
    [
      "Generated from config/activation-policy.yaml. Do not edit this block.",
      "",
      "- `auto`: `alpha-skill`",
      "- `explicit`: `middle-skill`",
      "- `disabled`: `zeta-skill`",
      "",
      "Explicit Skills require valid exact invocation in the current final user request. Disabled Skills are unavailable and must not be selected, loaded, announced, or handed off to.",
    ].join("\n"),
  );
  assert.equal(
    renderOpenCodePolicy(policy),
    [
      "const activationPolicy = Object.freeze({",
      "  auto: Object.freeze([",
      "    \"alpha-skill\",",
      "  ]),",
      "  explicit: Object.freeze([",
      "    \"middle-skill\",",
      "  ]),",
      "  disabled: Object.freeze([",
      "    \"zeta-skill\",",
      "  ]),",
      "});",
    ].join("\n"),
  );
});

test("generated activation fixture names are stable and sorted", () => {
  const policy = makePolicy([
    ["technical-deep-dive", "disabled", "Technical."],
    ["content-creator", "auto", "Content."],
    ["learning-coach", "explicit", "Learning."],
  ]);

  assert.deepEqual(
    renderActivationBenchmarkCases(policy).map((item) => item.fileName),
    ["learning-coach-explicit.json", "technical-deep-dive-disabled.json"],
  );
});

test("generated activation fixtures use deterministic profiles for every first-party Skill", () => {
  const expectedProfiles = {
    "article-visual-director": {
      domain: "content",
      objective: "deliver",
      mutation: "requested",
      artifact: "visual system",
      artifact_sink: "workspace",
    },
    "benchmark-assistant": {
      domain: "meta",
      objective: "review",
      mutation: "none",
      artifact: "benchmark analysis",
      artifact_sink: "chat",
    },
    "content-creator": {
      domain: "content",
      objective: "deliver",
      mutation: "none",
      artifact: "content draft",
      artifact_sink: "chat",
    },
    "conversation-review": {
      domain: "meta",
      objective: "review",
      mutation: "none",
      artifact: "conversation review",
      artifact_sink: "chat",
    },
    "emotional-support": {
      domain: "emotional",
      objective: "explore",
      mutation: "none",
      artifact: "support",
      artifact_sink: "chat",
    },
    "learning-coach": {
      domain: "learning",
      objective: "explore",
      mutation: "none",
      artifact: "guided understanding",
      artifact_sink: "chat",
    },
    "skill-evaluator": {
      domain: "meta",
      objective: "review",
      mutation: "none",
      artifact: "skill evaluation",
      artifact_sink: "chat",
    },
    "technical-deep-dive": {
      domain: "technical",
      objective: "explore",
      mutation: "none",
      artifact: "analysis",
      artifact_sink: "chat",
    },
    "thinking-router": {
      domain: "meta",
      objective: "decide",
      mutation: "none",
      artifact: "routing decision",
      artifact_sink: "chat",
    },
  };
  const policy = makePolicy(
    Object.keys(expectedProfiles).reverse().map((skillId) => [skillId, "explicit", `${skillId}.`]),
  );

  const rendered = renderActivationBenchmarkCases(policy);

  assert.deepEqual(
    rendered.map((item) => item.fileName),
    Object.keys(expectedProfiles).map((skillId) => `${skillId}-explicit.json`),
  );
  for (const item of rendered) {
    const benchmarkCase = JSON.parse(item.content);
    const skillId = item.fileName.replace(/-explicit\.json$/, "");
    assert.deepEqual(benchmarkCase.expected_profile, expectedProfiles[skillId]);
  }
});

test("generated activation fixtures encode Explicit selection and Disabled unavailability", () => {
  const policy = makePolicy([
    ["technical-deep-dive", "disabled", "Technical."],
    ["content-creator", "auto", "Content."],
    ["learning-coach", "explicit", "Learning."],
  ]);

  assert.deepEqual(
    renderActivationBenchmarkCases(policy),
    [
      {
        fileName: "learning-coach-explicit.json",
        content: `${JSON.stringify({
          id: "activation-explicit-learning-coach-001",
          kind: "route",
          turns: [{
            role: "user",
            content: "$thinking-skills:learning-coach Help me work through this request.",
          }],
          expected_profile: {
            domain: "learning",
            objective: "explore",
            mutation: "none",
            artifact: "guided understanding",
            artifact_sink: "chat",
          },
          expected_route: { primary: "learning-coach", secondary: null },
          expected_advisory: [],
          must_not_select: ["native", "no-skill"],
        }, null, 2)}\n`,
      },
      {
        fileName: "technical-deep-dive-disabled.json",
        content: `${JSON.stringify({
          id: "activation-disabled-technical-deep-dive-001",
          kind: "route",
          turns: [{
            role: "user",
            content: "$thinking-skills:technical-deep-dive Help me work through this request.",
          }],
          expected_profile: {
            domain: "technical",
            objective: "explore",
            mutation: "none",
            artifact: "analysis",
            artifact_sink: "chat",
          },
          expected_route: { primary: "native", secondary: null },
          expected_advisory: [],
          must_not_select: ["technical-deep-dive"],
        }, null, 2)}\n`,
      },
    ],
  );
});

test("missing generated fixture directory is created from the rendered plan", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["learning-coach", "explicit", "Learning."],
  ]);
  const generatedParent = path.join(repoRoot, "benchmarks", "generated");
  const generatedRoot = path.join(generatedParent, "activation-policy");
  fs.rmSync(generatedParent, { recursive: true, force: true });

  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const generatedPath = path.join(generatedRoot, "learning-coach-explicit.json");
  assert.ok(plan.some((item) => item.path === generatedPath && item.before === null));

  applyActivationSyncPlan(plan);

  assert.equal(fs.existsSync(generatedPath), true);
  assert.deepEqual(
    checkActivationSyncPlan(buildActivationSyncPlan({ repoRoot, policy })),
    [],
  );
});

test("generated fixture planning rejects non-JSON entries without deleting them", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["learning-coach", "explicit", "Learning."],
  ]);
  const generatedRoot = path.join(repoRoot, "benchmarks", "generated", "activation-policy");
  const foreignPath = path.join(generatedRoot, "README.md");
  fs.writeFileSync(foreignPath, "FOREIGN\n", "utf8");

  assert.throws(
    () => buildActivationSyncPlan({ repoRoot, policy }),
    /accepts only JSON files/,
  );
  assert.equal(fs.readFileSync(foreignPath, "utf8"), "FOREIGN\n");
});

test("check mode reports sorted stale paths and performs no writes", () => {
  const { repoRoot } = makeFixtureRepo([
    ["zeta-skill", "auto", "Zeta restored."],
    ["alpha-skill", "auto", "Alpha restored."],
  ]);
  const paths = ["alpha-skill", "zeta-skill"].map((skillId) => (
    path.join(repoRoot, "skills", skillId, "SKILL.md")
  ));
  const before = paths.map((filePath) => fs.readFileSync(filePath, "utf8"));
  const errors = [];

  const exitCode = main(["--check"], {
    repoRoot,
    stderr: { write: (text) => errors.push(text) },
  });

  assert.equal(exitCode, 1);
  assert.deepEqual(paths.map((filePath) => fs.readFileSync(filePath, "utf8")), before);
  assert.equal(
    errors.join(""),
    `Activation policy is stale:\n${paths.map((filePath) => `- ${filePath}`).join("\n")}\n`,
  );
});

test("planning computes every output before the first target write", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["alpha-skill", "auto", "Alpha restored."],
    ["zeta-skill", "auto", "Zeta restored."],
  ]);
  const firstPath = path.join(repoRoot, "skills", "alpha-skill", "SKILL.md");
  const secondPath = path.join(repoRoot, "skills", "zeta-skill", "SKILL.md");
  const firstBefore = fs.readFileSync(firstPath, "utf8");
  fs.writeFileSync(secondPath, skillText().replace("<!-- activation-policy:guard:end -->", ""), "utf8");

  assert.throws(() => buildActivationSyncPlan({ repoRoot, policy }), /zeta-skill[\\/]SKILL\.md.*guard/);
  assert.equal(fs.readFileSync(firstPath, "utf8"), firstBefore);
});

test("apply detects a source race before replacing any planned target", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["alpha-skill", "auto", "Alpha restored."],
    ["zeta-skill", "auto", "Zeta restored."],
  ]);
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const alphaPath = path.join(repoRoot, "skills", "alpha-skill", "SKILL.md");
  const zetaPath = path.join(repoRoot, "skills", "zeta-skill", "SKILL.md");
  const alphaBefore = fs.readFileSync(alphaPath, "utf8");
  const raced = `${fs.readFileSync(zetaPath, "utf8")}Concurrent edit.\n`;
  fs.writeFileSync(zetaPath, raced, "utf8");

  assert.throws(() => applyActivationSyncPlan(plan), /changed after planning/);
  assert.equal(fs.readFileSync(alphaPath, "utf8"), alphaBefore);
  assert.equal(fs.readFileSync(zetaPath, "utf8"), raced);
});

test("apply rolls back every target when a prepared rename fails", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["alpha-skill", "auto", "Alpha restored."],
    ["zeta-skill", "auto", "Zeta restored."],
  ]);
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const before = new Map(plan.filter((item) => item.before !== null).map((item) => [
    item.path,
    fs.readFileSync(item.path, "utf8"),
  ]));
  let preparedRenameCount = 0;
  const fsWithInjectedFailure = Object.create(fs);
  fsWithInjectedFailure.renameSync = (source, target) => {
    if (source.includes(".activation-policy.tmp-")) {
      preparedRenameCount += 1;
      if (preparedRenameCount === 2) throw new Error("injected rename failure");
    }
    return fs.renameSync(source, target);
  };

  assert.throws(
    () => applyActivationSyncPlan(plan, { fsImpl: fsWithInjectedFailure }),
    /injected rename failure/,
  );
  for (const [filePath, contents] of before) {
    assert.equal(fs.readFileSync(filePath, "utf8"), contents, filePath);
  }
});

test("failed initial target move leaves the original target untouched", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const targetPath = path.join(repoRoot, "skills", "demo", "SKILL.md");
  const targetBefore = fs.readFileSync(targetPath, "utf8");
  let targetUnlinks = 0;
  let backupRestoreAttempts = 0;
  const fsWithInitialMoveFailure = Object.create(fs);
  fsWithInitialMoveFailure.renameSync = (source, target) => {
    if (source === targetPath) throw new Error("injected initial target move failure");
    if (source.includes(".activation-policy.bak-")) backupRestoreAttempts += 1;
    return fs.renameSync(source, target);
  };
  fsWithInitialMoveFailure.unlinkSync = (filePath) => {
    if (filePath === targetPath) targetUnlinks += 1;
    return fs.unlinkSync(filePath);
  };

  assert.throws(
    () => applyActivationSyncPlan(plan, { fsImpl: fsWithInitialMoveFailure }),
    /injected initial target move failure/,
  );
  assert.equal(fs.readFileSync(targetPath, "utf8"), targetBefore);
  assert.equal(targetUnlinks, 0);
  assert.equal(backupRestoreAttempts, 0);
});

test("rollback preserves a concurrent user edit and its original backup", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["alpha-skill", "auto", "Alpha restored."],
    ["zeta-skill", "auto", "Zeta restored."],
  ]);
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const alphaPath = path.join(repoRoot, "skills", "alpha-skill", "SKILL.md");
  const zetaPath = path.join(repoRoot, "skills", "zeta-skill", "SKILL.md");
  const alphaBefore = fs.readFileSync(alphaPath, "utf8");
  const zetaBefore = fs.readFileSync(zetaPath, "utf8");
  let preparedRenameCount = 0;
  const fsWithConcurrentEdit = Object.create(fs);
  fsWithConcurrentEdit.renameSync = (source, target) => {
    if (source.includes(".activation-policy.tmp-")) {
      preparedRenameCount += 1;
      if (preparedRenameCount === 2) {
        fs.writeFileSync(alphaPath, "USER-EDIT\n", "utf8");
        throw new Error("injected later-target failure");
      }
    }
    return fs.renameSync(source, target);
  };

  assert.throws(
    () => applyActivationSyncPlan(plan, { fsImpl: fsWithConcurrentEdit }),
    (error) => error.message.includes("rollback conflict")
      && error.message.includes(alphaPath)
      && error.message.includes(".activation-policy.bak-"),
  );
  assert.equal(fs.readFileSync(alphaPath, "utf8"), "USER-EDIT\n");
  assert.equal(fs.readFileSync(zetaPath, "utf8"), zetaBefore);
  const backupDirectories = fs.readdirSync(path.dirname(alphaPath), { withFileTypes: true })
    .filter((entry) => entry.isDirectory()
      && entry.name.startsWith(`${path.basename(alphaPath)}.activation-policy.bak-`));
  assert.equal(backupDirectories.length, 1);
  assert.equal(
    fs.readFileSync(path.join(path.dirname(alphaPath), backupDirectories[0].name, "original"), "utf8"),
    alphaBefore,
  );
});

test("exclusive backup directories never overwrite foreign backup-like paths", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const targetPath = path.join(repoRoot, "skills", "demo", "SKILL.md");
  const foreignDirectory = `${targetPath}.activation-policy.bak-FOREIGN`;
  const foreignPath = path.join(foreignDirectory, "original");
  fs.mkdirSync(foreignDirectory);
  fs.writeFileSync(foreignPath, "FOREIGN-BACKUP\n", "utf8");
  let exclusiveBackupAllocations = 0;
  const fsWithBackupAudit = Object.create(fs);
  fsWithBackupAudit.mkdtempSync = (prefix) => {
    exclusiveBackupAllocations += 1;
    return fs.mkdtempSync(prefix);
  };

  applyActivationSyncPlan(plan, { fsImpl: fsWithBackupAudit });

  assert.ok(exclusiveBackupAllocations > 0);
  assert.equal(fs.readFileSync(foreignPath, "utf8"), "FOREIGN-BACKUP\n");
});

test("apply validates initially-current plan entries before any replacement", () => {
  const { repoRoot } = makeFixtureRepo([
    ["alpha-skill", "auto", "Alpha restored."],
    ["zeta-skill", "auto", "Zeta restored."],
  ]);
  const autoPolicy = makePolicy([
    ["alpha-skill", "auto", "Alpha restored."],
    ["zeta-skill", "auto", "Zeta restored."],
  ]);
  applyActivationSyncPlan(buildActivationSyncPlan({ repoRoot, policy: autoPolicy }));

  const mixedPolicy = makePolicy([
    ["alpha-skill", "auto", "Alpha restored."],
    ["zeta-skill", "explicit", "Zeta restored."],
  ]);
  const plan = buildActivationSyncPlan({ repoRoot, policy: mixedPolicy });
  const alphaItem = plan.find((item) => item.path.includes(`${path.sep}alpha-skill${path.sep}`));
  const zetaPath = path.join(repoRoot, "skills", "zeta-skill", "SKILL.md");
  const zetaBefore = fs.readFileSync(zetaPath, "utf8");
  assert.equal(alphaItem.before, alphaItem.after);
  fs.writeFileSync(alphaItem.path, `${alphaItem.before}USER-RACE\n`, "utf8");

  assert.throws(() => applyActivationSyncPlan(plan), /alpha-skill.*changed after planning/);
  assert.equal(fs.readFileSync(zetaPath, "utf8"), zetaBefore);
});

test("failed exclusive temp open preserves a raced foreign file", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const targetPath = path.join(repoRoot, "skills", "demo", "SKILL.md");
  const targetBefore = fs.readFileSync(targetPath, "utf8");
  let racedTempPath;
  const fsWithTempRace = Object.create(fs);
  fsWithTempRace.openSync = (filePath, flags, ...rest) => {
    if (flags === "wx" && racedTempPath === undefined) {
      racedTempPath = filePath;
      fs.writeFileSync(filePath, "FOREIGN-TEMP\n", "utf8");
    }
    return fs.openSync(filePath, flags, ...rest);
  };

  assert.throws(
    () => applyActivationSyncPlan(plan, { fsImpl: fsWithTempRace }),
    (error) => error.code === "EEXIST",
  );
  assert.equal(fs.readFileSync(racedTempPath, "utf8"), "FOREIGN-TEMP\n");
  assert.equal(fs.readFileSync(targetPath, "utf8"), targetBefore);
});

test("owned temp cleanup failures are surfaced as cleanup warnings", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  let ownedTempPath;
  const fsWithTempCleanupFailure = Object.create(fs);
  fsWithTempCleanupFailure.openSync = (filePath, flags, ...rest) => {
    const descriptor = fs.openSync(filePath, flags, ...rest);
    if (flags === "wx") ownedTempPath = filePath;
    return descriptor;
  };
  fsWithTempCleanupFailure.writeFileSync = (target, contents, encoding) => {
    if (typeof target === "number") throw new Error("injected temp write failure");
    return fs.writeFileSync(target, contents, encoding);
  };
  fsWithTempCleanupFailure.unlinkSync = (filePath) => {
    if (filePath === ownedTempPath) {
      const error = new Error("injected owned temp cleanup failure");
      error.code = "EACCES";
      throw error;
    }
    return fs.unlinkSync(filePath);
  };

  assert.throws(
    () => applyActivationSyncPlan(plan, { fsImpl: fsWithTempCleanupFailure }),
    (error) => error.message.includes("injected temp write failure")
      && error.cleanupWarnings?.length === 1
      && error.cleanupWarnings[0].tempPath === ownedTempPath
      && error.cleanupWarnings[0].message.includes("injected owned temp cleanup failure"),
  );
  assert.equal(fs.existsSync(ownedTempPath), true);
});

test("create and delete ownership is bound to the plan repository root", () => {
  const { repoRoot, policy } = makeFixtureRepo([["explicit-skill", "explicit", "Explicit."]]);
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-policy-outside-"));
  tempRoots.push(outsideRoot);
  const outsideGenerated = path.join(outsideRoot, "benchmarks", "generated", "activation-policy");
  fs.mkdirSync(outsideGenerated, { recursive: true });
  const outsidePath = path.join(outsideGenerated, "outside.json");
  fs.writeFileSync(outsidePath, "OUTSIDE\n", "utf8");
  plan.push({ path: outsidePath, before: "OUTSIDE\n", after: null });

  assert.deepEqual(Object.keys(plan[0]).sort(), ["after", "before", "path"]);
  assert.throws(() => applyActivationSyncPlan(plan), /trusted repository generated fixture root/);
  assert.equal(fs.readFileSync(outsidePath, "utf8"), "OUTSIDE\n");

  const insideCreate = path.join(
    repoRoot,
    "benchmarks",
    "generated",
    "activation-policy",
    "manual.json",
  );
  assert.throws(
    () => applyActivationSyncPlan([{ path: insideCreate, before: null, after: "{}\n" }]),
    /trusted repository generated fixture root/,
  );
  assert.equal(fs.existsSync(insideCreate), false);
});

test("POSIX generated-root ownership comparison is case-sensitive", {
  skip: process.platform === "win32",
}, () => {
  const { repoRoot, policy } = makeFixtureRepo([["explicit-skill", "explicit", "Explicit."]]);
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const generatedItem = plan.find((item) => item.before === null);
  plan.push({ ...generatedItem, path: generatedItem.path.replace("benchmarks", "BENCHMARKS") });
  assert.throws(() => applyActivationSyncPlan(plan), /trusted repository generated fixture root/);
});

test("backup cleanup failure returns a truthful warning after successful commit", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const targetPath = path.join(repoRoot, "skills", "demo", "SKILL.md");
  const expected = plan.find((item) => item.path === targetPath).after;
  const fsWithCleanupFailure = Object.create(fs);
  fsWithCleanupFailure.unlinkSync = (filePath) => {
    if (filePath.includes(".activation-policy.bak-")) {
      const error = new Error("injected backup cleanup failure");
      error.code = "EACCES";
      throw error;
    }
    return fs.unlinkSync(filePath);
  };

  const applied = applyActivationSyncPlan(plan, { fsImpl: fsWithCleanupFailure });

  assert.deepEqual([...applied], checkActivationSyncPlan(plan));
  assert.equal(fs.readFileSync(targetPath, "utf8"), expected);
  assert.equal(applied.cleanupWarnings.length, 1);
  assert.match(applied.cleanupWarnings[0].message, /injected backup cleanup failure/);
  assert.equal(fs.existsSync(applied.cleanupWarnings[0].backupPath), true);
});

test("CLI reports cleanup warnings while returning successful apply status", () => {
  const { repoRoot } = makeFixtureRepo();
  const targetPath = path.join(repoRoot, "skills", "demo", "SKILL.md");
  const stderr = [];
  const fsWithCleanupFailure = Object.create(fs);
  fsWithCleanupFailure.unlinkSync = (filePath) => {
    if (filePath.includes(".activation-policy.bak-")) {
      const error = new Error("injected CLI backup cleanup failure");
      error.code = "EACCES";
      throw error;
    }
    return fs.unlinkSync(filePath);
  };

  const exitCode = main([], {
    repoRoot,
    stderr: { write: (text) => stderr.push(text) },
    fsImpl: fsWithCleanupFailure,
  });

  assert.equal(exitCode, 0);
  assert.match(stderr.join(""), /cleanup warning.*retained backup.*injected CLI backup cleanup failure/i);
  assert.match(fs.readFileSync(targetPath, "utf8"), /Use automatically for demos\./);
});

test("generated fixture creates and deletions stay inside the exact owned directory", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["explicit-skill", "explicit", "Explicit."],
    ["auto-skill", "auto", "Auto."],
  ]);
  const generatedRoot = path.join(repoRoot, "benchmarks", "generated", "activation-policy");
  const stalePath = path.join(generatedRoot, "stale.json");
  const siblingPath = path.join(repoRoot, "benchmarks", "generated", "outside.json");
  fs.writeFileSync(stalePath, "{}\n", "utf8");
  fs.writeFileSync(siblingPath, "{}\n", "utf8");

  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const createPath = path.join(generatedRoot, "explicit-skill-explicit.json");
  assert.deepEqual(
    plan.filter((item) => item.before === null || item.after === null).map((item) => item.path).sort(),
    [createPath, stalePath].sort(),
  );
  applyActivationSyncPlan(plan);
  assert.equal(fs.existsSync(createPath), true);
  assert.equal(fs.existsSync(stalePath), false);
  assert.equal(fs.readFileSync(siblingPath, "utf8"), "{}\n");

  assert.throws(
    () => applyActivationSyncPlan([{ path: siblingPath, before: "{}\n", after: null }]),
    /generated activation fixture directory/,
  );
  assert.equal(fs.readFileSync(siblingPath, "utf8"), "{}\n");
});

test("auto to explicit to auto restores bytes and a second sync is idempotent", () => {
  const autoDescription = "Exact original automatic description.";
  const { repoRoot } = makeFixtureRepo([["demo", "auto", autoDescription]]);
  const skillPath = path.join(repoRoot, "skills", "demo", "SKILL.md");

  const autoPolicy = makePolicy([["demo", "auto", autoDescription]]);
  applyActivationSyncPlan(buildActivationSyncPlan({ repoRoot, policy: autoPolicy }));
  const originalAutoBytes = fs.readFileSync(skillPath);

  const explicitPolicy = makePolicy([["demo", "explicit", autoDescription]]);
  applyActivationSyncPlan(buildActivationSyncPlan({ repoRoot, policy: explicitPolicy }));
  assert.notDeepEqual(fs.readFileSync(skillPath), originalAutoBytes);

  applyActivationSyncPlan(buildActivationSyncPlan({ repoRoot, policy: autoPolicy }));
  assert.deepEqual(fs.readFileSync(skillPath), originalAutoBytes);

  const secondPlan = buildActivationSyncPlan({ repoRoot, policy: autoPolicy });
  assert.deepEqual(checkActivationSyncPlan(secondPlan), []);
  applyActivationSyncPlan(secondPlan);
  assert.deepEqual(fs.readFileSync(skillPath), originalAutoBytes);
});

test("CLI accepts only --check and --help", () => {
  const { repoRoot } = makeFixtureRepo();
  const output = [];
  assert.equal(main(["--help"], { repoRoot, stdout: { write: (text) => output.push(text) } }), 0);
  assert.match(output.join(""), /--check/);
  assert.throws(() => main(["--write"], { repoRoot }), /Unknown option: --write/);
});
