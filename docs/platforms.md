# Platform Support

## Goal

Thinking Skills should be portable across agent platforms.

The framework should keep its core skill content platform-neutral, then provide thin adapter layers for each runtime.

## Priority Order

| Priority | Platform | Target |
|---|---|---|
| P0 | Codex native skills | Clone or install the repository and expose `skills/` through Codex skill discovery |
| P0 | Codex plugin | Provide `.codex-plugin/plugin.json` for Codex plugin installation and UI metadata |
| P1 | Claude Code plugin | Provide `.claude-plugin/plugin.json` and marketplace/install docs |
| P1 | Cursor plugin/rules | Provide Cursor plugin metadata or project rules |
| P2 | OpenCode | Provide OpenCode adapter docs and metadata |
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
| Claude Code plugin | `.claude-plugin/plugin.json` | Todo |
| Cursor plugin/rules | `.cursor-plugin/` or `.cursor/rules/` | Todo |
| OpenCode | `.opencode/` | Todo |
