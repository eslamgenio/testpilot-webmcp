export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TestResult = "PASS" | "FAIL";
export type Severity = "low" | "medium" | "high" | "critical";
export type ReadinessStatus = "READY" | "AT RISK" | "NOT READY";
export type Creator = "Human" | "AI Agent";

export interface Release {
  id: string;
  version: string;
  name: string;
  status: "CANDIDATE" | "RELEASED";
  created_at: string;
}

export interface Requirement {
  id: string;
  release_version: string;
  title: string;
  description: string;
  priority: Priority;
}

export type SimulationKey =
  | "normal_purchase"
  | "exact_inventory"
  | "over_purchase"
  | "concurrent_last_item";

export interface TestCase {
  id: string;
  title: string;
  description: string;
  requirement_id: string;
  expected_behavior: string;
  status: "ACTIVE";
  created_by: Creator;
  created_at: string;
  simulation_key: SimulationKey;
}

export interface TestExecution {
  id: string;
  test_case_id: string;
  result: TestResult;
  duration_ms: number;
  failure_details: string | null;
  evidence: Record<string, unknown>;
  executed_at: string;
}

export interface Defect {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: "OPEN" | "CLOSED";
  test_case_id: string | null;
  execution_id: string | null;
  evidence: Record<string, unknown>;
  created_by: Creator;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  kind: "TEST_CREATED" | "TEST_EXECUTED" | "DEFECT_CREATED" | "DEFECT_LINKED";
  title: string;
  detail: string;
  actor: Creator | "System";
  created_at: string;
}

export interface AppState {
  schema_version: 1;
  revision: number;
  releases: Release[];
  requirements: Requirement[];
  test_cases: TestCase[];
  executions: TestExecution[];
  defects: Defect[];
  activity: ActivityEvent[];
}

export interface ReleaseAssessment {
  version: string;
  status: ReadinessStatus;
  reason: string;
  reasoning: string[];
  blockers: Array<{ type: "COVERAGE_GAP" | "FAILED_TEST" | "CRITICAL_DEFECT"; id: string; summary: string }>;
  assessed_at: string;
}

export interface DashboardSnapshot {
  revision: number;
  release: Release;
  requirements: Array<Requirement & { coverage_status: "COVERED" | "MISSING COVERAGE"; linked_test_cases: string[] }>;
  test_cases: Array<TestCase & { last_execution_result: TestResult | "NOT RUN"; last_execution_id: string | null }>;
  executions: TestExecution[];
  defects: Defect[];
  assessment: ReleaseAssessment;
  metrics: {
    requirements_covered: number;
    requirements_total: number;
    coverage_percent: number;
    tests_passed: number;
    tests_total: number;
    pass_rate: number;
    open_critical_defects: number;
  };
  activity: ActivityEvent[];
}
