import time
from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        try:
            # 1. Check Homepage/Login
            print("Navigating to Home...")
            page.goto("http://localhost:5173/")
            page.wait_for_load_state("networkidle")

            # Screenshot Home/Login
            page.screenshot(path="verification/0_home.png")
            print("Captured Home.")

            # If redirected to login (likely), take screenshot
            if "login" in page.url:
                print("Redirected to Login.")
                page.screenshot(path="verification/0_login.png")

            # We can't register because backend is failing due to no Mongo.
            # But we can inspect the visual state of the Login/Register page at least.

            # Go to Register explicitly
            page.goto("http://localhost:5173/register")
            page.wait_for_load_state("networkidle")
            page.screenshot(path="verification/0_register.png")
            print("Captured Register.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
