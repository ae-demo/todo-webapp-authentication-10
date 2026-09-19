// spec: tests/validation/test-plan.md § AC-007-a
import { test, expect } from "@playwright/test";
import { signIn, addTodo, todoRow } from "../lib/todoApp";

test.setTimeout(60_000);

test("AC-007-a: signing out and signing back in shows the same todos as before sign-out", async ({
  page,
}) => {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  expect(username, "AEP_E2E_USERNAME must be set").toBeTruthy();
  expect(password, "AEP_E2E_PASSWORD must be set").toBeTruthy();

  await signIn(page, username!, password!);

  const title = `e2e AC-007-a ${Date.now()}`;
  await addTodo(page, title);

  // 2. Sign out via the user menu
  await page.getByRole("button", { name: `${username}@test-users.invalid` }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();

  // Assert: the app returns the user to its own sign-in screen
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible({ timeout: 20_000 });

  // 3. Sign in again and confirm the todo is still there
  await signIn(page, username!, password!);
  await expect(todoRow(page, title)).toBeVisible();
});
