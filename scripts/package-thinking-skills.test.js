const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  applyPackagePlan,
  buildPackagePlan,
  main,
  validateSourceModeAdapters,
} = require("./package-thinking-skills");

const tempRoots = [];

test.afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function makePolicy() {
  return {
    schema_version: 1,
    default_mode: "auto",
    skills: {
      "auto-skill": { mode: "auto", auto_description: "Auto." },
      "disabled-skill": { mode: "disabled", auto_description: "Disabled." },
      "explicit-skill": { mode: "explicit", auto_description: "Explicit." },
    },
  };
}

function makeFixtureRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-package-repo-"));
  const outputParent = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-package-out-"));
  tempRoots.push(repoRoot, outputParent);

  fs.mkdirSync(path.join(repoRoot, ".codex-plugin"), { recursive: true });
  fs.mkdirSync(path.join(repoRoot, "config"), { recursive: true });
  fs.mkdirSync(path.join(repoRoot, "skills"), { recursive: true });
  const manifest = '{\n  "name": "fixture",\n  "skills": "./skills/"\n}\n';
  const policyBytes = "fixture canonical policy bytes\r\n";
  fs.writeFileSync(path.join(repoRoot, ".codex-plugin", "plugin.json"), manifest, "utf8");
  fs.writeFileSync(path.join(repoRoot, "config", "activation-policy.yaml"), policyBytes, "utf8");
  for (const fileName of ["ATTRIBUTION.md", "LICENSE", "README.md", "README.zh.md"]) {
    fs.writeFileSync(path.join(repoRoot, fileName), `${fileName} fixture\n`, "utf8");
  }

  for (const skillId of ["auto-skill", "explicit-skill", "disabled-skill"]) {
    const skillRoot = path.join(repoRoot, "skills", skillId);
    fs.mkdirSync(path.join(skillRoot, "assets"), { recursive: true });
    fs.writeFileSync(path.join(skillRoot, "SKILL.md"), `${skillId}\r\n`, "utf8");
    fs.writeFileSync(path.join(skillRoot, "assets", "payload.bin"), Buffer.from([0, 1, 2, 255]));
  }

  return { repoRoot, outputParent, policy: makePolicy(), manifest, policyBytes };
}

function initializeTrackedFixture(repoRoot) {
  fs.writeFileSync(
    path.join(repoRoot, ".gitignore"),
    "**/__pycache__/\n*.pyc\n*.pyo\n.DS_Store\nignored-cache.tmp\n",
    "utf8",
  );
  childProcess.execFileSync("git", ["init", "--quiet"], { cwd: repoRoot, stdio: "ignore" });
  childProcess.execFileSync("git", [
    "add",
    "--",
    ".codex-plugin/plugin.json",
    "config/activation-policy.yaml",
    "skills",
    "ATTRIBUTION.md",
    "LICENSE",
    "README.md",
    "README.zh.md",
    ".gitignore",
  ], { cwd: repoRoot, stdio: "ignore" });
}

function assertTreeFileBytesEqual(sourceRoot, targetRoot, relativePath) {
  assert.deepEqual(
    fs.readFileSync(path.join(targetRoot, relativePath)),
    fs.readFileSync(path.join(sourceRoot, relativePath)),
    relativePath,
  );
}

test("stages only Auto and Explicit Skills in the exact public package layout", () => {
  const { repoRoot, outputParent, policy } = makeFixtureRepo();
  const outputRoot = path.join(outputParent, "stage");

  const plan = buildPackagePlan({ repoRoot, outputRoot, policy });
  applyPackagePlan(plan);

  assert.deepEqual(fs.readdirSync(outputRoot).sort(), [
    ".codex-plugin",
    "ATTRIBUTION.md",
    "LICENSE",
    "README.md",
    "README.zh.md",
    "config",
    "skills",
  ]);
  assert.deepEqual(fs.readdirSync(path.join(outputRoot, "skills")).sort(), [
    "auto-skill",
    "explicit-skill",
  ]);
  assert.equal(fs.existsSync(path.join(outputRoot, "skills", "disabled-skill")), false);

  for (const skillId of ["auto-skill", "explicit-skill"]) {
    assertTreeFileBytesEqual(repoRoot, outputRoot, path.join("skills", skillId, "SKILL.md"));
    assertTreeFileBytesEqual(
      repoRoot,
      outputRoot,
      path.join("skills", skillId, "assets", "payload.bin"),
    );
  }
  for (const relativePath of [
    path.join(".codex-plugin", "plugin.json"),
    path.join("config", "activation-policy.yaml"),
    "ATTRIBUTION.md",
    "LICENSE",
    "README.md",
    "README.zh.md",
  ]) assertTreeFileBytesEqual(repoRoot, outputRoot, relativePath);
  assert.equal(JSON.parse(fs.readFileSync(path.join(outputRoot, ".codex-plugin", "plugin.json"))).skills, "./skills/");
  assert.equal(fs.readFileSync(path.join(repoRoot, "config", "activation-policy.yaml"), "utf8"), "fixture canonical policy bytes\r\n");
});

test("rejects non-empty, repository-contained, root, and user-profile outputs without deletion", () => {
  const { repoRoot, outputParent, policy } = makeFixtureRepo();
  const nonEmpty = path.join(outputParent, "non-empty");
  fs.mkdirSync(nonEmpty);
  const sentinel = path.join(nonEmpty, "KEEP.txt");
  fs.writeFileSync(sentinel, "KEEP\n", "utf8");

  assert.throws(
    () => buildPackagePlan({ repoRoot, outputRoot: nonEmpty, policy }),
    /output.*empty/i,
  );
  assert.equal(fs.readFileSync(sentinel, "utf8"), "KEEP\n");
  assert.throws(
    () => buildPackagePlan({ repoRoot, outputRoot: path.join(repoRoot, "package"), policy }),
    /outside.*repository/i,
  );
  assert.throws(
    () => buildPackagePlan({ repoRoot, outputRoot: path.parse(repoRoot).root, policy }),
    /drive root/i,
  );
  assert.throws(
    () => buildPackagePlan({ repoRoot, outputRoot: os.homedir(), policy }),
    /user profile root/i,
  );
  assert.equal(fs.existsSync(path.join(repoRoot, "package")), false);
});

test("rejects forged plans and requires an explicit CLI output path", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  assert.throws(() => applyPackagePlan([]), /trusted package plan/i);
  assert.throws(() => main([], { repoRoot, policy }), /--out.*required/i);
  assert.throws(() => main(["--out"], { repoRoot, policy }), /--out.*value/i);
  assert.throws(() => main(["--unknown"], { repoRoot, policy }), /Unknown option/);
});

test("source-mode Cursor and OpenCode deployment rejects Disabled Skills without filtering", () => {
  const policy = makePolicy();
  assert.throws(
    () => validateSourceModeAdapters({ policy, filteredPackage: false, adapter: "cursor" }),
    (error) => /Cursor/i.test(error.message)
      && /disabled-skill/.test(error.message)
      && /filtered package/i.test(error.message),
  );
  assert.doesNotThrow(() => validateSourceModeAdapters({
    policy,
    filteredPackage: true,
    adapter: "cursor",
  }));
  const enabledPolicy = makePolicy();
  enabledPolicy.skills["disabled-skill"].mode = "auto";
  assert.doesNotThrow(() => validateSourceModeAdapters({
    policy: enabledPolicy,
    filteredPackage: false,
    adapter: "opencode",
  }));
});

test("source-mode guard is reachable from a read-only Cursor/OpenCode CLI mode", () => {
  const { repoRoot, policy } = makeFixtureRepo();
  for (const adapter of ["cursor", "opencode"]) {
    const stderr = [];
    assert.equal(main(["--check-source-mode", "--adapter", adapter], {
      repoRoot,
      policy,
      stderr: { write: (text) => stderr.push(text) },
    }), 1);
    assert.match(stderr.join(""), new RegExp(adapter, "i"));
    assert.match(stderr.join(""), /filtered package/i);
  }

  const enabledPolicy = makePolicy();
  enabledPolicy.skills["disabled-skill"].mode = "auto";
  assert.equal(main(["--check-source-mode", "--adapter", "cursor"], {
    repoRoot,
    policy: enabledPolicy,
    stdout: { write: () => {} },
  }), 0);
  assert.throws(
    () => main(["--check-source-mode"], { repoRoot, policy }),
    /--adapter.*required/i,
  );
  assert.throws(
    () => main(["--check-source-mode", "--adapter", "other"], { repoRoot, policy }),
    /adapter.*cursor.*opencode/i,
  );
  assert.throws(
    () => main(["--check-source-mode", "--adapter", "cursor", "--out", "stage"], {
      repoRoot,
      policy,
    }),
    /cannot.*--out/i,
  );
});

test("shipped zero-Disabled policy passes the production source-mode CLI guard", () => {
  const repoRoot = path.resolve(__dirname, "..");
  assert.equal(main(["--check-source-mode", "--adapter", "cursor"], {
    repoRoot,
    stdout: { write: () => {} },
  }), 0);
});

test("CLI creates a caller-selected filtered staging directory", () => {
  const { repoRoot, outputParent, policy } = makeFixtureRepo();
  const outputRoot = path.join(outputParent, "cli-stage");
  const stdout = [];

  assert.equal(main(["--out", outputRoot], {
    repoRoot,
    policy,
    stdout: { write: (text) => stdout.push(text) },
  }), 0);
  assert.equal(fs.existsSync(path.join(outputRoot, "skills", "auto-skill", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(outputRoot, "skills", "disabled-skill")), false);
  assert.match(stdout.join(""), new RegExp(outputRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("apply rejects an output path redirected into the repository after planning", () => {
  const { repoRoot, outputParent, policy } = makeFixtureRepo();
  const outputRoot = path.join(outputParent, "raced-stage");
  const redirectedTarget = path.join(repoRoot, "redirected-stage");
  const plan = buildPackagePlan({ repoRoot, outputRoot, policy });
  fs.mkdirSync(redirectedTarget);
  fs.symlinkSync(redirectedTarget, outputRoot, "junction");

  assert.throws(() => applyPackagePlan(plan), /output.*changed after planning/i);
  assert.deepEqual(fs.readdirSync(redirectedTarget), []);
});

test("apply rejects an approved source redirected outside the repository after planning", () => {
  const { repoRoot, outputParent, policy } = makeFixtureRepo();
  const outputRoot = path.join(outputParent, "raced-source-stage");
  const plan = buildPackagePlan({ repoRoot, outputRoot, policy });
  const approvedSource = path.join(repoRoot, "skills", "auto-skill");
  const movedSource = path.join(repoRoot, "skills", "auto-skill-original");
  const outsideSource = path.join(outputParent, "outside-source");
  fs.renameSync(approvedSource, movedSource);
  fs.mkdirSync(outsideSource);
  fs.writeFileSync(path.join(outsideSource, "SECRET.txt"), "must not package\n", "utf8");
  fs.symlinkSync(outsideSource, approvedSource, "junction");

  assert.throws(() => applyPackagePlan(plan), /source.*changed after planning/i);
  assert.equal(fs.existsSync(path.join(outputRoot, "skills", "auto-skill", "SECRET.txt")), false);
});

test("enabled Skill traversal rejects an external junction before planning any recursive copy", () => {
  const { repoRoot, outputParent, policy } = makeFixtureRepo();
  const outsideSource = path.join(outputParent, "outside-junction-target");
  const junction = path.join(repoRoot, "skills", "auto-skill", "assets", "external");
  fs.mkdirSync(outsideSource);
  fs.writeFileSync(path.join(outsideSource, "SECRET.txt"), "outside\n", "utf8");
  fs.symlinkSync(outsideSource, junction, "junction");

  assert.throws(
    () => buildPackagePlan({
      repoRoot,
      outputRoot: path.join(outputParent, "junction-stage"),
      policy,
    }),
    /symbolic link|junction|reparse/i,
  );
});

test("a Disabled Skill represented by an external junction is never traversed or packaged", () => {
  const { repoRoot, outputParent, policy } = makeFixtureRepo();
  const disabledRoot = path.join(repoRoot, "skills", "disabled-skill");
  const outsideSource = path.join(outputParent, "disabled-outside-target");
  fs.rmSync(disabledRoot, { recursive: true });
  fs.mkdirSync(outsideSource);
  fs.writeFileSync(path.join(outsideSource, "SECRET.txt"), "disabled outside\n", "utf8");
  fs.symlinkSync(outsideSource, disabledRoot, "junction");
  const outputRoot = path.join(outputParent, "disabled-link-stage");

  const plan = buildPackagePlan({ repoRoot, outputRoot, policy });
  applyPackagePlan(plan);

  assert.equal(fs.existsSync(path.join(outputRoot, "skills", "disabled-skill")), false);
});

test("fallback walker excludes cache artifacts and never calls recursive cpSync", () => {
  const { repoRoot, outputParent, policy } = makeFixtureRepo();
  const skillRoot = path.join(repoRoot, "skills", "auto-skill");
  fs.mkdirSync(path.join(skillRoot, "__pycache__"));
  fs.writeFileSync(path.join(skillRoot, "__pycache__", "module.pyc"), "cache", "utf8");
  fs.writeFileSync(path.join(skillRoot, "module.pyo"), "cache", "utf8");
  fs.writeFileSync(path.join(skillRoot, ".DS_Store"), "cache", "utf8");
  const outputRoot = path.join(outputParent, "safe-walker-stage");
  const plan = buildPackagePlan({ repoRoot, outputRoot, policy });
  const auditedFs = Object.create(fs);
  auditedFs.cpSync = () => {
    throw new Error("recursive cpSync must not be called");
  };

  applyPackagePlan(plan, { fsImpl: auditedFs });

  assert.equal(fs.existsSync(path.join(outputRoot, "skills", "auto-skill", "__pycache__")), false);
  assert.equal(fs.existsSync(path.join(outputRoot, "skills", "auto-skill", "module.pyo")), false);
  assert.equal(fs.existsSync(path.join(outputRoot, "skills", "auto-skill", ".DS_Store")), false);
});

test("Git tracked inventory excludes ignored and untracked cache files", () => {
  const { repoRoot, outputParent, policy } = makeFixtureRepo();
  const skillRoot = path.join(repoRoot, "skills", "auto-skill");
  fs.mkdirSync(path.join(skillRoot, "__pycache__"));
  fs.writeFileSync(path.join(skillRoot, "__pycache__", "ignored.pyc"), "ignored", "utf8");
  fs.writeFileSync(path.join(skillRoot, "ignored-cache.tmp"), "ignored", "utf8");
  initializeTrackedFixture(repoRoot);
  fs.writeFileSync(path.join(skillRoot, "untracked-cache.bin"), "untracked", "utf8");
  const outputRoot = path.join(outputParent, "tracked-stage");

  applyPackagePlan(buildPackagePlan({ repoRoot, outputRoot, policy }));

  assert.equal(fs.existsSync(path.join(outputRoot, "skills", "auto-skill", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(outputRoot, "skills", "auto-skill", "__pycache__")), false);
  assert.equal(fs.existsSync(path.join(outputRoot, "skills", "auto-skill", "ignored-cache.tmp")), false);
  assert.equal(fs.existsSync(path.join(outputRoot, "skills", "auto-skill", "untracked-cache.bin")), false);
});

test("the real repository package plan is file-explicit and excludes the existing __pycache__", () => {
  const repoRoot = path.resolve(__dirname, "..");
  const outputParent = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-skills-real-package-plan-"));
  tempRoots.push(outputParent);
  const policy = require("./activation-policy").loadActivationPolicy({ repoRoot });
  const plan = buildPackagePlan({
    repoRoot,
    outputRoot: path.join(outputParent, "stage"),
    policy,
  });

  assert.equal(plan.copies.every((item) => item.kind === "file"), true);
  assert.equal(plan.copies.some((item) => item.source.includes("__pycache__")), false);
  assert.equal(plan.copies.some((item) => /\.py[co]$/i.test(item.source)), false);
});
