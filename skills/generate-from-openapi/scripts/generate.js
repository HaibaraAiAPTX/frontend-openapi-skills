/**
 * Generate API client and query hooks from OpenAPI specification
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseOperations } from "./parser.js";
import { generateFiles } from "./template-engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptDir = path.dirname(__dirname);
const repoRoot = path.join(scriptDir, "..", "..", "..");

/**
 * Parse CLI arguments
 */
function parseArgs(args) {
  const params = {
    input: null,
    importDomains: null,
    importApiCore: null,
    importError: null,
    importApi: null,
    outputApi: null,
    outputHooks: null,
    noHooks: false,
    queryRules: null,
    verbose: false,
    dryRun: false,
    templateDir: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--import-domains":
        params.importDomains = args[++i];
        break;
      case "--import-api-core":
        params.importApiCore = args[++i];
        break;
      case "--import-error":
        params.importError = args[++i];
        break;
      case "--import-api":
        params.importApi = args[++i];
        break;
      case "--output-api":
        params.outputApi = args[++i];
        break;
      case "--output-hooks":
        params.outputHooks = args[++i];
        break;
      case "--no-hooks":
        params.noHooks = true;
        break;
      case "--query-rules":
        params.queryRules = args[++i];
        break;
      case "--verbose":
        params.verbose = true;
        break;
      case "--dry-run":
        params.dryRun = true;
        break;
      case "--template-dir":
        params.templateDir = args[++i];
        break;
      default:
        if (!arg.startsWith("-")) {
          params.input = path.resolve(repoRoot, arg);
        }
        break;
    }
  }

  return params;
}

/**
 * Parse query rules from JSON string
 */
function parseQueryRules(rulesString) {
  if (!rulesString) return null;

  try {
    const rules = JSON.parse(rulesString);
    if (rules.methods && !Array.isArray(rules.methods)) {
      throw new Error("queryRules.methods must be an array");
    }
    if (rules.pathPatterns && !Array.isArray(rules.pathPatterns)) {
      throw new Error("queryRules.pathPatterns must be an array");
    }
    if (rules.forceQuery && !Array.isArray(rules.forceQuery)) {
      throw new Error("queryRules.forceQuery must be an array");
    }
    if (rules.forceMutation && !Array.isArray(rules.forceMutation)) {
      throw new Error("queryRules.forceMutation must be an array");
    }
    return rules;
  } catch (error) {
    throw new Error(`Failed to parse query rules: ${error.message}`);
  }
}

/**
 * Build configuration from CLI params and defaults
 */
function buildConfig(params) {
  const config = {
    imports: {
      domains: params.importDomains || null,
      apiCore: params.importApiCore || null,
      error: params.importError || null,
      api: params.importApi || null,
    },
    outputApi: params.outputApi || null,
    outputHooks: params.noHooks ? null : (params.outputHooks || null),
    noHooks: params.noHooks,
    verbose: params.verbose,
    dryRun: params.dryRun,
    templateDir: params.templateDir || path.join(__dirname, "..", "templates"),
    queryDetection: parseQueryRules(params.queryRules),
  };

  return config;
}

/**
 * Main generation function
 */
function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.input) {
    console.error("Error: OpenAPI spec file path is required");
    console.error("Usage: node generate.js <spec-file> [options]");
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    const config = buildConfig(args);

    if (config.dryRun) {
      console.log("[generate-from-openapi] DRY-RUN MODE: Files will not be written");
    }

    if (config.verbose) {
      console.log("[generate-from-openapi] Configuration:");
      console.log(`  Input: ${args.input}`);
      console.log(`  Template Dir: ${config.templateDir}`);
      console.log(`  Output API: ${config.outputApi}`);
      console.log(`  Output Hooks: ${config.noHooks ? "disabled" : config.outputHooks}`);
      if (config.queryDetection) {
        console.log(`  Query Detection Rules: ${JSON.stringify(config.queryDetection)}`);
      }
    }

    const specPath = args.input;
    if (!fs.existsSync(specPath)) {
      console.error(`Error: OpenAPI spec file not found: ${specPath}`);
      process.exit(1);
    }

    const specContent = fs.readFileSync(specPath, "utf8");
    const spec = JSON.parse(specContent);

    const { operations, info } = parseOperations(spec, config.queryDetection);

    if (config.verbose) {
      console.log(`[generate-from-openapi] Parsed ${operations.length} operations from ${spec.title || "API"}`);
      const queryCount = operations.filter((op) => op.isQuery).length;
      const mutationCount = operations.filter((op) => op.isMutation).length;
      console.log(`  Queries: ${queryCount}, Mutations: ${mutationCount}`);
    }

    const outputs = generateFiles(config.templateDir, operations, info, config);

    for (const output of outputs) {
      if (config.dryRun) {
        console.log(`[generate-from-openapi] Would generate ${output.type}: ${output.file}`);
        console.log(`--- ${output.type} preview (first 50 lines) ---`);
        console.log(output.content.split("\n").slice(0, 50).join("\n"));
        if (output.content.split("\n").length > 50) {
          console.log(`... (${output.content.split("\n").length - 50} more lines)`);
        }
        console.log("--- end preview ---");
      } else if (config.verbose) {
        console.log(`[generate-from-openapi] Generated ${output.type}: ${output.file}`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[generate-from-openapi] done - generated ${outputs.length} files in ${elapsed}s`);
  } catch (error) {
    console.error(`[generate-from-openapi] Error: ${error.message}`);
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
