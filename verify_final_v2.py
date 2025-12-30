import time
from playwright.sync_api import sync_playwright, expect

def verify_frontend_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        user_data = {
            "_id": "user123",
            "name": "Test User",
            "settings": {"journalLocked": True}
        }

        page.route("**/api/auth/me", lambda route: route.fulfill(status=200, body='{"_id": "user123", "settings": {"journalLocked": true}}'))
        page.route("**/api/settings", lambda route: route.fulfill(status=200, body='{"journalLocked": true}'))

        page.goto("http://localhost:5177/login")
        page.evaluate(f"""() => {{
            localStorage.setItem('accessToken', 'fake-jwt-token');
            localStorage.setItem('user', '{str(user_data).replace("'", '"').replace("True", "true")}');
        }}""")

        print("Navigating to Settings...")
        page.goto("http://localhost:5177/settings")
        time.sleep(1)

        page.get_by_text("Personal Journal").click()
        time.sleep(1)

        # Text changes based on lock state
        # If locked, it says "Lock Journal with Password" in list, but modal says "Unlock"
        page.get_by_text("Lock Journal with Password").click()
        time.sleep(1)

        try:
            # Check for ANY pin related text
            if page.get_by_text("Enter your journal PIN").is_visible() or page.get_by_text("Create a 4-digit PIN").is_visible():
                print("SUCCESS: PIN UI Verified.")
            else:
                 print("FAILURE: PIN UI Not Found.")
                 page.screenshot(path="/home/jules/verification/fail_settings.png")
        except:
             print("FAILURE: Exception check.")

        browser.close()

if __name__ == "__main__":
    verify_frontend_changes()
