import { db } from './firebase-init.js';
import {
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { initScrollReveal } from './reveal.js';

const PHONE = '254794529421'; // 0794529421 with country code, no leading zero

const CATEGORY_LABELS = {
  all: 'All',
  tea: 'Tea',
  'tea-bags': 'Tea bags',
  coffee: 'Coffee',
  spices: 'Spices',
  herbs: 'Herbs',
  salt: 'Salt',
  nuts: 'Nuts',
  'dried-fruits': 'Dried fruits',
  honey: 'Honey',
  oils: 'Oils',
  others: 'Others'
};

function productCategory(product) {
  const current = product.category || '';
  const text = `${product.name || ''} ${product.brand || ''} ${product.unit || ''}`.toLowerCase();
  if (current === 'teas') return /\b(bag|bags|teabag|teabags)\b/.test(text) ? 'tea-bags' : 'tea';
  if (current === 'coffeehoney') return /honey|asali/.test(text) ? 'honey' : 'coffee';
  if (current === 'saltnuts') return /salt|pink salt/.test(text) ? 'salt' : /nut|cashew|almond|peanut/.test(text) ? 'nuts' : 'others';
  if (current === 'spices') return /herb|oregano|thyme|rosemary|basil|mint/.test(text) ? 'herbs' : /dried.?fruit|raisin|date|cranberr|prune/.test(text) ? 'dried-fruits' : 'spices';
  if (current === 'oils') return /tonic/.test(text) ? 'others' : 'oils';
  if (CATEGORY_LABELS[current]) return current;
  return 'others';
}

const grid = document.getElementById('product-grid');
const gridCount = document.getElementById('grid-count');
const featuredGrid = document.getElementById('featured-grid');
const searchInput = document.getElementById('search-input');
const headerSearchForm = document.getElementById('header-search-form');
const headerSearchInput = document.getElementById('header-search-input');
const headerSearchSuggestions = document.getElementById('header-search-suggestions');
const shopMenuToggle = document.getElementById('shop-menu-toggle');
const shopMenuPanel = document.getElementById('shop-menu-panel');
const collectionsScroll = document.getElementById('collections-scroll');
const productDialog = document.getElementById('product-dialog');
const productStories = document.getElementById('product-stories');
const dialogVisual = document.getElementById('product-dialog-visual');
const dialogClose = productDialog.querySelector('.product-dialog__close');
const dialogCategory = document.getElementById('product-dialog-category');
const dialogTitle = document.getElementById('product-dialog-title');
const dialogBrand = document.getElementById('product-dialog-brand');
const dialogPrice = document.getElementById('product-dialog-price');
const dialogUnit = document.getElementById('product-dialog-unit');
const dialogStock = document.getElementById('product-dialog-stock');
const dialogOrder = document.getElementById('product-dialog-order');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let allProducts = [];
let currentCategory = 'all';
let searchTerm = '';
let detailState = 'closed';
let detailProduct = null;
let detailSource = null;
let detailFlight = null;
let detailAnimation = null;

function whatsappUrl(text) {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
}

// Wire every generic "message us" entry point (header, hero, bottom nav, footer)
const genericMessage = "Hi, I'd like to know more about your products.";
['header-whatsapp', 'nav-whatsapp', 'footer-whatsapp', 'refill-whatsapp'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.href = whatsappUrl(genericMessage);
});

const wholesaleWhatsApp = document.getElementById('wholesale-whatsapp');
if (wholesaleWhatsApp) {
  wholesaleWhatsApp.href = whatsappUrl("Hi, I'd like to ask about wholesale prices and availability.");
}

function matchesFilters(product) {
  const inCategory = currentCategory === 'all' || productCategory(product) === currentCategory;
  if (!inCategory) return false;
  if (!searchTerm) return true;
  const haystack = `${product.name || ''} ${product.brand || ''}`.toLowerCase();
  return haystack.includes(searchTerm);
}

function buildCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card' + (product.inStock === false ? ' is-out-of-stock' : '');
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `View details for ${product.name || 'this product'}`);

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

  const category = document.createElement('p');
  category.className = 'product-category';
  category.textContent = CATEGORY_LABELS[productCategory(product)] || 'Others';
  info.appendChild(category);

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

  card.addEventListener('click', (event) => {
    if (event.target.closest('.order-btn')) return;
    openProductDetail(product, photo, !reduceMotion);
  });
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    // Keyboard actions stay immediate so frequent browsing never feels delayed.
    openProductDetail(product, photo, false);
  });
  return card;
}

function productMessage(product) {
  return `Hi, I'd like to order: ${product.name} (${product.unit || ''}). Price: ${product.price || 'please advise'}.`;
}

function prepareDetail(product, source) {
  detailProduct = product;
  detailSource = source;
  dialogCategory.textContent = CATEGORY_LABELS[productCategory(product)] || 'Others';
  dialogTitle.textContent = product.name || 'The Emporium selection';
  dialogBrand.textContent = product.brand || '';
  dialogBrand.hidden = !product.brand;
  dialogPrice.textContent = product.price || 'Contact for price';
  dialogUnit.textContent = product.unit || '';
  dialogUnit.hidden = !product.unit;
  dialogStock.textContent = product.inStock === false ? 'Currently unavailable' : 'Available to order';
  dialogStock.classList.toggle('is-out', product.inStock === false);
  dialogOrder.href = whatsappUrl(productMessage(product));
  dialogOrder.hidden = product.inStock === false;

  const visual = source.cloneNode(true);
  visual.querySelectorAll('.order-btn, .stock-badge').forEach((element) => element.remove());
  dialogVisual.replaceChildren(...visual.childNodes);
}

function makeFlight(source, rect) {
  const flight = source.cloneNode(true);
  flight.className = 'detail-flying-image';
  flight.querySelectorAll('.order-btn, .stock-badge').forEach((element) => element.remove());
  flight.style.left = `${rect.left}px`;
  flight.style.top = `${rect.top}px`;
  flight.style.width = `${rect.width}px`;
  flight.style.height = `${rect.height}px`;
  productDialog.appendChild(flight);
  return flight;
}

function flyImage(flight, from, to, duration) {
  flight.style.left = `${from.left}px`;
  flight.style.top = `${from.top}px`;
  flight.style.width = `${from.width}px`;
  flight.style.height = `${from.height}px`;
  flight.style.transform = 'none';
  const dx = to.left - from.left;
  const dy = to.top - from.top;
  const scaleX = to.width / from.width;
  const scaleY = to.height / from.height;
  detailAnimation = flight.animate(
    [
      { transform: 'translate(0, 0) scale(1, 1)' },
      { transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})` }
    ],
    { duration, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'forwards' }
  );
  return detailAnimation.finished.catch(() => undefined);
}

function finishDetailClose() {
  detailFlight?.remove();
  detailFlight = null;
  detailAnimation = null;
  detailSource?.style.removeProperty('opacity');
  dialogVisual.style.visibility = '';
  dialogVisual.replaceChildren();
  productDialog.classList.remove('is-opening', 'is-closing');
  if (productDialog.open) productDialog.close();
  document.body.classList.remove('product-dialog-open');
  const focusTarget = detailSource?.closest('.product-card');
  detailProduct = null;
  detailSource = null;
  detailState = 'closed';
  focusTarget?.focus({ preventScroll: true });
}

async function openProductDetail(product, source, animate) {
  if (detailState !== 'closed') return;
  detailState = animate ? 'opening' : 'open';
  prepareDetail(product, source);
  document.body.classList.add('product-dialog-open');
  if (animate) productDialog.classList.add('is-opening');
  productDialog.showModal();

  if (animate) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    productDialog.classList.remove('is-opening');
  }

  if (!animate) {
    dialogClose.focus();
    return;
  }

  source.style.opacity = '0';
  dialogVisual.style.visibility = 'hidden';
  await new Promise((resolve) => requestAnimationFrame(resolve));
  if (detailState !== 'opening') return;

  detailFlight = makeFlight(source, source.getBoundingClientRect());
  await flyImage(detailFlight, source.getBoundingClientRect(), dialogVisual.getBoundingClientRect(), 400);
  if (detailState !== 'opening') return;
  detailFlight.remove();
  detailFlight = null;
  detailAnimation = null;
  dialogVisual.style.visibility = '';
  detailState = 'open';
  dialogClose.focus();
}

async function closeProductDetail(animate) {
  if (detailState === 'closed' || detailState === 'closing') return;
  const source = detailSource;
  detailState = 'closing';
  productDialog.classList.add('is-closing');

  if (!animate || reduceMotion || !source) {
    finishDetailClose();
    return;
  }

  let from;
  if (detailFlight) {
    from = detailFlight.getBoundingClientRect();
    detailAnimation?.cancel();
  } else {
    from = dialogVisual.getBoundingClientRect();
    detailFlight = makeFlight(source, from);
  }
  dialogVisual.style.visibility = 'hidden';
  await flyImage(detailFlight, from, source.getBoundingClientRect(), 360);
  finishDetailClose();
}

function featuredProducts() {
  const picks = [];
  const representedCategories = new Set();
  const available = allProducts.filter((product) => product.inStock !== false);

  // Lead with variety so this is a considered edit, not merely the first records returned.
  available.forEach((product) => {
    const categoryKey = productCategory(product);
    if (picks.length < 4 && !representedCategories.has(categoryKey)) {
      picks.push(product);
      representedCategories.add(categoryKey);
    }
  });
  available.forEach((product) => {
    if (picks.length < 4 && !picks.includes(product)) picks.push(product);
  });
  return picks;
}

function renderFeatured() {
  if (!featuredGrid) return;
  featuredGrid.innerHTML = '';
  featuredProducts().forEach((product) => featuredGrid.appendChild(buildCard(product)));
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

  document.querySelectorAll('.collection-card').forEach((button) => {
    const isActive = button.dataset.category === currentCategory;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

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

function initProductStories() {
  if (!productStories) return;
  const notes = [...productStories.querySelectorAll('[data-story-note]')];
  const images = [...productStories.querySelectorAll('[data-story-image]')];

  const setActiveStory = (index) => {
    notes.forEach((note, noteIndex) => {
      note.classList.toggle('is-active', noteIndex === index);
      note.classList.toggle('is-past', noteIndex < index);
    });
    images.forEach((image, imageIndex) => {
      image.classList.toggle('is-active', imageIndex === index);
      image.classList.toggle('is-past', imageIndex < index);
    });
  };

  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    const visibleNote = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visibleNote) setActiveStory(Number(visibleNote.target.dataset.storyNote));
  }, { threshold: [0.5], rootMargin: '-15% 0px -15% 0px' });

  notes.forEach((note) => observer.observe(note));
}

async function loadProducts() {
  try {
    const snap = await getDocs(collection(db, 'products'));
    allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderFeatured();
    render();
    renderHeaderSuggestions();
    initScrollReveal('.product-card', { stagger: 44 });
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
  applySearch(e.target.value);
});

function applySearch(value) {
  const query = value.trim();
  searchTerm = query.toLowerCase();
  searchInput.value = query;
  headerSearchInput.value = query;
  render();
}

function closeHeaderSuggestions() {
  headerSearchSuggestions.hidden = true;
}

function renderHeaderSuggestions() {
  const query = headerSearchInput.value.trim().toLowerCase();
  headerSearchSuggestions.replaceChildren();
  if (!query) {
    closeHeaderSuggestions();
    return;
  }

  const matches = allProducts.filter((product) => {
    const searchableText = `${product.name || ''} ${product.brand || ''} ${CATEGORY_LABELS[productCategory(product)] || ''}`.toLowerCase();
    return searchableText.includes(query);
  }).slice(0, 5);

  if (matches.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'header-search-empty';
    empty.textContent = 'No matching products';
    headerSearchSuggestions.appendChild(empty);
  } else {
    matches.forEach((product) => {
      const result = document.createElement('button');
      result.type = 'button';
      result.className = 'header-search-result';
      result.dataset.productId = product.id;
      result.setAttribute('role', 'option');
      const name = document.createElement('span');
      name.textContent = product.name || 'Product';
      const details = document.createElement('small');
      details.textContent = `${CATEGORY_LABELS[productCategory(product)] || 'Others'}${product.price ? ` · ${product.price}` : ''}`;
      result.append(name, details);
      headerSearchSuggestions.appendChild(result);
    });
  }
  headerSearchSuggestions.hidden = false;
}

function showCategory(category) {
  currentCategory = category;
  renderWithTransition();
  document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

headerSearchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  applySearch(headerSearchInput.value);
  closeHeaderSuggestions();
  document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

headerSearchInput.addEventListener('input', () => {
  applySearch(headerSearchInput.value);
  renderHeaderSuggestions();
});

headerSearchInput.addEventListener('focus', renderHeaderSuggestions);

headerSearchSuggestions.addEventListener('click', (event) => {
  const result = event.target.closest('[data-product-id]');
  if (!result) return;
  const product = allProducts.find((item) => item.id === result.dataset.productId);
  if (!product) return;
  applySearch(product.name || '');
  closeHeaderSuggestions();
  document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

shopMenuToggle.addEventListener('click', () => {
  const isOpen = shopMenuToggle.getAttribute('aria-expanded') === 'true';
  shopMenuToggle.setAttribute('aria-expanded', String(!isOpen));
  shopMenuPanel.hidden = isOpen;
});

shopMenuPanel.addEventListener('click', (event) => {
  const categoryLink = event.target.closest('[data-nav-category]');
  if (!categoryLink) return;
  event.preventDefault();
  shopMenuPanel.hidden = true;
  shopMenuToggle.setAttribute('aria-expanded', 'false');
  showCategory(categoryLink.dataset.navCategory);
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.shop-menu')) {
    shopMenuPanel.hidden = true;
    shopMenuToggle.setAttribute('aria-expanded', 'false');
  }
  if (!event.target.closest('.header-search-wrap')) closeHeaderSuggestions();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  shopMenuPanel.hidden = true;
  shopMenuToggle.setAttribute('aria-expanded', 'false');
  closeHeaderSuggestions();
});

document.getElementById('nav-home').addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

dialogClose.addEventListener('click', () => closeProductDetail(true));
productDialog.addEventListener('click', (event) => {
  if (event.target === productDialog) closeProductDetail(true);
});
productDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  // Escape is keyboard-initiated, so it closes without a movement transition.
  closeProductDetail(false);
});

loadProducts();
initScrollReveal('.collection-card', { stagger: 50 });
initProductStories();

// Whole sections contain essential page content. Keep them visible even if a
// browser fails to deliver an observer callback; cards retain the subtle cue.
