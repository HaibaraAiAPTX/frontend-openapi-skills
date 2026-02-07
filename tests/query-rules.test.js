/**
 * End-to-end tests for custom query detection rules
 */

const fs = require("fs");
const path = require("path");
const { parseOperations } = require("../skills/generate-from-openapi/scripts/parser.js");
const { generateFiles } = require("../skills/generate-from-openapi/scripts/template-engine.js");

describe("Custom Query Rules - E2E Tests", () => {
  const tempDir = path.join(process.cwd(), ".temp-query-rules-test");

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

  describe("Custom Methods Rule", () => {
    it("should classify POST as query when methods includes post", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/data": {
            post: {
              tags: ["Data"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        methods: ["get", "post"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isQuery).toBe(true);
      expect(operations[0].isMutation).toBe(false);
    });

    it("should classify POST as mutation when methods excludes post", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/data": {
            post: {
              tags: ["Data"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        methods: ["get"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isQuery).toBe(false);
      expect(operations[0].isMutation).toBe(true);
    });
  });

  describe("Path Patterns Rule", () => {
    it("should classify paths matching pattern as query", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/data/fetch": {
            post: {
              tags: ["Data"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
          "/api/data/save": {
            post: {
              tags: ["Data"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        pathPatterns: ["/fetch"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isQuery).toBe(true);
      expect(operations[1].isQuery).toBe(false);
    });

    it("should match multiple path patterns", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/data/get": {
            post: { tags: ["Data"], responses: { "200": { content: { "application/json": {} } } } },
          },
          "/api/data/fetch": {
            post: { tags: ["Data"], responses: { "200": { content: { "application/json": {} } } } },
          },
          "/api/data/save": {
            post: { tags: ["Data"], responses: { "200": { content: { "application/json": {} } } } },
          },
        },
      };

      const rules = {
        pathPatterns: ["/get", "/fetch"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isQuery).toBe(true);
      expect(operations[1].isQuery).toBe(true);
      expect(operations[2].isQuery).toBe(false);
    });
  });

  describe("Force Query Rule", () => {
    it("should force specific paths as query", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users/create": {
            post: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        forceQuery: ["/api/users/create"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isQuery).toBe(true);
      expect(operations[0].isMutation).toBe(false);
    });

    it("should force query with wildcard pattern", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/batch/process": {
            post: {
              tags: ["Batch"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
          "/api/batch/execute": {
            post: {
              tags: ["Batch"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        forceQuery: ["/api/batch/*"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isQuery).toBe(true);
      expect(operations[1].isQuery).toBe(true);
    });
  });

  describe("Force Mutation Rule", () => {
    it("should force specific paths as mutation", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users/list": {
            get: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        forceMutation: ["/api/users/list"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isMutation).toBe(true);
      expect(operations[0].isQuery).toBe(false);
    });

    it("should force mutation with wildcard pattern", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/analytics/data": {
            get: {
              tags: ["Analytics"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
          "/api/analytics/report": {
            get: {
              tags: ["Analytics"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        forceMutation: ["/api/analytics/*"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isMutation).toBe(true);
      expect(operations[1].isMutation).toBe(true);
    });
  });

  describe("Rule Priority", () => {
    it("should prioritize forceMutation over forceQuery", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users/list": {
            get: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        forceQuery: ["/api/users/list"],
        forceMutation: ["/api/users/list"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isMutation).toBe(true);
    });

    it("should prioritize forceQuery over methods", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/data/save": {
            post: {
              tags: ["Data"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        methods: ["get"],
        forceQuery: ["/api/data/save"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isQuery).toBe(true);
    });
  });

  describe("Generated Hooks with Custom Rules", () => {
    it("should generate query hooks for forced query operations", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/batch/process": {
            post: {
              tags: ["Batch"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        forceQuery: ["/api/batch/*"],
      };

      const { operations, info } = parseOperations(spec, rules);
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
        queryDetection: rules,
      };

      generateFiles(templateDir, operations, info, config);

      const content = fs.readFileSync(config.outputHooks, "utf8");
      expect(content).toContain("useBatchProcessPostQuery");
    });

    it("should generate mutation hooks for forced mutation operations", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/users/list": {
            get: {
              tags: ["User"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        forceMutation: ["/api/users/list"],
      };

      const { operations, info } = parseOperations(spec, rules);
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
        queryDetection: rules,
      };

      generateFiles(templateDir, operations, info, config);

      const content = fs.readFileSync(config.outputHooks, "utf8");
      expect(content).toContain("useUserListGetMutation");
    });
  });

  describe("Complex Rules Combination", () => {
    it("should handle combination of methods, patterns, and force rules", () => {
      const spec = {
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/api/data/get": {
            get: {
              tags: ["Data"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
          "/api/data/save": {
            post: {
              tags: ["Data"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
          "/api/batch/process": {
            post: {
              tags: ["Batch"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
          "/api/analytics/report": {
            get: {
              tags: ["Analytics"],
              responses: { "200": { content: { "application/json": {} } } },
            },
          },
        },
      };

      const rules = {
        methods: ["get", "post"],
        pathPatterns: ["/get"],
        forceQuery: ["/api/batch/*"],
        forceMutation: ["/api/analytics/*"],
      };

      const { operations } = parseOperations(spec, rules);

      expect(operations[0].isQuery).toBe(true);
      expect(operations[1].isQuery).toBe(true);
      expect(operations[2].isQuery).toBe(true);
      expect(operations[3].isMutation).toBe(true);
    });
  });
});
