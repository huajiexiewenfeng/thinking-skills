# Installing Thinking Skills for OpenCode

## Prerequisites

- OpenCode installed

## Installation

Add Thinking Skills to the `plugin` array in your global or project-level `opencode.json`:

```json
{
  "plugin": ["thinking-skills@git+https://github.com/huajiexiewenfeng/thinking-skills.git"]
}
```

Restart OpenCode.

The plugin registers the repository `skills/` directory with OpenCode so the skills can be loaded through OpenCode's native skill tool.

## Usage

Use OpenCode's native skill tool:

```text
use skill tool to list skills
use skill tool to load thinking-skills/thinking-router
```

You can also ask naturally:

```text
I have an idea and want to think it through.
```

## Updating

Thinking Skills updates when OpenCode refreshes the git plugin.

To pin a version after releases exist:

```json
{
  "plugin": ["thinking-skills@git+https://github.com/huajiexiewenfeng/thinking-skills.git#v0.1.0"]
}
```

## Troubleshooting

If skills are not found:

1. Confirm the plugin entry exists in `opencode.json`.
2. Restart OpenCode.
3. Use the skill tool to list discovered skills.
4. Check OpenCode logs for plugin loading errors.

## Tool Mapping

Thinking Skills avoids platform-specific tool assumptions where possible.

When a skill mentions generic actions:

- Skill loading -> OpenCode's native skill tool
- File operations -> OpenCode's native file tools
- Shell operations -> OpenCode's native shell tools

