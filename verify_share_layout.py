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
        # Mock Search for Share Modal
        page.route("**/api/search?q=&type=identities", lambda route: route.fulfill(
            status=200,
            body='{"identities": [{"_id": "1", "name": "User 1"}, {"_id": "2", "name": "User 2"}, {"_id": "3", "name": "User 3"}]}'
        ))

        page.goto("http://localhost:5177/login")
        page.evaluate(f"""() => {{
            localStorage.setItem('accessToken', 'fake-jwt-token');
            localStorage.setItem('user', '{str(user_data).replace("'", '"')}');
        }}""")

        # We need to open ShareModal. It's usually on a PostCard.
        # Let's mock a Feed with one post.
        page.route("**/api/posts/feed?page=1&limit=10", lambda route: route.fulfill(
             status=200,
             body='{"posts": [{"_id": "p1", "content": "Test Post", "identity": {"name": "Author"}}], "hasMore": false}'
        ))

        print("Navigating to Feed...")
        page.goto("http://localhost:5177/feed")
        time.sleep(2)

        # Click Share button on the post (assuming it's visible)
        # We need to find the share button. It might be an icon.
        # In PostCard, it's typically a Share2 or similar icon.
        # Let's try to find a button with "Share" label or aria-label?
        # Or I can just render the ShareModal directly if I could, but integration test is better.
        # I'll look for the share icon SVG or button.

        # Assuming there is a button that opens the modal.
        # I'll take a screenshot of the feed first to see if buttons are there.
        page.screenshot(path="/home/jules/verification/feed_debug.png")

        # Try to find the button. In PostCard:
        # <button ... onClick={() => setShowShareModal(true)} ...> <Share2 ... /> </button>
        # It's usually in the footer of the card.
        # Let's try clicking the 3rd button in the action bar?
        # Or look for SVG.

        # Strategy: Select by role button, look for one that might be share.
        # Usually: Like, Comment, Share.
        buttons = page.get_by_role("button").all()
        # Just click them until modal opens? No.

        # Let's assume the share button is distinguishable.
        # I will just verify the screenshot of the Feed for now, and if I can't find the button easily, I'll rely on code review.
        # But wait, I need to verify the Horizontal Layout.
        # I'll try to find the share button by selector if possible.
        # PostCard > div > div > button (Share)
        # Let's use CSS selector for the icon.

        # Click the share button (assuming it's the last one or identifiable)
        # page.locator("button:has(svg.lucide-share-2)").click() # Assuming lucide class

        # Actually, let's just inspect the screenshot I just took.

        browser.close()

if __name__ == "__main__":
    verify_frontend_changes()
