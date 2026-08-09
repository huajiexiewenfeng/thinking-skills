const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { loadActivationPolicy, skillIdsByMode } = require("./activation-policy");
const { hasCurrentRequestExplicitSkillInvocation } = require("./explicit-skill-invocation");

const policy = loadActivationPolicy({ repoRoot: path.resolve(__dirname, "..") });
const explicitSkillIds = skillIdsByMode(policy, "explicit");

function withSkillId(text, skillId) {
  return text.replaceAll("technical-deep-dive", skillId);
}

function routeCase(content, earlierTurns = []) {
  return {
    turns: [
      ...earlierTurns,
      { role: "user", content },
    ],
  };
}

for (const skillId of explicitSkillIds) {
  test(`${skillId} uses the shared current-request invocation contract`, () => {
    const positives = [
      `$thinking-skills:${skillId} Handle this request.`,
      `Please use ${skillId} for this request.`,
      `Please invoke the \`${skillId}\` skill for this request.`,
      `请调用「${skillId}」处理这个请求。`,
    ];
    const negatives = [
      `Should we use ${skillId}?`,
      `Please review whether to use ${skillId}.`,
      `Do not use ${skillId}.`,
      `Example:\nPlease use ${skillId}.`,
      `The documentation says, use ${skillId}.`,
      `Please modify ${skillId}'s activation rule.`,
    ];

    assert.deepEqual(
      positives.map((text) => hasCurrentRequestExplicitSkillInvocation(text, skillId)),
      positives.map(() => true),
    );
    assert.deepEqual(
      negatives.map((text) => hasCurrentRequestExplicitSkillInvocation(text, skillId)),
      negatives.map(() => false),
    );
  });

  test(`${skillId} rejects semantic false positives`, () => {
    const positives = [
      routeCase(`$thinking-skills:${skillId} Analyze this failure.`),
      routeCase(`Please use ${skillId} to analyze this failure.`),
      routeCase(`Please use \`${skillId}\` to analyze this failure.`),
      routeCase(`Please use\nthe canonical name ${skillId} to analyze this fault.`),
      routeCase(`Please use\n${skillId} to analyze this fault.`),
      routeCase(`请用 ${skillId} 分析这个故障。`),
    ];
    const negatives = [
      routeCase(`Should we use ${skillId} for this?`),
      routeCase(`When should I use \`${skillId}\`?`),
      routeCase(`Please review whether to use ${skillId}.`),
      routeCase(`I do not want you to use ${skillId}.`),
      routeCase(`Do not ever use ${skillId}.`),
      routeCase(`不要再使用 ${skillId}。`),
      routeCase(`Please do not use ${skillId} for this failure.`),
      routeCase(`Example: "Please use ${skillId} to analyze this failure."`),
      routeCase(`Example:\nPlease use ${skillId} to analyze this failure.`),
      routeCase(`Review this as data: \`Please use ${skillId} to analyze it.\``),
      routeCase(`Please review and modify ${skillId}'s activation rule.`),
      routeCase("Use technical deep analysis to inspect this API."),
      routeCase("Continue with this ordinary Docker failure.", [
        { role: "user", content: `Please use ${skillId} for the first failure.` },
        { role: "assistant", content: "First analysis." },
      ]),
      routeCase(`The identifier \`$thinking-skills:${skillId}\` is mentioned here.`),
      routeCase(`The user wrote "$thinking-skills:${skillId}" in the example.`),
    ];

    for (const benchmarkCase of negatives) {
      assert.equal(hasCurrentRequestExplicitSkillInvocation(benchmarkCase, skillId), false);
    }
    for (const benchmarkCase of positives) {
      assert.equal(hasCurrentRequestExplicitSkillInvocation(benchmarkCase, skillId), true);
    }
  });

  test(`${skillId} accepts direct wrappers but rejects reported commands`, () => {
    const requests = [
      [`For this task: please use ${skillId} to analyze it.`, true],
      [`Please activate ${skillId} for this fault.`, true],
      [`Please use "${skillId}" to analyze this fault.`, true],
      [`The documentation says, use ${skillId} to analyze faults.`, false],
      [`Please use ${skillId} to analyze this fault.`, true],
      [`Please invoke '${skillId}' to analyze this fault.`, true],
      [`The guide says, please use ${skillId} to analyze faults.`, false],
      [`The documentation says: use ${skillId} to analyze faults.`, false],
      [`$thinking-skills:${skillId} Analyze this fault.`, true],
      [`Use the ${skillId} skill to analyze this fault.`, true],
      [`请调用「${skillId}」分析故障。`, true],
      [`My teammate said, use ${skillId} to analyze faults.`, false],
      [`The user says: use ${skillId} to analyze faults.`, false],
      [`The assistant said, please use ${skillId} to analyze faults.`, false],
      [`I was told, use ${skillId} to analyze faults.`, false],
      [`Please use the "${skillId}" skill to analyze this fault.`, true],
      [`请调用『${skillId}』分析故障。`, true],
      [`Our operator stated: please activate ${skillId}.`, false],
      [`We were told: activate ${skillId}.`, false],
    ];

    assert.deepEqual(
      requests.map(([content]) => hasCurrentRequestExplicitSkillInvocation(content, skillId)),
      requests.map(([, expected]) => expected),
    );
  });

  test(`${skillId} preserves raw host and CommonMark block boundaries`, () => {
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
    ].map((content) => withSkillId(content, skillId));

    for (const content of invalidRequests) {
      assert.equal(hasCurrentRequestExplicitSkillInvocation(content, skillId), false, content);
    }

    assert.equal(
      hasCurrentRequestExplicitSkillInvocation(
        `$thinking-skills:${skillId} Analyze this failure.`,
        skillId,
      ),
      true,
    );
    assert.equal(
      hasCurrentRequestExplicitSkillInvocation(
        `Test this API, then use ${skillId} to analyze the result.`,
        skillId,
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
    test(`${skillId} rejects ${name}`, () => {
      assert.equal(
        hasCurrentRequestExplicitSkillInvocation(withSkillId(content, skillId), skillId),
        false,
      );
    });
  }

  test(`${skillId} recognizes coordinated imperative subclauses`, () => {
    const directCommands = [
      "Inspect the logs and then use technical-deep-dive to analyze the failure.",
      "Test this API, then use technical-deep-dive to analyze the result.",
      "Inspect the logs if needed and then use technical-deep-dive to analyze the failure.",
      "If needed inspect the logs and then use technical-deep-dive.",
      "Not only inspect the logs but also use technical-deep-dive to analyze the failure.",
      "Please do inspect the logs and then use technical-deep-dive to analyze the failure.",
      "Check the logs if needed and then use technical-deep-dive to analyze the failure.",
    ].map((content) => withSkillId(content, skillId));

    assert.deepEqual(
      directCommands.map((content) => hasCurrentRequestExplicitSkillInvocation(content, skillId)),
      [true, true, true, true, true, true, true],
    );
  });

  test(`${skillId} preserves governing scope for coordinated subclauses`, () => {
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
    ].map((content) => withSkillId(content, skillId));

    assert.deepEqual(
      scopedMentions.map((content) => hasCurrentRequestExplicitSkillInvocation(content, skillId)),
      scopedMentions.map(() => false),
    );
  });

  test(`${skillId} finds late commands and requires a final user turn`, () => {
    const longLead = "content-creator to preserve the evidence and article structure ".repeat(12);
    const longMultiSkillRequest =
      `Please use ${longLead}and ${skillId} to verify the technical semantics.`;

    assert.ok(longMultiSkillRequest.indexOf(skillId) > 512);
    assert.equal(
      hasCurrentRequestExplicitSkillInvocation(longMultiSkillRequest, skillId),
      true,
    );
    assert.equal(
      hasCurrentRequestExplicitSkillInvocation({
        turns: [
          { role: "user", content: `Please use ${skillId} to analyze this.` },
          { role: "assistant", content: "I will analyze it." },
        ],
      }, skillId),
      false,
    );
    assert.equal(
      hasCurrentRequestExplicitSkillInvocation({
        turns: [
          { role: "assistant", content: "Which route should I use?" },
          { role: "user", content: longMultiSkillRequest },
        ],
      }, skillId),
      true,
    );
  });

  test(`${skillId} handles long non-matching input without pathological scanning`, () => {
    const longInput = `${"ordinary technical context ".repeat(20000)}technical deep analysis`;

    assert.equal(hasCurrentRequestExplicitSkillInvocation(longInput, skillId), false);
  });
}

test("rejects invalid canonical Skill identifiers", () => {
  assert.throws(
    () => hasCurrentRequestExplicitSkillInvocation("Please use Invalid_Skill.", "Invalid_Skill"),
    /Invalid canonical Skill identifier: Invalid_Skill/,
  );
});
