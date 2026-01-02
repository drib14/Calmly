from playwright.sync_api import sync_playwright, expect
import time

def verify_clips_widgets(page):
    # Mocking Authentication
    page.goto("http://localhost:5174/login")

    # Fill in mock data (backend should be running with these credentials or auto-register)
    # Actually, the memory says "users are auto-verified and logged in upon registration".
    # Let's try registering a new user to ensure clean state and fresh access token

    page.goto("http://localhost:5174/register")
    page.get_by_placeholder("John Doe").fill("Test User Clips")
    page.get_by_placeholder("name@example.com").fill("testclips" + str(time.time()) + "@example.com")
    page.get_by_placeholder("••••••••").fill("password123")
    page.get_by_role("checkbox").check() # Terms
    page.get_by_role("button", name="Join Calmly").click()

    # Wait for navigation to Feed
    expect(page).to_have_url("http://localhost:5174/feed", timeout=10000)

    # 1. Verify StoriesWidget is present
    # Look for "Your Note" or "You" text in the widget
    expect(page.get_by_text("You", exact=True)).to_be_visible()

    # 2. Verify "Add Note" button (Plus icon in bubble area) or Card Click for Clip
    # Screenshot the Feed with the widget
    time.sleep(2) # Wait for animations
    page.screenshot(path="verification_feed_quotes.png")

    # 3. Create a Quote
    # Click the "Add Note" button (small plus bubble) if visible, or the card if no clips
    # Our code: If no quote, the bubble area has a plus icon
    # Selector: .absolute.top-2.left-2 (The explicit Add Note button added in previous step)
    # It has title="Add Note"
    page.locator('div[title="Add Note"]').click()

    # Modal should open
    expect(page.get_by_text("Share a thought...")).to_be_visible()
    page.get_by_placeholder("What's on your mind?").fill("This is a test quote for verification.")

    # Select Mood
    page.get_by_text("Happy").click()

    # Submit
    page.get_by_role("button", name="Share Quote").click()

    # Verify Quote appears in widget
    time.sleep(2)
    expect(page.get_by_text("This is a test quote for verification.")).to_be_visible()
    page.screenshot(path="verification_my_quote.png")

    # 4. Click Bubble to Open Viewer
    page.get_by_text("This is a test quote for verification.").click()
    time.sleep(1)
    page.screenshot(path="verification_quote_viewer.png")

    # Close viewer
    page.locator("button").filter(has_text=lambda t: t == "").first().click() # Close button (X icon usually first or identifiable)
    # Better: page.get_by_role('button').nth(something) or generic click outside
    # Let's click outside or use a known selector. The viewer has an X icon.
    page.keyboard.press("Escape")

    # 5. Create a Clip
    # Click the Card background (You)
    # Selector: .flex-shrink-0.w-28.h-44 ... onClick
    # Since we have a quote now, clicking the *Card* (not bubble) should trigger Clip creation/viewing logic
    # "onClick={() => myClips.length > 0 ? handleCardClick... : handleMyCreate()}"
    # handleMyCreate -> setShowClipCreate(true)

    # Click the card (avoiding the bubble)
    # The bubble is top-2 left-2 right-2.
    # Click bottom center
    page.locator("text=You").click()

    # Clip Creation Modal
    expect(page.get_by_text("New Clip")).to_be_visible()

    # Upload File (Mock)
    # We need a file. Let's assume we can't easily upload in headless without a file.
    # We can skip upload verification or try to create a dummy file.
    # For now, just screenshot the modal
    page.screenshot(path="verification_clip_modal.png")

    # Close modal
    page.keyboard.press("Escape")

    # 6. Profile Page - Check Tabs
    page.goto("http://localhost:5174/profile/TestUserClips") # Handle might vary, let's click Avatar in Navbar
    # Navbar avatar
    # page.locator("nav ...").click()
    # Let's just go to /feed and click the user avatar in the post or widget?
    # Or rely on dynamic handle. Handle logic: @RealName...
    # Let's try navigating to settings to see handle or just use specific URL if known.
    # Actually, simpler: Click the "You" avatar in the widget? No, that opens creation.
    # Click Navbar Profile Link
    page.get_by_role("link", name="Profile").click()

    # Check Tabs
    expect(page.get_by_text("Moments")).to_be_visible()
    expect(page.get_by_text("Clips")).to_be_visible()
    expect(page.get_by_text("Quotes")).to_be_visible()

    page.screenshot(path="verification_profile_tabs.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()
        try:
            verify_clips_widgets(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")
        finally:
            browser.close()
