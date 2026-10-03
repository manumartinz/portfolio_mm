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

/* Typewriter for section headings */
const typeHeading = (el) => {
  const text = el.dataset.text;
  let i = 0;
  el.classList.add('is-typing');
  const tick = () => {
    el.textContent = text.slice(0, ++i);
    if (i < text.length) {
      setTimeout(tick, 45 + Math.random() * 40);
    } else {
      setTimeout(() => el.classList.remove('is-typing'), 900);
    }
  };
  tick();
};

const headings = document.querySelectorAll('h2[data-type]');
if (!reduceMotion) {
  headings.forEach((h) => {
    h.dataset.text = h.textContent;
    h.setAttribute('aria-label', h.textContent);
    h.textContent = '';
  });
}

/* Reveal on scroll */
const groups = new Map();
document.querySelectorAll('[data-reveal]').forEach((el) => {
  const parent = el.parentElement;
  const n = groups.get(parent) ?? 0;
  el.style.setProperty('--d', `${n * 90}ms`);
  groups.set(parent, n + 1);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    if (el.matches('h2[data-type]')) {
      if (!reduceMotion) typeHeading(el);
    } else {
      el.classList.add('is-in');
    }
    revealObserver.unobserve(el);
  });
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

document.querySelectorAll('[data-reveal], h2[data-type]').forEach((el) => revealObserver.observe(el));

/* Highlight the current section in the sidebar */
const navLinks = [...document.querySelectorAll('.nav a')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -60% 0px' });

document.querySelectorAll('main section[id]').forEach((s) => sectionObserver.observe(s));

/* Click burst: short rays radiating from the cursor */
if (!reduceMotion) {
  const RAYS = 8;

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;

    const burst = document.createElement('span');
    burst.className = 'burst';
    burst.setAttribute('aria-hidden', 'true');
    burst.style.left = `${e.clientX}px`;
    burst.style.top = `${e.clientY}px`;

    for (let i = 0; i < RAYS; i++) {
      const ray = document.createElement('span');
      ray.className = 'burst-ray';
      ray.style.setProperty('--a', `${(360 / RAYS) * i + 22.5}deg`);
      burst.append(ray);
    }

    document.body.append(burst);
    burst.lastChild.addEventListener('animationend', () => burst.remove(), { once: true });
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
