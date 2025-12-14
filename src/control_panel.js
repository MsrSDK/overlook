class ControlPanel {
    constructor(app) {
        this.app = app;
        this.panel = null;
        this.selectedOverlay = null;
        this.isAnchorMode = false;
        this.anchorPoint = null;
        this.savedOpacity = null; // For opacity toggle
        this.render();
    }

    render() {
        this.panel = document.createElement('div');
        Object.assign(this.panel.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '250px',
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            color: '#fff',
            padding: '15px',
            borderRadius: '8px',
            zIndex: '2147483647', // Max z-index
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            fontSize: '14px',
            display: 'none',
            backdropFilter: 'blur(5px)'
        });

        this.panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #444; padding-bottom:10px;">
        <h3 style="margin:0; font-size:16px; font-weight:600;">Overlay Tools</h3>
        <button id="closePanel" style="background:none; border:none; color:#aaa; cursor:pointer; font-size:18px; padding:0;">&times;</button>
      </div>
      <div style="display:flex; gap:10px; margin-bottom:20px;">
        <button id="btnCapture" style="flex:1; padding:8px; background:#007bff; border:none; border-radius:4px; color:white; cursor:pointer; font-weight:500;">+ Capture</button>
        <button id="btnUpload" style="flex:1; padding:8px; background:#28a745; border:none; border-radius:4px; color:white; cursor:pointer; font-weight:500;">+ Upload</button>
        <input type="file" id="fileInput" accept="image/*" style="display:none;">
      </div>
      
      <div id="controlsArea" style="display:none; background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; margin-bottom:15px;">
        <div style="margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <label style="font-size:12px; color:#ccc;">Opacity</label>
            <span id="valOpacity" style="font-size:12px;">100%</span>
          </div>
          <input type="range" id="inpOpacity" min="0" max="1" step="0.05" value="1" style="width:100%; cursor:pointer;">
          <button id="btnToggleOpacity" style="width:100%; padding:6px; margin-top:8px; background:#555; border:none; border-radius:4px; color:white; cursor:pointer; font-size:11px;">⇄ Toggle 100%</button>
        </div>
        <div style="margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <label style="font-size:12px; color:#ccc;">Rotation</label>
            <span id="valRotation" style="font-size:12px;">0°</span>
          </div>
          <input type="range" id="inpRotation" min="0" max="360" step="1" value="0" style="width:100%; cursor:pointer;">
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button id="btnRotateLeft" style="flex:1; padding:6px; background:#555; border:none; border-radius:4px; color:white; cursor:pointer; font-size:11px;">↶ -90°</button>
            <button id="btnRotateRight" style="flex:1; padding:6px; background:#555; border:none; border-radius:4px; color:white; cursor:pointer; font-size:11px;">↷ +90°</button>
          </div>
        </div>
        
        <div style="margin-bottom:15px; border-top:1px solid #444; padding-top:10px;">
           <label style="font-size:12px; color:#ccc; display:block; margin-bottom:8px;">Anchor Scaling</label>
           <button id="btnAnchorMode" style="width:100%; padding:8px; background:#444; border:none; border-radius:4px; color:white; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center; gap:5px;">
             <span>📍</span> Enable Anchor Scale
           </button>
           <div id="anchorInstructions" style="display:none; font-size:11px; color:#aaa; margin-top:5px; line-height:1.4;">
             1. Click on image to set anchor.<br>
             2. Drag anywhere to scale.
           </div>
        </div>

        <div style="display:flex; gap:10px;">
           <button id="btnDownload" style="flex:1; padding:6px; background:#17a2b8; border:none; border-radius:4px; color:white; cursor:pointer; font-size:12px;">Save</button>
           <button id="btnFront" style="flex:1; padding:6px; background:#6c757d; border:none; border-radius:4px; color:white; cursor:pointer; font-size:12px;">To Front</button>
           <button id="btnDelete" style="flex:1; padding:6px; background:#dc3545; border:none; border-radius:4px; color:white; cursor:pointer; font-size:12px;">Delete</button>
        </div>
      </div>
      
      <div style="text-align:center;">
        <button id="btnClearAll" style="background:none; border:none; color:#aaa; cursor:pointer; font-size:12px; text-decoration:underline;">Clear All Overlays</button>
      </div>
    `;

        document.body.appendChild(this.panel);
        this.attachEvents();
    }

    attachEvents() {
        this.panel.querySelector('#closePanel').onclick = () => this.hide();
        this.panel.querySelector('#btnCapture').onclick = () => {
            this.app.selectionManager.start();
        };

        const fileInput = this.panel.querySelector('#fileInput');
        this.panel.querySelector('#btnUpload').onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const img = new Image();
                    img.onload = () => {
                        // Limit max initial size to reasonable viewport portion
                        const maxW = window.innerWidth * 0.5;
                        const maxH = window.innerHeight * 0.5;
                        let width = img.width;
                        let height = img.height;

                        if (width > maxW || height > maxH) {
                            const ratio = Math.min(maxW / width, maxH / height);
                            width *= ratio;
                            height *= ratio;
                        }

                        this.app.overlayManager.add(evt.target.result, { left: 100, top: 100, width, height }, 'upload');
                    };
                    img.src = evt.target.result;
                };
                reader.readAsDataURL(file);
            }
        };

        this.panel.querySelector('#btnClearAll').onclick = () => {
            if (confirm('Are you sure you want to remove all overlays?')) {
                this.app.overlayManager.clear();
                this.selectOverlay(null);
            }
        };

        const inpOpacity = this.panel.querySelector('#inpOpacity');
        const inpRotation = this.panel.querySelector('#inpRotation');

        inpOpacity.oninput = (e) => {
            if (this.selectedOverlay) {
                const val = parseFloat(e.target.value);
                this.panel.querySelector('#valOpacity').textContent = `${Math.round(val * 100)}%`;
                this.app.overlayManager.update(this.selectedOverlay.id, { opacity: val });
            }
        };

        // Toggle opacity button (switch between current and 100%)
        this.panel.querySelector('#btnToggleOpacity').onclick = () => {
            if (this.selectedOverlay) {
                const currentOpacity = this.selectedOverlay.opacity;

                if (currentOpacity === 1) {
                    // Currently at 100%, restore saved value or default to 50%
                    const newOpacity = this.savedOpacity !== null ? this.savedOpacity : 0.5;
                    this.panel.querySelector('#inpOpacity').value = newOpacity;
                    this.panel.querySelector('#valOpacity').textContent = `${Math.round(newOpacity * 100)}%`;
                    this.app.overlayManager.update(this.selectedOverlay.id, { opacity: newOpacity });
                    this.savedOpacity = null; // Clear saved value
                } else {
                    // Not at 100%, save current and switch to 100%
                    this.savedOpacity = currentOpacity;
                    this.panel.querySelector('#inpOpacity').value = 1;
                    this.panel.querySelector('#valOpacity').textContent = '100%';
                    this.app.overlayManager.update(this.selectedOverlay.id, { opacity: 1 });
                }
            }
        };

        inpRotation.oninput = (e) => {
            if (this.selectedOverlay) {
                const val = parseInt(e.target.value);
                this.panel.querySelector('#valRotation').textContent = `${val}°`;
                this.app.overlayManager.update(this.selectedOverlay.id, { rotation: val });
            }
        };

        // Rotate left button (-90 degrees)
        this.panel.querySelector('#btnRotateLeft').onclick = () => {
            if (this.selectedOverlay) {
                let currentRotation = this.selectedOverlay.rotation || 0;
                let newRotation = (currentRotation - 90) % 360;
                if (newRotation < 0) newRotation += 360;

                this.panel.querySelector('#inpRotation').value = newRotation;
                this.panel.querySelector('#valRotation').textContent = `${newRotation}°`;
                this.app.overlayManager.update(this.selectedOverlay.id, { rotation: newRotation });
            }
        };

        // Rotate right button (+90 degrees)
        this.panel.querySelector('#btnRotateRight').onclick = () => {
            if (this.selectedOverlay) {
                let currentRotation = this.selectedOverlay.rotation || 0;
                let newRotation = (currentRotation + 90) % 360;

                this.panel.querySelector('#inpRotation').value = newRotation;
                this.panel.querySelector('#valRotation').textContent = `${newRotation}°`;
                this.app.overlayManager.update(this.selectedOverlay.id, { rotation: newRotation });
            }
        };

        this.panel.querySelector('#btnDelete').onclick = () => {
            if (this.selectedOverlay) {
                if (confirm('Delete this overlay?')) {
                    this.app.overlayManager.remove(this.selectedOverlay.id);
                    this.selectOverlay(null);
                }
            }
        };

        this.panel.querySelector('#btnDownload').onclick = () => {
            if (this.selectedOverlay) {
                const link = document.createElement('a');
                link.href = this.selectedOverlay.src;
                // Simple timestamp based filename
                const date = new Date();
                const timestamp = date.toISOString().replace(/[:.]/g, '-');
                link.download = `overlook_capture_${timestamp}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        };

        this.panel.querySelector('#btnFront').onclick = () => {
            if (this.selectedOverlay) {
                this.app.overlayManager.bringToFront(this.selectedOverlay.id);
            }
        };

        // Anchor Mode
        const btnAnchorMode = this.panel.querySelector('#btnAnchorMode');
        btnAnchorMode.onclick = () => {
            this.isAnchorMode = !this.isAnchorMode;
            this.updateAnchorModeUI();
        };
    }

    updateAnchorModeUI() {
        const btn = this.panel.querySelector('#btnAnchorMode');
        const instr = this.panel.querySelector('#anchorInstructions');

        if (this.isAnchorMode) {
            btn.style.background = '#28a745';
            btn.innerHTML = '<span>📍</span> Anchor Scale ON';
            instr.style.display = 'block';
            document.body.style.cursor = 'crosshair';
            this.startAnchorLogic();
        } else {
            btn.style.background = '#444';
            btn.innerHTML = '<span>📍</span> Enable Anchor Scale';
            instr.style.display = 'none';
            document.body.style.cursor = '';
            this.stopAnchorLogic();
        }
    }

    startAnchorLogic() {
        this.boundAnchorClick = this.handleAnchorClick.bind(this);
        this.boundAnchorDragStart = this.handleAnchorDragStart.bind(this);

        if (this.selectedOverlay) {
            const el = document.querySelector(`div[data-id="${this.selectedOverlay.id}"]`);
            if (el) {
                el.addEventListener('click', this.boundAnchorClick);
                el.style.pointerEvents = 'auto';
            }
        }
    }

    stopAnchorLogic() {
        if (this.selectedOverlay) {
            const el = document.querySelector(`div[data-id="${this.selectedOverlay.id}"]`);
            if (el) {
                el.removeEventListener('click', this.boundAnchorClick);
            }
        }
        this.removeAnchorPoint();
        document.removeEventListener('mousedown', this.boundAnchorDragStart);
    }

    handleAnchorClick(e) {
        if (!this.isAnchorMode) return;
        e.stopPropagation();
        e.preventDefault();

        this.anchorPoint = { x: e.clientX, y: e.clientY };
        this.renderAnchorPoint();

        document.addEventListener('mousedown', this.boundAnchorDragStart);
    }

    renderAnchorPoint() {
        this.removeAnchorPoint();
        const dot = document.createElement('div');
        dot.className = 'anchor-point';
        Object.assign(dot.style, {
            position: 'fixed',
            left: `${this.anchorPoint.x - 5}px`,
            top: `${this.anchorPoint.y - 5}px`,
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'red',
            border: '2px solid white',
            zIndex: '2147483647',
            pointerEvents: 'none'
        });
        document.body.appendChild(dot);
    }

    removeAnchorPoint() {
        const existing = document.querySelector('.anchor-point');
        if (existing) existing.remove();
    }

    handleAnchorDragStart(e) {
        if (!this.isAnchorMode || !this.anchorPoint || !this.selectedOverlay) return;
        if (this.panel.contains(e.target)) return;

        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;

        const startDist = Math.hypot(startX - this.anchorPoint.x, startY - this.anchorPoint.y);
        if (startDist < 5) return;

        const startWidth = this.selectedOverlay.width;
        const startHeight = this.selectedOverlay.height;
        const startImgX = this.selectedOverlay.x;
        const startImgY = this.selectedOverlay.y;

        // Center of the image (unrotated)
        const cx = startImgX + startWidth / 2;
        const cy = startImgY + startHeight / 2;

        // Vector from anchor to center
        const acX = cx - this.anchorPoint.x;
        const acY = cy - this.anchorPoint.y;

        const onDrag = (ev) => {
            const currDist = Math.hypot(ev.clientX - this.anchorPoint.x, ev.clientY - this.anchorPoint.y);
            const scale = currDist / startDist;

            const newWidth = startWidth * scale;
            const newHeight = startHeight * scale;

            const newAcX = acX * scale;
            const newAcY = acY * scale;

            const newCx = this.anchorPoint.x + newAcX;
            const newCy = this.anchorPoint.y + newAcY;

            const newX = newCx - newWidth / 2;
            const newY = newCy - newHeight / 2;

            this.app.overlayManager.update(this.selectedOverlay.id, {
                width: newWidth,
                height: newHeight,
                x: newX,
                y: newY
            });
        };

        const onDragEnd = () => {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', onDragEnd);
        };

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', onDragEnd);
    }

    show() {
        this.panel.style.display = 'block';
    }

    hide() {
        this.panel.style.display = 'none';
        this.isAnchorMode = false;
        this.updateAnchorModeUI();
    }

    toggle() {
        if (this.panel.style.display === 'none') this.show();
        else this.hide();
    }

    selectOverlay(overlayState) {
        if (this.selectedOverlay && (!overlayState || this.selectedOverlay.id !== overlayState.id)) {
            // Deselect previous
            const prevEl = document.querySelector(`div[data-id="${this.selectedOverlay.id}"]`);
            if (prevEl) {
                prevEl.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                prevEl.querySelectorAll('.resize-handle').forEach(h => h.style.display = 'none');
            }

            this.isAnchorMode = false;
            this.updateAnchorModeUI();
        }

        this.selectedOverlay = overlayState;
        const controls = this.panel.querySelector('#controlsArea');

        if (overlayState) {
            // Select new
            const el = document.querySelector(`div[data-id="${overlayState.id}"]`);
            if (el) {
                el.style.borderColor = '#007bff'; // Active color
                el.querySelectorAll('.resize-handle').forEach(h => h.style.display = 'block');
            }

            controls.style.display = 'block';
            this.panel.querySelector('#inpOpacity').value = overlayState.opacity;
            this.panel.querySelector('#valOpacity').textContent = `${Math.round(overlayState.opacity * 100)}%`;
            this.panel.querySelector('#inpRotation').value = overlayState.rotation;
            this.panel.querySelector('#valRotation').textContent = `${overlayState.rotation}°`;
        } else {
            controls.style.display = 'none';
        }
    }
}
