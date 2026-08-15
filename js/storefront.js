import { db } from './firebase-init.js';
import {
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { initParallax } from './parallax.js';
import { initScrollReveal } from './reveal.js';

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
  card.className = 'product-card' + (product.inStock === false ? ' is-out-of-stock' : '');

  const photo = document.createElement('div');
  photo.className = 'product-photo';

  if (product.image) {
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name || '';
    photo.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'product-placeholder';
    placeholder.innerHTML = '<span class="material-symbols-outlined">nutrition</span>No photo';
    photo.appendChild(placeholder);
  }

  if (product.inStock === false) {
    const badge = document.createElement('span');
    badge.className = 'stock-badge';
    badge.textContent = 'Out of stock';
    photo.appendChild(badge);
  }

  const orderBtn = document.createElement('a');
  orderBtn.className = 'order-btn';
  orderBtn.target = '_blank';
  orderBtn.rel = 'noopener';
  orderBtn.innerHTML = '<span class="material-symbols-outlined">chat</span>';
  const message = `Hi, I'd like to order: ${product.name} (${product.unit || ''}). Price: ${product.price || 'please advise'}.`;
  orderBtn.href = whatsappUrl(message);
  photo.appendChild(orderBtn);

  card.appendChild(photo);

  const info = document.createElement('div');
  info.className = 'product-info';

  const name = document.createElement('h4');
  name.className = 'product-name';
  name.textContent = product.name || '';
  info.appendChild(name);

  if (product.brand) {
    const brand = document.createElement('p');
    brand.className = 'product-brand';
    brand.textContent = product.brand;
    info.appendChild(brand);
  }

  const price = document.createElement('p');
  price.className = 'product-price';
  price.textContent = product.price || 'Contact for price';
  info.appendChild(price);

  if (product.unit) {
    const unit = document.createElement('p');
    unit.className = 'product-unit';
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
    msg.className = 'status-message';
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
    initScrollReveal('.product-card'); // first render only — later filter/search updates use the crossfade instead
  } catch (err) {
    grid.innerHTML = '';
    const msg = document.createElement('p');
    msg.className = 'status-message';
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
initParallax();
initScrollReveal('.collection-card', { stagger: 50 });
