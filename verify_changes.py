import time
from playwright.sync_api import sync_playwright, expect

def verify_frontend_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant permissions for clipboard (optional but good practice)
        context = browser.new_context(permissions=['clipboard-read', 'clipboard-write'])
        page = context.new_page()

        # Set screen size
        page.set_viewport_size({"width": 1280, "height": 720})

        # 1. Mock Authentication
        # Inject local storage to simulate logged-in state
        # We need to set 'token' and 'user' in localStorage before navigation

        user_data = {
            "_id": "user123",
            "name": "Test User",
            "email": "test@example.com",
            "settings": {
                "journalLocked": True,
                "journalPassword": "hash"
            }
        }

        # We need to access the domain to set localStorage
        page.goto("http://localhost:5177/login")

        page.evaluate(f"""() => {{
            localStorage.setItem('user', '{str(user_data).replace("'", '"').replace("True", "true")}');
            localStorage.setItem('token', 'fake-jwt-token');
        }}""")

        # 2. Mock API Responses
        # Mock /api/auth/me
        page.route("**/api/auth/me", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"_id": "user123", "name": "Test User", "settings": {"journalLocked": true}}'
        ))

        # Mock /api/profile/testuser
        page.route("**/api/profile/testuser", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='''{
                "identity": {
                    "_id": "id1",
                    "name": "Test User",
                    "handle": "@testuser",
                    "avatar": "https://via.placeholder.com/150",
                    "coverPhoto": "https://via.placeholder.com/600x200"
                },
                "posts": []
            }'''
        ))

        # Mock /api/settings
        page.route("**/api/settings", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"journalLocked": true, "theme": "soft-light"}'
        ))

        # Mock /api/settings/sessions
        page.route("**/api/settings/sessions", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[]'
        ))

        # Mock /api/journal (should not be called if locked, but just in case)
        page.route("**/api/journal", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[]'
        ))

        # 3. Verify Journal Lock
        print("Navigating to Journal...")
        page.goto("http://localhost:5177/journal")
        time.sleep(2) # Wait for load

        # Expect Lock Icon or Pin Input
        # We look for "Journal Locked" text or PinInput
        expect(page.get_by_text("Journal Locked")).to_be_visible()
        print("Journal Lock Verified.")

        # 4. Verify Settings Modal Descriptions
        print("Opening Settings...")
        page.goto("http://localhost:5177/settings")
        time.sleep(1)

        # Click "Personal Journal" category
        page.get_by_text("Personal Journal").click()
        time.sleep(0.5)

        # Click "Lock Journal" item to open modal
        page.get_by_text("Lock Journal with Password").click()
        time.sleep(0.5)

        # Check if Modal is visible (it uses Portal now)
        # We look for text inside the modal
        expect(page.get_by_text("Create a 4-digit PIN")).to_be_visible()
        print("Settings Modal with PIN Input Verified.")

        # Close modal
        page.keyboard.press("Escape")
        time.sleep(0.5)

        # 5. Verify Profile Avatar Border Removal
        print("Navigating to Profile...")
        page.goto("http://localhost:5177/profile/testuser")
        time.sleep(2)

        # Take screenshot of profile header
        page.screenshot(path="/home/jules/verification/verification.png")
        print("Screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_frontend_changes()
