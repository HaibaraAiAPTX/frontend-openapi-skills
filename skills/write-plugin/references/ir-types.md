# IR (Intermediate Representation) Types

`ctx.getIr(inputPath)` returns `GeneratorInput`. Load this file when working with endpoint data or generating code from IR.

## Table of Contents

- [GeneratorInput](#generatorinput)
- [ProjectContext](#projectcontext)
- [EndpointItem](#endpointitem)
- [ModelImportConfig](#modelimportconfig)
- [ClientImportConfig](#clientimportconfig)

## GeneratorInput

```typescript
interface GeneratorInput {
  project: ProjectContext;
  endpoints: EndpointItem[];
  model_import: ModelImportConfig | null;
  client_import: ClientImportConfig | null;
  output_root: string | null;
}
```

## ProjectContext

```typescript
interface ProjectContext {
  package_name: string;
  api_base_path?: string;
  terminals: string[];
  retry_ownership?: string;
}
```

## EndpointItem

```typescript
interface EndpointItem {
  namespace: string[];
  operation_name: string;
  export_name: string;
  builder_name: string;
  summary?: string;
  method: string;
  path: string;
  input_type_name: string;
  output_type_name: string;
  request_body_field?: string;
  query_fields: string[];
  path_fields: string[];
  has_request_options: boolean;
  deprecated: boolean;
  meta: Record<string, string>;
}
```

## ModelImportConfig

```typescript
interface ModelImportConfig {
  import_type: string;
  package_path?: string;
  relative_path?: string;
  original_path?: string;
}
```

## ClientImportConfig

```typescript
interface ClientImportConfig {
  mode: string;
  client_path?: string;
  client_package?: string;
  import_name?: string;
}
```
