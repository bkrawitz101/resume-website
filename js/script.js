// Global function to start background audio
function startBackgroundAudioGlobal() {
    console.log('🎵 Global: Attempting to start background audio...');
    const backgroundAudio = document.getElementById('backgroundAudio');
    const audioBtn = document.getElementById('playAudioBtn');
    
    console.log('🎵 Global: Background audio element:', backgroundAudio);
    console.log('🎵 Global: Audio button element:', audioBtn);
    console.log('🎵 Global: Audio paused state:', backgroundAudio ? backgroundAudio.paused : 'no audio element');
    console.log('🎵 Global: Audio readyState:', backgroundAudio ? backgroundAudio.readyState : 'no audio element');
    
    if (backgroundAudio && audioBtn) {
        backgroundAudio.volume = 0.3;
        backgroundAudio.loop = true;
        
        // Check if audio is already playing
        if (!backgroundAudio.paused) {
            console.log('🎵 Global: Audio is already playing');
            return;
        }
        
        // Try to play audio
        const playPromise = backgroundAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('🎵 Global: Background audio started successfully');
                // Update audio button to show playing state
                audioBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Audio On</span>';
                audioBtn.classList.add('playing');
                console.log('🎵 Global: Audio button updated to playing state');
            }).catch(function(error) {
                console.log('🎵 Global: Background audio failed to start:', error);
                console.log('🎵 Global: Error details:', error.name, error.message);
                // Show button in muted state if audio fails
                audioBtn.innerHTML = '<i class="fas fa-volume-mute"></i><span>Enable Audio</span>';
                audioBtn.classList.remove('playing');
                console.log('🎵 Global: Audio button updated to muted state');
            });
        } else {
            console.log('🎵 Global: Play promise is undefined - audio may not be ready');
        }
    } else {
        console.log('🎵 Global: Missing audio element or button');
    }
}

// Background audio functionality
function initBackgroundAudio() {
    const backgroundAudio = document.getElementById('backgroundAudio');
    const audioBtn = document.getElementById('playAudioBtn');
    
    if (backgroundAudio && audioBtn) {
        // Set volume to a subtle level
        backgroundAudio.volume = 0.3;
        
        // Ensure audio loops
        backgroundAudio.loop = true;
        
        // Audio control button functionality
        audioBtn.addEventListener('click', function() {
            console.log('🎵 Audio button clicked');
            console.log('🎵 Audio paused state:', backgroundAudio.paused);
            console.log('🎵 Audio readyState:', backgroundAudio.readyState);
            
            if (backgroundAudio.paused) {
                console.log('🎵 Attempting to play audio...');
                // Start playing
                backgroundAudio.play().then(() => {
                    console.log('🎵 Audio play successful');
                    audioBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Audio On</span>';
                    audioBtn.classList.add('playing');
                    console.log('🎵 Background audio started successfully');
                }).catch(function(error) {
                    console.log('🎵 Background audio play failed:', error.name, error.message);
                    audioBtn.innerHTML = '<i class="fas fa-volume-mute"></i><span>Enable Audio</span>';
                    audioBtn.classList.remove('playing');
                });
            } else {
                console.log('🎵 Pausing audio...');
                // Pause playing
                backgroundAudio.pause();
                audioBtn.innerHTML = '<i class="fas fa-volume-mute"></i><span>Audio Off</span>';
                audioBtn.classList.remove('playing');
                console.log('🔇 Background audio paused');
            }
        });
        
        // Try to play audio on page load (only if video intro is not active)
        document.addEventListener('DOMContentLoaded', function() {
            const videoIntro = document.getElementById('videoIntro');
            // Only try autoplay if video intro is not present or hidden
            if (!videoIntro || videoIntro.style.display === 'none') {
                // Try to play audio (may be blocked by browser autoplay policy)
                backgroundAudio.play().then(() => {
                    audioBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Audio On</span>';
                    audioBtn.classList.add('playing');
                    console.log('🎵 Background audio autoplay successful');
                }).catch(function(error) {
                    console.log('Background audio autoplay blocked:', error);
                    // Show button in muted state
                    audioBtn.innerHTML = '<i class="fas fa-volume-mute"></i><span>Enable Audio</span>';
                });
            }
        });
        
        console.log('🎵 Background audio initialized');
    }
}

// Video intro functionality
function initVideoIntro() {
    const videoIntro = document.getElementById('videoIntro');
    const introVideo = document.getElementById('introVideo');
    const backgroundAudio = document.getElementById('backgroundAudio');
    const loadingProgress = document.querySelector('.loading-progress');
    
    if (videoIntro && introVideo) {
        let videoDuration = 0;
        let currentTime = 0;
        
        // Try to start audio immediately
        if (backgroundAudio) {
            backgroundAudio.volume = 0.3;
            backgroundAudio.loop = true;
            // Don't try to play immediately - wait for user interaction
            console.log('🎵 Background audio ready, waiting for user interaction');
            
            // Add event listeners to debug audio
            backgroundAudio.addEventListener('loadstart', function() {
                console.log('🎵 Audio load started');
            });
            
            backgroundAudio.addEventListener('loadedmetadata', function() {
                console.log('🎵 Audio metadata loaded');
            });
            
            backgroundAudio.addEventListener('canplay', function() {
                console.log('🎵 Audio can play');
            });
            
            backgroundAudio.addEventListener('play', function() {
                console.log('🎵 Audio started playing');
            });
            
            backgroundAudio.addEventListener('error', function(e) {
                console.log('🎵 Audio error:', e);
            });
        }
        
        // Get video duration when metadata is loaded
        introVideo.addEventListener('loadedmetadata', function() {
            videoDuration = introVideo.duration;
            console.log('🎬 Video duration:', videoDuration, 'seconds');
        });
        
        // Update loading bar based on video progress
        introVideo.addEventListener('timeupdate', function() {
            currentTime = introVideo.currentTime;
            const progress = (currentTime / videoDuration) * 100;
            if (loadingProgress) {
                loadingProgress.style.width = progress + '%';
            }
        });
        
        // Handle video end
        introVideo.addEventListener('ended', function() {
            console.log('🎬 Video intro ended, transitioning to main site');
            transitionToMainSite();
        });
        
        // Start background audio when video starts
        introVideo.addEventListener('play', function() {
            console.log('🎬 Video started, attempting to start audio');
            startAudioOnInteraction();
        });
        
        // Also try to start audio when video can play
        introVideo.addEventListener('canplay', function() {
            console.log('🎬 Video can play, attempting to start audio');
            startAudioOnInteraction();
        });
        
        // Debug video loading
        introVideo.addEventListener('loadstart', function() {
            console.log('🎬 Video load started');
        });
        
        introVideo.addEventListener('loadedmetadata', function() {
            console.log('🎬 Video metadata loaded');
        });
        
        // Function to start background audio (local to this function)
        function startBackgroundAudio() {
            console.log('🎵 Attempting to start background audio...');
            console.log('🎵 Background audio element:', backgroundAudio);
            console.log('🎵 Audio paused state:', backgroundAudio ? backgroundAudio.paused : 'no audio element');
            console.log('🎵 Audio readyState:', backgroundAudio ? backgroundAudio.readyState : 'no audio element');
            
            if (backgroundAudio) {
                backgroundAudio.volume = 0.3;
                backgroundAudio.loop = true;
                
                // Check if audio is already playing
                if (!backgroundAudio.paused) {
                    console.log('🎵 Audio is already playing');
                    return;
                }
                
                // Check if audio is ready
                if (backgroundAudio.readyState < 2) {
                    console.log('🎵 Audio not ready yet, waiting...');
                    backgroundAudio.addEventListener('canplay', function() {
                        console.log('🎵 Audio is now ready, attempting to play');
                        startBackgroundAudio();
                    }, { once: true });
                    return;
                }
                
                // Try to play audio
                const playPromise = backgroundAudio.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('🎵 Background audio started successfully');
                        // Update audio button to show playing state
                        const audioBtn = document.getElementById('playAudioBtn');
                        if (audioBtn) {
                            audioBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Audio On</span>';
                            audioBtn.classList.add('playing');
                        }
                    }).catch(function(error) {
                        console.log('🎵 Background audio failed to start:', error);
                        console.log('🎵 Error details:', error.name, error.message);
                        // Show button in muted state if audio fails
                        const audioBtn = document.getElementById('playAudioBtn');
                        if (audioBtn) {
                            audioBtn.innerHTML = '<i class="fas fa-volume-mute"></i><span>Enable Audio</span>';
                            audioBtn.classList.remove('playing');
                        }
                    });
                } else {
                    console.log('🎵 Play promise is undefined - audio may not be ready');
                }
            } else {
                console.log('🎵 No background audio element found');
            }
        }
        
        // Also try to start audio immediately when video is ready
        introVideo.addEventListener('canplay', function() {
            console.log('🎬 Video can play, attempting to start audio');
            if (backgroundAudio && backgroundAudio.paused) {
                startBackgroundAudio();
            }
        });
        
        // Fallback: if video doesn't autoplay, start after user interaction
        document.addEventListener('click', function() {
            if (introVideo.paused && videoIntro.style.display !== 'none') {
                introVideo.play();
            }
            
            // Also try to start audio on first user interaction
            if (backgroundAudio && backgroundAudio.paused) {
                startBackgroundAudio();
            }
        }, { once: true });
        
        // Try to start audio on any user interaction
        document.addEventListener('mousedown', function() {
            if (backgroundAudio && backgroundAudio.paused) {
                startBackgroundAudio();
            }
        }, { once: true });
        
        document.addEventListener('keydown', function() {
            if (backgroundAudio && backgroundAudio.paused) {
                startBackgroundAudio();
            }
        }, { once: true });
        
        document.addEventListener('touchstart', function() {
            if (backgroundAudio && backgroundAudio.paused) {
                startBackgroundAudio();
            }
        }, { once: true });
        
        // Add click handler to video intro itself
        if (videoIntro) {
            videoIntro.addEventListener('click', function() {
                console.log('🎬 Video intro clicked, starting audio');
                if (backgroundAudio && backgroundAudio.paused) {
                    startBackgroundAudio();
                }
            });
        }
        
        console.log('🎬 Video intro initialized');
    }
}

// Transition to main site
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
        }, 2000); // Match the CSS transition duration
    }
}

// Initialize video intro
initVideoIntro();

// Initialize background audio
initBackgroundAudio();

// Test audio loading and try to start immediately
function testAudioElement() {
    console.log('🎵 Testing audio element...');
    const backgroundAudio = document.getElementById('backgroundAudio');
    if (backgroundAudio) {
        console.log('🎵 Audio element found');
        console.log('🎵 Audio readyState:', backgroundAudio.readyState);
        console.log('🎵 Audio networkState:', backgroundAudio.networkState);
        console.log('🎵 Audio paused:', backgroundAudio.paused);
        console.log('🎵 Audio src:', backgroundAudio.src);
        console.log('🎵 Audio duration:', backgroundAudio.duration);
        console.log('🎵 Audio currentTime:', backgroundAudio.currentTime);
        
        // Add event listeners to debug audio loading
        backgroundAudio.addEventListener('loadstart', function() {
            console.log('🎵 Audio load started');
        });
        
        backgroundAudio.addEventListener('loadedmetadata', function() {
            console.log('🎵 Audio metadata loaded');
        });
        
        backgroundAudio.addEventListener('canplay', function() {
            console.log('🎵 Audio can play');
        });
        
        backgroundAudio.addEventListener('play', function() {
            console.log('🎵 Audio started playing');
        });
        
        backgroundAudio.addEventListener('error', function(e) {
            console.log('🎵 Audio error:', e);
        });
        
        // Set audio properties
        backgroundAudio.volume = 0.3;
        backgroundAudio.loop = true;
        
        // Try to play
        const playPromise = backgroundAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('🎵 Audio started successfully!');
                const audioBtn = document.getElementById('playAudioBtn');
                if (audioBtn) {
                    audioBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Audio On</span>';
                    audioBtn.classList.add('playing');
                }
            }).catch((error) => {
                console.log('🎵 Audio start failed:', error.name, error.message);
                console.log('🎵 This is likely due to browser autoplay policy');
                
                // Show user-friendly message
                const audioBtn = document.getElementById('playAudioBtn');
                if (audioBtn) {
                    audioBtn.innerHTML = '<i class="fas fa-volume-mute"></i><span>Click to Enable Audio</span>';
                    audioBtn.classList.remove('playing');
                }
            });
        }
    } else {
        console.log('🎵 No audio element found!');
    }
}

// Call the function after a delay
window.addEventListener('load', function() {
    setTimeout(function() {
        testAudioElement();
    }, 2000);
});

// Initiate Sequence functionality
function initInitiateSequence() {
    const initiateSequence = document.getElementById('initiateSequence');
    const videoIntro = document.getElementById('videoIntro');
    const introVideo = document.getElementById('introVideo');
    const backgroundAudio = document.getElementById('backgroundAudio');
    const audioBtn = document.getElementById('playAudioBtn');
    
    if (initiateSequence) {
        // Add click handler to the flashing box
        const flashingBox = initiateSequence.querySelector('.flashing-box');
        if (flashingBox) {
            flashingBox.addEventListener('click', function() {
                console.log('🚀 Initiate sequence clicked');
                
                // Hide the initiate sequence
                initiateSequence.style.opacity = '0';
                setTimeout(() => {
                    initiateSequence.style.display = 'none';
                }, 1000);
                
                // Show video intro
                if (videoIntro) {
                    videoIntro.style.display = 'block';
                    videoIntro.style.opacity = '1';
                }
                
                // Start video
                if (introVideo) {
                    // Set video properties for mobile
                    introVideo.muted = true; // Required for mobile autoplay
                    introVideo.playsInline = true; // Prevents fullscreen on mobile
                    
                    introVideo.play().then(() => {
                        console.log('🎬 Video started');
                        
                        // Start audio when video starts
                        if (backgroundAudio && audioBtn) {
                            backgroundAudio.volume = 0.3;
                            backgroundAudio.loop = true;
                            backgroundAudio.play().then(() => {
                                console.log('🎵 Audio started with video');
                                audioBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Audio On</span>';
                                audioBtn.classList.add('playing');
                            }).catch((error) => {
                                console.log('🎵 Audio failed:', error);
                            });
                        }
                    }).catch((error) => {
                        console.log('🎬 Video failed to start:', error);
                        // Fallback: if video fails, still show the main site
                        setTimeout(() => {
                            transitionToMainSite();
                        }, 1000);
                    });
                }
            });
        }
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

// Initialize initiate sequence
document.addEventListener('DOMContentLoaded', function() {
    initInitiateSequence();
});

// Listen for user interactions to start audio (fallback)
document.addEventListener('click', startAudioOnInteraction, { once: true });
document.addEventListener('mousedown', startAudioOnInteraction, { once: true });
document.addEventListener('keydown', startAudioOnInteraction, { once: true });
document.addEventListener('touchstart', startAudioOnInteraction, { once: true });

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const contentSections = document.querySelectorAll('.content-section');

    // Function to show section
    function showSection(sectionId) {
        // Hide all sections
        contentSections.forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav tabs
        navTabs.forEach(tab => {
            tab.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Add active class to clicked nav tab
        const activeTab = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    // Add click event listeners to nav tabs
    navTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });

    // Simple project link handling - just let links work naturally
    document.querySelectorAll('.project-link').forEach(link => {
        link.addEventListener('click', function(e) {
            // Let the link work normally - no interference
            console.log('Link clicked:', this.href);
        });
    });

    // Initialize with About section
    showSection('about');
    
    // Update data-section attributes for portfolio
    const portfolioTab = document.querySelector('[data-section="portfolio"]');
    if (portfolioTab) {
        portfolioTab.setAttribute('data-section', 'portfolio');
    }
});

// Enhanced interactive effects
document.addEventListener('DOMContentLoaded', function() {
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

    // Add parallax effect to background
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.container');
        const speed = scrolled * 0.3;
        
        if (parallax) {
            parallax.style.transform = `translateY(${speed}px)`;
        }
    });

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
        const activeTab = document.querySelector('.nav-tab.active');
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
});

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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // List available voices
    listAvailableVoices();
    
    // Initialize clickable entries with typing effect
    initClickableEntries();
});

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
                
                // Only start typing if there's a typing-text element (chevron click)
                if (typingText) {
                    // Clear any existing text and cursor
                    typingText.innerHTML = '';
                    // Start typing effect
                    typeText(typingText, fullContent);
                    // Play typing sound
                    playTypingSound();
                } else {
                    // For experience cards, create typing effect for bullet points
                    const bulletsList = content.querySelector('.experience-bullets');
                    if (bulletsList) {
                        // Hide all bullet points initially (chevron click)
                        const bullets = bulletsList.querySelectorAll('li');
                        bullets.forEach(bullet => {
                            bullet.style.opacity = '0';
                        });
                        
                        // Type out bullet points one letter at a time with speech
                        let bulletIndex = 0;
                        let letterIndex = 0;
                        let currentBullet = null;
                        let originalText = '';
                        let currentSpeechUtterance = null;
                        
                        const typeBulletPoints = () => {
                            if (bulletIndex < bullets.length) {
                                if (!currentBullet) {
                                    // Start new bullet point
                                    currentBullet = bullets[bulletIndex];
                                    originalText = currentBullet.textContent;
                                    currentBullet.textContent = '';
                                    currentBullet.style.opacity = '1';
                                    letterIndex = 0;
                                    
                                    // Start speaking this bullet point
                                    if ('speechSynthesis' in window && speechEnabled) {
                                        const speechSynth = window.speechSynthesis;
                                        const speechUtterance = new SpeechSynthesisUtterance(originalText);
                                        speechUtterance.rate = 0.5;
                                        speechUtterance.pitch = 0.6;
                                        speechUtterance.volume = 1.0;
                                        
                                        // Set voice
                                        const voices = speechSynth.getVoices();
                                        const trinoidsVoice = voices.find(voice => voice.name.includes('Trinoids'));
                                        if (trinoidsVoice) {
                                            speechUtterance.voice = trinoidsVoice;
                                        }
                                        
                                        // Track speech
                                        speechUtterance.onstart = () => {
                                            isCurrentlySpeaking = true;
                                            currentSpeechUtterance = speechUtterance;
                                            console.log('🌿 Bullet point speech started:', originalText.substring(0, 50));
                                        };
                                        
                                        speechUtterance.onend = () => {
                                            isCurrentlySpeaking = false;
                                            currentSpeechUtterance = null;
                                            console.log('🌿 Bullet point speech ended');
                                            
                                            // Move to next bullet point after speech ends
                                            bulletIndex++;
                                            currentBullet = null;
                                            if (bulletIndex < bullets.length) {
                                                setTimeout(typeBulletPoints, 300); // Pause between bullet points
                                            }
                                        };
                                        
                                        speechSynth.speak(speechUtterance);
                                    }
                                }
                                
                                if (letterIndex < originalText.length) {
                                    // Type next letter
                                    currentBullet.textContent += originalText.charAt(letterIndex);
                                    letterIndex++;
                                    
                                    // Play typing sound
                                    playTypingSound();
                                    
                                    // Continue typing this bullet point
                                    setTimeout(typeBulletPoints, 50); // Faster typing speed
                                }
                            }
                        };
                        
                        // Start typing bullet points immediately
                        setTimeout(typeBulletPoints, 200);
                    }
                }
                
            } else {
                // Stop speech when collapsing (chevron click)
                stopAllSpeech();
                
                // Collapse
                entry.classList.remove('expanded');
                content.style.display = 'none';
                
                // Update chevron to point down
                const chevron = clickIndicator.querySelector('i');
                chevron.className = 'fas fa-chevron-down';
                
                if (typingText) {
                    typingText.innerHTML = '';
                } else {
                    // Reset bullet points opacity for experience cards
                    const bulletsList = content.querySelector('.experience-bullets');
                    if (bulletsList) {
                        const bullets = bulletsList.querySelectorAll('li');
                        bullets.forEach(bullet => {
                            bullet.style.opacity = '0';
                        });
                    }
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
                
                // Only start typing if there's a typing-text element (header click)
                if (typingText) {
                    // Clear any existing text and cursor
                    typingText.innerHTML = '';
                    // Start typing effect
                    typeText(typingText, fullContent);
                    // Play typing sound
                    playTypingSound();
                } else {
                    // For experience cards, create typing effect for bullet points
                    const bulletsList = content.querySelector('.experience-bullets');
                    if (bulletsList) {
                        // Hide all bullet points initially (header click)
                        const bullets = bulletsList.querySelectorAll('li');
                        bullets.forEach(bullet => {
                            bullet.style.opacity = '0';
                        });
                        
                        // Type out bullet points one letter at a time with speech
                        let bulletIndex = 0;
                        let letterIndex = 0;
                        let currentBullet = null;
                        let originalText = '';
                        let currentSpeechUtterance = null;
                        
                        const typeBulletPoints = () => {
                            if (bulletIndex < bullets.length) {
                                if (!currentBullet) {
                                    // Start new bullet point
                                    currentBullet = bullets[bulletIndex];
                                    originalText = currentBullet.textContent;
                                    currentBullet.textContent = '';
                                    currentBullet.style.opacity = '1';
                                    letterIndex = 0;
                                    
                                    // Start speaking this bullet point
                                    if ('speechSynthesis' in window && speechEnabled) {
                                        const speechSynth = window.speechSynthesis;
                                        const speechUtterance = new SpeechSynthesisUtterance(originalText);
                                        speechUtterance.rate = 0.5;
                                        speechUtterance.pitch = 0.6;
                                        speechUtterance.volume = 1.0;
                                        
                                        // Set voice
                                        const voices = speechSynth.getVoices();
                                        const trinoidsVoice = voices.find(voice => voice.name.includes('Trinoids'));
                                        if (trinoidsVoice) {
                                            speechUtterance.voice = trinoidsVoice;
                                        }
                                        
                                        // Track speech
                                        speechUtterance.onstart = () => {
                                            isCurrentlySpeaking = true;
                                            currentSpeechUtterance = speechUtterance;
                                            console.log('🌿 Bullet point speech started:', originalText.substring(0, 50));
                                        };
                                        
                                        speechUtterance.onend = () => {
                                            isCurrentlySpeaking = false;
                                            currentSpeechUtterance = null;
                                            console.log('🌿 Bullet point speech ended');
                                            
                                            // Move to next bullet point after speech ends
                                            bulletIndex++;
                                            currentBullet = null;
                                            if (bulletIndex < bullets.length) {
                                                setTimeout(typeBulletPoints, 300); // Pause between bullet points
                                            }
                                        };
                                        
                                        speechSynth.speak(speechUtterance);
                                    }
                                }
                                
                                if (letterIndex < originalText.length) {
                                    // Type next letter
                                    currentBullet.textContent += originalText.charAt(letterIndex);
                                    letterIndex++;
                                    
                                    // Play typing sound
                                    playTypingSound();
                                    
                                    // Continue typing this bullet point
                                    setTimeout(typeBulletPoints, 50); // Faster typing speed
                                }
                            }
                        };
                        
                        // Start typing bullet points immediately
                        setTimeout(typeBulletPoints, 200);
                    }
                }
                
            } else {
                // Stop speech when collapsing (header click)
                stopAllSpeech();
                
                // Collapse
                entry.classList.remove('expanded');
                content.style.display = 'none';
                
                // Update chevron to point down
                const chevron = clickIndicator.querySelector('i');
                chevron.className = 'fas fa-chevron-down';
                
                if (typingText) {
                    typingText.innerHTML = '';
                } else {
                    // Reset bullet points opacity for experience cards
                    const bulletsList = content.querySelector('.experience-bullets');
                    if (bulletsList) {
                        const bullets = bulletsList.querySelectorAll('li');
                        bullets.forEach(bullet => {
                            bullet.style.opacity = '0';
                        });
                    }
                }
            }
        });
    });
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