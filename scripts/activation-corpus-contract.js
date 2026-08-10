const fs = require("node:fs");
const path = require("node:path");

const {
  hasCurrentRequestExplicitSkillInvocation,
} = require("./explicit-skill-invocation");

const ROUTE_KINDS = new Set(["route", "integration"]);

function benchmarkSelections(item) {
  if (!ROUTE_KINDS.has(item.kind)) return [];
  return [
    item.expected_route?.primary,
    item.expected_route?.secondary,
    ...(Array.isArray(item.expected_advisory) ? item.expected_advisory : []),
  ].filter(Boolean);
}

function validateSelectedSkill(item, filePath, policy, skillId, label) {
  const entry = policy.skills[skillId];
  if (!entry) return;
  if (entry.mode === "disabled") {
    throw new Error(`${filePath}: ${label} selects disabled Skill ${skillId}`);
  }
  if (
    entry.mode === "explicit" &&
    !hasCurrentRequestExplicitSkillInvocation(item, skillId)
  ) {
    throw new Error(
      `${filePath}: ${label} selects explicit Skill ${skillId} without a valid current-request invocation`,
    );
  }
}

function validateBenchmarkActivationContract(item, filePath, policy) {
  if (ROUTE_KINDS.has(item.kind)) {
    for (const skillId of benchmarkSelections(item)) {
      validateSelectedSkill(item, filePath, policy, skillId, item.kind);
    }
    return;
  }
  if (item.kind !== "response") return;
  if (typeof item.skill !== "string" || !item.skill.trim()) {
    throw new Error(`${filePath}: response case must declare a non-empty skill`);
  }

  const skillId = item.skill;
  const entry = policy.skills[skillId];
  if (!entry) return;
  if (entry.mode === "disabled") {
    throw new Error(`${filePath}: response case targets disabled Skill ${skillId}`);
  }
  if (
    entry.mode === "explicit" &&
    !hasCurrentRequestExplicitSkillInvocation(item, skillId)
  ) {
    throw new Error(
      `${filePath}: response case declares explicit Skill ${skillId} without a valid current-request invocation`,
    );
  }
}

function unwrapTablePrompt(cell) {
  const pairs = new Map([["\"", "\""], ["'", "'"], ["“", "”"], ["‘", "’"]]);
  const closing = pairs.get(cell[0]);
  if (!closing || !cell.endsWith(closing)) return null;
  return cell.slice(1, -closing.length);
}

function evalPositivePrompts(text) {
  const prompts = [];
  let inPositiveTable = false;
  for (const line of text.split(/\r?\n/)) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      inPositiveTable = /^(?:Positive|Core) Cases$/i.test(heading[1]);
      continue;
    }
    if (!inPositiveTable || !/^\s*\|/.test(line)) continue;
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
    const prompt = unwrapTablePrompt(cells[0] || "");
    if (prompt !== null) prompts.push(prompt);
  }

  for (const match of text.matchAll(/^\s*prompt:\s*("(?:[^"\\]|\\.)*")\s*$/gm)) {
    prompts.push(JSON.parse(match[1]));
  }
  return prompts;
}

function validateEvalActivationContract(text, filePath, skillId, policy) {
  const entry = policy.skills[skillId];
  if (!entry) return;
  for (const prompt of evalPositivePrompts(text)) {
    if (entry.mode === "disabled") {
      throw new Error(`${filePath}: eval positive targets disabled Skill ${skillId}`);
    }
    if (
      entry.mode === "explicit" &&
      !hasCurrentRequestExplicitSkillInvocation(prompt, skillId)
    ) {
      throw new Error(
        `${filePath}: eval positive targets explicit Skill ${skillId} without a valid current-request invocation`,
      );
    }
  }
}

function walkJsonFiles(root, relativeSegments = []) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const segments = [...relativeSegments, entry.name];
    if (segments[0] === "generated" && segments[1] === "activation-policy") {
      continue;
    }
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkJsonFiles(filePath, segments));
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(filePath);
  }
  return files.sort();
}

function validateActivationCorpus({ repoRoot, policy }) {
  for (const filePath of walkJsonFiles(path.join(repoRoot, "benchmarks"))) {
    const item = JSON.parse(fs.readFileSync(filePath, "utf8"));
    validateBenchmarkActivationContract(item, filePath, policy);
  }

  const evalRoot = path.join(repoRoot, "evals");
  if (!fs.existsSync(evalRoot)) return;
  for (const entry of fs.readdirSync(evalRoot, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)-cases\.md$/.exec(entry.name);
    if (!match || !policy.skills[match[1]]) continue;
    const filePath = path.join(evalRoot, entry.name);
    validateEvalActivationContract(
      fs.readFileSync(filePath, "utf8"),
      filePath,
      match[1],
      policy,
    );
  }
}

module.exports = {
  evalPositivePrompts,
  validateActivationCorpus,
  validateBenchmarkActivationContract,
  validateEvalActivationContract,
};
