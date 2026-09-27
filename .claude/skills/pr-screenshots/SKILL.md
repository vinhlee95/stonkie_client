---
name: pr-screenshots
description: Capture UI screenshots with Claude in Chrome and add them to the PR description. Run automatically right after creating (or updating) a PR whose diff changes rendered UI.
---

# PR screenshots

Part of the PR creation routine for this repo. When a PR changes rendered UI, add screenshots to its description. Don't ask for a separate confirmation: the user's request to create or update the PR covers adding screenshots to that PR's description.

## When

- **Run** when the diff changes rendered UI: `app/**/*.tsx` components/pages/layouts, `*.css`, or the Tailwind config.
- **Skip** when the diff only touches logic, tests, types, API routes, or config.
- **Re-run** after an iteration commit changes the UI. Replace the old images in `## Screenshots`; don't add a second section.

## Tools

Use Claude in Chrome. Load everything in one ToolSearch call:
`select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__tabs_close_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__find,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__resize_window,mcp__claude-in-chrome__upload_image`

## Steps

1. **Preflight.** Call `tabs_context_mcp`. If Chrome isn't connected, or GitHub isn't signed in, skip this skill and tell the user why. Never block the PR on screenshots.
2. **Start the app.** Use `preview_start` with `backend` and then `frontend` (see the `verify` skill). Chrome loads `http://localhost:3000`.
3. **Pick screens.**
   - Choose 1–4 routes the diff actually affects.
   - Put each one in the state that shows the change: open the menu, apply the filter, etc.
   - Wait for data to load, with no skeletons or spinners on screen.
4. **Capture.**
   - Desktop: `resize_window` 1440×900.
   - Mobile: 390×844. Add mobile shots only when the change affects responsive or mobile UI.
5. **Upload into the PR description.** Do these one screenshot at a time:
   - Open the PR in a new tab. Click the description's `…` menu, then **Edit**.
   - Take the `computer` screenshot of the app tab right before uploading. Screenshot IDs expire after a few minutes.
   - Use `find` to locate the edit form's hidden `input[type=file]`.
   - Call `upload_image` with that `imageId` and a descriptive `filename` (e.g. `market-filter-desktop.png`).
   - Wait until the `![…](https://github.com/user-attachments/assets/…)` link appears in the textarea.
6. **Arrange and save.**
   - Put the links under `## Screenshots`, placed before `## Test plan`.
   - Add a short caption for each image. Use a table for desktop/mobile or before/after pairs.
   - Click **Update comment**.
7. **Verify.** Run `gh pr view <n> --json body` and confirm the Screenshots section and image links are there.
8. **Clean up.** Close the tabs you opened and restore the window size.

## Rules

- Never sign in, sign out, or change GitHub account settings.
- Don't capture screens with real personal or account data (the signed-in email, real portfolio holdings) unless the user asks. Prefer mock data. If a protected page is unavoidable, crop or skip it.
- Uploaded images are public (public repo, and the `user-attachments` URLs work for anyone with the link).
- If an upload fails, take a new screenshot and retry once. If it fails again, skip that image and say so.
