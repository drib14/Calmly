from playwright.sync_api import sync_playwright

def debug():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        user_data = {
            "_id": "user123",
            "name": "Test User",
            "settings": {"journalLocked": False, "theme": "soft-light"}
        }

        page.route("**/api/auth/me", lambda route: route.fulfill(status=200, body='{"_id": "user123"}'))
        page.route("**/api/settings", lambda route: route.fulfill(status=200, body='{"journalLocked": false}'))

        page.goto("http://localhost:5177/login")
        page.evaluate(f"""() => {{
            localStorage.setItem('accessToken', 'fake-jwt-token');
            localStorage.setItem('user', '{str(user_data).replace("'", '"').replace("False", "false")}');
        }}""")

        page.goto("http://localhost:5177/settings")
        page.wait_for_timeout(1000)

        # Click Personal Journal
        page.get_by_text("Personal Journal").click()
        page.wait_for_timeout(500)

        # Click Lock Journal
        page.get_by_text("Lock Journal with Password").click()
        page.wait_for_timeout(1000)

        page.screenshot(path="/home/jules/verification/debug_settings.png")
        browser.close()

if __name__ == "__main__":
    debug()
