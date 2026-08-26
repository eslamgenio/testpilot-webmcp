import type { StateRepository } from "./repository";
import type {
  ActivityEvent,
  AppState,
  Creator,
  DashboardSnapshot,
  Defect,
  ReleaseAssessment,
  Severity,
  SimulationKey,
  TestCase,
  TestExecution,
} from "./types";

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

const now = () => new Date().toISOString();
const numericId = (prefix: string, items: Array<{ id: string }>) => {
  const max = items.reduce((current, item) => {
    const value = Number.parseInt(item.id.replace(`${prefix}-`, ""), 10);
    return Number.isFinite(value) ? Math.max(current, value) : current;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
};

function latestExecution(state: AppState, testCaseId: string): TestExecution | undefined {
  return [...state.executions].reverse().find((execution) => execution.test_case_id === testCaseId);
}

function addActivity(
  state: AppState,
  event: Omit<ActivityEvent, "id" | "created_at">,
): void {
  state.activity.unshift({
    ...event,
    id: `ACT-${String(state.activity.length + 1).padStart(3, "0")}`,
    created_at: now(),
  });
}

function simulationFor(test: TestCase): Omit<TestExecution, "id" | "test_case_id" | "executed_at"> {
  const simulations: Record<SimulationKey, Omit<TestExecution, "id" | "test_case_id" | "executed_at">> = {
    normal_purchase: {
      result: "PASS",
      duration_ms: 184,
      failure_details: null,
      evidence: { initial_inventory: 5, requested_quantity: 1, final_inventory: 4, checkout_result: "success" },
    },
    exact_inventory: {
      result: "PASS",
      duration_ms: 212,
      failure_details: null,
      evidence: { initial_inventory: 3, requested_quantity: 3, final_inventory: 0, checkout_result: "success" },
    },
    over_purchase: {
      result: "PASS",
      duration_ms: 156,
      failure_details: null,
      evidence: { initial_inventory: 2, requested_quantity: 3, final_inventory: 2, checkout_result: "rejected" },
    },
    concurrent_last_item: {
      result: "FAIL",
      duration_ms: 428,
      failure_details: "Race condition detected: both checkout requests succeeded and inventory became negative.",
      evidence: {
        initial_inventory: 1,
        customer_a_result: "success",
        customer_b_result: "success",
        final_inventory: -1,
        expected_inventory_min: 0,
        error: "Race condition detected",
      },
    },
  };
  return structuredClone(simulations[test.simulation_key]);
}

export class QaService {
  constructor(private readonly repository: StateRepository) {}

  async getReleases() {
    return (await this.repository.read()).releases;
  }

  async getReleaseDetails(version: string) {
    const state = await this.repository.read();
    const release = this.requireRelease(state, version);
    const assessment = this.assess(state, version);
    const requirements = state.requirements.filter((requirement) => requirement.release_version === version);
    return {
      ...release,
      requirement_count: requirements.length,
      test_case_count: state.test_cases.filter((test) => requirements.some((requirement) => requirement.id === test.requirement_id)).length,
      assessment,
    };
  }

  async getRequirements(version: string) {
    const state = await this.repository.read();
    this.requireRelease(state, version);
    return state.requirements
      .filter((requirement) => requirement.release_version === version)
      .map((requirement) => {
        const linked = state.test_cases.filter((test) => test.requirement_id === requirement.id).map((test) => test.id);
        return {
          ...requirement,
          coverage_status: linked.length > 0 ? ("COVERED" as const) : ("MISSING COVERAGE" as const),
          linked_test_cases: linked,
        };
      });
  }

  async getTestCases(requirementId?: string) {
    const state = await this.repository.read();
    if (requirementId && !state.requirements.some((requirement) => requirement.id === requirementId)) {
      throw new DomainError("REQUIREMENT_NOT_FOUND", `Requirement ${requirementId} was not found.`, 404);
    }
    return state.test_cases
      .filter((test) => !requirementId || test.requirement_id === requirementId)
      .map((test) => {
        const latest = latestExecution(state, test.id);
        return {
          ...test,
          last_execution_result: latest?.result ?? "NOT RUN",
          last_execution_id: latest?.id ?? null,
        };
      });
  }

  async getCoverageGaps(version: string) {
    const requirements = await this.getRequirements(version);
    return requirements
      .filter((requirement) => requirement.coverage_status === "MISSING COVERAGE")
      .map((requirement) => ({
        requirement_id: requirement.id,
        title: requirement.title,
        description: requirement.description,
        priority: requirement.priority,
        risk: requirement.priority === "CRITICAL" ? "Release-blocking behavior is unverified." : "Behavior is unverified.",
        recommended_test: requirement.id === "REQ-003"
          ? "Two customers simultaneously purchase the last remaining item; assert only one succeeds and inventory never becomes negative."
          : "Add a test covering the requirement's primary acceptance criteria.",
      }));
  }

  async createTestCase(input: {
    title: string;
    description: string;
    requirement_id: string;
    expected_behavior: string;
    created_by?: Creator;
  }) {
    return this.repository.update((state) => {
      const requirement = state.requirements.find((item) => item.id === input.requirement_id);
      if (!requirement) {
        throw new DomainError("REQUIREMENT_NOT_FOUND", `Requirement ${input.requirement_id} was not found.`, 404);
      }
      const existing = state.test_cases.find(
        (test) => test.requirement_id === input.requirement_id && test.title.toLowerCase() === input.title.toLowerCase(),
      );
      if (existing) {
        throw new DomainError("DUPLICATE_TEST_CASE", `A test named \"${input.title}\" already covers ${input.requirement_id}.`, 409, { test_id: existing.id });
      }
      const id = numericId("TC", state.test_cases);
      const testCase: TestCase = {
        id,
        title: input.title,
        description: input.description,
        requirement_id: input.requirement_id,
        expected_behavior: input.expected_behavior,
        status: "ACTIVE",
        created_by: input.created_by ?? "AI Agent",
        created_at: now(),
        simulation_key: requirement.id === "REQ-003" ? "concurrent_last_item" : "normal_purchase",
      };
      state.test_cases.push(testCase);
      addActivity(state, {
        kind: "TEST_CREATED",
        title: `${id} created`,
        detail: `${testCase.created_by} added coverage for ${requirement.id}.`,
        actor: testCase.created_by,
      });
      return testCase;
    });
  }

  async runTest(testId: string) {
    return this.repository.update((state) => this.runTestInState(state, testId));
  }

  async runReleaseRegression(version: string) {
    return this.repository.update((state) => {
      this.requireRelease(state, version);
      const requirementIds = new Set(
        state.requirements.filter((requirement) => requirement.release_version === version).map((requirement) => requirement.id),
      );
      const tests = state.test_cases.filter((test) => requirementIds.has(test.requirement_id));
      const executions = tests.map((test) => this.runTestInState(state, test.id));
      return {
        version,
        result: executions.some((execution) => execution.result === "FAIL") ? "FAIL" : "PASS",
        execution_ids: executions.map((execution) => execution.id),
        passed: executions.filter((execution) => execution.result === "PASS").length,
        failed: executions.filter((execution) => execution.result === "FAIL").length,
      };
    });
  }

  async getExecutionResults(executionId: string) {
    const state = await this.repository.read();
    const execution = state.executions.find((item) => item.id === executionId);
    if (!execution) {
      throw new DomainError("EXECUTION_NOT_FOUND", `Execution ${executionId} was not found.`, 404);
    }
    const test = state.test_cases.find((item) => item.id === execution.test_case_id);
    return { ...execution, test_case: test ? { id: test.id, title: test.title, requirement_id: test.requirement_id } : null };
  }

  async inspectFailure(executionId: string) {
    const result = await this.getExecutionResults(executionId);
    if (result.result !== "FAIL") {
      throw new DomainError("EXECUTION_DID_NOT_FAIL", `Execution ${executionId} passed and has no failure to inspect.`, 409);
    }
    return {
      execution_id: executionId,
      test_id: result.test_case_id,
      classification: "APPLICATION_RACE_CONDITION",
      root_cause: "Concurrent inventory update is not atomic.",
      explanation: "Two checkout requests read the same inventory value before either update is committed. Both requests succeed, causing inventory to become negative.",
      impact: "The system can oversell stock and accept an order that cannot be fulfilled.",
      recommendation: "Use an atomic conditional inventory update or row-level lock, and reject the second checkout when no stock remains.",
      evidence: result.evidence,
    };
  }

  async createDefect(input: {
    title: string;
    description: string;
    severity: Severity;
    execution_id?: string;
    evidence?: Record<string, unknown>;
    created_by?: Creator;
  }) {
    return this.repository.update((state) => {
      const existing = state.defects.find((defect) => defect.title.toLowerCase() === input.title.toLowerCase() && defect.status === "OPEN");
      if (existing) {
        throw new DomainError("DUPLICATE_DEFECT", `An open defect named \"${input.title}\" already exists.`, 409, { defect_id: existing.id });
      }
      const execution = input.execution_id
        ? state.executions.find((item) => item.id === input.execution_id)
        : undefined;
      if (input.execution_id && !execution) {
        throw new DomainError("EXECUTION_NOT_FOUND", `Execution ${input.execution_id} was not found.`, 404);
      }
      const id = numericId("DEF", state.defects);
      const defect: Defect = {
        id,
        title: input.title,
        description: input.description,
        severity: input.severity,
        status: "OPEN",
        test_case_id: null,
        execution_id: input.execution_id ?? null,
        evidence: input.evidence ?? execution?.evidence ?? {},
        created_by: input.created_by ?? "AI Agent",
        created_at: now(),
      };
      state.defects.push(defect);
      addActivity(state, {
        kind: "DEFECT_CREATED",
        title: `${id} opened · ${input.severity.toUpperCase()}`,
        detail: input.title,
        actor: defect.created_by,
      });
      return defect;
    });
  }

  async linkDefectToTest(defectId: string, testId: string) {
    return this.repository.update((state) => {
      const defect = state.defects.find((item) => item.id === defectId);
      if (!defect) throw new DomainError("DEFECT_NOT_FOUND", `Defect ${defectId} was not found.`, 404);
      const test = state.test_cases.find((item) => item.id === testId);
      if (!test) throw new DomainError("TEST_CASE_NOT_FOUND", `Test case ${testId} was not found.`, 404);
      defect.test_case_id = test.id;
      if (!defect.execution_id) {
        defect.execution_id = latestExecution(state, test.id)?.id ?? null;
      }
      if (Object.keys(defect.evidence).length === 0 && defect.execution_id) {
        defect.evidence = state.executions.find((item) => item.id === defect.execution_id)?.evidence ?? {};
      }
      addActivity(state, {
        kind: "DEFECT_LINKED",
        title: `${defect.id} linked to ${test.id}`,
        detail: "Failure evidence is now traceable from requirement to defect.",
        actor: "AI Agent",
      });
      return defect;
    });
  }

  async getReleaseReadiness(version: string) {
    const state = await this.repository.read();
    this.requireRelease(state, version);
    return this.assess(state, version);
  }

  async getDashboardSnapshot(version: string): Promise<DashboardSnapshot> {
    const state = await this.repository.read();
    const release = this.requireRelease(state, version);
    const requirements = state.requirements
      .filter((requirement) => requirement.release_version === version)
      .map((requirement) => {
        const linked = state.test_cases.filter((test) => test.requirement_id === requirement.id).map((test) => test.id);
        return { ...requirement, coverage_status: linked.length ? ("COVERED" as const) : ("MISSING COVERAGE" as const), linked_test_cases: linked };
      });
    const requirementIds = new Set(requirements.map((requirement) => requirement.id));
    const testCases = state.test_cases
      .filter((test) => requirementIds.has(test.requirement_id))
      .map((test) => {
        const latest = latestExecution(state, test.id);
        return { ...test, last_execution_result: latest?.result ?? ("NOT RUN" as const), last_execution_id: latest?.id ?? null };
      });
    const latestResults = testCases.map((test) => test.last_execution_result).filter((result) => result !== "NOT RUN");
    const passed = latestResults.filter((result) => result === "PASS").length;
    const covered = requirements.filter((requirement) => requirement.coverage_status === "COVERED").length;
    return {
      revision: state.revision,
      release,
      requirements,
      test_cases: testCases,
      executions: [...state.executions].reverse(),
      defects: [...state.defects].reverse(),
      assessment: this.assess(state, version),
      metrics: {
        requirements_covered: covered,
        requirements_total: requirements.length,
        coverage_percent: requirements.length ? Math.round((covered / requirements.length) * 100) : 0,
        tests_passed: passed,
        tests_total: latestResults.length,
        pass_rate: latestResults.length ? Math.round((passed / latestResults.length) * 100) : 0,
        open_critical_defects: state.defects.filter((defect) => defect.status === "OPEN" && defect.severity === "critical").length,
      },
      activity: state.activity.slice(0, 8),
    };
  }

  async resetDemo() {
    await this.repository.reset();
    return {
      reset: true,
      version: "2.4",
      restored: {
        test_cases: ["TC-001", "TC-002", "TC-003"],
        uncovered_requirements: ["REQ-003"],
        critical_defects: 0,
        execution_history: ["EXE-001", "EXE-002", "EXE-003"],
      },
    };
  }

  private runTestInState(state: AppState, testId: string): TestExecution {
    const test = state.test_cases.find((item) => item.id === testId);
    if (!test) throw new DomainError("TEST_CASE_NOT_FOUND", `Test case ${testId} was not found.`, 404);
    const execution: TestExecution = {
      id: numericId("EXE", state.executions),
      test_case_id: test.id,
      ...simulationFor(test),
      executed_at: now(),
    };
    state.executions.push(execution);
    addActivity(state, {
      kind: "TEST_EXECUTED",
      title: `${test.id} ${execution.result}`,
      detail: execution.result === "FAIL" ? "Negative inventory detected in the concurrency scenario." : "Deterministic checks completed successfully.",
      actor: "AI Agent",
    });
    return execution;
  }

  private requireRelease(state: AppState, version: string) {
    const release = state.releases.find((item) => item.version === version);
    if (!release) throw new DomainError("RELEASE_NOT_FOUND", `Release ${version} was not found.`, 404);
    return release;
  }

  private assess(state: AppState, version: string): ReleaseAssessment {
    this.requireRelease(state, version);
    const requirements = state.requirements.filter((requirement) => requirement.release_version === version);
    const requirementIds = new Set(requirements.map((requirement) => requirement.id));
    const tests = state.test_cases.filter((test) => requirementIds.has(test.requirement_id));
    const gaps = requirements.filter((requirement) => !tests.some((test) => test.requirement_id === requirement.id));
    const criticalDefects = state.defects.filter((defect) => defect.status === "OPEN" && defect.severity === "critical");
    const failedTests = tests.filter((test) => latestExecution(state, test.id)?.result === "FAIL");
    const blockers: ReleaseAssessment["blockers"] = [
      ...criticalDefects.map((defect) => ({ type: "CRITICAL_DEFECT" as const, id: defect.id, summary: defect.title })),
      ...failedTests.map((test) => ({ type: "FAILED_TEST" as const, id: test.id, summary: test.title })),
      ...gaps.map((requirement) => ({ type: "COVERAGE_GAP" as const, id: requirement.id, summary: requirement.title })),
    ];
    if (criticalDefects.length) {
      return {
        version,
        status: "NOT READY",
        reason: "Critical concurrency defect allows negative inventory.",
        reasoning: [
          `${criticalDefects.length} open critical defect blocks release.`,
          "Concurrent checkout can accept two orders for the final item.",
          "Observed inventory reached -1, violating the core safety requirement.",
        ],
        blockers,
        assessed_at: now(),
      };
    }
    if (failedTests.length) {
      return {
        version,
        status: "NOT READY",
        reason: "Critical concurrency validation failed with negative inventory.",
        reasoning: [
          `${failedTests.length} latest test result is failing.`,
          "The observed behavior violates the inventory safety invariant.",
          "A critical defect should be opened with the captured evidence.",
        ],
        blockers,
        assessed_at: now(),
      };
    }
    if (gaps.length) {
      return {
        version,
        status: "AT RISK",
        reason: "Known tests pass, but a critical requirement has no coverage.",
        reasoning: [
          "All executed tests are passing.",
          "No critical defects are currently open.",
          `${gaps.map((gap) => gap.id).join(", ")} remains unverified and requires targeted testing.`,
        ],
        blockers,
        assessed_at: now(),
      };
    }
    return {
      version,
      status: "READY",
      reason: "All requirements are covered, latest tests pass, and no critical defects are open.",
      reasoning: ["Requirement coverage is complete.", "All latest test results pass.", "No open critical defects were found."],
      blockers,
      assessed_at: now(),
    };
  }
}
