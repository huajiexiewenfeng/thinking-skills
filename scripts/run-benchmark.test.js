const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { createHash } = require("node:crypto");
const os = require("node:os");
const path = require("node:path");
const {
  aggregateRouteSamples,
  commandErrorRouteSample,
  loadBenchmarkCases,
  loadResponses,
  loadTraces,
  hasValidTechnicalDeepDiveInvocation,
  normalizeRouteSample,
  parseArgs,
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

function makeSamplingRouteCase() {
  return {
    id: "route-sampling-001",
    kind: "route",
    skill: "thinking-router",
    turns: [{ role: "user", content: "Please use technical-deep-dive to explain whether this protocol can work." }],
    expected_profile: {
      domain: "technical",
      objective: "explore",
      mutation: "none",
      artifact: "analysis",
      artifact_sink: "chat",
    },
    expected_route: {
      primary: "technical-deep-dive",
      secondary: null,
    },
    expected_advisory: [],
    must_not_select: ["brainstorming"],
  };
}

function makeRouteOutput(primary, objective = "explore") {
  return {
    task_profile: {
      domain: "technical",
      objective,
      mutation: "none",
      artifact: "analysis",
      artifact_sink: "chat",
    },
    route: {
      primary,
      secondary: null,
    },
    advisory_components: [],
  };
}

test("normalizes semantically equivalent route samples to one signature", () => {
  const first = normalizeRouteSample({
    task_profile: {
      domain: "technical",
      objective: "explore",
      mutation: "none",
      artifact: "analysis",
      artifact_sink: "chat",
      confidence: 0.9,
    },
    route: {
      primary: "technical-deep-dive",
      secondary: null,
    },
    advisory_components: ["writing-plans", "brainstorming"],
  }, 1);
  const second = normalizeRouteSample({
    route: {
      secondary: null,
      primary: "technical-deep-dive",
    },
    advisory_components: ["brainstorming", "writing-plans"],
    task_profile: {
      artifact_sink: "chat",
      artifact: "analysis",
      mutation: "none",
      objective: "explore",
      domain: "technical",
      confidence: 0.2,
    },
  }, 2);

  assert.equal(first.status, "valid");
  assert.equal(second.status, "valid");
  assert.deepEqual(first.signature, second.signature);
  assert.deepEqual(first.signature.advisory_components, [
    "brainstorming",
    "writing-plans",
  ]);
  assert.equal("confidence" in first.signature.task_profile, false);
});

test("classifies invalid route samples without allowing an invalid signature", () => {
  const invalidJson = normalizeRouteSample("{not-json", 1);
  const invalidContract = normalizeRouteSample({
    task_profile: {
      domain: "technical",
      objective: "explore",
      mutation: "none",
      artifact: "analysis",
      artifact_sink: "chat",
    },
    route: {
      primary: "technical-deep-dive",
    },
    advisory_components: [],
  }, 2);
  const commandError = commandErrorRouteSample(
    new Error("command failed with exit 7"),
    3,
  );

  assert.equal(invalidJson.status, "invalid");
  assert.equal(invalidJson.error, "invalid_json");
  assert.equal(invalidJson.signature, undefined);
  assert.equal(invalidContract.status, "invalid");
  assert.equal(invalidContract.error, "invalid_contract");
  assert.match(invalidContract.message, /secondary/);
  assert.equal(commandError.status, "invalid");
  assert.equal(commandError.error, "command_error");
  assert.equal(commandError.raw_output, null);
});

test("aggregates a strict majority separately from route correctness", () => {
  const benchmarkCase = makeSamplingRouteCase();
  const correct = makeRouteOutput("technical-deep-dive");
  const wrong = makeRouteOutput("learning-coach");
  const pass = aggregateRouteSamples(benchmarkCase, [
    normalizeRouteSample(correct, 1),
    normalizeRouteSample(correct, 2),
    normalizeRouteSample(correct, 3),
    normalizeRouteSample(wrong, 4),
    commandErrorRouteSample(new Error("exit 7"), 5),
  ]);
  const stableWrong = aggregateRouteSamples(benchmarkCase, [
    normalizeRouteSample(wrong, 1),
    normalizeRouteSample(wrong, 2),
    normalizeRouteSample(wrong, 3),
    normalizeRouteSample(correct, 4),
    normalizeRouteSample(correct, 5),
  ]);

  assert.equal(pass.status, "pass");
  assert.equal(pass.sample_count, 5);
  assert.equal(pass.majority_count, 3);
  assert.equal(pass.consensus_rate, 0.6);
  assert.equal(pass.outcome_distribution.length, 3);
  assert.equal(stableWrong.status, "fail");
  assert.equal(stableWrong.majority_signature.route.primary, "learning-coach");
});

test("marks a route case unstable when no valid signature has a strict majority", () => {
  const benchmarkCase = makeSamplingRouteCase();
  const result = aggregateRouteSamples(benchmarkCase, [
    normalizeRouteSample(makeRouteOutput("technical-deep-dive"), 1),
    normalizeRouteSample(makeRouteOutput("technical-deep-dive"), 2),
    normalizeRouteSample(makeRouteOutput("learning-coach"), 3),
    normalizeRouteSample(makeRouteOutput("learning-coach"), 4),
    normalizeRouteSample(makeRouteOutput("content-creator"), 5),
  ]);

  assert.equal(result.status, "unstable");
  assert.equal(result.score, 0);
  assert.equal(result.majority_count, 2);
  assert.equal(result.consensus_rate, 0.4);
  assert.equal(result.majority_signature, null);
  assert.match(result.failures[0], /no_strict_majority/);
});

test("loads a valid route case", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-route-cases-"));
  fs.writeFileSync(
    path.join(tempDir, "route.json"),
    JSON.stringify({
      id: "route-only-001",
      kind: "route",
      turns: [{ role: "user", content: "Please use technical-deep-dive to discuss this architecture." }],
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

test("route contracts reject sentinel primaries with secondaries and sentinel secondaries", () => {
  const baseCase = {
    kind: "route",
    prompt: "Classify this request.",
    expected_profile: {
      domain: "learning",
      objective: "explore",
      mutation: "none",
      artifact: "explanation",
      artifact_sink: "chat",
    },
    expected_advisory: [],
    must_not_select: [],
  };

  for (const sentinel of ["native", "no-skill"]) {
    const invalidRoutes = [
      { primary: sentinel, secondary: "learning-coach" },
      { primary: "learning-coach", secondary: sentinel },
    ];

    for (const [index, expectedRoute] of invalidRoutes.entries()) {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-sentinel-route-"));
      fs.writeFileSync(
        path.join(tempDir, "route.json"),
        JSON.stringify({
          ...baseCase,
          id: `sentinel-${sentinel}-${index}`,
          expected_route: expectedRoute,
        }),
        "utf8",
      );

      assert.throws(
        () => loadBenchmarkCases(tempDir),
        new RegExp(`expected_route.*${sentinel}|${sentinel}.*expected_route`),
      );

      const normalized = normalizeRouteSample({
        task_profile: baseCase.expected_profile,
        route: expectedRoute,
        advisory_components: [],
      });
      assert.equal(normalized.status, "invalid");
      assert.equal(normalized.error, "invalid_contract");
      assert.match(normalized.message, new RegExp(sentinel));
    }
  }
});

test("route contracts preserve a real Domain primary plus secondary", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-domain-route-"));
  const expectedRoute = {
    primary: "content-creator",
    secondary: "learning-coach",
  };
  fs.writeFileSync(
    path.join(tempDir, "route.json"),
    JSON.stringify({
      id: "domain-primary-secondary-001",
      kind: "route",
      prompt: "Write an article that teaches this concept.",
      expected_profile: {
        domain: "content",
        objective: "deliver",
        mutation: "none",
        artifact: "article",
        artifact_sink: "chat",
      },
      expected_route: expectedRoute,
      expected_advisory: [],
      must_not_select: [],
    }),
    "utf8",
  );

  assert.equal(loadBenchmarkCases(tempDir).length, 1);
  assert.equal(normalizeRouteSample({
    task_profile: {
      domain: "content",
      objective: "deliver",
      mutation: "none",
      artifact: "article",
      artifact_sink: "chat",
    },
    route: expectedRoute,
    advisory_components: [],
  }).status, "valid");
});

test("integration scoring treats native as zero expected domain Skills", () => {
  const benchmarkCase = {
    id: "integration-native-001",
    kind: "integration",
    turns: [{ role: "user", content: "Give me a direct answer." }],
    expected_profile: { objective: "explore" },
    expected_route: { primary: "native", secondary: null },
    expected_advisory: [],
    must_not_select: ["technical-deep-dive"],
    expected: ["direct answer"],
    must_not: [],
  };
  const response = "Here is a direct answer.";
  const discoveredOnly = loadTraces(null, {
    "integration-native-001": makeTraceEnvelope({
      benchmarkCase,
      response,
      trace: {
        complete: true,
        task_profile: { objective: "explore" },
        route: { primary: "native", secondary: null },
        advisory_components: [],
        events: [
          { event: "discovered", skill: "technical-deep-dive", role: "domain" },
        ],
      },
    }),
  });
  const pass = scoreIntegrationResponse(
    benchmarkCase,
    response,
    discoveredOnly["integration-native-001"],
    traceBinding(benchmarkCase),
  );
  assert.equal(pass.status, "pass");

  const loadedForbidden = loadTraces(null, {
    "integration-native-001": makeTraceEnvelope({
      benchmarkCase,
      response,
      trace: {
        complete: true,
        task_profile: { objective: "explore" },
        route: { primary: "native", secondary: null },
        advisory_components: [],
        events: skillLifecycle("technical-deep-dive", "domain"),
      },
    }),
  });
  const fail = scoreIntegrationResponse(
    benchmarkCase,
    response,
    loadedForbidden["integration-native-001"],
    traceBinding(benchmarkCase),
  );
  assert.equal(fail.status, "fail");
  assert.ok(fail.failures.some((item) => item.includes("technical-deep-dive")));
});

test("integration scoring treats no-skill as zero expected domain Skills", () => {
  const benchmarkCase = {
    id: "integration-no-skill-001",
    kind: "integration",
    turns: [{ role: "user", content: "I just want to chat." }],
    expected_profile: {
      domain: "none",
      objective: "converse",
      mutation: "none",
      artifact: "conversation",
      artifact_sink: "chat",
    },
    expected_route: { primary: "no-skill", secondary: null },
    expected_advisory: [],
    must_not_select: [],
    expected: ["chat"],
    must_not: [],
  };
  const response = "Sure, let's chat.";
  const noDomainSkills = loadTraces(null, {
    "integration-no-skill-001": makeTraceEnvelope({
      benchmarkCase,
      response,
      trace: {
        complete: true,
        task_profile: {
          domain: "none",
          objective: "converse",
          mutation: "none",
          artifact: "conversation",
          artifact_sink: "chat",
        },
        route: { primary: "no-skill", secondary: null },
        advisory_components: [],
        events: [],
      },
    }),
  });
  const pass = scoreIntegrationResponse(
    benchmarkCase,
    response,
    noDomainSkills["integration-no-skill-001"],
    traceBinding(benchmarkCase),
  );
  assert.equal(pass.status, "pass");

  const selectedAndLoadedDomain = loadTraces(null, {
    "integration-no-skill-001": makeTraceEnvelope({
      benchmarkCase,
      response,
      trace: {
        complete: true,
        task_profile: {
          domain: "none",
          objective: "converse",
          mutation: "none",
          artifact: "conversation",
          artifact_sink: "chat",
        },
        route: { primary: "no-skill", secondary: null },
        advisory_components: [],
        events: skillLifecycle("technical-deep-dive", "domain"),
      },
    }),
  });
  const fail = scoreIntegrationResponse(
    benchmarkCase,
    response,
    selectedAndLoadedDomain["integration-no-skill-001"],
    traceBinding(benchmarkCase),
  );
  assert.equal(fail.status, "fail");
  assert.ok(fail.failures.some((item) => item.includes("technical-deep-dive")));
});

test("integration sentinel primaries ignore malformed Domain secondaries", () => {
  for (const sentinel of ["native", "no-skill"]) {
    const benchmarkCase = {
      id: `integration-${sentinel}-secondary-001`,
      kind: "integration",
      turns: [{ role: "user", content: "Give me a direct answer." }],
      expected_profile: {
        domain: sentinel === "native" ? "technical" : "none",
        objective: sentinel === "native" ? "explore" : "converse",
        mutation: "none",
        artifact: "answer",
        artifact_sink: "chat",
      },
      expected_route: {
        primary: sentinel,
        secondary: "learning-coach",
      },
      expected_advisory: [],
      must_not_select: [],
      expected: ["direct answer"],
      must_not: [],
    };
    const response = "Here is a direct answer.";
    const baseTrace = {
      complete: true,
      task_profile: benchmarkCase.expected_profile,
      route: benchmarkCase.expected_route,
      advisory_components: [],
      events: [],
    };
    const noDomain = loadTraces(null, {
      [benchmarkCase.id]: makeTraceEnvelope({
        benchmarkCase,
        response,
        trace: baseTrace,
      }),
    });
    const pass = scoreIntegrationResponse(
      benchmarkCase,
      response,
      noDomain[benchmarkCase.id],
      traceBinding(benchmarkCase),
    );
    assert.equal(pass.status, "pass", sentinel);

    const activatedDomain = loadTraces(null, {
      [benchmarkCase.id]: makeTraceEnvelope({
        benchmarkCase,
        response,
        trace: {
          ...baseTrace,
          events: skillLifecycle("learning-coach", "domain"),
        },
      }),
    });
    const fail = scoreIntegrationResponse(
      benchmarkCase,
      response,
      activatedDomain[benchmarkCase.id],
      traceBinding(benchmarkCase),
    );
    assert.equal(fail.status, "fail", sentinel);
    assert.ok(fail.failures.some((item) => item.includes("domain set")), sentinel);
  }
});

test("integration scoring preserves a real Domain primary plus secondary", () => {
  const benchmarkCase = {
    id: "integration-domain-secondary-001",
    kind: "integration",
    turns: [{ role: "user", content: "Write and teach." }],
    expected_profile: {
      domain: "content",
      objective: "deliver",
      mutation: "none",
      artifact: "article",
      artifact_sink: "chat",
    },
    expected_route: {
      primary: "content-creator",
      secondary: "learning-coach",
    },
    expected_advisory: [],
    must_not_select: [],
    expected: ["article"],
    must_not: [],
  };
  const response = "Here is the article.";
  const trace = {
    complete: true,
    task_profile: benchmarkCase.expected_profile,
    route: benchmarkCase.expected_route,
    advisory_components: [],
    events: [
      ...skillLifecycle("content-creator", "domain"),
      ...skillLifecycle("learning-coach", "domain"),
    ],
  };
  const trusted = loadTraces(null, {
    [benchmarkCase.id]: makeTraceEnvelope({ benchmarkCase, response, trace }),
  });

  const result = scoreIntegrationResponse(
    benchmarkCase,
    response,
    trusted[benchmarkCase.id],
    traceBinding(benchmarkCase),
  );
  assert.equal(result.status, "pass");
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
      turns: [{ role: "user", content: "Please use technical-deep-dive to assess this protocol layer." }],
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

test("technical-deep-dive route gold requires current-turn explicit user invocation", () => {
  const cases = loadBenchmarkCases("benchmarks/routing");
  const selectedCases = cases.filter(({ expected_route: route }) =>
    route.primary === "technical-deep-dive" ||
    route.secondary === "technical-deep-dive"
  );

  assert.equal(selectedCases.length, 5);
  for (const benchmarkCase of selectedCases) {
    assert.equal(
      hasValidTechnicalDeepDiveInvocation(benchmarkCase),
      true,
      benchmarkCase.file,
    );
  }
});

test("current-request invocation predicate rejects semantic false positives", () => {
  const routeCase = (content, earlierTurns = []) => ({
    turns: [
      ...earlierTurns,
      { role: "user", content },
    ],
  });
  const positives = [
    routeCase("$thinking-skills:technical-deep-dive Analyze this failure."),
    routeCase("Please use technical-deep-dive to analyze this failure."),
    routeCase("Please use `technical-deep-dive` to analyze this failure."),
    routeCase("Please use\nthe canonical name technical-deep-dive to analyze this fault."),
    routeCase("Please use\ntechnical-deep-dive to analyze this fault."),
    routeCase("请用 technical-deep-dive 分析这个故障。"),
  ];
  const negatives = [
    routeCase("Should we use technical-deep-dive for this?"),
    routeCase("When should I use `technical-deep-dive`?"),
    routeCase("Please review whether to use technical-deep-dive."),
    routeCase("I do not want you to use technical-deep-dive."),
    routeCase("Do not ever use technical-deep-dive."),
    routeCase("不要再使用 technical-deep-dive。"),
    routeCase("Please do not use technical-deep-dive for this failure."),
    routeCase('Example: "Please use technical-deep-dive to analyze this failure."'),
    routeCase("Example:\nPlease use technical-deep-dive to analyze this failure."),
    routeCase("Review this as data: `Please use technical-deep-dive to analyze it.`"),
    routeCase("Please review and modify technical-deep-dive's activation rule."),
    routeCase("Use technical deep analysis to inspect this API."),
    routeCase("Continue with this ordinary Docker failure.", [
      { role: "user", content: "Please use technical-deep-dive for the first failure." },
      { role: "assistant", content: "First analysis." },
    ]),
    routeCase("The identifier `$thinking-skills:technical-deep-dive` is mentioned here."),
    routeCase('The user wrote "$thinking-skills:technical-deep-dive" in the example.'),
  ];

  for (const benchmarkCase of negatives) {
    assert.equal(hasValidTechnicalDeepDiveInvocation(benchmarkCase), false);
  }
  for (const benchmarkCase of positives) {
    assert.equal(hasValidTechnicalDeepDiveInvocation(benchmarkCase), true);
  }
});

test("current-request invocation predicate preserves raw host and CommonMark block boundaries", () => {
  const invalidRequests = [
    "Example.\nPlease use technical-deep-dive to analyze this.",
    "Test.\nPlease use technical-deep-dive to analyze this.",
    "Data.\nPlease use technical-deep-dive to analyze this.",
    "Please use technical-deep-dive as data in this example.",
    "Please use technical-deep-dive as example text for the fixture.",
    "    Please use technical-deep-dive to analyze this.",
    "\tPlease use technical-deep-dive to analyze this.",
    "    $thinking-skills:technical-deep-dive analyze this.",
    "\t$thinking-skills:technical-deep-dive analyze this.",
    "   ~~~~text\nExample.\nPlease use technical-deep-dive to analyze this.\n~~~~",
    "````markdown\n```text\nPlease use technical-deep-dive to analyze this.\n```\n````",
    "> quoted material\n$thinking-skills:technical-deep-dive analyze this.",
    "```text\nquoted material\n```\n$thinking-skills:technical-deep-dive analyze this.",
    "\"quoted material\"\n$thinking-skills:technical-deep-dive analyze this.",
  ];

  for (const content of invalidRequests) {
    assert.equal(
      hasValidTechnicalDeepDiveInvocation(content),
      false,
      content,
    );
  }

  assert.equal(
    hasValidTechnicalDeepDiveInvocation(
      "$thinking-skills:technical-deep-dive Analyze this failure.",
    ),
    true,
  );
  assert.equal(
    hasValidTechnicalDeepDiveInvocation(
      "Test this API, then use technical-deep-dive to analyze the result.",
    ),
    true,
  );
});

const nonActivatingLogicalBlockCases = [
  [
    "CommonMark lazy-continuation blockquote",
    "> quoted material\nPlease use technical-deep-dive to analyze this.",
  ],
  [
    "qualified Test case label",
    "Test case:\nPlease use technical-deep-dive to analyze this.",
  ],
  [
    "qualified Example input label",
    "Example input:\nPlease use technical-deep-dive to analyze this.",
  ],
  [
    "qualified Sample prompt label",
    "Sample prompt:\nPlease use technical-deep-dive to analyze this.",
  ],
  [
    "list-prefixed Example label",
    "- Example:\n  Please use technical-deep-dive to analyze this.",
  ],
];

for (const [name, content] of nonActivatingLogicalBlockCases) {
  test(`current-request invocation predicate rejects ${name}`, () => {
    assert.equal(hasValidTechnicalDeepDiveInvocation(content), false);
  });
}

test("current-request invocation predicate recognizes coordinated imperative subclauses", () => {
  const directCommands = [
    "Inspect the logs and then use technical-deep-dive to analyze the failure.",
    "Test this API, then use technical-deep-dive to analyze the result.",
    "Inspect the logs if needed and then use technical-deep-dive to analyze the failure.",
    "If needed inspect the logs and then use technical-deep-dive.",
    "Not only inspect the logs but also use technical-deep-dive to analyze the failure.",
    "Please do inspect the logs and then use technical-deep-dive to analyze the failure.",
    "Check the logs if needed and then use technical-deep-dive to analyze the failure.",
  ];

  assert.deepEqual(
    directCommands.map((content) => hasValidTechnicalDeepDiveInvocation(content)),
    [true, true, true, true, true, true, true],
  );
});

test("current-request invocation predicate preserves governing scope for coordinated subclauses", () => {
  const scopedMentions = [
    "I do not want you to inspect the logs and then use technical-deep-dive.",
    "Never inspect the logs and then use technical-deep-dive.",
    "Please review whether to inspect the logs and then use technical-deep-dive.",
    "When should we inspect the logs and then use technical-deep-dive?",
    "Please decide whether to inspect the logs and then use technical-deep-dive.",
    "Please consider if we should inspect the logs and then use technical-deep-dive.",
    "Please check whether to inspect the logs and then use technical-deep-dive.",
    "Please do not inspect the logs and then use technical-deep-dive.",
    "Please don't inspect the logs and then use technical-deep-dive.",
    "Can you inspect the logs and then use technical-deep-dive.",
    "Please review whether to not only inspect the logs but also use technical-deep-dive.",
    "I don't want you to not only inspect the logs but also use technical-deep-dive.",
  ];

  assert.deepEqual(
    scopedMentions.map((content) => hasValidTechnicalDeepDiveInvocation(content)),
    [
      false, false, false, false, false, false,
      false, false, false, false, false, false,
    ],
  );
});

test("current-request invocation predicate finds late commands and requires a final user turn", () => {
  const longLead = "content-creator to preserve the evidence and article structure ".repeat(12);
  const longMultiSkillRequest =
    `Please use ${longLead}and technical-deep-dive to verify the technical semantics.`;

  assert.ok(longMultiSkillRequest.indexOf("technical-deep-dive") > 512);
  assert.equal(
    hasValidTechnicalDeepDiveInvocation(longMultiSkillRequest),
    true,
  );
  assert.equal(
    hasValidTechnicalDeepDiveInvocation({
      turns: [
        { role: "user", content: "Please use technical-deep-dive to analyze this." },
        { role: "assistant", content: "I will analyze it." },
      ],
    }),
    false,
  );
  assert.equal(
    hasValidTechnicalDeepDiveInvocation({
      turns: [
        { role: "assistant", content: "Which route should I use?" },
        { role: "user", content: longMultiSkillRequest },
      ],
    }),
    true,
  );
});

test("current-request invocation predicate handles long non-matching input without pathological scanning", () => {
  const longInput = `${"ordinary technical context ".repeat(20000)}technical deep analysis`;

  assert.equal(hasValidTechnicalDeepDiveInvocation(longInput), false);
});

test("route gold validation applies the centralized current-request predicate", () => {
  const invalidRequests = [
    { prompt: "Please do not use technical-deep-dive for this failure." },
    { prompt: "Example:\nPlease use technical-deep-dive to analyze this failure." },
    { prompt: 'Review this data: "Please use technical-deep-dive here."' },
    { prompt: "Use technical deep analysis to inspect this API." },
    {
      turns: [
        { role: "user", content: "Please use technical-deep-dive for the first failure." },
        { role: "assistant", content: "First analysis." },
        { role: "user", content: "Continue with an ordinary Docker failure." },
      ],
    },
    { prompt: "The identifier `$thinking-skills:technical-deep-dive` is only mentioned." },
  ];

  for (const [index, request] of invalidRequests.entries()) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-invocation-route-"));
    fs.writeFileSync(
      path.join(tempDir, "route.json"),
      JSON.stringify({
        id: `invalid-invocation-${index}`,
        kind: "route",
        ...request,
        expected_profile: {
          domain: "technical",
          objective: "explore",
          mutation: "none",
          artifact: "analysis",
          artifact_sink: "chat",
        },
        expected_route: {
          primary: "technical-deep-dive",
          secondary: null,
        },
        expected_advisory: [],
        must_not_select: ["native", "no-skill"],
      }),
      "utf8",
    );

    assert.throws(
      () => loadBenchmarkCases(tempDir),
      /valid current-request invocation/,
    );
  }
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

test("parses route sampling CLI options and rejects invalid sample counts", () => {
  const options = parseArgs([
    "--kind",
    "route",
    "--samples",
    "5",
    "--command",
    "candidate.exe",
  ]);

  assert.equal(options.kind, "route");
  assert.equal(options.samples, 5);
  assert.throws(
    () => parseArgs(["--samples", "2"]),
    /--samples must be an integer greater than or equal to 3/,
  );
  assert.throws(
    () => parseArgs(["--samples", "3.5"]),
    /--samples must be an integer greater than or equal to 3/,
  );
  assert.throws(
    () => parseArgs(["--kind", "unknown"]),
    /--kind must be one of/,
  );
});

test("filters cases by kind before command compatibility checks", () => {
  const report = runBenchmark({
    cases: "benchmarks",
    kind: "route",
    list: true,
  });

  assert.ok(report.results.length > 0);
  assert.ok(report.results.every((result) => result.kind === "route"));
});

test("rejects route sampling outside route command mode", () => {
  assert.throws(
    () => runBenchmark({
      cases: "benchmarks/routing",
      kind: "route",
      samples: 5,
    }),
    /--samples requires --command/,
  );
  assert.throws(
    () => runBenchmark({
      cases: "benchmarks/learning-coach",
      kind: "response",
      samples: 5,
      command: "candidate.exe",
    }),
    /--samples supports only --kind route/,
  );
});

test("runs a route candidate N times and aggregates after all samples finish", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-route-samples-"));
  fs.writeFileSync(
    path.join(tempDir, "route.json"),
    JSON.stringify(makeSamplingRouteCase()),
    "utf8",
  );
  const outputs = [
    makeRouteOutput("technical-deep-dive"),
    makeRouteOutput("technical-deep-dive"),
    new Error("transient command failure"),
    makeRouteOutput("learning-coach"),
    makeRouteOutput("technical-deep-dive"),
  ];
  let calls = 0;

  const report = runBenchmark({
    cases: tempDir,
    kind: "route",
    samples: 5,
    command: "candidate.exe",
    commandRunner: () => {
      const output = outputs[calls];
      calls += 1;
      if (output instanceof Error) throw output;
      return JSON.stringify(output);
    },
  });

  assert.equal(calls, 5);
  assert.equal(report.results[0].status, "pass");
  assert.equal(report.results[0].sample_count, 5);
  assert.equal(report.results[0].samples[2].error, "command_error");
  assert.equal(report.results[0].majority_count, 3);
});

test("sampled benchmark reports stability summary and experiment identity", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thinking-route-report-"));
  fs.writeFileSync(
    path.join(tempDir, "route.json"),
    JSON.stringify(makeSamplingRouteCase()),
    "utf8",
  );
  const outputs = [
    makeRouteOutput("technical-deep-dive"),
    makeRouteOutput("technical-deep-dive"),
    makeRouteOutput("learning-coach"),
    makeRouteOutput("learning-coach"),
    makeRouteOutput("content-creator"),
  ];
  let index = 0;
  const command = "candidate.exe --model stable";

  const report = runBenchmark({
    cases: tempDir,
    kind: "route",
    samples: 5,
    command,
    commandRunner: () => JSON.stringify(outputs[index++]),
    candidateModel: "candidate-model",
    harnessVersion: "1.0.0",
    samplingConfigSha256: "a".repeat(64),
    skillBundleSha256: "b".repeat(64),
  });

  assert.equal(report.run.kind_filter, "route");
  assert.equal(report.run.samples_per_case, 5);
  assert.equal(report.run.candidate_command_sha256, sha256(command));
  assert.equal(report.run.candidate_cwd, "isolated_temp_per_sample");
  assert.equal(report.run.comparison_eligible, true);
  assert.equal(report.summary.fail, 1);
  assert.equal(report.summary.unstable, 1);
  assert.equal(report.sampling.samples_per_case, 5);
  assert.equal(report.sampling.average_consensus_rate, 0.4);
  assert.equal(report.sampling.minimum_consensus_rate, 0.4);
  assert.equal(report.sampling.unstable_cases, 1);
  assert.equal(report.sampling.invalid_samples, 0);
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

test("dashboard does not compare runs with different route sample counts", () => {
  function sampledReport(id, createdAt, samples, scorePercent) {
    return {
      run: {
        id,
        created_at: createdAt,
        mode: "command",
        contract_version: "3.0.0",
        case_set_sha256: "a".repeat(64),
        prompt_set_sha256: "b".repeat(64),
        candidate_binding_sha256: "c".repeat(64),
        candidate_command_sha256: "d".repeat(64),
        comparison_eligible: true,
        kind_filter: "route",
        samples_per_case: samples,
      },
      summary: {
        total: 1,
        pass: 1,
        fail: 0,
        unstable: 0,
        needs_review: 0,
        not_run: 0,
        score: scorePercent,
        max_score: 100,
        score_percent: scorePercent,
      },
      sampling: {
        samples_per_case: samples,
        average_consensus_rate: 0.8,
        minimum_consensus_rate: 0.6,
        unstable_cases: 0,
        invalid_samples: 0,
      },
      results: [
        {
          id: "route-a",
          skill: "thinking-router",
          status: "pass",
          score: scorePercent,
          max_score: 100,
        },
      ],
    };
  }

  const dashboard = buildDashboard([
    sampledReport("samples-3", "2026-07-27T10:00:00.000Z", 3, 50),
    sampledReport("samples-5", "2026-07-27T11:00:00.000Z", 5, 80),
  ]);
  const latestRow = dashboard
    .split("\n")
    .find((line) => line.includes("samples-5"));

  assert.ok(latestRow);
  assert.match(latestRow, /\| 5 \| 80% \| 60% \|/);
  assert.match(latestRow, /\| - \|$/);
  assert.doesNotMatch(dashboard, /\+30%/);
});

test("dashboard counts unstable route cases as failures", () => {
  const report = {
    run: {
      id: "unstable-run",
      created_at: "2026-07-27T12:00:00.000Z",
      mode: "command",
      contract_version: "3.0.0",
      case_set_sha256: "a".repeat(64),
      prompt_set_sha256: "b".repeat(64),
      candidate_binding_sha256: "c".repeat(64),
      candidate_command_sha256: "d".repeat(64),
      comparison_eligible: true,
      kind_filter: "route",
      samples_per_case: 5,
    },
    summary: {
      total: 1,
      pass: 0,
      fail: 1,
      unstable: 1,
      needs_review: 0,
      not_run: 0,
      score: 0,
      max_score: 10,
      score_percent: 0,
    },
    sampling: {
      samples_per_case: 5,
      average_consensus_rate: 0.4,
      minimum_consensus_rate: 0.4,
      unstable_cases: 1,
      invalid_samples: 0,
    },
    results: [
      {
        id: "route-a",
        skill: "thinking-router",
        status: "unstable",
        score: 0,
        max_score: 10,
        failures: ["no_strict_majority"],
      },
    ],
  };

  const dashboard = buildDashboard([report]);

  assert.match(dashboard, /Unstable/);
  assert.match(dashboard, /unstable-run/);
  assert.match(dashboard, /no_strict_majority/);
});
