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
      not_run: 0,
      score: 0,
      max_score: 0,
    };
    current.total += 1;
    current.pass += result.status === "pass" ? 1 : 0;
    current.fail += result.status === "fail" ? 1 : 0;
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

function buildDashboard(reports) {
  const latest = reports[reports.length - 1];
  const previous = reports[reports.length - 2];
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
  lines.push("| Run | Created At | Commit | Cases | Total | Pass | Fail | Not Run | Score | Delta |");
  lines.push("|---|---|---|---|---:|---:|---:|---:|---:|---:|");

  for (let index = 0; index < reports.length; index += 1) {
    const report = reports[index];
    const prev = reports[index - 1];
    const delta = prev
      ? report.summary.score_percent - prev.summary.score_percent
      : null;
    lines.push(
      `| ${cell(report.run.id)} | ${cell(report.run.created_at)} | ${cell(report.run.commit || "unknown")} | ${cell(report.run.cases || "benchmarks")} | ${report.summary.total} | ${report.summary.pass} | ${report.summary.fail} | ${report.summary.not_run} | ${formatPercent(report.summary.score_percent)} | ${formatDelta(delta)} |`
    );
  }

  lines.push("");
  lines.push("## By Skill");
  lines.push("");
  lines.push("| Skill | Latest Score | Previous Score | Delta | Pass | Fail | Not Run |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|");

  const latestSkills = bySkill(latest);
  const previousSkills = previous
    ? new Map(bySkill(previous).map((item) => [item.skill, item]))
    : new Map();

  for (const item of latestSkills) {
    const prev = previousSkills.get(item.skill);
    const previousScore = prev ? prev.score_percent : null;
    const delta = prev ? item.score_percent - prev.score_percent : null;
    lines.push(
      `| ${cell(item.skill)} | ${formatPercent(item.score_percent)} | ${previousScore === null ? "-" : formatPercent(previousScore)} | ${formatDelta(delta)} | ${item.pass} | ${item.fail} | ${item.not_run} |`
    );
  }

  lines.push("");
  lines.push("## Recent Failures");
  lines.push("");
  lines.push("| Run | Case | Skill | Failures |");
  lines.push("|---|---|---|---|");

  const failures = latest.results.filter((item) => item.status === "fail");
  if (!failures.length) {
    lines.push("| latest | - | - | No failures in latest run |");
  } else {
    for (const failure of failures) {
      lines.push(
        `| ${cell(latest.run.id)} | ${cell(failure.id)} | ${cell(failure.skill || "unknown")} | ${cell((failure.failures || []).join("; "))} |`
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
  loadRunReports,
};
