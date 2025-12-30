import time
from playwright.sync_api import sync_playwright, expect

def verify_frontend_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Set viewport
        page.set_viewport_size({"width": 1280, "height": 720})

        # Define User Data
        user_data = {
            "_id": "user123",
            "name": "Test User",
            "email": "test@example.com",
            "settings": {
                "journalLocked": True,
                "theme": "soft-light"
            }
        }

        # 1. Setup Mock Routes (BEFORE Navigation)
        # Mock /api/auth/me - IMPORTANT: This validates the user session
        page.route("**/api/auth/me", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"_id": "user123", "name": "Test User", "settings": {"journalLocked": true}}'
        ))

        # Mock /api/auth/refresh (prevent 401 loop if attempted)
        page.route("**/api/auth/refresh", lambda route: route.fulfill(
            status=200,
            body='{"accessToken": "fake-jwt-token"}'
        ))

        # Mock /api/settings
        page.route("**/api/settings", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"journalLocked": true, "theme": "soft-light"}'
        ))

        # Mock /api/profile/testuser
        page.route("**/api/profile/testuser", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"identity": {"_id": "id1", "name": "Test User", "handle": "@testuser", "avatar": "https://via.placeholder.com/150", "coverPhoto": "https://via.placeholder.com/600x200"}, "posts": []}'
        ))

        # Mock /api/settings/sessions
        page.route("**/api/settings/sessions", lambda route: route.fulfill(
            status=200, body='[]'
        ))

        # Mock /api/messages/unread-count
        page.route("**/api/messages/unread-count", lambda route: route.fulfill(
            status=200, body='{"count": 0}'
        ))

        # 2. Navigate to Login Page First (to set localStorage)
        page.goto("http://localhost:5177/login")

        # 3. Inject LocalStorage
        page.evaluate(f"""() => {{
            localStorage.setItem('accessToken', 'fake-jwt-token');
            localStorage.setItem('user', '{str(user_data).replace("'", '"').replace("True", "true")}');
        }}""")

        # 4. Navigate to Journal (Should be locked)
        print("Navigating to Journal...")
        page.goto("http://localhost:5177/journal")
        time.sleep(2) # Wait for component mount/effect

        # 5. Verify Journal Lock
        # Check for PinInput boxes or "Journal Locked" text
        # PinInput renders as multiple inputs, typically
        try:
            expect(page.get_by_text("Journal Locked")).to_be_visible(timeout=5000)
            print("SUCCESS: Journal is Locked.")
        except:
            print("FAILURE: Journal NOT Locked.")
            page.screenshot(path="/home/jules/verification/fail_journal.png")

        # 6. Verify Settings Modal with PIN
        print("Navigating to Settings...")
        page.goto("http://localhost:5177/settings")
        time.sleep(1)

        # Click "Personal Journal"
        page.get_by_text("Personal Journal").click()
        time.sleep(0.5)

        # Click "Lock Journal"
        page.get_by_text("Lock Journal with Password").click()
        time.sleep(0.5)

        # Check for PIN instruction
        try:
            expect(page.get_by_text("Create a 4-digit PIN")).to_be_visible(timeout=5000)
            print("SUCCESS: Settings Modal shows PIN input.")
        except:
            print("FAILURE: Settings Modal missing PIN input.")

        page.keyboard.press("Escape")

        # 7. Verify Profile Avatar Border
        print("Navigating to Profile...")
        page.goto("http://localhost:5177/profile/testuser")
        time.sleep(2)

        page.screenshot(path="/home/jules/verification/verification_final.png")
        print("Screenshot saved to verification_final.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend_changes()
