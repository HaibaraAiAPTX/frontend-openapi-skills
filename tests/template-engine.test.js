/**
 * Integration tests for template-engine.js
 */

const fs = require("fs");
const path = require("path");
const { generateFiles } = require("../skills/generate-from-openapi/scripts/template-engine.js");
const { parseOperations } = require("../skills/generate-from-openapi/scripts/parser.js");

describe("template-engine.js", () => {
  const tempDir = path.join(process.cwd(), ".temp-test-output");

  beforeEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("generateFiles", () => {
    it("should generate API client file", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users": {
            get: {
              tags: ["User"],
              summary: "Get users",
              responses: {
                "200": {
                  content: { "application/json": { schema: { $ref: "#/components/schemas/UserDTO" } } },
                },
              },
            },
          },
        },
      };

      const { operations, info } = parseOperations(spec);
      const templateDir = path.join(process.cwd(), "skills", "generate-from-openapi", "templates");
      const config = {
        imports: {
          domains: 'import type * as Domains from "@repo/domains";',
          apiCore: 'import type { ApiRequestOptions } from "@repo/api-core";',
          error: null,
        },
        outputApi: path.join(tempDir, "api-client.ts"),
        outputHooks: null,
        noHooks: true,
        verbose: false,
        queryDetection: null,
      };

      const outputs = generateFiles(templateDir, operations, info, config);

      expect(outputs).toHaveLength(1);
      expect(outputs[0].type).toBe("api");
      expect(fs.existsSync(config.outputApi)).toBe(true);

      const content = fs.readFileSync(config.outputApi, "utf8");
      expect(content).toContain("@repo/domains");
      expect(content).toContain("createApi");
      expect(content).toContain("userUsersGet");
    });

    it("should generate query hooks file", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users": {
            get: {
              tags: ["User"],
              summary: "Get users",
              responses: {
                "200": {
                  content: { "application/json": { schema: { $ref: "#/components/schemas/UserDTO" } } },
                },
              },
            },
          },
        },
      };

      const { operations, info } = parseOperations(spec);
      const templateDir = path.join(process.cwd(), "skills", "generate-from-openapi", "templates");
      const config = {
        imports: {
          domains: 'import type * as Domains from "@repo/domains";',
          apiCore: null,
          error: 'import type { AppError } from "@repo/api-core";',
        },
        outputApi: null,
        outputHooks: path.join(tempDir, "hooks.ts"),
        noHooks: false,
        verbose: false,
        queryDetection: null,
      };

      const outputs = generateFiles(templateDir, operations, info, config);

      expect(outputs).toHaveLength(1);
      expect(outputs[0].type).toBe("hooks");
      expect(fs.existsSync(config.outputHooks)).toBe(true);

      const content = fs.readFileSync(config.outputHooks, "utf8");
      expect(content).toContain("@tanstack/react-query");
      expect(content).toContain("createApiHooks");
      expect(content).toContain("useUserUsersGetQuery");
    });

    it("should generate both API client and hooks", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users": {
            get: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations, info } = parseOperations(spec);
      const templateDir = path.join(process.cwd(), "skills", "generate-from-openapi", "templates");
      const config = {
        imports: {
          domains: 'import type * as Domains from "@repo/domains";',
          apiCore: 'import type { ApiRequestOptions } from "@repo/api-core";',
          error: 'import type { AppError } from "@repo/api-core";',
        },
        outputApi: path.join(tempDir, "api.ts"),
        outputHooks: path.join(tempDir, "hooks.ts"),
        noHooks: false,
        verbose: false,
        queryDetection: null,
      };

      const outputs = generateFiles(templateDir, operations, info, config);

      expect(outputs).toHaveLength(2);
      expect(fs.existsSync(config.outputApi)).toBe(true);
      expect(fs.existsSync(config.outputHooks)).toBe(true);
    });

    it("should skip hooks when noHooks is true", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users": {
            get: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations, info } = parseOperations(spec);
      const templateDir = path.join(process.cwd(), "skills", "generate-from-openapi", "templates");
      const config = {
        imports: {
          domains: 'import type * as Domains from "@repo/domains";',
          apiCore: 'import type { ApiRequestOptions } from "@repo/api-core";',
          error: null,
        },
        outputApi: path.join(tempDir, "api.ts"),
        outputHooks: path.join(tempDir, "hooks.ts"),
        noHooks: true,
        verbose: false,
        queryDetection: null,
      };

      const outputs = generateFiles(templateDir, operations, info, config);

      expect(outputs).toHaveLength(1);
      expect(outputs[0].type).toBe("api");
      expect(fs.existsSync(config.outputApi)).toBe(true);
      expect(fs.existsSync(config.outputHooks)).toBe(false);
    });

    it("should include imports in generated files", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users": {
            get: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations, info } = parseOperations(spec);
      const templateDir = path.join(process.cwd(), "skills", "generate-from-openapi", "templates");
      const config = {
        imports: {
          domains: 'import type * as Domains from "@repo/domains";',
          apiCore: 'import type { ApiRequestOptions } from "@repo/api-core";',
          error: 'import type { AppError } from "@repo/api-core";',
        },
        outputApi: path.join(tempDir, "api.ts"),
        outputHooks: path.join(tempDir, "hooks.ts"),
        noHooks: false,
        verbose: false,
        queryDetection: null,
      };

      generateFiles(templateDir, operations, info, config);

      const apiContent = fs.readFileSync(config.outputApi, "utf8");
      expect(apiContent).toContain('import type * as Domains from &quot;@repo/domains&quot;;');
      expect(apiContent).toContain('import type { ApiRequestOptions } from &quot;@repo/api-core&quot;;');

      const hooksContent = fs.readFileSync(config.outputHooks, "utf8");
      expect(hooksContent).toContain('import type { AppError } from &quot;@repo/api-core&quot;;');
    });

    it("should handle operations with path parameters", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users/{id}": {
            get: {
              tags: ["User"],
              parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } },
              ],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations, info } = parseOperations(spec);
      const templateDir = path.join(process.cwd(), "skills", "generate-from-openapi", "templates");
      const config = {
        imports: {
          domains: 'import type * as Domains from "@repo/domains";',
          apiCore: 'import type { ApiRequestOptions } from "@repo/api-core";',
          error: null,
        },
        outputApi: path.join(tempDir, "api.ts"),
        outputHooks: null,
        noHooks: true,
        verbose: false,
        queryDetection: null,
      };

      generateFiles(templateDir, operations, info, config);

      const content = fs.readFileSync(config.outputApi, "utf8");
      expect(content).toContain("path: { id: number }");
    });

    it("should handle operations with query parameters", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users": {
            get: {
              tags: ["User"],
              parameters: [
                { name: "page", in: "query", required: false, schema: { type: "integer" } },
                { name: "size", in: "query", required: false, schema: { type: "integer" } },
              ],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations, info } = parseOperations(spec);
      const templateDir = path.join(process.cwd(), "skills", "generate-from-openapi", "templates");
      const config = {
        imports: {
          domains: 'import type * as Domains from "@repo/domains";',
          apiCore: 'import type { ApiRequestOptions } from "@repo/api-core";',
          error: null,
        },
        outputApi: path.join(tempDir, "api.ts"),
        outputHooks: null,
        noHooks: true,
        verbose: false,
        queryDetection: null,
      };

      generateFiles(templateDir, operations, info, config);

      const content = fs.readFileSync(config.outputApi, "utf8");
      expect(content).toContain("query?: { page?: number; size?: number }");
    });

    it("should handle operations with body", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users": {
            post: {
              tags: ["User"],
              requestBody: {
                content: {
                  "application/json": { schema: { $ref: "#/components/schemas/CreateUserDTO" } },
                },
              },
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations, info } = parseOperations(spec);
      const templateDir = path.join(process.cwd(), "skills", "generate-from-openapi", "templates");
      const config = {
        imports: {
          domains: 'import type * as Domains from "@repo/domains";',
          apiCore: 'import type { ApiRequestOptions } from "@repo/api-core";',
          error: null,
        },
        outputApi: path.join(tempDir, "api.ts"),
        outputHooks: null,
        noHooks: true,
        verbose: false,
        queryDetection: null,
      };

      generateFiles(templateDir, operations, info, config);

      const content = fs.readFileSync(config.outputApi, "utf8");
      expect(content).toContain("body: Domains.CreateUserDTO");
    });

    it("should create output directories if they don't exist", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users": {
            get: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const { operations, info } = parseOperations(spec);
      const templateDir = path.join(process.cwd(), "skills", "generate-from-openapi", "templates");
      const deepOutputPath = path.join(tempDir, "deep", "nested", "api.ts");
      const config = {
        imports: {
          domains: 'import type * as Domains from "@repo/domains";',
          apiCore: 'import type { ApiRequestOptions } from "@repo/api-core";',
          error: null,
        },
        outputApi: deepOutputPath,
        outputHooks: null,
        noHooks: true,
        verbose: false,
        queryDetection: null,
      };

      generateFiles(templateDir, operations, info, config);

      expect(fs.existsSync(deepOutputPath)).toBe(true);
    });
  });
});
