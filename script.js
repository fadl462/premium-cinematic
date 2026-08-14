gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 800px)").matches;

const lenis = reduceMotion ? null : new Lenis({
  duration: 0.92,
  smoothWheel: true,
  smoothTouch: false,
  wheelMultiplier: 0.9,
  syncTouch: false
});

if (lenis) {
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(1000, 16);
}

const navWrap = document.querySelector(".nav-wrap");
const sections = [...document.querySelectorAll(".cinematic")];
const mobileMenu = document.querySelector(".mobile-menu");
const menuButton = document.querySelector(".menu-btn");
const menuClose = document.querySelector(".mobile-menu-close");
const menuLinks = [...document.querySelectorAll(".mobile-menu-links a")];
const progressBar = document.querySelector(".scroll-progress span");
const cursorDot = document.querySelector(".cursor-dot");
const cursorRing = document.querySelector(".cursor-ring");
const pageTransition = document.querySelector(".page-transition");

window.addEventListener("load", () => {
  requestAnimationFrame(() => pageTransition?.classList.add("hide"));
  document.getElementById("preloader")?.classList.add("hide");
  ScrollTrigger.refresh();
});

if (lenis) {
  lenis.on("scroll", ({ scroll, limit }) => {
    if (progressBar && limit > 0) {
      progressBar.style.width = `${Math.min(100, Math.max(0, scroll / limit * 100))}%`;
    }
    navWrap?.classList.toggle("scrolled", scroll > 80);
  });
} else {
  window.addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const current = window.scrollY;
    if (progressBar && max > 0) progressBar.style.width = `${current / max * 100}%`;
    navWrap?.classList.toggle("scrolled", current > 80);
  }, { passive: true });
}

/* ---------- Cursor: visual only; never intercepts video interaction ---------- */
if (!isMobile && !reduceMotion && cursorDot && cursorRing) {
  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener("pointermove", (event) => {
    mx = event.clientX;
    my = event.clientY;
    gsap.to(cursorDot, { x: mx, y: my, duration: .06, overwrite: true });
  }, { passive: true });

  gsap.ticker.add(() => {
    rx += (mx - rx) * .2;
    ry += (my - ry) * .2;
    gsap.set(cursorRing, { x: rx, y: ry });
  });

  document.querySelectorAll("a,button,.stat,.mobile-menu-links a").forEach(el => {
    el.addEventListener("mouseenter", () => cursorRing.classList.add("active"));
    el.addEventListener("mouseleave", () => cursorRing.classList.remove("active"));
  });
}

/* ---------- Reliable cinematic video system ---------- */
const videoSections = sections.filter(section => section.querySelector(".bg-video"));
let activeSection = null;
let playToken = 0;

function getVideo(section) {
  return section?.querySelector(".bg-video");
}

function prepareVideo(section) {
  const video = getVideo(section);
  if (!video || reduceMotion) return null;

  if (!video.dataset.loaded) {
    video.src = section.dataset.video;
    video.dataset.loaded = "true";
    video.preload = section.id === "hero" ? "auto" : "auto";
    video.load();
  }
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  return video;
}

function playVideo(video) {
  if (!video || reduceMotion) return Promise.resolve();

  video.muted = true;
  const attempt = video.play();
  if (attempt && typeof attempt.catch === "function") {
    return attempt.catch(() => {});
  }
  return Promise.resolve();
}

function activateVideo(section) {
  if (!section || reduceMotion) return;
  if (activeSection === section) {
    playVideo(getVideo(section));
    return;
  }

  const video = prepareVideo(section);
  if (!video) return;

  const token = ++playToken;

  /* Never pause the currently visible video before the incoming one is ready.
     This prevents the black/stutter gap during section changes. */
  const startIncoming = () => {
    if (token !== playToken) return;
    activeSection = section;

    video.currentTime = video.currentTime || 0;
    playVideo(video);

    videoSections.forEach(other => {
      if (other === section) return;
      const otherVideo = getVideo(other);
      if (otherVideo && !otherVideo.paused) {
        otherVideo.pause();
      }
    });
  };

  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    startIncoming();
  } else {
    video.addEventListener("canplay", startIncoming, { once: true });
  }
}

/* Hero is explicitly prepared immediately. The HTML also has autoplay/src,
   so the browser can start buffering before the JS boot sequence finishes. */
if (!reduceMotion) {
  const hero = document.querySelector("#hero");
  if (hero) activateVideo(hero);

  /* Warm the next scene without playing it. */
  videoSections.slice(1, 2).forEach(prepareVideo);
}

/* Switch only when a section is genuinely dominant in the viewport.
   Do not pause videos on individual intersection exits. */
const mediaObserver = new IntersectionObserver((entries) => {
  const candidates = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

  const dominant = candidates.find(entry => entry.intersectionRatio >= .48);
  if (dominant) {
    activateVideo(dominant.target);

    const index = videoSections.indexOf(dominant.target);
    const next = videoSections[index + 1];
    if (next) prepareVideo(next);
  }
}, {
  rootMargin: "0px 0px 0px 0px",
  threshold: [.2, .48, .7]
});

videoSections.forEach(section => mediaObserver.observe(section));

/* Keep the currently active video playing if the browser suspends playback.
   This is deliberately NOT tied to hover events. */
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && activeSection) {
    playVideo(getVideo(activeSection));
  }
});

videoSections.forEach(section => {
  const media = section.querySelector(".media");
  const light = section.querySelector(".scene-light");

  if (!reduceMotion && media) {
    gsap.fromTo(media,
      { scale: isMobile ? 1.01 : 1.025 },
      {
        scale: isMobile ? 1.035 : 1.065,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: .9
        }
      }
    );
  }

  if (!reduceMotion && light) {
    gsap.to(light, {
      x: isMobile ? -18 : 55,
      y: isMobile ? 12 : -28,
      rotation: 12,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2
      }
    });
  }

  if (!reduceMotion && section.classList.contains("pinned-section")) {
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=16%",
      pin: true,
      pinSpacing: false,
      anticipatePin: 1
    });
  }

  const eyebrow = section.querySelector(".eyebrow");
  const heading = section.querySelector("h2");
  const paragraph = section.querySelector(".copy-block > p:last-child");
  const index = section.querySelector(".section-index");
  const stats = section.querySelectorAll(".stat");

  if (eyebrow) {
    gsap.fromTo(eyebrow, { y: 20, opacity: 0 }, {
      y: 0, opacity: 1, duration: .75, ease: "power3.out",
      scrollTrigger: { trigger: section, start: "top 68%", once: true }
    });
  }

  if (heading) {
    gsap.fromTo(heading, { y: 55, opacity: 0, rotateX: 5 }, {
      y: 0, opacity: 1, rotateX: 0, duration: 1.0, ease: "power4.out",
      scrollTrigger: { trigger: section, start: "top 64%", once: true }
    });
  }

  if (paragraph) {
    gsap.fromTo(paragraph, { y: 22, opacity: 0 }, {
      y: 0, opacity: 1, duration: .8, delay: .1, ease: "power3.out",
      scrollTrigger: { trigger: section, start: "top 60%", once: true }
    });
  }

  if (index) {
    gsap.fromTo(index, { x: -20, opacity: 0 }, {
      x: 0, opacity: 1, duration: .75, ease: "power3.out",
      scrollTrigger: { trigger: section, start: "top 68%", once: true }
    });
  }

  if (stats.length) {
    gsap.fromTo(stats, { y: 42, opacity: 0 }, {
      y: 0, opacity: 1, duration: .85, stagger: .08, ease: "power3.out",
      scrollTrigger: { trigger: section, start: "top 58%", once: true }
    });
  }
});

/* ---------- Counters ---------- */
document.querySelectorAll("[data-count]").forEach(el => {
  const target = parseFloat(el.dataset.count);
  const decimals = String(target).includes(".") ? 1 : 0;

  if (reduceMotion) {
    el.textContent = target.toFixed(decimals);
    return;
  }

  const obj = { value: 0 };
  el.textContent = "0";

  gsap.to(obj, {
    value: target,
    duration: 1.5,
    ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 78%", once: true },
    onUpdate: () => el.textContent = obj.value.toFixed(decimals),
    onComplete: () => el.textContent = target.toFixed(decimals)
  });
});

/* ---------- Hero particle field: intentionally lightweight and no hover repulse ---------- */
if (!reduceMotion && window.tsParticles) {
  tsParticles.load({
    id: "particles",
    options: {
      fullScreen: { enable: false },
      fpsLimit: isMobile ? 24 : 30,
      particles: {
        number: {
          value: isMobile ? 10 : 24,
          density: { enable: true, area: 1500 }
        },
        color: { value: "#ffffff" },
        opacity: { value: isMobile ? .07 : .11 },
        size: { value: { min: .35, max: 1.1 } },
        links: {
          enable: !isMobile,
          distance: 145,
          color: "#8ee8e1",
          opacity: .035,
          width: .4
        },
        move: {
          enable: true,
          speed: .12,
          outModes: { default: "bounce" }
        }
      },
      interactivity: {
        detectsOn: "window",
        events: {
          onHover: { enable: false },
          resize: true
        }
      },
      detectRetina: false
    }
  });
}

/* ---------- Signal bridge: compact, purposeful transition ---------- */
const signalBridge = document.querySelector(".signal-bridge");
const signalOrb = document.querySelector(".signal-orb");
const signalLines = document.querySelectorAll(".signal-lines span");

if (!reduceMotion && signalBridge) {
  gsap.fromTo(signalOrb, { scale: .82, opacity: .12 }, {
    scale: 1.12, opacity: .65, ease: "none",
    scrollTrigger: { trigger: signalBridge, start: "top bottom", end: "bottom top", scrub: 1 }
  });

  signalLines.forEach((line, index) => {
    gsap.fromTo(line, { scale: .8, opacity: 0 }, {
      scale: 1, opacity: Math.max(.12, .48 - index * .07), ease: "none",
      scrollTrigger: { trigger: signalBridge, start: "top 90%", end: "center center", scrub: .8 }
    });
  });
}

/* ---------- Final CTA ---------- */
const finalCta = document.querySelector(".final-cta");
if (finalCta) {
  const reveals = finalCta.querySelectorAll(".reveal");
  if (!reduceMotion && reveals.length) {
    gsap.fromTo(reveals, { y: 28, opacity: 0 }, {
      y: 0, opacity: 1, duration: .8, stagger: .08, ease: "power3.out",
      scrollTrigger: { trigger: finalCta, start: "top 76%", once: true }
    });
  }
}

/* ---------- Mobile menu ---------- */
function openMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.add("open");
  mobileMenu.setAttribute("aria-hidden", "false");
  document.body.classList.add("menu-open");
}
function closeMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.remove("open");
  mobileMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
}
menuButton?.addEventListener("click", openMenu);
menuClose?.addEventListener("click", closeMenu);
menuLinks.forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMenu();
});

/* ---------- Magnetic buttons ---------- */
if (!isMobile && !reduceMotion) {
  document.querySelectorAll(".magnetic,.nav-cta").forEach(el => {
    el.addEventListener("pointermove", event => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      gsap.to(el, { x: x * .12, y: y * .12, duration: .35, ease: "power3.out", overwrite: true });
    });
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: .45, ease: "elastic.out(1,.55)", overwrite: true });
    });
  });
}

/* ---------- Anchor scrolling ---------- */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", event => {
    const id = link.getAttribute("href");
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -18, duration: 1.05 });
    else target.scrollIntoView({ behavior: "smooth" });
  });
});
