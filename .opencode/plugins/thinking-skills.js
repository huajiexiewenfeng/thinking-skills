/**
 * Thinking Skills plugin for OpenCode.
 *
 * Registers the shared skills directory and injects a light bootstrap that
 * reminds the agent to route requests through thinking-router.
 */
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceSkillsDir = path.resolve(__dirname, "../../skills");
const skillsDir = sourceSkillsDir;

// activation-policy:runtime:start
const activationPolicy = Object.freeze({
  auto: Object.freeze([
    "article-visual-director",
    "benchmark-assistant",
    "content-creator",
    "conversation-review",
    "emotional-support",
    "skill-evaluator",
    "thinking-router",
  ]),
  explicit: Object.freeze([
    "learning-coach",
    "technical-deep-dive",
  ]),
  disabled: Object.freeze([
  ]),
});
// activation-policy:runtime:end

const enabledSkills = Object.freeze([
  ...activationPolicy.auto,
  ...activationPolicy.explicit,
]);

const assertActivationPolicyCanUseSkillsDir = () => {
  if (activationPolicy.disabled.length > 0 && skillsDir === sourceSkillsDir) {
    throw new Error(
      `Thinking Skills disables ${activationPolicy.disabled.join(", ")}, but OpenCode points at the unfiltered source Skills directory. Build and use a filtered package before starting the plugin.`,
    );
  }
};

const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { content };
  return { content: match[2] };
};

const getBootstrapContent = () => {
  const skillPath = path.join(skillsDir, "thinking-router", "SKILL.md");
  if (!fs.existsSync(skillPath)) return null;

  const fullContent = fs.readFileSync(skillPath, "utf8");
  const { content } = extractAndStripFrontmatter(fullContent);
  const skillList = enabledSkills
    .filter((skillId) => skillId !== "thinking-router")
    .map((skillId) => {
      const qualifier = activationPolicy.explicit.includes(skillId)
        ? " (load only after valid exact invocation in the current final user request)"
        : "";
      return `- thinking-skills/${skillId}${qualifier}`;
    })
    .join("\n");

  return `
You have access to Thinking Skills.

The thinking-router skill is included below as bootstrap context. Use it at the start of user requests to classify intent and route to the right thinking mode. Do not assume software development unless the user clearly indicates a technical context.

When you need a domain skill, use OpenCode's native skill tool to load it:
${skillList}

${content}
`;
};

export const ThinkingSkillsPlugin = async () => {
  assertActivationPolicyCanUseSkillsDir();

  return {
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];

      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    },

    "experimental.chat.messages.transform": async (_input, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.messages.length) return;

      const firstUser = output.messages.find((message) => message.info.role === "user");
      if (!firstUser || !firstUser.parts.length) return;

      const alreadyInjected = firstUser.parts.some(
        (part) =>
          part.type === "text" &&
          part.text.includes("You have access to Thinking Skills.")
      );
      if (alreadyInjected) return;

      const ref = firstUser.parts[0];
      firstUser.parts.unshift({
        ...ref,
        type: "text",
        text: bootstrap
      });
    }
  };
};
