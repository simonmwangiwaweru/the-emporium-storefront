const PHONE = '254794529421';
const itemsRoot = document.getElementById('cart-page-items');
const emptyState = document.getElementById('cart-page-empty');
const summary = document.getElementById('cart-page-summary');
const count = document.getElementById('cart-page-count');
const subtotal = document.getElementById('cart-subtotal');
const checkout = document.getElementById('cart-page-checkout');

let cart = loadCart();

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('emporium-cart') || '[]');
    return Array.isArray(saved) ? saved.filter((item) => item?.product?.id && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem('emporium-cart', JSON.stringify(cart));
}

function priceNumber(price) {
  const value = String(price || '').replace(/[^0-9.]/g, '');
  return value ? Number(value) : null;
}

function formatKes(value) {
  return `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(value)}`;
}

function whatsappUrl(text) {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
}

function orderMessage() {
  const lines = cart.map((item, index) => {
    const unit = item.product.unit ? ` (${item.product.unit})` : '';
    const price = item.product.price ? `\n   Listed price: ${item.product.price}` : '';
    return `${index + 1}. ${item.product.name || 'Product'}${unit}\n   Quantity: ${item.quantity}${price}`;
  });
  return `Hi, I'd like to place this order:\n\n${lines.join('\n\n')}\n\nPlease confirm availability, delivery, and the final total.`;
}

function quantityControl(item) {
  const control = document.createElement('div');
  control.className = 'cart-page-quantity';
  const decrease = document.createElement('button');
  decrease.type = 'button';
  decrease.textContent = '−';
  decrease.setAttribute('aria-label', `Decrease quantity of ${item.product.name || 'product'}`);
  decrease.disabled = item.quantity <= 1;
  const output = document.createElement('output');
  output.textContent = String(item.quantity);
  const increase = document.createElement('button');
  increase.type = 'button';
  increase.textContent = '+';
  increase.setAttribute('aria-label', `Increase quantity of ${item.product.name || 'product'}`);
  decrease.addEventListener('click', () => changeQuantity(item.product.id, -1));
  increase.addEventListener('click', () => changeQuantity(item.product.id, 1));
  control.append(decrease, output, increase);
  return control;
}

function changeQuantity(productId, change) {
  const item = cart.find((entry) => entry.product.id === productId);
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + change);
  saveCart();
  render();
}

function removeItem(productId) {
  cart = cart.filter((item) => item.product.id !== productId);
  saveCart();
  render();
}

function render() {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  count.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
  itemsRoot.replaceChildren();
  const isEmpty = cart.length === 0;
  emptyState.hidden = !isEmpty;
  summary.hidden = isEmpty;

  let knownSubtotal = 0;
  let hasUnknownPrice = false;
  cart.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'cart-page-item';
    const product = document.createElement('div');
    product.className = 'cart-page-product';
    const image = document.createElement('img');
    image.src = item.product.image || 'images/pantry-hero.jpg';
    image.alt = item.product.name || 'Emporium product';
    const copy = document.createElement('div');
    const name = document.createElement('h2');
    name.textContent = item.product.name || 'Product';
    const unit = document.createElement('p');
    unit.textContent = item.product.unit || 'Emporium pantry good';
    copy.append(name, unit);
    product.append(image, copy);
    const price = document.createElement('p');
    price.className = 'cart-page-price';
    price.textContent = item.product.price || 'Price on request';
    const quantity = quantityControl(item);
    const total = document.createElement('div');
    total.className = 'cart-page-total';
    const numericPrice = priceNumber(item.product.price);
    if (numericPrice === null) {
      total.textContent = 'To confirm';
      hasUnknownPrice = true;
    } else {
      const lineTotal = numericPrice * item.quantity;
      knownSubtotal += lineTotal;
      total.textContent = formatKes(lineTotal);
    }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'cart-page-remove';
    remove.setAttribute('aria-label', `Remove ${item.product.name || 'product'} from cart`);
    remove.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">close</span>';
    remove.addEventListener('click', () => removeItem(item.product.id));
    row.append(product, price, quantity, total, remove);
    itemsRoot.appendChild(row);
  });

  subtotal.textContent = hasUnknownPrice ? `${formatKes(knownSubtotal)} + items to confirm` : formatKes(knownSubtotal);
  checkout.href = isEmpty ? '#' : whatsappUrl(orderMessage());
  checkout.setAttribute('aria-disabled', String(isEmpty));
}

render();
