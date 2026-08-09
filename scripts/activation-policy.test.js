const test = require("node:test");
const assert = require("node:assert/strict");
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
  assert.equal(Object.isFrozen(policy.skills["learning-coach"]), true);
});

test("strict parser rejects unsupported syntax and duplicate keys", () => {
  const invalid = [
    ["duplicate Skill", "skills:\n  demo:\n    mode: auto\n    auto_description: \"A\"\n  demo:\n    mode: auto\n    auto_description: \"B\"\n"],
    ["unknown mode", "skills:\n  demo:\n    mode: sometimes\n    auto_description: \"A\"\n"],
    ["tab indentation", "skills:\n\tdemo:\n    mode: auto\n    auto_description: \"A\"\n"],
    ["multiline scalar", "skills:\n  demo:\n    mode: auto\n    auto_description: |\n      A\n"],
  ];

  for (const [name, text] of invalid) {
    assert.throws(() => parseActivationPolicy(text, name), Error, name);
  }
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
});
