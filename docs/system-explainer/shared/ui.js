window.DemoUI = (() => {
  function createStepper(config) {
    const { steps, duration = 1800, onStep } = config;
    let index = 0;
    let timer = null;
    let playing = false;

    const progress = document.querySelector('[data-progress]');
    const pills = [...document.querySelectorAll('[data-step-pill]')];
    const play = document.querySelector('[data-play]');
    const pause = document.querySelector('[data-pause]');
    const restart = document.querySelector('[data-restart]');

    function render() {
      pills.forEach((pill, i) => pill.classList.toggle('active', i === index));
      if (progress) progress.style.width = `${((index + 1) / steps.length) * 100}%`;
      if (onStep) onStep(index, steps[index]);
    }

    function next() {
      index = (index + 1) % steps.length;
      render();
    }

    function start() {
      if (playing) return;
      playing = true;
      timer = setInterval(next, duration);
    }

    function stop() {
      playing = false;
      clearInterval(timer);
      timer = null;
    }

    function reset() {
      stop();
      index = 0;
      render();
    }

    play?.addEventListener('click', start);
    pause?.addEventListener('click', stop);
    restart?.addEventListener('click', reset);

    render();
    return { start, stop, reset, next };
  }

  function setActive(selector, activeIndex) {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.toggle('active-card', i === activeIndex);
      el.classList.toggle('pulse', i === activeIndex);
    });
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  return { createStepper, setActive, setText };
})();
