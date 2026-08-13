gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lenis = reduceMotion ? null : new Lenis({ duration: 1.15, smoothWheel: true, smoothTouch: false });

if (lenis) {
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

const navWrap = document.querySelector(".nav-wrap");
ScrollTrigger.create({
  start: 80,
  end: 99999,
  onUpdate: self => navWrap.classList.toggle("scrolled", self.scroll() > 80)
});

function loadVideo(section) {
  const video = section.querySelector(".bg-video");
  if (!video || reduceMotion || video.dataset.loaded) return;
  video.src = section.dataset.video;
  video.dataset.loaded = "true";
  video.load();
  video.play().catch(()=>{});
}

const sections = [...document.querySelectorAll(".cinematic")];

sections.forEach((section, i) => {
  ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    onEnter: () => loadVideo(section),
    onEnterBack: () => loadVideo(section)
  });

  if (!reduceMotion && section.classList.contains("pinned-section")) {
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=18%",
      pin: true,
      pinSpacing: false
    });
  }

  const reveals = section.querySelectorAll(".eyebrow, h2, .copy-block > p:last-child, .actions, .section-index, .stats .stat");
  gsap.fromTo(reveals,
    {y: 55, opacity: 0},
    {y: 0, opacity: 1, duration: .95, stagger: .08, ease: "power3.out",
      scrollTrigger: {trigger: section, start:"top 62%", once:true}
    }
  );

  if (!reduceMotion) {
    gsap.to(section.querySelector(".media"), {
      scale: 1.06,
      ease: "none",
      scrollTrigger: {trigger: section, start:"top bottom", end:"bottom top", scrub:true}
    });
  }
});

document.querySelectorAll("[data-count]").forEach(el => {
  const target = parseFloat(el.dataset.count);
  const decimals = String(target).includes(".") ? 1 : 0;
  const obj = {value:0};
  gsap.to(obj, {
    value: target, duration:1.8, ease:"power2.out",
    scrollTrigger:{trigger:el,start:"top 75%",once:true},
    onUpdate:()=> el.textContent = obj.value.toFixed(decimals)
  });
});

const hero = document.querySelector(".hero");
if (!reduceMotion && window.tsParticles) {
  tsParticles.load({
    id: "particles",
    options: {
      fullScreen:{enable:false},
      fpsLimit:60,
      particles:{
        number:{value:42,density:{enable:true,area:1100}},
        color:{value:"#ffffff"},
        opacity:{value:.18},
        size:{value:{min:.5,max:1.6}},
        links:{enable:true,distance:125,color:"#ffffff",opacity:.07,width:.5},
        move:{enable:true,speed:.35,outModes:{default:"bounce"}}
      },
      interactivity:{
        detectsOn:"window",
        events:{onHover:{enable:true,mode:"repulse"},resize:true},
        modes:{repulse:{distance:120,duration:.5}}
      },
      detectRetina:true
    }
  });
}

const menuBtn = document.querySelector(".menu-btn");
menuBtn?.addEventListener("click",()=>document.body.classList.toggle("menu-open"));

window.addEventListener("load", () => {
  document.querySelectorAll(".hero .bg-video").forEach(v => { if (!reduceMotion) { v.src = "assets/video-01.mp4"; v.load(); v.play().catch(()=>{}); }});
  setTimeout(()=>document.getElementById("preloader")?.classList.add("hide"), 500);
});
