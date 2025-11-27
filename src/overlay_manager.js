class OverlayManager {
    constructor() {
        this.overlays = [];
        this.storageKey = `overlay_state_${window.location.href}`;
        this.loadState();
    }

    add(dataUrl, rect, type = 'capture') {
        const id = Date.now().toString();
        const overlay = {
            id,
            type,
            src: dataUrl,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            rotation: 0,
            opacity: 1,
            zIndex: 10000 + this.overlays.length
        };
        this.overlays.push(overlay);
        this.renderOverlay(overlay);
        this.saveState();
    }

    renderOverlay(overlayState) {
        // Container for image and handles
        const container = document.createElement('div');
        container.dataset.id = overlayState.id;
        Object.assign(container.style, {
            position: 'fixed',
            left: `${overlayState.x}px`,
            top: `${overlayState.y}px`,
            width: `${overlayState.width}px`,
            height: `${overlayState.height}px`,
            transform: `rotate(${overlayState.rotation}deg)`,
            zIndex: overlayState.zIndex,
            cursor: 'move',
            userSelect: 'none',
            border: '2px solid rgba(255, 255, 255, 0.5)', // Default border
            boxSizing: 'border-box'
        });

        const img = document.createElement('img');
        img.src = overlayState.src;
        Object.assign(img.style, {
            width: '100%',
            height: '100%',
            opacity: overlayState.opacity,
            display: 'block',
            pointerEvents: 'none' // Let events pass to container
        });
        container.appendChild(img);

        // Resize Handles
        const handles = ['nw', 'ne', 'se', 'sw'];
        handles.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            Object.assign(handle.style, {
                position: 'absolute',
                width: '10px',
                height: '10px',
                backgroundColor: '#fff',
                border: '1px solid #000',
                borderRadius: '50%',
                zIndex: '10',
                display: 'none' // Hidden by default, shown when selected
            });

            // Position handles
            if (pos.includes('n')) handle.style.top = '-6px';
            else handle.style.bottom = '-6px';

            if (pos.includes('w')) handle.style.left = '-6px';
            else handle.style.right = '-6px';

            // Cursor
            handle.style.cursor = `${pos}-resize`;

            container.appendChild(handle);
            this.attachResizeEvents(handle, container, overlayState, pos);
        });

        document.body.appendChild(container);

        this.attachDragEvents(container, overlayState);
    }

    attachResizeEvents(handle, container, state, pos) {
        let startX, startY, startWidth, startHeight, startLeft, startTop;

        const onPointerDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handle.setPointerCapture(e.pointerId);

            startX = e.clientX;
            startY = e.clientY;
            startWidth = state.width;
            startHeight = state.height;
            startLeft = state.x;
            startTop = state.y;

            handle.addEventListener('pointermove', onPointerMove);
            handle.addEventListener('pointerup', onPointerUp);
            handle.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const rad = state.rotation * Math.PI / 180;
            // Rotate delta to align with element axes
            const rDx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
            const rDy = dx * Math.sin(-rad) + dy * Math.cos(-rad);

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newX = startLeft;
            let newY = startTop;

            // Calculate new dimensions
            if (pos.includes('e')) newWidth = startWidth + rDx;
            if (pos.includes('w')) newWidth = startWidth - rDx;
            if (pos.includes('s')) newHeight = startHeight + rDy;
            if (pos.includes('n')) newHeight = startHeight - rDy;

            // Aspect Ratio Locking
            if (e.shiftKey) {
                const ratio = startWidth / startHeight;
                if (Math.abs(newWidth - startWidth) > Math.abs(newHeight - startHeight) * ratio) {
                    newHeight = newWidth / ratio;
                } else {
                    newWidth = newHeight * ratio;
                }
            }

            if (newWidth < 20) newWidth = 20;
            if (newHeight < 20) newHeight = 20;

            // Adjust position for W and N handles
            const dW = newWidth - startWidth;
            const dH = newHeight - startHeight;

            let localShiftX = 0;
            let localShiftY = 0;

            if (pos.includes('w')) localShiftX = -dW;
            if (pos.includes('n')) localShiftY = -dH;

            // Rotate local shift to global
            const globalShiftX = localShiftX * Math.cos(rad) - localShiftY * Math.sin(rad);
            const globalShiftY = localShiftX * Math.sin(rad) + localShiftY * Math.cos(rad);

            newX = startLeft + globalShiftX;
            newY = startTop + globalShiftY;

            this.update(state.id, {
                width: newWidth,
                height: newHeight,
                x: newX,
                y: newY
            });
        };

        const onPointerUp = (e) => {
            handle.releasePointerCapture(e.pointerId);
            handle.removeEventListener('pointermove', onPointerMove);
            handle.removeEventListener('pointerup', onPointerUp);
            handle.removeEventListener('pointercancel', onPointerUp);
        };

        handle.addEventListener('pointerdown', onPointerDown);
    }

    attachDragEvents(element, state) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const onMouseDown = (e) => {
            // If anchor mode is active in control panel, don't drag
            if (window.screenOverlayApp && window.screenOverlayApp.controlPanel.isAnchorMode) return;
            // Ignore if clicking on resize handle
            if (e.target.classList.contains('resize-handle')) return;

            e.preventDefault();
            e.stopPropagation(); // Prevent selecting other elements
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = state.x;
            initialTop = state.y;
            element.style.cursor = 'grabbing';

            // Notify app to select this overlay (for control panel)
            if (window.screenOverlayApp && window.screenOverlayApp.controlPanel) {
                window.screenOverlayApp.controlPanel.selectOverlay(state);
            }
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            state.x = initialLeft + dx;
            state.y = initialTop + dy;

            element.style.left = `${state.x}px`;
            element.style.top = `${state.y}px`;
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
                this.saveState();
            }
        };

        element.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    saveState() {
        const state = this.overlays.map(o => ({
            ...o
        }));
        chrome.storage.local.set({ [this.storageKey]: state });
    }

    loadState() {
        chrome.storage.local.get([this.storageKey], (result) => {
            const state = result[this.storageKey];
            if (state && Array.isArray(state)) {
                this.overlays = state;
                this.overlays.forEach(overlay => this.renderOverlay(overlay));
            }
        });
    }

    clear() {
        this.overlays.forEach(o => {
            const el = document.querySelector(`div[data-id="${o.id}"]`);
            if (el) el.remove();
        });
        this.overlays = [];
        this.saveState();
    }

    update(id, updates) {
        const overlay = this.overlays.find(o => o.id === id);
        if (overlay) {
            Object.assign(overlay, updates);
            const el = document.querySelector(`div[data-id="${id}"]`);
            if (el) {
                if (updates.x !== undefined) el.style.left = `${updates.x}px`;
                if (updates.y !== undefined) el.style.top = `${updates.y}px`;
                if (updates.width !== undefined) el.style.width = `${updates.width}px`;
                if (updates.height !== undefined) el.style.height = `${updates.height}px`;
                if (updates.rotation !== undefined) el.style.transform = `rotate(${updates.rotation}deg)`;
                if (updates.zIndex !== undefined) el.style.zIndex = updates.zIndex;

                // Opacity applies to the image inside
                if (updates.opacity !== undefined) {
                    const img = el.querySelector('img');
                    if (img) img.style.opacity = updates.opacity;
                }
            }
            this.saveState();
        }
    }

    remove(id) {
        const index = this.overlays.findIndex(o => o.id === id);
        if (index !== -1) {
            this.overlays.splice(index, 1);
            const el = document.querySelector(`div[data-id="${id}"]`);
            if (el) el.remove();
            const anchorEl = document.querySelector(`.anchor-point`);
            if (anchorEl) anchorEl.remove();
            this.saveState();
        }
    }

    bringToFront(id) {
        const overlay = this.overlays.find(o => o.id === id);
        if (overlay) {
            // Find max z-index
            const maxZ = Math.max(...this.overlays.map(o => o.zIndex), 10000);
            overlay.zIndex = maxZ + 1;
            this.update(id, { zIndex: overlay.zIndex });
        }
    }
}
