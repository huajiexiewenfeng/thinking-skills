const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { loadActivationPolicy, skillIdsByMode } = require("./activation-policy");

const PUBLIC_FILES = Object.freeze([
  "ATTRIBUTION.md",
  "LICENSE",
  "README.md",
  "README.zh.md",
]);
const PLAN_METADATA = new WeakMap();

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
  if (!fsImpl.existsSync(filePath) || !fsImpl.statSync(filePath).isFile()) {
    throw new Error(`${label} is required: ${filePath}`);
  }
  const real = fsImpl.realpathSync.native
    ? fsImpl.realpathSync.native(filePath)
    : fsImpl.realpathSync(filePath);
  if (!isWithin(real, repoRoot)) throw new Error(`${label} must stay inside the repository: ${filePath}`);
  return real;
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

function validateSourceModeAdapters({ policy, filteredPackage = false }) {
  const disabled = skillIdsByMode(policy, "disabled");
  if (!filteredPackage && disabled.length > 0) {
    throw new Error(
      `Cursor and OpenCode source-mode adapters cannot enforce Disabled Skills (${disabled.join(", ")}); use a filtered package`,
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

  const directories = [
    ".codex-plugin",
    "config",
    "skills",
  ];
  const copies = [];
  const addFile = (relativePath, label) => {
    const source = requireRegularSource(path.join(resolvedRepo, relativePath), resolvedRepo, label);
    copies.push(Object.freeze({
      kind: "file",
      source,
      target: path.join(resolvedOutput, relativePath),
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
    const source = fs.realpathSync.native
      ? fs.realpathSync.native(sourceCandidate)
      : fs.realpathSync(sourceCandidate);
    if (!isWithin(source, resolvedRepo)) {
      throw new Error(`Skill directory ${skillId} must stay inside the repository: ${sourceCandidate}`);
    }
    copies.push(Object.freeze({
      kind: "directory",
      source,
      target: path.join(resolvedOutput, "skills", skillId),
    }));
  }

  const plan = Object.freeze({
    outputRoot: resolvedOutput,
    directories: Object.freeze(directories.map((relativePath) => path.join(resolvedOutput, relativePath))),
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
    if (!isWithin(item.source, metadata.repoRoot) || !isWithin(item.target, metadata.outputRoot)) {
      throw new Error(`Package copy escapes its trusted roots: ${item.source} -> ${item.target}`);
    }
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
    const currentSource = fsImpl.realpathSync.native
      ? fsImpl.realpathSync.native(item.source)
      : fsImpl.realpathSync(item.source);
    if (!samePath(currentSource, item.source) || !isWithin(currentSource, metadata.repoRoot)) {
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
    if (item.kind === "file") {
      fsImpl.copyFileSync(item.source, item.target, fs.constants.COPYFILE_EXCL);
    } else if (item.kind === "directory") {
      fsImpl.cpSync(item.source, item.target, {
        recursive: true,
        force: false,
        errorOnExist: true,
        preserveTimestamps: true,
      });
    } else {
      throw new Error(`Unsupported package copy kind: ${item.kind}`);
    }
  }
  return plan.outputRoot;
}

function parseCliArgs(argv) {
  const options = { outputRoot: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") options.help = true;
    else if (argument === "--out") {
      if (options.outputRoot !== null) throw new Error("--out may be specified only once");
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--out requires a value");
      options.outputRoot = value;
      index += 1;
    } else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function main(
  argv = process.argv.slice(2),
  {
    repoRoot = path.resolve(__dirname, ".."),
    policy,
    stdout = process.stdout,
  } = {},
) {
  const options = parseCliArgs(argv);
  if (options.help) {
    stdout.write("Usage: node scripts/package-thinking-skills.js --out <empty-directory>\n");
    return 0;
  }
  if (options.outputRoot === null) throw new Error("--out is required; no default package output is allowed");
  const normalizedPolicy = policy ?? loadActivationPolicy({ repoRoot });
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
