# Platform Support

## Goal

Thinking Skills should be portable across agent platforms.

The framework should keep its core skill content platform-neutral, then provide thin adapter layers for each runtime.

## Priority Order

| Priority | Platform | Target |
|---|---|---|
| P0 | Codex native skills | Clone or install the repository and expose `skills/` through Codex skill discovery |
| P0 | Codex plugin | Provide `.codex-plugin/plugin.json` for Codex plugin installation and UI metadata |
| P1 | Claude Code plugin | Provide `.claude-plugin/plugin.json` and marketplace metadata |
| P1 | Cursor plugin/rules | Provide Cursor plugin metadata |
| P1 | OpenCode | Provide OpenCode plugin adapter and install docs |
| P2 | Generic Skills CLI | Keep `npx skills add huajiexiewenfeng/thinking-skills` working |

## Design Rule

Platform adapters should not fork the skill content.

The canonical source remains:

```text
skills/
  thinking-router/
  content-creator/
  technical-deep-dive/
  emotional-support/
```

Adapters should point to this shared `skills/` directory whenever possible.

## Codex Native Skills

Codex can discover skills from the local skills directory.

Target install shape:

```text
~/.codex/thinking-skills/        # cloned repository
~/.agents/skills/thinking-skills # symlink or junction to ~/.codex/thinking-skills/skills
```

Docs:

```text
.codex/INSTALL.md
```

When installed this way, Thinking Skills appears under Codex **Skills**, not **Plugins**. This is expected.

## Codex Plugin

The Codex plugin manifest lives at:

```text
.codex-plugin/plugin.json
```

It should include:

- Plugin name and version.
- Repository metadata.
- `skills: "./skills/"`.
- Interface metadata for Codex UI.
- Category and capabilities.

The plugin manifest does not automatically register the repository as a Codex plugin. The plugin appears under Codex **Plugins** only after it is installed through Codex's plugin installation or marketplace flow.

Use Codex native skill discovery when you only need the skills. Use the Codex plugin path when you want plugin-level packaging, UI metadata, marketplace listing, or additional plugin capabilities.

## Future Adapters

Future platform support should add only the minimum files needed for discovery and install.

Planned directories:

```text
.claude-plugin/
.cursor-plugin/
.opencode/
```

Each adapter should document:

- Install command.
- Update command.
- Uninstall command.
- How the platform discovers skills.
- Any platform-specific limitations.

## Progress Tracker

| Adapter | Files | Status |
|---|---|---|
| Codex native skills | `.codex/INSTALL.md` | Done |
| Codex plugin | `.codex-plugin/plugin.json` | Done |
| Claude Code plugin | `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | Done |
| Cursor plugin/rules | `.cursor-plugin/plugin.json` | Done |
| OpenCode | `.opencode/INSTALL.md`, `.opencode/plugins/thinking-skills.js` | Done |

## Claude Code Plugin

Claude plugin metadata lives at:

```text
.claude-plugin/plugin.json
.claude-plugin/marketplace.json
```

The adapter provides metadata for plugin discovery while keeping canonical skill content in `skills/`.

## Cursor Plugin

Cursor plugin metadata lives at:

```text
.cursor-plugin/plugin.json
```

The manifest points to:

```text
skills: "./skills/"
```

## OpenCode

OpenCode support lives at:

```text
.opencode/INSTALL.md
.opencode/plugins/thinking-skills.js
```

The plugin registers the shared `skills/` directory and injects a small bootstrap around `thinking-router`.
