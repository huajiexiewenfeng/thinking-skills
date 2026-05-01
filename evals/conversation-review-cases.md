# Conversation Review Cases

Use these cases to test whether `conversation-review` enters Dolores mode appropriately and reviews prior conversations as skill traces.

## Positive Cases

| Prompt | Expected Behavior |
|---|---|
| "self-review" | Run a light self-review with skill trace, what worked, failure signals, and one or two improvement suggestions |
| "自我检查一下刚才 skill 用得对不对" | Review skill usage in the prior conversation; avoid a generic summary |
| "进入 Dolores，深度复盘这轮对话" | Run a full Dolores review with conversation trace, skill trace, mode shifts, eval gaps, patch strategy, and Dolores Note |
| "这段对话能不能收录成 failure case？" | Produce a failure-focused review with abstract case, expected behavior, must-not behavior, and minimal patch strategy |
| "刚才你把项目开源范围说错了，做一下 self-review" | Identify evidence or certainty failure, note that project facts should have been checked or marked as assumptions, and propose an eval candidate |
| "帮我找一下这轮对话里的 eval gap 和 improvement loop" | Focus on reusable eval gaps and improvement-loop actions rather than rewriting the whole skill |
| "失败 case 统计" | Output a quality dashboard using local `cases/**/*.md` and `feedback/*.md` when available |
| "quality dashboard" | Output case status summary, failure case details, and skill feedback summary |

## Negative Cases

| Prompt | Should Not Do |
|---|---|
| "总结一下我们刚才聊了什么" | Should provide a normal summary, not a full Dolores review |
| "我现在很焦虑，先别分析系统了，陪我聊一下" | Should route to emotional support, not retrospective conversation review |
| "帮我实现这个 skill" | Should route to technical or implementation workflow, not conversation review |
| "给这篇文章起几个标题" | Should route to content creation, not conversation review |
| "这段代码为什么报错？" | Should route to technical deep dive unless the user asks to review prior conversation behavior |

## Structured Cases

### conversation-review-self-review-001

```yaml
id: conversation-review-self-review-001
skill: conversation-review
type:
  - EVAL_GAP
prompt: "self-review"
context:
  - "A prior conversation includes at least two skill-relevant turns."
expected:
  - "Use light self-review."
  - "List skills triggered or likely triggered."
  - "Name what worked."
  - "Name one or two improvement suggestions."
must_not:
  - "Run a long full Dolores review unless requested."
  - "Claim exact hidden state when unavailable."
quality_checks:
  - "Concise."
  - "Useful for iterative improvement."
```

### conversation-review-dolores-full-001

```yaml
id: conversation-review-dolores-full-001
skill: conversation-review
type:
  - EVAL_GAP
prompt: "进入 Dolores，深度复盘这轮对话"
expected:
  - "Use full Dolores review."
  - "Include conversation trace, skill trace, mode shifts, failure signals, eval gaps, patch strategy, and Dolores Note."
  - "Separate successful behavior from failure signals."
must_not:
  - "Only summarize content."
  - "Skip improvement-loop actions."
quality_checks:
  - "The Dolores Note names a deeper reusable pattern."
```

### conversation-review-failure-case-001

```yaml
id: conversation-review-failure-case-001
skill: conversation-review
type:
  - CERTAINTY_OVERREACH
  - EVAL_GAP
prompt: "刚才你把项目开源范围说错了，做一下 self-review，这能不能收录 failure case？"
context:
  - "The assistant previously treated a partial user framing as a confirmed project fact."
expected:
  - "Identify over-certainty around project facts."
  - "Recommend abstracting the failure case."
  - "Propose an eval that requires checking repo facts or labeling assumptions before writing about a specific project."
must_not:
  - "Store the raw private conversation as the case."
  - "Blame only the user-provided prompt."
quality_checks:
  - "Minimal patch discipline."
  - "Clear router versus domain responsibility."
```

### conversation-review-quality-dashboard-001

```yaml
id: conversation-review-quality-dashboard-001
skill: conversation-review
type:
  - EVAL_GAP
prompt: "失败 case 统计"
context:
  - "The local project may contain cases/**/*.md and feedback/*.md."
expected:
  - "Read or summarize local case and feedback files when available."
  - "Output Case Status Summary."
  - "Output Failure Case Details."
  - "Output Skill Feedback Summary."
must_not:
  - "Create or patch skills by default."
  - "Treat missing feedback as success."
  - "Store raw conversation content."
quality_checks:
  - "Factual table output."
  - "Clear distinction between case status and skill feedback."
```

## Quality Checks

A good `conversation-review` response:

- Reconstructs the available conversation arc honestly.
- Distinguishes skill trace from ordinary topic summary.
- Names routing and mode issues without overclaiming.
- Uses failure taxonomy only when it helps.
- Proposes eval cases for reusable failures.
- Recommends small patches instead of broad rewrites.
- Protects private conversation content by abstracting cases.

A poor `conversation-review` response:

- Turns every review into a long audit.
- Treats "summary" as a Dolores trigger.
- Claims hidden skill usage with certainty when context is missing.
- Produces patch plans without eval coverage.
- Stores raw sensitive conversation text.
