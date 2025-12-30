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

        # Mocks
        page.route("**/api/auth/me", lambda route: route.fulfill(status=200, body='{"_id": "user123"}'))
        # IdentityContext fetches /api/identities
        page.route("**/api/identities", lambda route: route.fulfill(
             status=200,
             body='[{"_id": "id1", "name": "Myself", "type": "real"}]'
        ))
        page.route("**/api/settings", lambda route: route.fulfill(status=200, body='{}'))
        page.route("**/api/settings/sessions", lambda route: route.fulfill(status=200, body='[]'))

        # Suggested Users (Search)
        # Includes "Myself" (id1) and "User 3" (id3)
        page.route("**/api/search?q=&type=identities", lambda route: route.fulfill(
             status=200,
             body='{"identities": [{"_id": "id1", "name": "Myself"}, {"_id": "id3", "name": "User 3"}]}'
        ))

        # Inbox
        # Two messages from User 3, one old, one new. Should render ONE item.
        page.route("**/api/messages/inbox", lambda route: route.fulfill(
             status=200,
             body='''[
                {"_id": "m1", "content": "Hello", "createdAt": "2023-01-02T10:00:00Z", "sender": {"_id": "id3", "name": "User 3"}, "recipient": {"_id": "id1", "name": "Myself"}, "read": false},
                {"_id": "m2", "content": "Old msg", "createdAt": "2023-01-01T10:00:00Z", "sender": {"_id": "id3", "name": "User 3"}, "recipient": {"_id": "id1", "name": "Myself"}, "read": true}
             ]'''
        ))

        page.goto("http://localhost:5177/login")
        page.evaluate(f"""() => {{
            localStorage.setItem('accessToken', 'fake-jwt-token');
            localStorage.setItem('user', '{str(user_data).replace("'", '"')}');
        }}""")

        print("Navigating to Chat...")
        page.goto("http://localhost:5177/chat")
        time.sleep(3) # Wait for all fetches

        # 1. Verify Suggested Users Filtering
        try:
            expect(page.get_by_text("Myself")).not_to_be_visible()
            print("SUCCESS: 'Myself' filtered from suggestions.")
        except:
            print("FAILURE: 'Myself' visible in suggestions.")

        try:
            expect(page.get_by_text("User 3")).to_be_visible()
            print("SUCCESS: 'User 3' visible in suggestions.")
        except:
             print("FAILURE: 'User 3' not found in suggestions.")

        # 2. Verify Inbox Deduplication
        # Count occurences of "User 3".
        # If deduplication works, we see one in Suggestions and one in Inbox. Total 2.
        # If duplicated in Inbox, Total 3.

        count = page.get_by_text("User 3").count()
        print(f"Count of 'User 3': {count}")

        page.screenshot(path="/home/jules/verification/messages_dedupe_v3.png")
        browser.close()

if __name__ == "__main__":
    verify_frontend_changes()
