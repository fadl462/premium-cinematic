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
  if (!video || reduceMotion || video.dataset.loaded) return;

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
  if (video && !video.paused) video.pause();
}

/* Hero starts immediately; later videos load just before entering view. */
if (!reduceMotion) loadVideo(document.querySelector("#hero"), true);

sections.forEach(section => {
  const video = getVideo(section);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadVideo(section, true);
        if (video) video.play().catch(()=>{});
      } else if (entry.intersectionRatio === 0) {
        pauseVideo(section);
      }
    });
  }, {
    rootMargin: "300px 0px 300px 0px",
    threshold: [0,.05,.25]
  });

  observer.observe(section);

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

  gsap.fromTo(reveals,
    {y:44, opacity:0},
    {
      y:0,
      opacity:1,
      duration:.9,
      stagger:.07,
      ease:"power3.out",
      scrollTrigger:{trigger:section,start:"top 64%",once:true}
    }
  );

  if (!reduceMotion) {
    gsap.to(section.querySelector(".media"), {
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
});

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
    scrollTrigger:{trigger:el,start:"top 78%",once:true},
    onUpdate:()=>el.textContent=obj.value.toFixed(decimals)
  });
});

if (!reduceMotion && window.tsParticles) {
  tsParticles.load({
    id:"particles",
    options:{
      fullScreen:{enable:false},
      fpsLimit:45,
      particles:{
        number:{value:isMobile?24:42,density:{enable:true,area:1100}},
        color:{value:"#ffffff"},
        opacity:{value:isMobile?.12:.18},
        size:{value:{min:.5,max:1.5}},
        links:{enable:!isMobile,distance:125,color:"#ffffff",opacity:.07,width:.5},
        move:{enable:true,speed:.28,outModes:{default:"bounce"}}
      },
      interactivity:{
        detectsOn:"window",
        events:{onHover:{enable:!isMobile,mode:"repulse"},resize:true},
        modes:{repulse:{distance:120,duration:.45}}
      },
      detectRetina:true
    }
  });
}

document.querySelector(".menu-btn")?.addEventListener("click", () => {
  document.body.classList.toggle("menu-open");
});

window.addEventListener("load", () => {
  document.getElementById("preloader")?.classList.add("hide");
  ScrollTrigger.refresh();
});

window.addEventListener("resize", () => ScrollTrigger.refresh());
