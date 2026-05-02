const test = require("node:test");
const assert = require("node:assert/strict");
const {
  loadBenchmarkCases,
  runBenchmark,
  scoreResponse,
  buildAgentPrompt,
} = require("./run-benchmark");

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
