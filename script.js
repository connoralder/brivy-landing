/* ==========================================================================
   Config
   ========================================================================== */

// Where waitlist emails are POSTed. Any form-backend that accepts a normal
// form POST works (Formspree, Basin, Getform, a Google Apps Script, etc.).
// Example (Formspree): 'https://formspree.io/f/abcdwxyz'
// While this is empty, signups fall back to opening an email to WAITLIST_FALLBACK_EMAIL.
const WAITLIST_ENDPOINT = '';
const WAITLIST_FALLBACK_EMAIL = 'support@brivy.io';

const YOUTUBE_VIDEO_ID = 'Bs-IgzauV2g';

/* ==========================================================================
   Helpers
   ========================================================================== */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

let lastFocused = null;

function openModal(modal, focusTarget) {
    lastFocused = document.activeElement;
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    if (focusTarget) setTimeout(() => focusTarget.focus(), 50);
}

function closeModal(modal) {
    if (!modal || !modal.classList.contains('active')) return;
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    modal.dispatchEvent(new Event('modal:close'));
    if (lastFocused) lastFocused.focus();
}

function wireModalDismiss(modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('.modal-close')) closeModal(modal);
    });
}

/* ==========================================================================
   Waitlist
   ========================================================================== */
function buildWaitlistModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'waitlistModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'waitlistTitle');
    modal.innerHTML = `
        <div class="waitlist-dialog">
            <button class="modal-close" aria-label="Close">&times;</button>
            <span class="wordmark">Brivy</span>
            <h3 id="waitlistTitle">Join the waitlist</h3>
            <p>Brivy is opening to new therapists in waves. Leave your email and we'll reach out when there's a spot for you.</p>
            <form class="waitlist-form" data-waitlist-form data-source="modal">
                <label class="sr-only" for="modalEmail">Email address</label>
                <input id="modalEmail" type="email" name="email" placeholder="you@yourpractice.com" required autocomplete="email">
                <button type="submit" class="btn-primary">Join the waitlist</button>
                <p class="form-status" role="status" aria-live="polite"></p>
            </form>
            <p class="fine-print">No spam. Just one email when it's your turn.</p>
        </div>`;
    document.body.appendChild(modal);
    wireModalDismiss(modal);
    return modal;
}

async function submitWaitlist(form) {
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');
    const email = input.value.trim();

    const setStatus = (msg, type) => {
        status.textContent = msg;
        status.classList.toggle('is-error', type === 'error');
        status.classList.toggle('is-success', type === 'success');
    };

    if (!isValidEmail(email)) {
        setStatus('Please enter a valid email address.', 'error');
        input.focus();
        return;
    }

    if (!WAITLIST_ENDPOINT) {
        const subject = encodeURIComponent('Brivy waitlist');
        const body = encodeURIComponent(`Please add me to the Brivy waitlist: ${email}`);
        window.location.href = `mailto:${WAITLIST_FALLBACK_EMAIL}?subject=${subject}&body=${body}`;
        setStatus('Opening your email app to finish signing up…', 'success');
        return;
    }

    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Joining…';
    setStatus('', null);

    try {
        const data = new FormData();
        data.append('email', email);
        data.append('source', form.dataset.source || 'site');
        const res = await fetch(WAITLIST_ENDPOINT, {
            method: 'POST',
            body: data,
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        input.value = '';
        setStatus("You're on the list! We'll be in touch.", 'success');
    } catch (err) {
        console.error('Waitlist signup failed:', err);
        setStatus(`Something went wrong. Email us at ${WAITLIST_FALLBACK_EMAIL} instead.`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalLabel;
    }
}

/* ==========================================================================
   Init
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // --- Waitlist -----------------------------------------------------------
    const waitlistModal = buildWaitlistModal();
    const waitlistInput = waitlistModal.querySelector('input');

    document.querySelectorAll('[data-waitlist]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            closeMobileMenu();
            openModal(waitlistModal, waitlistInput);
        });
    });

    document.querySelectorAll('[data-waitlist-form]').forEach((form) => {
        form.setAttribute('novalidate', '');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitWaitlist(form);
        });
    });

    // --- Demo video ---------------------------------------------------------
    const videoModal = document.getElementById('videoModal');
    const demoVideo = document.getElementById('demoVideo');

    if (videoModal && demoVideo) {
        wireModalDismiss(videoModal);
        videoModal.addEventListener('modal:close', () => { demoVideo.src = ''; });

        document.querySelectorAll('[data-demo]').forEach((btn) => {
            btn.addEventListener('click', () => {
                demoVideo.src = `https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`;
                openModal(videoModal, videoModal.querySelector('.modal-close'));
            });
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.modal.active').forEach(closeModal);
        closeMobileMenu();
    });

    // --- Mobile menu --------------------------------------------------------
    const navMenu = document.getElementById('navMenu') || document.querySelector('.nav-menu');
    const menuBtn = document.getElementById('mobileMenuBtn');

    function closeMobileMenu() {
        if (!navMenu || !menuBtn) return;
        navMenu.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    }

    if (navMenu && menuBtn) {
        menuBtn.addEventListener('click', () => {
            const open = navMenu.classList.toggle('active');
            menuBtn.setAttribute('aria-expanded', String(open));
            menuBtn.innerHTML = open ? '<i class="fas fa-xmark"></i>' : '<i class="fas fa-bars"></i>';
        });
        navMenu.querySelectorAll('.nav-link').forEach((link) => link.addEventListener('click', closeMobileMenu));
    }

    // --- Smooth scrolling for in-page links -----------------------------------
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('a[href^="#"]:not([data-waitlist])').forEach((link) => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    });

    // --- Navbar hide on scroll down -----------------------------------------
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const menuOpen = navMenu && navMenu.classList.contains('active');
        navbar.classList.toggle('nav-hidden', !menuOpen && scrollTop > lastScrollTop && scrollTop > 120);
        lastScrollTop = scrollTop;
    }, { passive: true });

    // --- FAQ accordion -------------------------------------------------------
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const willOpen = !item.classList.contains('active');
            faqItems.forEach((other) => {
                other.classList.remove('active');
                other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });
            item.classList.toggle('active', willOpen);
            question.setAttribute('aria-expanded', String(willOpen));
        });
    });

    // --- Scroll reveal ---------------------------------------------------------
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach((el, i) => {
            el.style.transitionDelay = `${(i % 3) * 70}ms`;
            observer.observe(el);
        });
    } else {
        revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    // --- Footer year -----------------------------------------------------------
    document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
});
