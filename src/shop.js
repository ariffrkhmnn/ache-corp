/* ===== Ache Corp — shop.js (halaman Shop: Fetch API, loading, error, search real-time, filter) ===== */
(() => {
  "use strict";
  const { CATEGORIES, load, errorMessage, inCategory, labelOf, rupiah, esc, $, $$ } = ACHE;
  const PAGE = 12, params = new URLSearchParams(location.search);
  const st = {
    all: [], // data hasil fetch (sumber kebenaran, tidak diubah saat filter)
    cat: CATEGORIES.some(c => c.key === params.get("cat")) ? params.get("cat") : "all",
    q: (params.get("q") || "").trim(),
    sort: "default",
    shown: PAGE
  };
  const grid = $("#productGrid"), more = $("#moreBtn"), searchBox = $("#shopSearch");

  /* ---------- Tab kategori (template literal + map) ---------- */
  const tabs = [{ key: "all", label: "Semua" }, ...CATEGORIES];
  $("#tabs").innerHTML = tabs.map(t => `<button class="tab" data-cat="${t.key}" role="tab">${t.label}</button>`).join("");
  searchBox.value = st.q;

  /* ---------- Template ---------- */
  const skeleton = n => Array.from({ length: n }, () => `<div class="animate-pulse" aria-hidden="true"><div class="aspect-4/5 bg-line"></div><div class="mt-3 h-4 w-4/5 bg-line"></div><div class="mt-2 h-4 w-2/5 bg-line"></div></div>`).join("");

  const card = x => `<article class="group flex animate-fade flex-col">
    <div class="relative aspect-4/5 overflow-hidden bg-paper">
      ${x.badge ? `<span class="absolute top-3 left-3 z-2 px-2.5 py-[3px] text-xs font-bold text-white ${x.old ? "bg-accent" : "bg-black"}">${x.badge}</span>` : ""}
      <img class="size-full object-contain p-4 transition duration-500 group-hover:scale-105" src="${esc(x.img)}" alt="${esc(x.name)}" loading="lazy">
      <button class="absolute inset-x-3 bottom-3 z-2 bg-black p-3 text-sm font-bold text-white transition duration-300 ease-ache hover:bg-accent hov:translate-y-[calc(100%+16px)] hov:group-hover:translate-y-0 hov:focus-visible:translate-y-0" data-add="${x.id}" aria-label="Tambah ${esc(x.name)} ke keranjang">Tambah ke keranjang</button>
    </div>
    <h3 class="mt-3 text-[15px] leading-snug font-semibold">${esc(x.name)}</h3>
    <p class="mt-1 text-[13px] text-muted">${esc(labelOf(x.cat))} · ★ ${x.rating.toFixed(1)}</p>
    <p class="mt-1 flex items-baseline gap-2.5 text-[15px]"><b>${rupiah(x.price)}</b>${x.old ? `<s class="text-[13px] text-muted">${rupiah(x.old)}</s>` : ""}</p>
  </article>`;

  /* ---------- Filter + search + sort (filter, includes, sort) ---------- */
  function list() {
    const q = st.q.toLowerCase();
    const result = st.all.filter(p => inCategory(p, st.cat) && (!q || `${p.name} ${labelOf(p.cat)}`.toLowerCase().includes(q)));
    const by = { default: () => 0, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating };
    return result.sort(by[st.sort]);
  }

  /* ---------- State tampilan: loading / error / ready ---------- */
  function setState(state, message = "") {
    const loading = state === "loading", error = state === "error";
    $("#status").hidden = !loading;
    $("#errorBox").hidden = !error;
    if (error) $("#errorMsg").textContent = message;
    if (loading) grid.innerHTML = skeleton(8);
    if (loading || error) { $("#empty").hidden = true; more.hidden = true; $("#count").textContent = ""; }
    grid.setAttribute("aria-busy", loading);
    if (error) grid.innerHTML = "";
  }

  function render() {
    const l = list(), cat = CATEGORIES.find(c => c.key === st.cat);
    $$(".tab", $("#tabs")).forEach(t => { const on = t.dataset.cat === st.cat; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); });
    $("#shopTitle").textContent = st.q ? `Hasil: "${st.q}"` : cat ? cat.label : "Semua produk";
    $("#shopDesc").textContent = st.q ? "Hasil pencarian dari seluruh produk yang cocok." : cat ? cat.desc : "Seluruh koleksi Ache Corp: kemeja, sneakers, eyewear, jam tangan, dan tas.";
    $("#count").textContent = `${l.length} produk`;
    grid.innerHTML = l.slice(0, st.shown).map(card).join("");
    $("#empty").hidden = l.length > 0;
    more.hidden = st.shown >= l.length;
    document.title = `${cat ? cat.label : "Shop"} — Ache Corp`;
    const u = new URLSearchParams();
    if (st.cat !== "all") u.set("cat", st.cat);
    if (st.q) u.set("q", st.q);
    history.replaceState(null, "", "shop.html" + (u.toString() ? "?" + u : ""));
  }

  /* ---------- Fetch API (async/await + try/catch) ---------- */
  async function init() {
    setState("loading");
    try {
      st.all = await load({ force: true });
      setState("ready");
      render();
    } catch (err) {
      setState("error", errorMessage(err));
    }
  }

  /* ---------- Event handling: click, input, change ---------- */
  $("#tabs").addEventListener("click", e => {
    const t = e.target.closest("[data-cat]");
    if (!t || !st.all.length) return;
    st.cat = t.dataset.cat; st.q = ""; searchBox.value = ""; st.shown = PAGE; render();
  });
  searchBox.addEventListener("input", e => { st.q = e.target.value.trim(); st.cat = "all"; st.shown = PAGE; if (st.all.length) render(); });
  $("#sort").addEventListener("change", e => { st.sort = e.target.value; st.shown = PAGE; if (st.all.length) render(); });
  more.addEventListener("click", () => { st.shown += PAGE; render(); });
  $("#retryBtn").addEventListener("click", init);
  grid.addEventListener("click", e => {
    const b = e.target.closest("[data-add]"); if (!b) return;
    const product = st.all.find(p => p.id === +b.dataset.add);
    if (product) ACHE.addToCart(product);
  });

  init();
})();
