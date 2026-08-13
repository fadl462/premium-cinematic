gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 800px)").matches;

const lenis = reduceMotion ? null : new Lenis({
  duration: 1.05,
  smoothWheel: true,
  smoothTouch: false,
  wheelMultiplier: 0.9
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

ScrollTrigger.create({
  start: 80,
  end: 999999,
  onUpdate: self => navWrap?.classList.toggle("scrolled", self.scroll() > 80)
});

function getVideo(section) {
  return section?.querySelector(".bg-video");
}

function loadVideo(section, play = true) {
  const video = getVideo(section);
  if (!video || reduceMotion || video.dataset.loaded) {
    if (video && play && !reduceMotion) video.play().catch(() => {});
    return;
  }

  video.src = section.dataset.video;
  video.dataset.loaded = "true";
  video.load();

  if (play) {
    const start = () => video.play().catch(() => {});
    if (video.readyState >= 2) start();
    else video.addEventListener("canplay", start, {once:true});
  }
}

function pauseVideo(section) {
  const video = getVideo(section);
  if (video && !video.paused) {
    video.pause();
  }
}

function activateVideo(section) {
  if (reduceMotion) return;

  sections.forEach(other => {
    if (other !== section) pauseVideo(other);
  });

  loadVideo(section, true);
}

function getPoster(section) {
  return section?.dataset.poster || "";
}

/* Hero starts immediately; later videos load shortly before entering view. */
if (!reduceMotion) {
  const hero = document.querySelector("#hero");
  loadVideo(hero, true);
}

/*
  Only the section closest to the viewport center is allowed to play.
  This prevents multiple MP4s from decoding simultaneously during fast scrolls.
*/
const mediaObserver = new IntersectionObserver(entries => {
  const candidates = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

  if (candidates.length) {
    const strongest = candidates[0];
    if (strongest.intersectionRatio > 0.08) {
      activateVideo(strongest.target);
    }
  }

  entries.forEach(entry => {
    if (!entry.isIntersecting && entry.intersectionRatio === 0) {
      pauseVideo(entry.target);
    }
  });
}, {
  rootMargin: "220px 0px 220px 0px",
  threshold: [0, .08, .2, .5, .8]
});

sections.forEach(section => {
  mediaObserver.observe(section);

  if (!reduceMotion && section.classList.contains("pinned-section")) {
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=18%",
      pin: true,
      pinSpacing: false,
      anticipatePin: 1
    });
  }

  const reveals = section.querySelectorAll(
    ".eyebrow, h2, .copy-block > p:last-child, .actions, .section-index, .stats .stat"
  );

  gsap.fromTo(
    reveals,
    {y:44, opacity:0},
    {
      y:0,
      opacity:1,
      duration:.9,
      stagger:.07,
      ease:"power3.out",
      scrollTrigger:{
        trigger:section,
        start:"top 64%",
        once:true
      }
    }
  );

  if (!reduceMotion) {
    const media = section.querySelector(".media");
    if (media) {
      gsap.to(media, {
        scale:isMobile ? 1.025 : 1.055,
        ease:"none",
        scrollTrigger:{
          trigger:section,
          start:"top bottom",
          end:"bottom top",
          scrub:.6
        }
      });
    }
  }
});

/* Stats: meaningful HTML values remain visible even if animation is unavailable. */
document.querySelectorAll("[data-count]").forEach(el => {
  const target = parseFloat(el.dataset.count);
  const decimals = String(target).includes(".") ? 1 : 0;

  if (reduceMotion) {
    el.textContent = target.toFixed(decimals);
    return;
  }

  const obj = {value:0};
  el.textContent = "0";

  gsap.to(obj, {
    value:target,
    duration:1.5,
    ease:"power2.out",
    scrollTrigger:{
      trigger:el,
      start:"top 78%",
      once:true
    },
    onUpdate:() => {
      el.textContent = obj.value.toFixed(decimals);
    },
    onComplete:() => {
      el.textContent = target.toFixed(decimals);
    }
  });
});

/* Lightweight interactive particles; deliberately reduced on phones. */
if (!reduceMotion && window.tsParticles) {
  tsParticles.load({
    id:"particles",
    options:{
      fullScreen:{enable:false},
      fpsLimit:45,
      particles:{
        number:{
          value:isMobile ? 20 : 42,
          density:{enable:true,area:1100}
        },
        color:{value:"#ffffff"},
        opacity:{value:isMobile ? .11 : .18},
        size:{value:{min:.5,max:1.5}},
        links:{
          enable:!isMobile,
          distance:125,
          color:"#ffffff",
          opacity:.07,
          width:.5
        },
        move:{
          enable:true,
          speed:.28,
          outModes:{default:"bounce"}
        }
      },
      interactivity:{
        detectsOn:"window",
        events:{
          onHover:{enable:!isMobile,mode:"repulse"},
          resize:true
        },
        modes:{
          repulse:{distance:120,duration:.45}
        }
      },
      detectRetina:true
    }
  });
}

/* Mobile navigation drawer. */
function openMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.add("open");
  mobileMenu.setAttribute("aria-hidden","false");
  document.body.classList.add("menu-open");
}

function closeMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.remove("open");
  mobileMenu.setAttribute("aria-hidden","true");
  document.body.classList.remove("menu-open");
}

menuButton?.addEventListener("click", openMenu);
menuClose?.addEventListener("click", closeMenu);
menuLinks.forEach(link => link.addEventListener("click", closeMenu));

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMenu();
});

window.addEventListener("load", () => {
  document.getElementById("preloader")?.classList.add("hide");
  ScrollTrigger.refresh();
});

window.addEventListener("resize", () => ScrollTrigger.refresh());

/* Keep anchor navigation compatible with Lenis. */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", event => {
    const id = link.getAttribute("href");
    if (!id || id === "#") return;

    const target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    closeMenu();

    if (lenis) {
      lenis.scrollTo(target, {offset:-12, duration:1.1});
    } else {
      target.scrollIntoView({behavior:reduceMotion ? "auto" : "smooth"});
    }

    history.replaceState(null, "", id);
  });
});
