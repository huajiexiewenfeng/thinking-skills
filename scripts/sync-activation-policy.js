const fs = require("node:fs");
const path = require("node:path");

const { loadActivationPolicy, skillIdsByMode } = require("./activation-policy");
const { hasCurrentRequestExplicitSkillInvocation } = require("./explicit-skill-invocation");
const { validateActivationCorpus } = require("./activation-corpus-contract");

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

function renderGeneratedFileWithExistingEol(generatedText, existingText) {
  const normalized = generatedText.replace(/\r\n?/g, "\n");
  const existingEol = /\r\n|\n/.exec(existingText)?.[0] ?? "\n";
  return normalized.replace(/\n/g, existingEol);
}

function requireMode(entry, skillId) {
  if (!entry || !VALID_MODES.has(entry.mode)) {
    throw new Error(`Skill ${skillId} has unsupported activation mode: ${entry?.mode}`);
  }
}

function renderSkillFrontmatterDescription(entry, skillId) {
  requireMode(entry, skillId);
  let description;
  if (entry.mode === "auto") description = entry.auto_description;
  if (entry.mode === "explicit") {
    description = `Use only when the current user request directly invokes \`$thinking-skills:${skillId}\` or combines a direct invocation command with the exact canonical name \`${skillId}\`. Do not activate from ordinary domain intent, depth language, mention, evaluation, modification, quoted data, prior turns, or component handoff.`;
  }
  if (entry.mode === "disabled") {
    description = `Unavailable under the current Thinking Skills activation policy. Do not select, load, follow, announce, or claim to have run \`${skillId}\`.`;
  }
  return JSON.stringify(description);
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
  validateActivationCorpus({ repoRoot: resolvedRoot, policy });
  const recoveryRoot = path.join(resolvedRoot, ...RECOVERY_ROOT_SEGMENTS);
  const lockPath = path.join(resolvedRoot, ".superpowers", "sdd", "activation-policy-sync.lock");
  const plan = [];
  const plannedIdentities = new Map();
  validateFilesystemPath(resolvedRoot, recoveryRoot, { expectedKind: "directory" });
  validateFilesystemPath(resolvedRoot, lockPath, { expectedKind: "file" });

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
        plan.push({
          path: filePath,
          before,
          after: renderGeneratedFileWithExistingEol(desired.get(entry.name), before),
        });
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
    recoveryRoot,
    lockPath,
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
  validateFilesystemPath(metadata.repoRoot, metadata.recoveryRoot, {
    expectedKind: "directory",
  }, fsImpl);
  validateFilesystemPath(metadata.repoRoot, metadata.lockPath, {
    expectedKind: "file",
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

function recordArtifact(artifactPaths, artifactPath) {
  if (!artifactPaths.includes(artifactPath)) artifactPaths.push(artifactPath);
  return artifactPath;
}

function attachPersistentPaths(value, artifactPaths, recoveryPaths) {
  const combinedArtifacts = [...(value.artifactPaths ?? []), ...artifactPaths];
  const combinedRecoveries = [...(value.recoveryPaths ?? []), ...recoveryPaths];
  Object.defineProperty(value, "artifactPaths", {
    value: Object.freeze([...new Set(combinedArtifacts)]),
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(value, "recoveryPaths", {
    value: Object.freeze([...new Set(combinedRecoveries)]),
    enumerable: false,
    configurable: true,
  });
  return value;
}

function ensureDirectoryChain(metadata, segments, fsImpl, artifactPaths) {
  let directory = metadata.repoRoot;
  for (const segment of segments) {
    directory = path.join(directory, segment);
    const validation = validateFilesystemPath(metadata.repoRoot, directory, {
      expectedKind: "directory",
    }, fsImpl);
    if (validation.exists) continue;
    try {
      fsImpl.mkdirSync(directory, { mode: 0o700 });
      recordArtifact(artifactPaths, directory);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    validateFilesystemPath(metadata.repoRoot, directory, {
      mustExist: true,
      expectedKind: "directory",
    }, fsImpl);
  }
  return directory;
}

function ensureGeneratedFixtureRoot(metadata, changes, fsImpl, artifactPaths) {
  if (!changes.some((item) => item.before === null && item.after !== null)) return;
  const generatedParent = path.dirname(metadata.generatedRoot);
  const benchmarksRoot = path.dirname(generatedParent);
  validateFilesystemPath(metadata.repoRoot, benchmarksRoot, {
    mustExist: true,
    expectedKind: "directory",
  }, fsImpl);
  for (const directory of [generatedParent, metadata.generatedRoot]) {
    const validation = validateFilesystemPath(metadata.repoRoot, directory, {
      expectedKind: "directory",
    }, fsImpl);
    if (validation.exists) continue;
    try {
      fsImpl.mkdirSync(directory);
      recordArtifact(artifactPaths, directory);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    validateFilesystemPath(metadata.repoRoot, directory, {
      mustExist: true,
      expectedKind: "directory",
    }, fsImpl);
  }
}

function createTransactionDirectory(metadata, fsImpl, artifactPaths) {
  const transactionDirectory = fsImpl.mkdtempSync(path.join(metadata.recoveryRoot, "transaction-"));
  validateFilesystemPath(metadata.repoRoot, transactionDirectory, {
    mustExist: true,
    expectedKind: "directory",
  }, fsImpl);
  recordArtifact(artifactPaths, transactionDirectory);
  return transactionDirectory;
}

function transactionItemPath(metadata, transactionDirectory, item, index, kind) {
  const relativeTarget = path.relative(metadata.repoRoot, item.path)
    .replace(/[^a-zA-Z0-9._-]+/g, "_");
  return path.join(
    transactionDirectory,
    `${String(index).padStart(4, "0")}-${relativeTarget}-${kind}`,
  );
}

function prepareFile(item, preparedPath, metadata, fsImpl, artifactPaths) {
  validateFilesystemPath(metadata.repoRoot, preparedPath, { expectedKind: "file" }, fsImpl);
  let descriptor;
  try {
    descriptor = fsImpl.openSync(preparedPath, "wx", 0o600);
    recordArtifact(artifactPaths, preparedPath);
    fsImpl.writeFileSync(descriptor, item.after, "utf8");
    fsImpl.closeSync(descriptor);
    descriptor = undefined;
    validateFilesystemPath(metadata.repoRoot, preparedPath, {
      mustExist: true,
      expectedKind: "file",
    }, fsImpl);
    const identity = fileIdentityIfPresent(preparedPath, fsImpl);
    if (fsImpl.readFileSync(preparedPath, "utf8") !== item.after) {
      throw new Error(`${preparedPath}: prepared activation content changed after creation`);
    }
    return Object.freeze({ path: preparedPath, identity });
  } catch (error) {
    const cleanupWarnings = [];
    if (descriptor !== undefined) {
      try {
        fsImpl.closeSync(descriptor);
      } catch (cleanupError) {
        cleanupWarnings.push(cleanupWarning("temp-close", {
          targetPath: item.path,
          tempPath: preparedPath,
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

function acquireGlobalSyncLock(metadata, fsImpl) {
  let descriptor;
  try {
    descriptor = fsImpl.openSync(metadata.lockPath, "wx", 0o600);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const lockError = new Error(`${metadata.lockPath}: global activation sync lock already exists`, {
      cause: error,
    });
    lockError.code = "EEXIST";
    throw lockError;
  }
  const token = `${process.pid}:${Date.now()}:${Math.random().toString(16).slice(2)}\n`;
  try {
    fsImpl.writeFileSync(descriptor, token, "utf8");
    const identity = Object.freeze((() => {
      const stats = fsImpl.fstatSync(descriptor, { bigint: true });
      return { dev: stats.dev.toString(), ino: stats.ino.toString() };
    })());
    requireFileIdentity(metadata.lockPath, identity, fsImpl, "global activation sync lock identity changed during acquisition");
    return { path: metadata.lockPath, descriptor, identity, token };
  } catch (error) {
    try {
      fsImpl.closeSync(descriptor);
    } catch {
      // The named lock is intentionally retained for manual recovery.
    }
    throw attachPersistentPaths(error, [metadata.lockPath], []);
  }
}

function releaseGlobalSyncLock(lock, transactionDirectory, metadata, fsImpl, artifactPaths, cleanupWarnings) {
  if (!lock) return;
  let releaseDirectory = transactionDirectory;
  let releasePath = null;
  let moved = false;
  try {
    if (!releaseDirectory) {
      releaseDirectory = fsImpl.mkdtempSync(path.join(
        path.dirname(lock.path),
        "activation-policy-lock-release-",
      ));
      validateFilesystemPath(metadata.repoRoot, releaseDirectory, {
        mustExist: true,
        expectedKind: "directory",
      }, fsImpl);
      recordArtifact(artifactPaths, releaseDirectory);
    }
    releasePath = path.join(releaseDirectory, "sync-lock-released");
    validateFilesystemPath(metadata.repoRoot, lock.path, {
      mustExist: true,
      expectedKind: "file",
    }, fsImpl);
    requireFileIdentity(
      lock.path,
      lock.identity,
      fsImpl,
      "global activation sync lock identity changed before release; manual recovery required",
    );
    if (fsImpl.readFileSync(lock.path, "utf8") !== lock.token) {
      throw new Error(`${lock.path}: global activation sync lock content changed before release; manual recovery required`);
    }
    validateFilesystemPath(metadata.repoRoot, releasePath, { expectedKind: "file" }, fsImpl);
    fsImpl.renameSync(lock.path, releasePath);
    moved = true;
    recordArtifact(artifactPaths, releasePath);
    validateFilesystemPath(metadata.repoRoot, releasePath, {
      mustExist: true,
      expectedKind: "file",
    }, fsImpl);
    requireFileIdentity(
      releasePath,
      lock.identity,
      fsImpl,
      "released global activation sync lock identity changed; manual recovery required",
    );
    if (fsImpl.readFileSync(releasePath, "utf8") !== lock.token) {
      throw new Error(`${releasePath}: released global activation sync lock content changed; manual recovery required`);
    }
  } catch (error) {
    if (!moved) recordArtifact(artifactPaths, lock.path);
    cleanupWarnings.push(cleanupWarning("lock-release", {
      lockPath: lock.path,
      releasePath: moved ? releasePath : null,
    }, error));
  } finally {
    try {
      fsImpl.closeSync(lock.descriptor);
    } catch (error) {
      cleanupWarnings.push(cleanupWarning("lock-close", {
        lockPath: lock.path,
        releasePath: moved ? releasePath : null,
      }, error));
    }
  }
}

function moveTargetToRecovery(record, metadata, fsImpl, artifactPaths, recoveryPaths) {
  validateFilesystemPath(metadata.repoRoot, record.recoveryPath, { expectedKind: "file" }, fsImpl);
  fsImpl.renameSync(record.item.path, record.recoveryPath);
  record.targetMoved = true;
  recordArtifact(artifactPaths, record.recoveryPath);
  validateFilesystemPath(metadata.repoRoot, record.recoveryPath, {
    mustExist: true,
    expectedKind: "file",
  }, fsImpl);
  record.recoveryIdentity = fileIdentityIfPresent(record.recoveryPath, fsImpl);
  if (!sameFileIdentity(record.recoveryIdentity, record.authorized.identity)) {
    throw new Error(`${record.recoveryPath}: moved file identity does not match the transaction recovery identity`);
  }
  record.recoveryAuthorized = true;
  recoveryPaths.push(record.recoveryPath);
  if (fsImpl.readFileSync(record.recoveryPath, "utf8") !== record.item.before) {
    throw new Error(`${record.recoveryPath}: moved file content changed after planning; recovery retained`);
  }
}

function restoreArtifactLink(sourcePath, expectedIdentity, targetPath, metadata, fsImpl) {
  validateFilesystemPath(metadata.repoRoot, sourcePath, {
    mustExist: true,
    expectedKind: "file",
  }, fsImpl);
  requireFileIdentity(
    sourcePath,
    expectedIdentity,
    fsImpl,
    "persistent rollback source identity changed; manual recovery required",
  );
  validateFilesystemPath(metadata.repoRoot, targetPath, { expectedKind: "file" }, fsImpl);
  fsImpl.linkSync(sourcePath, targetPath);
  requireFileIdentity(
    targetPath,
    expectedIdentity,
    fsImpl,
    "restored target identity does not match its persistent artifact",
  );
}

function rollbackRecord(record, metadata, fsImpl, artifactPaths) {
  const rollbackErrors = [];
  if (record.installed) {
    const rollbackPath = record.rollbackPath;
    try {
      validateFilesystemPath(metadata.repoRoot, rollbackPath, { expectedKind: "file" }, fsImpl);
      fsImpl.renameSync(record.item.path, rollbackPath);
      recordArtifact(artifactPaths, rollbackPath);
      validateFilesystemPath(metadata.repoRoot, rollbackPath, {
        mustExist: true,
        expectedKind: "file",
      }, fsImpl);
      const movedIdentity = fileIdentityIfPresent(rollbackPath, fsImpl);
      const movedContents = fsImpl.readFileSync(rollbackPath, "utf8");
      record.installed = false;
      if (!sameFileIdentity(movedIdentity, record.installedIdentity)
        || movedContents !== record.item.after) {
        try {
          restoreArtifactLink(rollbackPath, movedIdentity, record.item.path, metadata, fsImpl);
        } catch (restoreError) {
          rollbackErrors.push(`${record.item.path}: ${restoreError.message}`);
        }
        rollbackErrors.push(
          `${record.item.path}: rollback moved an unexpected concurrent target; preserved at ${rollbackPath}`,
        );
        return rollbackErrors;
      }
    } catch (error) {
      rollbackErrors.push(`${record.item.path}: ${error.message}`);
      return rollbackErrors;
    }
  }

  if (record.targetMoved) {
    const sourceIdentity = record.recoveryAuthorized
      ? record.authorized.identity
      : record.recoveryIdentity;
    try {
      restoreArtifactLink(record.recoveryPath, sourceIdentity, record.item.path, metadata, fsImpl);
    } catch (error) {
      rollbackErrors.push(
        `rollback conflict for ${record.item.path}; persistent recovery retained at ${record.recoveryPath}: ${error.message}`,
      );
    }
  }
  return rollbackErrors;
}

function applyResult(paths, cleanupWarnings = [], recoveryPaths = [], artifactPaths = []) {
  Object.defineProperty(paths, "cleanupWarnings", {
    value: Object.freeze(cleanupWarnings),
    enumerable: false,
  });
  return attachPersistentPaths(paths, artifactPaths, recoveryPaths);
}

function applyActivationSyncPlan(plan, { fsImpl = fs } = {}) {
  const metadata = validateApplyPlan(plan, fsImpl);
  const changes = plan.filter((item) => item.before !== item.after);
  if (changes.length === 0) return applyResult([]);

  const prepared = new Map();
  const committed = [];
  const artifactPaths = [];
  const recoveryPaths = [];
  const cleanupWarnings = [];
  let transactionDirectory;
  let lock;
  let failure;
  try {
    ensureDirectoryChain(metadata, RECOVERY_ROOT_SEGMENTS.slice(0, 2), fsImpl, artifactPaths);
    lock = acquireGlobalSyncLock(metadata, fsImpl);
    ensureDirectoryChain(metadata, RECOVERY_ROOT_SEGMENTS, fsImpl, artifactPaths);
    transactionDirectory = createTransactionDirectory(metadata, fsImpl, artifactPaths);
    ensureGeneratedFixtureRoot(metadata, changes, fsImpl, artifactPaths);
    for (const [index, item] of changes.entries()) {
      validateFilesystemPath(metadata.repoRoot, item.path, {
        mustExist: item.before !== null,
        expectedKind: "file",
      }, fsImpl);
      if (item.after !== null) {
        const preparedPath = transactionItemPath(metadata, transactionDirectory, item, index, "prepared");
        prepared.set(item.path, prepareFile(item, preparedPath, metadata, fsImpl, artifactPaths));
      }
    }

    for (const [index, item] of plan.entries()) {
      if (currentContents(item, metadata, fsImpl) !== item.before) {
        throw new Error(`${item.path}: target changed after planning`);
      }
      if (item.before !== null) {
        requireFileIdentity(
          item.path,
          metadata.authorized[index].identity,
          fsImpl,
          "file identity changed after transaction preparation",
        );
      }
    }

    for (const [index, item] of changes.entries()) {
      const record = {
        item,
        authorized: metadata.authorizedByItem.get(item),
        targetMoved: false,
        recoveryPath: transactionItemPath(metadata, transactionDirectory, item, index, "original-recovery"),
        recoveryIdentity: null,
        recoveryAuthorized: false,
        installed: false,
        installedIdentity: null,
        rollbackPath: transactionItemPath(metadata, transactionDirectory, item, index, "rollback-installed"),
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
        moveTargetToRecovery(record, metadata, fsImpl, artifactPaths, recoveryPaths);
      }
      if (item.after !== null) {
        const preparedFile = prepared.get(item.path);
        validateFilesystemPath(metadata.repoRoot, preparedFile.path, {
          mustExist: true,
          expectedKind: "file",
        }, fsImpl);
        requireFileIdentity(
          preparedFile.path,
          preparedFile.identity,
          fsImpl,
          "prepared activation artifact identity changed before install",
        );
        validateFilesystemPath(metadata.repoRoot, item.path, { expectedKind: "file" }, fsImpl);
        fsImpl.linkSync(preparedFile.path, item.path);
        record.installed = true;
        record.installedIdentity = fileIdentityIfPresent(item.path, fsImpl);
        if (!sameFileIdentity(record.installedIdentity, preparedFile.identity)) {
          throw new Error(`${item.path}: installed target identity does not match prepared artifact`);
        }
      }
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const record of committed.reverse()) {
      rollbackErrors.push(...rollbackRecord(record, metadata, fsImpl, artifactPaths));
    }
    if (rollbackErrors.length > 0) {
      failure = attachCleanupWarnings(
        new Error(`${error.message}; rollback failed: ${rollbackErrors.join("; ")}`, { cause: error }),
        error.cleanupWarnings ?? [],
      );
    } else {
      failure = error;
    }
  } finally {
    if (lock) {
      releaseGlobalSyncLock(
        lock,
        transactionDirectory,
        metadata,
        fsImpl,
        artifactPaths,
        cleanupWarnings,
      );
    }
  }

  if (failure) {
    throw attachPersistentPaths(
      attachCleanupWarnings(failure, cleanupWarnings),
      artifactPaths,
      recoveryPaths,
    );
  }
  return applyResult(
    changes.map((item) => item.path),
    cleanupWarnings,
    recoveryPaths,
    artifactPaths,
  );
}

function formatCleanupWarning(warning) {
  if (warning.kind === "lock-release" || warning.kind === "lock-close") {
    const retainedPath = warning.releasePath ?? warning.lockPath;
    return `Activation policy lock warning: manual recovery required at ${retainedPath}: ${warning.message}`;
  }
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

function writePersistentArtifactReport(output, recoveryPaths, artifactPaths) {
  if (artifactPaths.length === 0 && recoveryPaths.length === 0) return;
  output.write(
    "Persistent activation-policy artifacts are intentionally retained; review them manually before removal.\n",
  );
  for (const recoveryPath of recoveryPaths) {
    output.write(`- recovery (named old inode): ${recoveryPath}\n`);
  }
  const recoverySet = new Set(recoveryPaths);
  for (const artifactPath of artifactPaths) {
    if (!recoverySet.has(artifactPath)) output.write(`- artifact: ${artifactPath}\n`);
  }
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
  writePersistentArtifactReport(stdout, applied.recoveryPaths, applied.artifactPaths);
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    for (const warning of error.cleanupWarnings ?? []) console.error(formatCleanupWarning(warning));
    writePersistentArtifactReport(process.stderr, error.recoveryPaths ?? [], error.artifactPaths ?? []);
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
