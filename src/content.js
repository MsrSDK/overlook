// OverLook: Content Script

class App {
    constructor() {
        this.overlayManager = new OverlayManager();
        this.selectionManager = new SelectionManager(this.handleSelection.bind(this));
        this.controlPanel = new ControlPanel(this);
        this.init();
    }

    init() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'togglePanel') {
                this.controlPanel.toggle();
            }
        });
    }

    showError(message) {
        const toast = document.createElement('div');
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(220,53,69,0.95)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '13px',
            zIndex: '2147483647',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            pointerEvents: 'none'
        });
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }

    async handleSelection(rect) {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'captureVisibleTab' });
            if (response.dataUrl) {
                this.createOverlay(response.dataUrl, rect);
            } else {
                console.error('Capture failed:', response.error);
                this.showError('Screenshot capture failed. Please try again.');
            }
        } catch (err) {
            console.error('Error sending message:', err);
            this.showError('Could not communicate with the extension. Please reload the page.');
        }
    }

    createOverlay(dataUrl, rect) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            this.showError('Canvas unavailable. Please try again.');
            return;
        }
        const img = new Image();

        img.onload = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width;
            canvas.height = rect.height;

            const sourceX = rect.left * dpr;
            const sourceY = rect.top * dpr;
            const sourceWidth = rect.width * dpr;
            const sourceHeight = rect.height * dpr;

            ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, rect.width, rect.height);

            const croppedDataUrl = canvas.toDataURL();
            this.overlayManager.add(croppedDataUrl, rect);

            this.controlPanel.show();
        };
        img.onerror = () => {
            this.showError('Failed to process the captured image.');
        };
        img.src = dataUrl;
    }
}

// Initialize
if (!window.screenOverlayApp) {
    window.screenOverlayApp = new App();
}
