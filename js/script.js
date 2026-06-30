/* ─── JS: TaskFlow Hero Section ─── */

/* ══════════════════════════════════
   0. MOON RING PARTICLES (inward drift)
══════════════════════════════════ */
(function initMoonParticles() {
  const canvas  = document.getElementById('moon-particles');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  const wrapper = document.querySelector('.crescent-wrapper');
  if (!wrapper) return;

  /* SVG viewBox constants — must match the HTML */
  const VB      = 760;   // viewBox size
  const VB_CX   = 380;   // circle cx in viewBox
  const VB_CY   = 380;   // circle cy in viewBox
  const VB_R    = 368;   // circle r  in viewBox

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /* Convert SVG coords → screen coords on every frame */
  function getCircle() {
    const rect  = wrapper.getBoundingClientRect();
    const scale = rect.width / VB;
    return {
      cx: rect.left + VB_CX * scale,
      cy: rect.top  + VB_CY * scale,
      r : VB_R * scale,
    };
  }

  const particles = [];
  const MAX = 120;

  function spawn() {
    const { cx, cy, r } = getCircle();
    const angle = Math.random() * Math.PI * 2;

    /* Start exactly on the ring edge */
    const sx = cx + Math.cos(angle) * r;
    const sy = cy + Math.sin(angle) * r;

    /* Velocity: toward the center, varying speed */
    const speed  = Math.random() * 1.4 + 0.4;
    const dx     = (cx - sx) / r;          // unit vector inward
    const dy     = (cy - sy) / r;

    /* Tiny random drift perpendicular to inward direction */
    const spread = (Math.random() - 0.5) * 0.4;

    particles.push({
      x: sx, y: sy,
      vx: dx * speed + (-dy) * spread,
      vy: dy * speed + ( dx) * spread,
      life : 1.0,
      decay: Math.random() * 0.009 + 0.004, /* lifespan variance */
      size : Math.random() * 2.2 + 0.4,
      hue  : 120 + Math.random() * 30,      /* green range */
    });
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Spawn a handful per frame */
    const needed = MAX - particles.length;
    const batch  = Math.min(needed, 3);
    for (let i = 0; i < batch; i++) spawn();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x    += p.vx;
      p.y    += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) { particles.splice(i, 1); continue; }

      const alpha = p.life * p.life;   /* quadratic — fast fade */
      const r     = p.size * p.life;

      ctx.save();
      ctx.globalAlpha  = alpha * 0.85;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle    = `hsl(${p.hue}, 92%, 62%)`;
      ctx.shadowBlur   = 10;
      ctx.shadowColor  = `hsl(${p.hue}, 90%, 50%)`;
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize);
  tick();
})();

/* ══════════════════════════════════
   1. STAR / PARTICLE CANVAS
══════════════════════════════════ */
(function initStars() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');

  let stars = [];
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createStars(count) {
    stars = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 1.4 + 0.2;
      stars.push({
        x:       Math.random() * W,
        y:       Math.random() * H,
        size:    size,
        opacity: Math.random() * 0.7 + 0.1,
        speed:   (Math.random() * 0.3 + 0.05) * (Math.random() < 0.5 ? 1 : -1),
        twinkle: Math.random() * Math.PI * 2,   // phase offset
        tRate:   Math.random() * 0.02 + 0.005,  // twinkle speed
      });
    }
  }

  function drawStars() {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      // twinkle
      s.twinkle += s.tRate;
      const alpha = s.opacity * (0.5 + 0.5 * Math.sin(s.twinkle));

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      ctx.fill();

      // drift slowly
      s.x += s.speed * 0.1;
      if (s.x < 0) s.x = W;
      if (s.x > W) s.x = 0;
    }
    requestAnimationFrame(drawStars);
  }

  resize();
  createStars(160);
  drawStars();
  window.addEventListener('resize', () => { resize(); createStars(160); });
})();


/* ══════════════════════════════════
   2. NAVBAR — scroll shadow & hamburger
══════════════════════════════════ */
(function initNav() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');

  // Scroll shadow
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Mobile menu toggle
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
})();




/* ══════════════════════════════════
   4. BUTTON — ripple effect
══════════════════════════════════ */
(function initRipple() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect   = this.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const ripple = document.createElement('span');

      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        transform: scale(0);
        background: rgba(255,255,255,0.25);
        pointer-events: none;
        width: 80px; height: 80px;
        left: ${x - 40}px; top: ${y - 40}px;
        animation: ripple-anim 0.55s ease-out forwards;
      `;

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Inject ripple keyframe once
  if (!document.getElementById('ripple-style')) {
    const s = document.createElement('style');
    s.id = 'ripple-style';
    s.textContent = `
      @keyframes ripple-anim {
        to { transform: scale(3.5); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }
})();


/* ══════════════════════════════════
   5. HERO CONTENT — stagger entrance
   (CSS handles it, this adds GSAP-like
    class toggling if elements are off-screen)
══════════════════════════════════ */
(function initHeroEntrance() {
  const els = document.querySelectorAll(
    '#badge, #hero-title, #hero-subtitle, #hero-buttons'
  );
  // Intersection Observer for graceful replay if section comes into view
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => {
    el.style.animationPlayState = 'paused';
    // trigger on next frame so CSS has been applied
    requestAnimationFrame(() => {
      el.style.animationPlayState = 'running';
    });
    io.observe(el);
  });
})();

/* ══════════════════════════════════
   DASHBOARD LIGHTWEIGHT SCROLL ANIMATION
══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const dashboardWrapper = document.getElementById('dashboard-image-wrapper');

  if (dashboardWrapper) {
    const dashboardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          dashboardWrapper.classList.add('is-visible');
        } else {
          // Optional: remove if you want it to fade out when scrolling away
          dashboardWrapper.classList.remove('is-visible');
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    dashboardObserver.observe(dashboardWrapper);
  }

  // General scroll reveal for elements with .reveal-up
  const revealElements = document.querySelectorAll('.reveal-up');
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // Only animate once
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -20px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }


});

/* ══════════════════════════════════
   INTERACTIVE WORKFLOW TOPICS
══════════════════════════════════ */
const interactiveData = {
  '1': {
    image: 'assets/images/feature_transparency.png'
  },
  '2': {
    image: 'assets/images/feature_automation.png'
  },
  '3': {
    image: 'assets/images/feature_integrations.png'
  },
  '4': {
    image: 'assets/images/feature_analytics.png'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const topics = document.querySelectorAll('.interactive-topic');
  const imageEl = document.getElementById('workflow-image');
  let hoverTimeout;

  topics.forEach(topic => {
    topic.addEventListener('mouseenter', () => {
      // Don't trigger if already active
      if (topic.classList.contains('active')) return;

      // Update active classes
      topics.forEach(t => t.classList.remove('active'));
      topic.classList.add('active');

      const id = topic.getAttribute('data-id');
      const data = interactiveData[id];

      // Smooth animate out image
      if (imageEl) {
        imageEl.style.opacity = '0';
        imageEl.style.transform = 'scale(0.98)';
      }
      
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        // Swap image
        if (imageEl) {
          imageEl.src = data.image;
          imageEl.style.opacity = '1';
          imageEl.style.transform = 'scale(1)';
        }
      }, 300); // Wait 300ms to allow smooth fade out before swapping
    });

    topic.addEventListener('mouseleave', () => {
      topic.classList.remove('active');
    });
  });
});

// --- STATS COUNTER ANIMATION ---
document.addEventListener("DOMContentLoaded", () => {
  const statsSection = document.querySelector('.stats');
  const counters = document.querySelectorAll('.counter');
  let animated = false;

  if (statsSection && counters.length > 0) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Trigger animation when section is at least 30% visible
        if (entry.isIntersecting && !animated) {
          animated = true;
          
          counters.forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-target'));
            const duration = 2000; // 2 seconds animation
            const frameDuration = 1000 / 60; // ~60fps
            const totalFrames = Math.round(duration / frameDuration);
            let frame = 0;
            
            // Check if the target is a float (e.g., 99.9) or int (e.g., 10, 40, 5)
            const isFloat = counter.getAttribute('data-target').includes('.');
            
            const counterInterval = setInterval(() => {
              frame++;
              const progress = frame / totalFrames;
              
              // easeOutQuad function for a smooth slow-down at the end
              const easeProgress = 1 - (1 - progress) * (1 - progress);
              const current = target * easeProgress;
              
              if (isFloat) {
                counter.innerText = current.toFixed(1);
              } else {
                counter.innerText = Math.round(current);
              }
              
              if (frame === totalFrames) {
                clearInterval(counterInterval);
                counter.innerText = target; // Ensure it ends exactly on target
              }
            }, frameDuration);
          });
        }
      });
    }, { threshold: 0.3 }); // Trigger when 30% of stats section is visible
    
    statsObserver.observe(statsSection);
  }

  // --- DASHBOARD IMAGE ANIMATION ---
  const dashboardImg = document.getElementById('dashboard-image-wrapper');
  if (dashboardImg) {
    const dashboardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          dashboardImg.classList.add('is-visible');
          // Optional: stop observing once it has animated in
          dashboardObserver.unobserve(dashboardImg);
        }
      });
    }, { threshold: 0.1 });
    dashboardObserver.observe(dashboardImg);
  }

  // --- FAQS ACCORDION ---
  const faqCards = document.querySelectorAll('.faq-card');
  faqCards.forEach(card => {
    card.addEventListener('click', () => {
      const answer = card.querySelector('.faq-card-answer');
      const isActive = card.classList.contains('active');
      
      // Close all other FAQs
      document.querySelectorAll('.faq-card').forEach(otherCard => {
        otherCard.classList.remove('active');
        otherCard.querySelector('.faq-card-answer').style.maxHeight = null;
      });
      
      // If it wasn't active, open it
      if (!isActive) {
        card.classList.add('active');
      }
    });
  });
});
