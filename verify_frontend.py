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

        # Wait for redirect
        try:
            page.wait_for_url("**/login", timeout=5000)
        except:
            page.goto("http://localhost:5173/login")

        print("Logging in...")
        page.locator("label:has-text('Email') + input").fill(email)
        page.locator("label:has-text('Password') + input").fill(password)
        page.get_by_role("button", name="Log In").click()

        page.wait_for_url("**/feed", timeout=15000)
        print("Logged in.")

        # 2. Create Post
        print("Navigating to Create Post...")
        page.goto("http://localhost:5173/create")

        os.makedirs("temp_images", exist_ok=True)
        files = []
        for i in range(2):
            fname = f"temp_images/img{i}.png"
            with open(fname, "wb") as f:
                f.write(os.urandom(1024))
            files.append(fname)

        print("Uploading images...")
        page.locator("input[type='file']").first.set_input_files(files)

        page.get_by_placeholder("Write here...").fill("Testing 403 fix")

        print("Posting...")
        # Use selector for submit button specifically
        page.locator("button[type='submit']").click()

        # Wait for navigation
        try:
            page.wait_for_url("**/feed", timeout=15000)
            print("Post Created Successfully!")
        except:
            print("Failed to create post.")
            # Check for error toast
            try:
                # Toast usually appears as a div with role='status' or similar?
                # or just search for text "Failed"
                if page.get_by_text("Failed").count() > 0:
                    print("Error toast found.")
            except: pass

        browser.close()

if __name__ == "__main__":
    try:
        verify_frontend()
        print("Verification script finished.")
    except Exception as e:
        print(f"Verification failed: {e}")
