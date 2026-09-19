# Validation test plan — todo-webapp-authentication-10 (issue #7)

Target: `todo-webapp` (primary), backed by `todo-api`. Sign-in is via Thunder
SSO (OIDC Authorization Code + PKCE, `todo-webapp/src/authz/session.ts`):
visiting any route with no valid session triggers a full-page redirect to the
IdP's own hosted "Sign In" form (username/password), which on success redirects
back to `/callback` and then to `/todos`.

Credentials come from the milestone's roles gate ticket (issue #3), never
hardcoded:
- `AEP_E2E_USERNAME` / `AEP_E2E_PASSWORD` — `test-user` (role User)
- `AEP_E2E_USERNAME_2` / `AEP_E2E_PASSWORD_2` — `test-user-2` (role User) —
  needed only for the two cross-user criteria (AC-003-b, AC-007-b), which
  require two distinct signed-in identities at once.

Explored live against the deployed environment with playwright-cli
(session `default`, then `user2`) on 2026-09-19. Key findings from
exploration, reused as locators below:

- Root URL shows "Checking your session…" for several seconds (a silent-renew
  attempt against the IdP with no stored session) before redirecting to the
  IdP's "Sign In" form. This delay was observed up to ~12s live, so specs use
  an extended timeout (20s) on the first visibility assertion after `goto`.
- Sign-in form: `getByRole('textbox', { name: 'Username' })`,
  `getByRole('textbox', { name: 'Password' })`,
  `getByRole('button', { name: 'Sign In' })`.
- After sign-in: lands on `/todos`, heading "My Todos", add box
  `getByRole('textbox', { name: 'Add a new todo…' })`, `getByRole('button',
  { name: 'Add' })`. New todos render as a table row with cells `[title,
  status chip ("Open"/"Done"), ""]`; the compact `<List>` above the table
  also renders titles only.
- Clicking a row navigates to `/todos/{id}` — Title textbox, "Completed"
  checkbox, Cancel / Delete / Save buttons.
- **Finding (genuine app defect, not a test brittleness issue):** clicking
  "Sign out" (via the user menu button named `<username>@test-users.invalid`,
  then the "Sign out" menu item) redirects to the IdP's own
  `/oauth2/logout` endpoint, which answers with a **400** and renders a raw
  "invalid post_logout_redirect_uri" error page — the user is stranded off
  the app's own origin, never returned to a sign-in screen the way the flow
  implies. Reproduced twice, consistently, with a fresh browser session each
  time. This affects AC-007-a directly (see below) and is reported as a
  failure, not healed.

## Additional finding — no pagination in the todo list UI (not tied to a single AC)

While authoring AC-007-a, `test-user`'s account had accumulated 22 todos from
earlier spec runs in this same authoring pass. `GET /me/todos` defaults to
`limit=20`, sorted oldest-first, and `todo-webapp/src/pages/TodoList.tsx`
calls it with no `limit`/`offset`/pagination controls at all. Once an account
passes 20 todos, every *newly* created todo becomes permanently invisible in
the UI (it exists via the API — confirmed via direct API pagination — but
never renders, since the app always fetches page 1 and never fetches or links
to further pages). This reproduced consistently and was the actual cause of
an early false failure while authoring AC-007-a (fixed by cleaning up the
test account via the API, not by touching any spec — see below).

This is a real, user-facing defect independent of the test environment: any
User who accumulates 20+ todos over time will stop being able to see new
ones they add. It doesn't map to one specific AC-XXX id (all the "create a
todo" criteria pass because they run against small accounts), so it's
recorded here rather than as a spec failure, and should be triaged as a
product bug (add pagination / infinite-scroll to TodoList, or raise the
default page size) separately from this validation run.

**Test account hygiene:** to keep this from producing false failures in this
run and future ones, `test-user`'s 22 accumulated todos (from this run's own
spec executions) were deleted via `DELETE /me/todos/{id}` after being
identified as the cause of the false failure above, restoring the account to
0 todos before the final AC-007-a proof runs. `test-user-2` was not
polluted (only AC-003-b and AC-007-b ever sign in as it, and neither leaves
data behind attributable to it beyond what AC-003-b's own assertions cover).

## AC-001-a — An unauthenticated visitor is presented with a sign-in flow before seeing any todos

- Target: todo-webapp (primary)
- Steps:
  1. Fresh (unauthenticated) browser context, navigate to `/`
  2. Wait for the IdP's sign-in form to appear
- Assert: the "Sign In" heading/button is visible, and no todo content
  (heading "My Todos") is ever rendered first
- Source of truth: live exploration (session `default`)

## AC-001-b — After signing in, the user lands on their own todo list

- Target: todo-webapp
- Steps:
  1. Navigate to `/`, sign in with `AEP_E2E_USERNAME` / `AEP_E2E_PASSWORD`
  2. Wait for redirect to complete
- Assert: URL path is `/todos` and heading "My Todos" is visible
- Source of truth: live exploration

## AC-002-a — Submitting a title creates a new todo in the user's list

- Target: todo-webapp
- Steps:
  1. Sign in
  2. Fill the add-todo box with a unique title (`` `e2e ${Date.now()} …` ``),
     click Add
- Assert: a table row containing that exact title appears
- Source of truth: live exploration + `todo-webapp/src/pages/TodoList.tsx`

## AC-002-b — A newly created todo starts as not completed

- Target: todo-webapp
- Steps: same as AC-002-a
- Assert: the created row's status cell reads "Open" (not "Done")
- Source of truth: live exploration

## AC-003-a — The todo list screen shows every todo belonging to the signed-in user

- Target: todo-webapp
- Steps:
  1. Sign in
  2. Add two uniquely-titled todos
- Assert: both titles appear as rows in the list
- Source of truth: live exploration

## AC-003-b — A user never sees another user's todos in their list

- Target: todo-webapp
- Steps:
  1. Browser context A: sign in as `AEP_E2E_USERNAME`, add a uniquely-titled
     todo
  2. Browser context B (separate, no shared storage): sign in as
     `AEP_E2E_USERNAME_2`
- Assert: context B's list does NOT contain context A's todo title
- Source of truth: live exploration (session `default` vs `user2` — confirmed
  test-user-2 starts with an empty list while test-user has items)

## AC-004-a — Marking a todo as completed updates its status to completed

- Target: todo-webapp
- Steps:
  1. Sign in, add a uniquely-titled todo
  2. Click its row to open TodoDetail, check "Completed", click Save
- Assert: back on `/todos`, the row's status cell reads "Done"
- Source of truth: live exploration + `todo-webapp/src/pages/TodoDetail.tsx`

## AC-004-b — Unmarking a completed todo returns its status to not completed

- Target: todo-webapp
- Steps:
  1. Continue from a completed todo (steps of AC-004-a)
  2. Open its row again, uncheck "Completed", click Save
- Assert: row's status cell reads "Open"
- Source of truth: live exploration

## AC-005-a — Editing a todo's title and saving persists the new title

- Target: todo-webapp
- Steps:
  1. Sign in, add a uniquely-titled todo
  2. Open its row, change the Title field to a new unique value, click Save
- Assert: the list shows the new title; the old title is gone
- Source of truth: live exploration

## AC-006-a — Deleting a todo removes it from the user's list

- Target: todo-webapp
- Steps:
  1. Sign in, add a uniquely-titled todo
  2. Open its row, click Delete
- Assert: back on `/todos`, no row with that title exists
- Source of truth: live exploration + `todo-webapp/src/pages/TodoDetail.tsx`

## AC-007-a — Signing out and signing back in shows the same todos as before sign-out

- Target: todo-webapp
- Steps:
  1. Sign in, add a uniquely-titled todo
  2. Open the user menu, click "Sign out"
  3. Sign in again with the same credentials
- Assert: after step 2, the app returns the user to a sign-in screen on its
  own origin (`getByRole('button', {name: 'Sign In'})` reachable without
  manual URL navigation); then after re-signing in, the todo from step 1 is
  still present
- Source of truth: live exploration — **the app fails at step 2**: "Sign out"
  redirects to the IdP's `/oauth2/logout`, which 400s with "invalid
  post_logout_redirect_uri" and never returns to the app. This spec is
  authored to drive the real flow and will fail honestly at that step; it is
  not healed (see healing.md: "App error … error page … genuine — report").

## AC-007-b — Todos added in one session are visible when signing in again from a different browser session

- Target: todo-webapp
- Steps:
  1. Browser context A (fresh storage): sign in as `AEP_E2E_USERNAME`, add a
     uniquely-titled todo
  2. Browser context B (separate, fresh storage — simulates a different
     browser/device): sign in as the same `AEP_E2E_USERNAME`
- Assert: context B's list contains the todo added in context A
- Source of truth: live exploration (session `default`'s "Persist across
  sessions" todo was visible again after a full fresh sign-in in a brand new
  browser context)
