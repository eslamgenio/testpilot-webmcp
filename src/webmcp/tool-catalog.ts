export type JsonSchema = {
  type: "object";
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
  additionalProperties: false;
};

export interface WebMcpToolDefinition {
  name: ToolName;
  description: string;
  inputSchema: JsonSchema;
  mutatesState: boolean;
}

const objectSchema = (
  properties: JsonSchema["properties"] = {},
  required: string[] = [],
): JsonSchema => ({ type: "object", properties, required, additionalProperties: false });

export const toolCatalog = [
  {
    name: "get_releases",
    description: "List QA releases available in TestPilot, including version, name, lifecycle status, and creation time.",
    inputSchema: objectSchema(),
    mutatesState: false,
  },
  {
    name: "get_release_details",
    description: "Get release metadata and its current computed readiness assessment for an exact version.",
    inputSchema: objectSchema(
      { version: { type: "string", description: "Exact release version, for example 2.4.", minLength: 1 } },
      ["version"],
    ),
    mutatesState: false,
  },
  {
    name: "get_requirements",
    description: "List all requirements for a release with priority, coverage status, and linked test case IDs.",
    inputSchema: objectSchema(
      { version: { type: "string", description: "Exact release version, for example 2.4.", minLength: 1 } },
      ["version"],
    ),
    mutatesState: false,
  },
  {
    name: "get_test_cases",
    description: "List test cases, optionally filtered to one requirement, including creator and latest result.",
    inputSchema: objectSchema({
      requirement_id: { type: "string", description: "Optional requirement ID such as REQ-003.", pattern: "^REQ-[0-9]{3}$" },
    }),
    mutatesState: false,
  },
  {
    name: "get_coverage_gaps",
    description: "Find release requirements that have no linked test cases and return targeted test recommendations.",
    inputSchema: objectSchema(
      { version: { type: "string", description: "Exact release version to analyze.", minLength: 1 } },
      ["version"],
    ),
    mutatesState: false,
  },
  {
    name: "create_test_case",
    description: "Create a requirement-linked test case. Use this to close a discovered coverage gap; agent-created tests are visibly attributed in the UI.",
    inputSchema: objectSchema(
      {
        title: { type: "string", description: "Concise test title.", minLength: 3, maxLength: 140 },
        description: { type: "string", description: "Scenario and setup details.", minLength: 3, maxLength: 1000 },
        requirement_id: { type: "string", description: "Requirement to cover, such as REQ-003.", pattern: "^REQ-[0-9]{3}$" },
        expected_behavior: { type: "string", description: "Observable assertions that define success.", minLength: 3, maxLength: 1000 },
        created_by: { type: "string", enum: ["AI Agent", "Human"], default: "AI Agent", description: "Creator attribution." },
      },
      ["title", "description", "requirement_id", "expected_behavior"],
    ),
    mutatesState: true,
  },
  {
    name: "run_test",
    description: "Execute one deterministic QA test and persist its result, duration, failure details, and structured evidence.",
    inputSchema: objectSchema(
      { test_id: { type: "string", description: "Test case ID such as TC-004.", pattern: "^TC-[0-9]{3}$" } },
      ["test_id"],
    ),
    mutatesState: true,
  },
  {
    name: "run_release_regression",
    description: "Execute every current test case linked to a release and return a pass/fail summary with execution IDs.",
    inputSchema: objectSchema(
      { version: { type: "string", description: "Exact release version to test.", minLength: 1 } },
      ["version"],
    ),
    mutatesState: true,
  },
  {
    name: "get_execution_results",
    description: "Retrieve one persisted test execution with result, timing, failure details, evidence, and test context.",
    inputSchema: objectSchema(
      { execution_id: { type: "string", description: "Execution ID such as EXE-004.", pattern: "^EXE-[0-9]{3}$" } },
      ["execution_id"],
    ),
    mutatesState: false,
  },
  {
    name: "inspect_failure",
    description: "Analyze a failed execution and return its root cause, impact, recommendation, and supporting evidence.",
    inputSchema: objectSchema(
      { execution_id: { type: "string", description: "Failed execution ID to diagnose.", pattern: "^EXE-[0-9]{3}$" } },
      ["execution_id"],
    ),
    mutatesState: false,
  },
  {
    name: "create_defect",
    description: "Create a traceable defect with severity and optional execution evidence. Use critical severity for release-blocking safety failures.",
    inputSchema: objectSchema(
      {
        title: { type: "string", description: "Concise defect title.", minLength: 3, maxLength: 160 },
        description: { type: "string", description: "Observed behavior, impact, and relevant context.", minLength: 3, maxLength: 2000 },
        severity: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Defect severity." },
        execution_id: { type: "string", description: "Optional failed execution providing evidence.", pattern: "^EXE-[0-9]{3}$" },
        evidence: { type: "object", description: "Optional structured evidence when no execution is supplied.", additionalProperties: true },
        created_by: { type: "string", enum: ["AI Agent", "Human"], default: "AI Agent", description: "Creator attribution." },
      },
      ["title", "description", "severity"],
    ),
    mutatesState: true,
  },
  {
    name: "link_defect_to_test",
    description: "Link an existing defect to the test that exposed it, completing requirement-to-test-to-defect traceability.",
    inputSchema: objectSchema(
      {
        defect_id: { type: "string", description: "Defect ID such as DEF-001.", pattern: "^DEF-[0-9]{3}$" },
        test_id: { type: "string", description: "Test case ID such as TC-004.", pattern: "^TC-[0-9]{3}$" },
      },
      ["defect_id", "test_id"],
    ),
    mutatesState: true,
  },
  {
    name: "get_release_readiness",
    description: "Compute the authoritative READY, AT RISK, or NOT READY recommendation from live coverage, latest results, and open defects.",
    inputSchema: objectSchema(
      { version: { type: "string", description: "Exact release version to assess.", minLength: 1 } },
      ["version"],
    ),
    mutatesState: false,
  },
  {
    name: "reset_demo",
    description: "Restore TestPilot to its deterministic initial competition-demo state for version 2.4.",
    inputSchema: objectSchema(),
    mutatesState: true,
  },
] as const satisfies readonly {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  mutatesState: boolean;
}[];

export type ToolName = (typeof toolCatalog)[number]["name"];

export function isToolName(value: string): value is ToolName {
  return toolCatalog.some((tool) => tool.name === value);
}
