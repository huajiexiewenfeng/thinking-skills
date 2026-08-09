const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const childProcess = require("node:child_process");

const { loadActivationPolicy, skillIdsByMode } = require("./activation-policy");

const PUBLIC_FILES = Object.freeze([
  "ATTRIBUTION.md",
  "LICENSE",
  "README.md",
  "README.zh.md",
]);
const PLAN_METADATA = new WeakMap();
const IGNORED_DIRECTORY_NAMES = new Set([
  ".git",
  ".mypy_cache",
  ".pytest_cache",
  ".ruff_cache",
  "__pycache__",
]);
const IGNORED_FILE_NAMES = new Set([".DS_Store"]);

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

function requireDirectory(directory, label, fsImpl = fs) {
  if (!fsImpl.existsSync(directory) || !fsImpl.statSync(directory).isDirectory()) {
    throw new Error(`${label} must be an existing directory: ${directory}`);
  }
}

function requireRegularSource(filePath, repoRoot, label, fsImpl = fs) {
  if (!fsImpl.existsSync(filePath)) {
    throw new Error(`${label} is required: ${filePath}`);
  }
  const entry = fsImpl.lstatSync(filePath);
  if (entry.isSymbolicLink()) {
    throw new Error(`${label} must not be a symbolic link, junction, or reparse point: ${filePath}`);
  }
  if (!entry.isFile()) throw new Error(`${label} must be a regular file: ${filePath}`);
  const real = fsImpl.realpathSync.native
    ? fsImpl.realpathSync.native(filePath)
    : fsImpl.realpathSync(filePath);
  if (!samePath(real, filePath)) {
    throw new Error(`${label} must not use a symbolic link, junction, or reparse point: ${filePath}`);
  }
  if (!isWithin(real, repoRoot)) throw new Error(`${label} must stay inside the repository: ${filePath}`);
  return real;
}

function gitPath(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function loadTrackedInventory(repoRoot) {
  if (!fs.existsSync(path.join(repoRoot, ".git"))) return null;
  let gitTop;
  let output;
  try {
    gitTop = childProcess.execFileSync(
      "git",
      ["-C", repoRoot, "rev-parse", "--show-toplevel"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
    output = childProcess.execFileSync(
      "git",
      ["-C", repoRoot, "ls-files", "-z", "--full-name"],
      { encoding: "buffer", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (error) {
    const detail = error.stderr?.toString("utf8").trim() || error.message;
    throw new Error(`Unable to read Git tracked package inventory for ${repoRoot}: ${detail}`);
  }
  const resolvedGitTop = resolveThroughExistingAncestor(gitTop);
  if (!samePath(resolvedGitTop, repoRoot)) {
    throw new Error(`Git tracked package inventory root mismatch: ${resolvedGitTop} != ${repoRoot}`);
  }
  return new Set(
    output.toString("utf8").split("\0").filter(Boolean).map((item) => item.replace(/\\/g, "/")),
  );
}

function ignoredPackageEntry(relativePath, entry) {
  const baseName = path.basename(relativePath);
  if (entry.isDirectory() && IGNORED_DIRECTORY_NAMES.has(baseName)) return true;
  if (entry.isFile() && (IGNORED_FILE_NAMES.has(baseName) || /\.py[co]$/i.test(baseName))) return true;
  return false;
}

function validateSafeNode(filePath, approvedRoot, label, fsImpl = fs) {
  const entry = fsImpl.lstatSync(filePath);
  if (entry.isSymbolicLink()) {
    throw new Error(`${label} contains a symbolic link, junction, or reparse point: ${filePath}`);
  }
  const real = fsImpl.realpathSync.native
    ? fsImpl.realpathSync.native(filePath)
    : fsImpl.realpathSync(filePath);
  if (!samePath(real, filePath)) {
    throw new Error(`${label} contains a symbolic link, junction, or reparse point: ${filePath}`);
  }
  if (!isWithin(real, approvedRoot)) {
    throw new Error(`${label} escapes its approved source root: ${filePath} -> ${real}`);
  }
  if (!entry.isDirectory() && !entry.isFile()) {
    throw new Error(`${label} contains a non-regular filesystem entry: ${filePath}`);
  }
  return Object.freeze({ entry, real });
}

function walkSafeSkillDirectory(sourceRoot, repoRoot, trackedInventory, skillId) {
  const sourceEntry = fs.lstatSync(sourceRoot);
  if (sourceEntry.isSymbolicLink()) {
    throw new Error(`Skill ${skillId} must not be a symbolic link, junction, or reparse point: ${sourceRoot}`);
  }
  if (!sourceEntry.isDirectory()) throw new Error(`Skill ${skillId} must be a directory: ${sourceRoot}`);
  const approvedRoot = fs.realpathSync.native
    ? fs.realpathSync.native(sourceRoot)
    : fs.realpathSync(sourceRoot);
  if (!samePath(approvedRoot, sourceRoot)) {
    throw new Error(`Skill ${skillId} must not be a symbolic link, junction, or reparse point: ${sourceRoot}`);
  }
  if (!isWithin(approvedRoot, repoRoot)) {
    throw new Error(`Skill ${skillId} escapes the repository: ${sourceRoot} -> ${approvedRoot}`);
  }

  const files = [];
  function visit(directory, relativeDirectory) {
    const entries = fs.readdirSync(directory).sort((left, right) => left.localeCompare(right, "en"));
    for (const name of entries) {
      const sourcePath = path.join(directory, name);
      const relativePath = relativeDirectory === "" ? name : path.join(relativeDirectory, name);
      const node = validateSafeNode(sourcePath, approvedRoot, `Skill ${skillId}`);
      if (ignoredPackageEntry(relativePath, node.entry)) continue;
      if (node.entry.isDirectory()) {
        visit(node.real, relativePath);
        continue;
      }
      const repositoryRelative = gitPath(path.relative(repoRoot, node.real));
      if (trackedInventory !== null && !trackedInventory.has(repositoryRelative)) continue;
      files.push(Object.freeze({
        source: node.real,
        relativePath,
        approvedRoot,
      }));
    }
  }
  visit(approvedRoot, "");
  files.sort((left, right) => left.relativePath.localeCompare(right.relativePath, "en"));
  if (!files.some((item) => item.relativePath === "SKILL.md")) {
    throw new Error(`Skill ${skillId} package inventory must contain tracked SKILL.md`);
  }
  return files;
}

function validateOutputRoot(repoRoot, outputRoot, fsImpl = fs) {
  if (typeof outputRoot !== "string" || outputRoot.trim() === "") {
    throw new Error("Package output path is required");
  }
  const resolvedOutput = resolveThroughExistingAncestor(outputRoot, fsImpl);
  const driveRoot = path.parse(resolvedOutput).root;
  if (samePath(resolvedOutput, driveRoot)) {
    throw new Error(`Package output must not be a drive root: ${resolvedOutput}`);
  }

  const homeRoot = resolveThroughExistingAncestor(os.homedir(), fsImpl);
  if (samePath(resolvedOutput, homeRoot)) {
    throw new Error(`Package output must not be the user profile root: ${resolvedOutput}`);
  }
  if (isWithin(resolvedOutput, repoRoot)) {
    throw new Error(`Package output must be outside the repository: ${resolvedOutput}`);
  }

  if (fsImpl.existsSync(resolvedOutput)) {
    requireDirectory(resolvedOutput, "Package output", fsImpl);
    if (fsImpl.readdirSync(resolvedOutput).length !== 0) {
      throw new Error(`Package output directory must be empty: ${resolvedOutput}`);
    }
  }
  return resolvedOutput;
}

function validateSourceModeAdapters({ policy, filteredPackage = false, adapter }) {
  if (adapter !== "cursor" && adapter !== "opencode") {
    throw new Error("Source-mode adapter must be cursor or opencode");
  }
  const disabled = skillIdsByMode(policy, "disabled");
  if (!filteredPackage && disabled.length > 0) {
    const adapterName = adapter === "cursor" ? "Cursor" : "OpenCode";
    throw new Error(
      `${adapterName} source-mode adapter cannot enforce Disabled Skills (${disabled.join(", ")}); use a filtered package`,
    );
  }
  return true;
}

function buildPackagePlan({ repoRoot, outputRoot, policy }) {
  if (typeof repoRoot !== "string" || repoRoot.trim() === "") {
    throw new Error("Repository root is required");
  }
  const resolvedRepo = resolveThroughExistingAncestor(repoRoot);
  requireDirectory(resolvedRepo, "Repository root");
  const resolvedOutput = validateOutputRoot(resolvedRepo, outputRoot);
  const trackedInventory = loadTrackedInventory(resolvedRepo);

  const directories = new Set([
    ".codex-plugin",
    "config",
    "skills",
  ].map((relativePath) => path.join(resolvedOutput, relativePath)));
  const copies = [];
  const addFile = (relativePath, label) => {
    const repositoryRelative = gitPath(relativePath);
    if (trackedInventory !== null && !trackedInventory.has(repositoryRelative)) {
      throw new Error(`${label} must be present in the Git tracked package inventory: ${relativePath}`);
    }
    const source = requireRegularSource(path.join(resolvedRepo, relativePath), resolvedRepo, label);
    copies.push(Object.freeze({
      kind: "file",
      source,
      target: path.join(resolvedOutput, relativePath),
      approvedRoot: resolvedRepo,
    }));
  };

  addFile(path.join(".codex-plugin", "plugin.json"), "Codex plugin manifest");
  addFile(path.join("config", "activation-policy.yaml"), "Canonical activation policy");
  for (const fileName of PUBLIC_FILES) addFile(fileName, `Public package file ${fileName}`);

  const includedSkillIds = [
    ...skillIdsByMode(policy, "auto"),
    ...skillIdsByMode(policy, "explicit"),
  ].sort();
  for (const skillId of includedSkillIds) {
    const sourceCandidate = path.join(resolvedRepo, "skills", skillId);
    requireDirectory(sourceCandidate, `Skill directory ${skillId}`);
    const files = walkSafeSkillDirectory(sourceCandidate, resolvedRepo, trackedInventory, skillId);
    const skillTarget = path.join(resolvedOutput, "skills", skillId);
    directories.add(skillTarget);
    for (const item of files) {
      const target = path.join(skillTarget, item.relativePath);
      let parent = path.dirname(target);
      while (!samePath(parent, skillTarget)) {
        directories.add(parent);
        parent = path.dirname(parent);
      }
      copies.push(Object.freeze({
        kind: "file",
        source: item.source,
        target,
        approvedRoot: item.approvedRoot,
      }));
    }
  }

  const orderedDirectories = [...directories].sort((left, right) => {
    const depth = (item) => path.relative(resolvedOutput, item).split(path.sep).length;
    return depth(left) - depth(right) || left.localeCompare(right, "en");
  });
  copies.sort((left, right) => left.target.localeCompare(right.target, "en"));

  const plan = Object.freeze({
    outputRoot: resolvedOutput,
    directories: Object.freeze(orderedDirectories),
    copies: Object.freeze(copies),
    includedSkillIds: Object.freeze(includedSkillIds),
  });
  PLAN_METADATA.set(plan, Object.freeze({ repoRoot: resolvedRepo, outputRoot: resolvedOutput }));
  return plan;
}

function validateTrustedPlan(plan) {
  const metadata = plan && PLAN_METADATA.get(plan);
  if (!metadata || !samePath(plan.outputRoot, metadata.outputRoot)) {
    throw new Error("applyPackagePlan requires a trusted package plan from buildPackagePlan");
  }
  for (const directory of plan.directories) {
    if (!isWithin(directory, metadata.outputRoot) || samePath(directory, metadata.outputRoot)) {
      throw new Error(`Package directory escapes the trusted output root: ${directory}`);
    }
  }
  for (const item of plan.copies) {
    if (!isWithin(item.source, metadata.repoRoot)
      || !isWithin(item.approvedRoot, metadata.repoRoot)
      || !isWithin(item.source, item.approvedRoot)
      || !isWithin(item.target, metadata.outputRoot)) {
      throw new Error(`Package copy escapes its trusted roots: ${item.source} -> ${item.target}`);
    }
    if (item.kind !== "file") throw new Error(`Package plans may copy only regular files: ${item.source}`);
  }
  return metadata;
}

function applyPackagePlan(plan, { fsImpl = fs } = {}) {
  const metadata = validateTrustedPlan(plan);
  const currentOutput = resolveThroughExistingAncestor(metadata.outputRoot, fsImpl);
  if (!samePath(currentOutput, metadata.outputRoot)) {
    throw new Error(`Package output changed after planning: ${metadata.outputRoot} -> ${currentOutput}`);
  }
  for (const item of plan.copies) {
    if (!fsImpl.existsSync(item.source)) {
      throw new Error(`Package source changed after planning: ${item.source}`);
    }
    const sourceEntry = fsImpl.lstatSync(item.source);
    if (sourceEntry.isSymbolicLink() || !sourceEntry.isFile()) {
      throw new Error(`Package source changed after planning or is not a regular file: ${item.source}`);
    }
    const currentSource = fsImpl.realpathSync.native
      ? fsImpl.realpathSync.native(item.source)
      : fsImpl.realpathSync(item.source);
    if (!samePath(currentSource, item.source)
      || !isWithin(currentSource, metadata.repoRoot)
      || !isWithin(currentSource, item.approvedRoot)) {
      throw new Error(`Package source changed after planning: ${item.source} -> ${currentSource}`);
    }
  }
  const outputExists = fsImpl.existsSync(metadata.outputRoot);
  if (outputExists) {
    requireDirectory(metadata.outputRoot, "Package output", fsImpl);
    if (fsImpl.readdirSync(metadata.outputRoot).length !== 0) {
      throw new Error(`Package output directory must be empty: ${metadata.outputRoot}`);
    }
  } else {
    fsImpl.mkdirSync(metadata.outputRoot, { recursive: true });
  }

  for (const directory of plan.directories) fsImpl.mkdirSync(directory);
  for (const item of plan.copies) {
    fsImpl.copyFileSync(item.source, item.target, fs.constants.COPYFILE_EXCL);
  }
  return plan.outputRoot;
}

function parseCliArgs(argv) {
  const options = {
    outputRoot: null,
    checkSourceMode: false,
    adapter: null,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") options.help = true;
    else if (argument === "--check-source-mode") options.checkSourceMode = true;
    else if (argument === "--adapter") {
      if (options.adapter !== null) throw new Error("--adapter may be specified only once");
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--adapter requires a value");
      if (value !== "cursor" && value !== "opencode") {
        throw new Error("--adapter must be cursor or opencode");
      }
      options.adapter = value;
      index += 1;
    }
    else if (argument === "--out") {
      if (options.outputRoot !== null) throw new Error("--out may be specified only once");
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--out requires a value");
      options.outputRoot = value;
      index += 1;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  if (options.checkSourceMode && options.outputRoot !== null) {
    throw new Error("--check-source-mode cannot be used with --out");
  }
  if (options.checkSourceMode && options.adapter === null) {
    throw new Error("--adapter is required with --check-source-mode");
  }
  if (!options.checkSourceMode && options.adapter !== null) {
    throw new Error("--adapter requires --check-source-mode");
  }
  return options;
}

function main(
  argv = process.argv.slice(2),
  {
    repoRoot = path.resolve(__dirname, ".."),
    policy,
    stdout = process.stdout,
    stderr = process.stderr,
  } = {},
) {
  const options = parseCliArgs(argv);
  if (options.help) {
    stdout.write([
      "Usage:",
      "  node scripts/package-thinking-skills.js --out <empty-directory>",
      "  node scripts/package-thinking-skills.js --check-source-mode --adapter <cursor|opencode>",
      "",
    ].join("\n"));
    return 0;
  }
  const normalizedPolicy = policy ?? loadActivationPolicy({ repoRoot });
  if (options.checkSourceMode) {
    try {
      validateSourceModeAdapters({
        policy: normalizedPolicy,
        filteredPackage: false,
        adapter: options.adapter,
      });
    } catch (error) {
      stderr.write(`${error.message}\n`);
      return 1;
    }
    stdout.write(`${options.adapter} source-mode activation policy is compatible.\n`);
    return 0;
  }
  if (options.outputRoot === null) throw new Error("--out is required; no default package output is allowed");
  const plan = buildPackagePlan({ repoRoot, outputRoot: options.outputRoot, policy: normalizedPolicy });
  applyPackagePlan(plan);
  stdout.write(`Created filtered Thinking Skills package: ${plan.outputRoot}\n`);
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
  PUBLIC_FILES,
  validateSourceModeAdapters,
  buildPackagePlan,
  applyPackagePlan,
  parseCliArgs,
  main,
};
