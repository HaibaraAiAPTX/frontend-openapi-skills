---
name: generate-python
description: "Generate Python code from OpenAPI via aptx-ft, including Pydantic models, async API functions, and OpenAI function-calling tools.json. Use when user wants: (1) to generate Python client code from OpenAPI/Swagger, (2) Pydantic v2 data models from API schemas, (3) async API function wrappers with RequestSpec, (4) OpenAI function-calling tools.json, (5) Python code generation targeting aptx-api-core runtime, (6) track generated files with manifest, (7) preview changes before generation. Do NOT use for TypeScript code generation — use generate-artifacts or generate-models instead."
---

# Python Code Generation from OpenAPI

Generate Python (Pydantic models + async API functions + tools.json) from OpenAPI via aptx-ft CLI.

## Contents

- [Prerequisites](#prerequisites)
- [Command Overview](#command-overview)
- [Parameter Reference](#parameter-reference)
- [Discovery Phase](#discovery-phase)
- [Workflow](#workflow)
- [Manifest Tracking](#manifest-tracking)
- [Output Structure](#output-structure)
- [Naming Conventions](#naming-conventions)
- [Type Mapping](#type-mapping)
- [Runtime Dependencies](#runtime-dependencies)
- [Boundaries](#boundaries)

## Prerequisites

```bash
# CLI tool (monorepo)
pnpm add -D @aptx/frontend-tk-cli

# Python runtime dependencies (install in the Python project)
pip install aptx-api-core pydantic
```

The Python codegen plugin (`@aptx/frontend-tk-plugin-python`) must be loaded. In a monorepo where the plugin is a workspace dependency of the CLI, it is auto-discovered.

## Command Overview

| Command | Purpose | Output |
|---------|---------|--------|
| `python model` | Generate Pydantic v2 model classes | `models/*.py` |
| `python functions` | Generate spec + async function wrappers | `spec/**/*.py` + `functions/**/*.py` |
| `python tools` | Generate OpenAI function-calling JSON | `tools.json` |

> **Dependency**: `python functions` generates spec files that reference models. Run `python model` first if you need model imports.

## Parameter Reference

All paths are relative to **working directory** (project root).

### Common Options (all three commands)

| Parameter | Required | Description |
|-----------|:--------:|-------------|
| `-i, --input` | Yes | OpenAPI file path (e.g., `./openapi.json`) |
| `-o, --output` | Yes | Output directory (e.g., `./src/api`) |
| `--no-manifest` | No | Disable manifest tracking (default: false) |
| `--manifest-dir` | No | Custom manifest directory (default: `.generated`) |
| `--dry-run` | No | Preview mode without updating manifest (default: false) |

### Additional Options for `python functions`

| Parameter | Required | Description |
|-----------|:--------:|-------------|
| `--model-mode` | No | `relative` (same project) or `package` (monorepo) — **not yet wired to renderer** |
| `--model-path` | No | Path or package name for model imports — **not yet wired to renderer** |

> **Note:** These options are accepted by the CLI but the renderer currently hardcodes `from models.<name>` imports. They are reserved for future monorepo support.

### Model Source Decision

> **Status:** Not yet implemented. The renderer always uses `from models.<snake_name> import <Name>` regardless of `--model-mode` / `--model-path` settings.

```
Is the models directory inside the same Python package where functions are generated?
├── YES → --model-mode relative --model-path ./models        (planned)
└── NO  → --model-mode package --model-path my_package.models (planned)
```

## Discovery Phase — MANDATORY FIRST STEP

**Before executing any generation command, discover the actual project configuration.**

### Checklist

```bash
# 1. Locate OpenAPI spec
ls ./openapi.json ./swagger.json ./docs/openapi.yaml 2>/dev/null

# 2. Check Python project structure
ls pyproject.toml setup.py setup.cfg 2>/dev/null

# 3. Identify output directories
ls -d src/*/ 2>/dev/null

# 4. Check existing generated code
ls ./src/api/models/*.py 2>/dev/null || echo "no models yet"
ls ./src/api/spec/*.py 2>/dev/null || echo "no specs yet"
```

### Critical Rules

| Never | Always |
|-------|--------|
| Guess package name from directory | Read `pyproject.toml` to get actual package name |
| Assume model import paths | Verify the Python module path is importable |
| Skip checking existing files | Check if output directory already has content |

## Workflow

1. **Discovery** — Read project files, find OpenAPI spec, identify output paths
2. **Check output directory** — determine if regeneration is needed
3. **Confirm with user** — output dir, model-mode/model-path settings
4. **Execute** — Show command, get approval, run

### Execution Order

```bash
# Step 1: Generate models first
pnpm exec aptx-ft python model -i ./openapi.json -o ./src/api

# Step 2: Generate functions (references models)
pnpm exec aptx-ft python functions -i ./openapi.json -o ./src/api \
  --model-mode relative --model-path ./models

# Step 3: Generate tools.json (optional, for OpenAI function-calling)
pnpm exec aptx-ft python tools -i ./openapi.json -o ./src/api
```

### Monorepo Example

```bash
# Models into shared package
pnpm exec aptx-ft python model -i ./openapi.json -o ./packages/api-core-python/src/aptx_api_models

# Functions with package import
pnpm exec aptx-ft python functions -i ./openapi.json -o ./services/web/api \
  --model-mode package --model-path aptx_api_models
```

## Manifest Tracking

The CLI tracks generated files and detects changes between generations.

### Generated Manifest Files

```
<output>/
├── .generated/
│   ├── manifest.json           # Tracks all generated files
│   ├── deletion-report.json    # Machine-readable change report
│   └── deletion-report.md      # Human-readable change report with LLM suggestions
└── generated files...
```

### When to Use Manifest Options

| Scenario | Command |
|----------|---------|
| Normal generation | Omit manifest options (default) |
| CI/CD without tracking | Add `--no-manifest` |
| Preview changes before applying | Add `--dry-run` |
| Custom manifest location | Add `--manifest-dir ./meta` |

## Output Structure

```
src/api/
├── .generated/                     # Manifest tracking files
├── models/                         # From python:model
│   ├── __init__.py                 # Auto-generated barrel
│   ├── UserDto.py                  # Pydantic BaseModel
│   ├── Status.py                   # Enum class
│   └── CreateRequest.py            # BaseModel with Field aliases
├── spec/                           # From python:functions
│   ├── __init__.py
│   └── user/
│       ├── __init__.py
│       └── get_info_spec.py        # RequestSpec builder
├── functions/                      # From python:functions
│   ├── __init__.py
│   └── user/
│       ├── __init__.py
│       └── get_info.py             # async def wrapper
└── tools.json                      # From python:tools (OpenAI function-calling)
```

## Naming Conventions

### Model Naming

| OpenAPI Schema | Python Output |
|----------------|---------------|
| `UserDto` | `class UserDto(BaseModel)` — name unchanged |
| `AddAssignmentRequest` | `class AddAssignmentRequest(BaseModel)` |

### Property Naming

Properties are converted to `snake_case` with `Field(alias=...)` preserving the original name:

```python
class UserDto(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_name: str = Field(alias="userName")
    created_at: str = Field(alias="createdAt")
```

### Function Naming

Function names are derived from `operationId` through a normalization pipeline:

```
operation_name: "getMainAPIUserGetInfo"
  → strip HTTP method prefix: "MainAPIUserGetInfo"
  → strip service prefix:     "UserGetInfo"
  → strip namespace prefix:   "GetInfo"
  → snake_case:               "get_info"

Output:
  spec file:    spec/user/get_info_spec.py  → build_get_info_spec()
  function file: functions/user/get_info.py  → async def get_info()
```

Python reserved words get a trailing underscore: `class` → `class_`.

## Type Mapping

OpenAPI types are mapped to Python types as follows:

| OpenAPI / IR Type | Python Type |
|-------------------|-------------|
| `string` | `str` |
| `number` | `float` |
| `boolean` | `bool` |
| `object` | `dict[str, Any]` |
| `array<T>` | `list[T]` |
| `$ref` to schema | Schema class name directly |
| union types | `A \| B` |
| nullable | `T \| None` |
| enum values | `Literal["value"]` |

## Generated Code Examples

### Model File (`models/UserDto.py`)

```python
from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field


class UserDto(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="id")
    user_name: str = Field(alias="userName")
    status: Status | None = Field(default=None, alias="status")
```

### Spec File (`spec/user/get_info_spec.py`)

```python
from __future__ import annotations
from models.get_info_input import GetInfoInput
from aptx_api_core import RequestSpec


def build_get_info_spec(input: GetInfoInput) -> RequestSpec:
    return RequestSpec(
        method="GET",
        path="/MainAPI/User/GetInfo",
        input=input,
    )
```

### Function File (`functions/user/get_info.py`)

```python
from __future__ import annotations
from models.get_info_input import GetInfoInput
from models.user_dto import UserDto
from aptx_api_core import get_api_client
from spec.user.get_info_spec import build_get_info_spec


async def get_info(input: GetInfoInput) -> UserDto:
    return await get_api_client().execute_async(
        build_get_info_spec(input),
        response_type=UserDto,
    )
```

### Tools JSON (`tools.json`)

```json
[
  {
    "type": "function",
    "function": {
      "name": "userGetInfo",
      "description": "Get user information",
      "parameters": {
        "type": "object",
        "properties": {
          "id": { "type": "string" }
        }
      }
    }
  }
]
```

## Runtime Dependencies

Generated Python code requires at runtime:

```
# pyproject.toml
[project]
dependencies = [
    "aptx-api-core>=0.1.0",
    "pydantic>=2.0",
]
```

- **aptx-api-core** — async HTTP client with middleware pipeline, error handling, and `RequestSpec` / `ApiClient` / `Middleware` types
- **pydantic** v2 — data model base classes (`BaseModel`, `Enum`) with validation

## Boundaries

This skill handles OpenAPI → Python generation only:
- Does NOT generate TypeScript code → use `generate-artifacts` or `generate-models`
- Does NOT validate OpenAPI specification correctness
- Does NOT handle authenticated URL downloads → use `download-openapi` first
- Does NOT modify the Python runtime library (`aptx-api-core`) itself
- Does NOT create or modify the plugin code (`@aptx/frontend-tk-plugin-python`)

## Related Skills

- **generate-artifacts**: TypeScript artifact generation (models + React Query / Vue Query)
- **generate-models**: TypeScript model-only generation
- **download-openapi**: Fetch OpenAPI spec from URL
- **write-plugin**: Write custom CLI plugins
