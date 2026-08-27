# TestPilot demo video script and storyboard

## Recording target

- Target runtime: **2 minutes 30 seconds**
- Hard limit: **under 3 minutes**
- Format: 16:9, 1080p, clear voice narration, no background music
- Primary window: TestPilot in ChatGPT's in-app browser
- Starting state: release 2.4 at **AT RISK**, three passing tests, REQ-003 uncovered, and zero defects
- Ending state: release 2.4 at **NOT READY**, with TC-004, EXE-004, and DEF-001 visible

## Timed storyboard

| Time | Screen and action | Narration |
| --- | --- | --- |
| 0:00–0:15 | Start on the TestPilot dashboard. Keep **AT RISK**, 100% pass rate, 0 critical defects, and **14 agent tools live** visible. | “A green test dashboard does not always mean a release is safe. TestPilot is an agent-native QA mission control that turns hidden release risk into traceable evidence.” |
| 0:15–0:32 | Slowly point to the 100% pass rate, 2/3 requirements covered, and the REQ-003 mission card. | “Release 2.4 looks healthy: every known test passes and there are no critical defects. But it is still at risk because the concurrent inventory requirement, REQ-003, has no test coverage.” |
| 0:32–0:47 | Show the ChatGPT prompt and submit: **Check whether version 2.4 is safe to release.** Keep TestPilot visible beside the agent when possible. | “Instead of navigating the interface through brittle clicks, I ask one release question. The site exposes fourteen semantic WebMCP actions that the agent can discover and call directly.” |
| 0:47–1:02 | Show the agent calling release, requirement, and coverage tools. Switch to **Requirements** when REQ-003 is returned. | “The agent reads the live release state, inspects the requirements, and calls `get_coverage_gaps`. It finds that this critical concurrency rule has no validating scenario.” |
| 1:02–1:20 | Let the agent call `create_test_case`. Open **Test Cases** and hold on TC-004 with its **AI Agent** badge. | “It creates TC-004: two customers simultaneously purchase the final item. The new test is linked to REQ-003, attributed to the AI agent, and appears immediately in the human interface.” |
| 1:20–1:40 | Let the agent call `run_test`, `get_execution_results`, and `inspect_failure`. Open **Executions**, expand EXE-004 evidence, and highlight `final_inventory: -1`. | “The deterministic run fails. Both customers succeed, inventory reaches negative one, and the inspection identifies a non-atomic concurrent inventory update. This is structured evidence, not a visual guess.” |
| 1:40–1:58 | Let the agent create and link the defect. Open **Defects** and hold on DEF-001, TC-004, EXE-004, and the evidence block. | “The agent creates critical defect DEF-001 and links it to the failed test and execution. The requirement, test, execution, defect, and evidence now form one reviewable trace.” |
| 1:58–2:17 | Open **Release Readiness** after `get_release_readiness`. Hold on **NOT READY**, the rationale, blockers, and decision trace. | “TestPilot reassesses the same live state and changes the decision to NOT READY. The reason is explicit: a critical concurrency defect allows negative inventory.” |
| 2:17–2:30 | End on the decision trace, then briefly show the architecture diagram or a clean end card with the Site and GitHub URLs. | “The UI and WebMCP tools share one domain service and isolated Cloudflare D1 workspace, with deterministic simulation for repeatable judging. TestPilot makes agent actions visible, explainable, and accountable.” |

## On-screen WebMCP sequence

Keep the agent calls visible long enough for judges to recognize the semantic interface:

1. `get_release_details({ "version": "2.4" })`
2. `get_requirements({ "version": "2.4" })`
3. `get_coverage_gaps({ "version": "2.4" })`
4. `create_test_case(...)`
5. `run_test({ "test_id": "TC-004" })`
6. `get_execution_results({ "execution_id": "EXE-004" })`
7. `inspect_failure({ "execution_id": "EXE-004" })`
8. `create_defect(...)`
9. `link_defect_to_test({ "defect_id": "DEF-001", "test_id": "TC-004" })`
10. `get_release_readiness({ "version": "2.4" })`

## Recording notes

- Record the real application workflow; do not simulate agent results with slides.
- Keep the browser zoom and capture resolution unchanged throughout the run.
- Pause for roughly one second on TC-004, `final_inventory: -1`, DEF-001, and **NOT READY**.
- Avoid scrolling while speaking a key sentence; move first, then narrate.
- If an agent response is verbose, cut its prose but preserve the visible tool call and returned identifier.
- Do not show Devpost, GitHub account menus, notifications, terminal windows, or personal browser tabs.
- If the live take exceeds 2:45, shorten transitions rather than removing the WebMCP explanation or final traceability evidence.

## End-card text

**TestPilot**

Agent-native QA mission control that turns release risk into traceable evidence.

- Live app: <https://testpilot-qa.eslamgenio.chatgpt.site/>
- Source: <https://github.com/eslamgenio/testpilot-webmcp>
