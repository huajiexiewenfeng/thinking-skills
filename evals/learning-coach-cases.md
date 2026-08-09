# Learning Coach Cases

Use these cases to test whether `learning-coach` helps the user build usable understanding instead of dumping information.

## Core Cases

| User Request | Expected Behavior | Notes |
|---|---|---|
| "$thinking-skills:learning-coach Explain vector databases to me. I know normal databases but not this." | Builds from existing knowledge, gives a compact model, names one common confusion, and offers a quick check question. | Concept explanation |
| "Please use learning-coach to help me understand attention in transformers. I have read about it but still do not understand what it is doing." | Identifies the confusing part, gives a mental model, uses a small example, and avoids a full lecture. | Mental model |
| "Please use learning-coach to show me the difference between correlation and causation. I always mix them up." | Uses contrast, example pair, and misconception repair. | Nearby concepts |
| "Please use learning-coach to help me learn system design. I do not know where to start." | Gives a small study path with practice loop and checkpoint, not a giant curriculum. | Study path |
| "Please use learning-coach to review my explanation of TCP: ... Is this right?" | Separates correct parts, fuzzy parts, corrected version, and one practice question. | Explanation review |
| "请调用 learning-coach 帮我理解一下 RAG，别讲太专业，我总是分不清它和普通搜索。" | Gives a plain-language distinction, avoids jargon-heavy output, and includes one quick check. | Chinese concept confusion |
| "请调用 learning-coach 帮我拆一下这篇论文，我看不懂。" | Asks for the excerpt or available context before claiming paper-specific facts. | Missing source material |

## Mixed-Intent Cases

| User Request | Expected Primary | Expected Secondary | Notes |
|---|---|---|---|
| "I want to write an article explaining vector databases to beginners." | `content-creator` | None | The Auto writing owner survives; uninvoked learning-coach is not secondary |
| "I feel stupid because I cannot understand recursion." | `emotional-support` | None | The Auto emotional owner survives; uninvoked learning-coach is not secondary |
| "Can you help me understand this API design before we decide whether to adopt it?" | `native` | None | Ordinary uninvoked learning intent stays native |

## Anti-Cases

| User Request | Incorrect Behavior | Correct Behavior |
|---|---|---|
| "$thinking-skills:learning-coach Explain Kafka like I am new to distributed systems." | Long encyclopedia answer with many terms. | Short model, one analogy, one example, one check. |
| "Please use learning-coach to teach me this whole field from zero." | Huge syllabus before the user can start. | Ask current goal or provide a small first-week path. |
| "Please use learning-coach to help me with this paper; I do not understand it." | Pretend to know the paper without seeing it. | Ask for the excerpt or explain only from provided context. |
| "$thinking-skills:learning-coach Explain attention in transformers." | Start with equations and method names. | Give a compact intuition first, then optional depth. |
| "How should I diagnose this production incident?" | Start an automatic technical-deep-dive route. | Use the host-native technical path. |
