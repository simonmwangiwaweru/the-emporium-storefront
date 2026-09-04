import { auth, db } from './firebase-init.js';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import { resizeImage } from './resize-image.js';

const CATEGORY_LABELS = {
  teas: 'Teas',
  coffeehoney: 'Coffee & Honey',
  oils: 'Oils & Tonics',
  saltnuts: 'Salt, Nuts & Botanicals',
  spices: 'Spices & Dry Goods'
};

const gate = document.getElementById('gate');
const gateForm = document.getElementById('gate-form');
const gateEmail = document.getElementById('gate-email');
const gatePassword = document.getElementById('gate-password');
const gateError = document.getElementById('gate-error');
const dashboard = document.getElementById('dashboard');
const signOutButton = document.getElementById('sign-out');

const addForm = document.getElementById('add-form');
const addStatus = document.getElementById('add-status');
const productList = document.getElementById('product-list');
const filterCategory = document.getElementById('filter-category');
const adminProductCount = document.getElementById('admin-product-count');
const editDialog = document.getElementById('edit-dialog');
const editForm = document.getElementById('edit-form');
const editClose = document.getElementById('edit-close');
const editCancel = document.getElementById('edit-cancel');
const editStatus = document.getElementById('edit-status');
const editName = document.getElementById('e-name');
const editBrand = document.getElementById('e-brand');
const editCategory = document.getElementById('e-category');
const editPrice = document.getElementById('e-price');
const editUnit = document.getElementById('e-unit');
const editPhoto = document.getElementById('e-photo');
const editStock = document.getElementById('e-stock');

let allProducts = [];
let currentFilter = 'all';
let editingProduct = null;

gateForm.addEventListener('submit', (e) => {
  e.preventDefault();
  gateError.hidden = true;
  signInWithEmailAndPassword(auth, gateEmail.value.trim(), gatePassword.value)
    .then(() => {
      gatePassword.value = '';
    })
    .catch((err) => {
      console.error(err);
      gateError.hidden = false;
    });
});

signOutButton.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error(err);
    alert('Could not sign out. Please try again.');
  }
});

onAuthStateChanged(auth, (user) => {
  gate.hidden = Boolean(user);
  dashboard.hidden = !user;
  if (user) {
    gateError.hidden = true;
    loadProducts();
  }
});

filterCategory.addEventListener('change', () => {
  currentFilter = filterCategory.value;
  renderList();
});

async function loadProducts() {
  try {
    const snap = await getDocs(collection(db, 'products'));
    allProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderList();
  } catch (err) {
    productList.innerHTML = '';
    const msg = document.createElement('p');
    msg.className = 'status-message';
    msg.textContent = 'Could not load products. Please try again shortly.';
    productList.appendChild(msg);
    console.error(err);
  }
}

function renderList() {
  productList.innerHTML = '';
  adminProductCount.textContent = allProducts.length;
  const filtered = allProducts.filter(
    (p) => currentFilter === 'all' || p.category === currentFilter
  );

  if (filtered.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'status-message';
    msg.textContent = 'No products in this category.';
    productList.appendChild(msg);
    return;
  }

  filtered.forEach((product) => productList.appendChild(buildRow(product)));
}

function buildRow(product) {
  const row = document.createElement('div');
  row.className = 'product-row';

  const thumb = document.createElement('div');
  thumb.className = 'row-thumb';
  if (product.image) {
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name || '';
    thumb.appendChild(img);
  } else {
    thumb.textContent = 'No photo';
  }
  row.appendChild(thumb);

  const info = document.createElement('div');
  info.className = 'row-info';

  const name = document.createElement('div');
  name.className = 'row-name';
  name.textContent = product.name || '';
  info.appendChild(name);

  const meta = document.createElement('div');
  meta.className = 'row-meta';
  meta.textContent = `${CATEGORY_LABELS[product.category] || product.category || ''} · ${product.unit || ''}`;
  info.appendChild(meta);

  row.appendChild(info);

  const priceInput = document.createElement('input');
  priceInput.type = 'text';
  priceInput.className = 'row-price-input';
  priceInput.value = product.price || '';
  priceInput.placeholder = 'Contact for price';
  priceInput.addEventListener('change', async () => {
    const newPrice = priceInput.value.trim() || null;
    try {
      await updateDoc(doc(db, 'products', product.id), { price: newPrice });
      product.price = newPrice;
      flash(priceInput);
    } catch (err) {
      console.error(err);
      alert('Could not save price. Please try again.');
    }
  });
  row.appendChild(priceInput);

  const stockLabel = document.createElement('label');
  stockLabel.className = 'row-stock';
  const stockCheckbox = document.createElement('input');
  stockCheckbox.type = 'checkbox';
  stockCheckbox.checked = product.inStock !== false;
  stockCheckbox.addEventListener('change', async () => {
    try {
      await updateDoc(doc(db, 'products', product.id), { inStock: stockCheckbox.checked });
      product.inStock = stockCheckbox.checked;
    } catch (err) {
      console.error(err);
      alert('Could not update stock status. Please try again.');
      stockCheckbox.checked = !stockCheckbox.checked;
    }
  });
  stockLabel.appendChild(stockCheckbox);
  stockLabel.appendChild(document.createTextNode(' In stock'));
  row.appendChild(stockLabel);

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'btn-edit';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => openEditor(product));
  row.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn-danger';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', async () => {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'products', product.id));
      allProducts = allProducts.filter((p) => p.id !== product.id);
      renderList();
    } catch (err) {
      console.error(err);
      alert('Could not delete product. Please try again.');
    }
  });
  row.appendChild(deleteBtn);

  return row;
}

function flash(el) {
  el.classList.add('is-saved');
  setTimeout(() => el.classList.remove('is-saved'), 600);
}

function openEditor(product) {
  editingProduct = product;
  editForm.reset();
  editName.value = product.name || '';
  editBrand.value = product.brand || '';
  editCategory.value = product.category || 'spices';
  editPrice.value = product.price || '';
  editUnit.value = product.unit || '';
  editStock.checked = product.inStock !== false;
  editStatus.textContent = '';
  editDialog.showModal();
  editName.focus();
}

function closeEditor() {
  editDialog.close();
  editingProduct = null;
}

editClose.addEventListener('click', closeEditor);
editCancel.addEventListener('click', closeEditor);
editDialog.addEventListener('cancel', () => {
  editingProduct = null;
});
editDialog.addEventListener('click', (event) => {
  if (event.target === editDialog) closeEditor();
});

editForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!editingProduct) return;

  const name = editName.value.trim();
  const category = editCategory.value;
  if (!name || !category) {
    editStatus.textContent = 'Name and category are required.';
    return;
  }

  editStatus.textContent = 'Saving changes…';
  try {
    const updates = {
      name,
      brand: editBrand.value.trim() || null,
      category,
      price: editPrice.value.trim() || null,
      unit: editUnit.value.trim() || null,
      inStock: editStock.checked
    };
    const photoFile = editPhoto.files[0];
    if (photoFile) updates.image = await resizeImage(photoFile, 800);

    await updateDoc(doc(db, 'products', editingProduct.id), updates);
    Object.assign(editingProduct, updates);
    addStatus.textContent = `Updated "${name}".`;
    closeEditor();
    renderList();
  } catch (err) {
    console.error(err);
    editStatus.textContent = 'Could not save changes. Please try again.';
  }
});

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  addStatus.textContent = 'Saving…';

  const name = document.getElementById('f-name').value.trim();
  const brand = document.getElementById('f-brand').value.trim() || null;
  const category = document.getElementById('f-category').value;
  const price = document.getElementById('f-price').value.trim() || null;
  const unit = document.getElementById('f-unit').value.trim() || null;
  const photoFile = document.getElementById('f-photo').files[0];

  if (!name || !category) {
    addStatus.textContent = 'Name and category are required.';
    return;
  }

  try {
    let image = null;
    if (photoFile) {
      image = await resizeImage(photoFile, 800);
    }

    const docRef = await addDoc(collection(db, 'products'), {
      name,
      brand,
      category,
      price,
      unit,
      image,
      inStock: true
    });

    allProducts.push({
      id: docRef.id,
      name,
      brand,
      category,
      price,
      unit,
      image,
      inStock: true
    });

    addForm.reset();
    addStatus.textContent = `Added "${name}".`;
    renderList();
  } catch (err) {
    console.error(err);
    addStatus.textContent = 'Could not add product. Please try again.';
  }
});
