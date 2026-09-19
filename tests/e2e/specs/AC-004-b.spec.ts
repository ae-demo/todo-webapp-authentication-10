// spec: tests/validation/test-plan.md § AC-004-b
import { test, expect } from "@playwright/test";
import { signIn, addTodo, openTodo, todoRow } from "../lib/todoApp";

test("AC-004-b: unmarking a completed todo returns its status to not completed", async ({ page }) => {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  expect(username, "AEP_E2E_USERNAME must be set").toBeTruthy();
  expect(password, "AEP_E2E_PASSWORD must be set").toBeTruthy();

  await signIn(page, username!, password!);

  const title = `e2e AC-004-b ${Date.now()}`;
  await addTodo(page, title);

  // 1. Mark it completed first
  await openTodo(page, title);
  await page.getByRole("checkbox", { name: "Completed" }).check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(todoRow(page, title)).toContainText("Done");

  // 2. Open it again and uncheck Completed
  await openTodo(page, title);
  await page.getByRole("checkbox", { name: "Completed" }).uncheck();
  await page.getByRole("button", { name: "Save" }).click();

  // Assert: status returns to "Open"
  await expect(page.getByRole("heading", { name: "My Todos" })).toBeVisible();
  await expect(todoRow(page, title)).toContainText("Open");
});
