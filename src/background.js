// Background service worker
chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;

    // Check if app is already injected to avoid re-running scripts
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => !!window.screenOverlayApp
    }).then(([{ result }]) => {
        if (result) {
            chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
        } else {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['src/selection_manager.js', 'src/overlay_manager.js', 'src/control_panel.js', 'src/content.js']
            }).then(() => {
                chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
            }).catch(err => {
                console.error('Failed to inject script:', err);
            });
        }
    }).catch(err => {
        console.error('Failed to check injection state:', err);
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'captureVisibleTab') {
        chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' })
            .then(dataUrl => sendResponse({ dataUrl }))
            .catch(err => sendResponse({ error: err.message }));
        return true; // Keep channel open for async response
    }
});
