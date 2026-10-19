/* ============================================================
   VELT MEDIA — PERFORMANCE & INTERACTIVITY SCRIPT
   60fps scroll reveals, interactive gallery filtering,
   booking scope selector, pauseable marquee, and mobile polish.
   ============================================================ */

(function () {
  'use strict';

  var html = document.documentElement;
  var body = document.body;

  var prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer =
    window.matchMedia('(pointer: fine)').matches;

  /* ============================================================
     TOAST HELPER
     ============================================================ */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2600);
  }

  /* ============================================================
     HEADER SCROLL, PROGRESS BAR & BACK TO TOP
     ============================================================ */
  var header = document.getElementById('header');
  var scrollProgress = document.getElementById('scrollProgress');
  var backToTop = document.getElementById('backToTop');
  var scrollTicking = false;

  function updateScrollUI() {
    var scrollY = window.scrollY || window.pageYOffset;

    if (header) {
      header.classList.toggle('scrolled', scrollY > 36);
    }

    if (scrollProgress) {
      var docHeight = html.scrollHeight - window.innerHeight;
      var ratio = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;
      scrollProgress.style.transform = 'scaleX(' + ratio + ')';
    }

    if (backToTop) {
      backToTop.classList.toggle('visible', scrollY > 520);
    }

    scrollTicking = false;
  }

  window.addEventListener(
    'scroll',
    function () {
      if (!scrollTicking) {
        requestAnimationFrame(updateScrollUI);
        scrollTicking = true;
      }
    },
    { passive: true }
  );
  updateScrollUI();

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ============================================================
     MOBILE NAVIGATION (WITH ESCAPE & RESIZE SAFETY)
     ============================================================ */
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  var navBackdrop = document.getElementById('navBackdrop');
  var navLinks = document.querySelectorAll('.nav__link');
  var mobileNavCta = document.getElementById('mobileNavCta');

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('nav--open');
    if (navToggle) {
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    }
    body.classList.remove('no-scroll');
    if (navBackdrop) {
      navBackdrop.classList.remove('active');
    }
  }

  function toggleNav() {
    if (!nav) return;
    var isOpen = nav.classList.toggle('nav--open');
    if (navToggle) {
      navToggle.classList.toggle('active', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    }
    body.classList.toggle('no-scroll', isOpen);
    if (navBackdrop) {
      navBackdrop.classList.toggle('active', isOpen);
    }
  }

  if (navToggle) {
    navToggle.addEventListener('click', toggleNav);
  }
  if (navBackdrop) {
    navBackdrop.addEventListener('click', closeNav);
  }
  if (mobileNavCta) {
    mobileNavCta.addEventListener('click', closeNav);
  }
  navLinks.forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && nav && nav.classList.contains('nav--open')) {
      closeNav();
      if (navToggle) navToggle.focus();
    }
  });

  window.addEventListener(
    'resize',
    function () {
      if (window.innerWidth > 900 && nav && nav.classList.contains('nav--open')) {
        closeNav();
      }
    },
    { passive: true }
  );

  /* ============================================================
     ACTIVE NAV LINK & OFF-SCREEN ANIMATION PAUSING
     ============================================================ */
  var sections = document.querySelectorAll('main section[id]');

  if ('IntersectionObserver' in window && sections.length) {
    var navMap = new Map();
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href && href.charAt(0) === '#') {
        navMap.set(href.substring(1), link);
      }
    });

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var activeLink = navMap.get(entry.target.id);
          if (!activeLink) return;
          navLinks.forEach(function (link) {
            link.classList.remove('active');
          });
          activeLink.classList.add('active');
        });
      },
      {
        rootMargin: '-42% 0px -50% 0px',
        threshold: 0
      }
    );

    var visibilityObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('is-offscreen', !entry.isIntersecting);
        });
      },
      { rootMargin: '100px 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
      visibilityObserver.observe(section);
    });
  }

  /* ============================================================
     STAT COUNTERS
     ============================================================ */
  var statEls = document.querySelectorAll('[data-count]');

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1200;
    var startTime = null;

    function frame(timestamp) {
      if (startTime === null) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  }

  if (statEls.length) {
    if (prefersReducedMotion) {
      statEls.forEach(function (el) {
        el.textContent =
          el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
      });
    } else if ('IntersectionObserver' in window) {
      var statObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            animateCount(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.5 }
      );
      statEls.forEach(function (el) {
        statObserver.observe(el);
      });
    }
  }

  /* ============================================================
     INTERACTIVE GALLERY FILTER
     ============================================================ */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var galleryGrid = document.getElementById('galleryGrid');
  var galleryItems = document.querySelectorAll('.gallery-item');

  if (filterBtns.length && galleryGrid && galleryItems.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var category = btn.getAttribute('data-filter') || 'all';

        filterBtns.forEach(function (b) {
          var isSelected = b === btn;
          b.classList.toggle('active', isSelected);
          b.setAttribute('aria-selected', String(isSelected));
        });

        galleryGrid.classList.toggle('gallery__grid--filtered', category !== 'all');

        galleryItems.forEach(function (item) {
          var itemCat = item.getAttribute('data-category');
          var match = category === 'all' || itemCat === category;
          item.classList.toggle('is-hidden', !match);

          if (match && !prefersReducedMotion && typeof window.gsap !== 'undefined') {
            window.gsap.fromTo(
              item,
              { opacity: 0, y: 16, scale: 0.98 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.42,
                ease: 'power2.out',
                clearProps: 'transform,opacity'
              }
            );
          }
        });

        if (typeof window.ScrollTrigger !== 'undefined') {
          window.ScrollTrigger.refresh();
        }
      });
    });
  }

  /* ============================================================
     TESTIMONIALS PAUSE / RESUME CONTROL
     ============================================================ */
  var testimonialMarquee = document.getElementById('testimonialMarquee');
  var testimonialPauseBtn = document.getElementById('testimonialPauseBtn');
  var testimonialPauseLabel = document.getElementById('testimonialPauseLabel');

  if (testimonialMarquee && testimonialPauseBtn) {
    testimonialPauseBtn.addEventListener('click', function () {
      var paused = testimonialMarquee.classList.toggle('is-paused');
      testimonialPauseBtn.setAttribute('aria-pressed', String(paused));
      if (testimonialPauseLabel) {
        testimonialPauseLabel.textContent = paused ? 'Resume' : 'Pause';
      }
    });
  }

  /* ============================================================
     INTERACTIVE SERVICE SELECTION & BOOKING SCOPE CONFIGURATOR
     ============================================================ */
  var scopePills = document.querySelectorAll('.scope-pill');
  var serviceSelectBtns = document.querySelectorAll('[data-select-service]');
  var bookingSummary = document.getElementById('bookingSummary');
  var emailContactLink = document.getElementById('emailContactLink');
  var copyEmailBtn = document.getElementById('copyEmailBtn');

  function setProjectScope(serviceName) {
    scopePills.forEach(function (pill) {
      pill.classList.toggle(
        'active',
        pill.getAttribute('data-service') === serviceName
      );
    });

    if (bookingSummary) {
      bookingSummary.innerHTML =
        'Selected: <strong>' +
        serviceName +
        '</strong> &bull; Standard 48-Hr Turnaround';
    }

    if (emailContactLink) {
      var subject = encodeURIComponent(
        'Project Inquiry: ' + serviceName + ' (48H Slot)'
      );
      var bodyText = encodeURIComponent(
        'Hi Velt Media,\n\nI’m reaching out to book a post-production slot for an upcoming ' +
          serviceName +
          ' project.\n\nPlease let me know your current availability and the best time for a quick chat to go over the scope and timeline.\n\nLooking forward to connecting!'
      );
      emailContactLink.setAttribute(
        'href',
        'https://mail.google.com/mail/?view=cm&fs=1&to=veltmedia7@gmail.com&su=' +
          subject +
          '&body=' +
          bodyText
      );
    }
  }

  scopePills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      var serviceName = pill.getAttribute('data-service') || 'Automotive Content';
      setProjectScope(serviceName);
    });
  });

  serviceSelectBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var serviceName = btn.getAttribute('data-select-service') || 'Automotive Content';
      setProjectScope(serviceName);
      var contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
      }
      showToast('Selected "' + serviceName + '" for your booking inquiry');
    });
  });

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', function () {
      var email = 'veltmedia7@gmail.com';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(email)
          .then(function () {
            showToast('Copied veltmedia7@gmail.com to clipboard');
          })
          .catch(function () {
            fallbackCopy(email);
          });
      } else {
        fallbackCopy(email);
      }
    });
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Copied veltmedia7@gmail.com to clipboard');
    } catch (e) {
      showToast('Email: veltmedia7@gmail.com');
    }
  }

  /* ============================================================
     CARD SPOTLIGHT & SUBTLE TILT (DESKTOP FINE POINTER ONLY)
     ============================================================ */
  if (!prefersReducedMotion && finePointer) {
    var tiltCards = document.querySelectorAll('.service-card, .branch-card');

    tiltCards.forEach(function (card) {
      var animationFrame = null;
      var mouseX = 0;
      var mouseY = 0;
      var cardRect = null;

      function renderTilt() {
        animationFrame = null;
        if (!cardRect) {
          cardRect = card.getBoundingClientRect();
        }
        var x = mouseX - cardRect.left;
        var y = mouseY - cardRect.top;
        var percentX = x / cardRect.width;
        var percentY = y / cardRect.height;

        var maxTilt = card.classList.contains('service-card') ? 2.8 : 1.8;
        var rotateX = (percentY - 0.5) * -maxTilt;
        var rotateY = (percentX - 0.5) * maxTilt;

        card.style.transform =
          'translate3d(0,-5px,0) rotateX(' +
          rotateX +
          'deg) rotateY(' +
          rotateY +
          'deg)';
        card.style.setProperty('--mx', percentX * 100 + '%');
        card.style.setProperty('--my', percentY * 100 + '%');
      }

      card.addEventListener('mouseenter', function () {
        cardRect = card.getBoundingClientRect();
        card.style.willChange = 'transform';
      });

      card.addEventListener(
        'mousemove',
        function (event) {
          mouseX = event.clientX;
          mouseY = event.clientY;
          if (!animationFrame) {
            animationFrame = requestAnimationFrame(renderTilt);
          }
        },
        { passive: true }
      );

      card.addEventListener('mouseleave', function () {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        cardRect = null;
        card.style.transform = '';
        card.style.willChange = 'auto';
      });
    });
  }

  /* ============================================================
     CURSOR GLOW (ONLY ANIMATES WHILE MOUSE MOVES ON DESKTOP)
     ============================================================ */
  var cursorGlow = document.querySelector('.cursor-glow');

  if (cursorGlow && !prefersReducedMotion && finePointer) {
    var glowX = 0;
    var glowY = 0;
    var targetX = 0;
    var targetY = 0;
    var glowAnimationRunning = false;

    function animateGlow() {
      var deltaX = targetX - glowX;
      var deltaY = targetY - glowY;

      glowX += deltaX * 0.14;
      glowY += deltaY * 0.14;

      cursorGlow.style.transform =
        'translate3d(' + (glowX - 170) + 'px,' + (glowY - 170) + 'px,0)';

      if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
        requestAnimationFrame(animateGlow);
      } else {
        glowAnimationRunning = false;
      }
    }

    window.addEventListener(
      'mousemove',
      function (event) {
        targetX = event.clientX;
        targetY = event.clientY;
        cursorGlow.style.opacity = '1';
        if (!glowAnimationRunning) {
          glowAnimationRunning = true;
          requestAnimationFrame(animateGlow);
        }
      },
      { passive: true }
    );
  } else if (cursorGlow) {
    cursorGlow.style.display = 'none';
  }

  /* ============================================================
     GSAP SCROLL REVEALS (WITH CLEARPROPS SO HOVER NEVER BREAKS)
     ============================================================ */
  function initScrollAnimations() {
    if (
      typeof window.gsap === 'undefined' ||
      typeof window.ScrollTrigger === 'undefined'
    ) {
      return;
    }

    html.classList.add('gsap-ready');
    window.gsap.registerPlugin(window.ScrollTrigger);

    document.querySelectorAll('[data-reveal]').forEach(function (element) {
      window.gsap.fromTo(
        element,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.78,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: element,
            start: 'top 89%',
            once: true
          }
        }
      );
    });

    document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
      window.gsap.fromTo(
        group.children,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.72,
          ease: 'power3.out',
          stagger: 0.09,
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: group,
            start: 'top 89%',
            once: true
          }
        }
      );
    });
  }

  if (
    !prefersReducedMotion &&
    typeof window.gsap !== 'undefined' &&
    typeof window.ScrollTrigger !== 'undefined'
  ) {
    initScrollAnimations();
  }
})();
