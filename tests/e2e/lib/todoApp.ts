import { type Page, type Locator, expect } from "@playwright/test";

export async function signIn(page: Page, username: string, password: string): Promise<void> {
  await page.goto("/");
  const usernameBox = page.getByRole("textbox", { name: "Username" });
  await expect(usernameBox).toBeVisible({ timeout: 20_000 });
  await usernameBox.fill(username);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "My Todos" })).toBeVisible({ timeout: 15_000 });
}

export function todoRow(page: Page, title: string): Locator {
  return page.getByRole("row").filter({ hasText: title });
}

export async function addTodo(page: Page, title: string): Promise<void> {
  await page.getByRole("textbox", { name: "Add a new todo…" }).fill(title);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(todoRow(page, title)).toBeVisible();
}

export async function openTodo(page: Page, title: string): Promise<void> {
  await todoRow(page, title).click();
  await expect(page.getByRole("heading", { name: "Edit Todo" })).toBeVisible();
}
