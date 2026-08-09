const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { loadActivationPolicy } = require("./activation-policy");

const {
  END_MARKER,
  GENERATED_COMMENT,
  START_MARKER,
  applyCodexActivationPlan,
  buildCodexActivationPlan,
  main,
  renderManagedBlock,
} = require("./apply-codex-activation-policy");

const tempRoots = [];

test.afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function makePolicy(entries = [
  ["auto-skill", "auto"],
  ["explicit-skill", "explicit"],
  ["fixture-disabled", "disabled"],
]) {
  return {
    schema_version: 1,
    default_mode: "auto",
    skills: Object.fromEntries(entries.map(([skillId, mode]) => [skillId, {
      mode,
      auto_description: `${skillId}.`,
    }])),
  };
}

function oldBlock(body = "# stale") {
  return [START_MARKER, body, END_MARKER].join("\n");
}

function makeFixture({ configText = `title = "保留"\r\n${oldBlock()}\r\nanswer = 42\r\n` } = {}) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-codex-repo-"));
  const installRoot = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-codex-install-"));
  tempRoots.push(repoRoot, installRoot);
  const configRoot = path.join(installRoot, ".codex");
  const skillsRoot = path.join(installRoot, ".agents", "skills", "thinking-skills");
  fs.mkdirSync(configRoot, { recursive: true });
  fs.mkdirSync(skillsRoot, { recursive: true });
  const configPath = path.join(configRoot, "config.toml");
  fs.writeFileSync(configPath, configText, "utf8");
  return { repoRoot, installRoot, configPath, skillsRoot, policy: makePolicy() };
}

const fixedClock = () => new Date("2026-08-09T12:34:56.789Z");

test("renders sorted Disabled entries with exact TOML escaping and omits Auto and Explicit", () => {
  const skillsRoot = path.join(path.parse(process.cwd()).root, 'install\\quoted"root');
  const policy = makePolicy([
    ["z-disabled", "disabled"],
    ["auto-skill", "auto"],
    ["a-disabled", "disabled"],
    ["explicit-skill", "explicit"],
  ]);

  const block = renderManagedBlock({ policy, skillsRoot });
  const expectedEntries = ["a-disabled", "z-disabled"].map((skillId) => [
    "[[skills.config]]",
    `path = "${path.join(skillsRoot, skillId, "SKILL.md").replace(/\\/g, "\\\\").replace(/\"/g, '\\\"')}"`,
    "enabled = false",
  ].join("\n"));
  assert.equal(block, [START_MARKER, GENERATED_COMMENT, ...expectedEntries, END_MARKER].join("\n"));
  assert.doesNotMatch(block, /auto-skill|explicit-skill/);
});

test("shipped zero-Disabled policy still renders the empty managed block", () => {
  const repoRoot = path.resolve(__dirname, "..");
  const policy = loadActivationPolicy({ repoRoot });
  assert.equal(
    renderManagedBlock({ policy, skillsRoot: path.resolve("C:\\installed-skills") }),
    [START_MARKER, GENERATED_COMMENT, END_MARKER].join("\n"),
  );
});

test("preview prints target, backup, diff, and full block without writing config or backup", () => {
  const fixture = makeFixture();
  const before = fs.readFileSync(fixture.configPath);
  const stdout = [];

  assert.equal(main([
    "--config", fixture.configPath,
    "--skills-root", fixture.skillsRoot,
  ], {
    repoRoot: fixture.repoRoot,
    policy: fixture.policy,
    clock: fixedClock,
    stdout: { write: (text) => stdout.push(text) },
  }), 0);

  const output = stdout.join("");
  assert.match(output, /Preview only/i);
  assert.match(output, new RegExp(fixture.configPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(output, /Backup:/);
  assert.match(output, /--- current\n\+\+\+ proposed/);
  assert.match(output, new RegExp(START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(output, /fixture-disabled/);
  assert.deepEqual(fs.readFileSync(fixture.configPath), before);
  assert.deepEqual(fs.readdirSync(path.dirname(fixture.configPath)).sort(), ["config.toml"]);
});

test("check is read-only and distinguishes current from stale managed blocks", () => {
  const fixture = makeFixture();
  const staleBefore = fs.readFileSync(fixture.configPath);
  const staleError = [];
  assert.equal(main([
    "--config", fixture.configPath,
    "--skills-root", fixture.skillsRoot,
    "--check",
  ], {
    repoRoot: fixture.repoRoot,
    policy: fixture.policy,
    clock: fixedClock,
    stderr: { write: (text) => staleError.push(text) },
  }), 1);
  assert.match(staleError.join(""), /stale/i);
  assert.deepEqual(fs.readFileSync(fixture.configPath), staleBefore);

  const plan = buildCodexActivationPlan({ ...fixture, clock: fixedClock });
  fs.writeFileSync(fixture.configPath, plan.after);
  const currentBytes = fs.readFileSync(fixture.configPath);
  assert.equal(main([
    "--config", fixture.configPath,
    "--skills-root", fixture.skillsRoot,
    "--check",
  ], {
    repoRoot: fixture.repoRoot,
    policy: fixture.policy,
    clock: fixedClock,
  }), 0);
  assert.deepEqual(fs.readFileSync(fixture.configPath), currentBytes);
  assert.deepEqual(fs.readdirSync(path.dirname(fixture.configPath)).sort(), ["config.toml"]);
});

test("apply preserves unrelated TOML bytes and creates a sibling backup before replacement", () => {
  const fixture = makeFixture();
  const original = fs.readFileSync(fixture.configPath);
  const plan = buildCodexActivationPlan({ ...fixture, clock: fixedClock });
  const events = [];
  const auditedFs = Object.create(fs);
  auditedFs.copyFileSync = (...args) => {
    events.push(["backup", args[0], args[1]]);
    return fs.copyFileSync(...args);
  };
  auditedFs.renameSync = (...args) => {
    events.push(["rename", args[0], args[1]]);
    return fs.renameSync(...args);
  };

  const result = applyCodexActivationPlan(plan, { fsImpl: auditedFs });

  assert.equal(events[0][0], "backup");
  assert.equal(path.dirname(result.backupPath), path.dirname(fixture.configPath));
  assert.deepEqual(fs.readFileSync(result.backupPath), original);
  assert.deepEqual(fs.readFileSync(fixture.configPath), plan.after);
  const after = fs.readFileSync(fixture.configPath);
  assert.equal(after.subarray(0, Buffer.byteLength('title = "保留"\r\n')).toString("utf8"), 'title = "保留"\r\n');
  assert.equal(after.subarray(-Buffer.byteLength("\r\nanswer = 42\r\n")).toString("utf8"), "\r\nanswer = 42\r\n");
});

test("a forced replacement failure restores the original config bytes", () => {
  const fixture = makeFixture();
  const original = fs.readFileSync(fixture.configPath);
  const plan = buildCodexActivationPlan({ ...fixture, clock: fixedClock });
  let renameCount = 0;
  const failingFs = Object.create(fs);
  failingFs.renameSync = (source, target) => {
    renameCount += 1;
    if (renameCount === 2) throw new Error("injected replacement failure");
    return fs.renameSync(source, target);
  };

  assert.throws(
    () => applyCodexActivationPlan(plan, { fsImpl: failingFs }),
    /injected replacement failure/,
  );
  assert.deepEqual(fs.readFileSync(fixture.configPath), original);
  assert.deepEqual(fs.readFileSync(plan.backupPath), original);
});

test("zero-marker config safely bootstraps in preview/check/apply while preserving all original bytes", () => {
  const originalText = 'title = "首次安装"\r\nanswer = 42';
  const fixture = makeFixture({ configText: originalText });
  const original = fs.readFileSync(fixture.configPath);
  const stdout = [];
  const stderr = [];
  const argv = ["--config", fixture.configPath, "--skills-root", fixture.skillsRoot];

  assert.equal(main(argv, {
    repoRoot: fixture.repoRoot,
    policy: fixture.policy,
    clock: fixedClock,
    stderr: { write: (text) => stderr.push(text) },
    stdout: { write: (text) => stdout.push(text) },
  }), 0);
  assert.match(stdout.join(""), /fixture-disabled/);
  assert.deepEqual(fs.readFileSync(fixture.configPath), original);

  assert.equal(main([...argv, "--check"], {
    repoRoot: fixture.repoRoot,
    policy: fixture.policy,
    clock: fixedClock,
    stderr: { write: (text) => stderr.push(text) },
  }), 1);
  assert.deepEqual(fs.readFileSync(fixture.configPath), original);

  assert.equal(main([...argv, "--apply"], {
    repoRoot: fixture.repoRoot,
    policy: fixture.policy,
    clock: fixedClock,
    stdout: { write: (text) => stdout.push(text) },
  }), 0);
  const applied = fs.readFileSync(fixture.configPath);
  assert.deepEqual(applied.subarray(0, original.length), original);
  assert.equal(applied.subarray(original.length).toString("utf8"), `\n${renderManagedBlock({
    policy: fixture.policy,
    skillsRoot: fixture.skillsRoot,
  })}\n`);
  assert.equal(main([...argv, "--check"], {
    repoRoot: fixture.repoRoot,
    policy: fixture.policy,
    clock: fixedClock,
    stderr: { write: (text) => stderr.push(text) },
  }), 0);
});

test("partial, duplicate, reversed, nested, and malformed owned markers fail closed", () => {
  const cases = [
    ["partial", `${START_MARKER}\n${GENERATED_COMMENT}\n`],
    ["duplicate", `${START_MARKER}\n${START_MARKER}\n${END_MARKER}\n`],
    ["reversed", `${END_MARKER}\n${START_MARKER}\n`],
    ["nested", `${START_MARKER}\n# thinking-skills activation-policy:nested\n${END_MARKER}\n`],
    ["malformed", "# thinking-skills activation-policy start\n"],
  ];
  for (const [name, configText] of cases) {
    const fixture = makeFixture({ configText });
    assert.throws(
      () => buildCodexActivationPlan({ ...fixture, clock: fixedClock }),
      (error) => error.message.includes(fixture.configPath)
        && /marker|owned block/i.test(error.message),
      name,
    );
  }
});

test("relative and repository-root targets are rejected", () => {
  const fixture = makeFixture();
  assert.throws(
    () => buildCodexActivationPlan({ ...fixture, skillsRoot: "relative-skills", clock: fixedClock }),
    /skills-root.*absolute/i,
  );
  assert.throws(
    () => buildCodexActivationPlan({ ...fixture, configPath: "relative.toml", clock: fixedClock }),
    /config.*absolute/i,
  );
  assert.throws(
    () => buildCodexActivationPlan({
      ...fixture,
      configPath: path.join(fixture.repoRoot, "config.toml"),
      clock: fixedClock,
    }),
    /config.*outside.*repository/i,
  );
  assert.throws(
    () => buildCodexActivationPlan({
      ...fixture,
      skillsRoot: fixture.repoRoot,
      clock: fixedClock,
    }),
    /skills-root.*outside.*repository/i,
  );
});

test("an installed skills-root junction keeps its absolute install path even when source is in the repo", () => {
  const fixture = makeFixture();
  const repositorySkills = path.join(fixture.repoRoot, "skills");
  fs.mkdirSync(repositorySkills);
  fs.rmdirSync(fixture.skillsRoot);
  fs.symlinkSync(repositorySkills, fixture.skillsRoot, "junction");

  const plan = buildCodexActivationPlan({ ...fixture, clock: fixedClock });

  const expectedPath = path.join(fixture.skillsRoot, "fixture-disabled", "SKILL.md")
    .replace(/\\/g, "\\\\");
  assert.match(plan.managedBlock, new RegExp(expectedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("apply rejects a config path redirected after planning", () => {
  const fixture = makeFixture();
  const plan = buildCodexActivationPlan({ ...fixture, clock: fixedClock });
  const configRoot = path.dirname(fixture.configPath);
  const originalRoot = `${configRoot}.original`;
  const originalPath = path.join(originalRoot, "config.toml");
  const repositoryTargetRoot = path.join(fixture.repoRoot, "redirected-config");
  const repositoryTarget = path.join(repositoryTargetRoot, "config.toml");
  fs.renameSync(configRoot, originalRoot);
  fs.mkdirSync(repositoryTargetRoot);
  fs.copyFileSync(originalPath, repositoryTarget);
  fs.symlinkSync(repositoryTargetRoot, configRoot, "junction");

  assert.throws(
    () => applyCodexActivationPlan(plan),
    /config target changed after planning/i,
  );
  assert.deepEqual(fs.readFileSync(repositoryTarget), fs.readFileSync(originalPath));
  assert.equal(fs.existsSync(plan.backupPath), false);
});

test("CLI requires explicit config and skills root and rejects conflicting modes", () => {
  const fixture = makeFixture();
  assert.throws(() => main([], { repoRoot: fixture.repoRoot, policy: fixture.policy }), /--config.*required/i);
  assert.throws(
    () => main(["--config", fixture.configPath], { repoRoot: fixture.repoRoot, policy: fixture.policy }),
    /--skills-root.*required/i,
  );
  assert.throws(
    () => main([
      "--config", fixture.configPath,
      "--skills-root", fixture.skillsRoot,
      "--check",
      "--apply",
    ], { repoRoot: fixture.repoRoot, policy: fixture.policy }),
    /cannot.*together/i,
  );
});
