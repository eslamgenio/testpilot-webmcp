import { beforeEach, describe, expect, it } from "vitest";
import { MemoryStateRepository } from "../src/domain/repository";
import { QaService } from "../src/domain/service";

describe("TestPilot QA domain", () => {
  let repository: MemoryStateRepository;
  let service: QaService;

  beforeEach(() => {
    repository = new MemoryStateRepository();
    service = new QaService(repository);
  });

  it("detects REQ-003 as the only initial coverage gap", async () => {
    const gaps = await service.getCoverageGaps("2.4");

    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatchObject({ requirement_id: "REQ-003", priority: "CRITICAL" });
  });

  it("creates the missing test as deterministic TC-004 with agent attribution", async () => {
    const test = await createConcurrencyTest(service);

    expect(test).toMatchObject({
      id: "TC-004",
      requirement_id: "REQ-003",
      created_by: "AI Agent",
      simulation_key: "concurrent_last_item",
    });
    await expect(service.getCoverageGaps("2.4")).resolves.toEqual([]);
  });

  it("simulates the TC-004 concurrency failure with structured negative-inventory evidence", async () => {
    await createConcurrencyTest(service);

    const execution = await service.runTest("TC-004");

    expect(execution.result).toBe("FAIL");
    expect(execution.evidence).toEqual({
      initial_inventory: 1,
      customer_a_result: "success",
      customer_b_result: "success",
      final_inventory: -1,
      expected_inventory_min: 0,
      error: "Race condition detected",
    });
    const inspection = await service.inspectFailure(execution.id);
    expect(inspection.root_cause).toBe("Concurrent inventory update is not atomic.");
  });

  it("creates a critical defect from failed execution evidence", async () => {
    await createConcurrencyTest(service);
    const execution = await service.runTest("TC-004");

    const defect = await service.createDefect({
      title: "Concurrent checkout allows negative inventory",
      description: "Both customers bought the final item and inventory reached -1.",
      severity: "critical",
      execution_id: execution.id,
    });

    expect(defect).toMatchObject({ id: "DEF-001", severity: "critical", execution_id: execution.id });
    expect(defect.evidence.final_inventory).toBe(-1);
  });

  it("changes release readiness to NOT READY after the critical defect is linked", async () => {
    await createConcurrencyTest(service);
    const execution = await service.runTest("TC-004");
    const defect = await service.createDefect({
      title: "Concurrent checkout allows negative inventory",
      description: "The final unit was sold twice.",
      severity: "critical",
      execution_id: execution.id,
    });
    await service.linkDefectToTest(defect.id, "TC-004");

    const readiness = await service.getReleaseReadiness("2.4");

    expect(readiness.status).toBe("NOT READY");
    expect(readiness.reason).toBe("Critical concurrency defect allows negative inventory.");
    expect(readiness.blockers).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "CRITICAL_DEFECT", id: "DEF-001" }),
      expect.objectContaining({ type: "FAILED_TEST", id: "TC-004" }),
    ]));
  });

  it("reset restores the exact initial demo state", async () => {
    await createConcurrencyTest(service);
    const execution = await service.runTest("TC-004");
    await service.createDefect({
      title: "Concurrent checkout allows negative inventory",
      description: "The final unit was sold twice.",
      severity: "critical",
      execution_id: execution.id,
    });

    await service.resetDemo();
    const snapshot = await service.getDashboardSnapshot("2.4");

    expect(snapshot.test_cases.map((test) => test.id)).toEqual(["TC-001", "TC-002", "TC-003"]);
    expect(snapshot.executions.map((item) => item.id)).toEqual(["EXE-003", "EXE-002", "EXE-001"]);
    expect(snapshot.defects).toEqual([]);
    expect(snapshot.requirements.find((item) => item.id === "REQ-003")?.coverage_status).toBe("MISSING COVERAGE");
    expect(snapshot.metrics.pass_rate).toBe(100);
    expect(snapshot.assessment.status).toBe("AT RISK");
  });
});

function createConcurrencyTest(service: QaService) {
  return service.createTestCase({
    title: "Two customers simultaneously purchase the last remaining item",
    description: "Start with one unit and submit two checkout requests at the same time.",
    requirement_id: "REQ-003",
    expected_behavior: "Only one purchase succeeds and inventory never becomes negative.",
  });
}
