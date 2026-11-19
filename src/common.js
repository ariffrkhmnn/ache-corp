/* ===== Ache Corp — common.js (header, search, keranjang, login/register) ===== */
(() => {
  "use strict";
  const { rupiah, esc, $, $$ } = ACHE;

  /* Toast + gambar rusak */
  const toastEl = $("#toast"); let tt;
  ACHE.toast = m => { toastEl.textContent = m; toastEl.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove("show"), 2200); };
  ACHE.checkBroken = () => $$("img").forEach(i => { if (i.complete && i.naturalWidth === 0) i.classList.add("is-broken"); });
  document.addEventListener("error", e => {
    const i = e.target; if (i.tagName !== "IMG") return;
    i.classList.add("is-broken");
  }, true);

  /* Header + menu mobile */
  const header = $("#header"), burger = $("#burger"), nav = $("#nav");
  const onScroll = () => header.classList.toggle("is-stuck", scrollY > 10);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const setMenu = o => { nav.classList.toggle("is-open", o); burger.setAttribute("aria-expanded", o); document.body.classList.toggle("lock", o); };
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$("a", nav).forEach(a => a.addEventListener("click", () => setMenu(false)));

  /* ---------- Drawer (keranjang + akun) ---------- */
  const overlay = $("#overlay");
  const FE = "form-err min-h-5 text-sm font-semibold text-[#c4260f]", SHOW = "flex items-center gap-2 text-sm text-muted";
  const authHTML = `
  <aside class="drawer" id="authPanel" aria-hidden="true" aria-label="Akun">
    <div class="d-head"><h2 class="d-title" id="authTitle">Masuk / Daftar</h2><button class="icon-btn" data-close aria-label="Tutup panel akun">&#10005;</button></div>
    <div class="flex-1 overflow-auto p-[22px]">
      <div id="authGuest">
        <div class="mb-[22px] flex gap-2" role="tablist">
          <button class="tab is-active flex-1 py-2.5" data-auth="login" role="tab">Login</button>
          <button class="tab flex-1 py-2.5" data-auth="register" role="tab">Register</button>
        </div>
        <form id="loginForm" class="grid gap-3.5" novalidate>
          <p class="mb-1 text-[17px]">Masuk buat lanjut belanja dan simpan keranjangmu.</p>
          ${field("lgEmail", "Email", "email", "email")}${field("lgPass", "Password", "password", "current-password")}
          <label class="${SHOW}"><input type="checkbox" data-show> Tampilkan password</label>
          <p class="${FE}" role="alert"></p>
          <button class="btn w-full" type="submit">Login</button>
        </form>
        <form id="registerForm" class="grid gap-3.5" novalidate hidden>
          <p class="mb-1 text-[17px]">Bikin akun biar dapat info drop dan promo member.</p>
          ${field("rgName", "Nama", "text", "name")}${field("rgEmail", "Email", "email", "email")}${field("rgPass", "Password (min. 6 karakter)", "password", "new-password")}${field("rgPass2", "Ulangi password", "password", "new-password")}
          <label class="${SHOW}"><input type="checkbox" data-show> Tampilkan password</label>
          <p class="${FE}" role="alert"></p>
          <button class="btn w-full" type="submit">Buat akun</button>
        </form>
      </div>
      <div id="authUser" hidden>
        <p class="mb-1 text-[17px]">Halo, <b id="authName"></b></p>
        <p class="mb-5 text-muted" id="authMail"></p>
        <button class="btn w-full" id="logoutBtn">Logout</button>
      </div>
      <p class="mt-7 text-[13px] text-muted">Ini cuma demo. Data akun disimpan di browser kamu, bukan di server.</p>
    </div>
  </aside>`;
  function field(id, label, type, ac) { return `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="${type}" autocomplete="${ac}" required></div>`; }
  document.body.insertAdjacentHTML("beforeend", authHTML);

  const cartDrawer = $("#drawer"), authPanel = $("#authPanel");
  function closeDrawers() {
    [cartDrawer, authPanel].forEach(d => { d.classList.remove("is-open"); d.setAttribute("aria-hidden", "true"); });
    overlay.hidden = true; document.body.classList.remove("lock");
  }
  function openDrawer(d) {
    closeDrawers(); overlay.hidden = false; d.classList.add("is-open"); d.setAttribute("aria-hidden", "false"); document.body.classList.add("lock");
    ($("form:not([hidden]) input", d) || $(".icon-btn", d)).focus();
  }
  overlay.addEventListener("click", closeDrawers);
  $("#cartClose").addEventListener("click", closeDrawers);
  $("[data-close]", authPanel).addEventListener("click", closeDrawers);
  $("#cartOpen").addEventListener("click", () => openDrawer(cartDrawer));
  $("#authOpen").addEventListener("click", () => openDrawer(authPanel));

  /* ---------- Login / Register (demo, localStorage) ---------- */
  const get = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const hash = s => { let h = 5381; for (const c of s) h = (h * 33) ^ c.charCodeAt(0); return (h >>> 0).toString(36); };
  const mailOK = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const authBtn = $("#authOpen");

  function renderAuth() {
    const s = get("ache-session");
    $("#authGuest").hidden = !!s; $("#authUser").hidden = !s;
    $("#authTitle").textContent = s ? "Akun kamu" : "Masuk / Daftar";
    if (s) { $("#authName").textContent = s.name; $("#authMail").textContent = s.email; }
    authBtn.classList.toggle("is-in", !!s);
    authBtn.setAttribute("aria-label", s ? "Akun " + s.name : "Masuk atau daftar");
  }
  function setTab(t) {
    $$("[data-auth]").forEach(b => b.classList.toggle("is-active", b.dataset.auth === t));
    $("#loginForm").hidden = t !== "login"; $("#registerForm").hidden = t !== "register";
    $$(".form-err").forEach(e => e.textContent = "");
  }
  $$("[data-auth]").forEach(b => b.addEventListener("click", () => setTab(b.dataset.auth)));
  $$("[data-show]").forEach(c => c.addEventListener("change", () => $$("input[type=password],input[data-pw]", c.closest("form")).forEach(i => { i.type = c.checked ? "text" : "password"; i.dataset.pw = 1; })));

  const login = (u, msg) => { put("ache-session", { name: u.name, email: u.email }); renderAuth(); ACHE.toast(msg); };
  $("#loginForm").addEventListener("submit", e => {
    e.preventDefault();
    const em = $("#lgEmail").value.trim().toLowerCase(), pw = $("#lgPass").value, err = $(".form-err", e.target);
    if (!mailOK(em) || !pw) return err.textContent = "Isi email yang valid dan password dulu.";
    const u = (get("ache-users") || []).find(x => x.email === em && x.h === hash(pw));
    if (!u) return err.textContent = "Email atau password salah.";
    e.target.reset(); login(u, "Berhasil login. Halo, " + u.name + "!");
  });
  $("#registerForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#rgName").value.trim(), em = $("#rgEmail").value.trim().toLowerCase(), pw = $("#rgPass").value, err = $(".form-err", e.target);
    const users = get("ache-users") || [];
    if (name.length < 2) return err.textContent = "Nama minimal 2 karakter.";
    if (!mailOK(em)) return err.textContent = "Format email belum benar.";
    if (pw.length < 6) return err.textContent = "Password minimal 6 karakter.";
    if (pw !== $("#rgPass2").value) return err.textContent = "Password dan ulangi password beda.";
    if (users.some(x => x.email === em)) return err.textContent = "Email ini sudah terdaftar. Coba login.";
    const u = { name, email: em, h: hash(pw) }; users.push(u); put("ache-users", users);
    e.target.reset(); login(u, "Akun dibuat. Selamat datang, " + name + "!");
  });
  $("#logoutBtn").addEventListener("click", () => { try { localStorage.removeItem("ache-session"); } catch {} renderAuth(); setTab("login"); ACHE.toast("Kamu sudah logout."); });

  /* ---------- Keranjang ---------- */
  const KEY = "ache-corp-cart";
  let cart = get(KEY) || [];
  // Keranjang menyimpan salinan data produk (nama, harga, gambar) agar tetap tampil tanpa fetch ulang
  cart = cart.filter(i => i.name && i.price >= 0);
  const cartItems = $("#cartItems"), cartTotal = $("#cartTotal"), cartCount = $("#cartCount");
  const save = () => put(KEY, cart);
  ACHE.addToCart = ({ id, name, price, img }) => {
    const r = cart.find(i => i.id === id); r ? r.qty++ : cart.push({ id, name, price, img, qty: 1 });
    save(); renderCart(); cartCount.classList.remove("animate-bump"); void cartCount.offsetWidth; cartCount.classList.add("animate-bump");
    ACHE.toast("Ditambahkan ke keranjang");
  };
  function renderCart() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    cartCount.textContent = count;
    cartTotal.textContent = rupiah(cart.reduce((s, i) => s + i.qty * i.price, 0));
    $("#checkoutBtn").disabled = !count;
    cartItems.innerHTML = cart.length ? cart.map(i => {
      const p = i, qb = "size-[30px] text-base hover:bg-black hover:text-white";
      return `<li class="grid grid-cols-[76px_1fr_auto] items-start gap-3.5 border-b border-line py-4"><img class="h-24 w-[76px] bg-white object-contain" src="${esc(p.img)}" alt="${esc(p.name)}"><div><p class="text-[15px] leading-snug font-semibold">${esc(p.name)}</p><p class="mt-0.5 mb-2.5 text-sm text-muted">${rupiah(p.price)}</p>
        <div class="inline-flex border-[1.5px] border-black"><button class="${qb}" data-dec="${p.id}" aria-label="Kurangi jumlah">&minus;</button><span class="grid w-8 place-items-center text-sm font-bold">${i.qty}</span><button class="${qb}" data-inc="${p.id}" aria-label="Tambah jumlah">+</button></div></div>
        <button class="text-[13px] text-muted underline hover:text-accent" data-rm="${p.id}">Hapus</button></li>`;
    }).join("") : `<li class="py-10 text-center text-muted">Keranjang masih kosong. Pilih produk dulu, yuk.</li>`;
  }
  cartItems.addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    const id = +(t.dataset.inc || t.dataset.dec || t.dataset.rm), r = cart.find(i => i.id === id);
    if (t.dataset.inc) r.qty++;
    if (t.dataset.dec && --r.qty <= 0) cart = cart.filter(i => i.id !== id);
    if (t.dataset.rm) cart = cart.filter(i => i.id !== id);
    save(); renderCart();
  });
  $("#checkoutBtn").addEventListener("click", () => { cart = []; save(); renderCart(); closeDrawers(); ACHE.toast("Pesanan dicatat. Ini cuma demo, belum ada pembayaran asli."); });

  /* ---------- Search (klik hasil / Enter -> halaman Shop) ---------- */
  const search = $("#search"), sInput = $("#searchInput"), sRes = $("#searchResults");
  const openSearch = () => { poolError = ""; search.hidden = false; document.body.classList.add("lock"); sInput.value = ""; renderSearch(""); sInput.focus(); };
  const closeSearch = () => { search.hidden = true; document.body.classList.remove("lock"); };
  let pool = null, poolError = "";
  // Data produk diambil dari API saat pencarian pertama kali dibuka
  let poolBusy = false;
  const ensurePool = async () => {
    if (pool || poolBusy) return;
    poolBusy = true;
    try { pool = await ACHE.load(); poolError = ""; } catch (err) { poolError = ACHE.errorMessage(err); }
    poolBusy = false;
    renderSearch(sInput.value);
  };
  function renderSearch(q) {
    q = q.trim().toLowerCase();
    if (poolError) return sRes.innerHTML = `<li class="px-1.5 py-[18px] font-semibold text-accent">${esc(poolError)}</li>`;
    if (!pool) { ensurePool(); return sRes.innerHTML = `<li class="px-1.5 py-[18px] text-muted">Memuat produk…</li>`; }
    if (!q) return sRes.innerHTML = `<li class="px-1.5 py-[18px] text-muted">Ketik nama produk atau kategori.</li>`;
    const hits = pool.filter(p => `${p.name} ${ACHE.labelOf(p.cat)}`.toLowerCase().includes(q)).slice(0, 6);
    sRes.innerHTML = hits.length ? hits.map(p => `<li><a class="flex items-center gap-3.5 border-b border-line px-1.5 py-2.5 hover:bg-black/5" href="shop.html?q=${encodeURIComponent(p.name)}"><img class="h-[60px] w-12 bg-white object-contain" src="${esc(p.img)}" alt=""><span>${esc(p.name)}<small class="block text-muted">${rupiah(p.price)}</small></span></a></li>`).join("")
      : `<li class="px-1.5 py-[18px] text-muted">Tidak ada hasil untuk "${esc(q)}". Coba kata lain.</li>`;
  }
  $("#searchOpen").addEventListener("click", openSearch);
  $("#searchClose").addEventListener("click", closeSearch);
  search.addEventListener("click", e => { if (e.target === search) closeSearch(); });
  sInput.addEventListener("input", () => renderSearch(sInput.value));
  sInput.addEventListener("keydown", e => { if (e.key === "Enter" && sInput.value.trim()) location.href = "shop.html?q=" + encodeURIComponent(sInput.value.trim()); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeDrawers(); closeSearch(); setMenu(false); } });

  renderCart(); renderAuth(); ACHE.checkBroken(); addEventListener("load", ACHE.checkBroken);
})();
