const fs = require("node:fs");
const path = require("node:path");

const { loadActivationPolicy, skillIdsByMode } = require("./activation-policy");

const START_MARKER = "# thinking-skills activation-policy:start";
const END_MARKER = "# thinking-skills activation-policy:end";
const GENERATED_COMMENT = "# Generated from config/activation-policy.yaml. Apply with scripts/apply-codex-activation-policy.js.";
const OWNED_MARKER_PREFIX = "# thinking-skills activation-policy";
const PLAN_METADATA = new WeakMap();
let uniquePathCounter = 0;

function comparablePath(filePath) {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function samePath(left, right) {
  return comparablePath(left) === comparablePath(right);
}

function isWithin(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function resolveThroughExistingAncestor(filePath, fsImpl = fs) {
  let cursor = path.resolve(filePath);
  const missing = [];
  while (!fsImpl.existsSync(cursor)) {
    const parent = path.dirname(cursor);
    if (parent === cursor) throw new Error(`${filePath}: no existing path ancestor`);
    missing.push(path.basename(cursor));
    cursor = parent;
  }
  const real = fsImpl.realpathSync.native
    ? fsImpl.realpathSync.native(cursor)
    : fsImpl.realpathSync(cursor);
  return path.resolve(real, ...missing.reverse());
}

function requireAbsoluteTarget(filePath, optionName) {
  if (typeof filePath !== "string" || filePath.trim() === "") {
    throw new Error(`${optionName} is required`);
  }
  if (!path.isAbsolute(filePath)) throw new Error(`${optionName} must be an absolute path: ${filePath}`);
}

function escapeTomlBasicString(value) {
  return value.replace(/[\u0000-\u001f\u007f"\\]/g, (character) => {
    const simple = {
      "\b": "\\b",
      "\t": "\\t",
      "\n": "\\n",
      "\f": "\\f",
      "\r": "\\r",
      '"': '\\"',
      "\\": "\\\\",
    };
    return simple[character] ?? `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

function renderManagedBlock({ policy, skillsRoot }) {
  requireAbsoluteTarget(skillsRoot, "--skills-root");
  const lines = [START_MARKER, GENERATED_COMMENT];
  for (const skillId of skillIdsByMode(policy, "disabled")) {
    lines.push(
      "[[skills.config]]",
      `path = "${escapeTomlBasicString(path.join(skillsRoot, skillId, "SKILL.md"))}"`,
      "enabled = false",
    );
  }
  lines.push(END_MARKER);
  return lines.join("\n");
}

function tomlStatementBoundaries(text, configPath) {
  const boundaries = [];
  let stringMode = null;
  let squareDepth = 0;
  let curlyDepth = 0;

  for (const [lineIndex, line] of text.split(/\r?\n/).entries()) {
    boundaries.push(stringMode === null && squareDepth === 0 && curlyDepth === 0);
    for (let index = 0; index < line.length;) {
      if (stringMode === "multiline-basic") {
        if (line.startsWith('"""', index)) {
          let backslashes = 0;
          for (let cursor = index - 1; cursor >= 0 && line[cursor] === "\\"; cursor -= 1) backslashes += 1;
          if (backslashes % 2 === 0) {
            stringMode = null;
            index += 3;
            continue;
          }
        }
        index += 1;
        continue;
      }
      if (stringMode === "multiline-literal") {
        if (line.startsWith("'''", index)) {
          stringMode = null;
          index += 3;
        } else index += 1;
        continue;
      }
      if (stringMode === "basic") {
        if (line[index] === "\\") index += Math.min(2, line.length - index);
        else if (line[index] === '"') {
          stringMode = null;
          index += 1;
        } else index += 1;
        continue;
      }
      if (stringMode === "literal") {
        if (line[index] === "'") stringMode = null;
        index += 1;
        continue;
      }

      if (line[index] === "#") break;
      if (line.startsWith('"""', index)) {
        stringMode = "multiline-basic";
        index += 3;
      } else if (line.startsWith("'''", index)) {
        stringMode = "multiline-literal";
        index += 3;
      } else if (line[index] === '"') {
        stringMode = "basic";
        index += 1;
      } else if (line[index] === "'") {
        stringMode = "literal";
        index += 1;
      } else if (line[index] === "[") {
        squareDepth += 1;
        index += 1;
      } else if (line[index] === "]") {
        squareDepth -= 1;
        if (squareDepth < 0) throw new Error(`${configPath}: invalid TOML bracket context on line ${lineIndex + 1}`);
        index += 1;
      } else if (line[index] === "{") {
        curlyDepth += 1;
        index += 1;
      } else if (line[index] === "}") {
        curlyDepth -= 1;
        if (curlyDepth < 0) throw new Error(`${configPath}: invalid TOML inline-table context on line ${lineIndex + 1}`);
        index += 1;
      } else index += 1;
    }
    if (stringMode === "basic" || stringMode === "literal") {
      throw new Error(`${configPath}: unterminated TOML string on line ${lineIndex + 1}`);
    }
  }
  return boundaries;
}

function analyzeOwnedBlock(configBytes, configPath) {
  const text = configBytes.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(configBytes)) {
    throw new Error(`${configPath}: config must contain valid UTF-8 bytes`);
  }
  const lines = text.split(/\r?\n/);
  const statementBoundaries = tomlStatementBoundaries(text, configPath);
  const starts = [];
  const ends = [];
  const malformed = [];
  for (const [index, line] of lines.entries()) {
    if (line === START_MARKER) {
      if (!statementBoundaries[index]) {
        throw new Error(`${configPath}: owned marker must be a top-level TOML comment at a statement boundary`);
      }
      starts.push(index);
    } else if (line === END_MARKER) {
      if (!statementBoundaries[index]) {
        throw new Error(`${configPath}: owned marker must be a top-level TOML comment at a statement boundary`);
      }
      ends.push(index);
    }
    else if (line.trim().startsWith(OWNED_MARKER_PREFIX)) malformed.push(index);
  }

  if (starts.length === 0 && ends.length === 0 && malformed.length === 0) {
    return Object.freeze({ present: false, text });
  }
  if (starts.length !== 1 || ends.length !== 1) {
    throw new Error(
      `${configPath}: owned block markers require exactly one start and one end; found ${starts.length} start and ${ends.length} end`,
    );
  }
  if (starts[0] >= ends[0]) {
    throw new Error(`${configPath}: owned block start marker must precede the end marker`);
  }
  if (malformed.some((line) => line > starts[0] && line < ends[0])) {
    throw new Error(`${configPath}: nested or malformed owned block marker is not allowed`);
  }
  if (malformed.length > 0) {
    throw new Error(`${configPath}: malformed owned block marker is not allowed`);
  }

  let startCharacter = 0;
  for (let index = 0; index < starts[0]; index += 1) {
    const newline = text.indexOf("\n", startCharacter);
    if (newline === -1) throw new Error(`${configPath}: unable to locate validated start marker`);
    startCharacter = newline + 1;
  }
  let endCharacter = startCharacter;
  for (let index = starts[0]; index < ends[0]; index += 1) {
    const newline = text.indexOf("\n", endCharacter);
    if (newline === -1) throw new Error(`${configPath}: unable to locate validated end marker`);
    endCharacter = newline + 1;
  }
  const startByte = Buffer.byteLength(text.slice(0, startCharacter), "utf8");
  const endByte = Buffer.byteLength(text.slice(0, endCharacter + END_MARKER.length), "utf8");
  return Object.freeze({
    present: true,
    text,
    startByte,
    endByte,
    currentBlock: configBytes.subarray(startByte, endByte).toString("utf8"),
  });
}

function replaceOwnedBlock(configBytes, managedBlock, configPath) {
  const analysis = analyzeOwnedBlock(configBytes, configPath);
  const replacement = Buffer.from(managedBlock, "utf8");
  if (analysis.present) {
    return Buffer.concat([
      configBytes.subarray(0, analysis.startByte),
      replacement,
      configBytes.subarray(analysis.endByte),
    ]);
  }

  const boundary = configBytes.length > 0 && configBytes[configBytes.length - 1] !== 0x0a ? "\n" : "";
  return Buffer.concat([configBytes, Buffer.from(`${boundary}${managedBlock}\n`, "utf8")]);
}

function timestampForBackup(clock) {
  const current = clock();
  if (!(current instanceof Date) || Number.isNaN(current.valueOf())) {
    throw new Error("Injected clock must return a valid Date");
  }
  return current.toISOString().replace(/[-:.]/g, "");
}

function buildCodexActivationPlan({
  repoRoot,
  configPath,
  skillsRoot,
  policy,
  clock = () => new Date(),
}) {
  requireAbsoluteTarget(configPath, "--config");
  requireAbsoluteTarget(skillsRoot, "--skills-root");
  if (typeof repoRoot !== "string" || repoRoot.trim() === "") throw new Error("Repository root is required");

  const resolvedRepo = resolveThroughExistingAncestor(repoRoot);
  const resolvedConfig = resolveThroughExistingAncestor(configPath);
  const absoluteSkills = path.resolve(skillsRoot);
  const resolvedSkillsTarget = resolveThroughExistingAncestor(skillsRoot);
  if (isWithin(resolvedConfig, resolvedRepo)) {
    throw new Error(`--config must be outside the repository: ${resolvedConfig}`);
  }
  if (samePath(absoluteSkills, resolvedRepo) || samePath(resolvedSkillsTarget, resolvedRepo)) {
    throw new Error(`--skills-root must be outside the repository root: ${absoluteSkills}`);
  }
  if (!fs.existsSync(resolvedConfig) || !fs.statSync(resolvedConfig).isFile()) {
    throw new Error(`--config must name an existing file: ${resolvedConfig}`);
  }

  const before = fs.readFileSync(resolvedConfig);
  const managedBlock = renderManagedBlock({ policy, skillsRoot: absoluteSkills });
  const analysis = analyzeOwnedBlock(before, resolvedConfig);
  const after = replaceOwnedBlock(before, managedBlock, resolvedConfig);
  const backupPath = `${resolvedConfig}.thinking-skills-${timestampForBackup(clock)}.bak`;
  const plan = Object.freeze({
    configPath: resolvedConfig,
    skillsRoot: absoluteSkills,
    backupPath,
    managedBlock,
    currentBlock: analysis.present ? analysis.currentBlock : null,
    before,
    after,
    stale: !before.equals(after),
  });
  PLAN_METADATA.set(plan, Object.freeze({
    repoRoot: resolvedRepo,
    configPath: resolvedConfig,
    backupPath,
    before: Buffer.from(before),
    after: Buffer.from(after),
  }));
  return plan;
}

function nextSiblingPath(targetPath, kind, fsImpl) {
  for (;;) {
    uniquePathCounter += 1;
    const candidate = `${targetPath}.thinking-skills.${kind}-${process.pid}-${uniquePathCounter}`;
    if (!fsImpl.existsSync(candidate)) return candidate;
  }
}

function cleanupExactFile(filePath, fsImpl, warnings) {
  if (!filePath || !fsImpl.existsSync(filePath)) return;
  try {
    fsImpl.unlinkSync(filePath);
  } catch (error) {
    warnings.push(Object.freeze({ path: filePath, message: error.message, code: error.code }));
  }
}

function attachErrorDetails(error, cleanupWarnings, retainedArtifacts) {
  const combinedWarnings = Object.freeze([
    ...(error.cleanupWarnings ?? []),
    ...cleanupWarnings,
  ]);
  const combinedArtifacts = Object.freeze([
    ...new Set([...(error.retainedArtifacts ?? []), ...retainedArtifacts]),
  ]);
  Object.defineProperty(error, "cleanupWarnings", {
    value: combinedWarnings,
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(error, "retainedArtifacts", {
    value: combinedArtifacts,
    enumerable: false,
    configurable: true,
  });
  if (combinedArtifacts.length > 0 && !error.message.includes("Retained artifacts:")) {
    error.message = `${error.message}; Retained artifacts: ${combinedArtifacts.join(", ")}`;
  }
  return error;
}

function formatError(error) {
  const lines = [error.message];
  for (const warning of error.cleanupWarnings ?? []) {
    lines.push(`Cleanup warning; retained artifact ${warning.path}: ${warning.message}`);
  }
  return lines.join("\n");
}

function validateTrustedPlan(plan) {
  const metadata = plan && PLAN_METADATA.get(plan);
  if (!metadata
    || !samePath(plan.configPath, metadata.configPath)
    || !samePath(plan.backupPath, metadata.backupPath)
    || path.dirname(metadata.backupPath) !== path.dirname(metadata.configPath)) {
    throw new Error("applyCodexActivationPlan requires a trusted plan from buildCodexActivationPlan");
  }
  return metadata;
}

function applyCodexActivationPlan(plan, { fsImpl = fs } = {}) {
  const metadata = validateTrustedPlan(plan);
  const currentConfigTarget = resolveThroughExistingAncestor(metadata.configPath, fsImpl);
  if (!samePath(currentConfigTarget, metadata.configPath)) {
    throw new Error(
      `Codex config target changed after planning: ${metadata.configPath} -> ${currentConfigTarget}`,
    );
  }
  if (!metadata.before.equals(metadata.after)) {
    const current = fsImpl.readFileSync(metadata.configPath);
    if (!current.equals(metadata.before)) {
      throw new Error(`${metadata.configPath}: config changed after planning`);
    }
  } else {
    return Object.freeze({ changed: false, backupPath: null, cleanupWarnings: Object.freeze([]) });
  }
  if (fsImpl.existsSync(metadata.backupPath)) {
    throw new Error(`Backup destination already exists: ${metadata.backupPath}`);
  }

  const tempPath = nextSiblingPath(metadata.configPath, "tmp", fsImpl);
  const cleanupWarnings = [];
  let descriptor;
  let ownsTemp = false;
  let backupCreated = false;
  let targetRemoved = false;
  let conflictTarget = false;
  try {
    descriptor = fsImpl.openSync(tempPath, "wx");
    ownsTemp = true;
    fsImpl.writeFileSync(descriptor, metadata.after);
    fsImpl.closeSync(descriptor);
    descriptor = undefined;

    if (!fsImpl.readFileSync(metadata.configPath).equals(metadata.before)) {
      throw new Error(`${metadata.configPath}: config changed after planning`);
    }
    fsImpl.linkSync(metadata.configPath, metadata.backupPath);
    backupCreated = true;
    if (!fsImpl.readFileSync(metadata.backupPath).equals(metadata.before)
      || !fsImpl.readFileSync(metadata.configPath).equals(metadata.before)) {
      throw new Error(`${metadata.configPath}: config changed while creating backup`);
    }

    fsImpl.unlinkSync(metadata.configPath);
    targetRemoved = true;
    const persistentBackupBytes = fsImpl.readFileSync(metadata.backupPath);
    if (!persistentBackupBytes.equals(metadata.before)) {
      throw new Error(`${metadata.backupPath}: backup bytes changed after target removal and before install`);
    }
    if (fsImpl.existsSync(metadata.configPath)) {
      conflictTarget = true;
      throw new Error(
        `restore conflict; concurrent target retained at ${metadata.configPath}; original inode retained at ${metadata.backupPath}`,
      );
    }
    fsImpl.linkSync(tempPath, metadata.configPath);
    cleanupExactFile(tempPath, fsImpl, cleanupWarnings);
    ownsTemp = fsImpl.existsSync(tempPath);
  } catch (error) {
    if (descriptor !== undefined) {
      try {
        fsImpl.closeSync(descriptor);
      } catch (cleanupError) {
        cleanupWarnings.push(Object.freeze({ path: tempPath, message: cleanupError.message, code: cleanupError.code }));
      }
    }
    if (targetRemoved) {
      if (fsImpl.existsSync(metadata.configPath)) {
        conflictTarget = true;
      } else {
        try {
          fsImpl.copyFileSync(metadata.backupPath, metadata.configPath, fs.constants.COPYFILE_EXCL);
          targetRemoved = false;
        } catch (restoreError) {
          if (fsImpl.existsSync(metadata.configPath)) conflictTarget = true;
          error.message = `${error.message}; restore failed: ${restoreError.message}`;
        }
      }
    }
    cleanupExactFile(ownsTemp ? tempPath : null, fsImpl, cleanupWarnings);
    const retainedArtifacts = [];
    for (const artifactPath of [backupCreated ? metadata.backupPath : null, tempPath]) {
      if (!artifactPath) continue;
      if (fsImpl.existsSync(artifactPath)) retainedArtifacts.push(artifactPath);
    }
    if (conflictTarget && fsImpl.existsSync(metadata.configPath)) {
      retainedArtifacts.push(metadata.configPath);
    }
    throw attachErrorDetails(error, cleanupWarnings, retainedArtifacts);
  }

  return Object.freeze({
    changed: true,
    backupPath: metadata.backupPath,
    cleanupWarnings: Object.freeze(cleanupWarnings),
  });
}

function parseCliArgs(argv) {
  const options = { configPath: null, skillsRoot: null, check: false, apply: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") options.help = true;
    else if (argument === "--check") options.check = true;
    else if (argument === "--apply") options.apply = true;
    else if (argument === "--config" || argument === "--skills-root") {
      const key = argument === "--config" ? "configPath" : "skillsRoot";
      if (options[key] !== null) throw new Error(`${argument} may be specified only once`);
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value`);
      options[key] = value;
      index += 1;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  if (options.check && options.apply) throw new Error("--check and --apply cannot be used together");
  return options;
}

function formatPreview(plan) {
  const oldLines = plan.currentBlock === null ? ["<no managed block>"] : plan.currentBlock.split(/\r?\n/);
  const newLines = plan.managedBlock.split("\n");
  return [
    "Preview only; no files were written.",
    `Target config: ${plan.configPath}`,
    `Backup: ${plan.backupPath}`,
    "--- current",
    "+++ proposed",
    ...oldLines.map((line) => `-${line}`),
    ...newLines.map((line) => `+${line}`),
    "Managed block:",
    plan.managedBlock,
    "",
  ].join("\n");
}

function main(
  argv = process.argv.slice(2),
  {
    repoRoot = path.resolve(__dirname, ".."),
    policy,
    clock = () => new Date(),
    stdout = process.stdout,
    stderr = process.stderr,
    fsImpl = fs,
  } = {},
) {
  const options = parseCliArgs(argv);
  if (options.help) {
    stdout.write(
      "Usage: node scripts/apply-codex-activation-policy.js --config <absolute-path> --skills-root <absolute-path> [--check|--apply]\n",
    );
    return 0;
  }
  if (options.configPath === null) throw new Error("--config is required");
  if (options.skillsRoot === null) throw new Error("--skills-root is required");

  const normalizedPolicy = policy ?? loadActivationPolicy({ repoRoot });
  const plan = buildCodexActivationPlan({
    repoRoot,
    configPath: options.configPath,
    skillsRoot: options.skillsRoot,
    policy: normalizedPolicy,
    clock,
  });
  if (options.check) {
    if (plan.stale) {
      stderr.write(`Codex activation-policy managed block is stale: ${plan.configPath}\n`);
      return 1;
    }
    return 0;
  }
  if (!options.apply) {
    stdout.write(formatPreview(plan));
    return 0;
  }

  const result = applyCodexActivationPlan(plan, { fsImpl });
  if (result.changed) stdout.write(`Applied Codex activation policy. Backup: ${result.backupPath}\n`);
  else stdout.write("Codex activation policy is already current; no backup was created.\n");
  for (const warning of result.cleanupWarnings) {
    stderr.write(`Cleanup warning for ${warning.path}: ${warning.message}\n`);
  }
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
  }
}

module.exports = {
  START_MARKER,
  END_MARKER,
  GENERATED_COMMENT,
  escapeTomlBasicString,
  renderManagedBlock,
  replaceOwnedBlock,
  buildCodexActivationPlan,
  applyCodexActivationPlan,
  parseCliArgs,
  formatPreview,
  formatError,
  main,
};
