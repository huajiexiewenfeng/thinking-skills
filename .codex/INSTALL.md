# Installing Thinking Skills for Codex

Enable Thinking Skills in Codex through native skill discovery.

## Prerequisites

- Git
- Codex with skill discovery enabled

## Installation

### macOS / Linux

```bash
git clone https://github.com/huajiexiewenfeng/thinking-skills.git ~/.codex/thinking-skills
mkdir -p ~/.agents/skills
ln -s ~/.codex/thinking-skills/skills ~/.agents/skills/thinking-skills
```

### Windows PowerShell

```powershell
git clone https://github.com/huajiexiewenfeng/thinking-skills.git "$env:USERPROFILE\.codex\thinking-skills"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\thinking-skills" "$env:USERPROFILE\.codex\thinking-skills\skills"
```

Restart Codex after installation so it can discover the skills.

## Skills vs Plugins

This native install method makes Thinking Skills appear under Codex **Skills**.

It does not make the repository appear under Codex **Plugins**. The plugin tab only shows plugins installed through Codex's plugin installation or marketplace flow.

The repository includes `.codex-plugin/plugin.json` for future Codex plugin packaging, but that manifest is not auto-registered by the native skills install.

## Verify

macOS / Linux:

```bash
ls -la ~/.agents/skills/thinking-skills
```

Windows PowerShell:

```powershell
Get-ChildItem "$env:USERPROFILE\.agents\skills\thinking-skills"
```

You should see the Thinking Skills skill directories.

## Updating

```bash
cd ~/.codex/thinking-skills
git pull
```

Skills update through the symlink or junction.

## Uninstalling

macOS / Linux:

```bash
rm ~/.agents/skills/thinking-skills
rm -rf ~/.codex/thinking-skills
```

Windows PowerShell:

```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\thinking-skills"
Remove-Item -Recurse -Force "$env:USERPROFILE\.codex\thinking-skills"
```
