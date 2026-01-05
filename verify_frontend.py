import os
import time
from playwright.sync_api import sync_playwright, expect

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        email = f"testuser_{os.urandom(4).hex()}@example.com"
        password = "password123"

        # 1. Register
        print(f"Navigating to Register with {email}...")
        page.goto("http://localhost:5173/register")

        page.get_by_placeholder("John Doe").fill("Test User")
        page.locator("label:has-text('Email') + input").fill(email)
        page.locator("label:has-text('Password') + input").fill(password)
        try:
            page.locator("input[type='checkbox']").check()
        except:
            pass

        print("Clicking Create Account...")
        page.get_by_role("button", name="Create Account").click()

        # Wait for success message
        try:
             page.locator(".bg-green-100").wait_for(state="visible", timeout=10000)
             print("Registration success message seen.")
        except:
             print("Success message NOT seen.")

        # Go to Login
        print("Navigating to Login...")
        page.get_by_text("Log In").click()
        page.wait_for_url("**/login")

        print("Logging in...")
        page.locator("label:has-text('Email') + input").fill(email)
        page.locator("label:has-text('Password') + input").fill(password)
        page.get_by_role("button", name="Log In").click()

        print("Waiting for feed...")
        page.wait_for_url("**/feed", timeout=15000)
        print("Logged in.")

        # 2. Create Post
        print("Navigating to Create Post...")
        page.goto("http://localhost:5173/create")

        os.makedirs("temp_images", exist_ok=True)
        files = []
        # Try 2 images
        for i in range(2):
            fname = f"temp_images/img{i}.png"
            with open(fname, "wb") as f:
                f.write(os.urandom(1024))
            files.append(fname)

        print("Uploading images...")
        page.locator("input[type='file']").first.set_input_files(files)

        page.get_by_placeholder("Write here...").fill("Testing multi-media post chevrons")

        print("Posting...")
        # Use exact=True to avoid matching the selection card
        page.get_by_role("button", name="Post", exact=True).click()

        # Increased timeout for upload
        page.wait_for_url("**/feed", timeout=60000)
        print("Returned to Feed.")

        # 3. Verify PostCard (Chevrons)
        print("Verifying Chevrons...")
        page.wait_for_timeout(3000)

        expect(page.get_by_text("Testing multi-media post chevrons")).to_be_visible()

        # With 2 images, chevrons should be visible
        chevron = page.locator(".lucide-chevron-right").first
        expect(chevron).to_be_visible(timeout=10000)

        print("Verifying Indicator...")
        expect(page.get_by_text("1/2")).to_be_visible()

        # Screenshot Feed
        print("Taking Screenshot of Feed...")
        page.screenshot(path="verification_feed.png", full_page=True)

        # 4. Delete Post
        print("Deleting Post...")
        page.locator(".lucide-more-horizontal").first.click()
        page.get_by_text("Delete Post").click()
        page.get_by_role("button", name="Delete").click()

        page.wait_for_timeout(2000)

        print("Verifying deletion from feed...")
        expect(page.get_by_text("Testing multi-media post chevrons")).not_to_be_visible()

        print("Post deleted from feed.")

        browser.close()

if __name__ == "__main__":
    try:
        verify_frontend()
        print("Verification script finished.")
    except Exception as e:
        print(f"Verification failed: {e}")
