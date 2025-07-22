// Mobile-Optimized Birthday Website JavaScript

class BirthdayWebsite {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 5;
        this.currentQuote = 0;
        this.totalQuotes = 5;
        this.isTransitioning = false;
        this.musicPlaying = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        this.audioContext = null;
        this.musicTimeout = null;
        
        // Performance tracking
        this.animationFrameId = null;
        this.lastAnimationTime = 0;
        
        this.init();
    }
    
    init() {
        this.showLoadingScreen();
        this.setupEventListeners();
        this.setupQuoteCarousel();
        this.startBackgroundAnimations();
        this.updateNavigation();
        this.enableAudioContext();
        this.hideSwipeIndicator();
        
        // Initialize with welcome screen
        setTimeout(() => {
            this.hideLoadingScreen();
            this.createInitialEffects();
        }, 2000);
    }
    
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    setupEventListeners() {
        // Navigation dots - Fixed event handling
        document.querySelectorAll('.nav-dot').forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Navigation dot ${index} clicked`);
                this.goToSlide(index);
                this.hideSwipeIndicator();
            });
            
            // Also handle touch events for mobile
            dot.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.goToSlide(index);
                this.hideSwipeIndicator();
            });
        });
        
        // Celebration buttons - Fixed action handling
        document.addEventListener('click', (e) => {
            if (e.target.closest('.celebration-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const button = e.target.closest('.celebration-btn');
                const action = button.dataset.action;
                
                console.log(`Celebration button clicked with action: ${action}`);
                
                if (action === 'start-journey') {
                    this.nextSlide();
                } else if (action === 'celebrate') {
                    this.showGrandFinale();
                }
                
                this.createTouchEffect(e);
                this.hideSwipeIndicator();
            }
        });
        
        // Music player
        const musicToggle = document.getElementById('musicToggle');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (musicToggle) {
            musicToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMusic();
                this.createTouchEffect(e);
            });
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.currentVolume = parseFloat(e.target.value);
            });
        }
        
        // Keyboard navigation (for desktop)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                this.nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prevSlide();
            }
        });
        
        // Touch events for swipe gestures - Fixed
        this.setupTouchEvents();
        
        // Touch events for special effects
        this.setupTouchEffects();
        
        // Card interactions
        this.setupCardInteractions();
        
        // Quote navigation
        this.setupQuoteNavigation();
    }
    
    setupTouchEvents() {
        const slideContainer = document.getElementById('slideContainer');
        
        if (!slideContainer) return;
        
        let isDragging = false;
        let startTime = 0;
        
        // Touch start
        slideContainer.addEventListener('touchstart', (e) => {
            if (this.isTransitioning) return;
            
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            startTime = Date.now();
            isDragging = false;
            
            console.log(`Touch start: X=${this.touchStartX}, Y=${this.touchStartY}`);
        }, { passive: true });
        
        // Touch move (for drag feedback)
        slideContainer.addEventListener('touchmove', (e) => {
            if (this.isTransitioning) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - this.touchStartX;
            const deltaY = currentY - this.touchStartY;
            
            // If horizontal movement is greater than vertical, prevent scroll
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                e.preventDefault();
                isDragging = true;
            }
        }, { passive: false });
        
        // Touch end - Fixed swipe detection
        slideContainer.addEventListener('touchend', (e) => {
            if (this.isTransitioning) return;
            
            this.touchEndX = e.changedTouches[0].clientX;
            this.touchEndY = e.changedTouches[0].clientY;
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`Touch end: X=${this.touchEndX}, Y=${this.touchEndY}, Duration=${duration}ms`);
            
            // Only process as swipe if it was a quick gesture and involved dragging
            if (duration < 500 && isDragging) {
                this.handleSwipe();
            }
        }, { passive: true });
        
        // Mouse events for desktop testing
        let mouseStartX = 0;
        let mouseDown = false;
        
        slideContainer.addEventListener('mousedown', (e) => {
            mouseStartX = e.clientX;
            mouseDown = true;
            slideContainer.style.cursor = 'grabbing';
        });
        
        slideContainer.addEventListener('mousemove', (e) => {
            if (mouseDown) {
                const deltaX = e.clientX - mouseStartX;
                if (Math.abs(deltaX) > 10) {
                    e.preventDefault();
                }
            }
        });
        
        slideContainer.addEventListener('mouseup', (e) => {
            if (mouseDown) {
                const deltaX = e.clientX - mouseStartX;
                console.log(`Mouse swipe: deltaX=${deltaX}`);
                
                if (Math.abs(deltaX) > this.minSwipeDistance) {
                    if (deltaX > 0) {
                        this.prevSlide();
                    } else {
                        this.nextSlide();
                    }
                }
                mouseDown = false;
                slideContainer.style.cursor = 'grab';
            }
        });
        
        slideContainer.addEventListener('mouseleave', () => {
            mouseDown = false;
            slideContainer.style.cursor = 'grab';
        });
    }
    
    handleSwipe() {
        const deltaX = this.touchStartX - this.touchEndX;
        const deltaY = this.touchStartY - this.touchEndY;
        
        console.log(`Swipe detected: deltaX=${deltaX}, deltaY=${deltaY}`);
        
        // Only process horizontal swipes that are significant
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            console.log('Vertical swipe ignored');
            return;
        }
        
        if (Math.abs(deltaX) < this.minSwipeDistance) {
            console.log('Swipe too small');
            return;
        }
        
        this.hideSwipeIndicator();
        
        if (deltaX > 0) {
            // Swipe left - next slide
            console.log('Swiping to next slide');
            this.nextSlide();
        } else {
            // Swipe right - previous slide
            console.log('Swiping to previous slide');
            this.prevSlide();
        }
    }
    
    setupTouchEffects() {
        const touchOverlay = document.getElementById('touchOverlay');
        if (!touchOverlay) return;
        
        // Single tap effects
        document.addEventListener('click', (e) => {
            // Skip if clicking on interactive elements
            if (e.target.closest('button, .nav-dot, .music-player')) return;
            
            this.createTouchEffect(e);
            this.createRandomHearts();
        });
        
        // Double tap effects
        let lastTap = 0;
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                // Double tap detected
                this.createDoubleTapEffect(e);
                e.preventDefault();
            }
            
            lastTap = currentTime;
        });
    }
    
    createTouchEffect(e) {
        const touchOverlay = document.getElementById('touchOverlay');
        const tapEffect = document.getElementById('tapEffect');
        
        if (!touchOverlay || !tapEffect) return;
        
        const rect = touchOverlay.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX || e.changedTouches?.[0]?.clientX || 0) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY || e.changedTouches?.[0]?.clientY || 0) - rect.top;
        
        tapEffect.style.left = (x - 20) + 'px';
        tapEffect.style.top = (y - 20) + 'px';
        tapEffect.classList.remove('animate');
        
        // Force reflow
        tapEffect.offsetHeight;
        
        tapEffect.classList.add('animate');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            tapEffect.classList.remove('animate');
        }, 600);
    }
    
    createDoubleTapEffect(e) {
        this.showConfettiExplosion(30);
        this.createHeartBurst();
        this.createRandomSparkles();
    }
    
    setupCardInteractions() {
        // Wish cards
        document.querySelectorAll('.wish-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.animateWishCard(card);
                this.createSparklesAroundElement(card);
            });
        });
        
        // Memory cards  
        document.querySelectorAll('.memory-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.animateMemoryCard(card);
                this.createHeartsAroundElement(card);
            });
        });
    }
    
    animateWishCard(card) {
        card.style.transform = 'scale(1.05)';
        setTimeout(() => {
            card.style.transform = '';
        }, 200);
    }
    
    animateMemoryCard(card) {
        card.style.transform = 'scale(1.05) rotateY(5deg)';
        setTimeout(() => {
            card.style.transform = '';
        }, 300);
    }
    
    setupQuoteCarousel() {
        const quotesCarousel = document.getElementById('quotesCarousel');
        if (!quotesCarousel) return;
        
        // Create quote dots
        const quoteDots = document.getElementById('quoteDots');
        if (quoteDots) {
            for (let i = 0; i < this.totalQuotes; i++) {
                const dot = document.createElement('div');
                dot.className = `quote-dot ${i === 0 ? 'active' : ''}`;
                dot.addEventListener('click', () => this.goToQuote(i));
                quoteDots.appendChild(dot);
            }
        }
        
        // Auto-advance quotes every 4 seconds
        this.startQuoteAutoplay();
    }
    
    setupQuoteNavigation() {
        const prevBtn = document.querySelector('.quote-nav-btn.prev');
        const nextBtn = document.querySelector('.quote-nav-btn.next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.prevQuote();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.nextQuote();
            });
        }
    }
    
    startQuoteAutoplay() {
        this.quoteInterval = setInterval(() => {
            if (this.currentSlide === 1) { // Only auto-advance on quotes slide
                this.nextQuote();
            }
        }, 4000);
    }
    
    goToQuote(quoteIndex) {
        if (quoteIndex === this.currentQuote || this.isTransitioning) return;
        
        const quotes = document.querySelectorAll('.quote-card');
        const dots = document.querySelectorAll('.quote-dot');
        
        // Remove active class from current quote
        quotes[this.currentQuote]?.classList.remove('active');
        dots[this.currentQuote]?.classList.remove('active');
        
        // Set up transition
        const nextQuote = quotes[quoteIndex];
        if (nextQuote) {
            if (quoteIndex > this.currentQuote) {
                nextQuote.style.transform = 'translate3d(100%, 0, 0)';
            } else {
                nextQuote.style.transform = 'translate3d(-100%, 0, 0)';
            }
            
            nextQuote.style.opacity = '1';
            
            // Animate transition
            setTimeout(() => {
                nextQuote.style.transform = 'translate3d(0, 0, 0)';
                nextQuote.classList.add('active');
                
                // Clean up after transition
                setTimeout(() => {
                    nextQuote.style.transform = '';
                }, 400);
            }, 50);
        }
        
        // Add active class to new quote
        dots[quoteIndex]?.classList.add('active');
        
        this.currentQuote = quoteIndex;
    }
    
    nextQuote() {
        const nextIndex = (this.currentQuote + 1) % this.totalQuotes;
        this.goToQuote(nextIndex);
    }
    
    prevQuote() {
        const prevIndex = (this.currentQuote - 1 + this.totalQuotes) % this.totalQuotes;
        this.goToQuote(prevIndex);
    }
    
    goToSlide(slideIndex) {
        if (this.isTransitioning || slideIndex === this.currentSlide || slideIndex < 0 || slideIndex >= this.totalSlides) {
            console.log(`Slide navigation blocked: transitioning=${this.isTransitioning}, slideIndex=${slideIndex}, currentSlide=${this.currentSlide}`);
            return;
        }
        
        console.log(`Navigating from slide ${this.currentSlide} to slide ${slideIndex}`);
        
        this.isTransitioning = true;
        
        const slides = document.querySelectorAll('.slide');
        const currentSlideEl = slides[this.currentSlide];
        const nextSlideEl = slides[slideIndex];
        
        if (!currentSlideEl || !nextSlideEl) {
            console.error('Slide elements not found');
            this.isTransitioning = false;
            return;
        }
        
        // Remove active class from current slide
        currentSlideEl.classList.remove('active');
        currentSlideEl.classList.add('transitioning');
        
        // Set up the transition
        if (slideIndex > this.currentSlide) {
            // Moving forward
            nextSlideEl.style.transform = 'translate3d(100%, 0, 0)';
            nextSlideEl.style.opacity = '1';
        } else {
            // Moving backward
            nextSlideEl.style.transform = 'translate3d(-100%, 0, 0)';
            nextSlideEl.style.opacity = '1';
        }
        
        nextSlideEl.classList.add('transitioning');
        
        // Force reflow
        nextSlideEl.offsetHeight;
        
        // Start the transition
        requestAnimationFrame(() => {
            currentSlideEl.style.transform = slideIndex > this.currentSlide ? 'translate3d(-100%, 0, 0)' : 'translate3d(100%, 0, 0)';
            currentSlideEl.style.opacity = '0';
            nextSlideEl.style.transform = 'translate3d(0, 0, 0)';
            nextSlideEl.classList.add('active');
            
            // Clean up after transition
            setTimeout(() => {
                currentSlideEl.style.transform = '';
                currentSlideEl.style.opacity = '';
                currentSlideEl.classList.remove('transitioning');
                nextSlideEl.style.transform = '';
                nextSlideEl.classList.remove('transitioning');
                this.isTransitioning = false;
                console.log(`Slide transition complete. Now on slide ${slideIndex}`);
            }, 500); // Increased timeout to match CSS transition
        });
        
        this.currentSlide = slideIndex;
        this.updateNavigation();
        
        // Trigger special effects for certain slides
        this.triggerSlideEffects(slideIndex);
        
        // Create transition sparkles
        this.createTransitionEffect();
    }
    
    triggerSlideEffects(slideIndex) {
        setTimeout(() => {
            switch(slideIndex) {
                case 1: // Quotes
                    this.createRandomSparkles();
                    break;
                case 2: // Wishes
                    this.createFloatingBalloons();
                    break;
                case 3: // Memories
                    this.createMemorySparkles();
                    break;
                case 4: // Celebration
                    this.showConfettiExplosion(50);
                    this.createHeartBurst();
                    break;
            }
        }, 300);
    }
    
    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
        } else {
            console.log('Already on last slide');
        }
    }
    
    prevSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        } else {
            console.log('Already on first slide');
        }
    }
    
    updateNavigation() {
        // Update navigation dots
        document.querySelectorAll('.nav-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
        
        console.log(`Navigation updated for slide ${this.currentSlide}`);
    }
    
    hideSwipeIndicator() {
        const indicator = document.querySelector('.swipe-indicator');
        if (indicator) {
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 300);
            }, 5000);
        }
    }
    
    enableAudioContext() {
        const enableAudio = () => {
            if (!this.audioContextEnabled) {
                this.audioContextEnabled = true;
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    if (this.audioContext.state === 'suspended') {
                        this.audioContext.resume();
                    }
                } catch (e) {
                    console.log('Audio context creation failed:', e);
                }
            }
        };
        
        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('touchstart', enableAudio, { once: true });
    }
    
    toggleMusic() {
        const musicToggle = document.getElementById('musicToggle');
        const musicText = musicToggle?.querySelector('.music-text');
        
        if (this.musicPlaying) {
            this.stopMusic();
            if (musicText) musicText.textContent = 'Music';
            this.musicPlaying = false;
        } else {
            this.playBirthdayMelody();
            if (musicText) musicText.textContent = 'Pause';
            this.musicPlaying = true;
        }
    }
    
    stopMusic() {
        if (this.musicTimeout) {
            clearTimeout(this.musicTimeout);
            this.musicTimeout = null;
        }
    }
    
    playBirthdayMelody() {
        if (!this.audioContext) return;
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            const notes = [
                { freq: 261.63, duration: 0.4 }, // C4 - Happy
                { freq: 261.63, duration: 0.4 }, // C4 - Birth-
                { freq: 293.66, duration: 0.4 }, // D4 - day
                { freq: 261.63, duration: 0.4 }, // C4 - to
                { freq: 349.23, duration: 0.4 }, // F4 - you
                { freq: 329.63, duration: 0.8 }, // E4 - (pause)
                { freq: 261.63, duration: 0.4 }, // C4 - Happy
                { freq: 261.63, duration: 0.4 }, // C4 - Birth-
                { freq: 293.66, duration: 0.4 }, // D4 - day
                { freq: 261.63, duration: 0.4 }, // C4 - to
                { freq: 392.00, duration: 0.4 }, // G4 - you
                { freq: 349.23, duration: 0.8 }, // F4 - (pause)
            ];
            
            const volumeSlider = document.getElementById('volumeSlider');
            const volume = volumeSlider ? parseFloat(volumeSlider.value) * 0.1 : 0.05;
            
            let currentTime = this.audioContext.currentTime;
            
            notes.forEach((note) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(note.freq, currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, currentTime);
                gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration - 0.01);
                
                oscillator.start(currentTime);
                oscillator.stop(currentTime + note.duration);
                
                currentTime += note.duration;
            });
            
            // Schedule next loop
            const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0);
            this.musicTimeout = setTimeout(() => {
                if (this.musicPlaying) {
                    this.playBirthdayMelody();
                }
            }, totalDuration * 1000 + 2000); // Add 2 second pause between loops
            
        } catch (error) {
            console.log('Audio playback failed:', error);
            this.musicPlaying = false;
            const musicText = document.querySelector('.music-text');
            if (musicText) musicText.textContent = 'Music';
        }
    }
    
    // Background Animation Methods
    startBackgroundAnimations() {
        this.createFloatingHearts();
        this.createSparkles();
        this.createParticles();
        
        // Continue creating animations at intervals
        this.heartInterval = setInterval(() => {
            this.createFloatingHearts();
        }, 4000);
        
        this.sparkleInterval = setInterval(() => {
            this.createSparkles();
        }, 3000);
    }
    
    createFloatingHearts() {
        const heartsContainer = document.getElementById('floatingHearts');
        if (!heartsContainer) return;
        
        const hearts = ['💖', '💕', '💗', '💘', '❤️', '💝'];
        
        for (let i = 0; i < 2; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.left = Math.random() * 90 + '%';
            heart.style.animationDelay = Math.random() * 2 + 's';
            heart.style.animationDuration = (Math.random() * 2 + 4) + 's';
            
            heartsContainer.appendChild(heart);
            
            // Remove heart after animation
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.remove();
                }
            }, 6000);
        }
    }
    
    createSparkles() {
        const sparklesContainer = document.getElementById('sparkles');
        if (!sparklesContainer) return;
        
        const sparkles = ['✨', '⭐', '🌟', '💫'];
        
        for (let i = 0; i < 3; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle-element';
            sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            sparkle.style.left = Math.random() * 90 + '%';
            sparkle.style.top = Math.random() * 90 + '%';
            sparkle.style.animationDelay = Math.random() * 2 + 's';
            
            sparklesContainer.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.remove();
                }
            }, 4000);
        }
    }
    
    createFloatingBalloons() {
        const balloonsContainer = document.getElementById('balloons');
        if (!balloonsContainer) return;
        
        const balloons = ['🎈', '🎀', '🎁', '🌹'];
        
        for (let i = 0; i < 2; i++) {
            const balloon = document.createElement('div');
            balloon.className = 'balloon';
            balloon.textContent = balloons[Math.floor(Math.random() * balloons.length)];
            balloon.style.left = Math.random() * 80 + '%';
            balloon.style.animationDelay = Math.random() * 2 + 's';
            balloon.style.animationDuration = (Math.random() * 2 + 8) + 's';
            
            balloonsContainer.appendChild(balloon);
            
            setTimeout(() => {
                if (balloon.parentNode) {
                    balloon.remove();
                }
            }, 10000);
        }
    }
    
    createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;
        
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '2px';
            particle.style.height = '2px';
            particle.style.background = `hsl(${Math.random() * 60 + 300}, 70%, 70%)`;
            particle.style.borderRadius = '50%';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.opacity = '0.6';
            particle.style.animation = `sparkleFloat ${Math.random() * 3 + 2}s ease-in-out infinite`;
            particle.style.animationDelay = Math.random() * 2 + 's';
            
            particlesContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 5000);
        }
    }
    
    createInitialEffects() {
        setTimeout(() => {
            this.createHeartBurst();
        }, 1000);
        
        setTimeout(() => {
            this.showConfettiExplosion(20);
        }, 1500);
    }
    
    showConfettiExplosion(count = 50) {
        const confettiContainer = document.getElementById('confetti');
        if (!confettiContainer) return;
        
        const colors = ['#ff69b4', '#ff1493', '#da70d6', '#ba55d3', '#9370db', '#ffd700'];
        
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (Math.random() * 1 + 2) + 's';
            
            confettiContainer.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.remove();
                }
            }, 3000);
        }
    }
    
    createHeartBurst() {
        const heartsContainer = document.getElementById('floatingHearts');
        if (!heartsContainer) return;
        
        const hearts = ['💖', '💕', '💗', '💘', '❤️'];
        
        for (let i = 0; i < 8; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.position = 'fixed';
            heart.style.left = '50%';
            heart.style.top = '50%';
            heart.style.fontSize = '1.5rem';
            heart.style.pointerEvents = 'none';
            heart.style.zIndex = '1000';
            
            const angle = (360 / 8) * i * Math.PI / 180;
            const distance = 150;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            heart.style.animation = `heartBurstMobile 2s ease-out forwards`;
            heart.style.setProperty('--end-x', endX + 'px');
            heart.style.setProperty('--end-y', endY + 'px');
            heart.style.animationDelay = (i * 0.1) + 's';
            
            heartsContainer.appendChild(heart);
            
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.remove();
                }
            }, 2500);
        }
        
        // Add burst animation keyframes
        if (!document.querySelector('#heartBurstMobile')) {
            const style = document.createElement('style');
            style.id = 'heartBurstMobile';
            style.textContent = `
                @keyframes heartBurstMobile {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(calc(-50% + var(--end-x, 0px)), calc(-50% + var(--end-y, 0px))) scale(1.5);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    createRandomHearts() {
        const heartsContainer = document.getElementById('floatingHearts');
        if (!heartsContainer) return;
        
        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.textContent = '💖';
            heart.style.left = Math.random() * 90 + '%';
            heart.style.fontSize = '1.2rem';
            heart.style.animationDuration = '3s';
            
            heartsContainer.appendChild(heart);
            
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.remove();
                }
            }, 3000);
        }
    }
    
    createRandomSparkles() {
        const sparklesContainer = document.getElementById('sparkles');
        if (!sparklesContainer) return;
        
        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle-element';
            sparkle.textContent = '✨';
            sparkle.style.left = Math.random() * 90 + '%';
            sparkle.style.top = Math.random() * 90 + '%';
            sparkle.style.fontSize = '1.2rem';
            sparkle.style.animationDuration = '2s';
            
            sparklesContainer.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.remove();
                }
            }, 2000);
        }
    }
    
    createTransitionEffect() {
        this.createRandomSparkles();
        
        setTimeout(() => {
            this.createRandomHearts();
        }, 200);
    }
    
    createMemorySparkles() {
        const sparklesContainer = document.getElementById('sparkles');
        if (!sparklesContainer) return;
        
        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle-element';
            sparkle.textContent = '✨';
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 100 + '%';
            sparkle.style.fontSize = '1rem';
            sparkle.style.animationDelay = (i * 0.2) + 's';
            
            sparklesContainer.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.remove();
                }
            }, 4000);
        }
    }
    
    createSparklesAroundElement(element) {
        const rect = element.getBoundingClientRect();
        const sparklesContainer = document.getElementById('sparkles');
        if (!sparklesContainer) return;
        
        for (let i = 0; i < 4; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle-element';
            sparkle.textContent = '✨';
            sparkle.style.position = 'fixed';
            sparkle.style.left = (rect.left + Math.random() * rect.width) + 'px';
            sparkle.style.top = (rect.top + Math.random() * rect.height) + 'px';
            sparkle.style.fontSize = '1rem';
            sparkle.style.zIndex = '1000';
            sparkle.style.pointerEvents = 'none';
            
            sparklesContainer.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.remove();
                }
            }, 2000);
        }
    }
    
    createHeartsAroundElement(element) {
        const rect = element.getBoundingClientRect();
        const heartsContainer = document.getElementById('floatingHearts');
        if (!heartsContainer) return;
        
        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.textContent = '💕';
            heart.style.position = 'fixed';
            heart.style.left = (rect.left + Math.random() * rect.width) + 'px';
            heart.style.top = (rect.top + Math.random() * rect.height) + 'px';
            heart.style.fontSize = '1.2rem';
            heart.style.zIndex = '1000';
            heart.style.pointerEvents = 'none';
            heart.style.animationDuration = '2s';
            
            heartsContainer.appendChild(heart);
            
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.remove();
                }
            }, 2000);
        }
    }
    
    showGrandFinale() {
        // Multiple waves of effects
        this.showConfettiExplosion(100);
        this.createHeartBurst();
        
        setTimeout(() => {
            this.showConfettiExplosion(50);
            this.createRandomSparkles();
        }, 500);
        
        setTimeout(() => {
            this.showConfettiExplosion(50);
            this.createRandomHearts();
        }, 1000);
        
        setTimeout(() => {
            this.createHeartBurst();
        }, 1500);
        
        // Vibration feedback if supported
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 200]);
        }
    }
    
    // Cleanup methods
    cleanup() {
        if (this.heartInterval) clearInterval(this.heartInterval);
        if (this.sparkleInterval) clearInterval(this.sparkleInterval);
        if (this.quoteInterval) clearInterval(this.quoteInterval);
        if (this.musicTimeout) clearTimeout(this.musicTimeout);
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    }
}

// Initialize the website when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window;
    
    if (isMobile || isTouch) {
        document.body.classList.add('mobile-device');
    }
    
    // Initialize the birthday website
    window.birthdayWebsite = new BirthdayWebsite();
    
    // Prevent zoom on double tap for iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Prevent context menu on long press
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Handle visibility change (pause animations when not visible)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden, pause heavy animations
            if (window.birthdayWebsite && window.birthdayWebsite.musicPlaying) {
                window.birthdayWebsite.stopMusic();
            }
        }
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        // Force a repaint after orientation change
        setTimeout(() => {
            document.body.style.height = '100vh';
            document.body.style.height = '100svh';
        }, 100);
    });
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.birthdayWebsite) {
        window.birthdayWebsite.cleanup();
    }
});