const fs = require("node:fs");
const path = require("node:path");

const { loadActivationPolicy, skillIdsByMode } = require("./activation-policy");

const GENERATED_HEADER = "Generated from config/activation-policy.yaml. Do not edit this block.";
const VALID_MODES = new Set(["auto", "explicit", "disabled"]);
const GENERATED_FIXTURE_SEGMENTS = ["benchmarks", "generated", "activation-policy"];
let uniqueFileCounter = 0;

function markerPair(regionId, filePath) {
  const extension = path.extname(filePath);
  if ([".js", ".mjs", ".cjs"].includes(extension)) {
    return [`// activation-policy:${regionId}:start`, `// activation-policy:${regionId}:end`];
  }
  if (extension === ".md" && path.basename(filePath) === "SKILL.md") {
    return regionId === "frontmatter"
      ? [`# activation-policy:${regionId}:start`, `# activation-policy:${regionId}:end`]
      : [`<!-- activation-policy:${regionId}:start -->`, `<!-- activation-policy:${regionId}:end -->`];
  }
  return [`<!-- activation-policy:${regionId}:start -->`, `<!-- activation-policy:${regionId}:end -->`];
}

function regionError(filePath, regionId, message) {
  throw new Error(`${filePath}: activation-policy region ${regionId}: ${message}`);
}

function isActivationMarker(line) {
  return /^(?:#|\/\/) activation-policy:[a-z0-9]+(?:-[a-z0-9]+)*:(?:start|end)$/.test(line)
    || /^<!-- activation-policy:[a-z0-9]+(?:-[a-z0-9]+)*:(?:start|end) -->$/.test(line);
}

function lineStartOffset(text, targetLine) {
  let offset = 0;
  for (let line = 0; line < targetLine; line += 1) {
    const newline = text.indexOf("\n", offset);
    if (newline === -1) throw new Error("Unable to locate validated activation-policy marker line");
    offset = newline + 1;
  }
  return offset;
}

function replaceOwnedRegion(text, regionId, generatedBody, filePath) {
  if (typeof text !== "string") throw new TypeError("text must be a string");
  if (typeof generatedBody !== "string") throw new TypeError("generatedBody must be a string");
  const [startMarker, endMarker] = markerPair(regionId, filePath);
  const lines = text.split(/\r?\n/);
  const startLines = [];
  const endLines = [];

  for (const [index, line] of lines.entries()) {
    if (line === startMarker) startLines.push(index);
    if (line === endMarker) endLines.push(index);
  }
  if (startLines.length !== 1 || endLines.length !== 1) {
    regionError(
      filePath,
      regionId,
      `expected exactly one start marker and one end marker; found ${startLines.length} start and ${endLines.length} end`,
    );
  }

  const startLine = startLines[0];
  const endLine = endLines[0];
  if (startLine >= endLine) regionError(filePath, regionId, "start marker must precede end marker");
  if (lines.slice(startLine + 1, endLine).some(isActivationMarker)) {
    regionError(filePath, regionId, "nested activation-policy markers are not allowed");
  }

  const startIndex = lineStartOffset(text, startLine);
  const endIndex = lineStartOffset(text, endLine);
  const body = generatedBody.replace(/\r\n?/g, "\n").replace(/^\n+|\n+$/g, "");
  const replacement = body === "" ? "\n" : `\n${body}\n`;
  return `${text.slice(0, startIndex + startMarker.length)}${replacement}${text.slice(endIndex)}`;
}

function requireMode(entry, skillId) {
  if (!entry || !VALID_MODES.has(entry.mode)) {
    throw new Error(`Skill ${skillId} has unsupported activation mode: ${entry?.mode}`);
  }
}

function renderSkillFrontmatterDescription(entry, skillId) {
  requireMode(entry, skillId);
  if (entry.mode === "auto") return entry.auto_description;
  if (entry.mode === "explicit") {
    return `Use only when the current user request directly invokes \`$thinking-skills:${skillId}\` or combines a direct invocation command with the exact canonical name \`${skillId}\`. Do not activate from ordinary domain intent, depth language, mention, evaluation, modification, quoted data, prior turns, or component handoff.`;
  }
  return `Unavailable under the current Thinking Skills activation policy. Do not select, load, follow, announce, or claim to have run \`${skillId}\`.`;
}

function renderSkillActivationGuard(entry, skillId) {
  requireMode(entry, skillId);
  if (entry.mode === "auto") {
    return `${GENERATED_HEADER}\n\nActivation mode: \`auto\`. This Skill is eligible under its authored domain boundaries. Cross-Skill routing remains owned by \`thinking-router\`.`;
  }
  if (entry.mode === "explicit") {
    return `${GENERATED_HEADER}\n\nActivation mode: \`explicit\`. Before following this file, verify a valid exact invocation of \`${skillId}\` in the current final user request. Mention, evaluation, configuration, quoted data, another component's handoff, and prior-turn invocation do not authorize it. Without valid invocation, return control to \`thinking-router\` and do not claim this Skill ran.`;
  }
  return `${GENERATED_HEADER}\n\nActivation mode: \`disabled\`. Return control to \`thinking-router\`. Do not follow this file, select, announce, hand off to, or claim to have run \`${skillId}\`, even after explicit invocation.`;
}

function sortedSkillIds(policy) {
  return Object.keys(policy.skills).sort();
}

function renderRouterPolicy(policy) {
  const rows = sortedSkillIds(policy).map((skillId) => `| \`${skillId}\` | \`${policy.skills[skillId].mode}\` |`);
  return [
    GENERATED_HEADER,
    "",
    "## Activation Modes",
    "",
    "| Skill | Mode |",
    "|---|---|",
    ...rows,
    "",
    "### Mode Rules",
    "",
    "- `auto`: eligible under the authored domain routing rules.",
    "- `explicit`: eligible only after valid exact invocation in the current final user request; otherwise its ordinary domain intent uses `native` unless another Auto Skill owns the deliverable.",
    "- `disabled`: never select, announce, load, or hand off; a direct invocation receives an unavailable response.",
    "",
    "An Explicit or Disabled Skill cannot be added as secondary merely because its subject matter is relevant. Evaluation of a named Skill remains `skill-evaluator`, with the named Skill treated as data, unless the same request validly invokes an enabled Explicit Skill.",
  ].join("\n");
}

function renderCursorPolicy(policy) {
  const modeLines = ["auto", "explicit", "disabled"].map((mode) => {
    const ids = skillIdsByMode(policy, mode).map((skillId) => `\`${skillId}\``).join(", ") || "_(none)_";
    return `- \`${mode}\`: ${ids}`;
  });
  return [
    GENERATED_HEADER,
    "",
    ...modeLines,
    "",
    "Explicit Skills require valid exact invocation in the current final user request. Disabled Skills are unavailable and must not be selected, loaded, announced, or handed off to.",
  ].join("\n");
}

function renderOpenCodePolicy(policy) {
  const lines = ["const activationPolicy = Object.freeze({"];
  for (const mode of ["auto", "explicit", "disabled"]) {
    lines.push(`  ${mode}: Object.freeze([`);
    for (const skillId of skillIdsByMode(policy, mode)) lines.push(`    ${JSON.stringify(skillId)},`);
    lines.push("  ]),");
  }
  lines.push("});");
  return lines.join("\n");
}

function renderReadmeActivationTable(policy, locale = "en") {
  if (locale !== "en" && locale !== "zh") throw new Error(`Unsupported activation table locale: ${locale}`);
  const translations = { auto: "自动", explicit: "显式调用", disabled: "关闭" };
  const heading = locale === "zh" ? "| Skill | 激活模式 |" : "| Skill | Activation mode |";
  const rows = sortedSkillIds(policy).map((skillId) => {
    const mode = policy.skills[skillId].mode;
    requireMode(policy.skills[skillId], skillId);
    return `| \`${skillId}\` | \`${locale === "zh" ? translations[mode] : mode}\` |`;
  });
  return [GENERATED_HEADER, "", heading, "|---|---|", ...rows].join("\n");
}

function renderActivationBenchmarkCases(policy) {
  const rendered = [];
  for (const skillId of sortedSkillIds(policy)) {
    const entry = policy.skills[skillId];
    requireMode(entry, skillId);
    if (entry.mode === "auto") continue;
    const suffix = entry.mode === "explicit" ? "explicit" : "disabled";
    const selected = entry.mode === "explicit" ? skillId : "native";
    const item = {
      id: `activation-${suffix}-${skillId}-001`,
      kind: "route",
      turns: [{
        role: "user",
        content: `$thinking-skills:${skillId} Help me work through this request.`,
      }],
      expected_route: { primary: selected, secondary: null },
      expected_advisory: [],
      must_not_select: entry.mode === "explicit" ? ["native", "no-skill"] : [skillId],
    };
    rendered.push({
      fileName: `${skillId}-${suffix}.json`,
      content: `${JSON.stringify(item, null, 2)}\n`,
    });
  }
  return rendered;
}

function hasAnySkillMarker(text) {
  return text.includes("activation-policy:frontmatter:") || text.includes("activation-policy:guard:");
}

function buildActivationSyncPlan({ repoRoot, policy }) {
  const resolvedRoot = path.resolve(repoRoot);
  const plan = [];

  for (const skillId of sortedSkillIds(policy)) {
    const filePath = path.join(resolvedRoot, "skills", skillId, "SKILL.md");
    if (!fs.existsSync(filePath)) continue;
    const before = fs.readFileSync(filePath, "utf8");
    if (!hasAnySkillMarker(before)) continue;
    const description = renderSkillFrontmatterDescription(policy.skills[skillId], skillId);
    let after = replaceOwnedRegion(
      before,
      "frontmatter",
      `description: ${description}`,
      filePath,
    );
    after = replaceOwnedRegion(after, "guard", renderSkillActivationGuard(policy.skills[skillId], skillId), filePath);
    plan.push({ path: filePath, before, after });
  }

  const generatedRoot = path.join(resolvedRoot, ...GENERATED_FIXTURE_SEGMENTS);
  if (fs.existsSync(generatedRoot)) {
    const desired = new Map(renderActivationBenchmarkCases(policy).map((item) => [item.fileName, item.content]));
    const entries = fs.readdirSync(generatedRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || path.extname(entry.name) !== ".json") {
        throw new Error(`${path.join(generatedRoot, entry.name)}: generated activation fixture directory accepts only JSON files`);
      }
      const filePath = path.join(generatedRoot, entry.name);
      const before = fs.readFileSync(filePath, "utf8");
      if (desired.has(entry.name)) {
        plan.push({ path: filePath, before, after: desired.get(entry.name) });
        desired.delete(entry.name);
      } else {
        plan.push({ path: filePath, before, after: null });
      }
    }
    for (const [fileName, after] of desired) {
      plan.push({ path: path.join(generatedRoot, fileName), before: null, after });
    }
  }

  return plan.sort((left, right) => left.path.localeCompare(right.path, "en"));
}

function checkActivationSyncPlan(plan) {
  return plan
    .filter((item) => item.before !== item.after)
    .map((item) => item.path)
    .sort((left, right) => left.localeCompare(right, "en"));
}

function isGeneratedFixturePath(filePath) {
  const parentParts = path.resolve(path.dirname(filePath)).split(path.sep).filter(Boolean);
  const expected = GENERATED_FIXTURE_SEGMENTS;
  if (parentParts.length < expected.length) return false;
  const suffix = parentParts.slice(-expected.length);
  return suffix.every((part, index) => part.toLowerCase() === expected[index]);
}

function validateApplyPlan(plan) {
  const seen = new Set();
  for (const item of plan) {
    if (!item || !path.isAbsolute(item.path)) throw new Error("Activation sync plan paths must be absolute");
    const normalized = path.resolve(item.path);
    const key = process.platform === "win32" ? normalized.toLowerCase() : normalized;
    if (seen.has(key)) throw new Error(`Duplicate activation sync target: ${item.path}`);
    seen.add(key);
    if (item.before !== null && typeof item.before !== "string") {
      throw new Error(`${item.path}: plan before must be a string or null`);
    }
    if (item.after !== null && typeof item.after !== "string") {
      throw new Error(`${item.path}: plan after must be a string or null`);
    }
    if ((item.before === null || item.after === null)
      && (!isGeneratedFixturePath(item.path) || path.extname(item.path) !== ".json")) {
      throw new Error(`${item.path}: creates and deletions are allowed only in the generated activation fixture directory`);
    }
  }
}

function nextSiblingPath(targetPath, kind, fsImpl) {
  for (;;) {
    uniqueFileCounter += 1;
    const candidate = `${targetPath}.activation-policy.${kind}-${process.pid}-${uniqueFileCounter}`;
    if (!fsImpl.existsSync(candidate)) return candidate;
  }
}

function prepareFile(item, fsImpl) {
  const tempPath = nextSiblingPath(item.path, "tmp", fsImpl);
  let descriptor;
  try {
    descriptor = fsImpl.openSync(tempPath, "wx");
    fsImpl.writeFileSync(descriptor, item.after, "utf8");
    fsImpl.closeSync(descriptor);
    descriptor = undefined;
    return tempPath;
  } catch (error) {
    if (descriptor !== undefined) {
      try { fsImpl.closeSync(descriptor); } catch {}
    }
    try { fsImpl.unlinkSync(tempPath); } catch {}
    throw error;
  }
}

function currentContents(item, fsImpl) {
  if (!fsImpl.existsSync(item.path)) return null;
  return fsImpl.readFileSync(item.path, "utf8");
}

function removeIfPresent(filePath, fsImpl) {
  if (!filePath || !fsImpl.existsSync(filePath)) return;
  fsImpl.unlinkSync(filePath);
}

function applyActivationSyncPlan(plan, { fsImpl = fs } = {}) {
  validateApplyPlan(plan);
  const changes = plan.filter((item) => item.before !== item.after);
  if (changes.length === 0) return [];

  const prepared = new Map();
  const committed = [];
  try {
    for (const item of changes) {
      if (item.after !== null) prepared.set(item.path, prepareFile(item, fsImpl));
    }

    for (const item of changes) {
      if (currentContents(item, fsImpl) !== item.before) {
        throw new Error(`${item.path}: target changed after planning`);
      }
    }

    for (const item of changes) {
      const record = {
        item,
        backupPath: null,
        installed: false,
      };
      committed.push(record);
      if (item.before !== null) {
        record.backupPath = nextSiblingPath(item.path, "bak", fsImpl);
        fsImpl.renameSync(item.path, record.backupPath);
      }
      if (item.after !== null) {
        fsImpl.renameSync(prepared.get(item.path), item.path);
        prepared.delete(item.path);
        record.installed = true;
      }
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const record of committed.reverse()) {
      try {
        if (record.installed) removeIfPresent(record.item.path, fsImpl);
        if (record.backupPath && fsImpl.existsSync(record.backupPath)) {
          fsImpl.renameSync(record.backupPath, record.item.path);
        }
      } catch (rollbackError) {
        rollbackErrors.push(`${record.item.path}: ${rollbackError.message}`);
      }
    }
    for (const tempPath of prepared.values()) {
      try { removeIfPresent(tempPath, fsImpl); } catch {}
    }
    if (rollbackErrors.length > 0) {
      throw new Error(`${error.message}; rollback failed: ${rollbackErrors.join("; ")}`, { cause: error });
    }
    throw error;
  }

  for (const record of committed) {
    if (record.backupPath) removeIfPresent(record.backupPath, fsImpl);
  }
  return changes.map((item) => item.path);
}

function parseCliArgs(argv) {
  const options = { check: false, help: false };
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--help") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function main(
  argv = process.argv.slice(2),
  {
    repoRoot = path.resolve(__dirname, ".."),
    stdout = process.stdout,
    stderr = process.stderr,
  } = {},
) {
  const options = parseCliArgs(argv);
  if (options.help) {
    stdout.write("Usage: node scripts/sync-activation-policy.js [--check] [--help]\n");
    return 0;
  }

  const policy = loadActivationPolicy({ repoRoot });
  const plan = buildActivationSyncPlan({ repoRoot, policy });
  const stale = checkActivationSyncPlan(plan);
  if (options.check) {
    if (stale.length > 0) {
      stderr.write(`Activation policy is stale:\n${stale.map((file) => `- ${file}`).join("\n")}\n`);
      return 1;
    }
    return 0;
  }

  applyActivationSyncPlan(plan);
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  GENERATED_HEADER,
  markerPair,
  replaceOwnedRegion,
  renderSkillFrontmatterDescription,
  renderSkillActivationGuard,
  renderRouterPolicy,
  renderCursorPolicy,
  renderOpenCodePolicy,
  renderReadmeActivationTable,
  renderActivationBenchmarkCases,
  buildActivationSyncPlan,
  checkActivationSyncPlan,
  applyActivationSyncPlan,
  parseCliArgs,
  main,
};
