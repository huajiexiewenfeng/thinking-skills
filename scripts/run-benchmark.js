#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { createHash } = require("node:crypto");

const CASE_KINDS = new Set(["route", "response", "integration"]);
const BENCHMARK_CONTRACT_VERSION = "3.0.0";
const ROUTE_ONLY_FIELDS = [
  "expected_profile",
  "expected_route",
  "expected_advisory",
  "must_not_select",
];
const RESPONSE_ONLY_FIELDS = [
  "expected",
  "must_not",
  "quality",
  "human_rubric",
];
const PROFILE_ENUMS = {
  domain: new Set(["technical", "content", "learning", "emotional", "meta", "none"]),
  objective: new Set(["converse", "explore", "decide", "deliver", "review"]),
  mutation: new Set(["none", "requested", "unknown"]),
  artifact_sink: new Set(["chat", "workspace", "external_state"]),
};
const QUALITY_FIELDS = new Set([
  "max_words",
  "asks_at_most_questions",
]);
const REQUIRED_PROFILE_FIELDS = [
  "domain",
  "objective",
  "mutation",
  "artifact",
  "artifact_sink",
];
const trustedTraceEnvelopes = new WeakSet();

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

function getCaseKind(item) {
  return item.kind;
}

function getCaseTurns(item) {
  const turns = item.turns || item.messages;
  if (Array.isArray(turns)) return turns;
  if (typeof item.prompt === "string") {
    return [{ role: "user", content: item.prompt }];
  }
  return [];
}

function validateTurns(item, filePath) {
  const turns = getCaseTurns(item);
  if (!turns.length) {
    throw new Error(`${filePath} requires prompt or non-empty turns`);
  }
  for (const turn of turns) {
    if (!turn || !["user", "assistant"].includes(turn.role)) {
      throw new Error(`${filePath} turns must use user or assistant roles`);
    }
    if (typeof turn.content !== "string" || !turn.content.trim()) {
      throw new Error(`${filePath} turn content must be a non-empty string`);
    }
  }
}

function validateRouteFields(item, filePath) {
  if (!item.expected_profile || typeof item.expected_profile !== "object") {
    throw new Error(`${filePath} is missing required field: expected_profile`);
  }
  for (const field of REQUIRED_PROFILE_FIELDS) {
    if (!(field in item.expected_profile)) {
      throw new Error(`${filePath} expected_profile is missing required field: ${field}`);
    }
  }
  for (const [field, allowedValues] of Object.entries(PROFILE_ENUMS)) {
    const value = item.expected_profile[field];
    if (!allowedValues.has(value)) {
      throw new Error(
        `${filePath} has unsupported expected_profile ${field}: ${value}`,
      );
    }
  }
  if (
    typeof item.expected_profile.artifact !== "string" ||
    !item.expected_profile.artifact.trim()
  ) {
    throw new Error(`${filePath} expected_profile artifact must be a non-empty string`);
  }
  if (!item.expected_route || typeof item.expected_route !== "object") {
    throw new Error(`${filePath} is missing required field: expected_route`);
  }
  for (const field of ["primary", "secondary"]) {
    if (!(field in item.expected_route)) {
      throw new Error(`${filePath} expected_route is missing required field: ${field}`);
    }
  }
  if (
    typeof item.expected_route.primary !== "string" ||
    !item.expected_route.primary.trim()
  ) {
    throw new Error(`${filePath} expected_route primary must be a non-empty string`);
  }
  if (
    item.expected_route.secondary !== null &&
    (
      typeof item.expected_route.secondary !== "string" ||
      !item.expected_route.secondary.trim()
    )
  ) {
    throw new Error(`${filePath} expected_route secondary must be null or a non-empty string`);
  }
  if (!Array.isArray(item.expected_advisory)) {
    throw new Error(`${filePath} expected_advisory must be an array`);
  }
  if (item.expected_advisory.some((value) => typeof value !== "string" || !value.trim())) {
    throw new Error(`${filePath} expected_advisory must contain non-empty strings`);
  }
  if (!Array.isArray(item.must_not_select)) {
    throw new Error(`${filePath} must_not_select must be an array`);
  }
  if (item.must_not_select.some((value) => typeof value !== "string" || !value.trim())) {
    throw new Error(`${filePath} must_not_select must contain non-empty strings`);
  }
}

function validateResponseFields(item, filePath) {
  if (!Array.isArray(item.expected)) {
    throw new Error(`${filePath} expected must be an array`);
  }
  if (item.expected.some((value) => typeof value !== "string" || !value.trim())) {
    throw new Error(`${filePath} expected must contain non-empty strings`);
  }
  if (!Array.isArray(item.must_not)) {
    throw new Error(`${filePath} must_not must be an array`);
  }
  if (item.must_not.some((value) => typeof value !== "string" || !value.trim())) {
    throw new Error(`${filePath} must_not must contain non-empty strings`);
  }
  if ("quality" in item) {
    if (
      !item.quality ||
      typeof item.quality !== "object" ||
      Array.isArray(item.quality)
    ) {
      throw new Error(`${filePath} quality must be an object`);
    }
    for (const field of Object.keys(item.quality)) {
      if (!QUALITY_FIELDS.has(field)) {
        throw new Error(`${filePath} has unsupported quality field: ${field}`);
      }
    }
    if (
      "max_words" in item.quality &&
      (!Number.isInteger(item.quality.max_words) || item.quality.max_words <= 0)
    ) {
      throw new Error(`${filePath} quality.max_words must be a positive integer`);
    }
    if (
      "asks_at_most_questions" in item.quality &&
      (
        !Number.isInteger(item.quality.asks_at_most_questions) ||
        item.quality.asks_at_most_questions < 0
      )
    ) {
      throw new Error(
        `${filePath} quality.asks_at_most_questions must be a non-negative integer`,
      );
    }
  }
  if (
    "human_rubric" in item &&
    (
      !Array.isArray(item.human_rubric) ||
      item.human_rubric.some(
        (value) => typeof value !== "string" || !value.trim(),
      )
    )
  ) {
    throw new Error(`${filePath} human_rubric must be an array of non-empty strings`);
  }
}

function rejectFields(item, filePath, kind, fields, fieldType) {
  for (const field of fields) {
    if (field in item) {
      throw new Error(
        `${filePath} ${kind} case must not include ${fieldType} field: ${field}`,
      );
    }
  }
}

function validateCase(item, filePath) {
  if (!("id" in item)) {
    throw new Error(`${filePath} is missing required field: id`);
  }
  if (
    !("kind" in item) ||
    typeof item.kind !== "string" ||
    !item.kind.trim()
  ) {
    throw new Error(`${filePath} is missing required field: kind`);
  }

  const kind = getCaseKind(item);
  if (!CASE_KINDS.has(kind)) {
    throw new Error(`${filePath} has unsupported kind: ${kind}`);
  }

  validateTurns(item, filePath);
  if (kind === "route") {
    rejectFields(
      item,
      filePath,
      kind,
      RESPONSE_ONLY_FIELDS,
      "response-only",
    );
    validateRouteFields(item, filePath);
  } else if (kind === "response") {
    rejectFields(
      item,
      filePath,
      kind,
      ROUTE_ONLY_FIELDS,
      "route-only",
    );
    validateResponseFields(item, filePath);
  } else {
    validateRouteFields(item, filePath);
    validateResponseFields(item, filePath);
  }
}

function loadBenchmarkCases(root = "benchmarks") {
  return walkJsonFiles(root).map((filePath) => {
    const item = JSON.parse(fs.readFileSync(filePath, "utf8"));
    validateCase(item, filePath);
    return { ...item, kind: getCaseKind(item), file: filePath };
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

function responseAssertionCount(benchmarkCase) {
  const quality = benchmarkCase.quality || {};
  return (
    (benchmarkCase.expected || []).length +
    (benchmarkCase.must_not || []).length +
    (quality.max_words ? 1 : 0) +
    (Number.isInteger(quality.asks_at_most_questions) ? 1 : 0)
  );
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

  const rubric = Array.isArray(benchmarkCase.human_rubric)
    ? benchmarkCase.human_rubric
    : [];
  const automatedStatus = failures.length ? "fail" : "pass";
  const needsReview = automatedStatus === "pass" && rubric.length > 0;
  const result = {
    id: benchmarkCase.id,
    skill: benchmarkCase.skill,
    kind: "response",
    status: automatedStatus === "fail"
      ? "fail"
      : needsReview
        ? "needs_review"
        : "pass",
    automated_status: automatedStatus,
    score,
    max_score: maxScore,
    failures,
  };

  if (needsReview) {
    result.human_review = {
      status: "pending",
      rubric,
    };
  }

  return result;
}

function parseStructuredOutput(output) {
  if (output && typeof output === "object") return output;
  if (typeof output !== "string") {
    throw new Error("structured output must be an object or JSON string");
  }
  return JSON.parse(output.trim());
}

function reportSkill(benchmarkCase) {
  if (benchmarkCase.skill) return benchmarkCase.skill;
  return getCaseKind(benchmarkCase) === "response" ? "unknown" : "thinking-router";
}

function routeAssertionCount(benchmarkCase) {
  return (
    Object.keys(benchmarkCase.expected_profile || {}).length +
    Object.keys(benchmarkCase.expected_route || {}).length +
    1 +
    (benchmarkCase.must_not_select || []).length
  );
}

function canonicalComponents(values) {
  return [...new Set(values)].sort();
}

function sameComponents(actual, expected) {
  return JSON.stringify(canonicalComponents(actual)) ===
    JSON.stringify(canonicalComponents(expected));
}

function scoreRouteResponse(benchmarkCase, output) {
  const failures = [];
  let score = 0;
  const maxScore = routeAssertionCount(benchmarkCase);
  let parsed;

  try {
    parsed = parseStructuredOutput(output);
  } catch (error) {
    return {
      id: benchmarkCase.id,
      skill: reportSkill(benchmarkCase),
      kind: "route",
      status: "fail",
      score: 0,
      max_score: maxScore,
      failures: [`invalid route JSON: ${error.message}`],
    };
  }

  const profile = parsed.task_profile || {};
  const route = parsed.route || {};

  for (const [field, expected] of Object.entries(
    benchmarkCase.expected_profile || {}
  )) {
    if (profile[field] === expected) {
      score += 1;
    } else {
      failures.push(
        `profile ${field} expected ${JSON.stringify(expected)}, got ${JSON.stringify(profile[field])}`
      );
    }
  }

  for (const [field, expected] of Object.entries(
    benchmarkCase.expected_route || {}
  )) {
    if (route[field] === expected) {
      score += 1;
    } else {
      failures.push(
        `route ${field} expected ${JSON.stringify(expected)}, got ${JSON.stringify(route[field])}`
      );
    }
  }

  if (!Array.isArray(parsed.advisory_components)) {
    failures.push("advisory_components must be an exhaustive array");
  } else {
    if (sameComponents(
      parsed.advisory_components,
      benchmarkCase.expected_advisory || [],
    )) {
      score += 1;
    } else {
      failures.push(
        `advisory_components expected ${JSON.stringify(canonicalComponents(benchmarkCase.expected_advisory || []))}, got ${JSON.stringify(canonicalComponents(parsed.advisory_components))}`
      );
    }

    const selected = new Set(
      [
        route.primary,
        route.secondary,
        ...parsed.advisory_components,
      ].filter(Boolean)
    );
    for (const forbidden of benchmarkCase.must_not_select || []) {
      if (selected.has(forbidden)) {
        failures.push(`selected forbidden skill: ${forbidden}`);
      } else {
        score += 1;
      }
    }
  }

  return {
    id: benchmarkCase.id,
    skill: reportSkill(benchmarkCase),
    kind: "route",
    status: failures.length ? "fail" : "pass",
    score,
    max_score: maxScore,
    failures,
  };
}

function invalidRouteSample(sampleIndex, rawOutput, error, message) {
  return {
    sample_index: sampleIndex,
    status: "invalid",
    raw_output: rawOutput,
    error,
    message,
  };
}

function validateActualRouteContract(parsed) {
  const failures = [];
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return ["route output must be a JSON object"];
  }

  const profile = parsed.task_profile;
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    failures.push("task_profile must be an object");
  } else {
    for (const field of REQUIRED_PROFILE_FIELDS) {
      if (!(field in profile)) {
        failures.push(`task_profile is missing required field: ${field}`);
      }
    }
    for (const [field, allowedValues] of Object.entries(PROFILE_ENUMS)) {
      if (field in profile && !allowedValues.has(profile[field])) {
        failures.push(`task_profile ${field} has unsupported value: ${profile[field]}`);
      }
    }
    if (
      "artifact" in profile &&
      (typeof profile.artifact !== "string" || !profile.artifact.trim())
    ) {
      failures.push("task_profile artifact must be a non-empty string");
    }
  }

  const route = parsed.route;
  if (!route || typeof route !== "object" || Array.isArray(route)) {
    failures.push("route must be an object");
  } else {
    if (
      typeof route.primary !== "string" ||
      !route.primary.trim()
    ) {
      failures.push("route primary must be a non-empty string");
    }
    if (!("secondary" in route)) {
      failures.push("route is missing required field: secondary");
    } else if (
      route.secondary !== null &&
      (
        typeof route.secondary !== "string" ||
        !route.secondary.trim()
      )
    ) {
      failures.push("route secondary must be null or a non-empty string");
    }
  }

  if (!Array.isArray(parsed.advisory_components)) {
    failures.push("advisory_components must be an exhaustive array");
  } else if (
    parsed.advisory_components.some(
      (value) => typeof value !== "string" || !value.trim(),
    )
  ) {
    failures.push("advisory_components must contain non-empty strings");
  }

  return failures;
}

function normalizeRouteSample(output, sampleIndex = 1) {
  let parsed;
  try {
    parsed = parseStructuredOutput(output);
  } catch (error) {
    return invalidRouteSample(
      sampleIndex,
      output,
      "invalid_json",
      error.message,
    );
  }

  const contractFailures = validateActualRouteContract(parsed);
  if (contractFailures.length) {
    return invalidRouteSample(
      sampleIndex,
      output,
      "invalid_contract",
      contractFailures.join("; "),
    );
  }

  const signature = {
    task_profile: Object.fromEntries(
      REQUIRED_PROFILE_FIELDS.map(
        (field) => [field, parsed.task_profile[field]],
      ),
    ),
    route: {
      primary: parsed.route.primary,
      secondary: parsed.route.secondary,
    },
    advisory_components: canonicalComponents(parsed.advisory_components),
  };

  return {
    sample_index: sampleIndex,
    status: "valid",
    raw_output: output,
    signature,
  };
}

function commandErrorRouteSample(error, sampleIndex = 1) {
  return invalidRouteSample(
    sampleIndex,
    null,
    "command_error",
    error instanceof Error ? error.message : String(error),
  );
}

function buildRouteOutcomeDistribution(samples) {
  const groups = new Map();
  for (const sample of samples) {
    const key = sample.status === "valid"
      ? `valid:${JSON.stringify(sample.signature)}`
      : `invalid:${sample.error}`;
    const current = groups.get(key) || (
      sample.status === "valid"
        ? { count: 0, signature: sample.signature }
        : { count: 0, error: sample.error }
    );
    current.count += 1;
    groups.set(key, current);
  }

  return [...groups.entries()]
    .sort(([leftKey, left], [rightKey, right]) =>
      right.count - left.count || leftKey.localeCompare(rightKey)
    )
    .map(([, outcome]) => outcome);
}

function aggregateRouteSamples(benchmarkCase, samples) {
  if (!Array.isArray(samples) || samples.length < 3) {
    throw new Error("route sampling requires at least 3 samples");
  }

  const outcomeDistribution = buildRouteOutcomeDistribution(samples);
  const validOutcomes = outcomeDistribution.filter(
    (outcome) => Boolean(outcome.signature),
  );
  const leader = validOutcomes[0] || null;
  const majorityCount = leader ? leader.count : 0;
  const consensusRate = majorityCount / samples.length;
  const hasStrictMajority = majorityCount > samples.length / 2;
  const samplingFields = {
    sample_count: samples.length,
    majority_count: majorityCount,
    consensus_rate: consensusRate,
    majority_signature: hasStrictMajority ? leader.signature : null,
    outcome_distribution: outcomeDistribution,
    samples,
  };

  if (!hasStrictMajority) {
    return {
      id: benchmarkCase.id,
      skill: reportSkill(benchmarkCase),
      kind: "route",
      status: "unstable",
      score: 0,
      max_score: routeAssertionCount(benchmarkCase),
      failures: [
        `no_strict_majority: highest valid route signature appeared ${majorityCount} of ${samples.length} samples`,
      ],
      ...samplingFields,
    };
  }

  return {
    ...scoreRouteResponse(benchmarkCase, leader.signature),
    ...samplingFields,
  };
}

function scoreIntegrationResponse(
  benchmarkCase,
  response,
  traceEnvelope,
  binding = null,
) {
  const expectedDomain = [
    benchmarkCase.expected_route?.primary,
    benchmarkCase.expected_route?.secondary,
  ].filter(Boolean);
  const expectedAdvisory = benchmarkCase.expected_advisory || [];
  const forbiddenSkills = benchmarkCase.must_not_select || [];
  const lifecycleAssertionCount =
    expectedDomain.length +
    expectedAdvisory.length +
    1 +
    forbiddenSkills.length;
  const maxScore =
    routeAssertionCount(benchmarkCase) +
    responseAssertionCount(benchmarkCase) +
    lifecycleAssertionCount;
  if (!traceEnvelope) {
    return {
      id: benchmarkCase.id,
      skill: reportSkill(benchmarkCase),
      kind: "integration",
      status: "fail",
      score: 0,
      max_score: maxScore,
      failures: ["missing integration trace"],
    };
  }

  if (!trustedTraceEnvelopes.has(traceEnvelope)) {
    return {
      id: benchmarkCase.id,
      skill: reportSkill(benchmarkCase),
      kind: "integration",
      status: "fail",
      score: 0,
      max_score: maxScore,
      failures: ["integration trace did not arrive through the trusted --traces evaluator channel"],
    };
  }

  const bindingFailures = [];
  if (!binding || typeof binding !== "object") {
    bindingFailures.push("missing integration run binding");
  } else {
    if (traceEnvelope.case_id !== benchmarkCase.id) {
      bindingFailures.push("trace case binding mismatch");
    }
    if (traceEnvelope.run_nonce !== binding.run_nonce) {
      bindingFailures.push("trace run nonce binding mismatch");
    }
    if (
      traceEnvelope.candidate_prompt_sha256 !== binding.candidate_prompt_sha256
    ) {
      bindingFailures.push("trace candidate Prompt binding mismatch");
    }
    if (traceEnvelope.response_sha256 !== hashText(response)) {
      bindingFailures.push("trace response binding mismatch");
    }
    if (traceEnvelope.adapter_id !== binding.adapter_id) {
      bindingFailures.push("trace adapter binding mismatch");
    }
    if (traceEnvelope.adapter_version !== binding.adapter_version) {
      bindingFailures.push("trace adapter version binding mismatch");
    }
  }
  if (bindingFailures.length) {
    return {
      id: benchmarkCase.id,
      skill: reportSkill(benchmarkCase),
      kind: "integration",
      status: "fail",
      score: 0,
      max_score: maxScore,
      failures: bindingFailures,
    };
  }

  const events = traceEnvelope.trace.events;
  const selectedDomain = new Set(
    events
      .filter((event) => event.event === "selected" && event.role === "domain")
      .map((event) => event.skill),
  );
  const loadedDomain = new Set(
    events
      .filter((event) => event.event === "loaded" && event.role === "domain")
      .map((event) => event.skill),
  );
  const selectedAdvisory = new Set(
    events
      .filter((event) => event.event === "selected" && event.role === "advisory")
      .map((event) => event.skill),
  );
  const loadedAdvisory = new Set(
    events
      .filter((event) => event.event === "loaded" && event.role === "advisory")
      .map((event) => event.skill),
  );
  const activatedDomain = canonicalComponents([
    ...selectedDomain,
    ...loadedDomain,
  ]);
  const activatedAdvisory = canonicalComponents([
    ...selectedAdvisory,
    ...loadedAdvisory,
  ]);
  const routeResult = scoreRouteResponse(benchmarkCase, {
    ...traceEnvelope.trace,
    advisory_components: activatedAdvisory,
  });
  const responseResult = scoreResponse(benchmarkCase, response);
  let lifecycleScore = 0;
  const lifecycleFailures = [];
  if (sameComponents(activatedDomain, expectedDomain)) {
    lifecycleScore += 1;
  } else {
    lifecycleFailures.push(
      `trace: domain set expected ${JSON.stringify(canonicalComponents(expectedDomain))}, got ${JSON.stringify(activatedDomain)}`,
    );
  }
  for (const skill of expectedDomain) {
    if (selectedDomain.has(skill) && loadedDomain.has(skill)) {
      lifecycleScore += 1;
    } else {
      lifecycleFailures.push(
        `trace: expected domain Skill ${skill} to be selected and loaded`,
      );
    }
  }
  const selectedOrLoadedAcrossRoles = new Set(
    events
      .filter((event) => event.event === "selected" || event.event === "loaded")
      .map((event) => event.skill),
  );
  for (const skill of forbiddenSkills) {
    if (selectedOrLoadedAcrossRoles.has(skill)) {
      lifecycleFailures.push(
        `trace: forbidden Skill ${skill} was selected or loaded`,
      );
    } else {
      lifecycleScore += 1;
    }
  }
  for (const skill of expectedAdvisory) {
    if (selectedAdvisory.has(skill) && loadedAdvisory.has(skill)) {
      lifecycleScore += 1;
    } else {
      lifecycleFailures.push(
        `trace: expected advisory Skill ${skill} to be selected and loaded`,
      );
    }
  }
  const failures = [
    ...routeResult.failures.map((item) => `trace: ${item}`),
    ...responseResult.failures.map((item) => `response: ${item}`),
    ...lifecycleFailures,
  ];
  const automatedStatus = failures.length ? "fail" : "pass";
  const status = automatedStatus === "fail"
    ? "fail"
    : responseResult.status === "needs_review"
      ? "needs_review"
      : "pass";

  const result = {
    id: benchmarkCase.id,
    skill: reportSkill(benchmarkCase),
    kind: "integration",
    status,
    automated_status: automatedStatus,
    score: routeResult.score + responseResult.score + lifecycleScore,
    max_score:
      routeResult.max_score + responseResult.max_score + lifecycleAssertionCount,
    failures,
    trace_provenance: {
      source: traceEnvelope.source,
      case_id: traceEnvelope.case_id,
      run_nonce: traceEnvelope.run_nonce,
      adapter_id: traceEnvelope.adapter_id,
      adapter_version: traceEnvelope.adapter_version,
      captured_at: traceEnvelope.captured_at,
      candidate_prompt_sha256: traceEnvelope.candidate_prompt_sha256,
      response_sha256: traceEnvelope.response_sha256,
      events_sha256: traceEnvelope.events_sha256,
    },
  };

  if (status === "needs_review") {
    result.human_review = responseResult.human_review;
  }

  return result;
}

function formatConversation(benchmarkCase) {
  return getCaseTurns(benchmarkCase)
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
    .join("\n\n");
}

function buildAgentPrompt(benchmarkCase) {
  const kind = getCaseKind(benchmarkCase);
  const conversation = formatConversation(benchmarkCase);

  if (kind === "route") {
    return [
      "Classify and route the conversation without answering its substantive request.",
      "Return exactly one JSON object with task_profile, route, and advisory_components.",
      "task_profile must contain domain, objective, mutation, artifact, and artifact_sink; confidence is optional.",
      "route must contain primary and secondary.",
      "advisory_components must be an exhaustive JSON array of every additional Process Skill selected; use [] when none are selected.",
      "Do not include commentary outside the JSON object.",
      "",
      "Conversation:",
      conversation,
    ].join("\n");
  }

  return [
    "Answer the conversation naturally.",
    "",
    "Conversation:",
    conversation,
  ].join("\n");
}

function normalizeSavedResponses(parsed) {
  const entries = Array.isArray(parsed)
    ? parsed.map((item) => {
        const { id, ...payload } = item;
        return [id, payload];
      })
    : Object.entries(parsed);

  return Object.fromEntries(entries.map(([id, payload]) => {
    if (payload && typeof payload === "object" && "trace" in payload) {
      throw new Error(
        `${id}: integration traces must be supplied through the separate --traces evaluator channel`,
      );
    }
    if (
      payload &&
      typeof payload === "object" &&
      Object.keys(payload).length === 1 &&
      "response" in payload
    ) {
      return [id, payload.response || ""];
    }
    return [id, payload];
  }));
}

function loadResponses(filePath, responsesData = null) {
  if (responsesData) return normalizeSavedResponses(responsesData);
  if (!filePath) return {};
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return normalizeSavedResponses(parsed);
}

function normalizeTraceRecords(parsed) {
  const entries = Array.isArray(parsed)
    ? parsed.map((item) => {
        const { id, ...envelope } = item;
        return [id, envelope];
      })
    : Object.entries(parsed);

  return Object.fromEntries(entries.map(([id, envelope]) => {
    if (!envelope || typeof envelope !== "object") {
      throw new Error(`${id}: trace envelope must be an object`);
    }
    if (envelope.source !== "host_adapter") {
      throw new Error(`${id}: trace source must be host_adapter`);
    }
    if (envelope.case_id !== id) {
      throw new Error(`${id}: trace case_id must match its response id`);
    }
    if (typeof envelope.run_nonce !== "string" || !envelope.run_nonce.trim()) {
      throw new Error(`${id}: trace run_nonce is required`);
    }
    if (typeof envelope.adapter_id !== "string" || !envelope.adapter_id.trim()) {
      throw new Error(`${id}: trace adapter_id is required`);
    }
    if (
      typeof envelope.adapter_version !== "string" ||
      !envelope.adapter_version.trim()
    ) {
      throw new Error(`${id}: trace adapter_version is required`);
    }
    if (
      typeof envelope.captured_at !== "string" ||
      Number.isNaN(Date.parse(envelope.captured_at))
    ) {
      throw new Error(`${id}: trace captured_at must be an ISO timestamp`);
    }
    for (const field of [
      "candidate_prompt_sha256",
      "response_sha256",
      "events_sha256",
    ]) {
      if (!/^[a-f0-9]{64}$/.test(envelope[field] || "")) {
        throw new Error(`${id}: trace ${field} must be a SHA-256 hex digest`);
      }
    }
    if (!envelope.trace || typeof envelope.trace !== "object") {
      throw new Error(`${id}: trace payload is required`);
    }
    if (
      envelope.trace.complete !== true ||
      !Array.isArray(envelope.trace.events)
    ) {
      throw new Error(`${id}: trace must contain a complete event stream`);
    }
    if (!Array.isArray(envelope.trace.advisory_components)) {
      throw new Error(`${id}: trace advisory_components must be an array`);
    }

    const allowedEvents = new Set(["discovered", "selected", "loaded"]);
    const lifecycleRank = new Map([
      ["discovered", 0],
      ["selected", 1],
      ["loaded", 2],
    ]);
    const lifecycleBySkill = new Map();
    for (const event of envelope.trace.events) {
      if (
        !event ||
        !allowedEvents.has(event.event) ||
        typeof event.skill !== "string" ||
        !["domain", "advisory"].includes(event.role)
      ) {
        throw new Error(`${id}: trace contains an invalid Skill event`);
      }

      const key = `${event.role}:${event.skill}`;
      const expectedRank = lifecycleBySkill.has(key)
        ? lifecycleBySkill.get(key) + 1
        : 0;
      if (lifecycleRank.get(event.event) !== expectedRank) {
        throw new Error(`${id}: trace Skill lifecycle order is invalid for ${key}`);
      }
      lifecycleBySkill.set(key, expectedRank);
    }

    if (
      envelope.events_sha256 !==
      hashText(JSON.stringify(envelope.trace.events))
    ) {
      throw new Error(`${id}: trace events_sha256 does not match events`);
    }

    const loadedAdvisory = envelope.trace.events
      .filter((event) => event.event === "loaded" && event.role === "advisory")
      .map((event) => event.skill);
    if (!sameComponents(
      envelope.trace.advisory_components,
      loadedAdvisory,
    )) {
      throw new Error(
        `${id}: trace advisory_components must match loaded advisory events`,
      );
    }

    const trusted = {
      source: envelope.source,
      case_id: envelope.case_id,
      run_nonce: envelope.run_nonce,
      adapter_id: envelope.adapter_id,
      adapter_version: envelope.adapter_version,
      captured_at: envelope.captured_at,
      candidate_prompt_sha256: envelope.candidate_prompt_sha256,
      response_sha256: envelope.response_sha256,
      events_sha256: envelope.events_sha256,
      trace: envelope.trace,
    };
    trustedTraceEnvelopes.add(trusted);
    return [id, trusted];
  }));
}

function loadTraces(filePath, tracesData = null) {
  if (tracesData) return normalizeTraceRecords(tracesData);
  if (!filePath) return {};
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return normalizeTraceRecords(parsed);
}

function scoreBenchmarkOutput(
  benchmarkCase,
  output,
  traceEnvelope = null,
  traceBinding = null,
) {
  const kind = getCaseKind(benchmarkCase);
  if (kind === "route") return scoreRouteResponse(benchmarkCase, output);
  if (kind === "integration") {
    return scoreIntegrationResponse(
      benchmarkCase,
      output,
      traceEnvelope,
      traceBinding,
    );
  }
  return scoreResponse(benchmarkCase, output);
}

function detectMode(options) {
  if (options.list) return "list";
  if (options.prompts) return "prompts";
  if (options.responses || options.responsesData) return "responses";
  if (options.command) return "command";
  return "not_run";
}

function getGitCommit() {
  try {
    const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
      encoding: "utf8",
      shell: false,
    });
    if (result.status === 0) return result.stdout.trim();
  } catch (_error) {
    return "unknown";
  }
  return "unknown";
}

function hashText(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function hashCaseSet(cases) {
  const serialized = cases.map((item) => {
    const { file: _file, ...payload } = item;
    return JSON.stringify(payload);
  }).join("\n");
  return hashText(serialized);
}

function hashPromptSet(cases) {
  return hashText(
    cases.map((item) => hashText(buildAgentPrompt(item))).join("\n"),
  );
}

function buildCandidateBinding(options) {
  const binding = {
    candidate_model: options.candidateModel || null,
    harness_version: options.harnessVersion || null,
    sampling_config_sha256: options.samplingConfigSha256 || null,
    skill_bundle_sha256: options.skillBundleSha256 || null,
    adapter_id: options.adapterId || null,
    adapter_version: options.adapterVersion || null,
  };
  const required = [
    binding.candidate_model,
    binding.harness_version,
    binding.sampling_config_sha256,
    binding.skill_bundle_sha256,
  ];
  if (options.traces || options.tracesData) {
    required.push(binding.adapter_id, binding.adapter_version);
  }
  const complete = required.every(Boolean);
  return {
    binding,
    complete,
    sha256: complete ? hashText(JSON.stringify(binding)) : null,
  };
}

function createRunInfo(options, cases) {
  const createdAt = options.createdAt || new Date().toISOString();
  const compactTimestamp = createdAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  const candidateBinding = buildCandidateBinding(options);
  const sampleCount = options.samples === undefined ? 1 : options.samples;
  const candidateCommandSha256 = options.command
    ? hashText(options.command)
    : null;
  return {
    id: options.runId || `run-${compactTimestamp}`,
    created_at: createdAt,
    commit: options.commit || getGitCommit(),
    cases: options.cases || "benchmarks",
    mode: detectMode(options),
    contract_version: BENCHMARK_CONTRACT_VERSION,
    case_set_sha256: hashCaseSet(cases),
    prompt_set_sha256: hashPromptSet(cases),
    case_order: cases.map((item) => item.id),
    kind_filter: options.kind || null,
    samples_per_case: sampleCount,
    candidate_cwd: options.command
      ? sampleCount > 1
        ? "isolated_temp_per_sample"
        : "isolated_temp_per_case"
      : null,
    candidate_command_sha256: candidateCommandSha256,
    candidate_binding: candidateBinding.binding,
    candidate_binding_sha256: candidateBinding.sha256,
    comparison_eligible:
      candidateBinding.complete &&
      (sampleCount === 1 || Boolean(candidateCommandSha256)),
    run_nonce: options.runNonce || null,
  };
}

function summarizeResults(results) {
  const score = results.reduce((total, item) => total + (item.score || 0), 0);
  const maxScore = results.reduce((total, item) => total + (item.max_score || 0), 0);
  const unstable = results.filter((item) => item.status === "unstable").length;
  return {
    total: results.length,
    pass: results.filter((item) => item.status === "pass").length,
    fail: results.filter(
      (item) => item.status === "fail" || item.status === "unstable",
    ).length,
    unstable,
    needs_review: results.filter((item) => item.status === "needs_review").length,
    not_run: results.filter((item) => item.status === "not_run").length,
    score,
    max_score: maxScore,
    score_percent: maxScore ? Math.round((score / maxScore) * 1000) / 10 : 0,
  };
}

function summarizeBySkill(results) {
  const grouped = new Map();
  for (const result of results) {
    const skill = result.skill || "unknown";
    const current = grouped.get(skill) || [];
    current.push(result);
    grouped.set(skill, current);
  }

  return Object.fromEntries(
    [...grouped.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([skill, items]) => [skill, summarizeResults(items)])
  );
}

function roundRate(value) {
  return Math.round(value * 1000) / 1000;
}

function summarizeRouteSampling(results, sampleCount) {
  const rates = results.map((result) => result.consensus_rate);
  const invalidSamples = results.reduce(
    (total, result) =>
      total +
      result.samples.filter((sample) => sample.status === "invalid").length,
    0,
  );
  return {
    samples_per_case: sampleCount,
    average_consensus_rate: rates.length
      ? roundRate(rates.reduce((total, rate) => total + rate, 0) / rates.length)
      : 0,
    minimum_consensus_rate: rates.length ? Math.min(...rates) : 0,
    unstable_cases: results.filter(
      (result) => result.status === "unstable",
    ).length,
    invalid_samples: invalidSamples,
  };
}

function parseSamplesArgument(value) {
  if (!/^[0-9]+$/.test(String(value || ""))) {
    throw new Error("--samples must be an integer greater than or equal to 3");
  }
  const samples = Number(value);
  if (samples < 3) {
    throw new Error("--samples must be an integer greater than or equal to 3");
  }
  return samples;
}

function parseKindArgument(value) {
  if (!CASE_KINDS.has(value)) {
    throw new Error(
      `--kind must be one of: ${[...CASE_KINDS].join(", ")}`,
    );
  }
  return value;
}

function selectCasesByKind(cases, kind) {
  if (!kind) return cases;
  if (!CASE_KINDS.has(kind)) {
    throw new Error(
      `--kind must be one of: ${[...CASE_KINDS].join(", ")}`,
    );
  }
  const selected = cases.filter((item) => getCaseKind(item) === kind);
  if (!selected.length) {
    throw new Error(`No benchmark cases matched --kind ${kind}`);
  }
  return selected;
}

function resolveSampleCount(options) {
  const sampleCount = options.samples === undefined ? 1 : options.samples;
  if (
    !Number.isInteger(sampleCount) ||
    sampleCount < 1 ||
    (sampleCount > 1 && sampleCount < 3)
  ) {
    throw new Error("--samples must be an integer greater than or equal to 3");
  }
  return sampleCount;
}

function validateSamplingMode(options, sampleCount) {
  if (sampleCount === 1) return;
  if (options.kind !== "route") {
    throw new Error("--samples supports only --kind route");
  }
  if (!options.command) {
    throw new Error("--samples requires --command");
  }
  if (
    options.responses ||
    options.responsesData ||
    options.traces ||
    options.tracesData
  ) {
    throw new Error("--samples cannot be combined with saved responses or traces");
  }
  if (options.list || options.prompts) {
    throw new Error("--samples cannot be combined with --list or --prompts");
  }
}

function parseArgs(argv) {
  const args = {
    cases: "benchmarks",
    out: null,
    responses: null,
    traces: null,
    runNonce: null,
    adapterId: null,
    adapterVersion: null,
    candidateModel: null,
    harnessVersion: null,
    samplingConfigSha256: null,
    skillBundleSha256: null,
    command: null,
    kind: null,
    samples: 1,
    list: false,
    prompts: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--cases") args.cases = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--responses") args.responses = argv[++index];
    else if (arg === "--traces") args.traces = argv[++index];
    else if (arg === "--run-nonce") args.runNonce = argv[++index];
    else if (arg === "--adapter-id") args.adapterId = argv[++index];
    else if (arg === "--adapter-version") args.adapterVersion = argv[++index];
    else if (arg === "--candidate-model") args.candidateModel = argv[++index];
    else if (arg === "--harness-version") args.harnessVersion = argv[++index];
    else if (arg === "--sampling-config-sha256") args.samplingConfigSha256 = argv[++index];
    else if (arg === "--skill-bundle-sha256") args.skillBundleSha256 = argv[++index];
    else if (arg === "--command") args.command = argv[++index];
    else if (arg === "--kind") args.kind = parseKindArgument(argv[++index]);
    else if (arg === "--samples") args.samples = parseSamplesArgument(argv[++index]);
    else if (arg === "--list") args.list = true;
    else if (arg === "--prompts") args.prompts = true;
    else if (arg === "--help") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function parseCommandParts(command) {
  if (typeof command !== "string" || !command.trim()) {
    throw new Error("--command must be a non-empty string");
  }

  const parts = [];
  let current = "";
  let quote = null;

  for (const character of command.trim()) {
    if (quote) {
      if (character === quote) {
        quote = null;
      } else {
        current += character;
      }
    } else if (character === "'" || character === "\"") {
      quote = character;
    } else if (/\s/.test(character)) {
      if (current) {
        parts.push(current);
        current = "";
      }
    } else {
      current += character;
    }
  }

  if (quote) {
    throw new Error("--command contains an unterminated quote");
  }
  if (current) parts.push(current);
  if (!parts.length) {
    throw new Error("--command must contain an executable");
  }
  return parts;
}

function resolveCommandParts(command, invocationCwd) {
  return parseCommandParts(command).map((part) => {
    if (path.isAbsolute(part) || part.startsWith("-")) return part;
    const resolved = path.resolve(invocationCwd, part);
    return fs.existsSync(resolved) ? resolved : part;
  });
}

function runCommand(command, prompt) {
  const parts = resolveCommandParts(command, process.cwd());
  const candidateCwd = fs.mkdtempSync(
    path.join(os.tmpdir(), "thinking-benchmark-candidate-"),
  );
  let result;
  try {
    result = spawnSync(parts[0], parts.slice(1), {
      input: prompt,
      encoding: "utf8",
      shell: false,
      cwd: candidateCwd,
      maxBuffer: 1024 * 1024 * 10,
    });
  } finally {
    fs.rmSync(candidateCwd, { recursive: true, force: true });
  }

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`command failed with exit ${result.status}: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function runRouteSampling(
  benchmarkCase,
  prompt,
  options,
  sampleCount,
) {
  const executeCommand = options.commandRunner || runCommand;
  const samples = [];
  for (let index = 0; index < sampleCount; index += 1) {
    try {
      const output = executeCommand(options.command, prompt);
      samples.push(normalizeRouteSample(output, index + 1));
    } catch (error) {
      samples.push(commandErrorRouteSample(error, index + 1));
    }
  }
  return aggregateRouteSamples(benchmarkCase, samples);
}

function runBenchmark(options) {
  const cases = selectCasesByKind(
    loadBenchmarkCases(options.cases),
    options.kind || null,
  );
  const sampleCount = resolveSampleCount(options);
  validateSamplingMode(options, sampleCount);
  if (
    options.command &&
    cases.some((item) => getCaseKind(item) === "integration")
  ) {
    throw new Error(
      "--command cannot run integration cases; use adapter-captured --responses and --traces from the same run",
    );
  }
  if (
    (options.traces || options.tracesData) &&
    (!options.runNonce || !options.adapterId || !options.adapterVersion)
  ) {
    throw new Error(
      "--traces requires --run-nonce, --adapter-id, and --adapter-version",
    );
  }
  const responses = loadResponses(options.responses, options.responsesData);
  const traces = loadTraces(options.traces, options.tracesData);
  const results = [];

  for (const item of cases) {
    const prompt = buildAgentPrompt(item);
    const candidatePromptSha256 = hashText(prompt);
    const skill = reportSkill(item);

    if (options.list || options.prompts) {
      results.push({
        id: item.id,
        skill,
        kind: getCaseKind(item),
        candidate_prompt_sha256: candidatePromptSha256,
        prompt: options.prompts
          ? prompt
          : item.prompt || getCaseTurns(item)[0].content,
      });
      continue;
    }

    if (sampleCount > 1) {
      results.push({
        ...runRouteSampling(item, prompt, options, sampleCount),
        candidate_prompt_sha256: candidatePromptSha256,
      });
      continue;
    }

    const response =
      responses[item.id] ||
      (options.command
        ? (options.commandRunner || runCommand)(options.command, prompt)
        : "");

    if (!response) {
      results.push({
        id: item.id,
        skill,
        kind: getCaseKind(item),
        candidate_prompt_sha256: candidatePromptSha256,
        status: "not_run",
        reason: "No response supplied. Use --responses or --command.",
      });
      continue;
    }

    const binding = getCaseKind(item) === "integration"
      ? {
          run_nonce: options.runNonce,
          candidate_prompt_sha256: candidatePromptSha256,
          adapter_id: options.adapterId,
          adapter_version: options.adapterVersion,
        }
      : null;
    results.push({
      ...scoreBenchmarkOutput(item, response, traces[item.id], binding),
      candidate_prompt_sha256: candidatePromptSha256,
    });
  }

  const report = {
    run: createRunInfo({ ...options, samples: sampleCount }, cases),
    summary: summarizeResults(results),
    by_skill: summarizeBySkill(results),
    results,
  };
  if (sampleCount > 1) {
    report.sampling = summarizeRouteSampling(results, sampleCount);
  }
  return report;
}

function printHelp() {
  console.log(`Usage:
  node scripts/run-benchmark.js --list
  node scripts/run-benchmark.js --prompts
  node scripts/run-benchmark.js --responses benchmark-responses.json
  node scripts/run-benchmark.js --responses benchmark-responses.json --traces host-traces.json
  node scripts/run-benchmark.js --command "your-agent-command"
  node scripts/run-benchmark.js --kind route --samples 5 --command "your-agent-command"

Options:
  --cases <dir>       Benchmark case directory. Default: benchmarks
  --out <file>        Write JSON report to a file
  --responses <file>  Score saved responses by case id
  --traces <file>     Trusted host-adapter traces for integration cases
  --run-nonce <id>    Bind integration responses and traces to one adapter run
  --adapter-id <id>   Trusted host adapter identifier
  --adapter-version <version>  Trusted host adapter version
  --candidate-model <id>       Candidate model binding for comparable runs
  --harness-version <version>  Candidate harness binding for comparable runs
  --sampling-config-sha256 <hash>  Sampling configuration binding
  --skill-bundle-sha256 <hash>     Installed Skill bundle binding
  --command <cmd>     Run an agent command once per case; prompt is sent on stdin
  --kind <kind>       Run only route, response, or integration cases
  --samples <N>       Run each route command N times; N must be at least 3
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
  aggregateRouteSamples,
  buildAgentPrompt,
  commandErrorRouteSample,
  getCaseKind,
  loadBenchmarkCases,
  loadResponses,
  loadTraces,
  normalizeRouteSample,
  parseArgs,
  runBenchmark,
  runCommand,
  scoreIntegrationResponse,
  scoreRouteResponse,
  scoreResponse,
  summarizeBySkill,
  summarizeResults,
};
