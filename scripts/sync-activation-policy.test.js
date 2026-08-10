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

function withEol(text, eol) {
  return text.replace(/\r\n?|\n/g, "\n").replace(/\n/g, eol);
}

function readmeText(policy, locale = "en", eol = "\n") {
  return [
    locale === "zh" ? "# Thinking Skills 中文" : "# Thinking Skills",
    "",
    "Authored explanation.",
    "",
    "<!-- activation-policy:readme-table:start -->",
    withEol(renderReadmeActivationTable(policy, locale), eol),
    "<!-- activation-policy:readme-table:end -->",
    "",
    "More authored explanation.",
    "",
  ].join(eol);
}

function legacyMixedReadmeText(policy, locale = "en") {
  const text = readmeText(policy, locale, "\r\n");
  const start = "<!-- activation-policy:readme-table:start -->";
  const end = "<!-- activation-policy:readme-table:end -->";
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end, startIndex) + end.length;
  return `${text.slice(0, startIndex)}${withEol(text.slice(startIndex, endIndex), "\n")}${text.slice(endIndex)}`;
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
  fs.writeFileSync(path.join(repoRoot, "README.md"), readmeText(policy, "en"), "utf8");
  fs.writeFileSync(path.join(repoRoot, "README.zh.md"), readmeText(policy, "zh"), "utf8");

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

function extractOwnedRegionBody(text, startMarker, endMarker, filePath) {
  const startIndex = text.indexOf(startMarker);
  assert.notEqual(startIndex, -1, `${filePath}: missing start marker`);
  const endIndex = text.indexOf(endMarker, startIndex + startMarker.length);
  assert.notEqual(endIndex, -1, `${filePath}: missing end marker`);
  const ownedText = text.slice(startIndex + startMarker.length, endIndex);
  const leadingBoundary = /^(\r\n|\n)/.exec(ownedText)?.[0];
  const trailingBoundary = /(\r\n|\n)$/.exec(ownedText)?.[0];
  assert.ok(leadingBoundary, `${filePath}: missing leading marker boundary`);
  assert.ok(trailingBoundary, `${filePath}: missing trailing marker boundary`);
  return ownedText.slice(leadingBoundary.length, -trailingBoundary.length);
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

test("checked-in README activation tables exactly match all manifest Skills", () => {
  const repoRoot = path.resolve(__dirname, "..");
  const policy = loadActivationPolicy({ repoRoot });
  const readmes = [
    ["README.md", "en"],
    ["README.zh.md", "zh"],
  ];

  for (const [relativePath, locale] of readmes) {
    const filePath = path.join(repoRoot, relativePath);
    const contents = fs.readFileSync(filePath, "utf8");
    const start = "<!-- activation-policy:readme-table:start -->";
    const end = "<!-- activation-policy:readme-table:end -->";
    assert.equal(countExactLines(contents, start), 1, `${relativePath}: start marker`);
    assert.equal(countExactLines(contents, end), 1, `${relativePath}: end marker`);

    const generated = extractOwnedRegionBody(contents, start, end, relativePath);
    assert.equal(withEol(generated, "\n"), renderReadmeActivationTable(policy, locale), relativePath);

    const authored = contents.replace(
      /<!-- activation-policy:readme-table:start -->[\s\S]*?<!-- activation-policy:readme-table:end -->/,
      "<!-- generated activation table -->",
    );
    for (const skillId of Object.keys(policy.skills)) {
      assert.doesNotMatch(
        authored,
        new RegExp("^\\| `" + skillId + "` \\|", "m"),
        `${relativePath}: ${skillId} activation row must be generated`,
      );
    }
  }
});

test("uniform-CRLF README fixtures are current and idempotent", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  applyActivationSyncPlan(buildActivationSyncPlan({ repoRoot, policy }));
  const readmes = [
    ["README.md", "en"],
    ["README.zh.md", "zh"],
  ];
  const before = new Map();
  for (const [relativePath, locale] of readmes) {
    const filePath = path.join(repoRoot, relativePath);
    const contents = readmeText(policy, locale, "\r\n");
    fs.writeFileSync(filePath, contents, "utf8");
    before.set(filePath, contents);
  }

  const plan = buildActivationSyncPlan({ repoRoot, policy });
  assert.deepEqual(checkActivationSyncPlan(plan), []);
  assert.equal(main(["--check"], { repoRoot }), 0);
  assert.deepEqual(applyActivationSyncPlan(plan), []);
  for (const [filePath, contents] of before) {
    assert.equal(fs.readFileSync(filePath, "utf8"), contents, filePath);
  }
  assert.deepEqual(
    checkActivationSyncPlan(buildActivationSyncPlan({ repoRoot, policy })),
    [],
  );
});

test("legacy mixed-EOL README regions remain current and preserve every byte", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  applyActivationSyncPlan(buildActivationSyncPlan({ repoRoot, policy }));
  const readmes = [
    ["README.md", "en"],
    ["README.zh.md", "zh"],
  ];
  const before = new Map();
  for (const [relativePath, locale] of readmes) {
    const filePath = path.join(repoRoot, relativePath);
    const contents = legacyMixedReadmeText(policy, locale);
    fs.writeFileSync(filePath, contents, "utf8");
    before.set(filePath, contents);
  }

  const plan = buildActivationSyncPlan({ repoRoot, policy });
  assert.deepEqual(checkActivationSyncPlan(plan), []);
  assert.equal(main(["--check"], { repoRoot }), 0);
  assert.deepEqual(applyActivationSyncPlan(plan), []);
  for (const [filePath, contents] of before) {
    assert.equal(fs.readFileSync(filePath, "utf8"), contents, filePath);
  }
  assert.deepEqual(
    checkActivationSyncPlan(buildActivationSyncPlan({ repoRoot, policy })),
    [],
  );
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
    crlfBefore.replace("Old generated guard.", "Generated A.\r\nGenerated B."),
  );

  const legacyMixedBefore = crlfBefore.replace(
    "Old generated guard.",
    "Old generated\nlegacy guard.",
  );
  const legacyMixedAfter = replaceOwnedRegion(
    legacyMixedBefore,
    "guard",
    "Generated A.\nGenerated B.",
    filePath,
  );
  assert.equal(
    legacyMixedAfter,
    legacyMixedBefore.replace("Old generated\nlegacy guard.", "Generated A.\r\nGenerated B."),
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

test("renderers snapshot all activation modes and manifest-ordered EN/ZH tables", () => {
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
      "| Skill | Activation mode | Behavior |",
      "|---|---|---|",
      "| `zeta-skill` | `disabled` | Unavailable; platform enforcement is required. |",
      "| `alpha-skill` | `auto` | Eligible for intent-based selection. |",
      "| `middle-skill` | `explicit` | Requires exact invocation in the current user request. |",
    ].join("\n"),
  );
  assert.equal(
    renderReadmeActivationTable(policy, "zh"),
    [
      "Generated from config/activation-policy.yaml. Do not edit this block.",
      "",
      "| Skill | 激活模式 | 行为 |",
      "|---|---|---|",
      "| `zeta-skill` | `关闭` | 不可用；需要平台强制执行。 |",
      "| `alpha-skill` | `自动` | 可根据请求意图选择。 |",
      "| `middle-skill` | `显式调用` | 需要在当前用户请求中精确调用。 |",
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

test("planning rejects a generated fixture root that is a junction or directory symlink", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["learning-coach", "explicit", "Learning."],
  ]);
  const generatedRoot = path.join(repoRoot, "benchmarks", "generated", "activation-policy");
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-policy-outside-"));
  tempRoots.push(outsideRoot);
  const outsidePath = path.join(outsideRoot, "stale.json");
  fs.writeFileSync(outsidePath, "OUTSIDE\n", "utf8");
  fs.rmSync(generatedRoot, { recursive: true });
  fs.symlinkSync(outsideRoot, generatedRoot, process.platform === "win32" ? "junction" : "dir");

  assert.throws(
    () => buildActivationSyncPlan({ repoRoot, policy }),
    /symbolic link|junction|reparse point/,
  );
  assert.equal(fs.readFileSync(outsidePath, "utf8"), "OUTSIDE\n");
});

test("apply rejects a generated fixture root replaced by a junction before touching outside JSON", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["learning-coach", "explicit", "Learning."],
  ]);
  const generatedRoot = path.join(repoRoot, "benchmarks", "generated", "activation-policy");
  const stalePath = path.join(generatedRoot, "stale.json");
  fs.writeFileSync(stalePath, "STALE\n", "utf8");
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const savedRoot = `${generatedRoot}-saved`;
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-policy-outside-"));
  tempRoots.push(outsideRoot);
  const outsideStale = path.join(outsideRoot, "stale.json");
  fs.writeFileSync(outsideStale, "STALE\n", "utf8");
  fs.renameSync(generatedRoot, savedRoot);
  fs.symlinkSync(outsideRoot, generatedRoot, process.platform === "win32" ? "junction" : "dir");

  try {
    assert.throws(
      () => applyActivationSyncPlan(plan),
      /symbolic link|junction|reparse point/,
    );
    assert.equal(fs.readFileSync(outsideStale, "utf8"), "STALE\n");
    assert.deepEqual(fs.readdirSync(outsideRoot), ["stale.json"]);
  } finally {
    fs.rmSync(generatedRoot, { force: true });
    fs.renameSync(savedRoot, generatedRoot);
  }
});

test("POSIX apply rejects a generated JSON target replaced by a symlink", {
  skip: process.platform === "win32",
}, () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const generatedRoot = path.join(repoRoot, "benchmarks", "generated", "activation-policy");
  const stalePath = path.join(generatedRoot, "stale.json");
  fs.writeFileSync(stalePath, "STALE\n", "utf8");
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-policy-outside-"));
  tempRoots.push(outsideRoot);
  const outsidePath = path.join(outsideRoot, "outside.json");
  fs.writeFileSync(outsidePath, "STALE\n", "utf8");
  fs.unlinkSync(stalePath);
  fs.symlinkSync(outsidePath, stalePath, "file");

  assert.throws(() => applyActivationSyncPlan(plan), /symbolic link|reparse point/);
  assert.equal(fs.readFileSync(outsidePath, "utf8"), "STALE\n");
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

test("apply rejects a same-content target replacement with a different file identity", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["alpha-skill", "auto", "Alpha restored."],
    ["zeta-skill", "auto", "Zeta restored."],
  ]);
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const alphaPath = path.join(repoRoot, "skills", "alpha-skill", "SKILL.md");
  const zetaPath = path.join(repoRoot, "skills", "zeta-skill", "SKILL.md");
  const alphaBefore = fs.readFileSync(alphaPath, "utf8");
  const zetaBefore = fs.readFileSync(zetaPath, "utf8");
  const displacedPath = `${zetaPath}.displaced`;
  fs.renameSync(zetaPath, displacedPath);
  fs.writeFileSync(zetaPath, zetaBefore, "utf8");

  assert.throws(() => applyActivationSyncPlan(plan), /file identity changed after planning/);
  assert.equal(fs.readFileSync(alphaPath, "utf8"), alphaBefore);
  assert.equal(fs.readFileSync(zetaPath, "utf8"), zetaBefore);
  assert.equal(fs.readFileSync(displacedPath, "utf8"), zetaBefore);
});

test("exclusive install preserves a concurrently recreated target and the original artifact", () => {
  const { repoRoot, policy } = makeFixtureRepo([
    ["alpha-skill", "auto", "Alpha restored."],
    ["zeta-skill", "auto", "Zeta restored."],
  ]);
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const alphaPath = path.join(repoRoot, "skills", "alpha-skill", "SKILL.md");
  const zetaPath = path.join(repoRoot, "skills", "zeta-skill", "SKILL.md");
  const alphaBefore = fs.readFileSync(alphaPath, "utf8");
  const zetaBefore = fs.readFileSync(zetaPath, "utf8");
  const concurrent = "CONCURRENT-TARGET\n";
  const fsWithTargetRecreation = Object.create(fs);
  fsWithTargetRecreation.renameSync = (source, target) => {
    const result = fs.renameSync(source, target);
    if (source === zetaPath) {
      fs.writeFileSync(zetaPath, concurrent, "utf8");
    }
    return result;
  };

  let error;
  try {
    applyActivationSyncPlan(plan, { fsImpl: fsWithTargetRecreation });
  } catch (caught) {
    error = caught;
  }
  assert.ok(error);
  assert.match(error.message, /EEXIST/);
  assert.match(error.message, /rollback conflict/);
  assert.equal(fs.readFileSync(alphaPath, "utf8"), alphaBefore);
  assert.equal(fs.readFileSync(zetaPath, "utf8"), concurrent);
  const recoveryPath = error.recoveryPaths.find((candidate) => (
    path.basename(candidate).includes("skills_zeta-skill_SKILL.md-original-recovery")
  ));
  assert.ok(recoveryPath);
  assert.equal(fs.readFileSync(recoveryPath, "utf8"), zetaBefore);
});

test("the final target-removal syscall cannot delete a concurrently swapped inode", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const targetPath = path.join(repoRoot, "skills", "demo", "SKILL.md");
  const displacedPath = `${targetPath}.authorized-displaced`;
  const concurrent = "CONCURRENT-FINAL-SYSCALL\n";
  let swapped = false;
  const fsWithFinalTargetSwap = Object.create(fs);
  const swapTarget = () => {
    if (swapped) return;
    fs.renameSync(targetPath, displacedPath);
    fs.writeFileSync(targetPath, concurrent, "utf8");
    swapped = true;
  };
  fsWithFinalTargetSwap.unlinkSync = (filePath) => {
    if (filePath === targetPath) swapTarget();
    return fs.unlinkSync(filePath);
  };
  fsWithFinalTargetSwap.renameSync = (source, target) => {
    if (source === targetPath) swapTarget();
    return fs.renameSync(source, target);
  };

  assert.throws(
    () => applyActivationSyncPlan(plan, { fsImpl: fsWithFinalTargetSwap }),
    /moved file identity|transaction recovery identity/,
  );
  assert.equal(swapped, true);
  assert.equal(fs.readFileSync(targetPath, "utf8"), concurrent);
  assert.equal(fs.existsSync(displacedPath), true);
});

test("a swapped recovery publication source fails closed on its planned file identity", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const targetPath = path.join(repoRoot, "skills", "demo", "SKILL.md");
  let swappedRecoveryPath;
  let displacedRecoveryPath;
  const fsWithRecoverySourceSwap = Object.create(fs);
  fsWithRecoverySourceSwap.linkSync = (source, target) => {
    const result = fs.linkSync(source, target);
    if (swappedRecoveryPath === undefined
      && source.includes(".activation-policy.bak-")
      && target.includes(`${path.sep}activation-policy-recovery${path.sep}`)) {
      swappedRecoveryPath = target;
      displacedRecoveryPath = `${target}.authorized-displaced`;
      const contents = fs.readFileSync(target, "utf8");
      fs.renameSync(target, displacedRecoveryPath);
      fs.writeFileSync(target, contents, "utf8");
    }
    return result;
  };
  fsWithRecoverySourceSwap.renameSync = (source, target) => {
    const result = fs.renameSync(source, target);
    if (source === targetPath && swappedRecoveryPath === undefined) {
      swappedRecoveryPath = target;
      displacedRecoveryPath = `${target}.authorized-displaced`;
      const contents = fs.readFileSync(target, "utf8");
      fs.renameSync(target, displacedRecoveryPath);
      fs.writeFileSync(target, contents, "utf8");
    }
    return result;
  };

  assert.throws(
    () => applyActivationSyncPlan(plan, { fsImpl: fsWithRecoverySourceSwap }),
    /moved file identity|transaction recovery identity/,
  );
  assert.ok(swappedRecoveryPath);
  assert.equal(fs.existsSync(swappedRecoveryPath), true);
  assert.equal(fs.existsSync(displacedRecoveryPath), true);
});

for (const { lateWritePhase, expectFailure } of [
  { lateWritePhase: "before install", expectFailure: true },
  { lateWritePhase: "after successful install and cleanup", expectFailure: false },
]) {
  test(`${expectFailure ? "failed" : "successful"} apply retains a named recovery path for an old-inode write ${lateWritePhase}`, () => {
    const { repoRoot, policy } = makeFixtureRepo();
    const plan = buildActivationSyncPlan({ repoRoot, policy });
    const targetPath = path.join(repoRoot, "skills", "demo", "SKILL.md");
    const before = fs.readFileSync(targetPath, "utf8");
    const descriptor = fs.openSync(targetPath, "r+");
    const lateWrite = `LATE OLD INODE WRITE ${lateWritePhase}\n`;
    let wrote = false;
    const writeThroughOldDescriptor = () => {
      if (wrote) return;
      fs.writeSync(descriptor, lateWrite, fs.fstatSync(descriptor).size, "utf8");
      wrote = true;
    };
    const fsWithLateWrite = Object.create(fs);
    fsWithLateWrite.renameSync = (source, target) => {
      const result = fs.renameSync(source, target);
      if (lateWritePhase === "before install"
        && source === targetPath) {
        writeThroughOldDescriptor();
      }
      return result;
    };

    let outcome;
    try {
      try {
        outcome = applyActivationSyncPlan(plan, { fsImpl: fsWithLateWrite });
      } catch (error) {
        if (!expectFailure) throw error;
        outcome = error;
      }
      if (lateWritePhase === "after successful install and cleanup") {
        writeThroughOldDescriptor();
      }
    } finally {
      fs.closeSync(descriptor);
    }

    assert.equal(wrote, true);
    if (expectFailure) {
      assert.match(outcome.message, /moved file content changed after planning/);
    }
    const recoveryPath = outcome.recoveryPaths.find((candidate) => (
      path.basename(candidate).includes("skills_demo_SKILL.md-original-recovery")
    ));
    assert.ok(recoveryPath);
    assert.equal(path.basename(path.dirname(recoveryPath)).startsWith("transaction-"), true);
    assert.equal(fs.readFileSync(recoveryPath, "utf8"), `${before}${lateWrite}`);
  });
}

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
  fsWithInjectedFailure.linkSync = (source, target) => {
    if (source.includes("prepared")) {
      preparedRenameCount += 1;
      if (preparedRenameCount === 2) throw new Error("injected rename failure");
    }
    return fs.linkSync(source, target);
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
  fsWithConcurrentEdit.linkSync = (source, target) => {
    if (source.includes("prepared")) {
      preparedRenameCount += 1;
      if (preparedRenameCount === 2) {
        fs.writeFileSync(alphaPath, "USER-EDIT\n", "utf8");
        throw new Error("injected later-target failure");
      }
    }
    return fs.linkSync(source, target);
  };

  assert.throws(
    () => applyActivationSyncPlan(plan, { fsImpl: fsWithConcurrentEdit }),
    (error) => error.message.includes("rollback failed")
      && error.message.includes("unexpected concurrent target")
      && error.message.includes(alphaPath)
      && error.recoveryPaths.some((candidate) => candidate.includes("alpha-skill")),
  );
  assert.equal(fs.readFileSync(alphaPath, "utf8"), "USER-EDIT\n");
  assert.equal(fs.readFileSync(zetaPath, "utf8"), zetaBefore);
  const recoveryDirectories = fs.readdirSync(
    path.join(repoRoot, ".superpowers", "sdd", "activation-policy-recovery"),
    { withFileTypes: true },
  ).filter((entry) => entry.isDirectory() && entry.name.startsWith("transaction-"));
  assert.ok(recoveryDirectories.length > 0);
  const recoveryFiles = recoveryDirectories.flatMap((entry) => (
    fs.readdirSync(path.join(repoRoot, ".superpowers", "sdd", "activation-policy-recovery", entry.name))
      .filter((name) => name.includes("alpha-skill") && name.endsWith("original-recovery"))
      .map((name) => path.join(
        repoRoot,
        ".superpowers",
        "sdd",
        "activation-policy-recovery",
        entry.name,
        name,
      ))
  ));
  assert.equal(recoveryFiles.some((filePath) => fs.readFileSync(filePath, "utf8") === alphaBefore), true);
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

test("owned prepared write failures retain the named artifact without cleanup", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  let ownedTempPath;
  let preparedDescriptor;
  let unlinks = 0;
  const fsWithTempCleanupFailure = Object.create(fs);
  fsWithTempCleanupFailure.openSync = (filePath, flags, ...rest) => {
    const descriptor = fs.openSync(filePath, flags, ...rest);
    if (flags === "wx" && filePath.includes("prepared")) {
      ownedTempPath = filePath;
      preparedDescriptor = descriptor;
    }
    return descriptor;
  };
  fsWithTempCleanupFailure.writeFileSync = (target, contents, encoding) => {
    if (target === preparedDescriptor) throw new Error("injected temp write failure");
    return fs.writeFileSync(target, contents, encoding);
  };
  fsWithTempCleanupFailure.unlinkSync = (filePath) => {
    unlinks += 1;
    return fs.unlinkSync(filePath);
  };

  assert.throws(
    () => applyActivationSyncPlan(plan, { fsImpl: fsWithTempCleanupFailure }),
    (error) => error.message.includes("injected temp write failure")
      && error.artifactPaths.includes(ownedTempPath),
  );
  assert.equal(unlinks, 0);
  assert.equal(fs.existsSync(ownedTempPath), true);
});

test("successful transactions retain every private artifact without unlink or rmdir cleanup", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  let unlinks = 0;
  let directoryRemovals = 0;
  const fsWithCleanupAudit = Object.create(fs);
  fsWithCleanupAudit.unlinkSync = (filePath) => {
    unlinks += 1;
    return fs.unlinkSync(filePath);
  };
  fsWithCleanupAudit.rmdirSync = (directory) => {
    directoryRemovals += 1;
    return fs.rmdirSync(directory);
  };

  const applied = applyActivationSyncPlan(plan, { fsImpl: fsWithCleanupAudit });

  assert.equal(unlinks, 0);
  assert.equal(directoryRemovals, 0);
  assert.ok(applied.artifactPaths.length > applied.recoveryPaths.length);
  for (const artifactPath of applied.artifactPaths) {
    assert.equal(fs.existsSync(artifactPath), true, artifactPath);
  }
});

test("failed transactions retain prepared data and private directories as named artifacts", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  let unlinks = 0;
  let directoryRemovals = 0;
  const fsWithInstallFailure = Object.create(fs);
  fsWithInstallFailure.unlinkSync = (filePath) => {
    unlinks += 1;
    return fs.unlinkSync(filePath);
  };
  fsWithInstallFailure.rmdirSync = (directory) => {
    directoryRemovals += 1;
    return fs.rmdirSync(directory);
  };
  fsWithInstallFailure.linkSync = (source, target) => {
    if (source.includes(".activation-policy.tmp-") || source.includes("prepared")) {
      throw new Error("injected persistent-artifact install failure");
    }
    return fs.linkSync(source, target);
  };

  let error;
  try {
    applyActivationSyncPlan(plan, { fsImpl: fsWithInstallFailure });
  } catch (caught) {
    error = caught;
  }

  assert.ok(error);
  assert.match(error.message, /persistent-artifact install failure/);
  assert.equal(unlinks, 0);
  assert.equal(directoryRemovals, 0);
  assert.ok(error.artifactPaths.some((artifactPath) => /prepared/.test(artifactPath)));
  for (const artifactPath of error.artifactPaths) {
    assert.equal(fs.existsSync(artifactPath), true, artifactPath);
  }
});

test("a repository-owned global sync lock rejects a second apply before target writes", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const targetPath = path.join(repoRoot, "skills", "demo", "SKILL.md");
  const targetBefore = fs.readFileSync(targetPath, "utf8");
  const lockPath = path.join(repoRoot, ".superpowers", "sdd", "activation-policy-sync.lock");
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, "OTHER-SYNC\n", "utf8");

  assert.throws(
    () => applyActivationSyncPlan(plan),
    (error) => error.code === "EEXIST" && /global activation sync lock/.test(error.message),
  );
  assert.equal(fs.readFileSync(targetPath, "utf8"), targetBefore);
  assert.equal(fs.readFileSync(lockPath, "utf8"), "OTHER-SYNC\n");
});

test("a final lock-release swap preserves both lock inodes and reports manual recovery", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const lockPath = path.join(repoRoot, ".superpowers", "sdd", "activation-policy-sync.lock");
  const displacedLockPath = path.join(repoRoot, ".superpowers", "sdd", "owned-lock-displaced");
  const foreignLock = "CONCURRENT FOREIGN LOCK\n";
  let lockReleaseSwapped = false;
  let unlinks = 0;
  const fsWithLockReleaseSwap = Object.create(fs);
  fsWithLockReleaseSwap.unlinkSync = (filePath) => {
    unlinks += 1;
    return fs.unlinkSync(filePath);
  };
  fsWithLockReleaseSwap.renameSync = (source, target) => {
    if (!lockReleaseSwapped && source === lockPath) {
      lockReleaseSwapped = true;
      fs.renameSync(source, displacedLockPath);
      fs.writeFileSync(source, foreignLock, "utf8");
    }
    return fs.renameSync(source, target);
  };

  const applied = applyActivationSyncPlan(plan, { fsImpl: fsWithLockReleaseSwap });

  assert.equal(lockReleaseSwapped, true);
  assert.equal(unlinks, 0);
  assert.equal(fs.existsSync(displacedLockPath), true);
  const warning = applied.cleanupWarnings.find(({ kind }) => kind === "lock-release");
  assert.ok(warning);
  assert.match(warning.message, /identity changed|manual recovery/);
  assert.ok(warning.releasePath);
  assert.equal(fs.readFileSync(warning.releasePath, "utf8"), foreignLock);
  assert.equal(applied.artifactPaths.includes(warning.releasePath), true);
});

test("failed lock-release artifact allocation retains a named stale lock and the primary failure", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const lockPath = path.join(repoRoot, ".superpowers", "sdd", "activation-policy-sync.lock");
  const fsWithUnavailableArtifactDirectories = Object.create(fs);
  fsWithUnavailableArtifactDirectories.mkdtempSync = (prefix) => {
    if (prefix.includes("activation-policy-recovery")) {
      throw new Error("injected transaction directory failure");
    }
    if (prefix.includes("activation-policy-lock-release")) {
      throw new Error("injected lock-release directory failure");
    }
    return fs.mkdtempSync(prefix);
  };

  let error;
  try {
    applyActivationSyncPlan(plan, { fsImpl: fsWithUnavailableArtifactDirectories });
  } catch (caught) {
    error = caught;
  }

  assert.ok(error);
  assert.match(error.message, /injected transaction directory failure/);
  assert.equal(fs.existsSync(lockPath), true);
  assert.equal(error.artifactPaths.includes(lockPath), true);
  const warning = error.cleanupWarnings.find(({ kind }) => kind === "lock-release");
  assert.ok(warning);
  assert.match(warning.message, /lock-release directory failure/);
  assert.equal(warning.releasePath, null);
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

  assert.deepEqual(Object.keys(plan[0]).sort(), ["after", "before", "path"]);
  assert.throws(
    () => plan.push({ path: outsidePath, before: "OUTSIDE\n", after: null }),
    /object is not extensible|read only|frozen/i,
  );
  assert.throws(
    () => applyActivationSyncPlan([{ path: outsidePath, before: "OUTSIDE\n", after: null }]),
    /trusted repository generated fixture root/,
  );
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

test("built plans are immutable and cannot be extended with an external replacement", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-policy-outside-"));
  tempRoots.push(outsideRoot);
  const outsidePath = path.join(outsideRoot, "outside.md");
  fs.writeFileSync(outsidePath, "OUTSIDE\n", "utf8");
  const injected = { path: outsidePath, before: "OUTSIDE\n", after: "OVERWRITTEN\n" };

  let mutationError;
  try {
    plan.push(injected);
  } catch (error) {
    mutationError = error;
  }
  if (!mutationError) {
    assert.throws(() => applyActivationSyncPlan(plan), /authorized activation sync target/);
  }

  assert.equal(Object.isFrozen(plan), true);
  assert.equal(plan.every(Object.isFrozen), true);
  assert.equal(fs.readFileSync(outsidePath, "utf8"), "OUTSIDE\n");
  assert.throws(
    () => applyActivationSyncPlan(plan.map((item) => ({ ...item }))),
    /trusted activation sync plan/,
  );
});

test("POSIX case variants cannot be injected into a trusted generated-root plan", {
  skip: process.platform === "win32",
}, () => {
  const { repoRoot, policy } = makeFixtureRepo([["explicit-skill", "explicit", "Explicit."]]);
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const generatedItem = plan.find((item) => item.before === null);
  const variant = { ...generatedItem, path: generatedItem.path.replace("benchmarks", "BENCHMARKS") };
  assert.throws(() => plan.push(variant), /object is not extensible|read only|frozen/i);
  assert.throws(() => applyActivationSyncPlan([variant]), /trusted activation sync plan/);
});

test("successful commit retains recovery artifacts and never invokes legacy backup cleanup", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const targetPath = path.join(repoRoot, "skills", "demo", "SKILL.md");
  const expected = plan.find((item) => item.path === targetPath).after;
  let unlinks = 0;
  const fsWithCleanupAudit = Object.create(fs);
  fsWithCleanupAudit.unlinkSync = (filePath) => {
    unlinks += 1;
    return fs.unlinkSync(filePath);
  };

  const applied = applyActivationSyncPlan(plan, { fsImpl: fsWithCleanupAudit });

  assert.deepEqual([...applied], checkActivationSyncPlan(plan));
  assert.equal(fs.readFileSync(targetPath, "utf8"), expected);
  assert.equal(unlinks, 0);
  assert.equal(applied.cleanupWarnings.length, 0);
  assert.ok(applied.recoveryPaths.some((recoveryPath) => fs.existsSync(recoveryPath)));
});

test("final target rename through a raced junction preserves the outside inode as a named artifact", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const targetPath = path.join(repoRoot, "skills", "demo", "SKILL.md");
  const skillRoot = path.dirname(targetPath);
  const savedSkillRoot = `${skillRoot}-saved`;
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-policy-outside-"));
  tempRoots.push(outsideRoot);
  const outsideOriginal = path.join(outsideRoot, "SKILL.md");
  fs.writeFileSync(outsideOriginal, "OUTSIDE-ORIGINAL\n", "utf8");
  let swapped = false;
  const fsWithTargetJunctionRace = Object.create(fs);
  fsWithTargetJunctionRace.renameSync = (source, target) => {
    if (!swapped && source === targetPath) {
      fs.renameSync(skillRoot, savedSkillRoot);
      fs.symlinkSync(outsideRoot, skillRoot, process.platform === "win32" ? "junction" : "dir");
      swapped = true;
    }
    return fs.renameSync(source, target);
  };

  try {
    let error;
    try {
      applyActivationSyncPlan(plan, { fsImpl: fsWithTargetJunctionRace });
    } catch (caught) {
      error = caught;
    }
    assert.ok(error);
    assert.match(error.message, /moved file identity|transaction recovery identity/);
    assert.equal(swapped, true);
    const retainedOutside = error.artifactPaths.find((artifactPath) => (
      fs.existsSync(artifactPath)
        && fs.statSync(artifactPath).isFile()
        && fs.readFileSync(artifactPath, "utf8") === "OUTSIDE-ORIGINAL\n"
    ));
    assert.ok(retainedOutside);
    assert.equal(fs.readFileSync(path.join(savedSkillRoot, "SKILL.md"), "utf8"), skillText());
  } finally {
    if (swapped && fs.existsSync(skillRoot)) fs.rmSync(skillRoot, { force: true });
    if (swapped && fs.existsSync(savedSkillRoot)) fs.renameSync(savedSkillRoot, skillRoot);
  }
});

test("CLI performs no unlink cleanup and reports persistent artifacts", () => {
  const { repoRoot } = makeFixtureRepo();
  const targetPath = path.join(repoRoot, "skills", "demo", "SKILL.md");
  const stderr = [];
  const stdout = [];
  let unlinks = 0;
  const fsWithCleanupAudit = Object.create(fs);
  fsWithCleanupAudit.unlinkSync = (filePath) => {
    unlinks += 1;
    return fs.unlinkSync(filePath);
  };

  const exitCode = main([], {
    repoRoot,
    stdout: { write: (text) => stdout.push(text) },
    stderr: { write: (text) => stderr.push(text) },
    fsImpl: fsWithCleanupAudit,
  });

  assert.equal(exitCode, 0);
  assert.equal(unlinks, 0);
  assert.equal(stderr.join(""), "");
  assert.match(stdout.join(""), /Persistent activation-policy artifacts are intentionally retained/);
  assert.match(fs.readFileSync(targetPath, "utf8"), /Use automatically for demos\./);
});

test("CLI success reports every persistent recovery and artifact path", () => {
  const { repoRoot } = makeFixtureRepo();
  const stdout = [];

  const exitCode = main([], {
    repoRoot,
    stdout: { write: (text) => stdout.push(text) },
  });

  assert.equal(exitCode, 0);
  assert.match(stdout.join(""), /Persistent activation-policy artifacts are intentionally retained/);
  assert.match(stdout.join(""), /activation-policy-recovery/);
  assert.match(stdout.join(""), /recovery.*old inode/i);
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
