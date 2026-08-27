# TestPilot Hackathon Action Plan

Last reviewed: August 27, 2026  
Submission deadline: **September 3, 2026 at 11:00 PM Cairo time (GMT+3)**

## Current status

The TestPilot implementation is complete, publicly deployed, and production-verified. The remaining work is final application polish, publishing the source repository, preparing submission material, recording the required demonstration video, and completing the Devpost entry.

- Public application: <https://testpilot-qa.eslamgenio.chatgpt.site/>
- Devpost submission dashboard: <https://devpost.com/submit-to/31011-the-webmcp-challenge/manage/submissions>
- Official rules: <https://webmcp.devpost.com/rules>
- Challenge resources: <https://webmcp.devpost.com/resources>

## Phase 1 — Final application polish

- [x] **1. Fix production social-preview metadata.**
  - Ensure Open Graph and Twitter image URLs reference the production Site instead of `localhost:3000`.
  - Confirm the title, description, and preview image render correctly from the public URL.

- [x] **2. Update the README for the public release.**
  - Replace the outdated owner-only deployment statement.
  - Add the public TestPilot URL.
  - Add a concise judge-testing section.
  - Include the exact prompt: **“Check whether version 2.4 is safe to release.”**
  - State the expected conclusion: **NOT READY** after the critical concurrency defect is discovered.

- [x] **3. Run the complete local quality gate.**

  ```powershell
  npm test
  npm run lint
  npm run typecheck
  npm run build
  npm audit --omit=dev
  ```

- [x] **4. Commit the final application and documentation changes.**
  - Use a clear hackathon-ready commit message.
  - Confirm the working tree is clean after the commit.

- [x] **5. Redeploy the final version to the public Site.**
  - Preserve the existing Site URL and D1 binding.
  - Confirm that the Site remains publicly accessible without authentication.

- [x] **6. Perform a judge-style production verification in a fresh anonymous session.**
  - Confirm the application opens without authentication.
  - Confirm all 14 WebMCP tools are available.
  - Confirm the initial release status is **AT RISK**.
  - Discover the REQ-003 coverage gap.
  - Create and run TC-004.
  - Confirm EXE-004 fails with negative-inventory evidence.
  - Create and link DEF-001.
  - Confirm the final release recommendation is **NOT READY**.
  - Test **Reset Demo** and confirm the initial state is restored.
  - Confirm the browser console contains no errors or warnings.

## Phase 2 — Public source repository

- [ ] **7. Create a public GitHub, GitLab, or Bitbucket repository.**
  - Recommended repository name: `testpilot-webmcp`.
  - Do not expose Sites credentials, tokens, local databases, or temporary files.

- [ ] **8. Push the complete source and Git history.**
  - Include all source code, assets, database migrations, tests, and setup instructions.
  - Confirm the pushed commit matches the final deployed source.

- [ ] **9. Configure the public repository presentation.**
  - Add a concise repository description.
  - Add the public TestPilot URL to the repository website field.
  - Add relevant topics such as `webmcp`, `openai`, `qa`, `testing`, and `ai-agents`.

- [ ] **10. Verify open-source license detection.**
  - Confirm the existing MIT `LICENSE` file is visible.
  - Confirm the hosting platform detects and displays the MIT license near the top of the repository page.

- [ ] **11. Verify the repository from a fresh clone.**
  - Follow only the public README instructions.
  - Install dependencies.
  - Run the application locally.
  - Run the complete quality gate.
  - Correct any missing prerequisite or setup instruction.

- [ ] **12. Preserve hackathon-period evidence.**
  - Keep the dated commit history showing development during the submission period.
  - Clearly state whether the project was newly created during the hackathon.
  - If any work predates August 25, 2026, document exactly what WebMCP functionality was added afterward.

- [ ] **13. Add a judge-testing section to the public repository.**
  - Public Site URL.
  - Supported WebMCP browsers.
  - Exact demonstration prompt.
  - Expected tool sequence.
  - Expected final result.
  - Reset instructions.

## Phase 3 — Submission material

- [ ] **14. Finalize the project name and tagline.**
  - Keep the project name specific and human-written.
  - Suggested working tagline: **“Agent-native QA mission control that turns release risk into traceable evidence.”**

- [ ] **15. Write the Devpost project description.**
  - Explain the real QA release-decision problem.
  - Explain why WebMCP is a strong fit.
  - Explain why semantic tools are better than fragile DOM automation.
  - Describe what the human and agent accomplish together.
  - Briefly explain `document.modelContext.registerTool()` and the 14-tool implementation.
  - Explain the D1 persistence and anonymous session isolation.
  - State the target users and credible business impact.
  - Explain what makes TestPilot creative and different.
  - Clearly distinguish deterministic demo behavior from production integrations that could be added later.

- [ ] **16. Prepare concise judge-testing instructions.**
  - Open the public Site in ChatGPT's in-app browser or a supported WebMCP-enabled Chrome version.
  - Ask: **“Check whether version 2.4 is safe to release.”**
  - Allow the agent to inspect coverage, create the missing test, run it, diagnose the failure, create the defect, link the evidence, and reassess readiness.
  - Confirm the dashboard ends at **NOT READY**.
  - Use **Reset Demo** before repeating the walkthrough.

- [ ] **17. Capture polished screenshots.**
  - Initial dashboard showing **AT RISK**.
  - WebMCP status showing 14 tools available.
  - REQ-003 coverage gap.
  - AI-created TC-004.
  - EXE-004 failure with inventory `-1` evidence.
  - DEF-001 traceability.
  - Final **NOT READY** release assessment.

- [ ] **18. Select and prepare the project thumbnail.**
  - Use the strongest readable dashboard image.
  - Confirm it remains legible at Devpost thumbnail size.
  - Avoid personal data, unrelated browser chrome, or notifications.

## Phase 4 — Demonstration video

- [ ] **19. Write a video script and storyboard.**
  - Target duration: approximately 2 minutes 30 seconds.
  - Suggested structure:
    1. Problem and value proposition.
    2. Initial dashboard state.
    3. Agent discovers REQ-003.
    4. Agent creates and runs TC-004.
    5. Failure evidence and DEF-001 appear in the UI.
    6. Final **NOT READY** recommendation.
    7. Brief architecture and WebMCP explanation.

- [ ] **20. Prepare a clean recording environment.**
  - Reset the demo.
  - Close unrelated applications and browser tabs.
  - Disable visible notifications.
  - Use a readable resolution and browser zoom.
  - Test microphone clarity.

- [ ] **21. Record the complete demonstration with narration.**
  - Show the application functioning, not only slides.
  - Clearly explain what was built and how WebMCP is used.
  - Keep the final video shorter than three minutes.

- [ ] **22. Review and edit the video.**
  - Remove pauses, failed attempts, personal information, and unrelated content.
  - Do not include copyrighted music or unauthorized third-party material.
  - Confirm all important text is readable.

- [ ] **23. Upload the video publicly to YouTube.**
  - Use a clear title and description.
  - Include the public Site and repository links in the description.
  - Do not use an unlisted or private setting if the rules require public visibility.

- [ ] **24. Verify the YouTube video anonymously.**
  - Open the video while signed out.
  - Confirm playback, audio, resolution, duration, and captions if provided.

## Phase 5 — Devpost entry

- [ ] **25. Start the project from the Devpost submission dashboard.**
  - The dashboard currently shows **Start a Project**.
  - Select whether the entry is solo or team-based.

- [ ] **26. Complete the project identity fields.**
  - Project name.
  - Tagline.
  - Category or challenge selections, if requested.
  - Team members, if applicable.

- [ ] **27. Complete the project story.**
  - Problem.
  - Inspiration.
  - What TestPilot does.
  - How it was built.
  - How WebMCP is used.
  - Challenges encountered.
  - Accomplishments.
  - Lessons learned.
  - Future improvements.

- [ ] **28. Add the required links.**
  - Public TestPilot Site.
  - Public source repository.
  - Public YouTube demonstration video.

- [ ] **29. Add project media and technology details.**
  - Screenshots.
  - Project thumbnail.
  - Technologies used.
  - WebMCP testing instructions.
  - Any additional fields required by the live Devpost form.

- [ ] **30. Save the Devpost project as a draft.**
  - Do not submit until the final verification phase is complete.
  - Reopen the draft and confirm all saved values and media are present.

## Phase 6 — Final submission gate

- [ ] **31. Verify every submitted URL anonymously.**
  - Public Site returns the TestPilot application without authentication.
  - Repository is public and readable.
  - License is visible.
  - YouTube video plays without authentication.

- [ ] **32. Run one final end-to-end judge rehearsal.**
  - Start from a fresh anonymous TestPilot session.
  - Follow the submitted testing instructions exactly.
  - Confirm the result matches the video and project description.

- [ ] **33. Confirm source and deployment consistency.**
  - The public repository contains the exact submitted implementation.
  - The live Site reflects the final repository commit.
  - The README links and screenshots are current.

- [ ] **34. Perform a compliance review.**
  - Project is original and owned by the entrant or team.
  - Third-party packages and assets are used under valid licenses.
  - Submission content is in English.
  - No secrets, credentials, or personal information are exposed.
  - Video is under three minutes and includes audio.
  - Live application remains free and accessible through the judging period.

- [ ] **35. Proofread the complete submission.**
  - Correct spelling and grammar.
  - Remove unsupported claims.
  - Ensure the value proposition is specific and consistent.
  - Ensure all screenshots, links, and technical descriptions match the deployed product.

- [ ] **36. Submit before the deadline.**
  - Submit no later than **September 3, 2026 at 11:00 PM Cairo time**.
  - Prefer submitting several hours early to allow recovery from upload or Devpost problems.

- [ ] **37. Save submission evidence.**
  - Capture the successful-submission confirmation.
  - Record the final submission URL and submission time.
  - Preserve copies of the final text, screenshots, and video URL.

## Phase 7 — Judging-period freeze

- [ ] **38. Freeze the submitted artifacts after the deadline.**
  - Do not modify the submitted Devpost entry.
  - Do not modify the submitted public repository.
  - Do not modify the submitted live Site.
  - Do not replace or edit the submitted video.

- [ ] **39. Use a separate development copy for later improvements.**
  - Fork the repository or create a separate unsubmitted branch/project.
  - Keep the submitted version available and unchanged until winners are announced.

- [ ] **40. Monitor official communications.**
  - Check Devpost notifications and the registered email address.
  - Respond promptly if the organizers request testing access, eligibility confirmation, or winner documentation.

## Completion definition

The hackathon entry is complete only when:

- [ ] The final public Site works anonymously with all 14 WebMCP tools.
- [ ] The public source repository is accessible, licensed, and reproducible.
- [ ] The public YouTube demonstration is under three minutes and includes clear audio.
- [ ] Every required Devpost field and link is complete.
- [ ] The project is formally submitted before the deadline.
- [ ] Submission confirmation evidence is saved.
