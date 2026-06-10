# Beaver Installation and Update Guide

Install via the Claude Code plugin hub. After installation it works immediately, with no separate build or dependency install required.

---

## Requirements

| Item | Why it's needed |
|---|---|
| **Claude Code** (plugin-capable version) | Loading skills, hooks, and agents |
| **Node.js** (`node` on PATH) | Running the document-validation hook script (`scripts/on-doc-written.js`) and the auto-approve hook. Without it the hooks silently no-op (document structure is checked manually by the skill) |
| **git** | Branch, commit, and merge operations in plan/ship |

> Works regardless of the target project's language (NestJS/Spring/Python/...). Test and build commands are detected by `/beaver:analyze` and recorded in `.beaver/config.json`.

### ⚠️ Behavior and Security Notice

beaver's hooks **do not execute any project test or build command**. The only PostToolUse hook (`scripts/on-doc-written.js`) validates the structure of saved plan/spec/revision documents; it runs no shell command. Test execution happens only inside the ship skill (the single post-merge full regression), via a `Bash` call that is never auto-approved and always prompts. The `commands` values in `.beaver/config.json` are detected and filled by `/beaver:analyze`, **always recorded only after user confirmation**, and can be reviewed/edited directly.

**`auto_approve` (default on).** A PreToolUse hook (`scripts/auto-approve.js`) **auto-approves in-project file edits** (`Write`/`Edit`/`MultiEdit`/`NotebookEdit`) so Claude Code stops prompting on every plan/build/ship step. **Shell commands (`Bash`) are never auto-approved** — tests, `git push`, and any other command still go through normal confirmation, as do edits to files outside the project. To restore per-edit confirmation, set `"auto_approve": false` in `.beaver/config.json`.

---

## Installation

Inside Claude Code:

```text
/plugin marketplace add HaSungJe/beaver
/plugin install beaver@beaver
```

1. `marketplace add HaSungJe/beaver` — registers this repository's `.claude-plugin/marketplace.json` as a marketplace.
2. `install beaver@beaver` — installs the plugin `beaver` from the `beaver` marketplace.

After installation, restart Claude Code or check the active status with `/plugin`. Slash commands carry a **namespace (`beaver:`)**, as in `/beaver:analyze`.

### Interactive Installation (UI)

```text
/plugin
```

→ In the **Discover** tab, select `beaver` → specify the install scope (user/project/local).

---

## First Use

In the project root, run the codebase analysis **once, first of all**:

```text
/beaver:analyze
```

→ This generates the `CLAUDE.md` + `docs/` conventions and `.beaver/config.json`. Then proceed with `/beaver:plan` → `/beaver:build` → `/beaver:ship`. For the detailed flow, see the [README](./README.md#workflow).

---

## Updating

When a new version is published to the repository, update in the **3 steps** below. Order matters — you must refresh the marketplace metadata first so the new version is recognized.

### Step 1 — Refresh marketplace metadata

Type this directly into the Claude Code input box:

```text
/plugin marketplace update beaver
```

→ If `✔ Updated 1 marketplace (1 plugin bumped)` appears, the new version number has been recognized. (If `bumped` doesn't appear and the version is unchanged, there's nothing to update.)

### Step 2 — Update the plugin (UI)

`/plugin update beaver` may **just open the UI** depending on your Claude Code version. The reliable way is to do it directly in the `/plugin` UI:

1. Type `/plugin` → Enter. The plugin manager opens.
2. Move to the **`Installed`** tab at the top — switch tabs with the `←` `→` arrows (`Plugins  Discover  Installed  Marketplaces  Errors`).
3. Use `↑` `↓` to select **`beaver`** in the list. If a new version is available, an `[UPDATE]` badge appears on the right.
4. `Enter` → on the detail screen, select the **`Update`** item and press `Enter`.
5. When `beaver is already at the latest version (x.y.z).` appears, the update is complete.

> If no `[UPDATE]` badge appears and the version is unchanged → press `Esc` to exit, **redo Step 1**, and retry Step 2.

### Step 3 — Apply (required)

```text
/reload-plugins
```

→ When `Reloaded: N plugins …` appears, the new skills/hooks/templates are applied. (Or restart Claude Code.)

**Verify**: if the end of the `/reload-plugins` output shows `0 error`, all is well. If `1 error during load` appears, see the troubleshooting below.

### When the update doesn't take (stale cache)

If the old version still runs after updating, or hook errors persist, the cache has the old version pinned:

- `/plugin` → `Installed` → `beaver`, then **Disable → Enable** (deactivate then reactivate) → `/reload-plugins`.
- If it still persists, **restart Claude Code**. The cache accumulates per version under `~/.claude/plugins/cache/beaver/beaver/<version>/`, so restarting loads from the latest version directory.

### Project artifacts are preserved

An update only replaces the plugin itself (skills/hooks/scripts/templates). It does not touch the user project's `.beaver/` (config and output) or the root `CLAUDE.md` and `docs/`.

---

## Uninstalling

```text
/plugin uninstall beaver@beaver
```

Or remove it from the **Manage** tab of the `/plugin` UI. To also remove the marketplace registration:

```text
/plugin marketplace remove beaver
```

> Even after uninstalling, the project's `.beaver/` artifacts and the generated `CLAUDE.md` and `docs/` remain. Delete them manually if you don't need them.

---

## Local Development and Testing (for maintainers)

When modifying and testing the plugin:

```text
# Register the local path as a marketplace
/plugin marketplace add ./
/plugin install beaver@beaver
```

Or specify the plugin directory directly when launching Claude Code:

```bash
claude --plugin-dir /path/to/beaver
```

After making changes, apply them with `/reload-plugins`.

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Slash commands don't show up | Verify beaver is **enabled** in `/plugin`. Restart or `/reload-plugins` |
| Document-validation hook doesn't run | Check that `node` is on PATH (`node -v`). Without it `on-doc-written.js` is a no-op — document structure is validated manually by the skill |
| `/beaver:plan` aborts with "no convention docs" | Run `/beaver:analyze` once first to generate `CLAUDE.md` |
| Test command is wrong | Edit `commands.test` / `test_one` in `.beaver/config.json` to match the project |
| Update isn't applied | 1) `/plugin marketplace update beaver` 2) `/plugin` → `Installed` → beaver → `Update` 3) `/reload-plugins` (Step 3 of [Updating](#updating) above). If it still fails, Disable→Enable or restart |
| `Duplicate hooks file detected` error | Leftover cache from an old version (≤0.1.3). Update to the latest and `/reload-plugins`; if that fails, restart to release the old version's cache directory |
| `1 error during load` | Check details with `/doctor`. Usually the hooks duplication above or a stale cache — resolved by restarting |
