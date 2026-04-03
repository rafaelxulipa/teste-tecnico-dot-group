/**
 * dot — main.js
 * Vanilla JS: Slider, Interactive Cards, Audio Player,
 * Discursive Activity, Objective Activity, FAQ accordion
 * sessionStorage persistence for activities
 */

'use strict';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ─────────────────────────────────────────────
   3. SLIDER
   - Setas sobrepostas na imagem
   - Apenas dots abaixo
   - Touch/swipe funcional
───────────────────────────────────────────── */
(function initSlider() {
  const track    = $('#sliderTrack');
  const prevBtn  = $('#sliderPrev');
  const nextBtn  = $('#sliderNext');
  const dotsWrap = $('#sliderDots');

  if (!track) return;

  const slides = $$('.slider__slide', track);
  const total  = slides.length;
  let current  = 0;

  /* Criar dots */
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider__dot' + (i === 0 ? ' slider__dot--active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Ir para slide ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.dataset.index = i;
    dotsWrap.appendChild(dot);
  });

  const getDots = () => $$('.slider__dot', dotsWrap);

  function goTo(index) {
    current = ((index % total) + total) % total; /* loop infinito */
    track.style.transform = `translateX(-${current * 100}%)`;

    getDots().forEach((d, i) => {
      const active = i === current;
      d.classList.toggle('slider__dot--active', active);
      d.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    track.setAttribute('aria-label', `Slide ${current + 1} de ${total}`);

    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;
  }

  /* Autoplay: avança a cada 4s, pausa ao hover/foco */
  const INTERVAL = 4000;
  let autoplay = setInterval(() => goTo(current + 1), INTERVAL);

  const sliderRoot = track.closest('.slider');
  if (sliderRoot) {
    sliderRoot.addEventListener('mouseenter', () => clearInterval(autoplay));
    sliderRoot.addEventListener('mouseleave', () => {
      autoplay = setInterval(() => goTo(current + 1), INTERVAL);
    });
    sliderRoot.addEventListener('focusin',  () => clearInterval(autoplay));
    sliderRoot.addEventListener('focusout', () => {
      autoplay = setInterval(() => goTo(current + 1), INTERVAL);
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { clearInterval(autoplay); goTo(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', () => { clearInterval(autoplay); goTo(current + 1); });

  dotsWrap.addEventListener('click', (e) => {
    const dot = e.target.closest('.slider__dot');
    if (dot) { clearInterval(autoplay); goTo(Number(dot.dataset.index)); }
  });

  dotsWrap.addEventListener('keydown', (e) => {
    const dot = e.target.closest('.slider__dot');
    if (!dot) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'Home')       { e.preventDefault(); goTo(0); }
    if (e.key === 'End')        { e.preventDefault(); goTo(total - 1); }
  });

  /* Touch swipe */
  let touchStartX = 0;
  let touchStartY = 0;
  const wrap = track.closest('.slider__track-wrap');
  if (wrap) {
    wrap.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    wrap.addEventListener('touchend', (e) => {
      const dx = touchStartX - e.changedTouches[0].clientX;
      const dy = Math.abs(touchStartY - e.changedTouches[0].clientY);
      if (Math.abs(dx) > 40 && dy < 60) {
        goTo(current + (dx > 0 ? 1 : -1));
      }
    }, { passive: true });
  }

  goTo(0);
})();


/* ─────────────────────────────────────────────
   4. CARDS INTERATIVOS
───────────────────────────────────────────── */
(function initICards() {
  $$('.icard').forEach(card => {
    const openBtn  = $('.icard__open-btn', card);
    const closeBtn = $('.icard__close-btn', card);
    const closedEl = $('.icard__closed', card);
    const openEl   = $('.icard__open', card);

    if (!openBtn || !closeBtn) return;

    function openCard() {
      closedEl.style.display = 'none';
      openEl.hidden = false;
      card.dataset.open = 'true';
      openBtn.setAttribute('aria-expanded', 'true');
      closeBtn.focus();
    }

    function closeCard() {
      openEl.hidden = true;
      closedEl.style.display = '';
      card.dataset.open = 'false';
      openBtn.setAttribute('aria-expanded', 'false');
      openBtn.focus();
    }

    openBtn.addEventListener('click', openCard);
    closeBtn.addEventListener('click', closeCard);

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && card.dataset.open === 'true') closeCard();
    });
  });
})();


/* ─────────────────────────────────────────────
   6. PLAYER DE AUDIO
───────────────────────────────────────────── */
(function initAudio() {
  const audio         = $('#audioEl');
  const playBtn       = $('#audioPlayBtn');
  const muteBtn       = $('#audioMuteBtn');
  const progressBar   = $('#audioProgressBar');
  const progressFill  = $('#audioProgressFill');
  const thumb         = $('#audioProgressThumb');
  const volumeSlider  = $('#audioVolumeSlider');
  const currentTimeEl = $('#audioCurrentTime');
  const durationEl    = null; /* removido do layout */

  if (!audio || !playBtn) return;

  const iconPlay   = playBtn.querySelector('.icon-play');
  const iconPause  = playBtn.querySelector('.icon-pause');
  const iconVolOn  = muteBtn ? muteBtn.querySelector('.icon-vol-on')  : null;
  const iconVolOff = muteBtn ? muteBtn.querySelector('.icon-vol-off') : null;

  function setPlayState(playing) {
    if (playing) {
      if (iconPlay)  iconPlay.style.display  = 'none';
      if (iconPause) iconPause.style.display = '';
      playBtn.setAttribute('aria-label', 'Pausar');
    } else {
      if (iconPlay)  iconPlay.style.display  = '';
      if (iconPause) iconPause.style.display = 'none';
      playBtn.setAttribute('aria-label', 'Reproduzir');
    }
  }

  function setMuteState(muted) {
    if (!iconVolOn || !iconVolOff) return;
    if (muted) {
      iconVolOn.style.display  = 'none';
      iconVolOff.style.display = '';
      muteBtn.setAttribute('aria-label', 'Ativar som');
    } else {
      iconVolOn.style.display  = '';
      iconVolOff.style.display = 'none';
      muteBtn.setAttribute('aria-label', 'Silenciar');
    }
  }

  function updateProgress() {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progressFill) progressFill.style.width = pct + '%';
    if (thumb)        thumb.style.left         = pct + '%';
    if (progressBar)  progressBar.setAttribute('aria-valuenow', Math.round(pct));
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
  }

  audio.addEventListener('loadedmetadata', () => {
    if (durationEl) durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('ended', () => setPlayState(false));

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {});
      setPlayState(true);
    } else {
      audio.pause();
      setPlayState(false);
    }
  });

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      setMuteState(audio.muted);
      if (volumeSlider) volumeSlider.value = audio.muted ? 0 : audio.volume;
    });
  }

  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const pct  = (e.clientX - rect.left) / rect.width;
      if (audio.duration) audio.currentTime = pct * audio.duration;
    });

    progressBar.addEventListener('keydown', (e) => {
      if (!audio.duration) return;
      const step = 5;
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.currentTime + step, audio.duration); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { audio.currentTime = Math.max(audio.currentTime - step, 0); e.preventDefault(); }
      if (e.key === 'Home')       { audio.currentTime = 0; e.preventDefault(); }
      if (e.key === 'End')        { audio.currentTime = audio.duration; e.preventDefault(); }
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      audio.volume = parseFloat(volumeSlider.value);
      audio.muted  = audio.volume === 0;
      setMuteState(audio.muted);
    });
  }
})();


/* ─────────────────────────────────────────────
   7. ATIVIDADE DISCURSIVA
   sessionStorage: discursiva_content, discursiva_answered
───────────────────────────────────────────── */
(function initDiscursiva() {
  const textarea = $('#discursivaTextarea');
  const respBtn  = $('#discursivaResponder');
  const alterBtn = $('#discursivaAlterar');
  const feedback = $('#discursivaFeedback');

  if (!textarea) return;

  const SS_CONTENT  = 'discursiva_content';
  const SS_ANSWERED = 'discursiva_answered';

  function setBtn(btn, enabled) {
    btn.disabled = !enabled;
    btn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  }

  function showFeedback(title, desc, type) {
    feedback.querySelector('.activity-feedback__title').textContent = title;
    feedback.querySelector('.activity-feedback__desc').textContent  = desc;
    feedback.className = `activity-feedback visible activity-feedback--${type}`;
  }

  function hideFeedback() {
    feedback.className = 'activity-feedback';
  }

  function applyAnsweredState() {
    textarea.disabled = true;
    setBtn(respBtn, false);
    setBtn(alterBtn, true);
    showFeedback('É isso aí!', 'Sua resposta foi enviada com sucesso.', 'success');
  }

  function applyEditState() {
    textarea.disabled = false;
    setBtn(respBtn, textarea.value.trim().length > 0);
    setBtn(alterBtn, false);
    hideFeedback();
  }

  /* Restaurar do sessionStorage */
  const savedContent  = sessionStorage.getItem(SS_CONTENT);
  const savedAnswered = sessionStorage.getItem(SS_ANSWERED);

  if (savedContent !== null) textarea.value = savedContent;

  if (savedAnswered === 'true') {
    applyAnsweredState();
  } else {
    applyEditState();
  }

  textarea.addEventListener('input', () => {
    sessionStorage.setItem(SS_CONTENT, textarea.value);
    if (sessionStorage.getItem(SS_ANSWERED) !== 'true') {
      setBtn(respBtn, textarea.value.trim().length > 0);
    }
  });

  respBtn.addEventListener('click', () => {
    if (!textarea.value.trim()) return;
    sessionStorage.setItem(SS_ANSWERED, 'true');
    sessionStorage.setItem(SS_CONTENT, textarea.value);
    applyAnsweredState();
  });

  alterBtn.addEventListener('click', () => {
    sessionStorage.setItem(SS_ANSWERED, 'false');
    applyEditState();
    textarea.focus();
  });

  const closeBtn = $('#discursivaFeedbackClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideFeedback();
    });
  }
})();


/* ─────────────────────────────────────────────
   8. ATIVIDADE OBJETIVA
   - Checkboxes com selecao unica (radio behavior)
   - Opcao selecionada: fundo preto, texto branco
   - Feedback: caixa amarela
   sessionStorage: objetiva_selected, objetiva_answered
───────────────────────────────────────────── */
(function initObjetiva() {
  const options    = $$('.option-item');
  const checkboxes = $$('.option-checkbox');
  const respBtn    = $('#objetivaResponder');
  const alterBtn   = $('#objetivaAlterar');
  const feedback   = $('#objetivaFeedback');

  if (!options.length) return;

  const SS_SELECTED = 'objetiva_selected';
  const SS_ANSWERED = 'objetiva_answered';

  function setBtn(btn, enabled) {
    btn.disabled = !enabled;
    btn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  }

  function showFeedback(title, desc, type) {
    feedback.querySelector('.activity-feedback__title').textContent = title;
    feedback.querySelector('.activity-feedback__desc').textContent  = desc;
    feedback.className = `activity-feedback visible activity-feedback--${type}`;
  }

  function hideFeedback() {
    feedback.className = 'activity-feedback';
  }

  function getSelectedValue() {
    const ch = checkboxes.find(c => c.checked);
    return ch ? ch.value : null;
  }

  function selectOption(value) {
    /* Desmarcar todos */
    checkboxes.forEach(c => { c.checked = false; });
    options.forEach(opt => opt.classList.remove('selected'));

    if (value) {
      const target = checkboxes.find(c => c.value === value);
      if (target) {
        target.checked = true;
        target.closest('.option-item').classList.add('selected');
      }
    }
  }

  function lockOptions(locked) {
    options.forEach(opt => opt.classList.toggle('locked', locked));
    checkboxes.forEach(c => { c.disabled = locked; });
  }

  const CORRECT_ANSWER = 'b';

  function applyAnsweredState(selected) {
    selectOption(selected);
    lockOptions(true);
    setBtn(respBtn, false);
    setBtn(alterBtn, true);
    if (selected === CORRECT_ANSWER) {
      showFeedback('Excelente! Resposta correta!', 'Closure é exatamente isso: uma função que "lembra" o escopo onde foi criada. Ótimo trabalho!', 'success');
    } else {
      showFeedback('Tente novamente!', 'Revise o conceito de escopo léxico e tente uma nova alternativa.', 'warning');
    }
  }

  function applyEditState() {
    lockOptions(false);
    const sel = getSelectedValue();
    setBtn(respBtn, !!sel);
    setBtn(alterBtn, false);
    hideFeedback();
  }

  /* Restaurar do sessionStorage */
  const savedSelected = sessionStorage.getItem(SS_SELECTED);
  const savedAnswered = sessionStorage.getItem(SS_ANSWERED);

  if (savedSelected) selectOption(savedSelected);

  if (savedAnswered === 'true' && savedSelected) {
    applyAnsweredState(savedSelected); /* já diferencia correto/errado internamente */
  } else {
    applyEditState();
  }

  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const opt = cb.closest('.option-item');
      if (opt && opt.classList.contains('locked')) { cb.checked = !cb.checked; return; }
      selectOption(cb.value);
      sessionStorage.setItem(SS_SELECTED, cb.value);
      setBtn(respBtn, true);
    });
  });

  options.forEach(opt => {
    opt.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && !opt.classList.contains('locked')) {
        e.preventDefault();
        const cb = opt.querySelector('.option-checkbox');
        if (!cb) return;
        selectOption(cb.value);
        sessionStorage.setItem(SS_SELECTED, cb.value);
        setBtn(respBtn, true);
      }
    });
  });

  respBtn.addEventListener('click', () => {
    const sel = getSelectedValue();
    if (!sel) return;
    sessionStorage.setItem(SS_ANSWERED, 'true');
    sessionStorage.setItem(SS_SELECTED, sel);
    applyAnsweredState(sel);
  });

  alterBtn.addEventListener('click', () => {
    sessionStorage.setItem(SS_ANSWERED, 'false');
    selectOption(null);
    sessionStorage.removeItem(SS_SELECTED);
    applyEditState();
  });

  const closeBtn = $('#objetivaFeedbackClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideFeedback();
    });
  }
})();


/* ─────────────────────────────────────────────
   9. FAQ — <details> nativo com accordion
   Item aberto: fundo verde, texto branco, icone −
   Item fechado: fundo branco, icone +
───────────────────────────────────────────── */
(function initFAQ() {
  const items = $$('.faq-item');

  items.forEach(item => {
    item.addEventListener('toggle', () => {
      /* Fechar outros ao abrir este */
      if (item.open) {
        items.forEach(other => {
          if (other !== item && other.open) {
            other.open = false;
          }
        });
      }
    });
  });
})();
