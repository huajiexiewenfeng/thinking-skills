const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  loadBenchmarkCases,
  runBenchmark,
  scoreResponse,
  buildAgentPrompt,
} = require("./run-benchmark");
const {
  buildDashboard,
  loadRunReports,
} = require("./update-benchmark-dashboard");

test("loads benchmark cases from nested json files", () => {
  const cases = loadBenchmarkCases("benchmarks");
  const ids = cases.map((item) => item.id);

  assert.ok(ids.includes("learning-technical-noun-001"));
  assert.ok(ids.includes("router-learning-vs-technical-001"));
});

test("scores response with expected and must_not checks", () => {
  const benchmarkCase = {
    id: "sample",
    expected: ["compact mental model", "one example"],
    must_not: ["implementation details"],
    quality: {
      max_words: 20,
      asks_at_most_questions: 1,
    },
  };

  const result = scoreResponse(
    benchmarkCase,
    "Here is a compact mental model with one example. Does this fit?"
  );

  assert.equal(result.status, "pass");
  assert.equal(result.score, 5);
  assert.equal(result.max_score, 5);
});

test("fails response when must_not text appears or too many questions are asked", () => {
  const benchmarkCase = {
    id: "sample",
    expected: ["plain language"],
    must_not: ["implementation details"],
    quality: {
      asks_at_most_questions: 1,
    },
  };

  const result = scoreResponse(
    benchmarkCase,
    "This uses plain language, but includes implementation details. Why? How?"
  );

  assert.equal(result.status, "fail");
  assert.ok(result.failures.some((item) => item.includes("must_not")));
  assert.ok(result.failures.some((item) => item.includes("question")));
});

test("builds agent prompt with user prompt and evaluation intent", () => {
  const prompt = buildAgentPrompt({
    id: "learning-001",
    skill: "learning-coach",
    prompt: "Explain Kafka like I am new to distributed systems.",
  });

  assert.match(prompt, /learning-coach/);
  assert.match(prompt, /Explain Kafka/);
  assert.match(prompt, /Answer the user naturally/);
});

test("runs an external agent command with benchmark prompt on stdin", (t) => {
  let report;
  try {
    report = runBenchmark({
      cases: "benchmarks/learning-coach",
      command: "node scripts/benchmark-fixtures/fake-agent.js",
    });
  } catch (error) {
    if (error.code === "EPERM") {
      t.skip("sandbox blocked child process spawn");
      return;
    }
    throw error;
  }

  assert.equal(report.summary.total, 1);
  assert.equal(report.summary.pass, 1);
  assert.equal(report.results[0].status, "pass");
});

test("benchmark report includes run metadata and score summary", () => {
  const report = runBenchmark({ cases: "benchmarks/learning-coach" });

  assert.ok(report.run.id);
  assert.ok(report.run.created_at);
  assert.equal(report.run.cases, "benchmarks/learning-coach");
  assert.equal(report.summary.total, 1);
  assert.equal(report.summary.score_percent, 0);
});

test("dashboard compares multiple benchmark run reports", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-benchmark-"));
  const first = {
    run: { id: "run-1", created_at: "2026-05-02T10:00:00.000Z", commit: "aaa1111", cases: "benchmarks" },
    summary: { total: 2, pass: 1, fail: 1, not_run: 0, score: 6, max_score: 10, score_percent: 60 },
    results: [
      { id: "case-a", skill: "content-creator", status: "pass", score: 5, max_score: 5, failures: [] },
      { id: "case-b", skill: "learning-coach", status: "fail", score: 1, max_score: 5, failures: ["missing expected: example"] },
    ],
  };
  const second = {
    run: { id: "run-2", created_at: "2026-05-02T11:00:00.000Z", commit: "bbb2222", cases: "benchmarks" },
    summary: { total: 2, pass: 2, fail: 0, not_run: 0, score: 10, max_score: 10, score_percent: 100 },
    results: [
      { id: "case-a", skill: "content-creator", status: "pass", score: 5, max_score: 5, failures: [] },
      { id: "case-b", skill: "learning-coach", status: "pass", score: 5, max_score: 5, failures: [] },
    ],
  };

  fs.writeFileSync(path.join(tempDir, "run-1.json"), JSON.stringify(first), "utf8");
  fs.writeFileSync(path.join(tempDir, "run-2.json"), JSON.stringify(second), "utf8");

  const reports = loadRunReports(tempDir);
  const dashboard = buildDashboard(reports);

  assert.match(dashboard, /Benchmark Dashboard/);
  assert.match(dashboard, /run-2/);
  assert.match(dashboard, /learning-coach/);
  assert.match(dashboard, /\+40/);
});

test("dashboard excludes not_run reports from score deltas", () => {
  const first = {
    run: { id: "real-run", created_at: "2026-05-02T10:00:00.000Z", commit: "aaa1111", cases: "benchmarks" },
    summary: { total: 1, pass: 1, fail: 0, not_run: 0, score: 5, max_score: 5, score_percent: 100 },
    results: [
      { id: "case-a", skill: "content-creator", status: "pass", score: 5, max_score: 5, failures: [] },
    ],
  };
  const second = {
    run: { id: "coverage-only", created_at: "2026-05-02T11:00:00.000Z", commit: "bbb2222", cases: "benchmarks" },
    summary: { total: 1, pass: 0, fail: 0, not_run: 1, score: 0, max_score: 0, score_percent: 0 },
    results: [
      { id: "case-a", skill: "content-creator", status: "not_run", reason: "No response supplied." },
    ],
  };

  const dashboard = buildDashboard([first, second]);

  assert.match(dashboard, /coverage-only/);
  assert.match(dashboard, /Coverage only/);
  assert.doesNotMatch(dashboard, /-100/);
  assert.match(dashboard, /\| content-creator \| 100%/);
});
