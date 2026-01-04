from playwright.sync_api import sync_playwright, expect
import time

def verify_full_workflow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Listen for console logs
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

        unique_id = int(time.time())
        email = f"test{unique_id}@example.com"
        password = "password123"

        print(f"Test Credentials: {email} / {password}")

        # 1. Register
        print("Registering new user...")
        page.goto('http://localhost:5173/register')
        page.fill('input[placeholder="John Doe"]', f'Test User {unique_id}')
        page.fill('input[type="email"]', email)
        page.fill('input[type="password"]', password)
        page.check('input[type="checkbox"]')
        page.click('button[type="submit"]')

        # Wait for "Registration successful" message
        expect(page.get_by_text("Registration successful! Welcome.")).to_be_visible()

        # Wait for auto-redirect
        print("Waiting for auto-redirect to login...")
        page.wait_for_url('**/login', timeout=5000)

        # 2. Login
        print("Logging in...")
        # Ensure we are on login page
        expect(page.get_by_text("Welcome Back")).to_be_visible()

        # Type slower to ensure React state updates
        page.type('input[type="email"]', email, delay=50)
        page.type('input[type="password"]', password, delay=50)
        page.click('button:has-text("Log In")')

        # Wait for feed
        print("Waiting for feed redirect...")
        try:
            page.wait_for_url('**/feed', timeout=10000)
        except:
            print("Redirect timeout/failure. Screenshotting state.")
            page.screenshot(path='verification/login_fail_debug.png')
            raise

        print('Registration and Login Successful')

        # 3. Verify Quote Bubble Shape
        print("Verifying Quote Bubble...")
        # Feed might take a moment to load widgets
        page.wait_for_timeout(3000)
        page.screenshot(path='verification/feed_quote_bubble.png')
        print('Captured Quote Bubble Screenshot')

        # 4. Test Settings - Quotes
        print("Testing Quote Settings...")
        page.goto('http://localhost:5173/settings')
        page.click('text="Quotes & Moments"')

        # Click the specific setting item to open modal
        print("Opening 'Who Can Reply to Quotes' setting...")
        page.click('text="Who Can Reply to Quotes"')

        # Select "followers"
        print("Selecting 'followers' option...")
        try:
            # First try the raw value/label
            page.click('text="followers"', timeout=3000)
        except:
            # SelectionCard might capitalize labels or user accessible name
            # Based on code it's "followers".
            # Try to click by role if text fails
            print("Text click failed, trying button role...")
            # We look for a button that contains the text "followers"
            # get_by_role("button", name="followers") looks for accessible name (aria-label or text content)
            page.get_by_role("button", name="followers").click()

        page.wait_for_timeout(1000)

        # Close modal by clicking outside
        page.mouse.click(10, 10)
        print('Updated Quote Settings')

        # 5. Test Post Menu Actions
        print("Testing Post Menu Actions...")
        page.goto('http://localhost:5173/feed')

        # Create a post
        page.goto('http://localhost:5173/create')
        page.fill('textarea', f'Test Post {unique_id}')
        page.click('button:has-text("Post")')
        page.wait_for_url('**/feed')

        # Find the post menu (3 dots) of the NEW post (first one)
        # We assume the new post is at the top
        menu_button = page.locator('button:has(svg.lucide-more-horizontal)').first
        menu_button.click()

        # Click Edit
        page.click('text="Edit Post"')
        expect(page.locator('text="Edit Post"')).to_be_visible()

        # Edit content
        page.fill('textarea', f'Test Post {unique_id} Edited')
        page.click('button:has-text("Save Changes")')

        # Verify content changed
        expect(page.get_by_text(f'Test Post {unique_id} Edited')).to_be_visible()
        print('Post Edited Successfully')

        # 6. Test Chat Shared Post Rendering
        print("Testing Chat Shared Post...")
        # Share the post
        # Need to open menu again? No, Share button is on card

        # Find Share button
        share_button = page.locator('button:has(svg.lucide-share-2)').first
        share_button.click()

        # Click "Share as Message"
        page.click('text="Share as Message"') # Share modal open

        # Search for self
        page.fill('input[placeholder="Search users..."]', f'Test User {unique_id}')
        page.wait_for_timeout(2000)
        # Click the user
        page.click(f'text=Test User {unique_id}')
        page.click('button:has-text("Send")')

        # Go to messages
        page.goto('http://localhost:5173/messages')
        # Click conversation
        page.click(f'text=Test User {unique_id}')

        # Verify Shared Post Bubble
        expect(page.locator('text="Shared Post"')).to_be_visible()
        page.screenshot(path='verification/chat_shared_post.png')
        print('Chat Shared Post Verified')

        browser.close()

if __name__ == "__main__":
    verify_full_workflow()
