/* TIDEFRAME — mobile runtime optimization */
(function(){
  const mobile = window.matchMedia('(max-width:800px)').matches;
  if (!mobile) return;

  const videos = [...document.querySelectorAll('.bg-video')];
  const hero = document.querySelector('#hero .bg-video');

  /* Remove desktop pinning on phones. Native document flow is smoother and
     avoids jumpy address-bar/viewport-height behaviour on iOS and Android. */
  if (window.ScrollTrigger) {
    window.ScrollTrigger.getAll().forEach(st => {
      if (st.vars && st.vars.pin) st.kill(false);
    });
    window.ScrollTrigger.refresh();
  }

  /* Mobile browsers are happier when only the hero is aggressively buffered. */
  videos.forEach((video, index) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted','');
    video.setAttribute('playsinline','');
    video.preload = index === 0 ? 'auto' : 'metadata';
    video.style.pointerEvents = 'none';
  });

  const wakeVideo = () => {
    const active = document.querySelector('.cinematic:has(.bg-video[data-mobile-active]) .bg-video') || hero;
    if (!active) return;
    active.muted = true;
    const p = active.play();
    if (p && p.catch) p.catch(()=>{});
  };

  ['pageshow','visibilitychange'].forEach(evt => {
    window.addEventListener(evt, () => {
      if (evt === 'pageshow' || !document.hidden) wakeVideo();
    }, {passive:true});
  });

  /* A first touch is a valid user gesture and gives mobile Safari/Chrome a
     reliable opportunity to resume the cinematic sequence. */
  window.addEventListener('touchstart', wakeVideo, {once:true, passive:true});

  /* Mark the video belonging to the most visible section so wakeVideo can
     resume the right scene after backgrounding or tab switching. */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('.bg-video');
        if (!video) return;
        if (entry.isIntersecting && entry.intersectionRatio >= .42) {
          videos.forEach(v => v.removeAttribute('data-mobile-active'));
          video.setAttribute('data-mobile-active','true');
          video.muted = true;
          const p = video.play();
          if (p && p.catch) p.catch(()=>{});
        }
      });
    }, {threshold:[.42,.65]});
    document.querySelectorAll('.cinematic').forEach(section => io.observe(section));
  }
})();
