const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Nav links: split text into letters for the roll effect */
document.querySelectorAll('.roll').forEach((link) => {
  const text = link.textContent;
  link.setAttribute('aria-label', text);
  const inner = document.createElement('span');
  inner.className = 'roll-inner';
  inner.setAttribute('aria-hidden', 'true');
  [...text].forEach((char, i) => {
    const span = document.createElement('span');
    span.className = 'ch';
    span.style.setProperty('--i', i);
    span.textContent = char;
    inner.append(span);
  });
  link.replaceChildren(inner);
});

/* Intro: wrap every word so it fades in one after another */
let introWords = 0;
if (!reduceMotion) {
  let index = 0;
  document.querySelectorAll('.intro p').forEach((p) => {
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.append(' ');
          return;
        }
        const word = document.createElement('span');
        word.className = 'w';
        word.style.setProperty('--i', index++);
        word.textContent = part;
        fragment.append(word);
      });
      node.replaceWith(fragment);
    });
  });
  introWords = index;
}

/* Accordion */
const setOpen = (item, open) => {
  item.classList.toggle('is-open', open);
  item.querySelector('.exp-toggle').setAttribute('aria-expanded', open);
};

document.querySelectorAll('.exp').forEach((item) => {
  item.querySelectorAll('.bullets li').forEach((li, i) => li.style.setProperty('--i', i));
  item.querySelector('.tags')?.style.setProperty('--i', item.querySelectorAll('.bullets li').length);
  // The whole header toggles, except the company link inside it
  item.querySelector('.exp-head').addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    setOpen(item, !item.classList.contains('is-open'));
  });
});

/*
  When the visitor jumps to a section from the nav, everything queued before it
  is shown at once so the target animates right away.
*/
let rushTarget = null;

/* Typewriter for section headings; resolves once the last letter is in */
const typeHeading = (el) => new Promise((resolve) => {
  const text = el.dataset.text;
  let i = 0;
  el.classList.add('is-typing');
  const tick = () => {
    // A jump to another section finishes this heading instantly
    if (rushTarget && !rushTarget.contains(el)) i = text.length - 1;
    el.textContent = text.slice(0, ++i);
    if (i < text.length) {
      setTimeout(tick, 28 + Math.random() * 22);
    } else {
      setTimeout(() => el.classList.remove('is-typing'), 900);
      setTimeout(resolve, 80);
    }
  };
  tick();
});

if (!reduceMotion) {
  document.querySelectorAll('h2[data-type]').forEach((h) => {
    h.dataset.text = h.textContent;
    h.setAttribute('aria-label', h.textContent);
    h.textContent = '';
  });
}

/*
  Everything animates in sequence: the intro finishes, then each section types its
  heading, and only then does that section's content appear. `chain` is the queue.
*/
let finishIntro;
const introDone = new Promise((resolve) => {
  finishIntro = resolve;
  setTimeout(resolve, Math.max(0, introWords * 10 + 450 - 250));
});

let chain = reduceMotion ? Promise.resolve() : introDone;
const sectionReady = new Map();

// Sections currently on screen
const onScreen = new Set();
const screenObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
});
document.querySelectorAll('main section').forEach((s) => screenObserver.observe(s));

const whenOnScreen = (el) => new Promise((resolve) => {
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    resolve();
  }, { rootMargin: '0px 0px -25% 0px' });
  observer.observe(el);
});

const playHeading = (section, heading) => {
  if (!heading || reduceMotion) return null;
  // The jump target types once the smooth scroll brings it into view
  if (rushTarget === section) return whenOnScreen(section).then(() => typeHeading(heading));
  const skip = (rushTarget && rushTarget !== section) || !onScreen.has(section);
  if (skip) {
    heading.textContent = heading.dataset.text;
    return null;
  }
  return typeHeading(heading);
};

const whenReady = (section) => {
  if (!section) return chain;
  if (!sectionReady.has(section)) {
    const heading = section.querySelector('h2[data-type]');
    chain = chain.then(() => playHeading(section, heading));
    sectionReady.set(section, chain);
  }
  return sectionReady.get(section);
};

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target || reduceMotion) return;
    rushTarget = target;
    document.querySelector('.intro')?.classList.add('is-done');
    finishIntro();
    whenReady(target).then(() => {
      if (rushTarget === target) rushTarget = null;
    });
  });
});

/* Reveal on scroll, staggered within each group */
const groups = new Map();
document.querySelectorAll('[data-reveal]').forEach((el) => {
  const parent = el.parentElement;
  const n = groups.get(parent) ?? 0;
  el.style.setProperty('--d', `${n * 60}ms`);
  groups.set(parent, n + 1);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    revealObserver.unobserve(el);
    const section = el.closest('main section');
    if (el.matches('h2[data-type]')) {
      whenReady(section);
    } else {
      whenReady(section).then(() => el.classList.add('is-in'));
    }
  });
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

document.querySelectorAll('[data-reveal], h2[data-type]').forEach((el) => revealObserver.observe(el));

/* Highlight the current section in the sidebar */
const navLinks = [...document.querySelectorAll('.nav a')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => {
      const active = a.getAttribute('href') === `#${entry.target.id}`;
      a.classList.toggle('is-active', active);
      // On mobile the nav is a horizontal bar: keep the active link in view
      const bar = a.closest('.nav');
      if (active && bar.scrollWidth > bar.clientWidth) {
        bar.scrollTo({ left: a.parentElement.offsetLeft - 16, behavior: 'smooth' });
      }
    });
  });
}, { rootMargin: '-35% 0px -60% 0px' });

document.querySelectorAll('main section[id]').forEach((s) => sectionObserver.observe(s));

/* Click burst: short rays radiating from the cursor */
if (!reduceMotion) {
  const RAYS = 8;

  const spawnBurst = (x, y) => {
    const burst = document.createElement('span');
    burst.className = 'burst';
    burst.setAttribute('aria-hidden', 'true');
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;

    for (let i = 0; i < RAYS; i++) {
      const ray = document.createElement('span');
      ray.className = 'burst-ray';
      ray.style.setProperty('--a', `${(360 / RAYS) * i + 22.5}deg`);
      burst.append(ray);
    }

    document.body.append(burst);
    burst.lastChild.addEventListener('animationend', () => burst.remove(), { once: true });
  };

  // Mouse bursts on press; touch waits for a real tap so scrolling doesn't trigger it
  let lastPointer = 'mouse';
  document.addEventListener('pointerdown', (e) => {
    lastPointer = e.pointerType;
    if (e.pointerType !== 'touch' && e.button === 0) spawnBurst(e.clientX, e.clientY);
  });
  document.addEventListener('click', (e) => {
    if (lastPointer === 'touch' && e.detail > 0) spawnBurst(e.clientX, e.clientY);
  });
}

/* Projects carousel */
const carousel = document.querySelector('.carousel');
if (carousel) {
  const track = carousel.querySelector('.projects');
  const cards = [...track.querySelectorAll('.project')];
  const dotsWrap = carousel.querySelector('.carousel-dots');
  const [prevBtn, nextBtn] = carousel.querySelectorAll('.carousel-btn');
  let current = 0;

  // Let the track run to the right edge of the viewport
  const setBleed = () => {
    const right = document.documentElement.clientWidth - track.parentElement.getBoundingClientRect().right;
    track.style.setProperty('--bleed', `${Math.max(0, right)}px`);
  };
  setBleed();
  addEventListener('resize', setBleed);

  const dots = cards.map((card, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Ir al proyecto ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.append(dot);
    return dot;
  });

  const goTo = (i) => {
    const index = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({ left: cards[index].offsetLeft - cards[0].offsetLeft });
  };

  const update = () => {
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    const offsets = cards.map((c) => Math.abs(c.offsetLeft - cards[0].offsetLeft - track.scrollLeft));
    current = atEnd ? cards.length - 1 : offsets.indexOf(Math.min(...offsets));

    cards.forEach((c, i) => c.classList.toggle('is-current', i === current));
    dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === current);
      d.setAttribute('aria-current', i === current);
    });
    prevBtn.disabled = track.scrollLeft <= 4;
    nextBtn.disabled = atEnd;
  };

  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
  });

  // A drag that ends on a link shouldn't open it
  track.addEventListener('click', (e) => {
    if (moved && e.target.closest('a')) e.preventDefault();
  }, true);

  // Clicking a dimmed card brings it into place
  cards.forEach((card, i) => card.addEventListener('click', () => {
    if (!moved && i !== current) goTo(i);
  }));

  // Drag to scroll with the mouse (touch already scrolls natively)
  let startX = 0;
  let startScroll = 0;
  let startIndex = 0;
  let dragging = false;
  let moved = false;

  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    startIndex = current;
  });

  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 4) {
      moved = true;
      track.classList.add('is-dragging');
    }
    if (moved) track.scrollLeft = startScroll - dx;
  });

  addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    if (!moved) return;
    track.classList.remove('is-dragging');
    // A short flick moves one card in the drag direction; a long drag lands on the nearest card
    const delta = track.scrollLeft - startScroll;
    const flick = Math.abs(delta) > 60 && current === startIndex;
    goTo(flick ? startIndex + Math.sign(delta) : current);
    setTimeout(() => { moved = false; }, 0);
  });

  update();
}

/* Copy email to clipboard */
document.querySelectorAll('.copy').forEach((btn) => {
  const toast = btn.parentElement.querySelector('.copy-toast');
  let timer;

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers without the async clipboard API
      const field = document.createElement('textarea');
      field.value = text;
      field.style.cssText = 'position:fixed;opacity:0';
      document.body.append(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
  };

  btn.addEventListener('click', async () => {
    await copyText(btn.dataset.copy);
    btn.classList.add('is-copied');
    toast.textContent = 'Copiado';
    toast.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(() => {
      btn.classList.remove('is-copied');
      toast.classList.remove('is-visible');
    }, 1600);
  });
});
