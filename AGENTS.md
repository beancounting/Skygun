# Skygun working instructions

- Read PLAN.md, README.md, and REVIEW.md before implementation. Keep work within the currently approved milestone or fix.
- Update CHANGELOG.md with every implementation or fix: explain user-visible changes, relevant validation, and outstanding limitations. Keep unpublished work under Unreleased; use Australia/Brisbane dates.
- Use the existing isolated checkout. Do not create an additional worktree unless requested. Preserve existing user changes.
- Work on a feature branch and present changes for review before merging. Do not publish the game or change repository visibility without explicit approval.
- Keep simulation separate from rendering/input. Validate changes with relevant existing tests. For download/startup changes, run the standalone offline check as well as the normal build.
- Distinguish desktop Chromium, tablet emulation, WebKit, and actual-device results. Never claim iPad Safari compatibility from emulation alone.
