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
            "settings": {"theme": "soft-light"}
        }

        # Mock Auth
        page.route("**/api/auth/me", lambda route: route.fulfill(status=200, body='{"_id": "user123", "name": "Test User", "identities": [{"_id": "id1"}, {"_id": "id2"}]}'))
        page.route("**/api/settings", lambda route: route.fulfill(status=200, body='{}'))
        page.route("**/api/settings/sessions", lambda route: route.fulfill(status=200, body='[]'))

        # Mock Suggested Users (Search)
        # We deliberately include the user's own identity "id1" to test filtering
        page.route("**/api/search?q=&type=identities", lambda route: route.fulfill(
             status=200,
             body='{"identities": [{"_id": "id1", "name": "Myself"}, {"_id": "id3", "name": "User 3"}]}'
        ))

        # Mock Inbox
        # Return two messages from "User 3" to simulate duplicate threads if logic fails
        # Message 1: From User 3
        # Message 2: From User 3 (Older)
        page.route("**/api/messages/inbox", lambda route: route.fulfill(
             status=200,
             body='''[
                {"_id": "m1", "content": "Hello", "createdAt": "2023-01-02T10:00:00Z", "sender": {"_id": "id3", "name": "User 3"}, "recipient": {"_id": "id1", "name": "Myself"}, "read": false},
                {"_id": "m2", "content": "Old msg", "createdAt": "2023-01-01T10:00:00Z", "sender": {"_id": "id3", "name": "User 3"}, "recipient": {"_id": "id1", "name": "Myself"}, "read": true}
             ]'''
        ))

        # Need to provide identities via Context.
        # IdentityContext fetches /api/auth/me usually? Or /api/identities?
        # Let's check IdentityContext logic if possible, but usually it relies on auth.
        # Wait, IdentityContext fetches  from  or ?
        # We need to ensure  hook gets populated.
        # Assuming  fetches  or similar.
        # Let's mock that if it exists.

        # Mock /api/auth/me to return identities? Or distinct endpoint.
        # We'll just mock /api/identities if that's what it uses.
        # Or /api/users/me/identities.
        # Actually, let's just mock /api/auth/me with populated identities if that's how it works.
        # But  likely fetches separate.
        # Let's mock a common pattern:
        page.route("**/api/identities/me", lambda route: route.fulfill(
            status=200,
            body='[{"_id": "id1", "name": "Myself"}]'
        ))
        # Also mock /api/auth/me again just in case
        page.route("**/api/auth/me", lambda route: route.fulfill(
            status=200,
            body='{"_id": "user123", "identities": [{"_id": "id1", "name": "Myself"}]}'
        ))

        page.goto("http://localhost:5177/login")
        page.evaluate(f"""() => {{
            localStorage.setItem('accessToken', 'fake-jwt-token');
            localStorage.setItem('user', '{str(user_data).replace("'", '"')}');
        }}""")

        print("Navigating to Chat...")
        page.goto("http://localhost:5177/chat")
        time.sleep(2)

        # 1. Verify Suggested Users Filtering
        # "Myself" (id1) should be filtered out. "User 3" should be visible.
        # We check if text "Myself" is present in the suggested area.
        try:
            expect(page.get_by_text("Myself")).not_to_be_visible()
            print("SUCCESS: 'Myself' filtered from suggestions.")
        except:
            print("FAILURE: 'Myself' visible in suggestions.")

        try:
            expect(page.get_by_text("User 3")).to_be_visible()
            print("SUCCESS: 'User 3' visible in suggestions.")
        except:
             print("FAILURE: 'User 3' not found.")

        # 2. Verify Inbox Deduplication
        # We sent 2 messages involving "User 3".
        # We expect only ONE entry for "User 3" in the sidebar list.
        # We can count elements with text "User 3".
        # Note: "User 3" appears in Suggestions AND Inbox.
        # We should scope the search to the Inbox List.
        # The inbox list is usually in the sidebar below suggestions.
        # Let's count total occurrences. If filtered correctly:
        # Suggestion: User 3 (1)
        # Inbox: User 3 (1)
        # Total: 2.
        # If duplicated in Inbox: Total 3.

        count = page.get_by_text("User 3").count()
        print(f"Count of 'User 3': {count}")

        page.screenshot(path="/home/jules/verification/messages_dedupe.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend_changes()
