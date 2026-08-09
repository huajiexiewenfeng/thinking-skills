const fs = require("node:fs");
const path = require("node:path");

const { loadActivationPolicy, skillIdsByMode } = require("./activation-policy");
const { hasCurrentRequestExplicitSkillInvocation } = require("./explicit-skill-invocation");

const GENERATED_HEADER = "Generated from config/activation-policy.yaml. Do not edit this block.";
const VALID_MODES = new Set(["auto", "explicit", "disabled"]);
const GENERATED_FIXTURE_SEGMENTS = ["benchmarks", "generated", "activation-policy"];
const PLAN_METADATA = Symbol("activation-policy-plan-metadata");
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
  const ownedText = text.slice(startIndex + startMarker.length, endIndex);
  const leadingBoundary = /^(\r\n|\n)/.exec(ownedText)?.[0] ?? "\n";
  const trailingBoundary = /(\r\n|\n)$/.exec(ownedText)?.[0] ?? leadingBoundary;
  const replacement = body === ""
    ? leadingBoundary
    : `${leadingBoundary}${body}${trailingBoundary}`;
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

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function routerExamplePrompt(requestCell) {
  const prompt = requestCell.trim();
  const quotePairs = [["\"", "\""], ["'", "'"], ["“", "”"], ["‘", "’"]];
  for (const [opening, closing] of quotePairs) {
    if (prompt.startsWith(opening) && prompt.endsWith(closing)) {
      return prompt.slice(opening.length, -closing.length);
    }
  }
  return prompt;
}

function validateRouterExamples(text, policy, filePath) {
  for (const line of text.split(/\r?\n/)) {
    if (!/^\|.*\b(?:Primary|Secondary):/i.test(line)) continue;
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
    if (cells.length < 2) continue;
    const request = cells[0];
    const route = cells.slice(1).join(" | ");
    for (const [skillId, entry] of Object.entries(policy.skills)) {
      requireMode(entry, skillId);
      const selected = new RegExp(
        `\\b(?:Primary|Secondary):\\s*\\x60?${escapeRegExp(skillId)}\\x60?(?:\\s*[;|]|\\s*$)`,
        "i",
      ).test(route);
      if (!selected || entry.mode === "auto") continue;
      if (entry.mode === "disabled") {
        throw new Error(`${skillId}: Router example selects disabled Skill`);
      }
      const currentRequest = {
        turns: [{ role: "user", content: routerExamplePrompt(request) }],
      };
      if (!hasCurrentRequestExplicitSkillInvocation(currentRequest, skillId)) {
        throw new Error(`${skillId}: Router example selects explicit Skill without valid exact invocation`);
      }
    }
  }
}

function addRequiredOwnedRegionTarget(plan, filePath, regionId, generatedBody, targetName) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${targetName} activation-policy runtime target is required but missing: ${filePath}`);
  }
  const before = fs.readFileSync(filePath, "utf8");
  const after = replaceOwnedRegion(before, regionId, generatedBody, filePath);
  plan.push({ path: filePath, before, after });
}

function buildActivationSyncPlan({ repoRoot, policy }) {
  const resolvedRoot = path.resolve(repoRoot);
  const plan = [];

  for (const skillId of sortedSkillIds(policy)) {
    const filePath = path.join(resolvedRoot, "skills", skillId, "SKILL.md");
    if (!fs.existsSync(filePath)) {
      throw new Error(`${skillId}: required Skill activation target is missing: ${filePath}`);
    }
    const before = fs.readFileSync(filePath, "utf8");
    const description = renderSkillFrontmatterDescription(policy.skills[skillId], skillId);
    let after = replaceOwnedRegion(
      before,
      "frontmatter",
      `description: ${description}`,
      filePath,
    );
    after = replaceOwnedRegion(after, "guard", renderSkillActivationGuard(policy.skills[skillId], skillId), filePath);
    if (skillId === "thinking-router") {
      after = replaceOwnedRegion(after, "router", renderRouterPolicy(policy), filePath);
      validateRouterExamples(after, policy, filePath);
    }
    plan.push({ path: filePath, before, after });
  }

  addRequiredOwnedRegionTarget(
    plan,
    path.join(resolvedRoot, ".cursor", "rules", "thinking-skills.mdc"),
    "cursor",
    renderCursorPolicy(policy),
    "Cursor",
  );
  addRequiredOwnedRegionTarget(
    plan,
    path.join(resolvedRoot, ".opencode", "plugins", "thinking-skills.js"),
    "runtime",
    renderOpenCodePolicy(policy),
    "OpenCode",
  );

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

  plan.sort((left, right) => left.path.localeCompare(right.path, "en"));
  Object.defineProperty(plan, PLAN_METADATA, {
    value: Object.freeze({
      repoRoot: resolvedRoot,
      generatedRoot,
    }),
    enumerable: false,
  });
  return plan;
}

function checkActivationSyncPlan(plan) {
  return plan
    .filter((item) => item.before !== item.after)
    .map((item) => item.path)
    .sort((left, right) => left.localeCompare(right, "en"));
}

function comparablePath(filePath) {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function validateApplyPlan(plan) {
  if (!Array.isArray(plan)) throw new Error("Activation sync plan must be an array");
  const metadata = plan[PLAN_METADATA];
  const trustedGeneratedRoot = metadata
    && comparablePath(metadata.generatedRoot)
      === comparablePath(path.join(metadata.repoRoot, ...GENERATED_FIXTURE_SEGMENTS))
    ? metadata.generatedRoot
    : null;
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
    if ((item.before === null || item.after === null) && (
      trustedGeneratedRoot === null
      || comparablePath(path.dirname(item.path)) !== comparablePath(trustedGeneratedRoot)
      || path.extname(item.path) !== ".json"
    )) {
      throw new Error(
        `${item.path}: creates and deletions require the trusted repository generated fixture root (generated activation fixture directory)`,
      );
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

function cleanupWarning(kind, paths, error) {
  return Object.freeze({
    kind,
    ...paths,
    message: error.message,
    code: error.code,
  });
}

function attachCleanupWarnings(error, cleanupWarnings) {
  if (cleanupWarnings.length === 0) return error;
  const combined = [...(error.cleanupWarnings ?? []), ...cleanupWarnings];
  Object.defineProperty(error, "cleanupWarnings", {
    value: Object.freeze(combined),
    enumerable: false,
    configurable: true,
  });
  return error;
}

function prepareFile(item, fsImpl) {
  const tempPath = nextSiblingPath(item.path, "tmp", fsImpl);
  let descriptor;
  let ownsTemp = false;
  try {
    descriptor = fsImpl.openSync(tempPath, "wx");
    ownsTemp = true;
    fsImpl.writeFileSync(descriptor, item.after, "utf8");
    fsImpl.closeSync(descriptor);
    descriptor = undefined;
    return tempPath;
  } catch (error) {
    const cleanupWarnings = [];
    if (descriptor !== undefined) {
      try {
        fsImpl.closeSync(descriptor);
      } catch (cleanupError) {
        cleanupWarnings.push(cleanupWarning("temp-close", {
          targetPath: item.path,
          tempPath,
        }, cleanupError));
      }
    }
    if (ownsTemp) {
      try {
        fsImpl.unlinkSync(tempPath);
      } catch (cleanupError) {
        cleanupWarnings.push(cleanupWarning("temp-file", {
          targetPath: item.path,
          tempPath,
        }, cleanupError));
      }
    }
    throw attachCleanupWarnings(error, cleanupWarnings);
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

function cleanupPreparedTemp(targetPath, tempPath, fsImpl, cleanupWarnings) {
  try {
    removeIfPresent(tempPath, fsImpl);
  } catch (error) {
    cleanupWarnings.push(cleanupWarning("temp-file", { targetPath, tempPath }, error));
  }
}

function allocateBackupDirectory(record, fsImpl) {
  const prefix = path.join(
    path.dirname(record.item.path),
    `${path.basename(record.item.path)}.activation-policy.bak-`,
  );
  record.backupDirectory = fsImpl.mkdtempSync(prefix);
  record.backupPath = path.join(record.backupDirectory, "original");
}

function cleanupBackupArtifacts(record, fsImpl, cleanupWarnings) {
  if (!record.backupDirectory) return;
  if (record.backupCreated) {
    try {
      removeIfPresent(record.backupPath, fsImpl);
      record.backupCreated = false;
    } catch (error) {
      cleanupWarnings.push(cleanupWarning("backup-file", {
        targetPath: record.item.path,
        backupPath: record.backupPath,
        backupDirectory: record.backupDirectory,
      }, error));
      return;
    }
  }
  try {
    fsImpl.rmdirSync(record.backupDirectory);
    record.backupDirectory = null;
    record.backupPath = null;
  } catch (error) {
    cleanupWarnings.push(cleanupWarning("backup-directory", {
      targetPath: record.item.path,
      backupPath: record.backupPath,
      backupDirectory: record.backupDirectory,
    }, error));
  }
}

function applyResult(paths, cleanupWarnings = []) {
  Object.defineProperty(paths, "cleanupWarnings", {
    value: Object.freeze(cleanupWarnings),
    enumerable: false,
  });
  return paths;
}

function applyActivationSyncPlan(plan, { fsImpl = fs } = {}) {
  validateApplyPlan(plan);
  const changes = plan.filter((item) => item.before !== item.after);
  if (changes.length === 0) return applyResult([]);

  const prepared = new Map();
  const committed = [];
  try {
    for (const item of changes) {
      if (item.after !== null) prepared.set(item.path, prepareFile(item, fsImpl));
    }

    for (const item of plan) {
      if (currentContents(item, fsImpl) !== item.before) {
        throw new Error(`${item.path}: target changed after planning`);
      }
    }

    for (const item of changes) {
      const record = {
        item,
        backupDirectory: null,
        backupPath: null,
        backupCreated: false,
        targetMoved: false,
        installed: false,
        expectedCurrent: item.before,
      };
      committed.push(record);
      if (item.before !== null) {
        allocateBackupDirectory(record, fsImpl);
        fsImpl.renameSync(item.path, record.backupPath);
        record.backupCreated = true;
        record.targetMoved = true;
        record.expectedCurrent = null;
      }
      if (item.after !== null) {
        fsImpl.renameSync(prepared.get(item.path), item.path);
        prepared.delete(item.path);
        record.installed = true;
        record.expectedCurrent = item.after;
      }
    }
  } catch (error) {
    const rollbackErrors = [];
    const cleanupWarnings = [];
    for (const record of committed.reverse()) {
      try {
        if (!record.targetMoved && !record.installed) {
          cleanupBackupArtifacts(record, fsImpl, cleanupWarnings);
          continue;
        }
        const actual = currentContents(record.item, fsImpl);
        if (actual !== record.expectedCurrent) {
          const backup = record.backupCreated ? record.backupPath : "<no transaction backup>";
          rollbackErrors.push(
            `rollback conflict for ${record.item.path}; original backup preserved at ${backup}`,
          );
          continue;
        }
        if (record.installed) {
          removeIfPresent(record.item.path, fsImpl);
          record.installed = false;
          record.expectedCurrent = null;
        }
        if (record.targetMoved && record.backupCreated) {
          fsImpl.renameSync(record.backupPath, record.item.path);
          record.backupCreated = false;
          record.targetMoved = false;
          record.expectedCurrent = record.item.before;
        }
        cleanupBackupArtifacts(record, fsImpl, cleanupWarnings);
      } catch (rollbackError) {
        rollbackErrors.push(`${record.item.path}: ${rollbackError.message}`);
      }
    }
    for (const [targetPath, tempPath] of prepared) {
      cleanupPreparedTemp(targetPath, tempPath, fsImpl, cleanupWarnings);
    }
    if (rollbackErrors.length > 0) {
      throw attachCleanupWarnings(
        new Error(`${error.message}; rollback failed: ${rollbackErrors.join("; ")}`, { cause: error }),
        [...(error.cleanupWarnings ?? []), ...cleanupWarnings],
      );
    }
    throw attachCleanupWarnings(error, cleanupWarnings);
  }

  const cleanupWarnings = [];
  for (const record of committed) {
    cleanupBackupArtifacts(record, fsImpl, cleanupWarnings);
  }
  return applyResult(changes.map((item) => item.path), cleanupWarnings);
}

function formatCleanupWarning(warning) {
  if (warning.kind === "temp-file" || warning.kind === "temp-close") {
    return `Activation policy cleanup warning: retained temp ${warning.tempPath} for ${warning.targetPath}: ${warning.message}`;
  }
  const retainedPath = warning.kind === "backup-directory"
    ? warning.backupDirectory
    : warning.backupPath;
  return `Activation policy cleanup warning: retained backup ${retainedPath} for ${warning.targetPath}: ${warning.message}`;
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
    fsImpl = fs,
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

  const applied = applyActivationSyncPlan(plan, { fsImpl });
  for (const warning of applied.cleanupWarnings) {
    stderr.write(`${formatCleanupWarning(warning)}\n`);
  }
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    for (const warning of error.cleanupWarnings ?? []) console.error(formatCleanupWarning(warning));
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
