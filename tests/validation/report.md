# Validation report

- **Issue:** #7
- **Commit:** 0ad11d8c18751d4f6ed121d77466fa4f6cc5ef01
- **Generated:** 2026-09-20T06:37:12.185Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 12 | 11 | 1 | 0 |
| manual (human checklist) | 0 | — | — | — |
| scenario (not validated) | 0 | — | — | — |

## E2E results

| Criterion | Must | Status | Spec | Notes |
|---|---|---|---|---|
| AC-001-a | An unauthenticated visitor is presented with a sign-in flow before seeing any todos | ✅ pass | `tests/e2e/specs/AC-001-a.spec.ts` | — |
| AC-001-b | After signing in, the user lands on their own todo list | ✅ pass | `tests/e2e/specs/AC-001-b.spec.ts` | — |
| AC-002-a | Submitting a title creates a new todo in the user's list | ✅ pass | `tests/e2e/specs/AC-002-a.spec.ts` | — |
| AC-002-b | A newly created todo starts as not completed | ✅ pass | `tests/e2e/specs/AC-002-b.spec.ts` | — |
| AC-003-a | The todo list screen shows every todo belonging to the signed-in user | ✅ pass | `tests/e2e/specs/AC-003-a.spec.ts` | — |
| AC-003-b | A user never sees another user's todos in their list | ✅ pass | `tests/e2e/specs/AC-003-b.spec.ts` | — |
| AC-004-a | Marking a todo as completed updates its status to completed | ✅ pass | `tests/e2e/specs/AC-004-a.spec.ts` | — |
| AC-004-b | Unmarking a completed todo returns its status to not completed | ✅ pass | `tests/e2e/specs/AC-004-b.spec.ts` | — |
| AC-005-a | Editing a todo's title and saving persists the new title | ✅ pass | `tests/e2e/specs/AC-005-a.spec.ts` | — |
| AC-006-a | Deleting a todo removes it from the user's list | ✅ pass | `tests/e2e/specs/AC-006-a.spec.ts` | — |
| AC-007-a | Signing out and signing back in shows the same todos as before sign-out | ❌ fail | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-007-b | Todos added in one session are visible when signing in again from a different browser session | ✅ pass | `tests/e2e/specs/AC-007-b.spec.ts` | — |

## Failures

### AC-007-a — Signing out and signing back in shows the same todos as before sign-out

Spec: `tests/e2e/specs/AC-007-a.spec.ts`
Location: `AC-007-a.spec.ts:7`

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Sign In' })
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for getByRole('button', { name: 'Sign In' })

```

