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

    async handleSelection(rect) {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'captureVisibleTab' });
            if (response.dataUrl) {
                this.createOverlay(response.dataUrl, rect);
            } else {
                console.error('Capture failed:', response.error);
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }
    }

    createOverlay(dataUrl, rect) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
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
        img.src = dataUrl;
    }
}

// Initialize
if (!window.screenOverlayApp) {
    window.screenOverlayApp = new App();
}
