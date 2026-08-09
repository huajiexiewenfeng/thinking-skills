const assert = require("node:assert/strict");
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
    () => validateSourceModeAdapters({ policy, filteredPackage: false }),
    (error) => /Cursor.*OpenCode/i.test(error.message)
      && /disabled-skill/.test(error.message)
      && /filtered package/i.test(error.message),
  );
  assert.doesNotThrow(() => validateSourceModeAdapters({ policy, filteredPackage: true }));
  const enabledPolicy = makePolicy();
  enabledPolicy.skills["disabled-skill"].mode = "auto";
  assert.doesNotThrow(() => validateSourceModeAdapters({ policy: enabledPolicy, filteredPackage: false }));
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
