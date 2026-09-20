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

## Re-validation 2026-09-19 — AC-007-a re-checked after #9/#10

Between the prior run and this one, commit `99dbc0a` ("force
re-authentication on sign-out", #9/#10) changed `todo-webapp/src/authz/session.ts`
to call `signinRedirect({ prompt: "login" })` after `signoutRedirect()` fails,
on the theory that the IdP advertises no `end_session_endpoint` and
`signoutRedirect()` always rejects synchronously before navigating anywhere.

Re-running `AC-007-a.spec.ts` (no changes made to the spec) against the
redeployed app shows the same defect, reached the same way as before: the
"Sign out" click still navigates the browser to the IdP's `/oauth2/logout`
and lands on its error page with the text "invalid post_logout_redirect_uri"
— the fix's premise doesn't hold in practice; the IdP evidently does accept
the end-session request far enough to reject it on the `post_logout_redirect_uri`
parameter, rather than the client rejecting it before ever navigating, so the
`catch` branch that would trigger the new `prompt: "login"` retry never runs.
The user is stranded on the IdP's error page, off-app, exactly as in the
first run. Confirmed genuine (not a test issue) — not healed.

## Re-validation 2026-09-20 — pagination defect recurs, AC-007-a still fails

No app commits landed between the 2026-09-19 re-validation and this run (HEAD
is still `1574ac5`), so this cycle re-ran the same 12-spec regression set
unchanged against the same deployment.

**The no-pagination defect (see above) recurred and was worse.** Because
neither validation run cleans up the todos its own specs create,
`test-user`'s account had grown back to **32** todos by the time this run
started (22 left over from the 2026-09-19 cleanup's own re-proof runs, plus
~10 more from the 2026-09-19 re-validation's full-suite run). With 32 > 20,
**10 of 12 specs failed** on their first full-suite run — every spec that adds
a todo and then asserts it's visible timed out on `todoRow(...)`, because the
API was correctly storing the todo (confirmed via direct `GET
/me/todos?limit=100`, `count: 32`) but the UI's unpaginated first-page fetch
(`limit=20`, oldest-first) never reached it. This is the same defect flagged
above, now reproducing at the scale of the whole suite rather than one spec.

Cleaned up again: fetched all 32 of `test-user`'s todo IDs via
`GET /me/todos?limit=100` and deleted each via `DELETE /me/todos/{id}`
(`test-user-2` was already at 0). Re-ran the full suite against the now-empty
accounts: **11/12 pass**, only AC-007-a fails — confirming the mass failure
was entirely the pagination defect, not a regression in the other 10
criteria. Re-ran `AC-007-a.spec.ts` alone a second time to confirm
consistency.

**AC-007-a itself is unchanged from 2026-09-19**: reproduced live with
playwright-cli (fresh sign-in, click the user menu, click "Sign out") — the
click still navigates to the IdP's `/oauth2/logout?id_token_hint=...&post_logout_redirect_uri=...`
and lands on the same "invalid post_logout_redirect_uri" error page. The
`prompt: "login"` retry added in commit `99dbc0a` still never runs, because
`signoutRedirect()` still doesn't reject — it navigates the browser away
before any catch block could fire. Confirmed genuine, not healed.

**This defect will keep recurring every validation cycle** until either the
todo-webapp adds pagination (or the test accounts are reset between runs).
Recommended as a product bug distinct from AC-007-a: `todo-webapp/src/pages/TodoList.tsx`
calls `GET /me/todos` with no `limit`/`offset`, so any account (test or real)
that accumulates more than 20 todos permanently stops seeing new ones it
creates.

## Re-validation 2026-09-20 (cycle 4) — same result, pre-emptive account cleanup

No app commits landed on `main` since the prior cycle (HEAD is still
`1574ac5`); this cycle re-ran the same 12-spec regression set unchanged
against the same deployment.

**Pre-emptive cleanup, this time before running rather than after a false
failure.** Before running the suite, checked both test accounts directly via
the API: `test-user` had 11 leftover todos (from the prior cycle's own spec
runs), `test-user-2` had 0. Since the suite's own runs add ~8 more to
`test-user` and the known pagination defect (above) bites once an account
passes 20, deleted `test-user`'s 11 leftover todos via `DELETE
/me/todos/{id}` before starting, to keep this run's own creates safely under
the limit. This avoided the mass false-failure seen on 2026-09-20's earlier
cycle.

**Result: 11/12 pass, single run, no false failures.** `AC-007-a` is the only
failure, reproduced identically to every prior cycle: after clicking "Sign
out", the app navigates to the IdP's `/oauth2/logout` and lands on its
"invalid post_logout_redirect_uri" error page instead of returning to the
app's own sign-in screen (confirmed via the failed run's
`error-context.md`, which captured the same error text on the page). Not
healed — genuine, unchanged app defect since the `99dbc0a` fix attempt.

All other 11 criteria (AC-001-a/b, AC-002-a/b, AC-003-a/b, AC-004-a/b,
AC-005-a, AC-006-a, AC-007-b) pass.

**Recommendation unchanged**: this project needs a real fix for AC-007-a
(the IdP's logout endpoint needs a registered/valid `post_logout_redirect_uri`
for this client, or the app needs to stop relying on IdP-side logout and
instead just clear its local session) and, separately, pagination in
`TodoList.tsx` to prevent the recurring false-failure risk documented above.
