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

## Plugin Interface Reference

### PluginDescriptor

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Unique plugin identifier |
| `version` | `string` | Yes | Semantic version |
| `namespaceDescription` | `string` | No | Help text shown for this plugin's namespace |

### CommandDescriptor

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Command name in `namespace:command` format |
| `summary` | `string` | Yes | One-line description |
| `description` | `string` | No | Detailed help text |
| `options` | `OptionDescriptor[]` | Yes | Array of CLI options (can be empty `[]`) |
| `handler` | `function` | Yes | `(ctx, args) => void \| Promise<void>` |
| `requiresOpenApi` | `boolean` | No | Whether command needs `--input` (default: true) |

### OptionDescriptor

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `flags` | `string` | Yes | Option flags, e.g. `"-o, --output <path>"` |
| `description` | `string` | Yes | Help text |
| `defaultValue` | `string \| boolean` | No | Default value |
| `required` | `boolean` | No | Whether option is mandatory |

### PluginContext

| Method / Field | Description |
|----------------|-------------|
| `ctx.getIr(inputPath)` | Parse OpenAPI file and return `GeneratorInput` IR object |
| `ctx.log(msg)` | Print message to stdout |
| `ctx.binding` | Direct access to native Rust binding |

## IR Data Structure (`GeneratorInput`)

The object returned by `ctx.getIr()`:

```typescript
{
  project: {
    package_name: string;    // API title from OpenAPI info.title
    api_base_path?: string;  // Base path from server URL
    terminals: string[];     // Terminal model type names
  },
  endpoints: [{
    namespace: string[];         // e.g., ["users", "admin"]
    operation_name: string;      // e.g., "getUsers"
    export_name: string;         // e.g., "getUsers"
    builder_name: string;        // Builder function name
    summary?: string;            // OpenAPI operation summary
    method: string;              // "get", "post", "put", "delete", "patch"
    path: string;                // e.g., "/users/{id}"
    input_type_name: string;     // Request body type name
    output_type_name: string;    // Response type name
    request_body_field?: string; // Request body field name
    query_fields: string[];      // Query parameter names
    path_fields: string[];       // Path parameter names
    has_request_options: boolean;
    deprecated: boolean;
    meta: Record<string, string>;
  }],
  model_import: { ... } | null,  // Model import configuration
  client_import: { ... } | null,  // Client import configuration
  output_root: string | null,
}
```

## Workflow

1. **Understand user's goal** — What should the plugin generate or do?
2. **Determine plugin structure** — How many commands? What options?
3. **Draft the plugin file** — Follow the template above
4. **Save to project** — Typically in a `plugins/` directory or project root
5. **Test** — Run with `pnpm exec aptx-ft -i ./openapi.json -p ./my-plugin.js my:generate -o ./output`

## Running a Plugin

```bash
# Single plugin
pnpm exec aptx-ft -i ./openapi.json -p ./plugins/my-plugin.js my:generate -o ./output

# Multiple plugins
pnpm exec aptx-ft -i ./openapi.json \
  -p ./plugins/plugin-a.js \
  -p ./plugins/plugin-b.js \
  my:generate -o ./output
```

The `--plugin` flag is global — place it before the subcommand. The `-i` flag provides the OpenAPI file that `ctx.getIr()` reads.

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

- Command names must use `namespace:command` format (colon separator, no spaces)
- `ctx.getIr()` throws on invalid file path or malformed OpenAPI — handle errors in your handler
- Export both `module.exports` and `module.exports.default` for compatibility
- Plugin files must be `.js` or `.mjs` — binary formats (`.node`, `.dll`, `.so`) are skipped
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
