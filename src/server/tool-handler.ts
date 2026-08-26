import { DomainError, type QaService } from "@/src/domain/service";
import { isToolName, type ToolName } from "@/src/webmcp/tool-catalog";
import { z } from "zod";
import { getQaService } from "./services";

const empty = z.object({}).strict();
const version = z.object({ version: z.string().trim().min(1).max(30) }).strict();
const requirementFilter = z.object({ requirement_id: z.string().regex(/^REQ-\d{3}$/).optional() }).strict();
const createTest = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(3).max(1000),
  requirement_id: z.string().regex(/^REQ-\d{3}$/),
  expected_behavior: z.string().trim().min(3).max(1000),
  created_by: z.enum(["AI Agent", "Human"]).optional(),
}).strict();
const testId = z.object({ test_id: z.string().regex(/^TC-\d{3}$/) }).strict();
const executionId = z.object({ execution_id: z.string().regex(/^EXE-\d{3}$/) }).strict();
const createDefect = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(2000),
  severity: z.enum(["low", "medium", "high", "critical"]),
  execution_id: z.string().regex(/^EXE-\d{3}$/).optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
  created_by: z.enum(["AI Agent", "Human"]).optional(),
}).strict();
const linkDefect = z.object({
  defect_id: z.string().regex(/^DEF-\d{3}$/),
  test_id: z.string().regex(/^TC-\d{3}$/),
}).strict();

async function execute(qaService: QaService, name: ToolName, rawInput: unknown): Promise<unknown> {
  switch (name) {
    case "get_releases":
      empty.parse(rawInput);
      return qaService.getReleases();
    case "get_release_details": {
      const input = version.parse(rawInput);
      return qaService.getReleaseDetails(input.version);
    }
    case "get_requirements": {
      const input = version.parse(rawInput);
      return qaService.getRequirements(input.version);
    }
    case "get_test_cases": {
      const input = requirementFilter.parse(rawInput);
      return qaService.getTestCases(input.requirement_id);
    }
    case "get_coverage_gaps": {
      const input = version.parse(rawInput);
      return qaService.getCoverageGaps(input.version);
    }
    case "create_test_case":
      return qaService.createTestCase(createTest.parse(rawInput));
    case "run_test":
      return qaService.runTest(testId.parse(rawInput).test_id);
    case "run_release_regression":
      return qaService.runReleaseRegression(version.parse(rawInput).version);
    case "get_execution_results":
      return qaService.getExecutionResults(executionId.parse(rawInput).execution_id);
    case "inspect_failure":
      return qaService.inspectFailure(executionId.parse(rawInput).execution_id);
    case "create_defect":
      return qaService.createDefect(createDefect.parse(rawInput));
    case "link_defect_to_test": {
      const input = linkDefect.parse(rawInput);
      return qaService.linkDefectToTest(input.defect_id, input.test_id);
    }
    case "get_release_readiness":
      return qaService.getReleaseReadiness(version.parse(rawInput).version);
    case "reset_demo":
      empty.parse(rawInput);
      return qaService.resetDemo();
  }
}

export async function invokeTool(name: string, rawInput: unknown) {
  if (!isToolName(name)) {
    return {
      status: 404,
      body: {
        success: false as const,
        error: { code: "TOOL_NOT_FOUND", message: `WebMCP tool ${name} is not registered.` },
      },
    };
  }
  try {
    const qaService = await getQaService();
    const data = await execute(qaService, name, rawInput ?? {});
    const snapshot = await qaService.getDashboardSnapshot("2.4");
    return {
      status: 200,
      body: {
        success: true as const,
        data,
        meta: { tool: name, state_revision: snapshot.revision, timestamp: new Date().toISOString() },
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: 400,
        body: {
          success: false as const,
          error: {
            code: "INVALID_INPUT",
            message: `Input validation failed for ${name}.`,
            details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
          },
        },
      };
    }
    if (error instanceof DomainError) {
      return {
        status: error.status,
        body: { success: false as const, error: { code: error.code, message: error.message, details: error.details } },
      };
    }
    console.error(`Unexpected ${name} failure`, error);
    return {
      status: 500,
      body: {
        success: false as const,
        error: { code: "INTERNAL_ERROR", message: "TestPilot could not complete the tool action." },
      },
    };
  }
}
