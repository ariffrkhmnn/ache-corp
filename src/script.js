/* ===== Ache Corp — script.js (beranda) ===== */
(() => {
  "use strict";
  const { esc, $, $$, shopUrl } = ACHE;

  /* Hero slider */
  const slides = $$(".slide"), dotsWrap = $("#dots"), SLIDE_MS = 6000;
  let cur = 0, timer;
  const dots = slides.map((_, i) => {
    const b = document.createElement("button");
    b.className = "dot"; b.setAttribute("role", "tab"); b.setAttribute("aria-label", `Slide ${i + 1}`);
    b.addEventListener("click", () => { go(i); restart(); }); dotsWrap.appendChild(b); return b;
  });
  function go(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("is-active", n === cur));
    dots.forEach((d, n) => { d.classList.remove("is-active"); d.setAttribute("aria-selected", n === cur); if (n === cur) { void d.offsetWidth; d.classList.add("is-active"); } });
  }
  const restart = () => { clearInterval(timer); timer = setInterval(() => go(cur + 1), SLIDE_MS); };
  document.documentElement.style.setProperty("--slide-ms", SLIDE_MS + "ms");
  $("#prevSlide").addEventListener("click", () => { go(cur - 1); restart(); });
  $("#nextSlide").addEventListener("click", () => { go(cur + 1); restart(); });
  $("#top").addEventListener("mouseenter", () => clearInterval(timer));
  $("#top").addEventListener("mouseleave", restart);
  go(0); restart();

  /* Best sellers + Collection: kategori dihitung dari data API (Fetch API, loading, error) */
  const track = $("#favTrack"), prev = $("#favPrev"), next = $("#favNext"), collection = $("#collectionGrid");
  const skeleton = (n, cls) => Array.from({ length: n }, () => `<div class="${cls} animate-pulse bg-[#2b2b2b]" aria-hidden="true"></div>`).join("");
  const errorBox = msg => `<div class="w-full border-2 border-accent bg-paper p-5 text-black" role="alert"><p class="font-bold text-accent">Gagal memuat produk</p><p class="mt-1 text-muted">${esc(msg)}</p><button class="btn mt-4" type="button" data-retry>Coba lagi</button></div>`;

  const favCard = c => `<a class="fav group block shrink-0 basis-[68%] snap-start xs:basis-[calc((100%-44px)/3)] wide:basis-[calc((100%-66px)/4)]" href="${shopUrl(c.key)}" aria-label="${esc(c.label)}, ${c.count} produk">
    <div class="aspect-3/4 overflow-hidden bg-paper"><img class="size-full object-contain p-6 transition duration-500 group-hover:scale-105" src="${esc(c.img)}" alt="" loading="lazy"></div>
    <span class="mt-3.5 flex items-baseline justify-between text-sm font-bold tracking-widest uppercase transition-colors group-hover:text-accent">${esc(c.label)}<small class="font-medium tracking-normal text-[#aaa] normal-case">${c.count} produk</small></span></a>`;

  const tile = (c, i) => `<a href="${shopUrl(c.key)}" class="group relative block min-h-80 overflow-hidden bg-paper after:absolute after:inset-0 after:bg-linear-to-t after:from-black/70 after:to-transparent after:to-55% ${i === 0 ? "nav:min-h-[540px]" : ""}"><img class="absolute inset-0 size-full object-contain p-10 pb-24 transition duration-700 group-hover:scale-105" src="${esc(c.img)}" alt="Koleksi ${esc(c.label)}" loading="lazy"><span class="absolute bottom-5 left-[22px] z-2 font-display text-[44px] leading-none text-white uppercase">${esc(c.label)}<small class="mt-1.5 block font-body text-sm font-medium normal-case opacity-85">${c.count} produk</small></span></a>`;

  async function loadCategories() {
    track.innerHTML = skeleton(4, "aspect-3/4 shrink-0 basis-[68%] xs:basis-[calc((100%-44px)/3)] wide:basis-[calc((100%-66px)/4)]");
    collection.innerHTML = skeleton(3, "min-h-80 nav:min-h-[540px]");
    collection.setAttribute("aria-busy", "true");
    try {
      const products = await ACHE.load({ force: true });
      // Per kategori: hitung jumlah (filter) dan ambil produk berating tertinggi sebagai cover (reduce)
      const cats = ACHE.CATEGORIES.map(c => {
        const items = products.filter(p => ACHE.inCategory(p, c.key));
        const best = items.reduce((top, p) => (p.rating > top.rating ? p : top), items[0] || { rating: -1 });
        return { ...c, count: items.length, img: best.img };
      }).filter(c => c.count > 0);
      track.innerHTML = cats.map(favCard).join("");
      collection.innerHTML = cats.slice(0, 3).map(tile).join("");
    } catch (err) {
      track.innerHTML = errorBox(ACHE.errorMessage(err));
      collection.innerHTML = errorBox(ACHE.errorMessage(err));
    }
    collection.setAttribute("aria-busy", "false");
    sync();
  }
  const step = () => (track.querySelector(".fav")?.offsetWidth || 300) + 22;
  const sync = () => { prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; };
  prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
  track.addEventListener("scroll", sync, { passive: true }); addEventListener("resize", sync);
  document.addEventListener("click", e => { if (e.target.closest("[data-retry]")) loadCategories(); });
  loadCategories();

  /* Newsletter */
  const form = $("#newsletterForm"), email = $("#email"), msg = $("#formMsg");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    email.classList.toggle("invalid", !ok); msg.dataset.s = ok ? "ok" : "err";
    msg.textContent = ok ? "Berhasil daftar. Cek inbox kamu ya." : "Format email belum benar. Contoh: nama@email.com";
    if (ok) form.reset();
  });
  $("#year").textContent = new Date().getFullYear();
})();