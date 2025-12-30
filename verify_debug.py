import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        user_data = {
            "_id": "user123",
            "name": "Test User",
            "settings": {"theme": "soft-light"}
        }

        page.route("**/api/auth/me", lambda route: route.fulfill(status=200, body='{"_id": "user123"}'))
        page.route("**/api/identities", lambda route: route.fulfill(status=200, body='[{"_id": "id1", "name": "Myself"}]'))
        page.route("**/api/search?q=&type=identities", lambda route: route.fulfill(status=200, body='{"identities": []}'))
        page.route("**/api/messages/inbox", lambda route: route.fulfill(status=200, body='[]'))
        page.route("**/api/settings", lambda route: route.fulfill(status=200, body='{}'))

        page.goto("http://localhost:5177/login")
        page.evaluate(f"""() => {{
            localStorage.setItem('accessToken', 'fake-jwt-token');
            localStorage.setItem('user', '{str(user_data).replace("'", '"')}');
        }}""")

        page.goto("http://localhost:5177/chat")
        time.sleep(3)
        page.screenshot(path="/home/jules/verification/debug_screenshot.png")
        browser.close()

if __name__ == "__main__":
    run()
