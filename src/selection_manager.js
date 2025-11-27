class SelectionManager {
    constructor(onSelectionComplete) {
        this.onSelectionComplete = onSelectionComplete;
        this.isSelecting = false;
        this.startX = 0;
        this.startY = 0;
        this.overlay = null;
        this.selectionBox = null;

        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    start() {
        if (this.isSelecting) return;
        this.isSelecting = true;
        document.body.style.cursor = 'crosshair';

        // Create overlay
        this.overlay = document.createElement('div');
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: '999999',
            cursor: 'crosshair'
        });
        document.body.appendChild(this.overlay);

        // Create selection box
        this.selectionBox = document.createElement('div');
        Object.assign(this.selectionBox.style, {
            position: 'fixed',
            border: '2px dashed #fff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'none',
            pointerEvents: 'none', // Allow events to pass through to overlay
            zIndex: '1000000'
        });
        document.body.appendChild(this.selectionBox);

        this.overlay.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    stop() {
        this.isSelecting = false;
        document.body.style.cursor = '';
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.selectionBox) {
            this.selectionBox.remove();
            this.selectionBox = null;
        }
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    handleMouseDown(e) {
        e.preventDefault();
        this.startX = e.clientX;
        this.startY = e.clientY;

        Object.assign(this.selectionBox.style, {
            left: `${this.startX}px`,
            top: `${this.startY}px`,
            width: '0px',
            height: '0px',
            display: 'block'
        });

        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
    }

    handleMouseMove(e) {
        const currentX = e.clientX;
        const currentY = e.clientY;

        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        const left = Math.min(currentX, this.startX);
        const top = Math.min(currentY, this.startY);

        Object.assign(this.selectionBox.style, {
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`
        });
    }

    handleMouseUp(e) {
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);

        const rect = this.selectionBox.getBoundingClientRect();
        this.stop();

        if (rect.width > 5 && rect.height > 5) {
            this.onSelectionComplete(rect);
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.stop();
        }
    }
}
