import { db } from './firebase-init.js';
import {
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const PHONE = '254794529421'; // 0794529421 with country code, no leading zero

const CATEGORY_LABELS = {
  all: 'All',
  teas: 'Teas',
  coffeehoney: 'Coffee & Honey',
  oils: 'Oils & Tonics',
  saltnuts: 'Salt, Nuts & Botanicals',
  spices: 'Spices & Dry Goods'
};

const grid = document.getElementById('product-grid');
const gridCount = document.getElementById('grid-count');
const searchInput = document.getElementById('search-input');
const collectionsScroll = document.getElementById('collections-scroll');

let allProducts = [];
let currentCategory = 'all';
let searchTerm = '';

function whatsappUrl(text) {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
}

// Wire every generic "message us" entry point (header, hero, bottom nav, footer)
const genericMessage = "Hi, I'd like to know more about your products.";
['header-whatsapp', 'hero-whatsapp', 'nav-whatsapp', 'footer-whatsapp'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.href = whatsappUrl(genericMessage);
});

function matchesFilters(product) {
  const inCategory = currentCategory === 'all' || product.category === currentCategory;
  if (!inCategory) return false;
  if (!searchTerm) return true;
  const haystack = `${product.name || ''} ${product.brand || ''}`.toLowerCase();
  return haystack.includes(searchTerm);
}

function buildCard(product) {
  const card = document.createElement('div');
  card.className =
    'bg-surface-container-lowest rounded-md overflow-hidden shadow-sm' +
    (product.inStock === false ? ' opacity-60' : '');

  const photo = document.createElement('div');
  photo.className = 'aspect-square bg-surface-container-low relative';

  if (product.image) {
    const img = document.createElement('img');
    img.className = 'w-full h-full object-cover';
    img.src = product.image;
    img.alt = product.name || '';
    photo.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'w-full h-full flex flex-col items-center justify-center text-on-surface-variant text-[10px] text-center';
    placeholder.innerHTML = '<span class="material-symbols-outlined text-lg opacity-50">nutrition</span>No photo';
    photo.appendChild(placeholder);
  }

  if (product.inStock === false) {
    const badge = document.createElement('span');
    badge.className = 'absolute top-1 left-1 bg-secondary text-white text-[9px] font-semibold px-1.5 py-0.5 rounded';
    badge.textContent = 'Out of stock';
    photo.appendChild(badge);
  }

  const orderBtn = document.createElement('a');
  orderBtn.className = 'absolute bottom-1 right-1 bg-whatsapp text-white w-6 h-6 rounded-full flex items-center justify-center shadow active:scale-90 transition-transform';
  orderBtn.target = '_blank';
  orderBtn.rel = 'noopener';
  orderBtn.innerHTML = '<span class="material-symbols-outlined text-sm">chat</span>';
  const message = `Hi, I'd like to order: ${product.name} (${product.unit || ''}). Price: ${product.price || 'please advise'}.`;
  orderBtn.href = whatsappUrl(message);
  photo.appendChild(orderBtn);

  card.appendChild(photo);

  const info = document.createElement('div');
  info.className = 'p-1.5 space-y-0.5';

  const name = document.createElement('h4');
  name.className = 'font-body text-[11px] leading-tight text-on-surface line-clamp-2 h-[28px]';
  name.textContent = product.name || '';
  info.appendChild(name);

  const price = document.createElement('p');
  price.className = 'font-display font-bold text-primary-container text-sm pt-0.5';
  price.textContent = product.price || 'Contact for price';
  info.appendChild(price);

  if (product.unit) {
    const unit = document.createElement('p');
    unit.className = 'text-[10px] text-on-surface-variant truncate';
    unit.textContent = product.unit;
    info.appendChild(unit);
  }

  card.appendChild(info);
  return card;
}

function renderWithTransition() {
  if (document.startViewTransition) {
    document.startViewTransition(() => render());
  } else {
    render();
  }
}

function render() {
  grid.innerHTML = '';
  const filtered = allProducts.filter(matchesFilters);

  gridCount.textContent = `${CATEGORY_LABELS[currentCategory] || 'All'} · ${filtered.length}`;

  if (filtered.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'col-span-3 text-center text-on-surface-variant py-lg';
    msg.textContent = 'No products found.';
    grid.appendChild(msg);
    return;
  }

  filtered.forEach((product) => grid.appendChild(buildCard(product)));
}

async function loadProducts() {
  try {
    const snap = await getDocs(collection(db, 'products'));
    allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  } catch (err) {
    grid.innerHTML = '';
    const msg = document.createElement('p');
    msg.className = 'col-span-3 text-center text-on-surface-variant py-lg';
    msg.textContent = 'Could not load products. Please try again shortly.';
    grid.appendChild(msg);
    console.error(err);
  }
}

collectionsScroll.addEventListener('click', (e) => {
  const btn = e.target.closest('.collection-card');
  if (!btn) return;
  currentCategory = btn.dataset.category;
  renderWithTransition();
  document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

searchInput.addEventListener('input', (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  renderWithTransition();
});

document.getElementById('nav-home').addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('nav-search').addEventListener('click', () => {
  setTimeout(() => searchInput.focus(), 400);
});

loadProducts();
