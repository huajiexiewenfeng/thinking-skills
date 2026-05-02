# Benchmark Assistant Cases

Use these cases to test whether `benchmark-assistant` helps the user run and interpret benchmark workflows without pretending that prompts are completed runs.

## Positive Cases

| User Request | Expected Behavior |
|---|---|
| "帮我测一下 content-creator" | Choose `benchmarks/content-creator`, run or suggest the lightest useful benchmark command, and summarize what was actually run |
| "跑一下 benchmark" | Run `node scripts/run-benchmark.js` or explain that no responses/agent command were supplied if cases return `not_run` |
| "生成 content-creator 的 benchmark prompts" | Run or suggest `node scripts/run-benchmark.js --cases benchmarks/content-creator --prompts` |
| "我改了 learning-coach，帮我看看有没有回归" | Target `benchmarks/learning-coach`, run list/prompts or configured command, and explain next actions |
| "这个回答失败了，把它加到 benchmark 里" | Abstract the failure, propose a case shape, and avoid storing raw private conversation |

## Negative Cases

| User Request | Should Not Do |
|---|---|
| "node scripts/run-benchmark.js --prompts 的输出都出来了，是不是通过了？" | Do not claim pass; explain prompts are not completed runs |
| "跑一下 benchmark，然后直接提交修复" | Do not auto-commit; run/interpret first, then ask before patching or committing |
| "把这段私人情绪对话原文加入 benchmark" | Do not store raw sensitive text; abstract it first |

## Quality Checks

A good response:

- Names the exact command used or recommended.
- Distinguishes `not_run`, `pass`, and `fail`.
- Explains whether an external agent command or saved responses are needed.
- Routes failure diagnosis to `skill-evaluator` style reasoning.
- Recommends the smallest next action.

A poor response:

- Treats generated prompts as benchmark results.
- Runs all cases when one skill-specific directory is enough.
- Patches skills before identifying whether the benchmark wording is wrong.
- Commits results or local drafts automatically.
