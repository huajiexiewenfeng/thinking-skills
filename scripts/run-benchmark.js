#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function walkJsonFiles(root) {
  if (!fs.existsSync(root)) return [];

  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function validateCase(item, filePath) {
  const required = ["id", "skill", "prompt", "expected", "must_not"];
  for (const field of required) {
    if (!(field in item)) {
      throw new Error(`${filePath} is missing required field: ${field}`);
    }
  }
  if (!Array.isArray(item.expected)) {
    throw new Error(`${filePath} expected must be an array`);
  }
  if (!Array.isArray(item.must_not)) {
    throw new Error(`${filePath} must_not must be an array`);
  }
}

function loadBenchmarkCases(root = "benchmarks") {
  return walkJsonFiles(root).map((filePath) => {
    const item = JSON.parse(fs.readFileSync(filePath, "utf8"));
    validateCase(item, filePath);
    return { ...item, file: filePath };
  });
}

function countWords(text) {
  const englishWords = text.match(/[A-Za-z0-9_'-]+/g) || [];
  const cjkChars = text.match(/[\u4e00-\u9fff]/g) || [];
  return englishWords.length + cjkChars.length;
}

function countQuestions(text) {
  return (text.match(/[?？]/g) || []).length;
}

function includesLoose(text, phrase) {
  return text.toLowerCase().includes(String(phrase).toLowerCase());
}

function scoreResponse(benchmarkCase, response) {
  const failures = [];
  let score = 0;
  let maxScore = 0;

  for (const expected of benchmarkCase.expected || []) {
    maxScore += 1;
    if (includesLoose(response, expected)) {
      score += 1;
    } else {
      failures.push(`missing expected: ${expected}`);
    }
  }

  for (const forbidden of benchmarkCase.must_not || []) {
    maxScore += 1;
    if (includesLoose(response, forbidden)) {
      failures.push(`hit must_not: ${forbidden}`);
    } else {
      score += 1;
    }
  }

  const quality = benchmarkCase.quality || {};
  if (quality.max_words) {
    maxScore += 1;
    const words = countWords(response);
    if (words <= quality.max_words) {
      score += 1;
    } else {
      failures.push(`word count ${words} exceeds ${quality.max_words}`);
    }
  }

  if (Number.isInteger(quality.asks_at_most_questions)) {
    maxScore += 1;
    const questions = countQuestions(response);
    if (questions <= quality.asks_at_most_questions) {
      score += 1;
    } else {
      failures.push(`question count ${questions} exceeds ${quality.asks_at_most_questions}`);
    }
  }

  return {
    id: benchmarkCase.id,
    skill: benchmarkCase.skill,
    status: failures.length ? "fail" : "pass",
    score,
    max_score: maxScore,
    failures,
  };
}

function buildAgentPrompt(benchmarkCase) {
  const route = benchmarkCase.expected_route
    ? `Expected route for evaluator reference: primary=${benchmarkCase.expected_route.primary}, secondary=${benchmarkCase.expected_route.secondary || "none"}`
    : "No expected route provided.";

  return [
    "You are running a Thinking Skills benchmark case.",
    `Target skill: ${benchmarkCase.skill}`,
    route,
    "",
    "Answer the user naturally. Do not mention that this is a benchmark unless the user asks.",
    "",
    "User prompt:",
    benchmarkCase.prompt,
  ].join("\n");
}

function loadResponses(filePath) {
  if (!filePath) return {};
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (Array.isArray(parsed)) {
    return Object.fromEntries(parsed.map((item) => [item.id, item.response || ""]));
  }
  return parsed;
}

function parseArgs(argv) {
  const args = {
    cases: "benchmarks",
    out: null,
    responses: null,
    command: null,
    list: false,
    prompts: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--cases") args.cases = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--responses") args.responses = argv[++index];
    else if (arg === "--command") args.command = argv[++index];
    else if (arg === "--list") args.list = true;
    else if (arg === "--prompts") args.prompts = true;
    else if (arg === "--help") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function runCommand(command, prompt) {
  const parts = command.split(/\s+/).filter(Boolean);
  const result = spawnSync(parts[0], parts.slice(1), {
    input: prompt,
    encoding: "utf8",
    shell: false,
    maxBuffer: 1024 * 1024 * 10,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`command failed with exit ${result.status}: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function runBenchmark(options) {
  const cases = loadBenchmarkCases(options.cases);
  const responses = loadResponses(options.responses);
  const results = [];

  for (const item of cases) {
    const prompt = buildAgentPrompt(item);

    if (options.list || options.prompts) {
      results.push({
        id: item.id,
        skill: item.skill,
        prompt: options.prompts ? prompt : item.prompt,
      });
      continue;
    }

    const response =
      responses[item.id] ||
      (options.command ? runCommand(options.command, prompt) : "");

    if (!response) {
      results.push({
        id: item.id,
        skill: item.skill,
        status: "not_run",
        reason: "No response supplied. Use --responses or --command.",
      });
      continue;
    }

    results.push(scoreResponse(item, response));
  }

  const summary = {
    total: results.length,
    pass: results.filter((item) => item.status === "pass").length,
    fail: results.filter((item) => item.status === "fail").length,
    not_run: results.filter((item) => item.status === "not_run").length,
  };

  return { summary, results };
}

function printHelp() {
  console.log(`Usage:
  node scripts/run-benchmark.js --list
  node scripts/run-benchmark.js --prompts
  node scripts/run-benchmark.js --responses benchmark-responses.json
  node scripts/run-benchmark.js --command "your-agent-command"

Options:
  --cases <dir>       Benchmark case directory. Default: benchmarks
  --out <file>        Write JSON report to a file
  --responses <file>  Score saved responses by case id
  --command <cmd>     Run an agent command once per case; prompt is sent on stdin
  --list              List cases
  --prompts           Print generated agent prompts
`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const report = runBenchmark(options);
  const output = JSON.stringify(report, null, 2);
  if (options.out) {
    fs.writeFileSync(options.out, `${output}\n`, "utf8");
  }
  console.log(output);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildAgentPrompt,
  loadBenchmarkCases,
  runBenchmark,
  scoreResponse,
};
