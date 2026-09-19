// spec: tests/validation/test-plan.md § AC-002-a
import { test, expect } from "@playwright/test";
import { signIn, addTodo, todoRow } from "../lib/todoApp";

test("AC-002-a: submitting a title creates a new todo in the user's list", async ({ page }) => {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  expect(username, "AEP_E2E_USERNAME must be set").toBeTruthy();
  expect(password, "AEP_E2E_PASSWORD must be set").toBeTruthy();

  await signIn(page, username!, password!);

  // 2. Submit a uniquely-titled todo
  const title = `e2e AC-002-a ${Date.now()}`;
  await addTodo(page, title);

  // Assert: it appears in the list
  await expect(todoRow(page, title)).toBeVisible();
});
