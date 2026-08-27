# TestPilot Devpost Submission

This file is the source of truth for the final WebMCP Challenge submission copy and judge instructions.

## Project identity

- **Project name:** TestPilot
- **Tagline:** Agent-native QA mission control that turns release risk into traceable evidence.

## Project description

### The release decision problem

A green test dashboard does not always mean a release is safe. Critical requirements can remain untested, execution evidence can be scattered across tools, and defects can lose their connection to the requirement and test that exposed them. QA leaders and release managers often spend more time assembling that context than making the decision itself.

TestPilot turns that fragmented workflow into one shared, agent-native release workspace. The human sees a mission-control dashboard for requirements, test cases, executions, defects, traceability, and release readiness. An AI agent sees the same capabilities as structured WebMCP tools. Both work against the same live state, so every agent action becomes visible and reviewable in the human interface.

### What TestPilot does

The demonstration begins with e-commerce release 2.4 showing a 100% pass rate and no critical defects. It still starts **AT RISK** because the critical concurrent-purchase requirement, REQ-003, has no test coverage.

The user asks one natural question: **“Check whether version 2.4 is safe to release.”** The agent inspects the release and requirements, finds the coverage gap, creates the missing two-customer test, runs it, and observes both customers buying the final item while inventory reaches `-1`. It diagnoses the failure, creates a critical defect, links that defect back to TC-004 and REQ-003, and reassesses the release as **NOT READY**. The dashboard updates throughout the investigation, giving the human a traceable evidence chain instead of an unexplained AI verdict.

### Why WebMCP is the right interface

Traditional browser automation forces an agent to infer business intent from presentation: locate a DOM element, click it, wait for a visual change, and reinterpret the page. That workflow is brittle because a label, layout, loading state, or responsive breakpoint can change while the underlying QA capability remains the same.

TestPilot instead registers 14 semantic actions through `document.modelContext.registerTool()`. Tools such as `get_coverage_gaps`, `create_test_case`, `run_test`, `inspect_failure`, `create_defect`, and `get_release_readiness` have clear descriptions, JSON input schemas, server-side validation, and predictable structured responses. The agent can call the capability it needs directly, while the human retains control through the visible UI and reviewable evidence.

This is more than a chatbot placed beside a dashboard. The UI and the agent use the same domain service, APIs, and Cloudflare D1 state. There is no hidden agent-only database and no second version of the truth.

### Built for useful human-agent collaboration

TestPilot is designed for software quality engineers, QA leaders, release managers, and engineering teams that need defensible release decisions. It can reduce the manual effort required to identify missing coverage, reproduce failures, create traceable defects, and explain why a release should or should not ship. The agent accelerates investigation and evidence assembly; the human can observe, challenge, and reset the workflow at any point.

OpenAI Sites hosts the public application, while Cloudflare D1 persists each browser's workspace. Secure anonymous session isolation gives every judge an independent deterministic dataset without requiring an account and prevents simultaneous evaluations from overwriting one another.

### Honest prototype boundaries and production path

The e-commerce system and test runner are intentionally simulated, and TC-004 fails deterministically so judges can complete and repeat the full story reliably. The release logic, validation, persistence, traceability, tool registration, and human-agent state synchronization are implemented; the prototype does not claim to execute a real retailer's production tests.

A production version could connect the same domain and WebMCP boundaries to CI/CD systems, real test runners, requirements platforms, defect trackers, source-control checks, and deployment approvals. Organization authentication, role-based access, audit retention, notifications, and configurable release policies could be added without changing the central interaction model: the human and agent collaborate on one live, evidence-backed release decision.

## Judge testing instructions

1. Open [TestPilot](https://testpilot-qa.eslamgenio.chatgpt.site/) in ChatGPT's in-app browser. For Chrome 149+, first enable `chrome://flags/#enable-webmcp-testing` and relaunch Chrome.
2. Confirm the dashboard shows **14 agent tools live** and release 2.4 starts **AT RISK**.
3. Ask the agent: **“Check whether version 2.4 is safe to release.”**
4. Allow the agent to inspect the release and coverage, create the missing concurrency test, run it, diagnose the failure, create a critical defect, link the evidence, and reassess readiness.
5. Confirm the dashboard ends **NOT READY**, with TC-004 failed, inventory at `-1`, and DEF-001 linked to the test and requirement.
6. Select **Reset Demo** before repeating the walkthrough. The baseline returns to three passing tests, no defects, and REQ-003 uncovered.

No account or credentials are required. Each browser receives an isolated anonymous demo workspace, so one judge's actions do not affect another judge.
