class PerformanceDashboard {
    constructor() {
        this.ws = null;
        this.userConfig = null;
        this.kpiData = {};
        this.currentSource = 'main';
        this.currentKpiCard = null;
        this.dragEnabled = false;
        this.dragDropManagers = [];
        
        this.initializeElements();
        this.loadUserConfig();
    }

    async loadUserConfig() {
        try {
            const response = await fetch('/api/current-user');
            const data = await response.json();
            this.userConfig = data.user;
            this.initializeWebSocket();
            this.loadKpiData();
            this.initializeSettings();
            this.initializeDragDrop(); // Changed from initializeSortable
        } catch (error) {
            console.error('Error loading user config:', error);
            window.location.href = '/dashboard';
        }
    }

    initializeElements() {
        this.backBtn = document.getElementById('back-to-dashboard');
        this.settingsToggle = document.getElementById('settingsToggle');
        this.settingsDropdown = document.getElementById('settingsDropdown');
        this.enableDragMode = document.getElementById('enableDragMode');
        this.saveLayout = document.getElementById('saveLayout');
        this.resetLayout = document.getElementById('resetLayout');
        this.enterMeetingMode = document.getElementById('enterMeetingMode');
        this.printDashboard = document.getElementById('printDashboard');
        this.fileBrowserModal = document.getElementById('fileBrowserModal');
        this.fileBrowserClose = document.querySelector('.file-browser-close');
        
        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => {
                window.location.href = '/dashboard';
            });
        }
    }

    initializeSettings() {
        if (this.settingsToggle) {
            this.settingsToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.settingsDropdown.classList.toggle('active');
            });
        }

        document.addEventListener('click', (e) => {
            if (!this.settingsDropdown.contains(e.target) && !this.settingsToggle.contains(e.target)) {
                this.settingsDropdown.classList.remove('active');
            }
        });

        this.enableDragMode?.addEventListener('click', () => this.toggleDragMode());
        this.saveLayout?.addEventListener('click', () => this.saveLayoutToStorage());
        this.resetLayout?.addEventListener('click', () => this.resetLayoutFromStorage());
        this.enterMeetingMode?.addEventListener('click', () => this.enterMeetingModeFunc());
        this.printDashboard?.addEventListener('click', () => window.print());

        document.querySelectorAll('.source-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const source = e.currentTarget.dataset.source;
                this.switchFileSource(source);
            });
        });

        this.fileBrowserClose?.addEventListener('click', () => {
            this.fileBrowserModal.classList.remove('active');
        });

        document.querySelectorAll('.kpi-card').forEach(card => {
            card.addEventListener('dblclick', () => {
                if (!this.dragEnabled) this.openFileBrowser(card);
            });
            card.addEventListener('click', (e) => {
                // Handle click if needed
            });
        });
    }

    initializeWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const port = window.location.port || '3000';
        const wsUrl = `${protocol}//${window.location.hostname}:${port}/ws/dashboard`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Dashboard WebSocket Connected');
            this.startPingInterval();
        };
        
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                
                if (message.type === 'ping') {
                    this.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    return;
                }
                
                if (message.type === 'pong') {
                    return;
                }
                
                if (message.type === 'fileChanged' || message.type === 'FOLDER_UPDATED') {
                    this.refreshKpiImages();
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket closed, reconnecting...');
            this.stopPingInterval();
            setTimeout(() => this.initializeWebSocket(), 2000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    startPingInterval() {
        this.stopPingInterval();
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            }
        }, 30000);
    }
    
    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    async loadKpiData() {
        try {
            const response = await fetch('/api/dashboard/kpi');
            const data = await response.json();
            this.kpiData = data;
            this.updateKpiCards();
        } catch (error) {
            console.error('Error loading KPI data:', error);
        }
    }

    updateKpiCards() {
        const categories = ['people', 'customer', 'cost', 'production'];
        
        categories.forEach(category => {
            const kpis = this.kpiData[category] || [];
            kpis.forEach((kpi, index) => {
                const cardId = category === 'production' ? `kpi-${index + 1}` : `kpi-${category}-${index + 1}`;
                const card = document.getElementById(cardId);
                if (card) {
                    const titleEl = card.querySelector('.kpi-title');
                    const numberEl = card.querySelector('.kpi-number');
                    if (titleEl) titleEl.textContent = kpi.title;
                    if (numberEl) {
                        numberEl.textContent = kpi.value;
                        numberEl.className = `kpi-number ${kpi.status || 'blue'}`;
                    }
                    
                    // Load image
                    this.loadKpiImage(cardId, card);
                }
            });
        });
    }

    getPlaceholderForKpi(kpiId) {
        const map = {
            'kpi-1': '/api/dashboard/images/kpi/kpi1/kpi-card-1.png',
            'kpi-2': '/api/dashboard/images/kpi/kpi1/kpi-card-2.png',
            'kpi-3': '/api/dashboard/images/kpi/kpi1/kpi-production-1.png',
            'kpi-4': '/api/dashboard/images/kpi/kpi1/kpi-card-1.png', // Reuse
            
            'kpi-people-1': '/api/dashboard/images/kpi/kpi2/dashboard-kpi-1.png',
            'kpi-people-2': '/api/dashboard/images/kpi/kpi2/kpi-people-2.png',
            
            'kpi-customer-1': '/api/dashboard/images/kpi/kpi2/dashboard-kpi-2.png',
            'kpi-customer-2': '/api/dashboard/images/kpi/kpi2/kpi-customer-3.png',
            
            'kpi-cost-1': '/api/dashboard/images/kpi/kpi2/kpi-cost-4.png',
        };
        
        if (map[kpiId]) return map[kpiId];
        if (kpiId.includes('production')) return '/api/dashboard/images/kpi/kpi1/kpi-production-1.png';
        if (kpiId.includes('people')) return '/api/dashboard/images/kpi/kpi2/kpi-people-2.png';
        if (kpiId.includes('customer')) return '/api/dashboard/images/kpi/kpi2/kpi-customer-3.png';
        if (kpiId.includes('cost')) return '/api/dashboard/images/kpi/kpi2/kpi-cost-4.png';
        
        return '/api/dashboard/images/kpi/kpi1/kpi-card-1.png';
    }

    async loadFiles(source = 'main') {
        try {
            const response = await fetch(`/api/dashboard/files?dir=${source}`);
            const data = await response.json();
            this.renderFiles(data.files || []);
        } catch (error) {
            console.error('Error loading files:', error);
        }
    }

    renderFiles(files) {
        const container = document.getElementById('fileBrowserItems');
        if (!container) return;

        if (files.length === 0) {
            container.innerHTML = '<div class="no-files">No files found</div>';
            return;
        }

        container.innerHTML = files.map(file => {
            if (file.isImage) {
                return `
                    <div class="file-item" data-path="${file.fullPath}" data-name="${file.name}">
                        <img src="${file.fullPath}" alt="${file.name}" class="file-thumbnail">
                        <div class="file-name">${file.name}</div>
                    </div>
                `;
            }
            return '';
        }).join('');

        container.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                this.selectImage(path);
            });
        });
    }

    switchFileSource(source) {
        this.currentSource = source;
        document.querySelectorAll('.source-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.source === source);
        });
        this.loadFiles(source);
    }

    openFileBrowser(card) {
        this.currentKpiCard = card;
        const title = card.querySelector('.kpi-title')?.textContent || 'Unknown';
        document.getElementById('currentKpiTitle').textContent = title;
        this.fileBrowserModal.classList.add('active');
        this.loadFiles(this.currentSource);
    }

    selectImage(imagePath) {
        if (!this.currentKpiCard) return;
        
        const kpiId = this.currentKpiCard.id;
        localStorage.setItem(`kpi-image-${kpiId}`, imagePath);
        this.loadKpiImage(kpiId, this.currentKpiCard, imagePath);
        this.fileBrowserModal.classList.remove('active');
    }

    loadKpiImage(kpiId, card, imagePath) {
        const savedPath = localStorage.getItem(`kpi-image-${kpiId}`) || imagePath || this.getPlaceholderForKpi(kpiId);
        const imageContainer = document.createElement('div');
        imageContainer.className = 'kpi-image-container';
        
        const img = document.createElement('img');
        img.src = savedPath;
        img.alt = `KPI Image for ${kpiId}`;
        img.onerror = () => {
            // Only show placeholder on error if we weren't already trying to load it
            if (!savedPath.includes('placeholder')) {
                img.src = this.getPlaceholderForKpi(kpiId);
            }
        };
        
        imageContainer.appendChild(img);
        
        const existing = card.querySelector('.kpi-image-container');
        if (existing) {
            existing.replaceWith(imageContainer);
        } else {
            card.appendChild(imageContainer);
        }
    }

    initializeDragDrop() {
        if (typeof DragDropManager === 'undefined') {
            console.error('DragDropManager not loaded');
            return;
        }

        const columns = document.querySelectorAll('.grid-column, .sidebar-column');
        
        columns.forEach(column => {
            const manager = new DragDropManager(column, {
                itemSelector: '.kpi-card',
                handle: '.kpi-card', // Entire card is handle
                onEnd: () => {
                    this.saveLayoutToStorage();
                }
            });
            this.dragDropManagers.push(manager);
        });
    }

    toggleDragMode() {
        this.dragEnabled = !this.dragEnabled;
        document.body.classList.toggle('drag-mode', this.dragEnabled);
        
        // DragDropManager manages draggable attribute dynamically based on interaction
        // But we can add visual cues
        
        if (this.enableDragMode) {
            this.enableDragMode.innerHTML = this.dragEnabled 
                ? '<i class="fas fa-lock"></i> Disable Drag' 
                : '<i class="fas fa-arrows-alt"></i> Rearrange Cards';
        }
    }

    saveLayoutToStorage() {
        const layout = {};
        document.querySelectorAll('.grid-column, .sidebar-column').forEach((column, colIndex) => {
            const cardIds = Array.from(column.querySelectorAll('.kpi-card')).map(card => card.id);
            layout[colIndex] = cardIds;
        });
        localStorage.setItem('dashboard-layout', JSON.stringify(layout));
        
        // Show success toast
        if (window.showToast) window.showToast('Layout saved successfully!', 'success');
    }

    restoreSavedLayout() {
        const saved = localStorage.getItem('dashboard-layout');
        if (!saved) return;
        
        try {
            const layout = JSON.parse(saved);
            // Layout restoration logic would go here
        } catch (error) {
            console.error('Error restoring layout:', error);
        }
    }

    resetLayoutFromStorage() {
        if (confirm('Reset layout to default?')) {
            localStorage.removeItem('dashboard-layout');
            location.reload();
        }
    }

    enterMeetingModeFunc() {
        document.body.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
        document.body.classList.add('meeting-mode');
        
        // Add exit button
        let exitBtn = document.getElementById('exitMeetingBtn');
        if (!exitBtn) {
            exitBtn = document.createElement('button');
            exitBtn.id = 'exitMeetingBtn';
            exitBtn.innerHTML = '<i class="fas fa-times"></i> Exit Meeting';
            exitBtn.className = 'btn-floating-exit';
            exitBtn.onclick = () => {
                if (document.exitFullscreen) document.exitFullscreen();
                document.body.classList.remove('meeting-mode');
                exitBtn.remove();
            };
            document.body.appendChild(exitBtn);
        }
    }

    refreshKpiImages() {
        document.querySelectorAll('.kpi-card').forEach(card => {
            const kpiId = card.id;
            const savedPath = localStorage.getItem(`kpi-image-${kpiId}`);
            if (savedPath) {
                this.loadKpiImage(kpiId, card, savedPath);
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new PerformanceDashboard();
});
