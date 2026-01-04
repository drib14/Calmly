import { test, expect } from '@playwright/test';

// Unique user for this test run
const timestamp = Date.now();
const email = `testuser${timestamp}@example.com`;
const password = 'Password123!';

test.describe.serial('Calmly Platform E2E Tests', () => {

  test('1. Registration and Onboarding', async ({ page }) => {
    await page.goto('/register');

    // Fill Registration Form
    await page.fill('input[type="text"]', 'Test User'); // Name
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Checkbox for Terms
    await page.click('input[type="checkbox"]');

    // Submit
    await page.click('button[type="submit"]');

    // Expect redirection to Feed (App does window.location.href = '/feed')
    await expect(page).toHaveURL(/\/feed/);

    // Check for "Moments" header (Feed page)
    await expect(page.locator('h1:has-text("Moments")')).toBeVisible();
  });

  test('2. Feed and Navigation', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/feed/);

    // Check Navigation Sidebar (Desktop)
    // We expect the side nav to be visible
    const nav = page.locator('nav').filter({ hasText: 'Home' }).first();
    await expect(nav).toBeVisible();
  });

  test.fixme('3. Profile and Quotes', async ({ page }) => {
     // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await page.goto('/feed');

    // Verify Quotes Widget container exists
    const widget = page.locator('.custom-scrollbar').first();
    await expect(widget).toBeVisible();

    // The first child of widget is the "My Quote" slot.
    const mySlot = widget.locator('> div').first();
    await expect(mySlot).toBeVisible();
    await mySlot.click();

    // Modal should appear
    await expect(page.locator('text=New Quote')).toBeVisible();

    // Type content
    await page.fill('textarea', 'This is a test quote.');

    // Select Mood (Click "Happy")
    await page.click('text=Happy');

    // Submit
    await page.click('button:has-text("Share")');

    // Expect Modal to close
    await expect(page.locator('text=New Quote')).not.toBeVisible();

    // Expect Quote to be visible in the widget
    await expect(page.locator('text=This is a test quote.')).toBeVisible();

    // Now View the Quote (Click it)
    await page.locator('text=This is a test quote.').click();

    // Expect "Your Quote" Modal with "Replace" and "Delete"
    await expect(page.locator('text=Your Quote')).toBeVisible();
    await expect(page.locator('text=This is a test quote.')).toBeVisible();
    await expect(page.locator('button:has-text("Replace")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();

    // Delete the quote to clean up
    await page.click('button:has-text("Delete")');

    await expect(page.locator('text=Your Quote')).not.toBeVisible(); // Modal closed
    await expect(page.locator('text=This is a test quote.')).not.toBeVisible(); // Quote gone
  });

  test('4. Settings and Delete Account', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await page.goto('/settings');

    // Wait for Settings Header
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();

    // Check Dark Mode Toggle (Appearance)
    // Find Appearance card using partial text match inside h3
    await page.click('h3:has-text("Appearance")');
    await expect(page.locator('text=Theme')).toBeVisible();

    // Go back
    await page.click('button >> .lucide-chevron-left');

    // Check Account Settings
    await page.click('h3:has-text("Account Settings")');

    // Test Delete Account
    await page.click('text=Soft Delete Account');

    // Check Confirmation Modal
    await expect(page.locator('text=Delete Account?')).toBeVisible();
    await expect(page.locator('text=Delete Forever')).toBeVisible();

    // Confirm
    await page.click('button:has-text("Delete Forever")');

    // Expect redirect to Login
    await expect(page).toHaveURL(/\/login/);
  });

});
