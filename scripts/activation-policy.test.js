const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  VALID_ACTIVATION_MODES,
  parseActivationPolicy,
  discoverFirstPartySkillIds,
  validateActivationPolicy,
  loadActivationPolicy,
  getSkillPolicy,
  skillIdsByMode,
} = require("./activation-policy");

const repoRoot = path.resolve(__dirname, "..");

test("committed activation policy covers every first-party Skill exactly once", () => {
  const policy = loadActivationPolicy({ repoRoot });
  const discovered = discoverFirstPartySkillIds(repoRoot);

  assert.deepEqual(Object.keys(policy.skills).sort(), discovered);
  assert.deepEqual(VALID_ACTIVATION_MODES, ["auto", "explicit", "disabled"]);
  assert.deepEqual(skillIdsByMode(policy, "explicit"), [
    "learning-coach",
    "technical-deep-dive",
  ]);
  assert.deepEqual(skillIdsByMode(policy, "disabled"), []);
  assert.equal(getSkillPolicy(policy, "content-creator").mode, "auto");
  assert.equal(Object.isFrozen(policy), true);
  assert.equal(Object.isFrozen(policy.skills), true);
  assert.equal(Object.isFrozen(policy.skills["learning-coach"]), true);
  assert.throws(() => {
    (function rejectRootMutation() {
      "use strict";
      policy.default_mode = "disabled";
    })();
  }, TypeError);
  assert.throws(() => {
    (function rejectContainerMutation() {
      "use strict";
      policy.skills.extra = { mode: "auto", auto_description: "Use for extras." };
    })();
  }, TypeError);
  assert.throws(() => {
    (function rejectEntryMutation() {
      "use strict";
      policy.skills["learning-coach"].mode = "disabled";
    })();
  }, TypeError);
});

test("strict parser rejects unsupported syntax and duplicate keys", () => {
  const invalid = [
    ["duplicate Skill", "skills:\n  demo:\n    mode: auto\n    auto_description: \"A\"\n  demo:\n    mode: auto\n    auto_description: \"B\"\n"],
    ["unknown mode", "skills:\n  demo:\n    mode: sometimes\n    auto_description: \"A\"\n"],
    ["tab indentation", "skills:\n\tdemo:\n    mode: auto\n    auto_description: \"A\"\n"],
    ["multiline scalar", "skills:\n  demo:\n    mode: auto\n    auto_description: |\n      A\n"],
  ];

  for (const [name, text] of invalid) {
    assert.throws(
      () => parseActivationPolicy(text, name),
      (error) => {
        assert.match(error.message, new RegExp(`${name}: line \\d+:`));
        return true;
      },
      name,
    );
  }
});

test("strict parser rejects scalar skills declarations", () => {
  assert.throws(
    () => parseActivationPolicy("schema_version: 1\ndefault_mode: auto\nskills: auto\n", "scalar-skills"),
    /scalar-skills: line 3:/,
  );
});

test("validation rejects missing, unknown, blank, and unsupported entries", () => {
  const base = {
    schema_version: 1,
    default_mode: "auto",
    skills: { demo: { mode: "auto", auto_description: "Use for demos." } },
  };

  assert.throws(() => validateActivationPolicy(base, ["demo", "missing"], "fixture"), /missing/);
  assert.throws(() => validateActivationPolicy(base, [], "fixture"), /unknown/);
  assert.throws(() => validateActivationPolicy({ ...base, schema_version: 2 }, ["demo"], "fixture"), /schema_version/);
  assert.throws(() => validateActivationPolicy({ ...base, skills: { demo: { mode: "auto", auto_description: "" } } }, ["demo"], "fixture"), /auto_description/);
  assert.throws(
    () => validateActivationPolicy({ ...base, unexpected_top_level: true }, ["demo"], "direct-fixture.yaml"),
    /direct-fixture\.yaml: .*unexpected_top_level/,
  );
});

test("top-level validation errors retain parsed source locations", () => {
  const parsed = parseActivationPolicy(
    "schema_version: 2\ndefault_mode: auto\nskills:\n  demo:\n    mode: auto\n    auto_description: \"Use for demos.\"\n",
    "parsed-fixture.yaml",
  );

  assert.throws(
    () => validateActivationPolicy(parsed, ["demo"], "parsed-fixture.yaml"),
    /parsed-fixture\.yaml: line 1: schema_version/,
  );
});

test("parseActivationPolicy defaults diagnostics to the in-memory source", () => {
  assert.throws(
    () => parseActivationPolicy("not yaml"),
    /<memory>: line 1: unsupported syntax/,
  );
});

test("loadActivationPolicy honors an explicit policyPath while preserving repo discovery", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-policy-path-"));
  const policyPath = path.join(tempRoot, "alternate-policy.yaml");
  const source = fs.readFileSync(path.join(repoRoot, "config", "activation-policy.yaml"), "utf8")
    .replace("default_mode: auto", "default_mode: explicit");
  fs.writeFileSync(policyPath, source, "utf8");

  try {
    const policy = loadActivationPolicy({ repoRoot, policyPath });
    assert.equal(policy.default_mode, "explicit");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
