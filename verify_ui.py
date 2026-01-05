import time
from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("Navigating to Login...")
        page.goto("http://localhost:5173/login")

        # Use known credentials from curl
        print("Filling login credentials...")
        page.wait_for_selector("input[type='email']")
        page.fill("input[type='email']", "test@test.com")
        page.fill("input[type='password']", "password")
        page.click("button[type='submit']")

        print("Waiting for feed...")
        page.wait_for_url("**/feed")
        print("Logged in!")

        # Mock Data for Chat (Shared Posts & Reply Bubble)
        print("Mocking Chat API...")

        # Mock Inbox
        page.route("**/api/messages/inbox", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='''[
                {
                    "_id": "msg1",
                    "sender": {"_id": "other1", "name": "Chat Partner", "handle": "@partner", "type": "real"},
                    "recipient": {"_id": "me", "name": "Test User", "handle": "@test", "type": "real"},
                    "content": "Hello",
                    "createdAt": "2023-10-27T10:00:00.000Z",
                    "read": false
                }
            ]'''
        ))

        # Mock Conversation with the specific UI elements we need to verify
        page.route("**/api/messages/conversation**", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='''[
                {
                    "_id": "m1",
                    "sender": {"_id": "me", "name": "Test User", "handle": "@test", "type": "real"},
                    "recipient": {"_id": "other1", "name": "Chat Partner", "handle": "@partner", "type": "real"},
                    "sharedPost": {
                        "_id": "p1",
                        "content": "This is a shared post with media and long text to test truncation logic in the card.",
                        "type": "plain",
                        "identity": {"name": "Original Poster", "handle": "@op"},
                        "media": [
                            {"url": "https://via.placeholder.com/500/0000FF/808080?Text=FirstImage", "type": "image"},
                            {"url": "https://via.placeholder.com/500", "type": "image"}
                        ]
                    },
                    "createdAt": "2023-10-27T10:05:00.000Z"
                },
                {
                    "_id": "m2",
                    "sender": {"_id": "me", "name": "Test User", "handle": "@test", "type": "real"},
                    "recipient": {"_id": "other1", "name": "Chat Partner", "handle": "@partner", "type": "real"},
                    "sharedPost": {
                        "_id": "p2",
                        "content": "Pure text shared post. This should use the text as a thumbnail and look elegant.",
                        "type": "plain",
                        "identity": {"name": "Text Poster", "handle": "@textop"},
                        "media": []
                    },
                    "createdAt": "2023-10-27T10:06:00.000Z"
                },
                {
                    "_id": "m4",
                    "sender": {"_id": "me", "name": "Test User", "handle": "@test", "type": "real"},
                    "recipient": {"_id": "other1", "name": "Chat Partner", "handle": "@partner", "type": "real"},
                    "sharedPost": {
                        "identity": null
                    },
                    "createdAt": "2023-10-27T10:06:00.000Z"
                },
                {
                    "_id": "m3",
                    "sender": {"_id": "me", "name": "Test User", "handle": "@test", "type": "real"},
                    "recipient": {"_id": "other1", "name": "Chat Partner", "handle": "@partner", "type": "real"},
                    "replyToQuote": {
                        "content": "This is the quote I am replying to."
                    },
                    "content": "Here is my reply to that quote!",
                    "createdAt": "2023-10-27T10:07:00.000Z"
                }
            ]'''
        ))

        print("Navigating to Chat...")
        page.goto("http://localhost:5173/chat")

        try:
             # Click conversation
             print("Waiting for conversation...")
             # Wait for network idle to ensure inbox loaded
             page.wait_for_load_state("networkidle")

             # Locate text
             page.locator("text=Chat Partner").first.click(timeout=10000)
             time.sleep(2)
             page.screenshot(path="verification_chat.png")
             print("Chat screenshot taken.")
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")

        # Verify 404
        print("Verifying 404 Page...")
        page.goto("http://localhost:5173/some/random/route")
        page.wait_for_selector("text=Lost in Space")
        page.screenshot(path="verification_404.png")
        print("404 screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_ui()
