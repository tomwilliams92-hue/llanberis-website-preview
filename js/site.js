// Llanberis Bike Hire: the small bits of behaviour every page shares.

// Menu button on phones and small tablets
const header = document.querySelector('header.top');
const menu = document.querySelector('.menu');
if (menu) {
  menu.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    menu.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('nav.main a').forEach(a => a.addEventListener('click', () => {
    header.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  }));
}

// Reviews: the arrows scroll the row of quotes
document.querySelectorAll('.rv-car').forEach(c => {
  const t = c.querySelector('.rv-track');
  c.querySelector('.prev').addEventListener('click', () => t.scrollBy({left: -t.clientWidth, behavior: 'smooth'}));
  c.querySelector('.next').addEventListener('click', () => t.scrollBy({left: t.clientWidth, behavior: 'smooth'}));
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
  if (day) day.min = new Date().toISOString().slice(0, 10);
  if (location.protocol === 'file:') {
    form.addEventListener('submit', e => { e.preventDefault(); form.classList.add('local-file'); });
  }
}

// Booking request form: add and remove riders, show "how many days" and the "where are you staying" note when needed
const bform = document.querySelector('.bform');
if (bform) {
  const day = bform.querySelector('input[name=date]');
  day.min = new Date().toISOString().slice(0, 10);
  const length = bform.querySelector('select[name=length]');
  const multi = () => bform.classList.toggle('multi-day', length.value === 'days');
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
    const bike = row.querySelector('select').value;
    row.querySelector('input[name$="[height]"]').required = !['trailer', 'tagalong'].includes(bike);
  };
  list.addEventListener('change', e => { if (e.target.matches('select')) heightRule(e.target.closest('.rider')); });
  // From the bike finder (book.html?bike=fullsus): that bike for the first rider, if it's one on the list
  const picked = new URLSearchParams(location.search).get('bike');
  const firstBike = first.querySelector('select');
  if (picked && [...firstBike.options].some(o => o.value && o.value === picked)) {
    firstBike.value = picked;
    heightRule(first);
  }
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
}

// Bike finder (which-bike.html): one or two bikes for the answers, best first. qa.py checks every set of answers.
// Nigel's fleet (email 18.11.2026): hardtails, hardtail e-bikes, road bikes, ONE full-suspension e-bike kept for
// Snowdon, children's bikes, trailers and tag-alongs.
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
}
