// spec: tests/validation/test-plan.md § AC-006-a
import { test, expect } from "@playwright/test";
import { signIn, addTodo, openTodo, todoRow } from "../lib/todoApp";

test("AC-006-a: deleting a todo removes it from the user's list", async ({ page }) => {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  expect(username, "AEP_E2E_USERNAME must be set").toBeTruthy();
  expect(password, "AEP_E2E_PASSWORD must be set").toBeTruthy();

  await signIn(page, username!, password!);

  const title = `e2e AC-006-a ${Date.now()}`;
  await addTodo(page, title);

  // 2. Open it, delete it
  await openTodo(page, title);
  await page.getByRole("button", { name: "Delete" }).click();

  // Assert: back on the list, the todo is gone
  await expect(page.getByRole("heading", { name: "My Todos" })).toBeVisible();
  await expect(todoRow(page, title)).toHaveCount(0);
});
