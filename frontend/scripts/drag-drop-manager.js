class DragDropManager {
    constructor(container, options = {}) {
        this.container = container;
        this.options = Object.assign({
            handle: null,
            itemSelector: '.draggable-item',
            onEnd: () => {}
        }, options);
        
        this.draggedItem = null;
        this.placeholder = null;
        
        this.init();
    }
    
    init() {
        // Find items
        const items = this.container.querySelectorAll(this.options.itemSelector);
        items.forEach(item => this.makeDraggable(item));
        
        // Container events
        this.container.addEventListener('dragover', (e) => this.onDragOver(e));
        this.container.addEventListener('drop', (e) => this.onDrop(e));
        
        // Observer for new items
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.matches(this.options.itemSelector)) {
                        this.makeDraggable(node);
                    }
                });
            });
        });
        
        this.observer.observe(this.container, { childList: true });
    }
    
    makeDraggable(item) {
        if (item.getAttribute('draggable') === 'true') return;
        
        const handle = this.options.handle ? item.querySelector(this.options.handle) : item;
        if (this.options.handle && !handle) return;
        
        handle.style.cursor = 'grab';
        
        // We set draggable on the item, not the handle, but initiate from handle
        handle.addEventListener('mousedown', () => {
            item.setAttribute('draggable', 'true');
        });
        
        handle.addEventListener('mouseup', () => {
            item.setAttribute('draggable', 'false');
        });
        
        item.addEventListener('dragstart', (e) => this.onDragStart(e, item));
        item.addEventListener('dragend', (e) => this.onDragEnd(e, item));
    }
    
    onDragStart(e, item) {
        this.draggedItem = item;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', item.innerHTML);
        
        item.classList.add('dragging');
        
        // Create placeholder
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'drop-placeholder';
        this.placeholder.style.height = `${item.offsetHeight}px`;
        
        setTimeout(() => {
            item.style.display = 'none';
        }, 0);
    }
    
    onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (!this.draggedItem) return;
        
        const target = e.target.closest(this.options.itemSelector);
        
        if (target && target !== this.draggedItem) {
            const rect = target.getBoundingClientRect();
            const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
            
            if (next) {
                this.container.insertBefore(this.placeholder, target.nextSibling);
            } else {
                this.container.insertBefore(this.placeholder, target);
            }
        } else if (!target && this.container.children.length === 0) {
            this.container.appendChild(this.placeholder);
        }
    }
    
    onDragEnd(e, item) {
        item.classList.remove('dragging');
        item.style.display = '';
        item.setAttribute('draggable', 'false');
        
        if (this.placeholder && this.placeholder.parentNode) {
            this.placeholder.parentNode.insertBefore(item, this.placeholder);
            this.placeholder.remove();
        } else {
            // Fallback if dropped outside
            item.style.display = '';
        }
        
        this.draggedItem = null;
        this.placeholder = null;
        
        if (this.options.onEnd) {
            this.options.onEnd();
        }
    }
    
    onDrop(e) {
        e.preventDefault();
    }
    
    destroy() {
        this.observer.disconnect();
        // Remove listeners (simplified)
    }
}

