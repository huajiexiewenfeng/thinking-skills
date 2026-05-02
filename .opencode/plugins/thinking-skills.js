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
const skillsDir = path.resolve(__dirname, "../../skills");

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

  return `
You have access to Thinking Skills.

The thinking-router skill is included below as bootstrap context. Use it at the start of user requests to classify intent and route to the right thinking mode. Do not assume software development unless the user clearly indicates a technical context.

When you need a domain skill, use OpenCode's native skill tool to load it:
- thinking-skills/content-creator
- thinking-skills/technical-deep-dive
- thinking-skills/learning-coach
- thinking-skills/emotional-support
- thinking-skills/conversation-review
- thinking-skills/skill-evaluator

${content}
`;
};

export const ThinkingSkillsPlugin = async () => {
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
