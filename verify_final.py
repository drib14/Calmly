import time
from playwright.sync_api import sync_playwright, expect

def verify_frontend_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        # Mock User Data
        user_data = {
            "_id": "user123",
            "name": "Test User",
            "settings": {"journalLocked": True}
        }

        # Mocks
        page.route("**/api/auth/me", lambda route: route.fulfill(status=200, body='{"_id": "user123", "settings": {"journalLocked": true}}'))
        page.route("**/api/settings", lambda route: route.fulfill(status=200, body='{"journalLocked": true}'))

        # 1. Login & Setup
        page.goto("http://localhost:5177/login")
        page.evaluate(f"""() => {{
            localStorage.setItem('accessToken', 'fake-jwt-token');
            localStorage.setItem('user', '{str(user_data).replace("'", '"').replace("True", "true")}');
        }}""")

        # 2. Check Journal Lock
        print("Navigating to Journal...")
        page.goto("http://localhost:5177/journal")
        time.sleep(2)
        try:
            expect(page.get_by_text("Journal Locked")).to_be_visible()
            print("SUCCESS: Journal Locked Verified.")
        except:
            print("FAILURE: Journal NOT Locked.")

        # 3. Check Settings Modal PIN
        print("Navigating to Settings...")
        page.goto("http://localhost:5177/settings")
        time.sleep(1)

        # Click Personal Journal
        page.get_by_text("Personal Journal").click()
        time.sleep(1)
        # Click Lock Journal
        page.get_by_text("Lock Journal with Password").click()
        time.sleep(1)

        try:
            expect(page.get_by_text("Create a 4-digit PIN")).to_be_visible()
            print("SUCCESS: PIN Input Verified.")
        except:
             print("FAILURE: PIN Input NOT Found.")

        page.screenshot(path="/home/jules/verification/final_check.png")
        print("Final screenshot saved.")

        browser.close()

if __name__ == "__main__":
    verify_frontend_changes()
