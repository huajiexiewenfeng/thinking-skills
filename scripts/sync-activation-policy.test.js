const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

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

function makeFixtureRepo(entries = [["demo", "auto", "Use automatically for demos."]]) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-policy-"));
  tempRoots.push(repoRoot);
  fs.mkdirSync(path.join(repoRoot, "config"), { recursive: true });
  fs.mkdirSync(path.join(repoRoot, "benchmarks", "generated", "activation-policy"), { recursive: true });

  const policy = makePolicy(entries);
  for (const skillId of Object.keys(policy.skills)) {
    const skillRoot = path.join(repoRoot, "skills", skillId);
    fs.mkdirSync(skillRoot, { recursive: true });
    fs.writeFileSync(path.join(skillRoot, "SKILL.md"), skillText(), "utf8");
  }

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
      "### Mode Rules",
      "",
      "- `auto`: eligible under the authored domain routing rules.",
      "- `explicit`: eligible only after valid exact invocation in the current final user request; otherwise its ordinary domain intent uses `native` unless another Auto Skill owns the deliverable.",
      "- `disabled`: never select, announce, load, or hand off; a direct invocation receives an unavailable response.",
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
    ["zeta-skill", "disabled", "Zeta."],
    ["auto-skill", "auto", "Auto."],
    ["middle-skill", "explicit", "Middle."],
  ]);

  assert.deepEqual(
    renderActivationBenchmarkCases(policy).map((item) => item.fileName),
    ["middle-skill-explicit.json", "zeta-skill-disabled.json"],
  );
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
