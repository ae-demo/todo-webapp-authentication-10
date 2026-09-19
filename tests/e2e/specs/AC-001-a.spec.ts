// spec: tests/validation/test-plan.md § AC-001-a
import { test, expect } from "@playwright/test";

test("AC-001-a: an unauthenticated visitor is presented with a sign-in flow before seeing any todos", async ({
  page,
}) => {
  // 1. Navigate to / with no session
  await page.goto("/");
  // 2. The IdP's sign-in form appears before any todo content
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "My Todos" })).toHaveCount(0);
});
