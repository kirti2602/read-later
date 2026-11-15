# Read Later extension

Saves the page you're on to your Read Later list in one click. Plain Manifest V3 JavaScript: no build step, no npm packages.

- Click the toolbar button (or press the shortcut) to save the current tab. The popup says whether it was saved, already in this week's list, or already read this week.
- Right-click a link, or a page, and choose "Save link to Read Later" or "Save page to Read Later". The result shows as a badge on the toolbar button for about 3 seconds (green tick saved, red "!" problem).
- Pages the extension can't save (`chrome://`, the new-tab page, local files) say so instead of failing.

You must be logged in to Read Later in this browser. The extension has no keys of its own; it uses your existing login cookie for the app. If you're logged out, it offers a "Log in" button.

## Install (unpacked)

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick this `extension` folder.
4. Click the puzzle-piece menu and pin **Read Later**.

Also works in Edge (`edge://extensions`) and Brave (`brave://extensions`) the same way.

## Shortcut

Command+Shift+S on macOS, Ctrl+Shift+S elsewhere opens the popup and saves. Change it at `chrome://extensions/shortcuts`.

## Permissions

| Permission | Why |
| --- | --- |
| `activeTab` | Read the URL and title of the tab you're saving, only when you invoke the extension. |
| `contextMenus` | The right-click "Save to Read Later" items. |
| Host access to `https://read-later-alpha.vercel.app/*` | Call the app's API and send your login cookie with the request. No other sites. |

No remote code, no `eval`, no tracking. The app URL lives in `config.js`.

## Tests

```
node --test "extension/*.test.js"
```

## Packaging later

Zip the `extension` folder contents, leaving out `save.test.js` and this README if you like, then upload the zip in the Chrome Web Store developer dashboard.

```
cd extension && zip -r ../read-later-extension.zip . -x save.test.js README.md '.DS_Store'
```
