# Privacy Policy — OverLook

**Last updated: 2026-06-02**

## Overview

OverLook ("the Extension") is a browser tool that lets you capture a selected area of the current page and display it as a movable, resizable overlay on the same page.

## Data Collection

**OverLook does not collect, transmit, or share any user data.**

- No personal information is gathered.
- No analytics or telemetry is sent to any server.
- No network requests are made by the Extension.

## Local Storage

The Extension uses `chrome.storage.local` exclusively to persist overlay positions, sizes, and opacity settings between page visits. This data:

- Is stored only on your local device.
- Is never sent to any external server.
- Is keyed per page URL (origin + path) and can be cleared at any time via the "Clear All Overlays" button or by clearing extension data in your browser settings.

## Screenshots

When you use the Capture feature, the Extension takes a screenshot of the visible browser tab using the Chrome `tabs.captureVisibleTab` API. This screenshot:

- Is processed entirely within your browser (client-side only).
- Is never uploaded, transmitted, or stored outside your device.
- Is cropped to your selected region and rendered as a page overlay.

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Required to interact with the current tab when you click the extension icon. |
| `scripting` | Required to inject the overlay UI into the active page. |
| `storage` | Required to save and restore overlay state per page using local storage only. |

## Changes to This Policy

If this policy is updated, the "Last updated" date above will be revised. Continued use of the Extension after any changes constitutes acceptance of the updated policy.

## Contact

For questions or concerns, please open an issue on the project's GitHub repository.
