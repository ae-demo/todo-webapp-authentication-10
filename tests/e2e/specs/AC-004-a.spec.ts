// spec: tests/validation/test-plan.md § AC-004-a
import { test, expect } from "@playwright/test";
import { signIn, addTodo, openTodo, todoRow } from "../lib/todoApp";

test("AC-004-a: marking a todo as completed updates its status to completed", async ({ page }) => {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  expect(username, "AEP_E2E_USERNAME must be set").toBeTruthy();
  expect(password, "AEP_E2E_PASSWORD must be set").toBeTruthy();

  await signIn(page, username!, password!);

  const title = `e2e AC-004-a ${Date.now()}`;
  await addTodo(page, title);

  // 2. Open the todo, check Completed, save
  await openTodo(page, title);
  await page.getByRole("checkbox", { name: "Completed" }).check();
  await page.getByRole("button", { name: "Save" }).click();

  // Assert: back on the list, status is "Done"
  await expect(page.getByRole("heading", { name: "My Todos" })).toBeVisible();
  await expect(todoRow(page, title)).toContainText("Done");
});
