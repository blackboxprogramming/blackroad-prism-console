class CreatorPortal {
    constructor() {
        this.portals = {
            'homework-ai': {
                name: 'Homework AI Portal',
                description: 'AI-powered homework assistance',
                features: ['Math Solver', 'Essay Writer', 'Science Helper', 'Language Support']
            },
            'co-coding': {
                name: 'Co-Coding Portal', 
                description: 'Collaborative coding with AI',
                features: ['Live Collaboration', 'AI Assistant', 'Safe Sandboxes', 'Version Control']
            },
            'roadview': {
                name: 'RoadView Studio',
                description: 'AI video and story creation',
                features: ['Script Generation', 'Face Synthesis', 'Video Editing', 'Story Builder']
            },
            'roadworld': {
                name: 'Road World Simulation',
                description: 'Ultimate reality simulation game',
                features: ['Historical Sims', 'Future Scenarios', 'Decision Trees', 'Timeline Travel']
            },
            'tinkering-lab': {
                name: 'Tinkering Laboratory',
                description: 'Molecular and atomic interactions',
                features: ['Molecular Viewer', 'Chemical Reactions', 'Physics Sims', '3D Models']
            },
            'math-3d': {
                name: '3D Math Visualizer',
                description: 'Visual mathematics and equations',
                features: ['3D Graphing', 'Complex Numbers', 'Interactive Geometry', 'Math Art']
            }
        };
        
        this.stats = {
            totalCreators: 0,
            projectsCreated: 0,
            portalsActive: 6,
            onlineUsers: 0
        };
        
        this.init();
    }

    init() {
        console.log('🎨 CreatorPortal initialized');
        this.setupEventListeners();
        this.loadCreatorStats();
        this.animateElements();
        this.setupPortalInteractions();
    }

    setupEventListeners() {
        // Portal links
        document.querySelectorAll('.portal-link').forEach(link => {
            link.addEventListener('click', (e) => this.handlePortalClick(e));
        });

        // Dropdown menus
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            dropdown.addEventListener('mouseenter', () => {
                this.showDropdown(dropdown);
            });
            
            dropdown.addEventListener('mouseleave', () => {
                this.hideDropdown(dropdown);
            });
        });

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    handlePortalClick(event) {
        event.preventDefault();
        const link = event.target;
        const portalPath = link.getAttribute('href').substring(1); // Remove leading slash
        
        console.log(`🚪 Entering portal: ${portalPath}`);
        
        // Add loading state
        const portal = link.closest('.portal');
        if (portal) {
            portal.classList.add('portal-loading');
        }

        // Simulate portal loading
        setTimeout(() => {
            if (portal) {
                portal.classList.remove('portal-loading');
            }
            this.enterPortal(portalPath);
        }, 1500);
    }

    enterPortal(portalPath) {
        const portalInfo = this.portals[portalPath];
        
        if (portalInfo) {
            console.log(`✨ Entering ${portalInfo.name}`);
            
            // For now, show a preview modal or redirect
            this.showPortalPreview(portalPath, portalInfo);
        } else {
            console.log(`❓ Portal not found: ${portalPath}`);
            // Redirect to a generic "coming soon" page
            window.location.href = `/portal/${portalPath}`;
        }
    }

    showPortalPreview(portalPath, portalInfo) {
        // Create a preview modal
        const modal = document.createElement('div');
        modal.className = 'portal-preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🚀 ${portalInfo.name}</h2>
                    <button class="close-modal">×</button>
                </div>
                <div class="modal-body">
                    <p>${portalInfo.description}</p>
                    <h3>Features:</h3>
                    <ul>
                        ${portalInfo.features.map(feature => `<li>✓ ${feature}</li>`).join('')}
                    </ul>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="window.location.href='/${portalPath}'">
                            Enter Portal
                        </button>
                        <button class="btn btn-secondary close-modal">
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;

        document.body.appendChild(modal);

        // Close modal functionality
        modal.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    loadCreatorStats() {
        console.log('📊 Loading creator statistics');
        
        // Simulate real-time stats
        this.animateStats();
        
        // Update stats every 30 seconds
        setInterval(() => {
            this.updateStats();
        }, 30000);
    }

    animateStats() {
        const counters = {
            'total-creators': { target: 15847, current: 0 },
            'projects-created': { target: 89234, current: 0 },
            'online-users': { target: 1456, current: 0 }
        };

        Object.entries(counters).forEach(([id, data]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateNumber(element, data.current, data.target, 2000);
            }
        });
    }

    animateNumber(element, start, target, duration) {
        const startTime = performance.now();
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (target - start) * easeOutQuart);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };
        
        requestAnimationFrame(updateNumber);
    }

    updateStats() {
        // Simulate real-time updates
        const variance = 0.05; // 5% variance
        
        Object.keys(this.stats).forEach(key => {
            if (key !== 'portalsActive') {
                const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
                if (element) {
                    const currentValue = parseInt(element.textContent.replace(/,/g, ''));
                    const change = Math.floor(currentValue * variance * (Math.random() - 0.5));
                    const newValue = Math.max(0, currentValue + change);
                    element.textContent = newValue.toLocaleString();
                }
            }
        });
    }

    animateElements() {
        // Add scroll-triggered animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe portals and features
        document.querySelectorAll('.portal, .feature').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });
    }

    setupPortalInteractions() {
        // Add hover effects and interactions
        document.querySelectorAll('.portal').forEach(portal => {
            portal.addEventListener('mouseenter', () => {
                this.highlightPortal(portal);
            });
            
            portal.addEventListener('mouseleave', () => {
                this.unhighlightPortal(portal);
            });
        });
    }

    highlightPortal(portal) {
        // Add glowing effect
        portal.style.boxShadow = '0 30px 60px rgba(108, 92, 231, 0.3)';
        
        // Animate the icon
        const icon = portal.querySelector('.portal-icon');
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
        }
    }

    unhighlightPortal(portal) {
        // Remove effects
        portal.style.boxShadow = '';
        
        const icon = portal.querySelector('.portal-icon');
        if (icon) {
            icon.style.transform = '';
        }
    }

    showDropdown(dropdown) {
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
            menu.style.opacity = '1';
            menu.style.visibility = 'visible';
            menu.style.transform = 'translateY(0)';
        }
    }

    hideDropdown(dropdown) {
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
            menu.style.opacity = '0';
            menu.style.visibility = 'hidden';
            menu.style.transform = 'translateY(-10px)';
        }
    }

    // Utility methods for specific portals
    launchHomeworkAI() {
        console.log('🎓 Launching Homework AI Portal');
        // Implementation for homework AI portal
    }

    launchCoCoding() {
        console.log('👥 Launching Co-Coding Portal');
        // Implementation for co-coding portal
    }

    launchRoadView() {
        console.log('🎬 Launching RoadView Studio');
        // Implementation for video creation portal
    }

    launchRoadWorld() {
        console.log('🌍 Launching Road World Simulation');
        // Implementation for world simulation portal
    }

    launchTinkeringLab() {
        console.log('⚛️ Launching Tinkering Laboratory');
        // Implementation for molecular tinkering portal
    }

    launchMath3D() {
        console.log('📐 Launching 3D Math Visualizer');
        // Implementation for 3D math portal
    }
}

// Initialize the Creator Portal
const creatorPortal = new CreatorPortal();

// Make it globally available
window.creatorPortal = creatorPortal;

console.log('🎨 Creator Portal system loaded');
console.log('🚀 Ready to make dreams reality!');

// Add some fun console messages
console.log(`
🌟 Welcome to BlackRoad Creator Universe! 🌟

Available Portals:
🎓 Homework AI - Never struggle with assignments again
👥 Co-Coding - Code together, create together  
🎬 RoadView - Hollywood-level content creation
🌍 Road World - Ultimate reality simulation
⚛️ Tinkering Lab - Explore the building blocks of reality
📐 3D Math - See mathematics come alive

If you can dream it, you can make it! ✨
`);
