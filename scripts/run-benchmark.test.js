const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { createHash } = require("node:crypto");
const os = require("node:os");
const path = require("node:path");
const {
  loadBenchmarkCases,
  loadResponses,
  loadTraces,
  runBenchmark,
  runCommand,
  scoreIntegrationResponse,
  scoreRouteResponse,
  scoreResponse,
  summarizeResults,
  buildAgentPrompt,
} = require("./run-benchmark");
const {
  buildDashboard,
  loadRunReports,
} = require("./update-benchmark-dashboard");

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function skillLifecycle(skill, role) {
  return [
    { event: "discovered", skill, role },
    { event: "selected", skill, role },
    { event: "loaded", skill, role },
  ];
}

function makeTraceEnvelope({
  benchmarkCase,
  response,
  trace,
  runNonce = "run-nonce-001",
  adapterId = "test-host-adapter",
  adapterVersion = "1.0.0",
  capturedAt = "2026-07-22T10:00:00.000Z",
}) {
  return {
    case_id: benchmarkCase.id,
    run_nonce: runNonce,
    candidate_prompt_sha256: sha256(buildAgentPrompt(benchmarkCase)),
    response_sha256: sha256(response),
    events_sha256: sha256(JSON.stringify(trace.events)),
    source: "host_adapter",
    adapter_id: adapterId,
    adapter_version: adapterVersion,
    captured_at: capturedAt,
    trace,
  };
}

function traceBinding(benchmarkCase, runNonce = "run-nonce-001") {
  return {
    run_nonce: runNonce,
    candidate_prompt_sha256: sha256(buildAgentPrompt(benchmarkCase)),
    adapter_id: "test-host-adapter",
    adapter_version: "1.0.0",
  };
}

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

test("human rubric requires review after automated checks pass", () => {
  const benchmarkCase = {
    id: "response-review-001",
    skill: "technical-deep-dive",
    expected: [],
    must_not: ["formal specification"],
    human_rubric: ["Gives a direct feasibility judgment."],
  };

  const result = scoreResponse(
    benchmarkCase,
    "Yes, the protocol is feasible if activation and influence are separate.",
  );

  assert.equal(result.status, "needs_review");
  assert.equal(result.automated_status, "pass");
  assert.deepEqual(result.human_review, {
    status: "pending",
    rubric: benchmarkCase.human_rubric,
  });

  const summary = summarizeResults([result]);
  assert.equal(summary.pass, 0);
  assert.equal(summary.needs_review, 1);
});

test("builds response prompt without leaking evaluator labels", () => {
  const prompt = buildAgentPrompt({
    id: "learning-001",
    kind: "response",
    skill: "learning-coach",
    prompt: "Explain Kafka like I am new to distributed systems.",
    expected: ["compact mental model"],
    must_not: ["implementation details"],
  });

  assert.match(prompt, /Explain Kafka/);
  assert.match(prompt, /Answer the conversation naturally/);
  assert.doesNotMatch(prompt, /learning-coach/);
  assert.doesNotMatch(prompt, /compact mental model/);
  assert.doesNotMatch(prompt, /implementation details/);
  assert.doesNotMatch(prompt, /Expected route/);
});

test("builds route prompt from raw turns without leaking gold profile", () => {
  const prompt = buildAgentPrompt({
    id: "router-explore-001",
    kind: "route",
    turns: [
      { role: "user", content: "Could this protocol layer work?" },
    ],
    expected_profile: {
      domain: "technical",
      objective: "explore",
      mutation: "none",
    },
    expected_route: {
      primary: "technical-deep-dive",
      secondary: null,
    },
    expected_advisory: [],
    must_not_select: ["brainstorming"],
  });

  assert.match(prompt, /Could this protocol layer work/);
  assert.match(prompt, /task_profile/);
  assert.match(prompt, /route/);
  assert.match(prompt, /advisory_components/);
  assert.doesNotMatch(prompt, /technical-deep-dive/);
  assert.doesNotMatch(prompt, /brainstorming/);
  assert.doesNotMatch(prompt, /objective=explore/);
  assert.doesNotMatch(prompt, /Expected route/);
});

test("scores a structured route response outside the candidate prompt", () => {
  const benchmarkCase = {
    id: "router-explore-001",
    kind: "route",
    expected_profile: {
      domain: "technical",
      objective: "explore",
      mutation: "none",
    },
    expected_route: {
      primary: "technical-deep-dive",
      secondary: null,
    },
    expected_advisory: [],
    must_not_select: ["brainstorming"],
  };

  const result = scoreRouteResponse(
    benchmarkCase,
    JSON.stringify({
      task_profile: {
        domain: "technical",
        objective: "explore",
        mutation: "none",
      },
      route: {
        primary: "technical-deep-dive",
        secondary: null,
      },
      advisory_components: [],
    })
  );

  assert.equal(result.status, "pass");
  assert.equal(result.score, result.max_score);
});

test("fails a structured route response that selects a forbidden skill", () => {
  const result = scoreRouteResponse(
    {
      id: "router-explore-001",
      kind: "route",
      expected_profile: { objective: "explore" },
      expected_route: {
        primary: "technical-deep-dive",
        secondary: null,
      },
      expected_advisory: [],
      must_not_select: ["brainstorming"],
    },
    {
      task_profile: { objective: "deliver" },
      route: {
        primary: "technical-deep-dive",
        secondary: null,
      },
      advisory_components: ["brainstorming"],
    }
  );

  assert.equal(result.status, "fail");
  assert.ok(result.failures.some((item) => item.includes("objective")));
  assert.ok(result.failures.some((item) => item.includes("forbidden")));
});

test("route selection assertions fail when advisory_components are not reported", () => {
  const result = scoreRouteResponse(
    {
      id: "router-explore-001",
      kind: "route",
      expected_profile: { objective: "explore" },
      expected_route: { primary: "technical-deep-dive", secondary: null },
      expected_advisory: [],
      must_not_select: ["brainstorming"],
    },
    {
      task_profile: { objective: "explore" },
      route: { primary: "technical-deep-dive", secondary: null },
    },
  );

  assert.equal(result.status, "fail");
  assert.ok(result.failures.some((item) => item.includes("advisory_components")));
});

test("loads a valid route case", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-route-cases-"));
  fs.writeFileSync(
    path.join(tempDir, "route.json"),
    JSON.stringify({
      id: "route-only-001",
      kind: "route",
      turns: [{ role: "user", content: "Can we discuss this architecture?" }],
      expected_profile: {
        domain: "technical",
        objective: "explore",
        mutation: "none",
        artifact: "analysis",
        artifact_sink: "chat",
      },
      expected_route: { primary: "technical-deep-dive", secondary: null },
      expected_advisory: [],
      must_not_select: ["no-skill"],
    }),
    "utf8"
  );

  const cases = loadBenchmarkCases(tempDir);
  assert.equal(cases.length, 1);
  assert.equal(cases[0].kind, "route");
});

test("requires every benchmark case to declare kind", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-kind-required-"));
  fs.writeFileSync(
    path.join(tempDir, "missing-kind.json"),
    JSON.stringify({
      id: "response-001",
      prompt: "Answer naturally.",
      expected: [],
      must_not: [],
    }),
    "utf8"
  );

  assert.throws(
    () => loadBenchmarkCases(tempDir),
    /missing required field: kind/,
  );
});

test("response cases reject route-only fields", () => {
  const routeOnlyFields = {
    expected_profile: {
      domain: "learning",
      objective: "explore",
      mutation: "none",
      artifact: "explanation",
      artifact_sink: "chat",
    },
    expected_route: { primary: "learning-coach", secondary: null },
    expected_advisory: [],
    must_not_select: [],
  };

  for (const [field, value] of Object.entries(routeOnlyFields)) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-response-fields-"));
    fs.writeFileSync(
      path.join(tempDir, `${field}.json`),
      JSON.stringify({
        id: `response-with-${field}`,
        kind: "response",
        prompt: "Explain this naturally.",
        expected: [],
        must_not: [],
        [field]: value,
      }),
      "utf8",
    );

    assert.throws(
      () => loadBenchmarkCases(tempDir),
      new RegExp(`response case must not include route-only field: ${field}`),
    );
  }
});

test("route cases reject response-only fields", () => {
  const responseOnlyFields = {
    expected: [],
    must_not: [],
    quality: { max_words: 100 },
    human_rubric: ["Answer clearly."],
  };

  for (const [field, value] of Object.entries(responseOnlyFields)) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-route-fields-"));
    fs.writeFileSync(
      path.join(tempDir, `${field}.json`),
      JSON.stringify({
        id: `route-with-${field}`,
        kind: "route",
        prompt: "Classify this request.",
        expected_profile: {
          domain: "learning",
          objective: "explore",
          mutation: "none",
          artifact: "explanation",
          artifact_sink: "chat",
        },
        expected_route: { primary: "learning-coach", secondary: null },
        expected_advisory: [],
        must_not_select: [],
        [field]: value,
      }),
      "utf8",
    );

    assert.throws(
      () => loadBenchmarkCases(tempDir),
      new RegExp(`route case must not include response-only field: ${field}`),
    );
  }
});

test("response cases reject unsupported quality fields", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-quality-fields-"));
  fs.writeFileSync(
    path.join(tempDir, "unsupported-tone.json"),
    JSON.stringify({
      id: "response-with-tone",
      kind: "response",
      prompt: "Answer naturally.",
      expected: [],
      must_not: [],
      quality: { tone: "warm" },
    }),
    "utf8",
  );

  assert.throws(
    () => loadBenchmarkCases(tempDir),
    /unsupported quality field: tone/,
  );
});

test("route cases reject unsupported Task Profile enum values", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-profile-values-"));
  fs.writeFileSync(
    path.join(tempDir, "unsupported-objective.json"),
    JSON.stringify({
      id: "route-with-unsupported-objective",
      kind: "route",
      prompt: "Classify this request.",
      expected_profile: {
        domain: "learning",
        objective: "invent",
        mutation: "none",
        artifact: "explanation",
        artifact_sink: "chat",
      },
      expected_route: { primary: "learning-coach", secondary: null },
      expected_advisory: [],
      must_not_select: [],
    }),
    "utf8",
  );

  assert.throws(
    () => loadBenchmarkCases(tempDir),
    /unsupported expected_profile objective: invent/,
  );
});

test("integration trace uses a separate trusted evaluator channel", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-saved-output-"));
  const responsePath = path.join(tempDir, "responses.json");
  const tracePath = path.join(tempDir, "traces.json");
  const benchmarkCase = {
    id: "integration-001",
    kind: "integration",
    turns: [{ role: "user", content: "Could this protocol layer work?" }],
  };
  const response = "A useful answer.";
  const trace = {
    complete: true,
    task_profile: { objective: "explore" },
    route: { primary: "technical-deep-dive", secondary: null },
    advisory_components: [],
    events: skillLifecycle("technical-deep-dive", "domain"),
  };
  fs.writeFileSync(
    responsePath,
    JSON.stringify([
      {
        id: "integration-001",
        response: "A useful answer.",
        trace: {
          task_profile: { objective: "explore" },
          route: { primary: "technical-deep-dive", secondary: null },
        },
      },
    ]),
    "utf8"
  );

  assert.throws(() => loadResponses(responsePath), /--traces/);

  fs.writeFileSync(
    tracePath,
    JSON.stringify([
      {
        id: "integration-001",
        ...makeTraceEnvelope({ benchmarkCase, response, trace }),
      },
    ]),
    "utf8",
  );

  const traces = loadTraces(tracePath);
  assert.equal(traces["integration-001"].source, "host_adapter");

  assert.throws(
    () => loadTraces(null, {
      "integration-002": {
        ...makeTraceEnvelope({
          benchmarkCase: { ...benchmarkCase, id: "integration-002" },
          response,
          trace: {
          task_profile: {},
          route: {},
          advisory_components: [],
            events: [],
          },
        }),
      },
    }),
    /complete event stream/,
  );

  const outOfOrderTrace = {
    ...trace,
    events: [
      { event: "selected", skill: "technical-deep-dive", role: "domain" },
      { event: "discovered", skill: "technical-deep-dive", role: "domain" },
      { event: "loaded", skill: "technical-deep-dive", role: "domain" },
    ],
  };
  assert.throws(
    () => loadTraces(null, {
      "integration-001": makeTraceEnvelope({
        benchmarkCase,
        response,
        trace: outOfOrderTrace,
      }),
    }),
    /lifecycle order/,
  );
});

test("integration scoring requires both acceptable response and correct trace", () => {
  const benchmarkCase = {
    id: "integration-001",
    kind: "integration",
    turns: [{ role: "user", content: "Could this protocol layer work?" }],
    expected_profile: { objective: "explore" },
    expected_route: { primary: "technical-deep-dive", secondary: null },
    expected_advisory: [],
    must_not_select: ["brainstorming"],
    expected: ["direct feasibility judgment"],
    must_not: ["formal specification"],
    human_rubric: ["Explains the tradeoff clearly."],
  };
  const response = "Here is a direct feasibility judgment.";
  const passTrace = {
    complete: true,
    task_profile: { objective: "explore" },
    route: { primary: "technical-deep-dive", secondary: null },
    advisory_components: [],
    events: skillLifecycle("technical-deep-dive", "domain"),
  };

  const trusted = loadTraces(null, {
    "integration-001": makeTraceEnvelope({
      benchmarkCase,
      response,
      trace: passTrace,
    }),
  });
  const pass = scoreIntegrationResponse(
    benchmarkCase,
    response,
    trusted["integration-001"],
    traceBinding(benchmarkCase),
  );
  assert.equal(pass.status, "needs_review");
  assert.equal(pass.automated_status, "pass");
  assert.equal(pass.human_review.status, "pending");

  const wrongRouteTrace = loadTraces(null, {
    "integration-001": makeTraceEnvelope({
      benchmarkCase,
      response,
      capturedAt: "2026-07-22T10:00:01.000Z",
      trace: {
        complete: true,
        task_profile: { objective: "deliver" },
        route: { primary: "technical-deep-dive", secondary: null },
        advisory_components: ["brainstorming"],
        events: [
          ...skillLifecycle("technical-deep-dive", "domain"),
          ...skillLifecycle("brainstorming", "advisory"),
        ],
      },
    }),
  });
  const wrongRoute = scoreIntegrationResponse(
    benchmarkCase,
    response,
    wrongRouteTrace["integration-001"],
    traceBinding(benchmarkCase),
  );
  assert.equal(wrongRoute.status, "fail");

  const selectedForbiddenTrace = {
    ...passTrace,
    events: [
      ...skillLifecycle("technical-deep-dive", "domain"),
      { event: "discovered", skill: "brainstorming", role: "advisory" },
      { event: "selected", skill: "brainstorming", role: "advisory" },
    ],
  };
  const selectedForbidden = loadTraces(null, {
    "integration-001": makeTraceEnvelope({
      benchmarkCase,
      response,
      trace: selectedForbiddenTrace,
    }),
  });
  const selectedForbiddenResult = scoreIntegrationResponse(
    benchmarkCase,
    response,
    selectedForbidden["integration-001"],
    traceBinding(benchmarkCase),
  );
  assert.equal(selectedForbiddenResult.status, "fail");
  assert.ok(
    selectedForbiddenResult.failures.some((item) => item.includes("brainstorming")),
  );

  const forbiddenAsDomainTrace = loadTraces(null, {
    "integration-001": makeTraceEnvelope({
      benchmarkCase,
      response,
      trace: {
        ...passTrace,
        events: [
          ...skillLifecycle("technical-deep-dive", "domain"),
          ...skillLifecycle("brainstorming", "domain"),
        ],
      },
    }),
  });
  const forbiddenAsDomainResult = scoreIntegrationResponse(
    benchmarkCase,
    response,
    forbiddenAsDomainTrace["integration-001"],
    traceBinding(benchmarkCase),
  );
  assert.equal(forbiddenAsDomainResult.status, "fail");
  assert.ok(
    forbiddenAsDomainResult.failures.some((item) => item.includes("brainstorming")),
  );

  const extraDomainTrace = loadTraces(null, {
    "integration-001": makeTraceEnvelope({
      benchmarkCase,
      response,
      trace: {
        ...passTrace,
        events: [
          ...skillLifecycle("technical-deep-dive", "domain"),
          ...skillLifecycle("learning-coach", "domain"),
        ],
      },
    }),
  });
  const extraDomainResult = scoreIntegrationResponse(
    benchmarkCase,
    response,
    extraDomainTrace["integration-001"],
    traceBinding(benchmarkCase),
  );
  assert.equal(extraDomainResult.status, "fail");
  assert.ok(extraDomainResult.failures.some((item) => item.includes("domain set")));

  const emptyEventsTrace = loadTraces(null, {
    "integration-001": makeTraceEnvelope({
      benchmarkCase,
      response,
      trace: { ...passTrace, events: [] },
    }),
  });
  const emptyEventsResult = scoreIntegrationResponse(
    benchmarkCase,
    response,
    emptyEventsTrace["integration-001"],
    traceBinding(benchmarkCase),
  );
  assert.equal(emptyEventsResult.status, "fail");
  assert.ok(emptyEventsResult.failures.some((item) => item.includes("domain")));

  const badResponse = scoreIntegrationResponse(
    benchmarkCase,
    "I will write a formal specification.",
    trusted["integration-001"],
    traceBinding(benchmarkCase),
  );
  assert.equal(badResponse.status, "fail");

  const selfReportedTrace = scoreIntegrationResponse(
    benchmarkCase,
    "Here is a direct feasibility judgment.",
    {
      source: "host_adapter",
      adapter_id: "candidate-self-report",
      adapter_version: "1.0.0",
      captured_at: "2026-07-22T10:00:02.000Z",
      trace: trusted["integration-001"].trace,
    },
    traceBinding(benchmarkCase),
  );
  assert.equal(selfReportedTrace.status, "fail");
  assert.ok(selfReportedTrace.failures.some((item) => item.includes("trusted")));

  const missingTrace = scoreIntegrationResponse(
    benchmarkCase,
    response,
  );
  assert.equal(missingTrace.status, "fail");
  assert.equal(missingTrace.max_score, pass.max_score);
  assert.ok(missingTrace.failures.some((item) => item.includes("trace")));

  const wrongBinding = scoreIntegrationResponse(
    benchmarkCase,
    response,
    trusted["integration-001"],
    traceBinding(benchmarkCase, "different-run"),
  );
  assert.equal(wrongBinding.status, "fail");
  assert.ok(wrongBinding.failures.some((item) => item.includes("binding")));
});

test("integration prompt asks only for a natural answer, not a self-reported trace", () => {
  const prompt = buildAgentPrompt({
    id: "integration-001",
    kind: "integration",
    turns: [{ role: "user", content: "Could this protocol layer work?" }],
    expected_profile: { objective: "explore" },
    expected_route: { primary: "technical-deep-dive", secondary: null },
    expected_advisory: [],
    must_not_select: ["brainstorming"],
    expected: [],
    must_not: [],
  });

  assert.match(prompt, /Answer the conversation naturally/);
  assert.match(prompt, /Could this protocol layer work/);
  assert.doesNotMatch(prompt, /trace/i);
  assert.doesNotMatch(prompt, /technical-deep-dive/);
  assert.doesNotMatch(prompt, /brainstorming/);
});

test("integration cases reject the unbound command execution path", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-integration-case-"));
  fs.writeFileSync(
    path.join(tempDir, "integration.json"),
    JSON.stringify({
      id: "integration-command-001",
      kind: "integration",
      turns: [{ role: "user", content: "Could this protocol layer work?" }],
      expected_profile: {
        domain: "technical",
        objective: "explore",
        mutation: "none",
        artifact: "analysis",
        artifact_sink: "chat",
      },
      expected_route: { primary: "technical-deep-dive", secondary: null },
      expected_advisory: [],
      must_not_select: ["brainstorming"],
      expected: [],
      must_not: [],
    }),
    "utf8",
  );

  assert.throws(
    () => runBenchmark({
      cases: tempDir,
      command: `node ${path.resolve("scripts/benchmark-fixtures/fake-agent.js")}`,
    }),
    /cannot run integration cases/,
  );
});

test("runs candidate commands from an isolated temporary working directory", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-agent-script-"));
  const scriptPath = path.join(tempDir, "cwd-agent.js");
  fs.writeFileSync(
    scriptPath,
    [
      "const fs = require('node:fs');",
      "process.stdin.resume();",
      "process.stdin.on('end', () => {",
      "  const goldVisible = fs.existsSync('benchmarks');",
      "  process.stdout.write(JSON.stringify({ cwd: process.cwd(), goldVisible }));",
      "});",
    ].join("\n"),
    "utf8",
  );

  const output = JSON.parse(runCommand(`node ${scriptPath}`, "sanitized prompt"));
  assert.equal(output.goldVisible, false);
  assert.notEqual(path.resolve(output.cwd), path.resolve(process.cwd()));
});

test("migrated routing cases use structured prompts without leaking gold", () => {
  const report = runBenchmark({
    cases: "benchmarks/routing",
    prompts: true,
  });

  const routeResult = report.results.find(
    (result) => result.id === "router-learning-vs-technical-001",
  );

  assert.ok(routeResult);
  assert.equal(routeResult.kind, "route");
  assert.match(routeResult.prompt, /task_profile/);
  assert.doesNotMatch(routeResult.prompt, /Expected route/);
  assert.doesNotMatch(routeResult.prompt, /learning-coach/);
});

test("core cases are explicit and independent of Superpowers", () => {
  const cases = loadBenchmarkCases("benchmarks");
  const serialized = JSON.stringify(cases);

  assert.ok(cases.every((item) => ["route", "response", "integration"].includes(item.kind)));
  assert.doesNotMatch(serialized, /brainstorming|writing-plans|test-driven-development/);
  assert.ok(!cases.some((item) => item.id === "integration-superpowers-formal-spec-001"));
});

test("legacy hybrid scenarios retain separate route and response evidence", () => {
  const ids = new Set(loadBenchmarkCases("benchmarks").map((item) => item.id));
  const pairs = [
    ["router-content-general-article-stays-general-001", "content-general-article-stays-general-001"],
    ["router-content-technical-blog-engineering-essence-001", "content-technical-blog-engineering-essence-001"],
    ["router-content-technical-platform-csdn-adaptation-001", "content-technical-platform-csdn-adaptation-001"],
    ["router-content-technical-title-not-clickbait-001", "content-technical-title-not-clickbait-001"],
    ["router-content-writing-output-001", "content-writing-output-001"],
    ["router-emotional-shame-before-learning-001", "emotional-shame-before-learning-001"],
    ["router-learning-technical-noun-001", "learning-technical-noun-001"],
    ["router-learning-vs-technical-001", "learning-attention-intent-response-001"],
    ["spontaneity-casual-greeting-001", "spontaneity-casual-greeting-response-001"],
    ["spontaneity-domain-still-routes-001", "spontaneity-domain-still-routes-response-001"],
    ["spontaneity-exploratory-thought-001", "spontaneity-exploratory-thought-response-001"],
    ["spontaneity-just-chatting-001", "spontaneity-just-chatting-response-001"],
    ["spontaneity-meta-chat-001", "spontaneity-meta-chat-response-001"],
    ["spontaneity-opt-out-cn-001", "spontaneity-opt-out-cn-response-001"],
    ["spontaneity-opt-out-en-001", "spontaneity-opt-out-en-response-001"],
    ["spontaneity-playful-nickname-001", "spontaneity-playful-nickname-response-001"],
  ];

  for (const [routeId, responseId] of pairs) {
    assert.ok(ids.has(routeId), `missing route evidence: ${routeId}`);
    assert.ok(ids.has(responseId), `missing response evidence: ${responseId}`);
  }
});

test("technical secondary routing requires an explicit technical-analysis signal", () => {
  const cases = loadBenchmarkCases("benchmarks/routing");
  const attention = cases.find(
    (item) => item.id === "router-learning-vs-technical-001",
  );
  const kafka = cases.find(
    (item) => item.id === "router-learning-technical-noun-001",
  );

  assert.ok(attention);
  assert.ok(kafka);
  assert.equal(attention.expected_route.secondary, null);
  assert.doesNotMatch(attention.prompt, /architecture|replication|consumer groups/i);
  assert.equal(kafka.expected_route.secondary, "technical-deep-dive");
  assert.match(kafka.prompt, /partitions/i);
  assert.match(kafka.prompt, /replication/i);
  assert.match(kafka.prompt, /consumer groups/i);
});

test("loads the optional Superpowers integration suite only when requested", () => {
  const cases = loadBenchmarkCases("benchmarks-optional/superpowers");

  assert.deepEqual(
    cases.map((item) => item.id),
    ["integration-superpowers-formal-spec-001"],
  );
  assert.equal(cases[0].kind, "integration");
  assert.deepEqual(cases[0].expected_advisory, ["brainstorming"]);
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

  assert.equal(report.summary.total, 2);
  assert.equal(report.summary.needs_review, 2);
  assert.ok(report.results.every((result) => result.status === "needs_review"));
});

test("benchmark report includes run metadata and score summary", () => {
  const report = runBenchmark({ cases: "benchmarks/learning-coach" });

  assert.ok(report.run.id);
  assert.ok(report.run.created_at);
  assert.equal(report.run.cases, "benchmarks/learning-coach");
  assert.equal(report.run.contract_version, "3.0.0");
  assert.match(report.run.case_set_sha256, /^[a-f0-9]{64}$/);
  assert.match(report.run.prompt_set_sha256, /^[a-f0-9]{64}$/);
  assert.equal(report.run.candidate_binding_sha256, null);
  assert.equal(report.run.comparison_eligible, false);
  assert.deepEqual(report.run.case_order, [
    "learning-attention-intent-response-001",
    "learning-technical-noun-001",
  ]);
  assert.equal(report.summary.total, 2);
  assert.equal(report.summary.needs_review, 0);
  assert.equal(report.summary.score_percent, 0);
});

test("dashboard compares multiple benchmark run reports", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-benchmark-"));
  const first = {
    run: {
      id: "run-1",
      created_at: "2026-05-02T10:00:00.000Z",
      commit: "aaa1111",
      cases: "benchmarks",
      contract_version: "2.0.0",
      case_set_sha256: "a".repeat(64),
      prompt_set_sha256: "b".repeat(64),
      candidate_binding_sha256: "c".repeat(64),
      comparison_eligible: true,
    },
    summary: { total: 2, pass: 1, fail: 1, not_run: 0, score: 6, max_score: 10, score_percent: 60 },
    results: [
      { id: "case-a", skill: "content-creator", status: "pass", score: 5, max_score: 5, failures: [] },
      { id: "case-b", skill: "learning-coach", status: "fail", score: 1, max_score: 5, failures: ["missing expected: example"] },
    ],
  };
  const second = {
    run: {
      id: "run-2",
      created_at: "2026-05-02T11:00:00.000Z",
      commit: "bbb2222",
      cases: "benchmarks",
      contract_version: "2.0.0",
      case_set_sha256: "a".repeat(64),
      prompt_set_sha256: "b".repeat(64),
      candidate_binding_sha256: "c".repeat(64),
      comparison_eligible: true,
    },
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
  assert.match(dashboard, /Partial coverage/);
  assert.doesNotMatch(dashboard, /-100/);
  assert.match(dashboard, /\| content-creator \| 100%/);
});

test("dashboard exposes cases pending human review", () => {
  const report = {
    run: { id: "review-run", created_at: "2026-07-22T10:00:00.000Z", commit: "abc1234", cases: "benchmarks" },
    summary: { total: 1, pass: 0, fail: 0, needs_review: 1, not_run: 0, score: 2, max_score: 2, score_percent: 100 },
    results: [
      {
        id: "case-review",
        skill: "technical-deep-dive",
        status: "needs_review",
        score: 2,
        max_score: 2,
        human_review: { status: "pending", rubric: ["Explains the tradeoff clearly."] },
      },
    ],
  };

  const dashboard = buildDashboard([report]);

  assert.match(dashboard, /Needs Review/);
  assert.match(dashboard, /\| review-run .*\| 0 \| 0 \| 1 \| 0 \|/);
  assert.match(dashboard, /\| technical-deep-dive .*\| 0 \| 0 \| 1 \| 0 \|/);
});

test("dashboard does not compare incompatible contract or case-set runs", () => {
  const first = {
    run: {
      id: "contract-v1",
      created_at: "2026-07-22T09:00:00.000Z",
      contract_version: "1.0.0",
      case_set_sha256: "a".repeat(64),
    },
    summary: { total: 1, pass: 1, fail: 0, needs_review: 0, not_run: 0, score: 1, max_score: 2, score_percent: 50 },
    results: [
      { id: "case-a", skill: "thinking-router", status: "pass", score: 1, max_score: 2 },
    ],
  };
  const second = {
    run: {
      id: "contract-v2",
      created_at: "2026-07-22T10:00:00.000Z",
      contract_version: "2.0.0",
      case_set_sha256: "b".repeat(64),
    },
    summary: { total: 1, pass: 1, fail: 0, needs_review: 0, not_run: 0, score: 2, max_score: 2, score_percent: 100 },
    results: [
      { id: "case-a", skill: "thinking-router", status: "pass", score: 2, max_score: 2 },
    ],
  };

  const dashboard = buildDashboard([first, second]);
  const v2Row = dashboard.split("\n").find((line) => line.includes("contract-v2"));

  assert.ok(v2Row);
  assert.match(v2Row, /\| 100% \| - \|$/);
  assert.doesNotMatch(dashboard, /\+50%/);
});

test("dashboard does not score or compare partial-coverage runs", () => {
  const full = {
    run: { id: "full-run", created_at: "2026-07-22T09:00:00.000Z" },
    summary: { total: 2, pass: 1, fail: 1, needs_review: 0, not_run: 0, score: 1, max_score: 2, score_percent: 50 },
    results: [
      { id: "case-a", skill: "thinking-router", status: "pass", score: 1, max_score: 1 },
      { id: "case-b", skill: "thinking-router", status: "fail", score: 0, max_score: 1 },
    ],
  };
  const partial = {
    run: { id: "partial-run", created_at: "2026-07-22T10:00:00.000Z" },
    summary: { total: 2, pass: 1, fail: 0, needs_review: 0, not_run: 1, score: 1, max_score: 1, score_percent: 100 },
    results: [
      { id: "case-a", skill: "thinking-router", status: "pass", score: 1, max_score: 1 },
      { id: "case-b", skill: "thinking-router", status: "not_run" },
    ],
  };

  const dashboard = buildDashboard([full, partial]);
  const partialRow = dashboard.split("\n").find((line) => line.includes("partial-run"));

  assert.ok(partialRow);
  assert.match(partialRow, /Partial coverage/);
  assert.match(partialRow, /\| - \|$/);
  assert.doesNotMatch(dashboard, /\+50%/);
});

test("dashboard never compares legacy reports without experiment identity", () => {
  const first = {
    run: { id: "legacy-a", created_at: "2026-07-22T09:00:00.000Z" },
    summary: { total: 1, pass: 0, fail: 1, needs_review: 0, not_run: 0, score: 0, max_score: 1, score_percent: 0 },
    results: [
      { id: "case-a", skill: "skill-a", status: "fail", score: 0, max_score: 1 },
    ],
  };
  const second = {
    run: { id: "legacy-b", created_at: "2026-07-22T10:00:00.000Z" },
    summary: { total: 1, pass: 1, fail: 0, needs_review: 0, not_run: 0, score: 1, max_score: 1, score_percent: 100 },
    results: [
      { id: "different-case", skill: "skill-b", status: "pass", score: 1, max_score: 1 },
    ],
  };

  const dashboard = buildDashboard([first, second]);
  const secondRow = dashboard.split("\n").find((line) => line.includes("legacy-b"));

  assert.ok(secondRow);
  assert.match(secondRow, /\| 100% \| - \|$/);
  assert.doesNotMatch(dashboard, /\+100%/);
});
