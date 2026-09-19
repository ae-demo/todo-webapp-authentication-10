// spec: tests/validation/test-plan.md § AC-001-b
import { test, expect } from "@playwright/test";
import { signIn } from "../lib/todoApp";

test("AC-001-b: after signing in, the user lands on their own todo list", async ({ page }) => {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  expect(username, "AEP_E2E_USERNAME must be set").toBeTruthy();
  expect(password, "AEP_E2E_PASSWORD must be set").toBeTruthy();

  // 1-2. Sign in and wait for the redirect to complete
  await signIn(page, username!, password!);

  // Assert: on the user's own todo list
  await expect(page).toHaveURL(/\/todos$/);
  await expect(page.getByRole("heading", { name: "My Todos" })).toBeVisible();
});
