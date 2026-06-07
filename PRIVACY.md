# Privacy Policy — OverLook

**Last updated: 2026-06-07**

## Overview

OverLook ("the Extension") is a browser tool that lets you capture a selected region of the current page, upload a local image, or place shapes (rectangle, circle, line, arrow) as movable, resizable overlays on the same page.

## Data Collection

**OverLook does not collect, transmit, or share any user data.**

- No personal information is gathered.
- No analytics or telemetry is sent to any server.
- No network requests are made by the Extension to any external server.

## Local Storage

The Extension uses `chrome.storage.local` to persist overlay state between page visits. Specifically:

- **Storage key:** `overlay_state_<origin><pathname>` — one entry per page URL.
- **Stored data per overlay:** position (x, y), dimensions (width, height), rotation, opacity, z-index, overlay type, and the image content — either a base64-encoded data URL (for captures and uploads) or an inline SVG string (for shapes).
- All data is stored **only on your local device** and is never sent to any external server.
- Because screenshots and uploaded images are stored as base64 data, storage usage can grow over time if overlays are created on many pages.

### Clearing stored data

| Action | What is deleted |
|---|---|
| "Clear All Overlays" button | Overlay data for **all pages** (`overlay_state_*` keys across the entire extension storage) |
| "Delete All & Close" in the close dialog | Same as above — all pages |
| "Keep & Close" in the close dialog | Only the **current page's** storage entry is removed (overlays remain visible until the page is reloaded, but will not be restored on the next visit) |
| Chrome settings (`chrome://settings/content/siteData`) | All extension data |

## Screen Capture

When you use the Capture feature, the Extension takes a screenshot of the visible browser tab using the Chrome `tabs.captureVisibleTab` API. This screenshot:

- Is captured within the browser by the Extension's background service worker.
- Is cropped to your selected region using the browser's Canvas API (client-side only).
- Is stored locally as a base64-encoded PNG in `chrome.storage.local`.
- Is **never uploaded, transmitted, or stored outside your device**.

## Image Upload

When you use the Upload feature, the Extension reads a locally selected image file using the browser's `FileReader` API. This image:

- Is read entirely client-side and never sent to any server.
- Is stored locally as a base64-encoded data URL in `chrome.storage.local`.

## Shapes

When you add a shape (rectangle, circle, line, or arrow), the Extension generates an SVG string client-side. This SVG:

- Is generated entirely in your browser using your chosen color, thickness, and head-size settings.
- Is stored locally in `chrome.storage.local` alongside other overlay state.
- Is never sent to any server.

## Save (Download)

When you click the "Save" button on a selected capture or upload overlay, that overlay is downloaded to your device as a PNG file. This download:

- Is performed entirely within your browser via a standard `<a download>` element.
- Does not involve any server or external service.
- Is not available for shape overlays (the Save button is disabled when a shape is selected).

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Required to interact with the current tab when you click the extension icon, and to capture the visible tab area via `tabs.captureVisibleTab`. |
| `scripting` | Required to inject the overlay UI (control panel, overlays) into the active page. |
| `storage` | Required to save and restore overlay state per page using local storage only. |

## Changes to This Policy

If this policy is updated, the "Last updated" date above will be revised. Continued use of the Extension after any changes constitutes acceptance of the updated policy.

## Contact

For questions or concerns, please open an issue on the [project's GitHub repository](https://github.com/MsrSDK/overlook).
