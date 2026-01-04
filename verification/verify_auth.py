from playwright.sync_api import sync_playwright
import time

def verify_auth():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # 1. Login Page
        print("Navigating to Login...")
        page.goto("http://localhost:5173/login")
        # Wait for load
        page.wait_for_selector("text=Welcome Back", timeout=5000) # Assuming title
        page.screenshot(path="verification/verification_login.png")
        print("Screenshot: verification_login.png")

        # 2. Register & Auto-Login
        print("Navigating to Register...")
        page.goto("http://localhost:5173/register")
        page.fill('input[type="text"]', 'Auth Tester')
        email = f"authtest{int(time.time())}@example.com"
        page.fill('input[type="email"]', email)
        page.fill('input[type="password"]', "Password123!")
        page.click('input[type="checkbox"]')
        page.click('button[type="submit"]')

        # Verify Auto-Login -> Feed
        print("Waiting for Feed...")
        page.wait_for_url("**/feed")
        # Check for "Moments" header
        page.wait_for_selector("h1:has-text('Moments')")
        page.screenshot(path="verification/verification_feed_after_register.png")
        print("Screenshot: verification_feed_after_register.png")

        # 3. Logout
        print("Logging out...")
        page.goto("http://localhost:5173/settings")

        # Wait for settings
        page.wait_for_selector("h1:has-text('Settings')")

        # Click "Account Settings" (h3)
        page.click("h3:has-text('Account Settings')")

        # Click "Log out from all devices"
        page.click("text=Log out from all devices")

        # Confirm Modal "Log Out"
        page.click("button:has-text('Log Out')")

        # Verify Redirect to Login
        print("Waiting for Login after Logout...")
        page.wait_for_url("**/login")
        page.wait_for_selector("text=Welcome Back")
        page.screenshot(path="verification/verification_login_after_logout.png")
        print("Screenshot: verification_login_after_logout.png")

        browser.close()

if __name__ == "__main__":
    verify_auth()
