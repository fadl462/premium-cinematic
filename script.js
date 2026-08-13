gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 800px)").matches;

const lenis = reduceMotion ? null : new Lenis({
  duration: 1.12,
  smoothWheel: true,
  smoothTouch: false,
  wheelMultiplier: 0.88,
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

/* ---------- Page entrance ---------- */
window.addEventListener("load", () => {
  requestAnimationFrame(() => pageTransition?.classList.add("hide"));
  document.getElementById("preloader")?.classList.add("hide");
  ScrollTrigger.refresh();
});

/* ---------- Scroll progress + navigation state ---------- */
if (lenis) {
  lenis.on("scroll", ({scroll, limit}) => {
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
  }, {passive:true});
}

/* ---------- Cursor ---------- */
if (!isMobile && !reduceMotion && cursorDot && cursorRing) {
  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener("pointermove", event => {
    mx = event.clientX;
    my = event.clientY;
    gsap.to(cursorDot, {x:mx, y:my, duration:.08, overwrite:true});
  }, {passive:true});

  gsap.ticker.add(() => {
    rx += (mx - rx) * .18;
    ry += (my - ry) * .18;
    gsap.set(cursorRing, {x:rx, y:ry});
  });

  document.querySelectorAll("a,button,.stat,.mobile-menu-links a").forEach(el => {
    el.addEventListener("mouseenter", () => cursorRing.classList.add("active"));
    el.addEventListener("mouseleave", () => cursorRing.classList.remove("active"));
  });
}

/* ---------- Video management ---------- */
function getVideo(section) {
  return section?.querySelector(".bg-video");
}

function loadVideo(section, play = true) {
  const video = getVideo(section);
  if (!video || reduceMotion) return;

  if (!video.dataset.loaded) {
    video.src = section.dataset.video;
    video.dataset.loaded = "true";
    video.load();
  }

  if (play) {
    const start = () => video.play().catch(() => {});
    if (video.readyState >= 2) start();
    else video.addEventListener("canplay", start, {once:true});
  }
}

function pauseVideo(section) {
  const video = getVideo(section);
  if (video && !video.paused) video.pause();
}

function activateVideo(section) {
  if (reduceMotion) return;
  sections.forEach(other => {
    if (other !== section) pauseVideo(other);
  });
  loadVideo(section, true);
}

if (!reduceMotion) loadVideo(document.querySelector("#hero"), true);

const mediaObserver = new IntersectionObserver(entries => {
  const visible = entries
    .filter(entry => entry.isIntersecting)
    .sort((a,b) => b.intersectionRatio - a.intersectionRatio);

  if (visible[0] && visible[0].intersectionRatio > .10) {
    activateVideo(visible[0].target);
  }

  entries.forEach(entry => {
    if (!entry.isIntersecting && entry.intersectionRatio === 0) {
      pauseVideo(entry.target);
    }
  });
}, {
  rootMargin:"240px 0px 240px 0px",
  threshold:[0,.1,.25,.5,.8]
});

sections.forEach(section => {
  mediaObserver.observe(section);

  const media = section.querySelector(".media");
  const light = section.querySelector(".scene-light");

  /* Cinematic camera drift */
  if (!reduceMotion && media) {
    gsap.fromTo(media,
      {scale:isMobile ? 1.02 : 1.04},
      {
        scale:isMobile ? 1.035 : 1.09,
        ease:"none",
        scrollTrigger:{
          trigger:section,
          start:"top bottom",
          end:"bottom top",
          scrub:.8
        }
      }
    );
  }

  if (!reduceMotion && light) {
    gsap.to(light,{
      x:isMobile ? -25 : 80,
      y:isMobile ? 20 : -40,
      rotation:18,
      ease:"none",
      scrollTrigger:{
        trigger:section,
        start:"top bottom",
        end:"bottom top",
        scrub:1.2
      }
    });
  }

  /* Section pinning */
  if (!reduceMotion && section.classList.contains("pinned-section")) {
    ScrollTrigger.create({
      trigger:section,
      start:"top top",
      end:"+=22%",
      pin:true,
      pinSpacing:false,
      anticipatePin:1
    });
  }

  /* Staggered reveal */
  const eyebrow = section.querySelector(".eyebrow");
  const heading = section.querySelector("h2");
  const paragraph = section.querySelector(".copy-block > p:last-child");
  const index = section.querySelector(".section-index");
  const stats = section.querySelectorAll(".stat");

  if (eyebrow) {
    gsap.fromTo(eyebrow,
      {y:24,opacity:0},
      {y:0,opacity:1,duration:.8,ease:"power3.out",
        scrollTrigger:{trigger:section,start:"top 68%",once:true}}
    );
  }

  if (heading) {
    gsap.fromTo(heading,
      {y:70,opacity:0,rotateX:8},
      {y:0,opacity:1,rotateX:0,duration:1.15,ease:"power4.out",
        scrollTrigger:{trigger:section,start:"top 64%",once:true}}
    );
  }

  if (paragraph) {
    gsap.fromTo(paragraph,
      {y:28,opacity:0},
      {y:0,opacity:1,duration:.9,delay:.12,ease:"power3.out",
        scrollTrigger:{trigger:section,start:"top 60%",once:true}}
    );
  }

  if (index) {
    gsap.fromTo(index,
      {x:-25,opacity:0},
      {x:0,opacity:1,duration:.8,ease:"power3.out",
        scrollTrigger:{trigger:section,start:"top 68%",once:true}}
    );
  }

  if (stats.length) {
    gsap.fromTo(stats,
      {y:55,opacity:0},
      {y:0,opacity:1,duration:.95,stagger:.09,ease:"power3.out",
        scrollTrigger:{trigger:section,start:"top 58%",once:true}}
    );
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

  const obj = {value:0};
  el.textContent = "0";

  gsap.to(obj,{
    value:target,
    duration:1.7,
    ease:"power3.out",
    scrollTrigger:{
      trigger:el,
      start:"top 78%",
      once:true
    },
    onUpdate:()=>el.textContent=obj.value.toFixed(decimals),
    onComplete:()=>el.textContent=target.toFixed(decimals)
  });
});

/* ---------- Particle field ---------- */
if (!reduceMotion && window.tsParticles) {
  tsParticles.load({
    id:"particles",
    options:{
      fullScreen:{enable:false},
      fpsLimit:40,
      particles:{
        number:{
          value:isMobile ? 16 : 36,
          density:{enable:true,area:1200}
        },
        color:{value:"#ffffff"},
        opacity:{value:isMobile ? .09 : .14},
        size:{value:{min:.4,max:1.4}},
        links:{
          enable:!isMobile,
          distance:135,
          color:"#ffffff",
          opacity:.055,
          width:.45
        },
        move:{
          enable:true,
          speed:.22,
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
          repulse:{distance:110,duration:.55}
        }
      },
      detectRetina:true
    }
  });
}

/* ---------- Mobile menu ---------- */
function openMenu(){
  if (!mobileMenu) return;
  mobileMenu.classList.add("open");
  mobileMenu.setAttribute("aria-hidden","false");
  document.body.classList.add("menu-open");
}
function closeMenu(){
  if (!mobileMenu) return;
  mobileMenu.classList.remove("open");
  mobileMenu.setAttribute("aria-hidden","true");
  document.body.classList.remove("menu-open");
}
menuButton?.addEventListener("click",openMenu);
menuClose?.addEventListener("click",closeMenu);
menuLinks.forEach(link=>link.addEventListener("click",closeMenu));
document.addEventListener("keydown",event=>{
  if(event.key==="Escape") closeMenu();
});

/* ---------- Magnetic buttons ---------- */
if (!isMobile && !reduceMotion) {
  document.querySelectorAll(".magnetic,.nav-cta").forEach(el=>{
    el.addEventListener("pointermove",event=>{
      const rect=el.getBoundingClientRect();
      const x=event.clientX-(rect.left+rect.width/2);
      const y=event.clientY-(rect.top+rect.height/2);
      gsap.to(el,{x:x*.16,y:y*.16,duration:.45,ease:"power3.out"});
    });
    el.addEventListener("pointerleave",()=>{
      gsap.to(el,{x:0,y:0,duration:.6,ease:"elastic.out(1,.45)"});
    });
  });
}

/* ---------- Smooth anchor navigation ---------- */
document.querySelectorAll('a[href^="#"]').forEach(link=>{
  link.addEventListener("click",event=>{
    const id=link.getAttribute("href");
    if(!id || id==="#") return;
    const target=document.querySelector(id);
    if(!target) return;

    event.preventDefault();
    closeMenu();

    if(lenis){
      lenis.scrollTo(target,{offset:-12,duration:1.2});
    }else{
      target.scrollIntoView({behavior:reduceMotion?"auto":"smooth"});
    }

    history.replaceState(null,"",id);
  });
});

window.addEventListener("resize",()=>ScrollTrigger.refresh());
