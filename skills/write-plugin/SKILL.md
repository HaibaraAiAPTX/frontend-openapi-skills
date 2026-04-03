---
name: write-plugin
description: "Write custom JS plugins for the aptx-ft CLI. Use this skill whenever the user wants to customize or extend aptx-ft beyond its built-in generation commands. This is the correct skill whenever the user's request involves any of these concepts combined with aptx-ft: writing or loading a plugin file (.js), using the --plugin or -p CLI flag, creating custom CLI subcommands, accessing parsed OpenAPI data programmatically (ctx.getIr, PluginContext, GeneratorInput, IR data), building custom code generators (e.g. generating Axios clients instead of fetch-style), producing reports or analysis from an OpenAPI spec via a plugin (e.g. listing deprecated endpoints), or extending the CLI in any way. Also covers questions about how the plugin system works (PluginDescriptor, CommandDescriptor, OptionDescriptor). Do NOT use for standard generation tasks like generating models, react-query hooks, vue-query, functions, or barrel files — those belong to generate-artifacts or generate-models instead."
---

# Write aptx-ft Plugin

Create custom JS plugins that extend the aptx-ft CLI with new commands and code generation capabilities.

## When to Write a Plugin

| Scenario | Action |
|----------|--------|
| Need a custom code generator (e.g., Axios client, gRPC stub) | Write a plugin with command + custom rendering |
| Want to transform IR data into project-specific formats | Use `ctx.getIr()` to read OpenAPI IR |
| Need to add project-specific CLI commands to aptx-ft | Register commands via plugin |
| Built-in commands don't cover your use case | Extend with a plugin |

## Command Name Mapping

The plugin defines command names with a colon separator (e.g. `my:generate`), but the CLI splits this into two arguments at runtime:

| Plugin `name` field | CLI invocation |
|---------------------|----------------|
| `my:generate` | `aptx-ft my generate` |
| `tk:lint` | `aptx-ft tk lint` |
| `report:deps` | `aptx-ft report deps` |

The first part becomes a namespace subcommand, the second part becomes the actual command.

## Plugin File Structure

A plugin is a CommonJS or ESM module exporting a `Plugin` object:

```javascript
// my-plugin.js
const myPlugin = {
  descriptor: {
    name: 'my-plugin',
    version: '1.0.0',
    namespaceDescription: 'Custom code generation commands',
  },
  commands: [
    {
      name: 'my:generate',
      summary: 'Generate custom output from OpenAPI',
      options: [
        { flags: '-o, --output <dir>', description: 'Output directory', required: true },
        { flags: '--template <file>', description: 'Template file path' },
      ],
      handler: async (ctx, args) => {
        const inputPath = args.input; // global --input is available
        const outputDir = args.output;

        // Access parsed IR data
        const ir = ctx.getIr(inputPath);

        // Iterate endpoints
        for (const ep of ir.endpoints) {
          ctx.log(`Processing ${ep.method} ${ep.path} → ${ep.export_name}`);
          // Your generation logic here
        }
      },
    },
  ],
  // Optional: runs once when plugin loads
  init(ctx) {
    ctx.log('my-plugin loaded');
  },
};

module.exports = myPlugin;
module.exports.default = myPlugin;
```

## TypeScript Plugin Development

Plugins can be written in TypeScript. Since the CLI loads `.js` files at runtime, compile your `.ts` plugin first:

```bash
# Compile the plugin
npx tsc my-plugin.ts --outDir ./dist --module commonjs --target ESNext

# Run the compiled plugin (colon in name becomes two CLI args)
pnpm exec aptx-ft -i ./openapi.json -p ./dist/my-plugin.js my generate -o ./output
```

The `--plugin` flag is global — place it before the subcommand. Each `-p` takes one path; repeat the flag for multiple plugins. The `-i` flag provides the OpenAPI file that `ctx.getIr()` reads.

## Common Patterns

### Pattern 1: Custom Code Generator

Generate non-standard output from OpenAPI endpoints:

```javascript
handler: async (ctx, args) => {
  const ir = ctx.getIr(args.input);
  const output = args.output;
  const fs = await import('fs');
  const path = await import('path');

  // Filter endpoints by namespace
  const endpoints = ir.endpoints.filter(
    ep => ep.namespace.includes(args.namespace || '')
  );

  for (const ep of endpoints) {
    const filename = `${ep.export_name}.ts`;
    const content = generateCode(ep); // your logic
    fs.writeFileSync(path.join(output, filename), content);
    ctx.log(`Generated ${filename}`);
  }
},
```

### Pattern 2: Endpoint Analysis / Reporting

Read IR data and produce a report without generating files:

```javascript
handler: async (ctx, args) => {
  const ir = ctx.getIr(args.input);

  ctx.log(`API: ${ir.project.package_name}`);
  ctx.log(`Endpoints: ${ir.endpoints.length}`);

  // Group by method
  const byMethod = {};
  for (const ep of ir.endpoints) {
    (byMethod[ep.method] ??= []).push(ep);
  }
  for (const [method, eps] of Object.entries(byMethod)) {
    ctx.log(`  ${method.toUpperCase()}: ${eps.length}`);
  }

  // Find deprecated
  const deprecated = ir.endpoints.filter(ep => ep.deprecated);
  if (deprecated.length > 0) {
    ctx.log(`\nDeprecated endpoints:`);
    deprecated.forEach(ep => ctx.log(`  - ${ep.method} ${ep.path}`));
  }
},
```

### Pattern 3: Multi-command Plugin

A plugin with several related commands:

```javascript
const plugin = {
  descriptor: {
    name: 'my-toolkit',
    version: '1.0.0',
    namespaceDescription: 'Custom development toolkit',
  },
  commands: [
    {
      name: 'tk:lint',
      summary: 'Lint generated code',
      options: [
        { flags: '--fix', description: 'Auto-fix issues', defaultValue: false },
      ],
      handler: async (ctx, args) => { /* ... */ },
    },
    {
      name: 'tk:stats',
      summary: 'Show API statistics',
      options: [],
      handler: async (ctx, args) => { /* ... */ },
    },
    {
      name: 'tk:convert',
      summary: 'Convert output to another format',
      options: [
        { flags: '--format <type>', description: 'Target format', required: true },
      ],
      handler: async (ctx, args) => { /* ... */ },
    },
  ],
};
```

## Rules

- Command names in the plugin use `namespace:command` format (colon separator)
- **CLI invocation splits the colon into two args**: `my:generate` → `aptx-ft my generate`
- `ctx.getIr()` throws on invalid file path or malformed OpenAPI — handle errors in your handler
- Export both `module.exports` and `module.exports.default` for compatibility
- Plugin files loaded at runtime must be `.js` or `.mjs` — compile `.ts` plugins first
- Binary formats (`.node`, `.dll`, `.so`, `.dylib`) are skipped
- Options array can be empty `[]` if the command takes no flags

## Boundaries

- This skill creates plugin files only — it does not modify the aptx-ft CLI itself
- Plugins are loaded at runtime via `--plugin` and don't require rebuilding aptx-ft
- This skill does not cover Rust/NAPI plugin development — only JS plugins
- For standard code generation (models, react-query, vue-query), use existing skills instead

## Related Skills

- **generate-artifacts**: Standard artifact generation (models + request clients)
- **generate-models**: Model-only generation
- **download-openapi**: Fetch OpenAPI spec from URL
