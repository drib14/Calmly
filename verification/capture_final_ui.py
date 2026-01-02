from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            storage_state={
                "cookies": [],
                "origins": [
                    {
                        "origin": "http://localhost:5173",
                        "localStorage": [
                             {"name": "token", "value": "mock_token"},
                             {"name": "user", "value": '{"_id":"user1","name":"Test User","settings":{}}'},
                             {"name": "identity_user1", "value": '{"_id":"id1","name":"Real ID","handle":"@real"}'}
                        ]
                    }
                ]
            }
        )
        page = context.new_page()

        # Mock API calls to prevent "Feed doesn't fetch" error
        page.route("**/api/auth/me", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"_id":"user1","username":"testuser","email":"test@example.com","settings":{}}'
        ))

        page.route("**/api/identities", lambda route: route.fulfill(
             status=200,
             content_type="application/json",
             body='[{"_id":"id1","user":"user1","name":"Real ID","handle":"@real","type":"real"}]'
        ))

        # Mock Feed
        page.route("**/api/posts/feed*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[]'
        ))

        # Mock Quotes Feed
        page.route("**/api/quotes/feed", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[{"_id":"q1","content":"This is a quote","mood":"Happy","identity":{"_id":"id2","name":"Friend","handle":"@friend","avatar":""},"createdAt":"2023-10-27T10:00:00Z"}]'
        ))

        # Mock Clips Feed
        page.route("**/api/clips/feed", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[]'
        ))

        # 1. Feed Page (Check StoriesWidget)
        print("Navigating to Feed...")
        page.goto("http://localhost:5173/feed")
        time.sleep(3)
        page.screenshot(path="verification/final_feed.png")
        print("Captured Feed.")

        # 2. Profile Page (Check Tabs removal and new layout)
        print("Navigating to Profile...")

        # Mock Profile Data
        page.route("**/api/profile/@real", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"identity":{"_id":"id1","name":"Real ID","handle":"@real","user":{"_id":"user1"}},"posts":[],"reposts":[],"quote":null,"clips":[],"archives":[]}'
        ))

        page.goto("http://localhost:5173/profile/@real")
        time.sleep(3)
        page.screenshot(path="verification/final_profile.png")
        print("Captured Profile.")

        browser.close()

if __name__ == "__main__":
    run()
