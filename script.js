// ==========================================================================
// ADIPRAGYA - Optimized Script
// Performance-focused with mobile support
// ==========================================================================

(function() {
    'use strict';

    // Mobile Detection
    const isMobile = window.matchMedia('(max-width: 1024px)').matches;
    const isLowEnd = isMobile && (navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 2);

    // ==========================================================================
    // Custom Cursor (Desktop Only)
    // ==========================================================================

    let cursor = null;
    let trails = [];
    const trailCount = isMobile ? 0 : 8;

    if (!isMobile) {
        cursor = document.getElementById('custom-cursor');
        
        // Create cursor trails
        for (let i = 0; i < trailCount; i++) {
            const t = document.createElement('div');
            t.classList.add('cursor-trail');
            document.body.appendChild(t);
            trails.push({ el: t, x: 0, y: 0 });
        }

        // Mouse move handler with throttling
        let lastMouseMove = 0;
        const mouseMoveThrottle = 16; // ~60fps

        window.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastMouseMove < mouseMoveThrottle) return;
            lastMouseMove = now;

            const x = e.clientX;
            const y = e.clientY;

            if (cursor) {
                cursor.style.left = `${x}px`;
                cursor.style.top = `${y}px`;
            }

            // Trail logic with reduced updates
            trails.forEach((trail, index) => {
                setTimeout(() => {
                    trail.el.style.left = `${x}px`;
                    trail.el.style.top = `${y}px`;
                    trail.el.style.opacity = (trailCount - index) / trailCount * 0.5;
                    trail.el.style.transform = `translate(-50%, -50%) scale(${(trailCount - index) / trailCount})`;
                }, index * 40);
            });
        }, { passive: true });

        // Hover effects
        document.querySelectorAll('a, button, .stone-tablet, .product-scroll').forEach(el => {
            el.addEventListener('mouseenter', () => cursor && cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('hover'));
        });
    } else {
        // Remove cursor elements on mobile
        const cursorEl = document.getElementById('custom-cursor');
        if (cursorEl) cursorEl.style.display = 'none';
        document.querySelectorAll('.cursor-trail').forEach(el => el.remove());
    }

    // ==========================================================================
    // Three.js Integration - Optimized
    // ==========================================================================

    let scene, camera, renderer, mainObject;
    const chakraContainer = document.getElementById('chakra-3d');
    const yantraContainer = document.getElementById('yantra-3d');
    const gearContainer = document.getElementById('gear-3d');

    let gearSpeed = 0;
    let animationId = null;
    let isAnimating = false;
    let isPageVisible = true;
    let isChakraVisible = true;

    // Performance settings based on device
    const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5);
    const segments = isMobile ? 48 : 100; // Reduce geometry segments on mobile
    const spokeSegments = isMobile ? 4 : 8;

    // Initialize Three.js for each container
    if (chakraContainer) initThree(chakraContainer, 'chakra');
    if (yantraContainer && !isMobile) initThree(yantraContainer, 'yantra');
    if (gearContainer && !isMobile) initThree(gearContainer, 'gear');

    function initThree(container, type) {
        scene = new THREE.Scene();
        
        // Responsive camera setup
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = type === 'yantra' ? 8 : 5;

        // Optimized renderer
        renderer = new THREE.WebGLRenderer({ 
            antialias: !isMobile, // Disable antialiasing on mobile
            alpha: true,
            powerPreference: isMobile ? 'low-power' : 'high-performance'
        });
        
        renderer.setSize(width, height);
        renderer.setPixelRatio(pixelRatio);
        
        // Disable shadows on mobile
        if (isMobile) {
            renderer.shadowMap.enabled = false;
        }
        
        container.appendChild(renderer.domElement);

        // Simplified material for mobile
        const goldMat = new THREE.MeshPhongMaterial({
            color: 0xC9980A,
            wireframe: true,
            emissive: 0x443300,
            shininess: isMobile ? 0 : 30
        });

        mainObject = new THREE.Group();

        if (type === 'chakra') {
            // Ashok Chakra - Optimized geometry
            const rimGeo = new THREE.TorusGeometry(2, 0.05, isMobile ? 8 : 16, segments);
            const rim = new THREE.Mesh(rimGeo, goldMat);
            mainObject.add(rim);
            
            // 24 spokes with reduced segments
            for (let i = 0; i < 24; i++) {
                const spokeGeo = new THREE.CylinderGeometry(0.01, 0.01, 4, spokeSegments);
                const spoke = new THREE.Mesh(spokeGeo, goldMat);
                spoke.rotation.z = (i / 24) * Math.PI * 2;
                mainObject.add(spoke);
            }
        } else if (type === 'yantra') {
            // Yantra - Reduced complexity on mobile
            const pyramidCount = isMobile ? 5 : 9;
            for (let i = 0; i < pyramidCount; i++) {
                const pyramidGeo = new THREE.ConeGeometry(1 + (i * 0.5), 2 + (i * 0.2), 3);
                const pyramid = new THREE.Mesh(pyramidGeo, goldMat);
                pyramid.position.z = i * 0.2;
                pyramid.rotation.x = i % 2 === 0 ? 0 : Math.PI;
                mainObject.add(pyramid);
            }
        } else if (type === 'gear') {
            // Gear - Simplified
            const gearGeo = new THREE.TorusGeometry(5, 0.5, isMobile ? 4 : 8, segments);
            const gear = new THREE.Mesh(gearGeo, goldMat);
            mainObject.add(gear);
            
            const spokeCount = isMobile ? 6 : 12;
            for (let i = 0; i < spokeCount; i++) {
                const spokeGeo = new THREE.BoxGeometry(0.2, 12, 0.2);
                const spoke = new THREE.Mesh(spokeGeo, goldMat);
                spoke.rotation.z = (i / spokeCount) * Math.PI * 2;
                mainObject.add(spoke);
            }
        }

        scene.add(mainObject);

        // Simplified lighting for mobile
        const ambientLight = new THREE.AmbientLight(0xffffff, isMobile ? 0.7 : 0.5);
        scene.add(ambientLight);
        
        if (!isMobile) {
            const pointLight = new THREE.PointLight(0xffffff, 1);
            pointLight.position.set(5, 5, 5);
            scene.add(pointLight);
        }

        // Mouse Interaction for Chakra (Subtle tilt on hover)
        let targetRotationX = 0;
        let targetRotationY = 0;
        const maxTilt = 15 * (Math.PI / 180); // 15 degrees

        if (type === 'chakra' && !isMobile) {
            container.addEventListener('mousemove', (e) => {
                const rect = container.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
                
                targetRotationY = x * maxTilt;
                targetRotationX = y * maxTilt;
            }, { passive: true });

            container.addEventListener('mouseleave', () => {
                targetRotationX = 0;
                targetRotationY = 0;
            }, { passive: true });
        }

        // Optimized animation loop
        function animate() {
            if (!isPageVisible || !isChakraVisible) {
                animationId = requestAnimationFrame(animate);
                return;
            }

            if (mainObject) {
                if (type === 'chakra') {
                    // Smooth lerp to target rotation
                    mainObject.rotation.y += (targetRotationY - mainObject.rotation.y) * 0.05;
                    mainObject.rotation.x += (targetRotationX - mainObject.rotation.x) * 0.05;
                } else {
                    mainObject.rotation.y += 0.005 + (type === 'gear' ? gearSpeed : 0);
                }
            }

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        }

        // Start animation
        isAnimating = true;
        animate();

        // Dragging logic for non-chakra elements (Desktop only)
        if (type !== 'chakra' && !isMobile) {
            let isDragging = false;
            let previousMouseX = 0;
            
            container.addEventListener('mousedown', () => isDragging = true);
            window.addEventListener('mouseup', () => isDragging = false);
            window.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const deltaX = e.clientX - previousMouseX;
                    mainObject.rotation.y += deltaX * 0.01;
                }
                previousMouseX = e.clientX;
            }, { passive: true });
        }
    }

    // ==========================================================================
    // Page Visibility API - Pause when tab is inactive
    // ==========================================================================

    document.addEventListener('visibilitychange', () => {
        isPageVisible = !document.hidden;
    });

    // ==========================================================================
    // Intersection Observer - Pause when off-screen
    // ==========================================================================

    if (chakraContainer) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isChakraVisible = entry.isIntersecting;
            });
        }, { threshold: 0.1 });
        
        observer.observe(chakraContainer);
    }

    // ==========================================================================
    // GSAP Animations - Optimized
    // ==========================================================================

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Hero content animation
        gsap.from(".hero-content > *", {
            duration: isMobile ? 1 : 1.5,
            y: isMobile ? 30 : 50,
            opacity: 0,
            stagger: isMobile ? 0.1 : 0.2,
            ease: "power4.out"
        });

        // Stone tablet animations (reduced on mobile)
        if (!isMobile) {
            gsap.utils.toArray(".stone-tablet, .product-scroll").forEach(card => {
                gsap.from(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                    },
                    duration: 1.2,
                    y: 80,
                    opacity: 0,
                    ease: "power3.out"
                });
            });
        }

        // Count-up stats (simplified on mobile)
        gsap.utils.toArray(".stat-number").forEach(num => {
            const val = parseInt(num.innerText);
            num.innerText = "0";
            gsap.to(num, {
                scrollTrigger: {
                    trigger: num,
                    start: "top 90%",
                },
                innerText: val,
                duration: isMobile ? 1.5 : 2.5,
                snap: { innerText: 1 },
                ease: "power2.inOut"
            });
        });
    }

    // Speed up gear on interaction (Desktop only)
    if (!isMobile) {
        document.querySelectorAll('.product-scroll').forEach(item => {
            item.addEventListener('mouseenter', () => gearSpeed = 0.05);
            item.addEventListener('mouseleave', () => gearSpeed = 0);
        });
    }

    // ==========================================================================
    // Handle Resize - Optimized
    // ==========================================================================

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const activeCont = chakraContainer || yantraContainer || gearContainer;
            if (activeCont && camera && renderer) {
                const width = activeCont.clientWidth;
                const height = activeCont.clientHeight;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            }
        }, 250); // Debounce resize
    }, { passive: true });

    // ==========================================================================
    // Cleanup on page unload
    // ==========================================================================

    window.addEventListener('beforeunload', () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        if (renderer) {
            renderer.dispose();
        }
    });

})();
