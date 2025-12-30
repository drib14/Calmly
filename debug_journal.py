from playwright.sync_api import sync_playwright

def debug():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        user_data = {
            "_id": "user123",
            "name": "Test User",
            "settings": {"journalLocked": True}
        }

        page.goto("http://localhost:5177/login")
        page.evaluate(f"""() => {{
            localStorage.setItem('user', '{str(user_data).replace("'", '"').replace("True", "true")}');
            localStorage.setItem('token', 'fake-jwt-token');
        }}""")

        page.route("**/api/auth/me", lambda route: route.fulfill(
            status=200,
            body='{"_id": "user123", "settings": {"journalLocked": true}}'
        ))

        page.goto("http://localhost:5177/journal")
        page.wait_for_timeout(3000)
        page.screenshot(path="/home/jules/verification/debug_journal.png")
        browser.close()

if __name__ == "__main__":
    debug()
