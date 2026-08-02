# OpenInApp

OpenInApp turns social media URLs into links designed to open content directly in the corresponding mobile app.

## How does it work?

1. Paste a post, video or profile URL.
2. Select **Create my link**.
3. Copy the generated link and share it on Instagram or another messaging app.
4. OpenInApp displays a transition page, then attempts to open the corresponding app.

If automatic opening is blocked, the transition page provides a manual button, a web fallback and a button to go back.

## Supported platforms

- X / Twitter
- Instagram
- TikTok
- YouTube
- Facebook
- Threads
- Reddit
- LinkedIn
- Pinterest
- Snapchat

App-opening behavior may vary depending on the phone, app and in-app browser restrictions. Only supported HTTPS links are accepted.

## iPhone Shortcut

The universal `shortcut.html?target=...` route can be used by an Apple Shortcut to create an OpenInApp link directly from the iOS Share Sheet and copy it to the clipboard.
