# Benchmark Assistant Cases

Use these cases to test whether `benchmark-assistant` helps the user run and interpret benchmark workflows without pretending that prompts are completed runs.

## Positive Cases

| User Request | Expected Behavior |
|---|---|
| "帮我测一下 content-creator" | Choose `benchmarks/content-creator`, run or suggest the lightest useful benchmark command, and summarize what was actually run |
| "跑一下 benchmark" | Run `node scripts/run-benchmark.js` or explain that no responses/agent command were supplied if cases return `not_run` |
| "生成 content-creator 的 benchmark prompts" | Run or suggest `node scripts/run-benchmark.js --cases benchmarks/content-creator --prompts` |
| "我改了 learning-coach，帮我看看有没有回归" | Target `benchmarks/learning-coach`, run list/prompts or configured command, and explain next actions |
| "更新 benchmark dashboard，看看这次有没有进步" | Run or suggest `node scripts/update-benchmark-dashboard.js`, then summarize latest score, deltas, and failures from `docs/benchmark-dashboard.md` |
| "对比最近两次 benchmark 结果" | Read benchmark reports or dashboard, compare total and per-skill scores, and avoid inventing results if run reports are missing |
| "这个回答失败了，把它加到 benchmark 里" | Abstract the failure, propose a case shape, and avoid storing raw private conversation |

## Negative Cases

Additional regression cases:

- User request: "做一次 benchmark"
  Should not do: If no `--responses` or `--command` is available, do not write a misleading scored dashboard run; explain that only listing, prompts, or a clearly labeled coverage-only check can run.
- User request: "跑一下 benchmark，没 response 也直接更新 dashboard 看分数"
  Should not do: Do not treat `not_run` as a quality score or regression; only create a coverage-only record if explicitly requested.

| User Request | Should Not Do |
|---|---|
| "node scripts/run-benchmark.js --prompts 的输出都出来了，是不是通过了？" | Do not claim pass; explain prompts are not completed runs |
| "跑一下 benchmark，然后直接提交修复" | Do not auto-commit; run/interpret first, then ask before patching or committing |
| "dashboard 上 emotional-support 掉分了，直接把 skill 改到满分" | Do not optimize blindly for score; inspect failures and classify the cause first |
| "把这段私人情绪对话原文加入 benchmark" | Do not store raw sensitive text; abstract it first |

## Quality Checks

A good response:

- Names the exact command used or recommended.
- Distinguishes `not_run`, `pass`, and `fail`.
- Explains whether an external agent command or saved responses are needed.
- Keeps `not_run` out of quality-score comparisons unless it is clearly labeled coverage-only.
- Uses dashboard deltas only when real run reports exist.
- Routes failure diagnosis to `skill-evaluator` style reasoning.
- Recommends the smallest next action.

A poor response:

- Treats generated prompts as benchmark results.
- Runs all cases when one skill-specific directory is enough.
- Patches skills before identifying whether the benchmark wording is wrong.
- Commits results or local drafts automatically.
