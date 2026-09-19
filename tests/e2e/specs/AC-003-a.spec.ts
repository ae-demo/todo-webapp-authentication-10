// spec: tests/validation/test-plan.md § AC-003-a
import { test, expect } from "@playwright/test";
import { signIn, addTodo, todoRow } from "../lib/todoApp";

test("AC-003-a: the todo list screen shows every todo belonging to the signed-in user", async ({
  page,
}) => {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  expect(username, "AEP_E2E_USERNAME must be set").toBeTruthy();
  expect(password, "AEP_E2E_PASSWORD must be set").toBeTruthy();

  await signIn(page, username!, password!);

  const marker = Date.now();
  const titleA = `e2e AC-003-a-A ${marker}`;
  const titleB = `e2e AC-003-a-B ${marker}`;
  await addTodo(page, titleA);
  await addTodo(page, titleB);

  // Assert: both todos are shown
  await expect(todoRow(page, titleA)).toBeVisible();
  await expect(todoRow(page, titleB)).toBeVisible();
});
