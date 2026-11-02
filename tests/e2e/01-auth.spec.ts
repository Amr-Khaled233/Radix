import { expect, test } from "@playwright/test";
import { lastEmailLink, OWNER, signIn } from "./helpers";

test.describe("authentication", () => {
  test("signed-out visitors are sent to the login page", async ({ page }) => {
    await page.goto("/admin/projects");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("wrong password shows a generic error; right password signs in", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email", { exact: true }).fill(OWNER.email);
    await page.getByLabel("Password", { exact: true }).fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("The email or password is incorrect.")).toBeVisible();

    await signIn(page);
    await expect(page.getByRole("heading", { name: /Welcome, E2E Owner/ })).toBeVisible();
  });

  test("forgot password → emailed link → new password → sign in", async ({ page }) => {
    await page.goto("/admin/forgot-password");
    await page.getByLabel("Email", { exact: true }).fill(OWNER.email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("If an account exists")).toBeVisible();

    await expect
      .poll(() => {
        try {
          return lastEmailLink(OWNER.email);
        } catch {
          return null;
        }
      })
      .not.toBeNull();
    await page.goto(lastEmailLink(OWNER.email));
    await page.getByLabel("New password", { exact: true }).fill("e2e-owner-password-2");
    await page.getByLabel("Confirm new password").fill("e2e-owner-password-2");
    await page.getByRole("button", { name: "Save password" }).click();
    await expect(page).toHaveURL(/\/admin\/login\?reset=1/);

    await signIn(page, OWNER.email, "e2e-owner-password-2");
    OWNER.password = "e2e-owner-password-2";
  });
});
