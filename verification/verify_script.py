from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We need to load the frontend from the server.
        # Since I cannot easily start the full stack server and keep it running in background within this restricted environment comfortably
        # and the instructions say "Before you can verify your changes, you must start the local development server".
        # I will attempt to start the client dev server in background.

        # NOTE: In this environment, I can't easily see the output of background processes.
        # I'll rely on the existing code structure.
        # However, to verify 'CreatePost' changes, I need to be logged in.
        # I'll mock the localStorage to simulate login if possible, or just visit the page if it renders without auth (it redirects usually).

        # Actually, I'll try to verify the 'Plain' option in CreatePost code by checking the DOM if I can render it.
        # Or I can verify the QuoteViewerModal by rendering it in isolation? No, hard in E2E.

        # Let's try to verify the Feed page has the new Sidebar sticky class?
        # And CreatePost has 'Plain' option.

        page = browser.new_page()

        # I'll assume the app is running on 5173. I need to start it first.
        # But I'll do that in a separate bash command.

        try:
            page.goto("http://localhost:5173/create")

            # Mock Auth if redirected (likely)
            # This is hard without a real backend running.
            # If backend is not running, frontend might fail to load /create due to auth check.

            # Alternative: Visual verification of components via unit tests is better here, but I must use Playwright per instructions.
            # I will try to login if the backend is running.

            # Wait for selector
            page.wait_for_selector('text=Format', timeout=5000)

            # Check for "Plain" option
            content = page.content()
            if "Plain" in content:
                print("Plain option found!")
            else:
                print("Plain option NOT found.")

            page.screenshot(path="verification/create_post_plain.png")

        except Exception as e:
            print(f"Error: {e}")

        browser.close()

if __name__ == "__main__":
    verify_changes()
