// spec: tests/validation/test-plan.md § AC-007-b
import { test, expect } from "@playwright/test";
import { signIn, addTodo, todoRow } from "../lib/todoApp";

test.setTimeout(60_000);

test("AC-007-b: todos added in one session are visible when signing in again from a different browser session", async ({
  browser,
}) => {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  expect(username, "AEP_E2E_USERNAME must be set").toBeTruthy();
  expect(password, "AEP_E2E_PASSWORD must be set").toBeTruthy();

  // 1. Browser context A (fresh storage): sign in, add a uniquely-titled todo
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await signIn(pageA, username!, password!);
  const title = `e2e AC-007-b ${Date.now()}`;
  await addTodo(pageA, title);
  await contextA.close();

  // 2. Browser context B (separate, fresh storage): sign in as the same user
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await signIn(pageB, username!, password!);

  // Assert: the todo added in context A is visible in context B
  await expect(todoRow(pageB, title)).toBeVisible();
  await contextB.close();
});
