(function () {
  function setupCover() {
    const hero = document.querySelector(".hero-section");
    const cover = hero?.querySelector(".hero-cover");
    const video = cover?.querySelector("video");
    const canvas = cover?.querySelector("canvas");
    const control = hero?.querySelector(".cover-playback");
    if (!video || !canvas || !control) return;

    const context = canvas.getContext("2d");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compact = window.matchMedia("(max-width: 980px)");
    let pausedByUser = Boolean(navigator.connection?.saveData);
    let initialScrollPending = Boolean(window.location?.hash && window.location.hash !== "#profile");
    let initialScrollTimer = 0;
    let visible = false;
    let videoFailed = false;
    let playPending = false;
    let playRequest = 0;
    let autoplayBlocked = false;
    let frame = 0;
    let lastDraw = 0;
    let clock = 0;
    let width = 0;
    let height = 0;
    let points = [];
    let ripples = [];
    let lastRipple = -1;
    let lastRippleX = 0;
    let lastRippleY = 0;
    const pointer = { active: false, x: 0, y: 0 };

    function draw(delta = 0) {
      if (!context) return;
      clock += delta;
      ripples = ripples.filter((ripple) => (ripple.age += delta) < 1.8);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#fff";
      context.beginPath();
      const drift = motion.matches ? 0 : 4;
      for (const point of points) {
        let targetX = 0;
        let targetY = 0;
        if (pointer.active) {
          const dx = point.x - pointer.x;
          const dy = point.y - pointer.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          if (distance < 160) {
            const push = (1 - distance / 160) ** 2 * 72;
            targetX += dx / distance * push;
            targetY += dy / distance * push;
          }
        }
        for (const ripple of ripples) {
          const dx = point.x - ripple.x;
          const dy = point.y - ripple.y;
          const distance = Math.max(1, Math.hypot(dx, dy));
          const edge = distance - ripple.age * 200;
          const wave = Math.exp(-(edge ** 2) / 1600) * Math.exp(-ripple.age * 2) * 24;
          targetX += dx / distance * wave;
          targetY += dy / distance * wave;
        }
        // Damped springs let displaced dots settle back into their original grid.
        const step = delta * 30;
        const damping = 0.76 ** step;
        point.vx = (point.vx + (targetX - point.offsetX) * 0.12 * step) * damping;
        point.vy = (point.vy + (targetY - point.offsetY) * 0.12 * step) * damping;
        point.offsetX += point.vx * step;
        point.offsetY += point.vy * step;
        const x = point.x + point.offsetX + Math.sin(clock * 0.34 + point.phase) * drift;
        const y = point.y + point.offsetY + Math.cos(clock * 0.26 + point.phase * 0.7) * drift;
        context.moveTo(x + point.radius, y);
        context.arc(x, y, point.radius, 0, Math.PI * 2);
      }
      context.fill();
    }

    function resize() {
      const bounds = cover.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, compact.matches ? 1.25 : 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
      const spacing = compact.matches ? 36 : 30;
      points = [];
      for (let row = 0; row * spacing < height + spacing; row++) {
        for (let column = 0; column * spacing < width + spacing; column++) {
          points.push({
            x: column * spacing + spacing / 2,
            y: row * spacing + spacing / 2,
            phase: row * 0.41 + column * 0.27,
            radius: compact.matches ? 1.5 : 1.7,
            offsetX: 0, offsetY: 0, vx: 0, vy: 0
          });
        }
      }
      draw();
    }

    function animate(time) {
      if (time - lastDraw >= 1000 / 30) {
        draw(lastDraw ? Math.min((time - lastDraw) / 1000, 0.05) : 1 / 30);
        lastDraw = time;
      }
      frame = window.requestAnimationFrame(animate);
    }

    function updateControl() {
      control.hidden = motion.matches;
      const needsPlay = pausedByUser || autoplayBlocked;
      control.setAttribute("aria-label", needsPlay ? "Play cover animation" : "Pause cover animation");
      control.querySelector(".cover-pause-icon").toggleAttribute("hidden", needsPlay);
      control.querySelector(".cover-play-icon").toggleAttribute("hidden", !needsPlay);
    }

    function canAnimate() {
      return visible && !initialScrollPending && !document.hidden && !motion.matches && !pausedByUser;
    }

    function sync({ gesture = false } = {}) {
      if (gesture) autoplayBlocked = false;
      const playing = canAnimate();
      hero.classList.toggle("is-cover-animating", playing);
      video.autoplay = playing && !autoplayBlocked;
      if (!playing) {
        playRequest++;
        playPending = false;
        video.pause();
        window.cancelAnimationFrame(frame);
        frame = 0;
        lastDraw = 0;
        pointer.active = false;
        ripples = [];
        if (motion.matches) draw();
      } else {
        if (context && !frame) frame = window.requestAnimationFrame(animate);
        if (!videoFailed && !autoplayBlocked && video.paused && !playPending) {
          video.defaultMuted = true;
          video.muted = true;
          video.playsInline = true;
          // Do not download a background video when opening a deep link below the cover.
          if (!video.getAttribute("src")) {
            video.src = compact.matches ? video.dataset.mobileSrc : video.dataset.desktopSrc;
          }
          playPending = true;
          const request = ++playRequest;
          Promise.resolve(video.play()).catch((error) => {
            if (request === playRequest && error.name === "NotAllowedError") {
              autoplayBlocked = true;
              video.autoplay = false;
              updateControl();
            }
          }).finally(() => {
            if (request === playRequest) playPending = false;
          });
        }
      }
      updateControl();
    }

    video.addEventListener("playing", () => {
      cover.classList.add("is-video-ready");
      autoplayBlocked = false;
      if (!canAnimate()) video.pause();
      updateControl();
    });
    video.addEventListener("canplay", () => sync());
    video.addEventListener("error", () => {
      videoFailed = true;
      cover.classList.remove("is-video-ready");
    });
    control.addEventListener("click", () => {
      pausedByUser = autoplayBlocked ? false : !pausedByUser;
      finishInitialScroll();
      sync({ gesture: true });
    });
    hero.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch" || !canAnimate()) return;
      const bounds = cover.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      if (!pointer.active || (clock - lastRipple > 0.07 && Math.hypot(x - lastRippleX, y - lastRippleY) > 14)) {
        ripples.push({ x, y, age: 0 });
        if (ripples.length > 8) ripples.shift();
        lastRipple = clock;
        lastRippleX = x;
        lastRippleY = y;
      }
      pointer.active = true;
      pointer.x = x;
      pointer.y = y;
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { pointer.active = false; });
    document.addEventListener("visibilitychange", () => sync());
    motion.addEventListener("change", () => sync());
    compact.addEventListener("change", resize);
    window.addEventListener("pagehide", () => {
      playRequest++;
      playPending = false;
      video.pause();
      window.cancelAnimationFrame(frame);
      frame = 0;
      hero.classList.remove("is-cover-animating");
    });
    window.addEventListener("pageshow", () => sync());

    function measureVisibility() {
      const bounds = cover.getBoundingClientRect();
      const visibleHeight = Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0);
      visible = bounds.height > 0 && visibleHeight / bounds.height > 0.05;
    }

    function finishInitialScroll() {
      initialScrollPending = false;
      window.clearTimeout(initialScrollTimer);
      measureVisibility();
      sync();
    }

    // Let fragment navigation settle, without ever waiting for a cover exit to start playback.
    if (initialScrollPending) {
      initialScrollTimer = window.setTimeout(finishInitialScroll, 700);
    }
    new ResizeObserver(resize).observe(cover);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio > 0.05;
      if (!visible) {
        initialScrollPending = false;
        window.clearTimeout(initialScrollTimer);
      }
      sync();
    }, { threshold: [0, 0.05] }).observe(hero);
    resize();
    measureVisibility();
    sync();
  }

  document.addEventListener("DOMContentLoaded", setupCover);
})();
