class OverlayManager {
    constructor() {
        this.overlays = [];
        this.storageKey = `overlay_state_${location.origin}${location.pathname}`;
        this.loadState();
    }

    add(dataUrl, rect, type = 'capture', shapeType = null, shapeProps = null) {
        const id = Date.now().toString();
        const overlay = {
            id,
            type,
            shapeType,
            src: dataUrl,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            rotation: 0,
            opacity: 1,
            zIndex: 10000 + this.overlays.length,
            ...(shapeProps && {
                shapeColor: shapeProps.color,
                shapeThickness: shapeProps.thickness,
                shapeHeadSize: shapeProps.headSize
            })
        };
        this.overlays.push(overlay);
        this.renderOverlay(overlay);
        this.saveState();
    }

    _parseSvg(svgString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, 'image/svg+xml');
        if (doc.querySelector('parsererror')) return null;
        const svg = doc.querySelector('svg');
        return svg ? document.importNode(svg, true) : null;
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
            transformOrigin: '0 0',
            zIndex: overlayState.zIndex,
            cursor: 'move',
            userSelect: 'none',
            border: overlayState.type === 'shape' ? '2px solid transparent' : '2px solid rgba(255, 255, 255, 0.5)', // Shapes are transparent by default
            boxSizing: 'border-box'
        });

        if (overlayState.type === 'shape' && overlayState.src.startsWith('<svg')) {
            const svg = this._parseSvg(overlayState.src);
            if (svg) {
                Object.assign(svg.style, {
                    width: '100%',
                    height: '100%',
                    opacity: overlayState.opacity,
                    display: 'block',
                    pointerEvents: 'none'
                });
                container.appendChild(svg);
            }
        } else {
            const img = document.createElement('img');
            img.src = overlayState.src;
            Object.assign(img.style, {
                width: '100%',
                height: '100%',
                opacity: overlayState.opacity,
                display: 'block',
                pointerEvents: 'none'
            });
            container.appendChild(img);
        }

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
        let startX, startY, initialLeft, initialTop;

        const onPointerDown = (e) => {
            // If anchor mode is active in control panel, don't drag
            if (window.screenOverlayApp && window.screenOverlayApp.controlPanel.isAnchorMode) return;
            // Ignore if clicking on resize handle
            if (e.target.classList.contains('resize-handle')) return;

            e.preventDefault();
            e.stopPropagation();
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = state.x;
            initialTop = state.y;
            element.style.cursor = 'grabbing';
            element.setPointerCapture(e.pointerId);

            // Notify app to select this overlay (for control panel)
            if (window.screenOverlayApp && window.screenOverlayApp.controlPanel) {
                window.screenOverlayApp.controlPanel.selectOverlay(state);
            }

            element.addEventListener('pointermove', onPointerMove);
            element.addEventListener('pointerup', onPointerUp);
            element.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            state.x = initialLeft + dx;
            state.y = initialTop + dy;

            element.style.left = `${state.x}px`;
            element.style.top = `${state.y}px`;
        };

        const onPointerUp = (e) => {
            element.releasePointerCapture(e.pointerId);
            element.removeEventListener('pointermove', onPointerMove);
            element.removeEventListener('pointerup', onPointerUp);
            element.removeEventListener('pointercancel', onPointerUp);
            element.style.cursor = 'move';
            this.saveState();
        };

        element.addEventListener('pointerdown', onPointerDown);

        // Store cleanup so remove() can detach these listeners
        state._dragCleanup = () => {
            element.removeEventListener('pointerdown', onPointerDown);
            element.removeEventListener('pointermove', onPointerMove);
            element.removeEventListener('pointerup', onPointerUp);
            element.removeEventListener('pointercancel', onPointerUp);
        };
    }

    saveState() {
        const state = this.overlays.map(o => ({ ...o }));
        chrome.storage.local.set({ [this.storageKey]: state }, () => {
            if (chrome.runtime.lastError) {
                console.warn('[OverLook] saveState failed:', chrome.runtime.lastError.message);
            }
        });
    }

    loadState() {
        chrome.storage.local.get([this.storageKey], (result) => {
            if (chrome.runtime.lastError) {
                console.warn('[OverLook] loadState failed:', chrome.runtime.lastError.message);
                return;
            }
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
        this.clearAllStorageKeys();
    }

    removeStorageKey() {
        chrome.storage.local.remove(this.storageKey, () => {
            if (chrome.runtime.lastError) {
                console.warn('[OverLook] removeStorageKey failed:', chrome.runtime.lastError.message);
            }
        });
    }

    clearAllStorageKeys() {
        chrome.storage.local.get(null, (items) => {
            if (chrome.runtime.lastError) {
                console.warn('[OverLook] clearAllStorageKeys get failed:', chrome.runtime.lastError.message);
                return;
            }
            const keys = Object.keys(items).filter(k => k.startsWith('overlay_state_'));
            if (keys.length === 0) return;
            chrome.storage.local.remove(keys, () => {
                if (chrome.runtime.lastError) {
                    console.warn('[OverLook] clearAllStorageKeys remove failed:', chrome.runtime.lastError.message);
                }
            });
        });
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

                // Opacity applies to the image or svg inside
                if (updates.opacity !== undefined) {
                    const content = el.querySelector('img, svg');
                    if (content) content.style.opacity = updates.opacity;
                }

                // Update content if src is provided (e.g. for shape property changes)
                if (updates.src !== undefined) {
                    if (overlay.type === 'shape' && updates.src.startsWith('<svg')) {
                        const oldSvg = el.querySelector('svg');
                        if (oldSvg) oldSvg.remove();
                        const newSvg = this._parseSvg(updates.src);
                        if (newSvg) {
                            Object.assign(newSvg.style, {
                                width: '100%',
                                height: '100%',
                                opacity: overlay.opacity,
                                display: 'block',
                                pointerEvents: 'none'
                            });
                            el.appendChild(newSvg);
                        }
                    } else {
                        const img = el.querySelector('img');
                        if (img) img.src = updates.src;
                    }
                }
            }
            this.saveState();
        }
    }

    remove(id) {
        const index = this.overlays.findIndex(o => o.id === id);
        if (index !== -1) {
            const [overlay] = this.overlays.splice(index, 1);
            if (overlay._dragCleanup) overlay._dragCleanup();
            const el = document.querySelector(`div[data-id="${id}"]`);
            if (el) el.remove();
            const anchorEl = document.querySelector('.anchor-point');
            if (anchorEl) anchorEl.remove();
            this.saveState();
        }
    }

    bringToFront(id) {
        const overlay = this.overlays.find(o => o.id === id);
        if (!overlay) return;
        this.overlays = [...this.overlays.filter(o => o.id !== id), overlay];
        this.overlays.forEach((o, i) => {
            o.zIndex = 10000 + i;
            const el = document.querySelector(`div[data-id="${o.id}"]`);
            if (el) el.style.zIndex = o.zIndex;
        });
        this.saveState();
    }
}
