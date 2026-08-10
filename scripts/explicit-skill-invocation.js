const SKILL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeTurns(item) {
  if (typeof item === "string") {
    return [{ role: "user", content: item }];
  }
  const turns = item?.turns || item?.messages;
  if (Array.isArray(turns)) return turns;
  if (typeof item?.prompt === "string") {
    return [{ role: "user", content: item.prompt }];
  }
  return [];
}

function maskCharacters(text) {
  return " ".repeat(text.length);
}

function parseFenceLine(line) {
  const match = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(line);
  if (!match) return null;
  return {
    character: match[2][0],
    length: match[2].length,
    rest: match[3],
  };
}

function startsDataBlock(line) {
  return (
    /^ {0,3}(?:(?:#{1,6}|[-+*]|\d+[.)])\s+)?(?:(?:(?:for\s+)?example|sample|test|data)(?:\s+(?:case|input|output|prompt|fixture|text|data))?|quoted?(?:\s+(?:text|material))?|quotation|the user (?:said|wrote)|the prompt (?:says|contains))\s*(?:[:.]|$)/i
      .test(line) ||
    /^ {0,3}(?:(?:#{1,6}|[-+*]|\d+[.)])\s+)?(?:review|analy[sz]e|modify|inspect)\b[^\n]{0,160}\bas\s+(?:data|text|an?\s+example)\b/i
      .test(line) ||
    /^ {0,3}(?:(?:#{1,6}|[-+*]|\d+[.)])\s+)?(?:例如|示例|比如|样例|测试数据|数据|引用|原文)(?:\s|[:：。.，,]|$)/
      .test(line)
  );
}

function startsBlockBoundary(line) {
  return (
    /^(?: {4}|\t)/.test(line) ||
    /^ {0,3}(?:#{1,6}(?:\s|$)|(?:[-+*]|\d+[.)])\s+)/.test(line)
  );
}

function maskLiteralUnlessCanonical(match, inner, skillId) {
  return inner.trim().toLowerCase() === skillId.toLowerCase()
    ? ` ${inner} `
    : maskCharacters(match);
}

function maskInlineLiterals(line, skillId) {
  return line
    .replace(
      /`([^`\n]*)`/g,
      (match, inner) => maskLiteralUnlessCanonical(match, inner, skillId),
    )
    .replace(
      /(?:"([^"\n]*)"|'([^'\n]*)'|“([^”\n]*)”|‘([^’\n]*)’|「([^」\n]*)」|『([^』\n]*)』)/g,
      (match, ...captures) => maskLiteralUnlessCanonical(
        match,
        captures.slice(0, 6).find((capture) => capture !== undefined),
        skillId,
      ),
    );
}

function invocationSearchText(text, skillId) {
  const normalized = text.replace(/\r\n/g, " \n").replace(/\r/g, "\n");
  let fence = null;
  let inBlockquote = false;
  let inDataBlock = false;
  const visibleLines = [];
  for (const line of normalized.split("\n")) {
    const fenceLine = parseFenceLine(line);
    if (fence) {
      visibleLines.push(maskCharacters(line));
      if (
        fenceLine &&
        fenceLine.character === fence.character &&
        fenceLine.length >= fence.length &&
        !fenceLine.rest.trim()
      ) {
        fence = null;
      }
      continue;
    }

    if (
      fenceLine &&
      !(fenceLine.character === "`" && fenceLine.rest.includes("`"))
    ) {
      inBlockquote = false;
      fence = fenceLine;
      visibleLines.push(maskCharacters(line));
      continue;
    }

    if (!line.trim()) {
      inBlockquote = false;
      inDataBlock = false;
      visibleLines.push(line);
      continue;
    }

    if (inBlockquote) {
      if (startsBlockBoundary(line)) {
        inBlockquote = false;
      } else {
        visibleLines.push(maskCharacters(line));
        continue;
      }
    }

    if (inDataBlock) {
      visibleLines.push(maskCharacters(line));
      continue;
    }

    if (/^ {0,3}>/.test(line)) {
      inBlockquote = true;
      visibleLines.push(maskCharacters(line));
      continue;
    }

    if (/^(?: {4}|\t)/.test(line)) {
      visibleLines.push(maskCharacters(line));
      continue;
    }

    if (startsDataBlock(line)) {
      inDataBlock = true;
      visibleLines.push(maskCharacters(line));
      continue;
    }

    visibleLines.push(maskInlineLiterals(line, skillId));
  }

  return visibleLines.join("\n");
}

function hasNonDirectiveGoverningScope(sentence, commandStart) {
  const boundaryStart = Math.max(
    sentence.lastIndexOf("\n", commandStart - 1),
    sentence.lastIndexOf(",", commandStart - 1),
    sentence.lastIndexOf("，", commandStart - 1),
  ) + 1;
  const governingClause = sentence.slice(boundaryStart, commandStart).trim();
  const scopeWithoutAffirmativeQualifier = governingClause
    .replace(/\bnot(?=\s+only\b[\s\S]*\bbut\s*$)/gi, "   ")
    .replace(/\bif\s+needed\b/gi, " ");
  return (
    /\bnever\b|\b(?:do|does|did|can|could|should|would|will|may|might|must|is|are|was|were|have|has|had)\s+not\b|\b[A-Za-z]+n['’]t\b/i
      .test(scopeWithoutAffirmativeQualifier) ||
    /\b(?:review|decide|consider|check)\b[\s\S]{0,160}\b(?:whether|if)\b/i
      .test(scopeWithoutAffirmativeQualifier) ||
    /^(?:who|what|when|where|why|how|which|do|does|did|can|could|should|would|will|is|are|was|were|have|has|had|may|might|must)\b/i
      .test(scopeWithoutAffirmativeQualifier.trim())
  );
}

function hasReportedCommandScope(sentence, commandStart) {
  const governingText = sentence.slice(0, commandStart).trim();
  return (
    /^(?:according\s+to|in)\s+(?:the\s+)?(?:documentation|docs?|guide|manual)\b/i
      .test(governingText) ||
    /\b(?:said|says|stated|states|wrote|writes|recommended|recommends|instructed|instructs)\s*$/i
      .test(governingText) ||
    /\btold\s+(?:me|us|you|him|her|them)\s*$/i.test(governingText) ||
    /\b(?:was|were|am|is|are|be|been)\s+told\s*$/i.test(governingText)
  );
}

function hasSkillMetadataObjectScope(suffix) {
  return (
    /^\s*(?:skill\s+)?(?:configuration|activation\s+(?:rule|policy)|instructions?|description|manifest|implementation)\b/i
      .test(suffix) ||
    /^\s*to\s+(?:test|evaluate|review|inspect|modify|edit|change|update|configure)\s+(?:(?:its|this\s+skill(?:'s)?|the\s+skill(?:'s)?|skill's)\s+(?:own\s+)?)(?:activation\s+(?:rule|policy)|configuration|instructions?|description|manifest|implementation|behavior|output|response)\b/i
      .test(suffix) ||
    /^\s*(?:的)?(?:配置|激活规则|激活策略|说明|指令|清单|实现)(?:\s|作为|当作|$)/i
      .test(suffix) ||
    /^\s*(?:来|去)?(?:测试|评测|评估|审核|检查|修改|编辑|更新|配置)\s*(?:(?:它的|其)\s*(?:激活规则|激活策略|配置|说明|指令|清单|实现|行为|输出|响应)|(?:这个|该)?\s*skill\s*(?:自身)?\s*(?:的)?\s*(?:规则|激活规则|激活策略|配置|说明|指令|清单|实现|行为|输出|响应))/i
      .test(suffix)
  );
}

function sentenceHasDirectInvocation(sentence, patterns) {
  const command = /(?:^|[\n,，:：]|(\b(?:and(?:\s+then)?|then|also)\b\s+))[ \t]*(?:(?:(?:and|then|also)\s+)?(?:(?:please|kindly)\s+)?(?:use|invoke|run|load|apply|activate)\b|(?:(?:并且?|然后|再)\s*)?(?:请\s*)?(?:使用|调用|运行|加载|应用|用))/gim;
  const commands = [...sentence.matchAll(command)]
    .filter(
      (match) =>
        !hasReportedCommandScope(sentence, match.index) &&
        (!match[1] || !hasNonDirectiveGoverningScope(sentence, match.index)),
    )
    .map((match) => ({
      start: match.index,
      end: match.index + match[0].length,
    }));
  if (!commands.length) return false;

  let commandIndex = 0;
  let activeCommand = null;
  for (const match of sentence.matchAll(patterns.canonical)) {
    const tokenStart = match.index;
    const tokenEnd = tokenStart + match[0].length;
    while (
      commandIndex < commands.length &&
      commands[commandIndex].end <= tokenStart
    ) {
      activeCommand = commands[commandIndex];
      commandIndex += 1;
    }
    if (!activeCommand) continue;

    const precedingCharacter = sentence[tokenStart - 1] || "";
    const followingCharacter = sentence[tokenEnd] || "";
    if (
      /[A-Za-z0-9_-]/.test(precedingCharacter) ||
      /[A-Za-z0-9_-]/.test(followingCharacter)
    ) {
      continue;
    }

    const directObjectDistance = tokenStart - activeCommand.end;
    const directObject =
      directObjectDistance <= 128 &&
      /^\s*(?:(?:the\s+)?canonical\s+(?:skill\s+)?name\s+|the\s+)?$/i
        .test(sentence.slice(activeCommand.end, tokenStart));
    const localPrefix = sentence.slice(
      Math.max(activeCommand.end, tokenStart - 192),
      tokenStart,
    );
    const listedObject = /(?:\b(?:and|plus)\b|(?:并且?|以及))\s*(?:(?:(?:please|kindly)\s+)?(?:use|invoke|run|load|apply|activate)\b\s*|(?:请\s*)?(?:使用|调用|运行|加载|应用|用)\s*)?(?:(?:the\s+)?canonical\s+(?:skill\s+)?name\s+)?$/i
      .test(localPrefix);
    if (!directObject && !listedObject) continue;

    const localSuffix = sentence.slice(tokenEnd, tokenEnd + 192);
    if (
      hasSkillMetadataObjectScope(localSuffix) ||
      /^\s*(?:(?:as|used\s+as|for\s+use\s+as|to\s+use\s+as)\s+(?:(?:an?\s+)?(?:data|example|sample|text|test\s+data|quoted\s+text))\b|(?:作为|当作)(?:数据|示例|样例|文本|测试数据))/i
        .test(localSuffix)
    ) {
      continue;
    }

    return true;
  }
  return false;
}

function hasDirectInvocation(text, patterns) {
  let sentenceStart = 0;
  for (let index = 0; index <= text.length; index += 1) {
    const terminator = text[index] || "";
    if (index < text.length && !".!?;。！？；".includes(terminator)) {
      continue;
    }

    const sentence = text.slice(sentenceStart, index);
    sentenceStart = index + 1;
    if (
      sentence &&
      terminator !== "?" &&
      terminator !== "？" &&
      sentenceHasDirectInvocation(sentence, patterns)
    ) {
      return true;
    }
  }
  return false;
}

function hasCurrentRequestExplicitSkillInvocation(item, skillId) {
  if (!SKILL_ID.test(skillId)) {
    throw new Error(`Invalid canonical Skill identifier: ${skillId}`);
  }
  const turns = normalizeTurns(item);
  const finalTurn = turns[turns.length - 1];
  if (!finalTurn || finalTurn.role !== "user") return false;

  const escaped = escapeRegExp(skillId);
  const patterns = {
    canonical: new RegExp(escaped, "gi"),
    hostInvocation: new RegExp(
      `^(?:[ \\t]*(?:\\r\\n?|\\n))* {0,3}\\$thinking-skills:${escaped}(?=$|[\\s,.;:!?，。；：！？])`,
      "i",
    ),
  };
  if (patterns.hostInvocation.test(finalTurn.content)) return true;

  return hasDirectInvocation(
    invocationSearchText(finalTurn.content, skillId),
    patterns,
  );
}

module.exports = {
  hasCurrentRequestExplicitSkillInvocation,
};
