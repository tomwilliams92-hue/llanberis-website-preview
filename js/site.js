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
