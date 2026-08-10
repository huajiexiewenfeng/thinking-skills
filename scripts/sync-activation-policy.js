const fs = require("node:fs");
const path = require("node:path");

const { loadActivationPolicy, skillIdsByMode } = require("./activation-policy");
const { hasCurrentRequestExplicitSkillInvocation } = require("./explicit-skill-invocation");

const GENERATED_HEADER = "Generated from config/activation-policy.yaml. Do not edit this block.";
const VALID_MODES = new Set(["auto", "explicit", "disabled"]);
const README_MODE_PRESENTATION = Object.freeze({
  auto: Object.freeze({
    en: Object.freeze({ label: "auto", behavior: "Eligible for intent-based selection." }),
    zh: Object.freeze({ label: "自动", behavior: "可根据请求意图选择。" }),
  }),
  explicit: Object.freeze({
    en: Object.freeze({
      label: "explicit",
      behavior: "Requires exact invocation in the current user request.",
    }),
    zh: Object.freeze({ label: "显式调用", behavior: "需要在当前用户请求中精确调用。" }),
  }),
  disabled: Object.freeze({
    en: Object.freeze({
      label: "disabled",
      behavior: "Unavailable; platform enforcement is required.",
    }),
    zh: Object.freeze({ label: "关闭", behavior: "不可用；需要平台强制执行。" }),
  }),
});
const GENERATED_FIXTURE_SEGMENTS = ["benchmarks", "generated", "activation-policy"];
const RECOVERY_ROOT_SEGMENTS = [".superpowers", "sdd", "activation-policy-recovery"];
const PLAN_TRUST = new WeakMap();
const ACTIVATION_BENCHMARK_PROFILES = Object.freeze({
  "article-visual-director": Object.freeze({
    domain: "content",
    objective: "deliver",
    mutation: "requested",
    artifact: "visual system",
    artifact_sink: "workspace",
  }),
  "benchmark-assistant": Object.freeze({
    domain: "meta",
    objective: "review",
    mutation: "none",
    artifact: "benchmark analysis",
    artifact_sink: "chat",
  }),
  "content-creator": Object.freeze({
    domain: "content",
    objective: "deliver",
    mutation: "none",
    artifact: "content draft",
    artifact_sink: "chat",
  }),
  "conversation-review": Object.freeze({
    domain: "meta",
    objective: "review",
    mutation: "none",
    artifact: "conversation review",
    artifact_sink: "chat",
  }),
  "emotional-support": Object.freeze({
    domain: "emotional",
    objective: "explore",
    mutation: "none",
    artifact: "support",
    artifact_sink: "chat",
  }),
  "learning-coach": Object.freeze({
    domain: "learning",
    objective: "explore",
    mutation: "none",
    artifact: "guided understanding",
    artifact_sink: "chat",
  }),
  "skill-evaluator": Object.freeze({
    domain: "meta",
    objective: "review",
    mutation: "none",
    artifact: "skill evaluation",
    artifact_sink: "chat",
  }),
  "technical-deep-dive": Object.freeze({
    domain: "technical",
    objective: "explore",
    mutation: "none",
    artifact: "analysis",
    artifact_sink: "chat",
  }),
  "thinking-router": Object.freeze({
    domain: "meta",
    objective: "decide",
    mutation: "none",
    artifact: "routing decision",
    artifact_sink: "chat",
  }),
});
const DEFAULT_ACTIVATION_BENCHMARK_PROFILE = Object.freeze({
  domain: "none",
  objective: "explore",
  mutation: "none",
  artifact: "activation result",
  artifact_sink: "chat",
});
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
  const normalizedBody = generatedBody.replace(/\r\n?/g, "\n").replace(/^\n+|\n+$/g, "");
  const ownedText = text.slice(startIndex + startMarker.length, endIndex);
  const leadingBoundary = /^(\r\n|\n)/.exec(ownedText)?.[0] ?? "\n";
  const trailingBoundary = /(\r\n|\n)$/.exec(ownedText)?.[0] ?? leadingBoundary;
  const body = normalizedBody.replace(/\n/g, leadingBoundary);
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
  const heading = locale === "zh"
    ? "| Skill | 激活模式 | 行为 |"
    : "| Skill | Activation mode | Behavior |";
  const rows = Object.keys(policy.skills).map((skillId) => {
    const mode = policy.skills[skillId].mode;
    requireMode(policy.skills[skillId], skillId);
    const presentation = README_MODE_PRESENTATION[mode][locale];
    return `| \`${skillId}\` | \`${presentation.label}\` | ${presentation.behavior} |`;
  });
  return [GENERATED_HEADER, "", heading, "|---|---|---|", ...rows].join("\n");
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
      expected_profile: {
        ...(ACTIVATION_BENCHMARK_PROFILES[skillId] ?? DEFAULT_ACTIVATION_BENCHMARK_PROFILE),
      },
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

function lstatIfPresent(filePath, fsImpl) {
  try {
    return fsImpl.lstatSync(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function isWithinRoot(repoRoot, targetPath) {
  const relative = path.relative(repoRoot, targetPath);
  return relative === ""
    || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function canonicalizeRepoRoot(repoRoot, fsImpl = fs) {
  const canonicalRoot = path.resolve(fsImpl.realpathSync(path.resolve(repoRoot)));
  const rootStats = fsImpl.lstatSync(canonicalRoot);
  if (rootStats.isSymbolicLink() || !rootStats.isDirectory()) {
    throw new Error(`${repoRoot}: activation policy repository root must resolve to a real directory`);
  }
  return canonicalRoot;
}

function validateFilesystemPath(
  repoRoot,
  targetPath,
  { mustExist = false, expectedKind = "file" } = {},
  fsImpl = fs,
) {
  const normalizedTarget = path.resolve(targetPath);
  if (!isWithinRoot(repoRoot, normalizedTarget) || comparablePath(normalizedTarget) === comparablePath(repoRoot)) {
    throw new Error(`${targetPath}: activation sync target must stay inside the canonical repository root`);
  }

  const relative = path.relative(repoRoot, normalizedTarget);
  const segments = relative.split(path.sep).filter(Boolean);
  let current = repoRoot;
  let targetStats = null;
  let missing = false;
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    const stats = lstatIfPresent(current, fsImpl);
    if (stats === null) {
      missing = true;
      break;
    }
    if (stats.isSymbolicLink()) {
      throw new Error(`${current}: symbolic link, junction, or reparse point is not allowed in an activation sync path`);
    }
    const canonicalCurrent = path.resolve(fsImpl.realpathSync(current));
    if (comparablePath(canonicalCurrent) !== comparablePath(current)) {
      throw new Error(`${current}: symbolic link, junction, or reparse point is not allowed in an activation sync path`);
    }
    if (!isWithinRoot(repoRoot, canonicalCurrent)) {
      throw new Error(`${current}: activation sync path escapes the canonical repository root`);
    }
    const isTarget = index === segments.length - 1;
    if (!isTarget && !stats.isDirectory()) {
      throw new Error(`${current}: activation sync path ancestor must be a directory`);
    }
    if (isTarget) targetStats = stats;
  }

  if (mustExist && (missing || targetStats === null)) {
    throw new Error(`${targetPath}: required activation sync target is missing`);
  }
  if (targetStats !== null) {
    if (expectedKind === "directory" && !targetStats.isDirectory()) {
      throw new Error(`${targetPath}: activation sync path must be a directory`);
    }
    if (expectedKind === "file" && !targetStats.isFile()) {
      throw new Error(`${targetPath}: activation sync target must be a regular file`);
    }
  }
  return Object.freeze({ exists: targetStats !== null, stats: targetStats });
}

function fileIdentityIfPresent(filePath, fsImpl = fs) {
  let stats;
  try {
    stats = fsImpl.lstatSync(filePath, { bigint: true });
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  return Object.freeze({ dev: stats.dev.toString(), ino: stats.ino.toString() });
}

function sameFileIdentity(left, right) {
  return left !== null
    && right !== null
    && left.dev === right.dev
    && left.ino === right.ino;
}

function requireFileIdentity(filePath, expectedIdentity, fsImpl, message) {
  if (!sameFileIdentity(fileIdentityIfPresent(filePath, fsImpl), expectedIdentity)) {
    throw new Error(`${filePath}: ${message}`);
  }
}

function readPlannedFile(repoRoot, filePath, plannedIdentities) {
  validateFilesystemPath(repoRoot, filePath, { mustExist: true, expectedKind: "file" });
  const identity = fileIdentityIfPresent(filePath);
  const contents = fs.readFileSync(filePath, "utf8");
  if (!sameFileIdentity(identity, fileIdentityIfPresent(filePath))) {
    throw new Error(`${filePath}: file identity changed while planning activation sync`);
  }
  plannedIdentities.set(comparablePath(filePath), identity);
  return contents;
}

function addRequiredOwnedRegionTarget(
  plan,
  plannedIdentities,
  repoRoot,
  filePath,
  regionId,
  generatedBody,
  targetName,
) {
  const validation = validateFilesystemPath(repoRoot, filePath, {
    mustExist: true,
    expectedKind: "file",
  });
  if (!validation.exists) {
    throw new Error(`${targetName} activation-policy runtime target is required but missing: ${filePath}`);
  }
  const before = readPlannedFile(repoRoot, filePath, plannedIdentities);
  const after = replaceOwnedRegion(before, regionId, generatedBody, filePath);
  plan.push({ path: filePath, before, after });
}

function buildActivationSyncPlan({ repoRoot, policy }) {
  const resolvedRoot = canonicalizeRepoRoot(repoRoot);
  const plan = [];
  const plannedIdentities = new Map();

  for (const skillId of sortedSkillIds(policy)) {
    const filePath = path.join(resolvedRoot, "skills", skillId, "SKILL.md");
    const validation = validateFilesystemPath(resolvedRoot, filePath, {
      mustExist: true,
      expectedKind: "file",
    });
    if (!validation.exists) {
      throw new Error(`${skillId}: required Skill activation target is missing: ${filePath}`);
    }
    const before = readPlannedFile(resolvedRoot, filePath, plannedIdentities);
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
    plannedIdentities,
    resolvedRoot,
    path.join(resolvedRoot, ".cursor", "rules", "thinking-skills.mdc"),
    "cursor",
    renderCursorPolicy(policy),
    "Cursor",
  );
  addRequiredOwnedRegionTarget(
    plan,
    plannedIdentities,
    resolvedRoot,
    path.join(resolvedRoot, ".opencode", "plugins", "thinking-skills.js"),
    "runtime",
    renderOpenCodePolicy(policy),
    "OpenCode",
  );
  for (const [fileName, locale, targetName] of [
    ["README.md", "en", "English README"],
    ["README.zh.md", "zh", "Chinese README"],
  ]) {
    addRequiredOwnedRegionTarget(
      plan,
      plannedIdentities,
      resolvedRoot,
      path.join(resolvedRoot, fileName),
      "readme-table",
      renderReadmeActivationTable(policy, locale),
      targetName,
    );
  }

  const generatedRoot = path.join(resolvedRoot, ...GENERATED_FIXTURE_SEGMENTS);
  const desired = new Map(renderActivationBenchmarkCases(policy).map((item) => [item.fileName, item.content]));
  const generatedRootValidation = validateFilesystemPath(resolvedRoot, generatedRoot, {
    expectedKind: "directory",
  });
  if (generatedRootValidation.exists) {
    const entries = fs.readdirSync(generatedRoot, { withFileTypes: true });
    for (const entry of entries) {
      const filePath = path.join(generatedRoot, entry.name);
      validateFilesystemPath(resolvedRoot, filePath, {
        mustExist: true,
        expectedKind: "file",
      });
      if (!entry.isFile() || path.extname(entry.name) !== ".json") {
        throw new Error(`${filePath}: generated activation fixture directory accepts only JSON files and every entry must be regular`);
      }
      const before = readPlannedFile(resolvedRoot, filePath, plannedIdentities);
      if (desired.has(entry.name)) {
        plan.push({ path: filePath, before, after: desired.get(entry.name) });
        desired.delete(entry.name);
      } else {
        plan.push({ path: filePath, before, after: null });
      }
    }
  }
  for (const [fileName, after] of desired) {
    const filePath = path.join(generatedRoot, fileName);
    validateFilesystemPath(resolvedRoot, filePath, { expectedKind: "file" });
    plan.push({ path: filePath, before: null, after });
  }

  plan.sort((left, right) => left.path.localeCompare(right.path, "en"));
  for (const item of plan) Object.freeze(item);
  const authorized = Object.freeze(plan.map((item) => Object.freeze({
    item,
    path: item.path,
    before: item.before,
    after: item.after,
    identity: item.before === null ? null : plannedIdentities.get(comparablePath(item.path)),
  })));
  PLAN_TRUST.set(plan, Object.freeze({
    repoRoot: resolvedRoot,
    generatedRoot,
    recoveryRoot: path.join(resolvedRoot, ...RECOVERY_ROOT_SEGMENTS),
    authorized,
    authorizedByItem: new Map(authorized.map((entry) => [entry.item, entry])),
    authorizedTargets: new Set(authorized.map((entry) => comparablePath(entry.path))),
  }));
  return Object.freeze(plan);
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

function validateApplyPlan(plan, fsImpl) {
  if (!Array.isArray(plan)) throw new Error("Activation sync plan must be an array");
  const metadata = PLAN_TRUST.get(plan);
  if (!metadata) {
    throw new Error(
      "Activation sync plan is not a trusted activation sync plan; creates and deletions require the trusted repository generated fixture root (generated activation fixture directory)",
    );
  }
  if (!Object.isFrozen(plan) || plan.length !== metadata.authorized.length) {
    throw new Error("Activation sync plan does not match its exact authorized activation sync target set");
  }
  const canonicalRoot = canonicalizeRepoRoot(metadata.repoRoot, fsImpl);
  if (comparablePath(canonicalRoot) !== comparablePath(metadata.repoRoot)) {
    throw new Error(`${metadata.repoRoot}: trusted repository root changed after planning`);
  }
  if (comparablePath(metadata.generatedRoot)
    !== comparablePath(path.join(metadata.repoRoot, ...GENERATED_FIXTURE_SEGMENTS))) {
    throw new Error(`${metadata.generatedRoot}: trusted generated fixture root does not match the repository root`);
  }
  validateFilesystemPath(metadata.repoRoot, metadata.generatedRoot, {
    expectedKind: "directory",
  }, fsImpl);

  const seen = new Set();
  for (const [index, item] of plan.entries()) {
    const authorized = metadata.authorized[index];
    if (!authorized
      || item !== authorized.item
      || item.path !== authorized.path
      || item.before !== authorized.before
      || item.after !== authorized.after
      || !Object.isFrozen(item)
      || !metadata.authorizedTargets.has(comparablePath(item.path))) {
      throw new Error(`${item?.path ?? "<unknown>"}: item is not an authorized activation sync target`);
    }
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
    validateFilesystemPath(metadata.repoRoot, item.path, {
      mustExist: item.before !== null,
      expectedKind: "file",
    }, fsImpl);
    if (item.before !== null) {
      requireFileIdentity(item.path, authorized.identity, fsImpl, "file identity changed after planning");
    }
    if ((item.before === null || item.after === null) && (
      comparablePath(path.dirname(item.path)) !== comparablePath(metadata.generatedRoot)
      || path.extname(item.path) !== ".json"
    )) {
      throw new Error(
        `${item.path}: creates and deletions require the trusted repository generated fixture root (generated activation fixture directory)`,
      );
    }
  }
  return metadata;
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

function prepareFile(item, metadata, fsImpl) {
  const tempPath = nextSiblingPath(item.path, "tmp", fsImpl);
  validateFilesystemPath(metadata.repoRoot, tempPath, { expectedKind: "file" }, fsImpl);
  let descriptor;
  let ownsTemp = false;
  try {
    descriptor = fsImpl.openSync(tempPath, "wx");
    ownsTemp = true;
    fsImpl.writeFileSync(descriptor, item.after, "utf8");
    fsImpl.closeSync(descriptor);
    descriptor = undefined;
    validateFilesystemPath(metadata.repoRoot, tempPath, {
      mustExist: true,
      expectedKind: "file",
    }, fsImpl);
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
        removeIfPresent(tempPath, metadata, fsImpl);
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

function currentContents(item, metadata, fsImpl) {
  const validation = validateFilesystemPath(metadata.repoRoot, item.path, {
    expectedKind: "file",
  }, fsImpl);
  if (!validation.exists) return null;
  return fsImpl.readFileSync(item.path, "utf8");
}

function removeIfPresent(filePath, metadata, fsImpl) {
  if (!filePath) return;
  const validation = validateFilesystemPath(metadata.repoRoot, filePath, {
    expectedKind: "file",
  }, fsImpl);
  if (!validation.exists) return;
  fsImpl.unlinkSync(filePath);
}

function cleanupPreparedTemp(targetPath, tempPath, metadata, fsImpl, cleanupWarnings) {
  try {
    removeIfPresent(tempPath, metadata, fsImpl);
  } catch (error) {
    cleanupWarnings.push(cleanupWarning("temp-file", { targetPath, tempPath }, error));
  }
}

function ensureGeneratedFixtureRoot(metadata, changes, fsImpl, createdDirectories) {
  if (!changes.some((item) => item.before === null && item.after !== null)) return;
  const generatedRoot = metadata.generatedRoot;
  const generatedParent = path.dirname(generatedRoot);
  const benchmarksRoot = path.dirname(generatedParent);
  const benchmarksValidation = validateFilesystemPath(metadata.repoRoot, benchmarksRoot, {
    mustExist: true,
    expectedKind: "directory",
  }, fsImpl);
  if (!benchmarksValidation.exists) {
    throw new Error(`${benchmarksRoot}: benchmark root is required before generating activation fixtures`);
  }
  for (const directory of [generatedParent, generatedRoot]) {
    const validation = validateFilesystemPath(metadata.repoRoot, directory, {
      expectedKind: "directory",
    }, fsImpl);
    if (validation.exists) continue;
    fsImpl.mkdirSync(directory);
    createdDirectories.push(directory);
    validateFilesystemPath(metadata.repoRoot, directory, {
      mustExist: true,
      expectedKind: "directory",
    }, fsImpl);
  }
}

function ensureRecoveryRoot(metadata, changes, fsImpl, createdDirectories) {
  if (!changes.some((item) => item.before !== null)) return;
  let directory = metadata.repoRoot;
  for (const segment of RECOVERY_ROOT_SEGMENTS) {
    directory = path.join(directory, segment);
    const validation = validateFilesystemPath(metadata.repoRoot, directory, {
      expectedKind: "directory",
    }, fsImpl);
    if (validation.exists) continue;
    fsImpl.mkdirSync(directory);
    createdDirectories.push(directory);
    validateFilesystemPath(metadata.repoRoot, directory, {
      mustExist: true,
      expectedKind: "directory",
    }, fsImpl);
  }
}

function cleanupCreatedDirectories(createdDirectories, metadata, fsImpl, cleanupWarnings) {
  for (const directory of [...createdDirectories].reverse()) {
    try {
      const validation = validateFilesystemPath(metadata.repoRoot, directory, {
        expectedKind: "directory",
      }, fsImpl);
      if (!validation.exists) continue;
      fsImpl.rmdirSync(directory);
    } catch (error) {
      cleanupWarnings.push(cleanupWarning("generated-directory", { directory }, error));
    }
  }
}

function allocateBackupDirectory(record, metadata, fsImpl) {
  const prefix = path.join(
    path.dirname(record.item.path),
    `${path.basename(record.item.path)}.activation-policy.bak-`,
  );
  record.backupDirectory = fsImpl.mkdtempSync(prefix);
  validateFilesystemPath(metadata.repoRoot, record.backupDirectory, {
    mustExist: true,
    expectedKind: "directory",
  }, fsImpl);
  record.backupPath = path.join(record.backupDirectory, "original");
  validateFilesystemPath(metadata.repoRoot, record.backupPath, { expectedKind: "file" }, fsImpl);
}

function createRecoveryArtifact(record, metadata, fsImpl) {
  const relativeTarget = path.relative(metadata.repoRoot, record.item.path)
    .replace(/[^a-zA-Z0-9._-]+/g, "_");
  const recoveryBase = path.join(metadata.recoveryRoot, relativeTarget);
  for (;;) {
    const recoveryPath = nextSiblingPath(recoveryBase, "recovery", fsImpl);
    validateFilesystemPath(metadata.repoRoot, recoveryPath, { expectedKind: "file" }, fsImpl);
    try {
      fsImpl.linkSync(record.backupPath, recoveryPath);
      record.recoveryPath = recoveryPath;
      validateFilesystemPath(metadata.repoRoot, recoveryPath, {
        mustExist: true,
        expectedKind: "file",
      }, fsImpl);
      return;
    } catch (error) {
      if (error.code === "EEXIST") continue;
      throw error;
    }
  }
}

function cleanupRecoveryArtifact(record, metadata, fsImpl, cleanupWarnings) {
  if (!record.recoveryPath) return;
  try {
    removeIfPresent(record.recoveryPath, metadata, fsImpl);
    record.recoveryPath = null;
  } catch (error) {
    cleanupWarnings.push(cleanupWarning("recovery-file", {
      targetPath: record.item.path,
      recoveryPath: record.recoveryPath,
    }, error));
  }
}

function cleanupBackupArtifacts(record, metadata, fsImpl, cleanupWarnings) {
  if (!record.backupDirectory) return;
  if (record.backupCreated) {
    try {
      removeIfPresent(record.backupPath, metadata, fsImpl);
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
    const validation = validateFilesystemPath(metadata.repoRoot, record.backupDirectory, {
      expectedKind: "directory",
    }, fsImpl);
    if (!validation.exists) {
      record.backupDirectory = null;
      record.backupPath = null;
      return;
    }
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

function applyResult(paths, cleanupWarnings = [], recoveryPaths = []) {
  Object.defineProperty(paths, "cleanupWarnings", {
    value: Object.freeze(cleanupWarnings),
    enumerable: false,
  });
  Object.defineProperty(paths, "recoveryPaths", {
    value: Object.freeze(recoveryPaths),
    enumerable: false,
  });
  return paths;
}

function applyActivationSyncPlan(plan, { fsImpl = fs } = {}) {
  const metadata = validateApplyPlan(plan, fsImpl);
  const changes = plan.filter((item) => item.before !== item.after);
  if (changes.length === 0) return applyResult([]);

  const prepared = new Map();
  const committed = [];
  const createdDirectories = [];
  try {
    ensureGeneratedFixtureRoot(metadata, changes, fsImpl, createdDirectories);
    ensureRecoveryRoot(metadata, changes, fsImpl, createdDirectories);
    for (const item of changes) {
      validateFilesystemPath(metadata.repoRoot, item.path, {
        mustExist: item.before !== null,
        expectedKind: "file",
      }, fsImpl);
      if (item.after !== null) prepared.set(item.path, prepareFile(item, metadata, fsImpl));
    }

    for (const item of plan) {
      if (currentContents(item, metadata, fsImpl) !== item.before) {
        throw new Error(`${item.path}: target changed after planning`);
      }
    }

    for (const item of changes) {
      const record = {
        item,
        authorized: metadata.authorizedByItem.get(item),
        backupDirectory: null,
        backupPath: null,
        backupCreated: false,
        targetMoved: false,
        installed: false,
        installedIdentity: null,
        recoveryPath: null,
        expectedCurrent: item.before,
      };
      committed.push(record);
      if (currentContents(item, metadata, fsImpl) !== item.before) {
        throw new Error(`${item.path}: target changed during activation sync`);
      }
      if (item.before !== null) {
        requireFileIdentity(
          item.path,
          record.authorized.identity,
          fsImpl,
          "file identity changed during activation sync",
        );
        allocateBackupDirectory(record, metadata, fsImpl);
        validateFilesystemPath(metadata.repoRoot, item.path, {
          mustExist: true,
          expectedKind: "file",
        }, fsImpl);
        fsImpl.linkSync(item.path, record.backupPath);
        record.backupCreated = true;
        validateFilesystemPath(metadata.repoRoot, record.backupPath, {
          mustExist: true,
          expectedKind: "file",
        }, fsImpl);
        requireFileIdentity(
          record.backupPath,
          record.authorized.identity,
          fsImpl,
          "transaction backup does not name the authorized file identity",
        );
        if (fsImpl.readFileSync(record.backupPath, "utf8") !== item.before) {
          throw new Error(`${item.path}: target changed while creating its transaction backup`);
        }
        removeIfPresent(item.path, metadata, fsImpl);
        record.targetMoved = true;
        record.expectedCurrent = null;
      }
      if (item.after !== null) {
        const tempPath = prepared.get(item.path);
        validateFilesystemPath(metadata.repoRoot, tempPath, {
          mustExist: true,
          expectedKind: "file",
        }, fsImpl);
        validateFilesystemPath(metadata.repoRoot, item.path, { expectedKind: "file" }, fsImpl);
        fsImpl.linkSync(tempPath, item.path);
        record.installed = true;
        record.installedIdentity = fileIdentityIfPresent(item.path, fsImpl);
        record.expectedCurrent = item.after;
        removeIfPresent(tempPath, metadata, fsImpl);
        prepared.delete(item.path);
      }
    }
    for (const record of committed) {
      if (record.targetMoved && record.backupCreated) {
        createRecoveryArtifact(record, metadata, fsImpl);
      }
    }
  } catch (error) {
    const rollbackErrors = [];
    const cleanupWarnings = [];
    for (const record of committed.reverse()) {
      try {
        if (!record.targetMoved && !record.installed) {
          if (!record.backupCreated) {
            cleanupBackupArtifacts(record, metadata, fsImpl, cleanupWarnings);
            continue;
          }
          const targetIdentity = fileIdentityIfPresent(record.item.path, fsImpl);
          const backupIdentity = fileIdentityIfPresent(record.backupPath, fsImpl);
          if (targetIdentity === null) {
            record.targetMoved = true;
            record.expectedCurrent = null;
          } else if (sameFileIdentity(targetIdentity, backupIdentity)) {
            cleanupBackupArtifacts(record, metadata, fsImpl, cleanupWarnings);
            continue;
          } else {
            rollbackErrors.push(
              `rollback conflict for ${record.item.path}; original backup preserved at ${record.backupPath}`,
            );
            continue;
          }
        }
        const actual = currentContents(record.item, metadata, fsImpl);
        const installedIdentityChanged = record.installed
          && !sameFileIdentity(fileIdentityIfPresent(record.item.path, fsImpl), record.installedIdentity);
        if (actual !== record.expectedCurrent || installedIdentityChanged) {
          const backup = record.backupCreated ? record.backupPath : "<no transaction backup>";
          rollbackErrors.push(
            `rollback conflict for ${record.item.path}; original backup preserved at ${backup}`,
          );
          continue;
        }
        if (record.installed) {
          removeIfPresent(record.item.path, metadata, fsImpl);
          record.installed = false;
          record.installedIdentity = null;
          record.expectedCurrent = null;
        }
        if (record.targetMoved && record.backupCreated) {
          validateFilesystemPath(metadata.repoRoot, record.backupPath, {
            mustExist: true,
            expectedKind: "file",
          }, fsImpl);
          validateFilesystemPath(metadata.repoRoot, record.item.path, { expectedKind: "file" }, fsImpl);
          fsImpl.linkSync(record.backupPath, record.item.path);
          removeIfPresent(record.backupPath, metadata, fsImpl);
          record.backupCreated = false;
          record.targetMoved = false;
          record.expectedCurrent = record.item.before;
        }
        cleanupRecoveryArtifact(record, metadata, fsImpl, cleanupWarnings);
        cleanupBackupArtifacts(record, metadata, fsImpl, cleanupWarnings);
      } catch (rollbackError) {
        rollbackErrors.push(`${record.item.path}: ${rollbackError.message}`);
      }
    }
    for (const [targetPath, tempPath] of prepared) {
      cleanupPreparedTemp(targetPath, tempPath, metadata, fsImpl, cleanupWarnings);
    }
    cleanupCreatedDirectories(createdDirectories, metadata, fsImpl, cleanupWarnings);
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
    cleanupBackupArtifacts(record, metadata, fsImpl, cleanupWarnings);
  }
  return applyResult(
    changes.map((item) => item.path),
    cleanupWarnings,
    committed.map((record) => record.recoveryPath).filter(Boolean),
  );
}

function formatCleanupWarning(warning) {
  if (warning.kind === "generated-directory") {
    return `Activation policy cleanup warning: retained generated directory ${warning.directory}: ${warning.message}`;
  }
  if (warning.kind === "temp-file" || warning.kind === "temp-close") {
    return `Activation policy cleanup warning: retained temp ${warning.tempPath} for ${warning.targetPath}: ${warning.message}`;
  }
  if (warning.kind === "recovery-file") {
    return `Activation policy cleanup warning: retained recovery ${warning.recoveryPath} for ${warning.targetPath}: ${warning.message}`;
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
