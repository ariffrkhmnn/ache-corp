/* ===== Ache Corp — api.js (Fetch API ke DummyJSON + helper bersama semua halaman) ===== */
window.ACHE = (() => {
  "use strict";

  // Public API: https://dummyjson.com/docs/products
  const API_URL = "https://dummyjson.com/products?limit=0&select=title,price,discountPercentage,rating,stock,category,brand,thumbnail";
  const TIMEOUT_MS = 10000;
  const USD_TO_IDR = 16000; // API memakai USD, toko ini memakai Rupiah
  const SALE_MIN = 10; // diskon >= 10% masuk kategori Sale

  // Kategori toko = subset kategori DummyJSON yang cocok untuk streetwear
  const CATEGORIES = [
    { key: "mens-shirts", label: "Shirts", desc: "Kemeja dan kaos dengan potongan santai. Adem di Malang, tetap rapi dipakai seharian." },
    { key: "mens-shoes", label: "Sneakers", desc: "Sepatu harian sampai sneakers statement buat jalan malam." },
    { key: "sunglasses", label: "Eyewear", desc: "Kacamata hitam buat nutup mata kurang tidur." },
    { key: "mens-watches", label: "Watches", desc: "Jam tangan pelengkap outfit, dari yang kalem sampai yang mencolok." },
    { key: "womens-bags", label: "Bags", desc: "Tas dan tote buat bawa barang seharian." },
    { key: "sale", label: "Sale", desc: `Produk dengan diskon ${SALE_MIN}% atau lebih. Stok terbatas, kehabisan ya sudah.` }
  ];
  const REAL_KEYS = CATEGORIES.filter(c => c.key !== "sale").map(c => c.key);

  const rupiah = n => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
  const toIdr = usd => Math.round((usd * USD_TO_IDR) / 1000) * 1000;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Ubah bentuk data API menjadi bentuk yang dipakai tampilan
  const normalize = ({ id, title, price, discountPercentage = 0, rating = 0, stock = 0, category, brand, thumbnail }) => {
    const pct = Math.round(discountPercentage);
    const final = toIdr(price * (1 - discountPercentage / 100));
    return {
      id, cat: category, rating, stock,
      name: brand ? `${brand} ${title}` : title,
      price: final,
      old: pct > 0 ? toIdr(price) : null,
      pct, img: thumbnail,
      badge: pct >= SALE_MIN ? `-${pct}%` : rating >= 4.7 ? "Top" : ""
    };
  };

  let cache = null;

  // GET semua produk, simpan di memori supaya tidak fetch ulang pada halaman yang sama
  async function load({ force = false } = {}) {
    if (cache && !force) return cache;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(API_URL, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`Server membalas ${res.status}${res.statusText ? " " + res.statusText : ""}.`);
      const { products } = await res.json();
      cache = products.filter(p => REAL_KEYS.includes(p.category)).map(normalize);
      return cache;
    } finally {
      clearTimeout(timer);
    }
  }

  // Pesan error yang ramah untuk pengguna
  const errorMessage = err => {
    if (err && err.name === "AbortError") return "Server terlalu lama merespons. Coba lagi sebentar lagi.";
    if (err instanceof TypeError) return "Tidak bisa terhubung ke server. Cek koneksi internet kamu.";
    return (err && err.message) || "Terjadi kesalahan saat mengambil data.";
  };

  const inCategory = (p, key) => key === "all" || (key === "sale" ? p.pct >= SALE_MIN : p.cat === key);
  const labelOf = key => (CATEGORIES.find(c => c.key === key) || {}).label || key;

  return { API_URL, CATEGORIES, load, errorMessage, inCategory, labelOf, rupiah, esc, $, $$, shopUrl: key => "shop.html" + (key && key !== "all" ? "?cat=" + encodeURIComponent(key) : "") };
})();
