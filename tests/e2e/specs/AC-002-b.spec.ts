// spec: tests/validation/test-plan.md § AC-002-b
import { test, expect } from "@playwright/test";
import { signIn, addTodo, todoRow } from "../lib/todoApp";

test("AC-002-b: a newly created todo starts as not completed", async ({ page }) => {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  expect(username, "AEP_E2E_USERNAME must be set").toBeTruthy();
  expect(password, "AEP_E2E_PASSWORD must be set").toBeTruthy();

  await signIn(page, username!, password!);

  const title = `e2e AC-002-b ${Date.now()}`;
  await addTodo(page, title);

  // Assert: its status cell reads "Open", not "Done"
  const row = todoRow(page, title);
  await expect(row).toContainText("Open");
  await expect(row).not.toContainText("Done");
});
