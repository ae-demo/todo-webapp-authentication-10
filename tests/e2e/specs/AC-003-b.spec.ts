// spec: tests/validation/test-plan.md § AC-003-b
import { test, expect } from "@playwright/test";
import { signIn, addTodo, todoRow } from "../lib/todoApp";

test.setTimeout(60_000);

test("AC-003-b: a user never sees another user's todos in their list", async ({ browser }) => {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  const username2 = process.env.AEP_E2E_USERNAME_2;
  const password2 = process.env.AEP_E2E_PASSWORD_2;
  expect(username, "AEP_E2E_USERNAME must be set").toBeTruthy();
  expect(password, "AEP_E2E_PASSWORD must be set").toBeTruthy();
  expect(username2, "AEP_E2E_USERNAME_2 must be set").toBeTruthy();
  expect(password2, "AEP_E2E_PASSWORD_2 must be set").toBeTruthy();

  // 1. Context A: sign in as user A, add a uniquely-titled todo
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await signIn(pageA, username!, password!);
  const title = `e2e AC-003-b ${Date.now()}`;
  await addTodo(pageA, title);
  await contextA.close();

  // 2. Context B (separate, no shared storage): sign in as user B
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await signIn(pageB, username2!, password2!);

  // Assert: user B's list does not contain user A's todo
  await expect(todoRow(pageB, title)).toHaveCount(0);
  await contextB.close();
});
