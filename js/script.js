// Debug flag (true only when ?debug=1)
const DEBUG = (new URLSearchParams(window.location.search).get('debug') === '1');
function debugLog(...args) { if (DEBUG) console.log(...args); }

// Simple test to see if JavaScript is running
debugLog('🧪 JavaScript file loaded successfully');

// --- Video & Asset Lazy Loading ---
function initLazyLoading() {
    // Target all videos that have the "lazy" class
    const lazyVideos = document.querySelectorAll("video.lazy");

    if ("IntersectionObserver" in window) {
        // Create a new observer
        let lazyVideoObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(videoEntry) {
                // If the video is in the viewport
                if (videoEntry.isIntersecting) {
                    const video = videoEntry.target;
                    // Find all <source> tags within the video
                    for (const source of video.children) {
                        if (source.tagName === "SOURCE" && source.dataset.src) {
                            // Set the src from the data-src attribute
                            source.src = source.dataset.src;
                        }
                    }
                    // Load and play the video, then stop observing it
                    video.load();
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => console.error("Lazy-load video play failed:", error));
                    }
                    video.classList.remove("lazy");
                    lazyVideoObserver.unobserve(video);
                    console.log('🎬 Lazy-loaded video:', video);
                }
            });
        });

        // Observe each lazy video
        lazyVideos.forEach(function(lazyVideo) {
            lazyVideoObserver.observe(lazyVideo);
        });
    }
}

// Background audio functionality
function initBackgroundAudio() {
    const backgroundAudio = document.getElementById('backgroundAudio');
    const audioBtn = document.getElementById('playAudioBtn');

    // If elements missing, bail out gracefully
    if (!backgroundAudio || !audioBtn) return;

    // Use data-src attribute so audio doesn't download until the user opts in.
    const PREF_KEY = 'bk_audio_playing';
    const defaultVolume = 0.3;
    let fadeTimer = null;

    // Monkeypatch the audio element's play() to handle AbortError races (play interrupted by pause).
    (function installSafePlay(el){
        if (!el) return;
        if (el._safePlayInstalled) return;
        const origPlay = el.play.bind(el);
        el._safePlayInstalled = true;
        el._playLock = false;
        el.play = async function() {
            if (el._playLock) {
                await new Promise(r=>setTimeout(r, 100));
            }
            el._playLock = true;
            try {
                const p = origPlay();
                if (p && typeof p.then === 'function') {
                    return p.catch(async (err)=>{
                        if (err && err.name === 'AbortError') {
                            console.warn('safePlay: AbortError detected, retrying');
                            await new Promise(r=>setTimeout(r, 160));
                            return await origPlay();
                        }
                        throw err;
                    });
                }
                return p;
            } finally {
                el._playLock = false;
            }
        };
    })(backgroundAudio);

    function setButtonState(playing) {
        if (playing) {
            audioBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Audio On</span>';
            audioBtn.classList.add('playing');
            audioBtn.setAttribute('aria-pressed', 'true');
        } else {
            audioBtn.innerHTML = '<i class="fas fa-volume-mute"></i><span>Enable Audio</span>';
            audioBtn.classList.remove('playing');
            audioBtn.setAttribute('aria-pressed', 'false');
        }
    }

    // Initialize audio element defaults and click handler
    backgroundAudio.volume = defaultVolume;
    backgroundAudio.loop = true;

    

    function loadAudioIfNeeded() {
        if (!backgroundAudio.src && backgroundAudio.dataset && backgroundAudio.dataset.src) {
            // Respect Save-Data and very slow connections
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn && (conn.saveData || /2g/.test(conn.effectiveType || '')) ) {
                console.log('🎵 Deferring audio load due to Save-Data or slow connection');
                return false;
            }
            backgroundAudio.src = backgroundAudio.dataset.src;
            backgroundAudio.load();
            console.log('🎵 Background audio src set and loading');
            return true;
        }
        return !!backgroundAudio.src;
    }

    function fadeVolumeTo(target, duration = 600) {
        if (fadeTimer) clearInterval(fadeTimer);
        const start = backgroundAudio.volume || 0;
        const delta = target - start;
        const steps = 20;
        let current = 0;
        fadeTimer = setInterval(() => {
            current++;
            const v = start + (delta * (current / steps));
            backgroundAudio.volume = Math.max(0, Math.min(1, v));
            if (current >= steps) {
                clearInterval(fadeTimer);
                fadeTimer = null;
                backgroundAudio.volume = Math.round(target * 100) / 100;
            }
        }, Math.max(10, Math.floor(duration / steps)));
    }

    // Click handler: load audio if needed and toggle play/pause with fade
    audioBtn.addEventListener('click', async function() {
        console.log('🎵 Audio button clicked (improved)');
        // Load audio only when user interacts (if not already loaded)
        loadAudioIfNeeded();

        if (backgroundAudio.paused) {
            try {
                // start muted then fade in
                backgroundAudio.volume = 0;
                backgroundAudio.loop = true;
                await backgroundAudio.play();
                fadeVolumeTo(defaultVolume, 800);
                setButtonState(true);
                localStorage.setItem(PREF_KEY, '1');
                console.log('🎵 Background audio started');
            } catch (err) {
                console.log('🎵 Play failed:', err);
                setButtonState(false);
            }
        } else {
            // fade out then pause
            fadeVolumeTo(0, 400);
            setTimeout(() => {
                backgroundAudio.pause();
                setButtonState(false);
                localStorage.setItem(PREF_KEY, '0');
                console.log('🔇 Background audio paused (user)');
            }, 420);
        }
    });

    // Pause audio when page hidden to save resources; resume only if it was playing
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            if (!backgroundAudio.paused) {
                backgroundAudio._wasPlayingBeforeHidden = true;
                backgroundAudio.pause();
                console.log('🎵 Paused audio due to page hidden');
            }
        } else {
            if (backgroundAudio._wasPlayingBeforeHidden) {
                loadAudioIfNeeded();
                backgroundAudio.play().then(() => {
                    fadeVolumeTo(defaultVolume, 500);
                    console.log('🎵 Resumed audio after visibility');
                }).catch(() => {
                    console.log('🎵 Could not resume audio after visibility');
                });
                backgroundAudio._wasPlayingBeforeHidden = false;
            }
        }
    });

    // On first user interaction, if the user previously opted-in, load/play
    function onFirstInteraction() {
        window.removeEventListener('pointerdown', onFirstInteraction);
        window.removeEventListener('keydown', onFirstInteraction);
        window.removeEventListener('touchstart', onFirstInteraction);
        if (localStorage.getItem(PREF_KEY) === '1') {
            if (loadAudioIfNeeded()) {
                backgroundAudio.play().then(() => {
                    fadeVolumeTo(defaultVolume, 600);
                    setButtonState(true);
                    console.log('🎵 Auto-started audio based on saved preference');
                }).catch(() => {
                    console.log('🎵 Auto-start blocked by browser');
                });
            }
        }
    }
    window.addEventListener('pointerdown', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    window.addEventListener('touchstart', onFirstInteraction, { once: true });

    // Set initial button state
    setButtonState(false);
    debugLog('🎵 Background audio initialized (lazy, user-triggered)');
}

// Video intro functionality
function initVideoIntro() {
    console.log('🎬 initVideoIntro function called');
    const videoIntro = document.getElementById('videoIntro');
    const introVideo = document.getElementById('introVideo');
    const loadingProgress = document.querySelector('.loading-progress');
    
    if (videoIntro && introVideo) {
        let videoDuration = 0;
        let currentTime = 0;
        
        // Get video duration when metadata is loaded
        introVideo.addEventListener('loadedmetadata', function() {
            videoDuration = introVideo.duration;
            console.log('🎬 Video duration:', videoDuration, 'seconds');
            
            // Mobile fallback: if video doesn't end properly, force transition after duration
            setTimeout(() => {
                if (videoIntro.style.display !== 'none') {
                    console.log('🎬 Mobile timeout fallback: Forcing transition after video duration');
                    transitionToMainSite();
                }
            }, (videoDuration * 1000) + 1000); // Video duration + 1 second buffer
        });
        
        // Update loading bar based on video progress
        introVideo.addEventListener('timeupdate', function() {
            currentTime = introVideo.currentTime;
            const progress = (currentTime / videoDuration) * 100;
            if (loadingProgress) {
                loadingProgress.style.width = progress + '%';
            }
            
            // Transition to main site much earlier to avoid any freezing
            if (videoDuration > 0 && currentTime >= videoDuration - 2.0) {
                console.log('🎬 Transitioning to main site well before video ends');
                transitionToMainSite();
                // Remove the timeupdate listener to prevent multiple transitions
                introVideo.removeEventListener('timeupdate', arguments.callee);
                // Pause the video to prevent it from reaching the end
                introVideo.pause();
            }
        });
        
        // Handle video end - transition to main site (fallback)
        introVideo.addEventListener('ended', function() {
            console.log('🎬 Video intro ended (fallback transition)');
            // Only transition if not already done
            const videoIntro = document.getElementById('videoIntro');
            if (videoIntro && videoIntro.style.display !== 'none') {
            transitionToMainSite();
            }
        });
        
        // Mobile-specific debugging
        introVideo.addEventListener('error', function(e) {
            console.log('🎬 Video error on mobile:', e);
        });
        
        introVideo.addEventListener('stalled', function() {
            console.log('🎬 Video stalled on mobile');
        });
        
        introVideo.addEventListener('waiting', function() {
            console.log('🎬 Video waiting on mobile');
        });
        
        // Debug video loading
        introVideo.addEventListener('loadstart', function() {
            console.log('🎬 Video load started');
        });
        
        console.log('🎬 Video intro initialized');
    }
}

// Initiate Sequence functionality
function initInitiateSequence() {
    debugLog('🔧 Initiate sequence function called');
    const initiateSequence = document.getElementById('initiateSequence');
    const videoIntro = document.getElementById('videoIntro');
    const introVideo = document.getElementById('introVideo');
    const backgroundAudio = document.getElementById('backgroundAudio');
    const audioBtn = document.getElementById('playAudioBtn');
    
    console.log('🔧 Initiate sequence elements found:', {
        initiateSequence: !!initiateSequence,
        videoIntro: !!videoIntro,
        introVideo: !!introVideo,
        backgroundAudio: !!backgroundAudio,
        audioBtn: !!audioBtn
    });
    
    if (initiateSequence) {
        // Add click handler to the flashing box
        const flashingBox = initiateSequence.querySelector('.flashing-box');
        console.log('🔧 Flashing box found:', !!flashingBox);
        
        if (flashingBox) {
            flashingBox.addEventListener('click', async function() {
                console.log('🚀 Initiate sequence clicked');
                
                // Change button text and add flashing red effect
                const sequenceText = flashingBox.querySelector('.sequence-text');
                if (sequenceText) {
                    sequenceText.textContent = 'System Activated';
                }
                
                // Add 'activated' class to apply styles from CSS
                flashingBox.classList.add('activated');

                // Initialize audio experience on first user click and attempt playback
                try {
                    initAudioExperience();
                    const bg = document.getElementById('backgroundAudio');
                    if (bg && bg.paused) {
                        // Load lazily and play as part of the user gesture
                        if (!bg.src && bg.dataset && bg.dataset.src) {
                            bg.src = bg.dataset.src;
                            bg.load();
                        }
                        await bg.play();
                        // If play succeeds, update UI
                        if (audioBtn) {
                            audioBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Audio On</span>';
                            audioBtn.classList.add('playing');
                        }
                    }
                } catch (error) {
                    // Fail gracefully for users; log full error to console only in debug mode
                    if (typeof DEBUG !== 'undefined' && DEBUG) {
                        console.error('🎵 Audio failed to start on initiate click:', error);
                    } else {
                        console.warn('🎵 Audio failed to start (user-facing message shown)');
                    }
                    showUserNotice('Audio unavailable — experience continues silently');
                    if (audioBtn) {
                        audioBtn.setAttribute('aria-disabled', 'true');
                    }
                }
                
                // Voice announcement
                if ('speechSynthesis' in window) {
                    const speechSynth = window.speechSynthesis;
                    const speechUtterance = new SpeechSynthesisUtterance('System activated');
                    speechUtterance.rate = 0.8;
                    speechUtterance.pitch = 0.8;
                    speechUtterance.volume = 1.0;
                    
                    // Set voice
                    const voices = speechSynth.getVoices();
                    const trinoidsVoice = voices.find(voice => voice.name.includes('Trinoids'));
                    if (trinoidsVoice) {
                        speechUtterance.voice = trinoidsVoice;
                    }
                    
                    // Track speech timing
                    let speechStartTime = null;
                    let speechDuration = null;
                    
                    speechUtterance.onstart = () => {
                        speechStartTime = Date.now();
                    };
                    
                    speechUtterance.onend = () => {
                        speechDuration = Date.now() - speechStartTime;
                        
                        // Stop the blinking animation
                        flashingBox.classList.remove('activated');
                        
                        // Hide the initiate sequence immediately
                        initiateSequence.style.display = 'none';
                        
                        // Start video immediately after voice ends
                        console.log('🎬 Starting video immediately after voice ends');
                        startVideoSequence();
                    };

                    speechSynth.speak(speechUtterance);
                } else {
                    // Fallback if speech synthesis not available
                    setTimeout(() => {
                        // Stop the blinking animation and hide the sequence
                        flashingBox.classList.remove('activated');
                        initiateSequence.style.display = 'none';
                        
                        startVideoSequence();
                    }, 3000); // 3 second fallback
                }
            });
        }
    }
}

// Start video sequence
function startVideoSequence() {
    const videoIntro = document.getElementById('videoIntro');
    const introVideo = document.getElementById('introVideo');
    const backgroundAudio = document.getElementById('backgroundAudio');
    const audioBtn = document.getElementById('playAudioBtn');
                
                // Show video intro
                if (videoIntro) {
                    console.log('🎬 Showing video intro');
                    videoIntro.style.display = 'block';
                    videoIntro.style.opacity = '1';
        videoIntro.style.visibility = 'visible';
        videoIntro.style.zIndex = '9999';
        
        // Mobile-specific debugging
        console.log('🎬 Video intro display:', videoIntro.style.display);
        console.log('🎬 Video intro opacity:', videoIntro.style.opacity);
        console.log('🎬 Video intro visibility:', videoIntro.style.visibility);
        console.log('🎬 Video intro z-index:', videoIntro.style.zIndex);
                } else {
                    console.log('❌ Video intro element not found');
                }
                
                // Start video
                if (introVideo) {
                    // Set video properties for mobile
                    introVideo.muted = true; // Required for mobile autoplay
                    introVideo.playsInline = true; // Prevents fullscreen on mobile
        
        // Ensure video overlay is visible on mobile
        const videoOverlay = videoIntro.querySelector('.video-overlay');
        if (videoOverlay) {
            videoOverlay.style.display = 'flex';
            videoOverlay.style.visibility = 'visible';
            videoOverlay.style.zIndex = '9999';
            console.log('🎬 Video overlay made visible');
        }
                    
                    introVideo.play().then(() => {
                        console.log('🎬 Video started');
            
                    }).catch((error) => {
                        console.log('🎬 Video failed to start:', error);
                        // Fallback: if video fails, still show the main site
                        setTimeout(() => {
                            transitionToMainSite();
                        }, 1000);
                    });
        
        // Mobile fallback: ensure video intro is visible after a delay
        setTimeout(() => {
            if (videoIntro && videoIntro.style.display !== 'none') {
                console.log('🎬 Mobile fallback: Ensuring video intro is visible');
                videoIntro.style.display = 'block';
                videoIntro.style.opacity = '1';
                videoIntro.style.visibility = 'visible';
                
                const videoOverlay = videoIntro.querySelector('.video-overlay');
                if (videoOverlay) {
                    videoOverlay.style.display = 'flex';
                    videoOverlay.style.visibility = 'visible';
                }
            }
        }, 500);
    }
}

// Transition to main site (only called after video ends)
function transitionToMainSite() {
    const videoIntro = document.getElementById('videoIntro');
    const audioBtn = document.getElementById('playAudioBtn');
    
    if (videoIntro) {
        console.log('🎬 Starting transition to main site');
        
        // Fade out video intro
        videoIntro.classList.add('fade-out');
        
        // After fade animation, hide video intro
        setTimeout(() => {
            videoIntro.style.display = 'none';
            videoIntro.classList.remove('fade-out');
            console.log('🎬 Transition to main site complete');
        }, 1000); // Faster transition to avoid freezing
    }
}

// Start audio on first user interaction (fallback)
function startAudioOnInteraction() {
    const backgroundAudio = document.getElementById('backgroundAudio');
    const audioBtn = document.getElementById('playAudioBtn');
    
    if (backgroundAudio && audioBtn && backgroundAudio.paused) {
        backgroundAudio.play().then(() => {
            console.log('🎵 Audio started on user interaction');
            audioBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Audio On</span>';
            audioBtn.classList.add('playing');
        }).catch((error) => {
            console.log('🎵 Audio failed on interaction:', error);
        });
    }
}

// --- Global State and Cached Elements ---
const AppState = {
    contentSections: null,
    navTabs: null
};

document.addEventListener('DOMContentLoaded', function() {
    debugLog('🚀 DOM Content Loaded - Starting initialization');

    // Cache DOM elements
    AppState.contentSections = document.querySelectorAll('.content-section');
    AppState.navTabs = document.querySelectorAll('.nav-tab');

    // Initialize all modules (guard calls that may not exist in older builds)
    if (typeof initVideoIntro === 'function') initVideoIntro();
    // Audio initialization is deferred until an explicit user gesture
    if (typeof initInitiateSequence === 'function') initInitiateSequence();
    if (typeof initLazyLoading === 'function') initLazyLoading();
    if (typeof initNavigation === 'function') initNavigation();
    if (typeof initInteractiveEffects === 'function') initInteractiveEffects();
    if (typeof initClickableEntries === 'function') initClickableEntries();
    if (typeof initMobileNavigation === 'function') initMobileNavigation();
    if (typeof listAvailableVoices === 'function') listAvailableVoices();

    // Initialize with About section
    if (typeof showSection === 'function') showSection('about');
});

// --- Navigation ---
function initNavigation() {
    // Add click event listeners to nav tabs using cached elements
    if (AppState.navTabs) {
        AppState.navTabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.getAttribute('data-section');
                showSection(sectionId);
            });
        });
    }

    // Handle anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });
}

// Wrapper to initialize audio experience on first user gesture
function initAudioExperience() {
    try {
        if (typeof initBackgroundAudio === 'function') {
            initBackgroundAudio();
            console.log('🎧 initAudioExperience: background audio initialized');
            return true;
        }
    } catch (err) {
        console.error('🎧 initAudioExperience failed:', err);
    }
    return false;
}

// Simple user-facing notice (subtle) for audio fallback/errors
function showUserNotice(message, timeout = 4000) {
    try {
        const existing = document.getElementById('userNotice');
        if (existing) {
            existing.textContent = message;
            return;
        }
        const n = document.createElement('div');
        n.id = 'userNotice';
        n.textContent = message;
        n.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:10px 14px;border-radius:8px;font-size:13px;z-index:20000;backdrop-filter:blur(4px);';
        document.body.appendChild(n);
        setTimeout(() => { n.style.transition = 'opacity 300ms'; n.style.opacity = '0'; setTimeout(()=>{ if(n.parentNode) n.parentNode.removeChild(n); }, 300); }, timeout);
    } catch (e) { console.error('showUserNotice error', e); }
}

// Global function to show section - accessible from anywhere
function showSection(sectionId) {
    console.log('🔄 showSection called with:', sectionId);
    
    // Use cached elements from AppState
    AppState.contentSections.forEach(section => {
        section.classList.remove('active');
    });

    AppState.navTabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('🔄 Added active to section:', sectionId);
    } else {
        console.error('❌ Section not found:', sectionId);
    }

    // Add active class to clicked nav tab
    const activeTab = document.querySelector(`.nav-tab[data-section="${sectionId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
        console.log('🔄 Added active to nav tab:', sectionId);
    } else {
        console.log('⚠️ Nav tab not found for section:', sectionId);
    }
}

// --- Enhanced Interactive Effects ---
function initInteractiveEffects() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.experience-card, .project-card, .education-card, .contact-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.boxShadow = '0 15px 35px rgba(0, 212, 255, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = 'none';
        });
    });

    // Add typing effect to the name
    const nameElement = document.querySelector('.name');
    if (nameElement) {
        const text = nameElement.textContent;
        nameElement.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                nameElement.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 60);
            }
        };
        
        // Start typing effect after a short delay
        setTimeout(typeWriter, 500);
    }

    // --- Throttled Parallax Effect ---
    // Throttle function to limit how often a function can run. This improves performance.
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Add throttled parallax effect to the container
    const parallaxElement = document.querySelector('.container');
    if (parallaxElement) {
        window.addEventListener('scroll', throttle(function() {
            const scrolled = window.pageYOffset;
            parallaxElement.style.transform = `translateY(${scrolled * 0.3}px)`;
        }, 16)); // Throttled to run roughly once per frame (1000ms / 60fps ≈ 16ms)
    }
    // Add enhanced glow effect to logo on hover
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 0 50px rgba(0, 212, 255, 0.8), inset 0 0 30px rgba(255, 69, 0, 0.6)';
        });
        
        logo.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 0 40px rgba(0, 212, 255, 0.6), inset 0 0 30px rgba(255, 69, 0, 0.4)';
        });
    }

    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        const activeTab = document.querySelector('.nav-tab.active'); // This can stay as it changes
        const tabs = Array.from(document.querySelectorAll('.nav-tab'));
        const currentIndex = tabs.indexOf(activeTab);
        
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % tabs.length;
            tabs[nextIndex].click();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
            tabs[prevIndex].click();
        }
    });

    // Add scroll to top button
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: rgba(0, 212, 255, 0.2);
        border: 2px solid rgba(0, 212, 255, 0.5);
        border-radius: 50%;
        color: #00d4ff;
        font-size: 1.2rem;
        cursor: pointer;
        z-index: 1000;
        opacity: 0;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(scrollToTopBtn);
    
    // Show/hide scroll to top button
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.opacity = '1';
        } else {
            scrollToTopBtn.style.opacity = '0';
        }
    });
    
    // Scroll to top functionality
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Add particle effects
    function createParticle() {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: rgba(0, 212, 255, 0.6);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1;
            animation: particleFloat 6s linear infinite;
        `;
        
        particle.style.left = Math.random() * window.innerWidth + 'px';
        particle.style.top = window.innerHeight + 'px';
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 6000);
    }
    
    // Create particles periodically
    setInterval(createParticle, 2000);
    
    // Add CSS for particle animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Add contact link click handlers
    document.querySelectorAll('.contact-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const linkText = this.textContent;
            
            // Show notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 212, 255, 0.9);
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                font-family: 'Orbitron', sans-serif;
                font-weight: 300;
                z-index: 1000;
                box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;
            notification.textContent = `Opening: ${linkText}`;
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        });
    });

    // Add photo placeholder click handlers
    document.querySelectorAll('.photo-placeholder').forEach(placeholder => {
        placeholder.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.style.display = 'none';
            
            input.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        placeholder.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
        });
    });
}

// Smooth scrolling utility
const smoothScroll = (target) => {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
};

// Scroll to top utility
const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}; 

// Speech synthesis state
let speechEnabled = true;













// Function to list all available voices
function listAvailableVoices() {
    if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        console.log('=== AVAILABLE VOICES ===');
        voices.forEach((voice, index) => {
            console.log(`${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
        });
        console.log('=== END VOICES ===');
        return voices;
    }
    return [];
}

// Clickable Entries with Typing Effect
// Global variables for speech control
let currentSpeechUtterance = null;
let isCurrentlySpeaking = false;

// Function to stop all speech
function stopAllSpeech() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
        
        // Force stop by speaking and immediately cancelling a dummy utterance
        const dummyUtterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(dummyUtterance);
        window.speechSynthesis.cancel();
        
        console.log('🔇 ALL SPEECH STOPPED');
    }
    currentSpeechUtterance = null;
    isCurrentlySpeaking = false;
}

function initClickableEntries() {
    const clickableEntries = document.querySelectorAll('.clickable-entry');
    
    clickableEntries.forEach(entry => {
        const header = entry.querySelector('.entry-header');
        const content = entry.querySelector('.entry-content');
        const typingText = entry.querySelector('.typing-text');
        const clickIndicator = entry.querySelector('.click-indicator');
        const fullContent = entry.getAttribute('data-content');
        
        if (!fullContent) return;
        
        // Initially hide content
        content.style.display = 'none';
        
        // Add click event to the chevron specifically
        clickIndicator.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent header click from firing
            
            const isExpanded = entry.classList.contains('expanded');
            
            if (!isExpanded) {
                // Stop any existing speech first
                stopAllSpeech();
                
                // Expand and start typing
                entry.classList.add('expanded');
                content.style.display = 'block';
                
                // Update chevron to point up
                const chevron = clickIndicator.querySelector('i');
                chevron.className = 'fas fa-chevron-up';
                
                // Check if this is a category (timeline-category, experience-category, or project-category) - do speech for categories
                if (entry.classList.contains('timeline-category') || entry.classList.contains('experience-category') || entry.classList.contains('project-category')) {
                    // For categories, say only the category title
                    if ('speechSynthesis' in window && speechEnabled) {
                        const categoryTitle = entry.querySelector('.category-title');
                        if (categoryTitle) {
                            const speechSynth = window.speechSynthesis;
                            const speechUtterance = new SpeechSynthesisUtterance(categoryTitle.textContent);
                            speechUtterance.rate = 0.8;
                            speechUtterance.pitch = 0.8;
                            speechUtterance.volume = 1.0;
                            
                            // Set voice
                            const voices = speechSynth.getVoices();
                            const trinoidsVoice = voices.find(voice => voice.name.includes('Trinoids'));
                            if (trinoidsVoice) {
                                speechUtterance.voice = trinoidsVoice;
                            }
                            
                            speechSynth.speak(speechUtterance);
                        }
                    }
                    return;
                }
                
                // For experience cards, do speech for job titles but no typing
                if (entry.classList.contains('experience-card')) {
                    // Get the job title from the header
                    const jobTitle = entry.querySelector('.entry-header h4');
                    if (jobTitle && 'speechSynthesis' in window && speechEnabled) {
                                        const speechSynth = window.speechSynthesis;
                        const speechUtterance = new SpeechSynthesisUtterance(jobTitle.textContent);
                        speechUtterance.rate = 0.8;
                        speechUtterance.pitch = 0.8;
                                        speechUtterance.volume = 1.0;
                                        
                                        // Set voice
                                        const voices = speechSynth.getVoices();
                                        const trinoidsVoice = voices.find(voice => voice.name.includes('Trinoids'));
                                        if (trinoidsVoice) {
                                            speechUtterance.voice = trinoidsVoice;
                                        }
                                        
                                        speechSynth.speak(speechUtterance);
                                    }
                    
                    // Show content immediately without typing
                    const bulletsList = content.querySelector('.experience-bullets');
                    if (bulletsList) {
                        // Show all bullet points immediately
                        const bullets = bulletsList.querySelectorAll('li');
                        bullets.forEach(bullet => {
                            bullet.style.opacity = '1';
                        });
                    }
                    return;
                }
                
                // For project cards, do speech for project titles but no typing
                if (entry.classList.contains('project-card')) {
                    // Get the project title from the header
                    const projectTitle = entry.querySelector('.entry-header h4');
                    if (projectTitle && 'speechSynthesis' in window && speechEnabled) {
                        const speechSynth = window.speechSynthesis;
                        const speechUtterance = new SpeechSynthesisUtterance(projectTitle.textContent);
                        speechUtterance.rate = 0.8;
                        speechUtterance.pitch = 0.8;
                        speechUtterance.volume = 1.0;
                        
                        // Set voice
                        const voices = speechSynth.getVoices();
                        const trinoidsVoice = voices.find(voice => voice.name.includes('Trinoids'));
                        if (trinoidsVoice) {
                            speechUtterance.voice = trinoidsVoice;
                        }
                                        
                                        speechSynth.speak(speechUtterance);
                                    }
                    
                    // Show content immediately without typing
                    const bulletsList = content.querySelector('.experience-bullets');
                    if (bulletsList) {
                        // Show all bullet points immediately
                        const bullets = bulletsList.querySelectorAll('li');
                        bullets.forEach(bullet => {
                            bullet.style.opacity = '1';
                        });
                    }
                    return;
                }
                
                // Only start typing if there's a typing-text element (mission statement)
                if (typingText) {
                    // Clear any existing text and cursor
                    typingText.innerHTML = '';
                    // DON'T start typing effect - just show the content immediately
                    typingText.textContent = fullContent;
                    
                    // Say "Mission Statement" when clicked
                    if ('speechSynthesis' in window && speechEnabled) {
                        const speechSynth = window.speechSynthesis;
                        const speechUtterance = new SpeechSynthesisUtterance('Mission Statement');
                        speechUtterance.rate = 0.8;
                        speechUtterance.pitch = 0.8;
                        speechUtterance.volume = 1.0;
                        
                        // Set voice
                        const voices = speechSynth.getVoices();
                        const trinoidsVoice = voices.find(voice => voice.name.includes('Trinoids'));
                        if (trinoidsVoice) {
                            speechUtterance.voice = trinoidsVoice;
                        }
                        
                        speechSynth.speak(speechUtterance);
                    }
                } else {
                    // For experience cards and project cards, show content immediately without typing
                    const bulletsList = content.querySelector('.experience-bullets');
                    if (bulletsList && (entry.classList.contains('experience-card') || entry.classList.contains('project-card'))) {
                        // Show all bullet points immediately
                        const bullets = bulletsList.querySelectorAll('li');
                        bullets.forEach(bullet => {
                            bullet.style.opacity = '1';
                        });
                    }
                }
                
            } else {
                // Stop speech
                stopAllSpeech();
                
                // Collapse
                entry.classList.remove('expanded');
                content.style.display = 'none';
                
                // Update chevron to point down
                const chevron = clickIndicator.querySelector('i');
                chevron.className = 'fas fa-chevron-down';
                
                if (typingText) {
                    typingText.innerHTML = '';
                }
            }
        });
        
        // Keep the header click as a fallback
        header.addEventListener('click', function(e) {
            // Only trigger if chevron wasn't clicked
            if (e.target.closest('.click-indicator')) return;
            
            const isExpanded = entry.classList.contains('expanded');
            
            if (!isExpanded) {
                // Stop any existing speech first
                stopAllSpeech();
                
                // Expand and start typing
                entry.classList.add('expanded');
                content.style.display = 'block';
                
                // Update chevron to point up
                const chevron = clickIndicator.querySelector('i');
                chevron.className = 'fas fa-chevron-up';
                
                // Check if this is a category (timeline-category, experience-category, or project-category) - do speech for categories
                if (entry.classList.contains('timeline-category') || entry.classList.contains('experience-category') || entry.classList.contains('project-category')) {
                    // For categories, do speech but no typing
                                    if ('speechSynthesis' in window && speechEnabled) {
                                        const speechSynth = window.speechSynthesis;
                        const speechUtterance = new SpeechSynthesisUtterance(fullContent);
                        speechUtterance.rate = 0.8;
                        speechUtterance.pitch = 0.8;
                                        speechUtterance.volume = 1.0;
                                        
                                        // Set voice
                                        const voices = speechSynth.getVoices();
                                        const trinoidsVoice = voices.find(voice => voice.name.includes('Trinoids'));
                                        if (trinoidsVoice) {
                                            speechUtterance.voice = trinoidsVoice;
                                        }
                                        
                                        speechSynth.speak(speechUtterance);
                                    }
                    return;
                }
                
                // Only start typing if there's a typing-text element (header click)
                if (typingText) {
                    // Clear any existing text and cursor
                    typingText.innerHTML = '';
                    // DON'T start typing effect - just show the content immediately
                    typingText.textContent = fullContent;
                    
                    // Say "Mission Statement" when clicked
                    if ('speechSynthesis' in window && speechEnabled) {
                        const speechSynth = window.speechSynthesis;
                        const speechUtterance = new SpeechSynthesisUtterance('Mission Statement');
                        speechUtterance.rate = 0.8;
                        speechUtterance.pitch = 0.8;
                        speechUtterance.volume = 1.0;
                        
                        // Set voice
                        const voices = speechSynth.getVoices();
                        const trinoidsVoice = voices.find(voice => voice.name.includes('Trinoids'));
                        if (trinoidsVoice) {
                            speechUtterance.voice = trinoidsVoice;
                        }
                        
                        speechSynth.speak(speechUtterance);
                    }
                } else {
                    // For experience cards and project cards, show content immediately without typing
                    const bulletsList = content.querySelector('.experience-bullets');
                    if (bulletsList && (entry.classList.contains('experience-card') || entry.classList.contains('project-card'))) {
                        // Show all bullet points immediately
                        const bullets = bulletsList.querySelectorAll('li');
                        bullets.forEach(bullet => {
                            bullet.style.opacity = '1';
                        });
                    }
                }
                
            } else {
                // Stop speech
                stopAllSpeech();
                
                // Collapse
                entry.classList.remove('expanded');
                content.style.display = 'none';
                
                // Update chevron to point down
                const chevron = clickIndicator.querySelector('i');
                chevron.className = 'fas fa-chevron-down';
                
                if (typingText) {
                    typingText.innerHTML = '';
                }
            }
        });
    });
}



// Typing effect function WITHOUT speech synthesis (for Mission Statement)
function typeTextWithoutSpeech(element, text, speed = 80) {
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    element.appendChild(cursor);
    
    function type() {
        if (i < text.length) {
            element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
            i++;
            
            // Play typing sound for each character with variation
            if (i % 2 === 0) { // Play sound every 2 characters for more realistic typing
                playTypingSound();
            }
            
            // Continue typing
            setTimeout(type, speed);
        } else {
            // Remove cursor when done
            if (cursor.parentNode) {
                cursor.parentNode.removeChild(cursor);
            }
        }
    }
    
    // Start typing
    type();
}

// Typing effect function with speech synthesis
function typeText(element, text, speed = 80) { // Slower speed to match speech
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    element.appendChild(cursor);
    
    // Initialize speech synthesis
    let speechSynth = null;
    let speechUtterance = null;
    let speechStartTime = null;
    let speechDuration = null;
    
    // Check if speech synthesis is available and enabled
    if ('speechSynthesis' in window && speechEnabled) {
        speechSynth = window.speechSynthesis;
        
        // Use natural Trinoids text - no artificial processing
        let trinoidsText = text;
        
        // Create speech utterance with deeper voice and slower rate for dynamic adjustment
        speechUtterance = new SpeechSynthesisUtterance(trinoidsText);
        speechUtterance.rate = 0.5; // Even slower rate to give typing time to catch up
        speechUtterance.pitch = 0.6; // Deeper voice (lower pitch)
        speechUtterance.volume = 1.0; // Full volume
        
        console.log('🌿 DYNAMIC TRINOIDS VOICE CONFIGURED:', {
            rate: speechUtterance.rate,
            pitch: speechUtterance.pitch,
            volume: speechUtterance.volume,
            text: trinoidsText.substring(0, 100) + '...'
        });
        
        // Wait for voices to load if needed
        const setVoice = () => {
            const voices = speechSynth.getVoices();
            if (voices.length > 0) {
                // Log all available voices for debugging
                console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
                
                // Only use voices that include 'Trinoids' in the name
                const trinoidsVoice = voices.find(voice => 
                    voice.name.includes('Trinoids')
                );
                
                if (trinoidsVoice) {
                    speechUtterance.voice = trinoidsVoice;
                    console.log('🌿 TRINOIDS VOICE SELECTED:', trinoidsVoice.name);
                } else {
                    console.log('🌿 No Trinoids voice found, using default');
                }
                
                // Add dynamic Trinoids voice processing
                speechUtterance.onstart = () => {
                    isCurrentlySpeaking = true;
                    currentSpeechUtterance = speechUtterance;
                    speechStartTime = Date.now();
                    console.log('🌿 DYNAMIC TRINOIDS VOICE STARTED - Natural organic active!');
                    console.log('🌿 Voice settings:', {
                        rate: speechUtterance.rate,
                        pitch: speechUtterance.pitch,
                        volume: speechUtterance.volume
                    });
                };
                
                speechUtterance.onend = () => {
                    isCurrentlySpeaking = false;
                    currentSpeechUtterance = null;
                    speechDuration = Date.now() - speechStartTime;
                    console.log('🌿 Speech duration:', speechDuration + 'ms');
                };
                
                speechUtterance.onerror = () => {
                    isCurrentlySpeaking = false;
                    currentSpeechUtterance = null;
                };
                
                // Start speech synthesis
                speechSynth.speak(speechUtterance);
            } else {
                // If voices aren't loaded yet, try again in 100ms
                setTimeout(setVoice, 100);
            }
        };
        
        setVoice();
    }
    
    function type() {
        if (i < text.length) {
            element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
            i++;
            
            // Play typing sound for each character with variation
            if (i % 2 === 0) { // Play sound every 2 characters for more realistic typing
                playTypingSound();
            }
            
            // Calculate dynamic speed based on speech progress
            const progress = i / text.length;
            const expectedTime = speechDuration ? (speechDuration * progress) : (80 * i);
            const actualTime = Date.now() - speechStartTime;
            
            // Adjust typing speed to match speech timing - make typing faster to keep up
            let typingSpeed = 80; // Faster default speed
            if (speechDuration && speechStartTime) {
                const timeDiff = expectedTime - actualTime;
                if (timeDiff < -100) { // If typing is more than 100ms behind speech
                    typingSpeed = 60; // Speed up typing significantly
                    console.log('🚀 SPEEDING UP - Typing behind speech by', Math.abs(timeDiff), 'ms');
                } else if (timeDiff > 100) { // If typing is more than 100ms ahead
                    typingSpeed = 100; // Slow down typing
                    console.log('🐌 SLOWING DOWN - Typing ahead of speech by', timeDiff, 'ms');
                } else {
                    typingSpeed = 80; // Normal speed
                }
                
                // Log timing every 10 characters for debugging
                if (i % 10 === 0) {
                    console.log('⏱️ TIMING:', {
                        progress: Math.round(progress * 100) + '%',
                        expectedTime: Math.round(expectedTime),
                        actualTime: Math.round(actualTime),
                        timeDiff: Math.round(timeDiff),
                        typingSpeed: typingSpeed
                    });
                }
            }
            
            const speedVariation = typingSpeed + (Math.random() - 0.5) * 10; // Slightly more variation
            setTimeout(type, speedVariation);
        } else {
            // Remove cursor when typing is complete
            cursor.remove();
            
            // Don't stop speech - let it finish naturally
            // This prevents the mid-speech stopping issue
        }
    }
    
    type();
}

// Simple typing sound effect (no audio processing)
function playTypingSound() {
    // Simple console log for typing sound (no audio processing)
    console.log('⌨️ Typing sound played');
}

// Mobile Navigation Functionality
function toggleMobileNav(element) {
    console.log('🔄 toggleMobileNav called with element:', element);
    
    const navTree = element.closest('.mobile-nav-tree');
    console.log('🔄 Found nav tree:', navTree);
    
    if (navTree) {
        const wasActive = navTree.classList.contains('active');
        navTree.classList.toggle('active');
        const isNowActive = navTree.classList.contains('active');
        
        console.log('🔄 Mobile nav toggled:', {
            wasActive: wasActive,
            isNowActive: isNowActive,
            element: element,
            navTree: navTree
        });
    } else {
        console.error('❌ Could not find mobile nav tree for element:', element);
    }
}

// Initialize mobile navigation
function initMobileNavigation() {
    console.log('🔧 Initializing mobile navigation...');
    
    // Find mobile navigation elements
    const mobileNavMain = document.querySelectorAll('.mobile-nav-main');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    
    console.log('📱 Found mobile nav main buttons:', mobileNavMain.length);
    console.log('📱 Found mobile nav items:', mobileNavItems.length);
    
    // Add click functionality to mobile nav main button
    mobileNavMain.forEach((button, index) => {
        console.log(`📱 Adding click listener to mobile nav main button ${index}`);
        button.addEventListener('click', function(e) {
            console.log('📱 Mobile nav main button clicked!');
            e.preventDefault();
            e.stopPropagation();
            toggleMobileNav(this);
        });
    });
    
    // Add click functionality to mobile nav items
    mobileNavItems.forEach((item, index) => {
        console.log(`📱 Adding click listener to mobile nav item ${index}:`, item.getAttribute('data-section'));
        item.addEventListener('click', function(e) {
            console.log('📱 Mobile nav item clicked:', this.getAttribute('data-section'));
            e.preventDefault();
            e.stopPropagation();
            
            const section = this.getAttribute('data-section');
            if (section) {
                // Hide mobile menu
                const navTree = this.closest('.mobile-nav-tree');
                navTree.classList.remove('active');
                
                // Show the corresponding section
                showSection(section);
                
                // Update active nav tab
                document.querySelectorAll('.nav-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Find and activate the corresponding desktop nav tab
                const desktopTab = document.querySelector(`[data-section="${section}"]`);
                if (desktopTab) {
                    desktopTab.classList.add('active');
                }
                
                console.log('📱 Mobile navigation: Switched to section:', section);
            }
        });
    });
    
    // Add click functionality to dropdown items
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                const section = href.substring(1);
                showSection(section);
                
                // Update active nav tab
                document.querySelectorAll('.nav-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Find and activate the corresponding desktop nav tab
                const desktopTab = document.querySelector(`[data-section="${section}"]`);
                if (desktopTab) {
                    desktopTab.classList.add('active');
                }
                
                console.log('📱 Dropdown navigation: Switched to section:', section);
            }
        });
    });
} 