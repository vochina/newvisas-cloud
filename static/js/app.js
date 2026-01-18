// NewVisas Cloud - Main JavaScript

document.addEventListener('DOMContentLoaded', function () {
    console.log('NewVisas Cloud loaded');

    // Add smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ==================== Banner Slider ====================
    initBannerSlider();
});

/**
 * Banner Slider - Auto-rotating carousel with fade effect
 */
function initBannerSlider() {
    const slidePic = document.querySelector('ul.slide-pic');
    if (!slidePic) return;

    const slides = slidePic.querySelectorAll('li');
    const dots = document.querySelectorAll('ul.op li');
    const txtDots = document.querySelectorAll('ul.slide-txt li');

    if (slides.length <= 1) return;

    const config = {
        interval: 5000,      // Auto-play interval (ms)
        fadeInTime: 300,     // Fade in duration (ms)
        fadeOutTime: 200     // Fade out duration (ms)
    };

    let current = 0;
    let intervalID = null;
    let isAnimating = false;

    // Fade out helper
    function fadeOut(el, duration, callback) {
        el.style.transition = `opacity ${duration}ms ease`;
        el.style.opacity = '0';
        setTimeout(() => {
            el.style.display = 'none';
            el.style.opacity = '';
            el.style.transition = '';
            if (callback) callback();
        }, duration);
    }

    // Fade in helper
    function fadeIn(el, duration) {
        el.style.opacity = '0';
        el.style.display = 'block';
        // Force reflow
        el.offsetHeight;
        el.style.transition = `opacity ${duration}ms ease`;
        el.style.opacity = '1';
        setTimeout(() => {
            el.style.transition = '';
        }, duration);
    }

    // Update dots/indicators
    function updateDots(index) {
        dots.forEach((dot, i) => {
            dot.classList.toggle('cur', i === index);
        });
        txtDots.forEach((dot, i) => {
            dot.classList.toggle('cur', i === index);
        });
    }

    // Slide to specific index
    function slideTo(index) {
        if (isAnimating || index === current) return;
        isAnimating = true;

        const oldSlide = slides[current];
        const newSlide = slides[index];

        // Remove old cur class
        oldSlide.classList.remove('cur');

        // Fade out current slide
        fadeOut(oldSlide, config.fadeOutTime, () => {
            // Fade in new slide
            fadeIn(newSlide, config.fadeInTime);
            newSlide.classList.add('cur');
            current = index;
            updateDots(current);
            isAnimating = false;
        });
    }

    // Auto next slide
    function next() {
        const nextIndex = (current >= slides.length - 1) ? 0 : current + 1;
        slideTo(nextIndex);
    }

    // Stop auto-play
    function stop() {
        if (intervalID) {
            clearInterval(intervalID);
            intervalID = null;
        }
    }

    // Start auto-play
    function go() {
        stop();
        intervalID = setInterval(next, config.interval);
    }

    // Add click handlers to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            stop();
            slideTo(index);
            go();
        });
        dot.addEventListener('mouseenter', () => {
            stop();
            slideTo(index);
        });
        dot.addEventListener('mouseleave', go);
    });

    // Pause on slide hover
    slidePic.addEventListener('mouseenter', stop);
    slidePic.addEventListener('mouseleave', go);

    // Start the carousel
    go();
}
