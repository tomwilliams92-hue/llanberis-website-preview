// Llanberis Bike Hire: the small bits of behaviour every page shares.

// Menu button on phones and small tablets
const header = document.querySelector('header.top');
const menu = document.querySelector('.menu');
if (menu) {
  const shut = () => { header.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    menu.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('nav.main a').forEach(a => a.addEventListener('click', shut));
  // Esc closes it and puts you back on the button
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && header.classList.contains('open')) { shut(); menu.focus(); }
  });
}

// Today and the furthest day we take bookings for, by the visitor's own clock (toISOString would give the UTC day,
// which is yesterday for the first hour after midnight in summer). book.php checks the same limits in UK time.
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayLimits = input => {
  const d = new Date();
  input.min = ymd(d);
  d.setDate(d.getDate() + 400);
  input.max = ymd(d);
};
// A form sends once: the button greys out as it goes, and wakes up again if the visitor comes back to the page
const sendOnce = f => {
  const b = f.querySelector('button[type=submit]'), words = b.textContent;
  f.addEventListener('submit', e => {
    if (e.defaultPrevented) return;
    setTimeout(() => { b.disabled = true; b.textContent = 'Sending…'; });
  });
  addEventListener('pageshow', () => { b.disabled = false; b.textContent = words; });
};

// "Back to the form" on the sorry pages: go back in the browser, so the answers are still filled in
document.querySelectorAll('[data-back]').forEach(a => a.addEventListener('click', e => {
  if (history.length > 1 && document.referrer && new URL(document.referrer).host === location.host) {
    e.preventDefault();
    history.back();
  }
}));

// Reviews: the arrows scroll the row of quotes
document.querySelectorAll('.rv-car').forEach(c => {
  const t = c.querySelector('.rv-track');
  const prev = c.querySelector('.prev'), next = c.querySelector('.next');
  prev.addEventListener('click', () => t.scrollBy({left: -t.clientWidth, behavior: 'smooth'}));
  next.addEventListener('click', () => t.scrollBy({left: t.clientWidth, behavior: 'smooth'}));
  // an arrow fades when there is nothing more that way (it keeps the keyboard focus, so it isn't switched off)
  const ends = () => {
    prev.setAttribute('aria-disabled', t.scrollLeft < 8);
    next.setAttribute('aria-disabled', t.scrollLeft + t.clientWidth > t.scrollWidth - 8);
  };
  t.addEventListener('scroll', ends, {passive: true});
  addEventListener('resize', ends);
  ends();
});

// Bike pages: tap a small photo to show it large
document.querySelectorAll('.thumbs button').forEach(btn => btn.addEventListener('click', () => {
  const img = document.querySelector('.mainph img');
  img.src = btn.dataset.src;
  img.alt = btn.dataset.alt;
  document.querySelectorAll('.thumbs button').forEach(b => b.setAttribute('aria-pressed', b === btn));
}));

// Bike pages: the bars fill once they're on screen (without JavaScript they're simply full).
// The gradient spans the whole track, so a longer bar reaches a brighter gold.
const stats = document.querySelector('.stats');
if (stats) {
  const fill = () => stats.querySelectorAll('.stat').forEach((s, k) => setTimeout(() => s.classList.add('lit'), k * 140));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { fill(); io.disconnect(); }
    }), {threshold: 0.3});
    io.observe(stats);
  } else {
    fill();
  }
}

// Enquiry form: no booking in the past, and a note when the site is opened from a folder
// (the form only sends once the site is online, because it needs the web server)
const form = document.querySelector('.cform');
if (form) {
  const day = form.querySelector('input[type=date]');
  if (day) dayLimits(day);
  if (location.protocol === 'file:') {
    form.addEventListener('submit', e => { e.preventDefault(); form.classList.add('local-file'); });
  }
  sendOnce(form);
}

// Booking request form: add and remove riders, show "how many days" and the "where are you staying" note when needed
const bform = document.querySelector('.bform');
if (bform) {
  const day = bform.querySelector('input[name=date]');
  dayLimits(day);
  const length = bform.querySelector('select[name=length]');
  // "Two days or more" needs the number of days: an emptied box is caught here, not by the "didn't send" page
  const daysBox = bform.querySelector('input[name=days]');
  const multi = () => {
    const on = length.value === 'days';
    bform.classList.toggle('multi-day', on);
    daysBox.required = on;
  };
  length.addEventListener('change', multi);
  multi();
  const staying = bform.querySelector('input[name=staying]');
  const collect = () => {
    const away = bform.querySelector('input[name=collect]:checked').value !== 'yard';
    bform.classList.toggle('needs-staying', away);
    staying.required = away;
  };
  bform.querySelectorAll('input[name=collect]').forEach(r => r.addEventListener('change', collect));
  collect();

  const list = bform.querySelector('.riders');
  const add = bform.querySelector('.add-rider');
  const first = list.querySelector('.rider');
  const renumber = () => {
    const rows = list.querySelectorAll('.rider');
    rows.forEach((row, i) => {
      row.querySelector('.rider-n').textContent = 'Rider ' + (i + 1);
      row.querySelectorAll('[name]').forEach(f => { f.name = f.name.replace(/riders\[\d+\]/, 'riders[' + i + ']'); });
      row.querySelector('.remove').hidden = rows.length === 1;
    });
    add.hidden = rows.length >= 20;
  };
  // A seat in a trailer or a tag-along doesn't need a height
  const heightRule = row => {
    const h = row.querySelector('input[name$="[height]"]');
    const needed = !['trailer', 'tagalong'].includes(row.querySelector('select').value);
    h.required = needed;
    if (needed) h.pattern = '.*[0-9].*'; else h.removeAttribute('pattern');
  };
  list.addEventListener('change', e => { if (e.target.matches('select')) heightRule(e.target.closest('.rider')); });
  // From the bike finder (book.html?bike=fullsus): that bike for the first rider, if it's one on the list
  const asked = new URLSearchParams(location.search);
  const picked = asked.get('bike');
  const firstBike = first.querySelector('select');
  if (picked && [...firstBike.options].some(o => o.value && o.value === picked)) {
    firstBike.value = picked;
    heightRule(first);
  }
  // and the height chosen on the e-bike page's size finder (book.html?bike=emtb&height=...)
  const height = asked.get('height');
  if (height) first.querySelector('input[name$="[height]"]').value = height.slice(0, 20);
  // from a route page (book.html?route=route-b): that route, if it's one on the list
  const way = bform.querySelector('select[name=route]');
  if ([...way.options].some(o => o.value && o.value === asked.get('route'))) way.value = asked.get('route');
  list.addEventListener('click', e => {
    if (e.target.matches('.remove')) { e.target.closest('.rider').remove(); renumber(); }
  });
  add.addEventListener('click', () => {
    const row = first.cloneNode(true);
    row.querySelectorAll('input').forEach(i => { i.value = ''; });
    row.querySelector('select').selectedIndex = 0;
    list.appendChild(row);
    renumber();
    heightRule(row);
    row.querySelector('input').focus();
  });
  renumber();

  // The request only sends from the real website (it needs the web server), not from a copy opened from a folder
  // or the GitHub preview
  if (location.protocol === 'file:' || location.hostname.endsWith('github.io')) {
    bform.addEventListener('submit', e => { e.preventDefault(); bform.classList.add('local-file'); });
  }
  // a box filled in the wrong way (a height with no number, a phone number with no digits) says what it needs,
  // in our words rather than the browser's "match the requested format"
  bform.addEventListener('invalid', e => {
    const f = e.target;
    if (f.validity.patternMismatch && f.title) f.setCustomValidity(f.title);
  }, true);
  bform.addEventListener('input', e => { if (e.target.setCustomValidity) e.target.setCustomValidity(''); });
  sendOnce(bform);
}

// Bike finder (which-bike.html): one or two bikes for the answers, best first. qa.py checks every set of answers.
// Nigel's fleet (email 18.11.2026, updated 24.11.2026): hardtails, hardtail e-bikes, road bikes, THREE full-suspension
// e-bikes kept for Snowdon (Giant Trance L, Cube Stereo S, Cube 155 SLX L), children's bikes, trailers and tag-alongs.
function suggestBikes(who, where, rider, help) {
  if (who === 'child') return ['kids'];
  if (who === 'little') return ['trailer', 'tagalong'];
  if (where === 'roads') return help ? ['road', 'emtb'] : ['road'];
  // Snowdon is by arrangement with Nigel, on the full-suspension e-bike, and only for riders who are up to it.
  // Newer riders get a bike for the other routes, and the Snowdon note explains why.
  if (where === 'snowdon' && (rider === 'offroad' || rider === 'expert')) return ['fullsus'];
  return help ? ['emtb', 'hardtail'] : ['hardtail'];
}

const finder = document.querySelector('.finder');
if (finder) {
  const out = document.querySelector('.fb-out');
  const list = out.querySelector('.fb-list');
  const answer = name => (finder.querySelector(`input[name=${name}]:checked`) || {}).value;
  const show = () => {
    const who = answer('who');
    const picks = suggestBikes(who, answer('where'), answer('rider'), answer('help') === 'yes');
    list.querySelectorAll('.fb-card').forEach(c => { c.hidden = !picks.includes(c.dataset.bike); });
    picks.forEach((bike, i) => {
      const card = list.querySelector(`[data-bike="${bike}"]`);
      const rank = card.querySelector('.fb-rank');
      rank.textContent = i ? 'Also a good choice' : 'Our first choice';
      rank.hidden = picks.length < 2;
      list.insertBefore(card, list.children[i]);  // the picks first, in order
    });
    out.querySelector('.fb-snowdon').hidden = !(who === 'adult' && answer('where') === 'snowdon');
    out.querySelector('.fb-grownups').hidden = who === 'adult';
    out.hidden = false;
  };
  finder.addEventListener('change', () => {
    // a child or a little one only needs the first question (disabled questions don't have to be answered)
    finder.querySelectorAll('.adult-only').forEach(f => { f.hidden = f.disabled = ['child', 'little'].includes(answer('who')); });
    // once the suggestion is showing, it follows any change of answer
    if (!out.hidden) {
      if (finder.checkValidity()) show(); else out.hidden = true;
    }
  });
  finder.addEventListener('submit', e => {
    e.preventDefault();
    show();
    out.querySelector('h2').focus();
  });
  out.querySelector('.fb-again').addEventListener('click', () => {
    finder.reset();
    finder.querySelectorAll('.adult-only').forEach(f => { f.hidden = f.disabled = false; });
    out.hidden = true;
    finder.querySelector('input').focus();
    finder.scrollIntoView({block: 'start'});
  });
}

// E-bike page: tap a dot on the photo, or a part in the list, to see what it does. The dots pop in once on screen.
const tour = document.querySelector('.tour');
if (tour) {
  const parts = [...tour.querySelectorAll('.parts button')], dots = [...tour.querySelectorAll('.dot')];
  const pick = i => {
    parts.forEach((b, k) => { b.setAttribute('aria-expanded', k === i); b.nextElementSibling.hidden = k !== i; });
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
  };
  parts.forEach((b, i) => b.addEventListener('click', () => pick(i)));
  dots.forEach((d, i) => d.addEventListener('click', () => pick(i)));
  pick(0);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) {
        tour.classList.add('seen');
        setTimeout(() => tour.classList.add('ready'), 1000);  // after the pop-in, hovering a dot reacts straight away
        io.disconnect();
      }
    }), {threshold: 0.4});
    io.observe(tour.querySelector('.tour-img'));
  } else tour.classList.add('seen');
}

// E-bike page: slide to your height to see which frame fits, with the rider drawn to scale beside the bike.
// Heights from Carrera's size charts (Halfords, checked 19.11.2026): women's 14in S 150-163 cm, 16in M 160-170;
// men's 18in M 168-178, 20in L 175-185. Nigel has up to 2 small, 3 medium and 3 large (email 18.11.2026).
const fit = document.querySelector('.fit');
if (fit) {
  // in whole inches (4ft 11 to 5ft 4, 5ft 3 to 5ft 10, 5ft 9 to 6ft 1), so the lit size always agrees with the read-out
  const SIZES = [['S', 'small', 59, 64, 2], ['M', 'medium', 63, 70, 3], ['L', 'large', 69, 73, 3]];
  const range = fit.querySelector('input'), out = fit.querySelector('output'), msg = fit.querySelector('.fit-msg');
  const person = fit.querySelector('.fit-person'), book = fit.querySelector('.fit-book');
  const ring = '<a href="tel:+447776051559">07776 051559</a>';
  const ftin = cm => { const i = Math.round(cm / 2.54); return `${Math.floor(i / 12)}ft` + (i % 12 ? ` ${i % 12}in` : ''); };
  const show = () => {
    const cm = +range.value, inches = Math.round(cm / 2.54), fits = SIZES.filter(s => inches >= s[2] && inches <= s[3]);
    out.textContent = `${ftin(cm)} · ${cm} cm`;
    range.setAttribute('aria-valuetext', out.textContent);
    person.style.transform = `scale(${cm / 100})`;
    fit.querySelectorAll('.sizes li').forEach(li => li.classList.toggle('on', fits.some(s => s[0] === li.dataset.size)));
    msg.innerHTML = fits.length === 1 ? `A <b>${fits[0][1]}</b> should fit you. We have up to ${fits[0][4]}.`
      : fits.length ? `A <b>${fits[0][1]} or ${fits[1][1]}</b> should both fit you. Nigel will help you choose.`
      : inches < 59 ? `Our smallest e-bike is made for riders from 4ft 11in (150 cm), so give Nigel a ring on ${ring} and he'll suggest one that fits.`
      : `Our large e-bike is made for riders up to 6ft 1in (185 cm), so give Nigel a ring on ${ring} to check the fit.`;
    book.hidden = !fits.length;
    book.href = 'book.html?bike=emtb&height=' + encodeURIComponent(`${cm}cm (${ftin(cm).replace('in', '')})`);
  };
  range.addEventListener('input', show);
  show();
}
