from playwright.sync_api import sync_playwright, expect

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto("https://feklakonstantinovna.github.io/StudyTracker/login.html")

    email_input = page.get_by_test_id("login-email")
    email_input.fill('test@studyflow.app')

    password_input = page.get_by_test_id("login-password")
    password_input.fill('Test1234')

    button_submit = page.get_by_test_id("login-submit")
    button_submit.click()

    pass_email_or_password_alert = page.get_by_test_id("login-success")
    expect(pass_email_or_password_alert).to_be_visible()
    expect(pass_email_or_password_alert).to_contain_text("Вход выполнен! Перенаправляем...")

    page.wait_for_timeout(5000)
