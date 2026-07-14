from playwright.sync_api import sync_playwright, expect

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto("http://localhost:63342/StudyTracker/login.html?_ijt=a4bjf380jj0uei4kk7ocutapu9&_ij_reload=RELOAD_ON_SAVE")

    email_input = page.get_by_test_id("login-email")
    email_input.fill('test@studyflow.app')

    password_input = page.get_by_test_id("login-password")
    password_input.fill('Test1234')

    button_submit = page.get_by_test_id("login-submit")
    button_submit.click()

    page.wait_for_timeout(5000)