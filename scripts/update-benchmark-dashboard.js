#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

function walkJsonFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(root, entry.name);
      if (entry.isDirectory()) return walkJsonFiles(fullPath);
      if (entry.isFile() && entry.name.endsWith(".json")) return [fullPath];
      return [];
    })
    .sort();
}

function loadRunReports(root = "benchmark-runs") {
  return walkJsonFiles(root)
    .map((filePath) => {
      const report = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return { ...report, file: filePath };
    })
    .filter((report) => report.run && report.summary && Array.isArray(report.results))
    .sort((a, b) => String(a.run.created_at).localeCompare(String(b.run.created_at)));
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0%";
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${formatted}%`;
}

function formatDelta(value) {
  if (value === null || value === undefined) return "-";
  if (value > 0) return `+${formatPercent(value)}`;
  return formatPercent(value);
}

function cell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

function bySkill(report) {
  const grouped = new Map();
  for (const result of report.results) {
    const skill = result.skill || "unknown";
    const current = grouped.get(skill) || {
      skill,
      total: 0,
      pass: 0,
      fail: 0,
      unstable: 0,
      needs_review: 0,
      not_run: 0,
      score: 0,
      max_score: 0,
    };
    current.total += 1;
    current.pass += result.status === "pass" ? 1 : 0;
    current.fail += (
      result.status === "fail" ||
      result.status === "unstable"
    ) ? 1 : 0;
    current.unstable += result.status === "unstable" ? 1 : 0;
    current.needs_review += result.status === "needs_review" ? 1 : 0;
    current.not_run += result.status === "not_run" ? 1 : 0;
    current.score += result.score || 0;
    current.max_score += result.max_score || 0;
    grouped.set(skill, current);
  }

  return [...grouped.values()]
    .map((item) => ({
      ...item,
      score_percent: item.max_score ? (item.score / item.max_score) * 100 : 0,
    }))
    .sort((a, b) => a.skill.localeCompare(b.skill));
}

function isScoredReport(report) {
  return Boolean(
    report &&
    report.summary &&
    report.summary.max_score > 0 &&
    (report.summary.needs_review || 0) === 0 &&
    (report.summary.not_run || 0) === 0 &&
    report.summary.total === report.summary.pass + report.summary.fail
  );
}

function isEvaluatedReport(report) {
  return Boolean(report && report.summary && report.summary.max_score > 0);
}

function isComparableReport(report) {
  if (!isScoredReport(report)) return false;
  const commandIsBound =
    report.run.mode !== "command" ||
    Boolean(report.run.candidate_command_sha256);
  return Boolean(
    report.run.contract_version &&
    report.run.case_set_sha256 &&
    report.run.prompt_set_sha256 &&
    report.run.candidate_binding_sha256 &&
    report.run.comparison_eligible === true &&
    commandIsBound
  );
}

function comparisonKey(report) {
  const contract = report.run.contract_version || "legacy";
  const caseSet = report.run.case_set_sha256 || "unknown";
  const promptSet = report.run.prompt_set_sha256 || "unknown";
  const binding = report.run.candidate_binding_sha256 || "unknown";
  const mode = report.run.mode || "legacy";
  const kind = report.run.kind_filter || "all";
  const samples = report.run.samples_per_case || 1;
  const command = report.run.candidate_command_sha256 || "not-command-bound";
  return [
    contract,
    caseSet,
    promptSet,
    binding,
    mode,
    kind,
    samples,
    command,
  ].join(":");
}

function buildDashboard(reports) {
  const evaluatedReports = reports.filter(isEvaluatedReport);
  const latest = evaluatedReports[evaluatedReports.length - 1];
  const previous = latest && isComparableReport(latest)
    ? [...evaluatedReports]
        .slice(0, -1)
        .reverse()
        .find((report) =>
          isComparableReport(report) && comparisonKey(report) === comparisonKey(latest)
        )
    : null;
  const lines = [];

  lines.push("# Benchmark Dashboard");
  lines.push("");
  lines.push("Generated from benchmark run JSON files.");
  lines.push("");

  if (!reports.length) {
    lines.push("No benchmark runs found.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Summary");
  lines.push("");
  lines.push("| Run | Created At | Commit | Cases | Total | Pass | Fail | Unstable | Needs Review | Not Run | Samples | Avg Consensus | Min Consensus | Score | Delta |");
  lines.push("|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|");

  const previousScoredByContract = new Map();
  for (let index = 0; index < reports.length; index += 1) {
    const report = reports[index];
    const scored = isScoredReport(report);
    const comparable = isComparableReport(report);
    const key = comparisonKey(report);
    const previousScored = previousScoredByContract.get(key);
    const delta = comparable && previousScored
      ? report.summary.score_percent - previousScored.summary.score_percent
      : null;
    const needsReview = report.summary.needs_review || 0;
    const partialCoverage = (report.summary.not_run || 0) > 0;
    const score = needsReview > 0
      ? "Pending review"
      : partialCoverage
        ? "Partial coverage"
      : scored
        ? formatPercent(report.summary.score_percent)
        : "Coverage only";
    const sampling = report.sampling || {};
    const samples = report.run.samples_per_case || 1;
    const averageConsensus = samples > 1
      ? formatPercent((sampling.average_consensus_rate || 0) * 100)
      : "-";
    const minimumConsensus = samples > 1
      ? formatPercent((sampling.minimum_consensus_rate || 0) * 100)
      : "-";
    lines.push(
      `| ${cell(report.run.id)} | ${cell(report.run.created_at)} | ${cell(report.run.commit || "unknown")} | ${cell(report.run.cases || "benchmarks")} | ${report.summary.total} | ${report.summary.pass} | ${report.summary.fail} | ${report.summary.unstable || 0} | ${needsReview} | ${report.summary.not_run} | ${samples} | ${averageConsensus} | ${minimumConsensus} | ${score} | ${formatDelta(delta)} |`
    );
    if (comparable) previousScoredByContract.set(key, report);
  }

  lines.push("");
  lines.push("## By Skill");
  lines.push("");
  lines.push("| Skill | Latest Score | Previous Score | Delta | Pass | Fail | Unstable | Needs Review | Not Run |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---:|");

  if (!latest) {
    lines.push("| - | - | - | - | 0 | 0 | 0 | 0 | 0 |");
    lines.push("");
    lines.push("## Recent Failures");
    lines.push("");
    lines.push("| Run | Case | Skill | Failures |");
    lines.push("|---|---|---|---|");
    lines.push("| latest | - | - | No scored benchmark runs found |");
    lines.push("");
    return lines.join("\n");
  }

  const latestSkills = bySkill(latest);
  const previousSkills = previous
    ? new Map(bySkill(previous).map((item) => [item.skill, item]))
    : new Map();

  for (const item of latestSkills) {
    const prev = previousSkills.get(item.skill);
    const previousScore = prev ? prev.score_percent : null;
    const pendingReview = item.needs_review > 0;
    const partialCoverage = item.not_run > 0;
    const delta = prev && !pendingReview && !partialCoverage
      ? item.score_percent - prev.score_percent
      : null;
    lines.push(
      `| ${cell(item.skill)} | ${pendingReview ? "Pending review" : partialCoverage ? "Partial coverage" : formatPercent(item.score_percent)} | ${previousScore === null ? "-" : formatPercent(previousScore)} | ${formatDelta(delta)} | ${item.pass} | ${item.fail} | ${item.unstable || 0} | ${item.needs_review} | ${item.not_run} |`
    );
  }

  lines.push("");
  lines.push("## Recent Failures");
  lines.push("");
  lines.push("| Run | Case | Skill | Failures |");
  lines.push("|---|---|---|---|");

  const failures = latest.results.filter(
    (item) => item.status === "fail" || item.status === "unstable",
  );
  if (!failures.length) {
    lines.push("| latest | - | - | No failures in latest run |");
  } else {
    for (const failure of failures) {
      lines.push(
        `| ${cell(latest.run.id)} | ${cell(failure.id)} | ${cell(failure.skill || "unknown")} | ${cell((failure.failures || []).join("; "))} |`
      );
    }
  }

  const pendingReviews = latest.results.filter(
    (item) => item.status === "needs_review",
  );
  lines.push("");
  lines.push("## Pending Human Review");
  lines.push("");
  lines.push("| Run | Case | Skill | Rubric |");
  lines.push("|---|---|---|---|");
  if (!pendingReviews.length) {
    lines.push("| latest | - | - | No cases pending review |");
  } else {
    for (const pending of pendingReviews) {
      lines.push(
        `| ${cell(latest.run.id)} | ${cell(pending.id)} | ${cell(pending.skill || "unknown")} | ${cell(pending.human_review?.rubric?.join("; ") || "Human review required")} |`
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = {
    runs: "benchmark-runs",
    out: "docs/benchmark-dashboard.md",
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--runs") args.runs = argv[++index];
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--help") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/update-benchmark-dashboard.js
  node scripts/update-benchmark-dashboard.js --runs benchmark-runs --out docs/benchmark-dashboard.md
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const reports = loadRunReports(args.runs);
  const dashboard = buildDashboard(reports);
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, `${dashboard}\n`, "utf8");
  console.log(`Wrote ${args.out}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildDashboard,
  isScoredReport,
  loadRunReports,
};
