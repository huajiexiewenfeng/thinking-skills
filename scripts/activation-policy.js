const fs = require("node:fs");
const path = require("node:path");

const VALID_ACTIVATION_MODES = Object.freeze(["auto", "explicit", "disabled"]);
const VALID_MODE_SET = new Set(VALID_ACTIVATION_MODES);
const SKILL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_METADATA = new WeakMap();
const TOP_LEVEL_KEYS = new Set(["schema_version", "default_mode", "skills"]);

function fail(sourcePath, message, lineNumber) {
  const location = lineNumber === undefined ? "" : `: line ${lineNumber}`;
  throw new Error(`${sourcePath}${location}: ${message}`);
}

function parseActivationPolicy(text, sourcePath = "<memory>") {
  const policy = { skills: {} };
  const seenTopLevelKeys = new Set();
  const seenSkillKeys = new Set();
  const seenEntryKeys = new Map();
  const topLevelLines = {};
  let currentSkillId;
  let inSkills = false;

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const lineNumber = index + 1;
    if (line.trim() === "") continue;
    if (line.includes("\t")) fail(sourcePath, "tabs are not supported", lineNumber);

    if (!inSkills) {
      if (line === "skills:") {
        if (seenTopLevelKeys.has("skills")) fail(sourcePath, "duplicate top-level key skills", lineNumber);
        seenTopLevelKeys.add("skills");
        topLevelLines.skills = lineNumber;
        inSkills = true;
        continue;
      }

      const topLevel = /^([a-z_][a-z0-9_]*): (.+)$/.exec(line);
      if (!topLevel) fail(sourcePath, "unsupported syntax", lineNumber);

      const [, key, value] = topLevel;
      if (key === "skills") fail(sourcePath, "skills must be an exact mapping marker", lineNumber);
      if (!TOP_LEVEL_KEYS.has(key)) fail(sourcePath, `unsupported top-level field ${key}`, lineNumber);
      if (seenTopLevelKeys.has(key)) fail(sourcePath, `duplicate top-level key ${key}`, lineNumber);
      seenTopLevelKeys.add(key);
      topLevelLines[key] = lineNumber;

      if (key === "schema_version") {
        if (!/^\d+$/.test(value)) fail(sourcePath, "schema_version must be an integer", lineNumber);
        policy.schema_version = Number(value);
      } else {
        if (!VALID_MODE_SET.has(value)) fail(sourcePath, `unsupported activation mode: ${value}`, lineNumber);
        policy.default_mode = value;
      }
      continue;
    }

    const skill = /^  ([a-z0-9]+(?:-[a-z0-9]+)*):$/.exec(line);
    if (skill) {
      const skillId = skill[1];
      if (seenSkillKeys.has(skillId)) fail(sourcePath, `duplicate Skill: ${skillId}`, lineNumber);
      seenSkillKeys.add(skillId);
      seenEntryKeys.set(skillId, new Set());
      policy.skills[skillId] = {};
      currentSkillId = skillId;
      continue;
    }

    const entry = /^    (mode|auto_description): (.+)$/.exec(line);
    if (!entry || !currentSkillId) fail(sourcePath, "unsupported syntax", lineNumber);

    const [, key, value] = entry;
    const seenKeys = seenEntryKeys.get(currentSkillId);
    if (seenKeys.has(key)) fail(sourcePath, `duplicate ${key} for Skill ${currentSkillId}`, lineNumber);
    seenKeys.add(key);

    if (key === "mode") {
      if (!VALID_MODE_SET.has(value)) fail(sourcePath, `unsupported activation mode: ${value}`, lineNumber);
      policy.skills[currentSkillId].mode = value;
    } else {
      try {
        const description = JSON.parse(value);
        if (typeof description !== "string") fail(sourcePath, "auto_description must be a JSON string", lineNumber);
        policy.skills[currentSkillId].auto_description = description;
      } catch (error) {
        if (error instanceof SyntaxError) fail(sourcePath, "auto_description must be a JSON string", lineNumber);
        throw error;
      }
    }
  }

  SOURCE_METADATA.set(policy, { topLevelLines });
  return policy;
}

function discoverFirstPartySkillIds(repoRoot) {
  const skillsRoot = path.join(repoRoot, "skills");
  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((skillId) => fs.existsSync(path.join(skillsRoot, skillId, "SKILL.md")))
    .sort();
}

function validateActivationPolicy(policy, discoveredSkillIds, sourcePath) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    fail(sourcePath, "policy must be an object");
  }
  const metadata = SOURCE_METADATA.get(policy);
  const failTopLevel = (key, message) => fail(sourcePath, message, metadata?.topLevelLines[key]);

  for (const key of Object.keys(policy)) {
    if (!TOP_LEVEL_KEYS.has(key)) failTopLevel(key, `unsupported top-level field ${key}`);
  }
  if (policy.schema_version !== 1) failTopLevel("schema_version", "schema_version must be 1");
  if (!VALID_MODE_SET.has(policy.default_mode)) failTopLevel("default_mode", "default_mode must be supported");
  if (!policy.skills || typeof policy.skills !== "object" || Array.isArray(policy.skills)) {
    failTopLevel("skills", "skills must be an object");
  }

  const discovered = new Set(discoveredSkillIds);
  for (const skillId of Object.keys(policy.skills)) {
    if (!SKILL_ID.test(skillId)) fail(sourcePath, `invalid Skill ID: ${skillId}`);
    if (!discovered.has(skillId)) fail(sourcePath, `unknown Skill: ${skillId}`);

    const entry = policy.skills[skillId];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      fail(sourcePath, `Skill ${skillId} must be an object`);
    }
    if (!VALID_MODE_SET.has(entry.mode)) fail(sourcePath, `Skill ${skillId} has unsupported mode`);
    if (typeof entry.auto_description !== "string" || entry.auto_description.trim() === "") {
      fail(sourcePath, `Skill ${skillId} has blank auto_description`);
    }
    for (const key of Object.keys(entry)) {
      if (key !== "mode" && key !== "auto_description") {
        fail(sourcePath, `Skill ${skillId} has unsupported entry: ${key}`);
      }
    }
  }

  for (const skillId of discovered) {
    if (!Object.prototype.hasOwnProperty.call(policy.skills, skillId)) {
      fail(sourcePath, `missing Skill: ${skillId}`);
    }
  }

  return policy;
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function loadActivationPolicy({
  repoRoot = path.resolve(__dirname, ".."),
  policyPath = path.join(repoRoot, "config", "activation-policy.yaml"),
} = {}) {
  const sourcePath = path.resolve(policyPath);
  const policy = parseActivationPolicy(fs.readFileSync(sourcePath, "utf8"), sourcePath);
  validateActivationPolicy(policy, discoverFirstPartySkillIds(repoRoot), sourcePath);
  return deepFreeze(policy);
}

function getSkillPolicy(policy, skillId) {
  const entry = policy.skills[skillId];
  if (!entry) throw new Error(`Unknown first-party Skill: ${skillId}`);
  return entry;
}

function skillIdsByMode(policy, mode) {
  if (!VALID_MODE_SET.has(mode)) throw new Error(`Unsupported activation mode: ${mode}`);
  return Object.keys(policy.skills)
    .filter((skillId) => policy.skills[skillId].mode === mode)
    .sort();
}

module.exports = {
  VALID_ACTIVATION_MODES,
  parseActivationPolicy,
  discoverFirstPartySkillIds,
  validateActivationPolicy,
  loadActivationPolicy,
  getSkillPolicy,
  skillIdsByMode,
};
