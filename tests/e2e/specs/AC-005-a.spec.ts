// spec: tests/validation/test-plan.md § AC-005-a
import { test, expect } from "@playwright/test";
import { signIn, addTodo, openTodo, todoRow } from "../lib/todoApp";

test("AC-005-a: editing a todo's title and saving persists the new title", async ({ page }) => {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  expect(username, "AEP_E2E_USERNAME must be set").toBeTruthy();
  expect(password, "AEP_E2E_PASSWORD must be set").toBeTruthy();

  await signIn(page, username!, password!);

  const marker = Date.now();
  const originalTitle = `e2e AC-005-a original ${marker}`;
  const newTitle = `e2e AC-005-a edited ${marker}`;
  await addTodo(page, originalTitle);

  // 2. Open it, change the title, save
  await openTodo(page, originalTitle);
  await page.getByRole("textbox", { name: "Title" }).fill(newTitle);
  await page.getByRole("button", { name: "Save" }).click();

  // Assert: the new title is shown; the old one is gone
  await expect(page.getByRole("heading", { name: "My Todos" })).toBeVisible();
  await expect(todoRow(page, newTitle)).toBeVisible();
  await expect(todoRow(page, originalTitle)).toHaveCount(0);
});
