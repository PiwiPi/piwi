/* Configuración básica */
const WHATSAPP_NUMBER = '5491112345678'; // <-- Reemplazá con tu número en formato internacional, sin + ni 0
const INSTAGRAM_URL = 'https://www.instagram.com/piwipi05//'; // <-- Tu perfil
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61580834246359'; //
const MONEDA = 'ARS$'; // puedes cambiar a 'USD ', 'ARS $', etc.

/* Productos del catálogo (ejemplo) */
let PRODUCTS = [];
 // === Auto-catálogo (Opción A) ===
const DEFAULT_PRICE   = 4500;                 // precio por defecto para todos
const PRODUCT_FOLDER  = 'assets/productos';   // carpeta donde subís tus diseños
const PRODUCT_PREFIX  = 'diseno_';            // prefijo de nombre (diseno_001.png, etc.)
const MAX_ITEMS       = 200;                  // hasta cuántos archivos intentar
const EXTENSIONS      = ['png','jpg','jpeg','svg','webp']; // extensiones válidas


/* Utilidades */
const fmt = n => MONEDA + new Intl.NumberFormat('es-AR').format(n
                                                                // ¿Existe un archivo en la web?
async function fileExists(url){
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return res.ok;
  } catch { return false; }
}

// Descubre diseno_001, diseno_002, ... en /assets/productos
async function discoverProducts(){
  const out = [];
  for (let i = 1; i <= MAX_ITEMS; i++) {
    const idx = String(i).padStart(3,'0'); // 001, 002...
    let foundUrl = null;
    for (const ext of EXTENSIONS) {
      const url = `${PRODUCT_FOLDER}/${PRODUCT_PREFIX}${idx}.${ext}`;
      if (await fileExists(url)) { foundUrl = url; break; }
    }
    if (foundUrl){
      out.push({
        id: `auto${i}`,
        name: `Diseño ${i}`,
        price: DEFAULT_PRICE,
        img: foundUrl
      });
    }
  }
  return out;
}


/* Estado del carrito (localStorage) */
const CART_KEY = 'piwipi_cart_v1';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

function saveCart(){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

function addToCart(productId){
  const item = cart.find(i => i.id === productId);
  if(item){ item.qty += 1; } else { cart.push({ id: productId, qty: 1 }); }
  saveCart();
}

function removeFromCart(productId){
  cart = cart.filter(i => i.id !== productId);
  saveCart();
}

function changeQty(productId, delta){
  const item = cart.find(i => i.id === productId);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) removeFromCart(productId);
  else saveCart();
}

function cartTotal(){
  return cart.reduce((sum, i) => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}

function updateCartCount(){
  const count = cart.reduce((n, i) => n + i.qty, 0);
  document.getElementById('cartCount').textContent = count;
}

/* Render catálogo */
function renderProducts(){
  const grid = document.getElementById('productGrid');
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="card">
      <img src="${p.img}" alt="${p.name}">
      <div class="pad">
        <h4>${p.name}</h4>
        <div class="row">
          <span class="price">${fmt(p.price)}</span>
          <button class="btn outline" data-add="${p.id}">Agregar</button>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.add));
  });
}

/* Render carrito */
function renderCart(){
  const list = document.getElementById('cartList');
  const empty = document.getElementById('cartEmpty');
  const summary = document.getElementById('cartSummary');

  if(cart.length === 0){
    list.innerHTML = '';
    empty.style.display = 'block';
    summary.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  summary.style.display = 'flex';

  list.innerHTML = cart.map(i => {
    const p = PRODUCTS.find(p => p.id === i.id);
    if(!p) return '';
    const line = p.price * i.qty;
    return `
      <div class="cart-item">
        <img src="${p.img}" alt="${p.name}">
        <div>
          <div><strong>${p.name}</strong></div>
          <div class="muted small">${fmt(p.price)} x ${i.qty} = <strong>${fmt(line)}</strong></div>
        </div>
        <div>
          <button class="btn outline" data-qty='{"id":"${i.id}","d":-1}'>-</button>
          <button class="btn outline" data-qty='{"id":"${i.id}","d":1}'>+</button>
          <button class="btn" style="margin-left:6px" data-remove="${i.id}">Quitar</button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('cartTotal').textContent = fmt(cartTotal());

  list.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.remove));
  });
  list.querySelectorAll('[data-qty]').forEach(btn => {
    const data = JSON.parse(btn.dataset.qty);
    btn.addEventListener('click', () => changeQty(data.id, data.d));
  });
}

/* Checkout por WhatsApp */
function checkout(){
  if(cart.length === 0) return alert('Tu carrito está vacío.');
  const lines = cart.map(i => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return `• ${p.name} x ${i.qty} = ${fmt(p.price * i.qty)}`;
  });
  const total = fmt(cartTotal());
  const message = `Hola! Quiero finalizar mi compra en *Piwi Pi*:%0A%0A${lines.join('%0A')}%0A%0ATotal: *${total}*%0A%0AMi nombre: %0AMi email o WhatsApp para recibir los archivos:`;
  const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${message}`;
  window.open(url, '_blank');
}

/* Contacto: abre mailto */
function setupContactForm(){
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const subject = encodeURIComponent('Consulta desde Piwi Pi');
    const body = encodeURIComponent(
      `Nombre: ${data.get('nombre')}
Email: ${data.get('email')}
Mensaje:
${data.get('mensaje')}`
    );
    window.location.href = `mailto:${EMAIL_DESTINO}?subject=${subject}&body=${body}`;
  });
}

/* WhatsApp & Instagram botones */
function setupQuickLinks(){
  const wa = document.getElementById('whatsappBtn');
  wa.href = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}`;
  const ig = document.querySelector('a[href^="https://instagram.com/"]');
  ig.href = INSTAGRAM_URL;
}

/* Menú responsive */
function setupNav(){
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  toggle.addEventListener('click', () => menu.classList.toggle('open'));
}

/* Limpieza de carrito */
function setupCartActions(){
  document.getElementById('clearCartBtn').addEventListener('click', () => {
    if(confirm('¿Vaciar carrito?')){
      cart = [];
      saveCart();
    }
  });
  document.getElementById('checkoutBtn').addEventListener('click', checkout);
}

/* Init */
(async function init(){
  document.getElementById('year').textContent = new Date().getFullYear();

  // 1) Cargar productos automáticamente desde /assets/productos
  PRODUCTS = await discoverProducts();

  // 2) Inicializar la interfaz
  renderProducts();
  renderCart();
  updateCartCount();
  setupContactForm();
  setupQuickLinks();
  setupNav();
  setupCartActions();
})();
