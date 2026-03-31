(function(){
  const STORAGE_KEY = 'dp_pagina3_state';

  const st = (typeof dpGetState === 'function') ? dpGetState() : { meta:{business:{}}, products:[] };
  const business = st?.meta?.business || {};
  const defaults = {
    businessName: business.name || 'Dinamita Gym',
    heroTitle: 'Explota tu potencial',
    heroSubtitle: 'Página 3.0 ahora ya se comporta como una web real con tienda, categoría y producto.',
    phone: business.phone || '',
    address: business.address || '',
    route: 'inicio',
    selectedCategory: '',
    selectedProductId: (st.products && st.products[0] && st.products[0].id) || '',
    limitCatalog: 8
  };

  const state = loadState();
  const els = {
    businessName: document.getElementById('pg3-businessName'),
    heroTitle: document.getElementById('pg3-heroTitle'),
    heroSubtitle: document.getElementById('pg3-heroSubtitle'),
    phone: document.getElementById('pg3-phone'),
    address: document.getElementById('pg3-address'),
    limitCatalog: document.getElementById('pg3-limitCatalog'),
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
      return { ...defaults, ...JSON.parse(raw) };
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
    els.phone.value = state.phone || '';
    els.address.value = state.address || '';
    els.limitCatalog.value = state.limitCatalog || 8;
    syncRouteButtons();
  }

  function bindEditor(){
    bindInput(els.businessName, 'businessName');
    bindInput(els.heroTitle, 'heroTitle');
    bindInput(els.heroSubtitle, 'heroSubtitle');
    bindInput(els.phone, 'phone');
    bindInput(els.address, 'address');
    els.limitCatalog.addEventListener('input', e=>{
      const n = Number(e.target.value || 8);
      state.limitCatalog = Math.max(4, Math.min(24, n));
      renderPreview();
    });
    els.saveBtn.addEventListener('click', ()=>{ saveState(); alert('Página 3.0 guardada.'); });
    els.resetBtn.addEventListener('click', ()=>{
      Object.assign(state, defaults);
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

  function navigate(route, opts={}){
    state.route = route;
    if(opts.category !== undefined) state.selectedCategory = opts.category;
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
    return allProducts().slice(0, Math.max(1, Number(state.limitCatalog||8)));
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

  function renderPreview(){
    const categoryLabel = state.route === 'categoria' ? ` · ${state.selectedCategory || 'Sin categoría'}` : '';
    els.routeLabel.textContent = `Ruta actual: ${routeName(state.route)}${categoryLabel}`;
    els.previewRoot.innerHTML = `
      <div class="pg3-web">
        ${renderHeader()}
        ${renderHero()}
        <div class="pg3-content">
          ${renderCurrentRoute()}
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
  }

  function renderHeader(){
    return `
      <header class="pg3-webHeader">
        <div class="pg3-webBrand">
          <strong>${escapeHtml(state.businessName)}</strong>
          <small>Página 3.0 · Router funcional</small>
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
    return `
      <section class="pg3-hero">
        <small>Estructura primero · Diseño después</small>
        <h2>${escapeHtml(state.heroTitle)}</h2>
        <p>${escapeHtml(state.heroSubtitle)}</p>
        <div class="pg3-heroActions">
          <button type="button" class="btn" data-preview-route="tienda">Ir a tienda</button>
          <button type="button" class="btn ghost" data-preview-route="categoria" data-category="${escapeHtmlAttr(categories()[0] || '')}">Ver categoría</button>
        </div>
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
    const items = featuredProducts();
    return `
      <section class="pg3-panel">
        <h3>Tienda</h3>
        <p>Catálogo básico conectado a productos reales de la TPV.</p>
        <div class="pg3-products">${items.map(productCard).join('') || '<div class="pg3-empty">No hay productos en el catálogo.</div>'}</div>
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
    return `
      <section class="pg3-panel pg3-split">
        <div>
          <div class="pg3-productMedia">${productMediaLabel(p)}</div>
        </div>
        <div>
          <h3>${escapeHtml(p.name || 'Producto')}</h3>
          <p>${escapeHtml(normalizeCat(p.category))}</p>
          <dl class="pg3-kv">
            <dt>Precio</dt><dd>${money(p.price)}</dd>
            <dt>Stock</dt><dd>${Number(p.stock||0)} pzs</dd>
            <dt>SKU</dt><dd>${escapeHtml(p.sku || '—')}</dd>
            <dt>Código</dt><dd>${escapeHtml(p.barcode || '—')}</dd>
          </dl>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
            <button type="button" class="btn ghost" data-preview-route="categoria" data-category="${escapeHtmlAttr(normalizeCat(p.category))}">Ver categoría</button>
            <button type="button" class="btn" data-preview-route="tienda">Volver a tienda</button>
          </div>
        </div>
      </section>`;
  }

  function productCard(p){
    return `
      <article class="pg3-product">
        <div class="pg3-productMedia">${productMediaLabel(p)}</div>
        <div class="pg3-productTop">
          <small>${escapeHtml(normalizeCat(p.category))}</small>
          <span class="pg3-stock">${Number(p.stock||0)} pzs</span>
        </div>
        <strong>${escapeHtml(p.name || 'Producto')}</strong>
        <span class="pg3-price">${money(p.price)}</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn ghost" data-preview-route="producto" data-product-id="${escapeHtmlAttr(p.id)}">Ver</button>
          <button type="button" class="btn ghost" data-preview-route="categoria" data-category="${escapeHtmlAttr(normalizeCat(p.category))}">Categoría</button>
        </div>
      </article>`;
  }

  function productMediaLabel(p){
    const words = String(p.name||'PR').trim().split(/\s+/).slice(0,2);
    return escapeHtml(words.map(w=> w[0]?.toUpperCase() || '').join('') || 'DG');
  }

  function renderContacto(){
    return `
      <section class="pg3-panel">
        <h3>Contacto</h3>
        <dl class="pg3-kv">
          <dt>Teléfono</dt><dd>${escapeHtml(state.phone || 'Sin definir')}</dd>
          <dt>Dirección</dt><dd>${escapeHtml(state.address || 'Sin definir')}</dd>
          <dt>Productos</dt><dd>${allProducts().length} en catálogo</dd>
          <dt>Categorías</dt><dd>${categories().length}</dd>
        </dl>
      </section>`;
  }

  function renderFooter(){
    return `<footer class="pg3-footer">Página 3.0 · Render modular funcional listo para carrito, WhatsApp y exportación.</footer>`;
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
