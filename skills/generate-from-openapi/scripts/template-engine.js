/**
 * Template Engine - Handlebars template processor with helper functions
 */

import Handlebars from "handlebars";
import fs from "node:fs";
import path from "node:path";
import { toPascalCase, toCamelCase, sanitizeIdentifier, validateTemplate } from "./utils.js";

/**
 * Register Handlebars helper functions
 */
function registerHelpers() {
  Handlebars.registerHelper("toPascalCase", toPascalCase);
  Handlebars.registerHelper("toCamelCase", toCamelCase);
  Handlebars.registerHelper("sanitizeIdentifier", sanitizeIdentifier);

  Handlebars.registerHelper("if", function (conditional, options) {
    if (conditional) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  Handlebars.registerHelper("unless", function (conditional, options) {
    if (!conditional) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  Handlebars.registerHelper("eq", function (a, b, options) {
    if (a === b) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });
}

/**
 * Load Handlebars templates from directory with validation
 * @param {string} templateDir - Directory containing .hbs files
 * @returns {Map<string, HandlebarsTemplateDelegate>} Map of template name to compiled template
 */
function loadTemplates(templateDir) {
  const templates = new Map();

  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template directory not found: ${templateDir}`);
  }

  const files = fs.readdirSync(templateDir);

  for (const file of files) {
    if (file.endsWith(".hbs")) {
      const filePath = path.join(templateDir, file);
      const content = fs.readFileSync(filePath, "utf8");

      const validation = validateTemplate(content, filePath, Handlebars);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const templateName = path.basename(file, ".hbs");
      templates.set(templateName, Handlebars.compile(content));
    }
  }

  return templates;
}

/**
 * Prepare context for template rendering
 * @param {Array<object>} operations - Parsed operations from parser
 * @param {object} info - OpenAPI info metadata
 * @param {object} config - Generation configuration
 * @returns {object} Template context
 */
function prepareContext(operations, info, config) {
  const context = {
    info,
    operations: operations.map((op) => {
      const parts = [];
      if (op.pathParams.length) {
        parts.push(
          `path: { ${op.pathParams
            .map((p) => `${sanitizeIdentifier(p.name)}${p.required ? "" : "?"}: ${p.type}`)
            .join("; ")} }`,
        );
      }
      if (op.queryParams.length) {
        const anyRequired = op.queryParams.some((p) => p.required);
        parts.push(
          `query${anyRequired ? "" : "?"}: { ${op.queryParams
            .map((p) => `${sanitizeIdentifier(p.name)}${p.required ? "" : "?"}: ${p.type}`)
            .join("; ")} }`,
        );
      }
      if (op.hasBody) parts.push(`body: ${op.bodyType}`);
      parts.push("signal?: AbortSignal");

      const argsType = parts.length > 0 ? `{ ${parts.join("; ")} }` : undefined;
      const fnType = `Api["${op.name}"]`;

      return {
        ...op,
        hasPathParams: op.pathParams.length > 0,
        hasQueryParams: op.queryParams.length > 0,
        argsType,
        resultType: `Result<${fnType}>`,
        fnType,
      };
    }),
    toPascalCase,
    toCamelCase,
    config,
  };

  return context;
}

/**
 * Generate output files from templates
 * @param {string} templateDir - Directory containing templates
 * @param {Array<object>} operations - Parsed operations
 * @param {object} info - OpenAPI info metadata
 * @param {object} config - Generation configuration
 * @returns {Array<{file: string, type: string, content?: string}>} Generated outputs
 */
export function generateFiles(templateDir, operations, info, config) {
  registerHelpers();
  const templates = loadTemplates(templateDir);
  const context = prepareContext(operations, info, config);

  const outputs = [];

  if (!config.noHooks && config.outputHooks) {
    const hooksTemplate = templates.get("query-hooks");
    if (hooksTemplate) {
      const outputDir = path.dirname(config.outputHooks);
      fs.mkdirSync(outputDir, { recursive: true });
      const content = hooksTemplate(context);

      if (!config.dryRun) {
        fs.writeFileSync(config.outputHooks, content + "\n", "utf8");
      }

      outputs.push({ file: config.outputHooks, type: "hooks", content });
    }
  }

  if (config.outputApi) {
    const apiTemplate = templates.get("api-client");
    if (apiTemplate) {
      const outputDir = path.dirname(config.outputApi);
      fs.mkdirSync(outputDir, { recursive: true });
      const content = apiTemplate(context);

      if (!config.dryRun) {
        fs.writeFileSync(config.outputApi, content + "\n", "utf8");
      }

      outputs.push({ file: config.outputApi, type: "api", content });
    }
  }

  return outputs;
}
