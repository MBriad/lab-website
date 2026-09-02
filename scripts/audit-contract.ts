/**
 * Contract-fidelity audit.
 *
 * Verifies the frontend data layer against `contracts/openapi.json`
 * (the single source of truth):
 *
 *   1. Every API operation (method + path) maps to exactly one `ApiClient`
 *      method, and `ApiClient` has no extra methods.
 *   2. Every contract schema has a matching export in `src/lib/types/api.ts`
 *      with the same property names, required set and nullability.
 *   3. Enum values (`AwardCategory`, `AwardLevel`, `AwardSort`) match exactly.
 *   4. No endpoint path / `/api/v1` string appears in `frontend/src/**`
 *      outside `src/lib/api/**` (the rewrite lives in `next.config.ts`).
 *   5. No invented fields (`lab_name_en`, school/college, project featured).
 *
 * Usage: pnpm audit:contract   (exit code 1 on any drift)
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const FRONTEND_ROOT = path.resolve(__dirname, "..");
const OPENAPI_PATH = path.resolve(FRONTEND_ROOT, "../contracts/openapi.json");
const SRC_DIR = path.join(FRONTEND_ROOT, "src");
const TYPES_FILE = path.join(SRC_DIR, "lib/types/api.ts");
const CLIENT_FILE = path.join(SRC_DIR, "lib/api/client.ts");
const NEXT_CONFIG = path.join(FRONTEND_ROOT, "next.config.ts");

/* ------------------------------------------------------------------ */
/* Report helpers                                                      */
/* ------------------------------------------------------------------ */

const failures: string[] = [];
const notes: string[] = [];

function ok(message: string): void {
  console.log(`  PASS  ${message}`);
}

function fail(message: string): void {
  failures.push(message);
  console.log(`  FAIL  ${message}`);
}

function note(message: string): void {
  notes.push(message);
  console.log(`  note  ${message}`);
}

function section(title: string): void {
  console.log(`\n== ${title}`);
}

/* ------------------------------------------------------------------ */
/* OpenAPI parsing                                                     */
/* ------------------------------------------------------------------ */

interface OpenApiOperation {
  method: string;
  path: string;
  operationId: string;
}

interface PropInfo {
  optional: boolean;
  nullable: boolean;
}

interface SchemaInfo {
  name: string;
  kind: "object" | "enum";
  enumValues?: string[];
  props: Map<string, PropInfo>;
}

function parseOpenApi(): {
  operations: OpenApiOperation[];
  schemas: Map<string, SchemaInfo>;
} {
  const spec = JSON.parse(readFileSync(OPENAPI_PATH, "utf8")) as {
    paths: Record<string, Record<string, { operationId?: string }>>;
    components: { schemas: Record<string, unknown> };
  };

  const operations: OpenApiOperation[] = [];
  for (const [route, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      operations.push({
        method: method.toUpperCase(),
        path: route,
        operationId: op.operationId ?? "",
      });
    }
  }

  const schemas = new Map<string, SchemaInfo>();
  for (const [name, raw] of Object.entries(spec.components.schemas)) {
    const schema = raw as Record<string, unknown>;
    if (Array.isArray(schema.enum)) {
      schemas.set(name, {
        name,
        kind: "enum",
        enumValues: schema.enum.map(String),
        props: new Map(),
      });
      continue;
    }
    const props = new Map<string, PropInfo>();
    const required = new Set(
      Array.isArray(schema.required) ? (schema.required as string[]) : [],
    );
    const properties = (schema.properties ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    for (const [propName, prop] of Object.entries(properties)) {
      let nullable = false;
      if (Array.isArray(prop.anyOf)) {
        nullable = (prop.anyOf as Array<Record<string, unknown>>).some(
          (branch) => branch.type === "null",
        );
      } else if (Array.isArray(prop.type)) {
        nullable = (prop.type as string[]).includes("null");
      }
      props.set(propName, {
        optional: !required.has(propName),
        nullable,
      });
    }
    schemas.set(name, { name, kind: "object", props });
  }

  return { operations, schemas };
}

/* ------------------------------------------------------------------ */
/* TypeScript source parsing (types/api.ts, client.ts)                 */
/* ------------------------------------------------------------------ */

interface TsInterface {
  name: string;
  base: string | null;
  props: Map<string, PropInfo>;
}

function parseInterfaces(source: string): Map<string, TsInterface> {
  const result = new Map<string, TsInterface>();
  const blocks = source.split(/^export interface /m).slice(1);
  for (const block of blocks) {
    const headerEnd = block.indexOf("{");
    if (headerEnd === -1) continue;
    const header = block.slice(0, headerEnd).trim();
    const nameMatch = header.match(/^([A-Za-z0-9_]+)/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const baseMatch = header.match(/extends\s+([A-Za-z0-9_]+)/);
    const bodyEnd = block.indexOf("\n}", headerEnd);
    const body = block.slice(headerEnd + 1, bodyEnd === -1 ? undefined : bodyEnd);
    const props = new Map<string, PropInfo>();
    for (const line of body.split("\n")) {
      const m = line.match(/^\s{2}([A-Za-z0-9_]+)(\?)?:\s*([^;]+);\s*$/);
      if (!m) continue;
      const [, propName, opt, type] = m;
      const nullable = /\|\s*null\b/.test(type) || /\bunknown\b/.test(type);
      props.set(propName, { optional: Boolean(opt), nullable });
    }
    result.set(name, { name, base: baseMatch?.[1] ?? null, props });
  }
  return result;
}

function flatten(
  interfaces: Map<string, TsInterface>,
  name: string,
): Map<string, PropInfo> {
  const found = interfaces.get(name);
  if (!found) return new Map();
  const merged = found.base ? flatten(interfaces, found.base) : new Map();
  for (const [key, value] of found.props) merged.set(key, value);
  return merged;
}

function parseConstStringArray(source: string, constName: string): string[] | null {
  const re = new RegExp(
    `export const ${constName} = \\[([\\s\\S]*?)\\] as const`,
  );
  const m = source.match(re);
  if (!m) return null;
  return [...m[1].matchAll(/"([^"]+)"/g)].map((hit) => hit[1]);
}

function parseApiClientMethods(source: string): string[] {
  const start = source.indexOf("export interface ApiClient");
  if (start === -1) return [];
  const bodyStart = source.indexOf("{", start);
  const bodyEnd = source.indexOf("\n}", bodyStart);
  const body = source.slice(bodyStart + 1, bodyEnd);
  const methods: string[] = [];
  for (const line of body.split("\n")) {
    const m = line.match(/^\s{2}([A-Za-z0-9_]+)\(/);
    if (m) methods.push(m[1]);
  }
  return methods;
}

/* ------------------------------------------------------------------ */
/* Filesystem helpers                                                  */
/* ------------------------------------------------------------------ */

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

/* ------------------------------------------------------------------ */
/* 1. Operation coverage                                               */
/* ------------------------------------------------------------------ */

/** Explicit mapping: every contract operation -> one ApiClient method. */
const OPERATION_TO_METHOD: Record<string, string> = {
  "POST /api/v1/admin/auth/login": "login",
  "POST /api/v1/admin/auth/logout": "logout",
  "GET /api/v1/admin/auth/me": "getMe",
  "GET /api/v1/admin/awards": "listAdminAwards",
  "POST /api/v1/admin/awards": "createAward",
  "DELETE /api/v1/admin/awards/{award_id}": "deleteAward",
  "GET /api/v1/admin/awards/{award_id}": "getAdminAward",
  "PATCH /api/v1/admin/awards/{award_id}": "updateAward",
  "GET /api/v1/admin/media": "listAdminMedia",
  "POST /api/v1/admin/media": "uploadMedia",
  "DELETE /api/v1/admin/media/{media_id}": "deleteMedia",
  "GET /api/v1/admin/news": "listAdminNews",
  "POST /api/v1/admin/news": "createNews",
  "DELETE /api/v1/admin/news/{news_id}": "deleteNews",
  "GET /api/v1/admin/news/{news_id}": "getAdminNews",
  "PATCH /api/v1/admin/news/{news_id}": "updateNews",
  "POST /api/v1/admin/news/{news_id}/publish": "publishNews",
  "GET /api/v1/admin/projects": "listAdminProjects",
  "POST /api/v1/admin/projects": "createProject",
  "DELETE /api/v1/admin/projects/{project_id}": "deleteProject",
  "GET /api/v1/admin/projects/{project_id}": "getAdminProject",
  "PATCH /api/v1/admin/projects/{project_id}": "updateProject",
  "POST /api/v1/admin/projects/{project_id}/publish": "publishProject",
  "GET /api/v1/admin/research-areas": "listAdminResearchAreas",
  "POST /api/v1/admin/research-areas": "createResearchArea",
  "DELETE /api/v1/admin/research-areas/{area_id}": "deleteResearchArea",
  "GET /api/v1/admin/research-areas/{area_id}": "getAdminResearchArea",
  "PATCH /api/v1/admin/research-areas/{area_id}": "updateResearchArea",
  "GET /api/v1/admin/site-settings": "getAdminSiteSettings",
  "PATCH /api/v1/admin/site-settings": "updateSiteSettings",
  "PUT /api/v1/admin/site-settings": "putSiteSettings",
  "GET /api/v1/awards": "listAwards",
  "GET /api/v1/awards/{award_id}": "getAward",
  "GET /api/v1/news": "listNews",
  "GET /api/v1/news/{slug}": "getNewsBySlug",
  "GET /api/v1/projects": "listProjects",
  "GET /api/v1/projects/{slug}": "getProjectBySlug",
  "GET /api/v1/research-areas": "listResearchAreas",
  "GET /api/v1/site-settings": "getSiteSettings",
};

/** Operations intentionally not covered by the frontend API client. */
const EXCLUDED_OPERATIONS: Record<string, string> = {
  "GET /healthz": "infrastructure health probe (not a content endpoint)",
  "GET /readyz": "infrastructure readiness probe (not a content endpoint)",
};

function auditOperations(
  operations: OpenApiOperation[],
  clientMethods: string[],
): void {
  section("1. Operation coverage (openapi.json -> ApiClient)");

  const methodSet = new Set(clientMethods);
  let missingMapping = 0;
  for (const op of operations) {
    const key = `${op.method} ${op.path}`;
    if (EXCLUDED_OPERATIONS[key]) {
      note(`excluded by design: ${key} — ${EXCLUDED_OPERATIONS[key]}`);
      continue;
    }
    const method = OPERATION_TO_METHOD[key];
    if (!method) {
      fail(`operation has no mapping entry: ${key}`);
      missingMapping += 1;
      continue;
    }
    if (!methodSet.has(method)) {
      fail(`mapped method missing from ApiClient: ${key} -> ${method}`);
      missingMapping += 1;
      continue;
    }
    console.log(`  ok    ${key.padEnd(46)} -> ApiClient.${method}`);
  }
  if (missingMapping === 0) {
    ok(
      `all ${operations.length - Object.keys(EXCLUDED_OPERATIONS).length} API operations map to an ApiClient method`,
    );
  }

  // Bidirectional: ApiClient must not declare methods without an operation.
  const mappedMethods = new Set(Object.values(OPERATION_TO_METHOD));
  const extras = clientMethods.filter((m) => !mappedMethods.has(m));
  if (extras.length > 0) {
    fail(`ApiClient methods without a contract operation: ${extras.join(", ")}`);
  } else {
    ok("ApiClient declares no methods beyond the contract");
  }
}

/* ------------------------------------------------------------------ */
/* 2. Schema fidelity                                                  */
/* ------------------------------------------------------------------ */

/** Contract schema name -> TS type name (when they differ). */
const SCHEMA_TO_TS: Record<string, string> = {
  ValidationError: "ValidationErrorDetail",
  // Multipart upload body: no TS type; the client builds FormData with the
  // contract field name `upload` (checked separately).
  Body_upload_media_api_v1_admin_media_post: "",
};

/** All PageResponse_* variants share the generic TS PageResponse<T>. */
const PAGE_RESPONSE_KEYS = ["items", "page", "page_size", "total", "pages"];

function auditSchemas(
  schemas: Map<string, SchemaInfo>,
  tsTypes: Map<string, TsInterface>,
  typesSource: string,
): void {
  section("2. Schema fidelity (openapi.json -> src/lib/types/api.ts)");

  for (const [name, schema] of [...schemas.entries()].sort()) {
    // Enums are audited in section 3.
    if (schema.kind === "enum") continue;

    // PageResponse_X_ variants: verify the envelope once against PageResponse.
    if (name.startsWith("PageResponse_")) {
      const envelope = tsTypes.get("PageResponse");
      if (!envelope) {
        fail(`${name}: TS PageResponse<T> is missing`);
        continue;
      }
      const contractKeys = [...schema.props.keys()].sort().join(",");
      const tsKeys = [...envelope.props.keys()].sort().join(",");
      const allRequired = [...envelope.props.values()].every(
        (p) => !p.optional,
      );
      if (contractKeys === PAGE_RESPONSE_KEYS.sort().join(",") &&
          tsKeys === PAGE_RESPONSE_KEYS.sort().join(",") &&
          allRequired) {
        ok(`${name} <-> PageResponse<T> (items/page/page_size/total/pages, all required)`);
      } else {
        fail(`${name} <-> PageResponse<T> mismatch (contract: ${contractKeys}; ts: ${tsKeys})`);
      }
      continue;
    }

    const tsName = SCHEMA_TO_TS[name] ?? name;
    if (tsName === "") {
      // Multipart body: assert the real client appends the contract field.
      const clientSource = readFileSync(CLIENT_FILE, "utf8");
      const requiredField = [...schema.props.keys()][0] ?? "upload";
      if (clientSource.includes(`formData.append("${requiredField}"`)) {
        ok(`${name}: multipart field "${requiredField}" used by uploadMedia`);
      } else {
        fail(`${name}: uploadMedia does not append field "${requiredField}"`);
      }
      continue;
    }

    const tsType = tsTypes.get(tsName);
    if (!tsType) {
      fail(`schema ${name}: TS type ${tsName} is missing from types/api.ts`);
      continue;
    }
    const tsProps = flatten(tsTypes, tsName);

    const contractKeys = [...schema.props.keys()].sort();
    const tsKeys = [...tsProps.keys()].sort();
    if (contractKeys.join("|") !== tsKeys.join("|")) {
      const missing = contractKeys.filter((k) => !tsProps.has(k));
      const invented = tsKeys.filter((k) => !schema.props.has(k));
      fail(
        `${name} <-> ${tsName}: property set differs` +
          (missing.length ? `; missing in TS: ${missing.join(", ")}` : "") +
          (invented.length ? `; invented in TS: ${invented.join(", ")}` : ""),
      );
      continue;
    }

    const diffs: string[] = [];
    for (const key of contractKeys) {
      const contractProp = schema.props.get(key);
      const tsProp = tsProps.get(key);
      if (!contractProp || !tsProp) continue;
      if (contractProp.optional !== tsProp.optional) {
        diffs.push(
          `${key}: contract ${contractProp.optional ? "optional" : "required"} vs TS ${tsProp.optional ? "optional" : "required"}`,
        );
      }
      if (contractProp.nullable !== tsProp.nullable) {
        diffs.push(
          `${key}: contract nullable=${contractProp.nullable} vs TS nullable=${tsProp.nullable}`,
        );
      }
    }
    if (diffs.length > 0) {
      fail(`${name} <-> ${tsName}: ${diffs.join("; ")}`);
    } else {
      ok(`${name} <-> ${tsName} (${contractKeys.length} fields, required/optional/nullable match)`);
    }
  }

  // The TS file must not declare contract interfaces the contract lacks.
  const contractTsNames = new Set(
    [...schemas.entries()]
      .filter(([, s]) => s.kind === "object")
      .map(([n]) => SCHEMA_TO_TS[n] ?? n)
      .filter(Boolean),
  );
  // Non-schema TS types with a documented contract role:
  // - ErrorResponse/PageResponse: generic envelopes over declared schemas.
  // - HTTPValidationError/ValidationErrorDetail: model FastAPI's standard
  //   422 envelope (a runtime behavior of the backend; the contract's
  //   ErrorBody normalization in http.ts consumes it). Not invented fields.
  // - PageParams/ListAwardsParams: query-param shapes, audited against the
  //   operations' parameters in auditParams().
  const EXTRA_ALLOWED = new Set([
    "ErrorResponse",
    "PageResponse",
    "HTTPValidationError",
    "ValidationErrorDetail",
    "PageParams",
    "ListAwardsParams",
  ]);
  for (const tsName of tsTypes.keys()) {
    if (contractTsNames.has(tsName) || EXTRA_ALLOWED.has(tsName)) continue;
    fail(`TS interface ${tsName} has no contract schema counterpart`);
  }
  ok(
    "non-schema TS types are limited to envelopes + 422 normalization + list params",
  );
  void typesSource;
}

/* ------------------------------------------------------------------ */
/* 2b. List query params (PageParams / ListAwardsParams)               */
/* ------------------------------------------------------------------ */

function auditParams(operations: OpenApiOperation[]): void {
  section("2b. List query params (openapi.json parameters -> PageParams/ListAwardsParams)");
  const spec = JSON.parse(readFileSync(OPENAPI_PATH, "utf8")) as {
    paths: Record<
      string,
      Record<
        string,
        {
          parameters?: Array<{ name: string; in: string; required?: boolean }>;
          responses?: Record<string, { content?: Record<string, { schema?: { $ref?: string } }> }>;
        }
      >
    >;
  };

  // A list operation is a GET whose 200 response is a PageResponse_*.
  const listOps = operations.filter((op) => {
    if (op.method !== "GET" || op.path.includes("{")) return false;
    const ref =
      spec.paths[op.path]?.get?.responses?.["200"]?.content?.["application/json"]
        ?.schema?.$ref ?? "";
    return ref.includes("PageResponse_");
  });
  const missingPagination: string[] = [];
  for (const op of listOps) {
    const params =
      spec.paths[op.path]?.[op.method.toLowerCase()]?.parameters?.filter(
        (p) => p.in === "query",
      ) ?? [];
    const names = params.map((p) => p.name);
    if (!names.includes("page") || !names.includes("page_size")) {
      missingPagination.push(`${op.method} ${op.path}`);
    }
  }
  if (missingPagination.length > 0) {
    fail(`list operations without page/page_size params: ${missingPagination.join(", ")}`);
  } else {
    ok(`all ${listOps.length} list operations accept optional page/page_size (PageParams)`);
  }

  const awardsParams =
    spec.paths["/api/v1/awards"]?.get?.parameters?.filter((p) => p.in === "query") ?? [];
  const awardsNames = awardsParams.map((p) => p.name).sort();
  if (awardsNames.join("|") === "featured|page|page_size|sort") {
    const featured = awardsParams.find((p) => p.name === "featured");
    if (featured && !featured.required) {
      ok("GET /awards params == featured (optional) + sort + page + page_size (ListAwardsParams)");
    } else {
      fail("GET /awards `featured` param is not optional");
    }
  } else {
    fail(`GET /awards query params drifted: [${awardsNames.join(", ")}]`);
  }
}

/* ------------------------------------------------------------------ */
/* 3. Enums                                                            */
/* ------------------------------------------------------------------ */

function auditEnums(
  schemas: Map<string, SchemaInfo>,
  typesSource: string,
): void {
  section("3. Enum values");
  const checks: Array<[string, string]> = [
    ["AwardCategory", "AWARD_CATEGORIES"],
    ["AwardLevel", "AWARD_LEVELS"],
    ["AwardSort", "AWARD_SORTS"],
  ];
  for (const [schemaName, constName] of checks) {
    const schema = schemas.get(schemaName);
    const tsValues = parseConstStringArray(typesSource, constName);
    if (!schema || schema.kind !== "enum" || !schema.enumValues) {
      fail(`contract enum ${schemaName} not found`);
      continue;
    }
    if (!tsValues) {
      fail(`TS const ${constName} not found in types/api.ts`);
      continue;
    }
    const a = [...schema.enumValues].sort().join("|");
    const b = [...tsValues].sort().join("|");
    if (a === b && schema.enumValues.length === tsValues.length) {
      ok(`${schemaName} == ${constName}: [${tsValues.join(", ")}]`);
    } else {
      fail(`${schemaName} != ${constName}: contract [${a}] vs ts [${b}]`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 4. Endpoint containment                                             */
/* ------------------------------------------------------------------ */

function auditEndpointContainment(): void {
  section("4. Endpoint string containment");
  const offenders: string[] = [];
  for (const file of walk(SRC_DIR)) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const rel = path.relative(SRC_DIR, file).split(path.sep).join("/");
    if (rel.startsWith("lib/api/")) continue; // the data layer is allowed
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (line.includes("/api/v1")) {
        offenders.push(`src/${rel}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  if (offenders.length > 0) {
    fail(`/api/v1 referenced outside src/lib/api/**:\n    ${offenders.join("\n    ")}`);
  } else {
    ok('no "/api/v1" string in src/** outside src/lib/api/**');
  }

  const nextConfig = readFileSync(NEXT_CONFIG, "utf8");
  if (nextConfig.includes('"/api/v1/:path*"')) {
    ok("next.config.ts rewrite for /api/v1/:path* present");
  } else {
    fail("next.config.ts is missing the /api/v1 rewrite");
  }

  // No hard-coded backend origin outside the data layer + next.config.
  const originOffenders: string[] = [];
  for (const file of walk(SRC_DIR)) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const rel = path.relative(SRC_DIR, file).split(path.sep).join("/");
    if (rel.startsWith("lib/api/")) continue;
    const content = readFileSync(file, "utf8");
    if (/https?:\/\/127\.0\.0\.1:8000|https?:\/\/localhost:8000/.test(content)) {
      originOffenders.push(`src/${rel}`);
    }
  }
  if (originOffenders.length > 0) {
    fail(`hard-coded backend origin outside lib/api: ${originOffenders.join(", ")}`);
  } else {
    ok("no hard-coded backend origin outside src/lib/api/**");
  }
}

/* ------------------------------------------------------------------ */
/* 5. Invented fields                                                  */
/* ------------------------------------------------------------------ */

function auditInventedFields(tsTypes: Map<string, TsInterface>): void {
  section("5. Invented-field scan");

  const allSrc = walk(SRC_DIR).filter((f) => /\.(ts|tsx)$/.test(f));

  // 5a. lab_name_en must not exist anywhere.
  const labNameEn = allSrc.filter((f) =>
    readFileSync(f, "utf8").includes("lab_name_en"),
  );
  if (labNameEn.length > 0) {
    fail(`"lab_name_en" appears in: ${labNameEn.join(", ")}`);
  } else {
    ok('no "lab_name_en" anywhere in src/** (contract has a single lab_name)');
  }

  // 5b. school/college only allowed inside comments (contract has none).
  const schoolHits: string[] = [];
  for (const file of allSrc) {
    const rel = path.relative(SRC_DIR, file).split(path.sep).join("/");
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (!/\b(school|college)\b/i.test(line)) return;
      const trimmed = line.trim();
      const isComment =
        trimmed.startsWith("//") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("/*");
      if (!isComment) schoolHits.push(`src/${rel}:${i + 1}: ${trimmed}`);
    });
  }
  if (schoolHits.length > 0) {
    fail(`school/college used as code (contract has no such fields):\n    ${schoolHits.join("\n    ")}`);
  } else {
    ok("no school/college identifiers in code (only allowed in comments)");
  }

  // 5c. Projects have no featured flag in the contract.
  const projectTypes = ["ProjectPublic", "ProjectAdmin", "ProjectCreate", "ProjectUpdate"];
  const featuredLeaks: string[] = [];
  for (const t of projectTypes) {
    const props = flatten(tsTypes, t);
    if (props.has("is_featured")) featuredLeaks.push(`${t}.is_featured`);
  }
  const projectUiFiles = [
    "app/(admin)/admin/projects/project-form.tsx",
    "app/(admin)/admin/projects/project-list.tsx",
    "components/projects/project-card.tsx",
    "components/home/featured-projects.tsx",
  ];
  for (const rel of projectUiFiles) {
    const file = path.join(SRC_DIR, rel);
    if (readFileSync(file, "utf8").includes("is_featured")) {
      featuredLeaks.push(rel);
    }
  }
  if (featuredLeaks.length > 0) {
    fail(`project is_featured invented: ${featuredLeaks.join(", ")}`);
  } else {
    ok("no project is_featured in types or project UI (home uses first N of the public list)");
  }

  // 5d. News has no featured flag either (home uses latest page).
  const newsFeatured = ["NewsPublic", "NewsAdmin", "NewsCreate", "NewsUpdate"].filter(
    (t) => flatten(tsTypes, t).has("is_featured"),
  );
  if (newsFeatured.length > 0) {
    fail(`news is_featured invented: ${newsFeatured.join(", ")}`);
  } else {
    ok("no news is_featured in types");
  }
}

/* ------------------------------------------------------------------ */

function main(): void {
  console.log("Contract-fidelity audit");
  console.log(`  contract: ${OPENAPI_PATH}`);
  console.log(`  frontend: ${FRONTEND_ROOT}`);

  const { operations, schemas } = parseOpenApi();
  const typesSource = readFileSync(TYPES_FILE, "utf8");
  const tsTypes = parseInterfaces(typesSource);
  const clientMethods = parseApiClientMethods(readFileSync(CLIENT_FILE, "utf8"));

  auditOperations(operations, clientMethods);
  auditSchemas(schemas, tsTypes, typesSource);
  auditParams(operations);
  auditEnums(schemas, typesSource);
  auditEndpointContainment();
  auditInventedFields(tsTypes);

  console.log("\n========================================");
  if (failures.length === 0) {
    console.log(`RESULT: PASS — no contract drift detected (${notes.length} notes).`);
    process.exit(0);
  }
  console.log(`RESULT: FAIL — ${failures.length} issue(s):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}

main();
