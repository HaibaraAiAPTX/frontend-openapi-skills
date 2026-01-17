# AGENTS.md

This repository is a Claude Code plugin that provides skills for generating TypeScript models and HTTP clients from OpenAPI/Swagger specifications.

**Plugin Info:**
- **Name**: `frontend-openapi-skills`
- **Owner**: HaibaraaiAPTX
- **Skills**: download-swagger-file, generate-ts-models

## Project Structure

```
frontend-openapi-skills/
├── .claude-plugin/
│   ├── plugin.json          # Plugin metadata (required)
│   └── marketplace.json     # Marketplace configuration (required)
├── skills/
│   {skill-name}/           # kebab-case directory
│   │   ├── SKILL.md       # Skill definition (required)
│   │   ├── scripts/       # Executable scripts (required)
│   │   │   ├── *.sh       # Bash wrappers
│   │   │   └── *.js       # JS implementations
│   │   └── config.json    # Optional config
├── AGENTS.md
├── README.md
└── CLAUDE.md
```

## Creating a New Skill

### 1. Directory Structure

```bash
cd skills
mkdir {skill-name}
cd {skill-name}
mkdir scripts
```

### 2. Skill Definition

Create `SKILL.md` following this format:

```markdown
---
name: {skill-name}
description: When to use this skill (include trigger phrases)
---

# {Title}

{Brief description}

## How It Works

{Numbered workflow}

## Usage

```bash
bash /mnt/skills/user/{skill-name}/scripts/{script}.sh [args]
```

**Arguments:**
- `arg1` - Description (defaults to X)

**Examples:**
{2-3 common patterns}

## Output

{Example output}

## Present Results to User

{Result template for Claude}

## Troubleshooting

{Common issues and solutions}
```

### 3. Scripts

**Naming Conventions:**
- Directories: `kebab-case`
- Files: `kebab-case.sh`, `kebab-case.js`

**Bash Scripts (.sh):**
```bash
#!/bin/bash
set -e
# Write status to stderr: echo "Message" >&2
# Write JSON to stdout
```

**JavaScript Scripts (.js):**
```javascript
#!/usr/bin/env node
// Use console.error() for status
// Use console.log() for JSON output
```

**Common Pattern** (bash wrapper + JS implementation):
```bash
#!/bin/bash
set -e
node "$(dirname "$0")/script.js" "$1" "$2"
```

```javascript
if (require.main === module) {
  const result = main(process.argv[2], process.argv[3]);
  console.log(JSON.stringify(result));
}
```

### 4. Configuration (Optional)

Create `config.json` for skill settings. Load in scripts:
```javascript
const config = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'config.json'), 'utf8'
));
```

### 5. Register in Marketplace

No registration needed! Skills are automatically discovered from the `skills/` directory.

## Plugin Configuration Files

### Plugin Metadata (`.claude-plugin/plugin.json`)

Defines the plugin's metadata:

```json
{
  "name": "frontend-openapi-skills",
  "description": "A collection of frontend skills for working with OpenAPI specifications",
  "version": "1.0.0",
  "author": {
    "name": "HaibaraaiAPTX"
  }
}
```

### Marketplace Configuration (`.claude-plugin/marketplace.json`)

Lists the plugin in the marketplace:

```json
{
  "name": "frontend-openapi-skills",
  "owner": {
    "name": "HaibaraaiAPTX"
  },
  "plugins": [
    {
      "name": "frontend-openapi-skills",
      "source": "./",
      "description": "A collection of frontend skills for working with OpenAPI specifications",
      "version": "1.0.0",
      "author": {
        "name": "HaibaraaiAPTX"
      }
    }
  ]
}
```

**Important**: The `source` field points to `"./"` (the repository root), not to individual skills. All skills in the `skills/` directory are automatically discovered.

## Best Practices

**Keep SKILL.md under 500 lines** — only skill name/description loads at startup. Full SKILL.md loads when relevant.

- Write specific descriptions to help agents know exactly when to activate the skill
- Prefer scripts over inline code (saves context)
- Reference supporting files only when needed

## Version Management

Use semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

Update both `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` when releasing a new version.

## User Installation

**Via Marketplace** (recommended):
1. Open Claude Code
2. Navigate to plugin marketplace
3. Search for `frontend-openapi-skills`
4. Install the plugin (includes all skills)

**Manual** (for development):
```bash
# Claude Code
cp -r skills/{skill-name} ~/.claude/skills/

# claude.ai: Add SKILL.md to project knowledge
```

## Troubleshooting

**Skill not showing:**
- Verify SKILL.md frontmatter is valid YAML
- Check that skill directory structure is correct
- Ensure scripts directory exists with at least one executable script

**Script failures:**
- Verify shebangs (`#!/bin/bash` or `#!/usr/bin/env node`)
- Check file permissions (scripts should be executable)
- Ensure dependencies (Node.js, curl, etc.) are available

**Plugin installation issues:**
- Validate JSON syntax for both `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`
- Ensure version consistency between the two files
- Check that `source` field points to `"./"` in marketplace.json
