(function(){
  const STORAGE_KEY = 'dp_pagina3_state';

  const st = (typeof dpGetState === 'function') ? dpGetState() : { config:{business:{}}, products:[] };
  const cfg = (typeof dpGetConfig === 'function') ? dpGetConfig() : (st?.config || {});
  const business = cfg?.business || st?.config?.business || st?.meta?.business || {};
  const defaults = {
    businessName: business.name || 'Dinamita Gym',
    heroTitle: 'Explota tu potencial',
    heroSubtitle: 'Página 3.0 ahora ya se comporta como una web real con tienda, categoría y producto.',
    bannerPrimary: '',
    bannerSecondary: '',
    phone: business.phone || '',
    address: business.address || '',
    hours: '',
    maps: '',
    facebook: '',
    instagram: '',
    route: 'inicio',
    selectedCategory: '',
    selectedProductId: (st.products && st.products[0] && st.products[0].id) || '',
    limitCatalog: 8,
    search: '',
    cart: []
  };

  const state = loadState();
  const els = {
    businessName: document.getElementById('pg3-businessName'),
    heroTitle: document.getElementById('pg3-heroTitle'),
    heroSubtitle: document.getElementById('pg3-heroSubtitle'),
    bannerPrimaryFile: document.getElementById('pg3-bannerPrimaryFile'),
    bannerPrimaryPreview: document.getElementById('pg3-bannerPrimaryPreview'),
    bannerPrimaryClear: document.getElementById('pg3-bannerPrimaryClear'),
    bannerSecondaryFile: document.getElementById('pg3-bannerSecondaryFile'),
    bannerSecondaryPreview: document.getElementById('pg3-bannerSecondaryPreview'),
    bannerSecondaryClear: document.getElementById('pg3-bannerSecondaryClear'),
    phone: document.getElementById('pg3-phone'),
    address: document.getElementById('pg3-address'),
    hours: document.getElementById('pg3-hours'),
    maps: document.getElementById('pg3-maps'),
    facebook: document.getElementById('pg3-facebook'),
    instagram: document.getElementById('pg3-instagram'),
    limitCatalog: document.getElementById('pg3-limitCatalog'),
    search: document.getElementById('pg3-search'),
    routeLabel: document.getElementById('pg3-currentRouteLabel'),
    previewRoot: document.getElementById('pg3-previewRoot'),
    saveBtn: document.getElementById('pg3-saveBtn'),
    resetBtn: document.getElementById('pg3-resetBtn'),
    nav: document.getElementById('pg3-routeNav')
  };

  hydrateForm();
  bindEditor();
  renderPreview();

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return { ...defaults };
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed, cart: Array.isArray(parsed.cart) ? parsed.cart : [] };
    }catch(e){
      console.warn('Página 3.0 state error', e);
      return { ...defaults };
    }
  }

  function saveState(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function hydrateForm(){
    els.businessName.value = state.businessName || '';
    els.heroTitle.value = state.heroTitle || '';
    els.heroSubtitle.value = state.heroSubtitle || '';
    setBannerPreview(els.bannerPrimaryPreview, state.bannerPrimary);
    setBannerPreview(els.bannerSecondaryPreview, state.bannerSecondary);
    els.phone.value = state.phone || '';
    els.address.value = state.address || '';
    els.hours.value = state.hours || '';
    els.maps.value = state.maps || '';
    els.facebook.value = state.facebook || '';
    els.instagram.value = state.instagram || '';
    els.limitCatalog.value = state.limitCatalog || 8;
    els.search.value = state.search || '';
    syncRouteButtons();
  }

  function bindEditor(){
    bindInput(els.businessName, 'businessName');
    bindInput(els.heroTitle, 'heroTitle');
    bindInput(els.heroSubtitle, 'heroSubtitle');
    bindImageInput(els.bannerPrimaryFile, 'bannerPrimary', els.bannerPrimaryPreview);
    bindImageInput(els.bannerSecondaryFile, 'bannerSecondary', els.bannerSecondaryPreview);
    els.bannerPrimaryClear.addEventListener('click', ()=>{ state.bannerPrimary=''; if(els.bannerPrimaryFile) els.bannerPrimaryFile.value=''; setBannerPreview(els.bannerPrimaryPreview,''); renderPreview(); saveState(); });
    els.bannerSecondaryClear.addEventListener('click', ()=>{ state.bannerSecondary=''; if(els.bannerSecondaryFile) els.bannerSecondaryFile.value=''; setBannerPreview(els.bannerSecondaryPreview,''); renderPreview(); saveState(); });
    bindInput(els.phone, 'phone');
    bindInput(els.address, 'address');
    bindInput(els.hours, 'hours');
    bindInput(els.maps, 'maps');
    bindInput(els.facebook, 'facebook');
    bindInput(els.instagram, 'instagram');
    els.limitCatalog.addEventListener('input', e=>{
      const n = Number(e.target.value || 8);
      state.limitCatalog = Math.max(4, Math.min(60, n));
      renderPreview();
    });
    bindInput(els.search, 'search');
    els.saveBtn.addEventListener('click', ()=>{ saveState(); alert('Página 3.0 guardada.'); });
    els.resetBtn.addEventListener('click', ()=>{
      Object.assign(state, JSON.parse(JSON.stringify(defaults)));
      hydrateForm();
      renderPreview();
      saveState();
    });
    els.nav.querySelectorAll('[data-route]').forEach(btn=>{
      btn.addEventListener('click', ()=> navigate(btn.dataset.route));
    });
  }

  function bindInput(el, key){
    el.addEventListener('input', e=>{ state[key] = e.target.value; renderPreview(); });
  }

  function bindImageInput(el, key, previewEl){
    if(!el) return;
    el.addEventListener('change', e=>{
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      if(!file.type.startsWith('image/')){ alert('Archivo no es imagen.'); return; }
      const reader = new FileReader();
      reader.onload = ()=>{ state[key] = String(reader.result || ''); setBannerPreview(previewEl, state[key]); renderPreview(); saveState(); };
      reader.onerror = ()=> alert('No se pudo procesar la imagen.');
      reader.readAsDataURL(file);
    });
  }

  function setBannerPreview(el, src){
    if(!el) return;
    if(src){ el.src = src; el.style.display='block'; }
    else { el.removeAttribute('src'); el.style.display='none'; }
  }

  function navigate(route, opts={}){
    state.route = route;
    if(opts.category !== undefined) state.selectedCategory = opts.category;
    if(route !== 'tienda' && route !== 'categoria') state.search = state.search || '';
    if(opts.productId !== undefined) state.selectedProductId = opts.productId;
    syncRouteButtons();
    renderPreview();
  }

  function syncRouteButtons(){
    els.nav.querySelectorAll('[data-route]').forEach(btn=>{
      const active = btn.dataset.route === state.route;
      btn.classList.toggle('active', active);
      btn.classList.toggle('ghost', !active);
    });
  }

  function allProducts(){
    return Array.isArray(st.products) ? st.products.slice() : [];
  }

  function categories(){
    const set = new Set(allProducts().map(p=> normalizeCat(p.category)).filter(Boolean));
    return Array.from(set);
  }

  function normalizeCat(v){
    return String(v||'General').trim() || 'General';
  }

  function featuredProducts(){
    return filteredProducts().slice(0, Math.max(1, Number(state.limitCatalog||8)));
  }

  function filteredProducts(){
    const q = String(state.search || '').trim().toLowerCase();
    const selected = normalizeCat(state.selectedCategory || '');
    return allProducts().filter(p=>{
      const byCat = !selected || selected === 'General' ? true : normalizeCat(p.category) === selected;
      const hay = [p.name,p.sku,p.barcode,p.category].map(v=>String(v||'').toLowerCase()).join(' ');
      const bySearch = !q || hay.includes(q);
      return byCat && bySearch;
    });
  }

  function latestProducts(){
    return allProducts().slice().sort((a,b)=> String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))).slice(0,4);
  }

  function productsByCategory(cat){
    return allProducts().filter(p=> normalizeCat(p.category) === normalizeCat(cat));
  }

  function selectedProduct(){
    return allProducts().find(p=> p.id === state.selectedProductId) || allProducts()[0] || null;
  }

  function cartItems(){
    return Array.isArray(state.cart) ? state.cart : [];
  }

  function cartDetailedItems(){
    return cartItems().map(item => {
      const product = allProducts().find(p => p.id === item.id);
      if(!product) return null;
      const qty = Math.max(1, Number(item.qty || 1));
      const price = Number(product.price || 0);
      return { product, qty, subtotal: qty * price };
    }).filter(Boolean);
  }

  function cartCount(){
    return cartDetailedItems().reduce((acc, item) => acc + item.qty, 0);
  }

  function cartTotal(){
    return cartDetailedItems().reduce((acc, item) => acc + item.subtotal, 0);
  }

  function addToCart(productId){
    const product = allProducts().find(p => p.id === productId);
    if(!product) return;
    const existing = cartItems().find(item => item.id === productId);
    if(existing) existing.qty = Math.max(1, Number(existing.qty || 1) + 1);
    else state.cart.push({ id: productId, qty: 1 });
    saveState();
    renderPreview();
  }

  function updateCartQty(productId, delta){
    const item = cartItems().find(entry => entry.id === productId);
    if(!item) return;
    item.qty = Math.max(1, Number(item.qty || 1) + delta);
    saveState();
    renderPreview();
  }

  function removeFromCart(productId){
    state.cart = cartItems().filter(entry => entry.id !== productId);
    saveState();
    renderPreview();
  }

  function clearCart(){
    state.cart = [];
    saveState();
    renderPreview();
  }

  function normalizePhone(raw){
    const digits = String(raw || '').replace(/\D+/g,'');
    if(!digits) return '';
    if(digits.startsWith('521')) return digits;
    if(digits.startsWith('52') && digits.length === 12) return '521' + digits.slice(2);
    if(digits.length === 10) return '521' + digits;
    return digits;
  }

  function openWhatsApp(message){
    const phone = normalizePhone(state.phone || business.phone || '');
    if(!phone){
      alert('Captura un teléfono o WhatsApp válido en Página 3.0.');
      return;
    }
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function sendCartToWhatsApp(){
    const items = cartDetailedItems();
    if(!items.length){
      alert('Agrega productos al carrito para enviarlos.');
      return;
    }
    const lines = items.map(item => `- ${item.product.name} x${item.qty} ${money(item.subtotal)}`);
    const message = ['Hola, me interesa este pedido:', '', ...lines, '', `Total: ${money(cartTotal())}`].join('\n');
    openWhatsApp(message);
  }

  function renderPreview(){
    const categoryLabel = state.route === 'categoria' ? ` · ${state.selectedCategory || 'Sin categoría'}` : '';
    els.routeLabel.textContent = `Ruta actual: ${routeName(state.route)}${categoryLabel}`;
    els.previewRoot.innerHTML = `
      <div class="pg3-web">
        ${renderHeader()}
        ${renderHero()}
        <div class="pg3-content">
          ${renderCurrentRoute()}
          ${renderCarritoPanel()}
          ${renderContacto()}
        </div>
        ${renderFooter()}
      </div>
    `;
    bindPreviewNav();
  }

  function bindPreviewNav(){
    els.previewRoot.querySelectorAll('[data-preview-route]').forEach(btn=>{
      btn.addEventListener('click', ()=> navigate(btn.dataset.previewRoute, {
        category: btn.dataset.category,
        productId: btn.dataset.productId
      }));
    });
    const search = els.previewRoot.querySelector('[data-preview-search]');
    if(search){
      search.addEventListener('input', e=>{
        state.search = e.target.value || '';
        if(state.route !== 'tienda') state.route = 'tienda';
        renderPreview();
      });
    }
    els.previewRoot.querySelectorAll('[data-add-cart]').forEach(btn => {
      btn.addEventListener('click', () => addToCart(btn.dataset.addCart));
    });
    els.previewRoot.querySelectorAll('[data-cart-delta]').forEach(btn => {
      btn.addEventListener('click', () => updateCartQty(btn.dataset.cartId, Number(btn.dataset.cartDelta || 0)));
    });
    els.previewRoot.querySelectorAll('[data-cart-remove]').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(btn.dataset.cartRemove));
    });
    const clearBtn = els.previewRoot.querySelector('[data-cart-clear]');
    if(clearBtn) clearBtn.addEventListener('click', clearCart);
    const sendBtn = els.previewRoot.querySelector('[data-cart-send]');
    if(sendBtn) sendBtn.addEventListener('click', sendCartToWhatsApp);
    els.previewRoot.querySelectorAll('[data-product-wa]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = allProducts().find(item => item.id === btn.dataset.productWa);
        if(!p) return;
        openWhatsApp(`Hola, me interesa:\n${p.name}\nPrecio: ${money(p.price)}`);
      });
    });
  }

  function renderHeader(){
    const logo = business.logoDataUrl || st?.config?.business?.logoDataUrl || st?.meta?.business?.logoDataUrl || '';
    const logoHtml = logo ? `<img class="pg3-logo" src="${escapeHtmlAttr(logo)}" alt="Logo">` : `<div class="pg3-logoFallback">${escapeHtml(initials(state.businessName))}</div>`;
    return `
      <header class="pg3-webHeader">
        <div class="pg3-webBrand">
          <div class="pg3-webBrandRow">${logoHtml}<div><strong>${escapeHtml(state.businessName)}</strong><small>Página 3.0 · Router funcional</small></div></div>
        </div>
        <nav class="pg3-webNav">
          ${navBtn('inicio','Inicio')}
          ${navBtn('tienda','Tienda')}
          ${navBtn('categoria','Categoría')}
          ${navBtn('producto','Producto')}
        </nav>
      </header>`;
  }

  function navBtn(route,label){
    const active = state.route === route ? 'active' : '';
    return `<button type="button" class="${active}" data-preview-route="${route}">${label}</button>`;
  }

  function renderHero(){
    const primaryStyle = state.bannerPrimary ? `style="background-image:url('${escapeHtmlAttr(state.bannerPrimary)}')"` : '';
    const secondary = state.bannerSecondary ? `
      <div class="pg3-heroSecondary" style="background-image:url('${escapeHtmlAttr(state.bannerSecondary)}')"></div>` : '';
    return `
      <section class="pg3-heroWrap">
        <section class="pg3-hero pg3-hero--media" ${primaryStyle}>
          <div class="pg3-heroOverlay">
            <small>Estructura primero · Diseño después</small>
            <h2>${escapeHtml(state.heroTitle)}</h2>
            <p>${escapeHtml(state.heroSubtitle)}</p>
            <div class="pg3-heroActions">
              <button type="button" class="btn" data-preview-route="tienda">Ir a tienda</button>
              <button type="button" class="btn ghost" data-preview-route="categoria" data-category="${escapeHtmlAttr(categories()[0] || '')}">Ver categoría</button>
            </div>
          </div>
        </section>${secondary}
      </section>`;
  }

  function renderCurrentRoute(){
    switch(state.route){
      case 'tienda': return renderTienda();
      case 'categoria': return renderCategoria();
      case 'producto': return renderProducto();
      default: return renderInicio();
    }
  }

  function renderInicio(){
    const cats = categories();
    return `
      <section class="pg3-panel">
        <h3>Página principal</h3>
        <p>Home base conectado a tu catálogo real de la TPV.</p>
      </section>
      <section class="pg3-panel">
        <h3>Categorías detectadas</h3>
        <div class="pg3-cats">
          ${cats.length ? cats.map(cat=> `<button type="button" class="pg3-pill" data-preview-route="categoria" data-category="${escapeHtmlAttr(cat)}">${escapeHtml(cat)}</button>`).join('') : '<div class="pg3-empty">No hay categorías todavía.</div>'}
        </div>
      </section>
      <section class="pg3-panel">
        <h3>Productos destacados</h3>
        <div class="pg3-products">${featuredProducts().slice(0,4).map(productCard).join('') || '<div class="pg3-empty">No hay productos.</div>'}</div>
      </section>`;
  }

  function renderTienda(){
    const cats = categories();
    const items = filteredProducts().slice(0, Math.max(1, Number(state.limitCatalog||8)));
    return `
      <section class="pg3-panel">
        <h3>Tienda</h3>
        <p>Catálogo conectado a productos reales de la TPV con buscador y filtro activo.</p>
        <div class="pg3-tools">
          <input class="pg3-search" type="text" value="${escapeHtmlAttr(state.search || '')}" placeholder="Buscar producto..." data-preview-search>
          <div class="pg3-cats">
            <button type="button" class="pg3-pill ${!state.selectedCategory ? 'active' : ''}" data-preview-route="tienda" data-category="">Todo</button>
            ${cats.map(c=> `<button type="button" class="pg3-pill ${normalizeCat(c)===normalizeCat(state.selectedCategory||'') ? 'active' : ''}" data-preview-route="tienda" data-category="${escapeHtmlAttr(c)}">${escapeHtml(c)}</button>`).join('')}
          </div>
          <div class="pg3-count">Mostrando ${items.length} producto(s)${state.selectedCategory ? ` de ${escapeHtml(state.selectedCategory)}` : ''}${state.search ? ` que coinciden con "${escapeHtml(state.search)}"` : ''}.</div>
        </div>
        <div class="pg3-products">${items.map(productCard).join('') || '<div class="pg3-empty">No hay productos con ese filtro.</div>'}</div>
      </section>`;
  }

  function renderCategoria(){
    const cat = state.selectedCategory || categories()[0] || '';
    const items = productsByCategory(cat);
    return `
      <section class="pg3-panel">
        <h3>Categoría: ${escapeHtml(cat || 'Sin categoría')}</h3>
        <p>Vista preparada para mostrar todos los productos filtrados por categoría.</p>
        <div class="pg3-cats">${categories().map(c=> `<button type="button" class="pg3-pill" data-preview-route="categoria" data-category="${escapeHtmlAttr(c)}">${escapeHtml(c)}</button>`).join('')}</div>
      </section>
      <section class="pg3-panel">
        <div class="pg3-products">${items.map(productCard).join('') || '<div class="pg3-empty">No hay productos en esta categoría.</div>'}</div>
      </section>`;
  }

  function renderProducto(){
    const p = selectedProduct();
    if(!p){
      return `<section class="pg3-panel"><div class="pg3-empty">No hay producto seleccionado.</div></section>`;
    }
    const desc = productDescription(p);
    return `
      <section class="pg3-panel pg3-split">
        <div>
          <div class="pg3-productMedia pg3-productMedia--detail">${productMediaHtml(p)}</div>
        </div>
        <div>
          <div class="pg3-productMeta">
            <span class="pg3-tag">${escapeHtml(normalizeCat(p.category))}</span>
            <span class="pg3-tag">SKU ${escapeHtml(p.sku || '—')}</span>
          </div>
          <h3>${escapeHtml(p.name || 'Producto')}</h3>
          <p class="pg3-productDesc">${escapeHtml(desc)}</p>
          <dl class="pg3-kv">
            <dt>Precio</dt><dd>${money(p.price)}</dd>
            <dt>Stock</dt><dd>${Number(p.stock||0)} pzs</dd>
            <dt>SKU</dt><dd>${escapeHtml(p.sku || '—')}</dd>
            <dt>Código</dt><dd>${escapeHtml(p.barcode || '—')}</dd>
            <dt>Categoría</dt><dd>${escapeHtml(normalizeCat(p.category))}</dd>
          </dl>
          <div class="pg3-detailActions">
            <button type="button" class="btn ghost" data-preview-route="categoria" data-category="${escapeHtmlAttr(normalizeCat(p.category))}">Ver categoría</button>
            <button type="button" class="btn" data-preview-route="tienda">Volver a tienda</button>
          </div>
          <div class="pg3-miniNote">Producto tomado del catálogo real de la TPV.</div>
        </div>
      </section>`;
  }

  function productCard(p){
    return `
      <article class="pg3-product">
        <div class="pg3-productMedia">${productMediaHtml(p)}</div>
        <div class="pg3-productTop">
          <small>${escapeHtml(normalizeCat(p.category))}</small>
          <span class="pg3-stock">${Number(p.stock||0)} pzs</span>
        </div>
        <strong>${escapeHtml(p.name || 'Producto')}</strong>
        <span class="pg3-price">${money(p.price)}</span>
        <div class="pg3-productActions">
          <button type="button" class="btn" data-add-cart="${escapeHtmlAttr(p.id)}">Agregar</button>
          <button type="button" class="btn ghost" data-product-wa="${escapeHtmlAttr(p.id)}">WhatsApp</button>
          <button type="button" class="btn ghost" data-preview-route="producto" data-product-id="${escapeHtmlAttr(p.id)}">Ver</button>
        </div>
      </article>`;
  }

  function productMediaHtml(p){
    if(p && p.image){
      return `<img class="pg3-productImg" src="${escapeHtmlAttr(p.image)}" alt="${escapeHtmlAttr(p.name || 'Producto')}">`;
    }
    return `<span class="pg3-productPlaceholder">${productMediaLabel(p)}</span>`;
  }

  function productMediaLabel(p){
    const words = String(p.name||'PR').trim().split(/\s+/).slice(0,2);
    return escapeHtml(words.map(w=> w[0]?.toUpperCase() || '').join('') || 'DG');
  }

  function initials(name){
    const words = String(name || 'DG').trim().split(/\s+/).slice(0,2);
    return words.map(w=> w[0]?.toUpperCase() || '').join('') || 'DG';
  }

  function productDescription(p){
    const cat = normalizeCat(p.category);
    const stock = Number(p.stock||0);
    return `${p.name || 'Producto'} pertenece a la categoría ${cat} y actualmente cuenta con ${stock} pieza(s) disponibles en el catálogo.`;
  }

  function renderCarritoPanel(){
    const items = cartDetailedItems();
    return `
      <section class="pg3-panel">
        <div class="pg3-cartHead">
          <div>
            <h3>Carrito</h3>
            <p>${items.length ? `${cartCount()} producto(s) agregados.` : 'Agrega productos desde la tienda para empezar tu pedido.'}</p>
          </div>
          <span class="pg3-tag">${money(cartTotal())}</span>
        </div>
        ${items.length ? `
          <div class="pg3-cartList">
            ${items.map(item => `
              <article class="pg3-cartItem">
                <div>
                  <strong>${escapeHtml(item.product.name)}</strong>
                  <small>${escapeHtml(normalizeCat(item.product.category))}</small>
                </div>
                <div class="pg3-cartActions">
                  <button type="button" class="btn ghost" data-cart-delta="-1" data-cart-id="${escapeHtmlAttr(item.product.id)}">-</button>
                  <span>${item.qty}</span>
                  <button type="button" class="btn ghost" data-cart-delta="1" data-cart-id="${escapeHtmlAttr(item.product.id)}">+</button>
                  <strong>${money(item.subtotal)}</strong>
                  <button type="button" class="btn ghost" data-cart-remove="${escapeHtmlAttr(item.product.id)}">Quitar</button>
                </div>
              </article>
            `).join('')}
          </div>
          <div class="pg3-cartFooter">
            <button type="button" class="btn ghost" data-cart-clear>Vaciar</button>
            <button type="button" class="btn" data-cart-send>Enviar por WhatsApp</button>
          </div>
        ` : `<div class="pg3-empty">Tu carrito está vacío.</div>`}
      </section>`;
  }

  function renderContacto(){
    return `
      <section class="pg3-panel">
        <h3>Contacto</h3>
        <p>Base de contacto reforzada para una página real del negocio.</p>
        <div class="pg3-contactGrid">
          <div class="pg3-contactCard"><strong>Teléfono</strong><span>${escapeHtml(state.phone || 'Sin definir')}</span></div>
          <div class="pg3-contactCard"><strong>Dirección</strong><span>${escapeHtml(state.address || 'Sin definir')}</span></div>
          <div class="pg3-contactCard"><strong>Horario</strong><span>${escapeHtml(state.hours || 'Sin definir')}</span></div>
          <div class="pg3-contactCard"><strong>Cobertura</strong><span>${allProducts().length} productos · ${categories().length} categorías</span></div>
        </div>
        <div class="pg3-contactActions">
          ${state.maps ? `<a class="btn ghost" href="${escapeHtmlAttr(state.maps)}" target="_blank" rel="noopener">Google Maps</a>` : ''}
          ${state.facebook ? `<a class="btn ghost" href="${escapeHtmlAttr(state.facebook)}" target="_blank" rel="noopener">Facebook</a>` : ''}
          ${state.instagram ? `<a class="btn ghost" href="${escapeHtmlAttr(state.instagram)}" target="_blank" rel="noopener">Instagram</a>` : ''}
        </div>
      </section>`;
  }

  function renderFooter(){
    return `<footer class="pg3-footer">Página 3.0 · Render modular con tienda, producto y contacto reforzado.</footer>`;
  }

  function money(v){
    const n = Number(v || 0);
    try{ return n.toLocaleString('es-MX', { style:'currency', currency:'MXN' }); }catch(_){ return '$' + n.toFixed(2); }
  }

  function routeName(route){
    return ({ inicio:'Inicio', tienda:'Tienda', categoria:'Categoría', producto:'Producto' }[route]) || route;
  }

  function escapeHtml(v){
    return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function escapeHtmlAttr(v){
    return escapeHtml(v).replace(/`/g,'&#96;');
  }
})();
