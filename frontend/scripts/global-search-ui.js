document.addEventListener('DOMContentLoaded', () => {
    initGlobalSearch();
});

function initGlobalSearch() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('globalSearchInput');
    const closeBtn = document.getElementById('closeSearch');
    const resultsContainer = document.getElementById('searchResults');
    const initialState = document.getElementById('searchInitialState');
    const historyList = document.getElementById('searchHistoryList');
    
    if (!overlay || !input) return;

    // Open/Close Logic
    function openSearch() {
        overlay.style.display = 'flex';
        // Force reflow
        overlay.offsetHeight; 
        overlay.classList.add('active');
        input.focus();
        loadHistory();
    }

    function closeSearch() {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
            input.value = '';
            showInitialState();
        }, 200);
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (overlay.classList.contains('active')) {
                closeSearch();
            } else {
                openSearch();
            }
        }
        
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeSearch();
        }
    });

    closeBtn.addEventListener('click', closeSearch);
    
    // Close on click outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSearch();
    });

    // Search Logic
    let debounceTimer;
    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(debounceTimer);
        
        if (query.length === 0) {
            showInitialState();
            return;
        }

        debounceTimer = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    function showInitialState() {
        initialState.style.display = 'block';
        resultsContainer.style.display = 'none';
        document.getElementById('searchLoading').style.display = 'none';
    }

    function loadHistory() {
        // Mock history for now
        const history = JSON.parse(localStorage.getItem('search_history') || '[]');
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-message">No recent searches</div>';
            return;
        }

        history.forEach(term => {
            const div = document.createElement('div');
            div.className = 'search-history-item';
            div.innerHTML = `<i class="fas fa-history"></i> ${term}`;
            div.addEventListener('click', () => {
                input.value = term;
                performSearch(term);
            });
            historyList.appendChild(div);
        });
    }

    async function performSearch(query) {
        initialState.style.display = 'none';
        resultsContainer.style.display = 'none';
        document.getElementById('searchLoading').style.display = 'flex';

        // Simulate search delay
        await new Promise(r => setTimeout(r, 500));
        
        // Mock Results Data
        const mockResults = [
            { type: 'app', title: 'Daily Plan', subtitle: 'Application', icon: 'fas fa-calendar-alt', url: '/apps/daily-plan.html' },
            { type: 'app', title: 'Gallery', subtitle: 'Application', icon: 'fas fa-images', url: '/apps/gallery.html' },
            { type: 'app', title: 'Performance KPIs', subtitle: 'Dashboard', icon: 'fas fa-chart-line', url: '/apps/dashboard.html' },
            { type: 'file', title: 'Q4 Report.pdf', subtitle: 'Documents', icon: 'fas fa-file-pdf', url: '#' },
            { type: 'file', title: 'Warehouse Layout.png', subtitle: 'Images', icon: 'fas fa-image', url: '#' },
            { type: 'action', title: 'System Settings', subtitle: 'Admin', icon: 'fas fa-cog', url: '/admin.html' }
        ];

        const filtered = mockResults.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) || 
            item.subtitle.toLowerCase().includes(query.toLowerCase())
        );

        renderResults(filtered, query);
    }

    function renderResults(results, query) {
        document.getElementById('searchLoading').style.display = 'none';
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.5);">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    No results found for "${query}"
                </div>
            `;
            return;
        }

        const group = document.createElement('div');
        group.className = 'result-group';
        group.innerHTML = `<div class="section-title">Best Matches</div>`;

        results.forEach(item => {
            const el = document.createElement('div');
            el.className = 'result-item';
            el.innerHTML = `
                <div class="result-icon"><i class="${item.icon}"></i></div>
                <div class="result-info">
                    <div class="result-title">${highlightMatch(item.title, query)}</div>
                    <div class="result-subtitle">${item.subtitle}</div>
                </div>
                <i class="fas fa-chevron-right" style="color: rgba(255,255,255,0.2); font-size: 0.8rem;"></i>
            `;
            el.addEventListener('click', () => {
                // Save to history
                const history = JSON.parse(localStorage.getItem('search_history') || '[]');
                if (!history.includes(query)) {
                    history.unshift(query);
                    localStorage.setItem('search_history', JSON.stringify(history.slice(0, 5)));
                }
                
                if (item.url && item.url !== '#') {
                    window.location.href = item.url;
                }
            });
            group.appendChild(el);
        });

        resultsContainer.appendChild(group);
    }

    function highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span style="color: #818cf8; font-weight: 700;">$1</span>');
    }
}

