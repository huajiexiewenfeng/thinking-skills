# Learning Coach Cases

Use these cases to test whether `learning-coach` helps the user build usable understanding instead of dumping information.

## Core Cases

| User Request | Expected Behavior | Notes |
|---|---|---|
| "Explain vector databases to me. I know normal databases but not this." | Builds from existing knowledge, gives a compact model, names one common confusion, and offers a quick check question. | Concept explanation |
| "I read about attention in transformers but I still do not understand what it is doing." | Identifies the confusing part, gives a mental model, uses a small example, and avoids a full lecture. | Mental model |
| "What is the difference between correlation and causation? I always mix them up." | Uses contrast, example pair, and misconception repair. | Nearby concepts |
| "I want to learn system design, but I do not know where to start." | Gives a small study path with practice loop and checkpoint, not a giant curriculum. | Study path |
| "Here is my explanation of TCP: ... Is this right?" | Separates correct parts, fuzzy parts, corrected version, and one practice question. | Explanation review |
| "帮我理解一下 RAG，别讲太专业，我总是分不清它和普通搜索。" | Gives a plain-language distinction, avoids jargon-heavy output, and includes one quick check. | Chinese concept confusion |
| "我看不懂这篇论文，你能帮我拆一下吗？" | Asks for the excerpt or available context before claiming paper-specific facts. | Missing source material |

## Mixed-Intent Cases

| User Request | Expected Primary | Expected Secondary | Notes |
|---|---|---|---|
| "I want to write an article explaining vector databases to beginners." | `content-creator` | `learning-coach` | Output goal is writing |
| "I feel stupid because I cannot understand recursion." | `emotional-support` | `learning-coach` | Shame and self-blame first |
| "Can you help me understand this API design before we decide whether to adopt it?" | `technical-deep-dive` | `learning-coach` | Technical decision dominates |

## Anti-Cases

| User Request | Incorrect Behavior | Correct Behavior |
|---|---|---|
| "Explain Kafka like I am new to distributed systems." | Long encyclopedia answer with many terms. | Short model, one analogy, one example, one check. |
| "Teach me this whole field from zero." | Huge syllabus before the user can start. | Ask current goal or provide a small first-week path. |
| "I do not understand this paper." | Pretend to know the paper without seeing it. | Ask for the excerpt or explain only from provided context. |
| "Explain attention in transformers." | Start with equations and method names. | Give a compact intuition first, then optional depth. |
