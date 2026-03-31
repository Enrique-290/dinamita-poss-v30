(function(){
  const STORAGE_KEY = 'dp_pagina3_state';
  const defaults = {
    businessName: 'Dinamita Gym',
    heroTitle: 'Explota tu potencial',
    heroSubtitle: 'Base estructural de Página 3.0 con router simple para construir una web real por módulos.',
    route: 'inicio'
  };

  const state = loadState();
  const els = {
    businessName: document.getElementById('pg3-businessName'),
    heroTitle: document.getElementById('pg3-heroTitle'),
    heroSubtitle: document.getElementById('pg3-heroSubtitle'),
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
    syncRouteButtons();
  }

  function bindEditor(){
    els.businessName.addEventListener('input', e=>{ state.businessName = e.target.value; renderPreview(); });
    els.heroTitle.addEventListener('input', e=>{ state.heroTitle = e.target.value; renderPreview(); });
    els.heroSubtitle.addEventListener('input', e=>{ state.heroSubtitle = e.target.value; renderPreview(); });
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

  function navigate(route){
    state.route = route;
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

  function renderPreview(){
    els.routeLabel.textContent = `Ruta actual: ${routeName(state.route)}`;
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
      btn.addEventListener('click', ()=> navigate(btn.dataset.previewRoute));
    });
  }

  function renderHeader(){
    return `
      <header class="pg3-webHeader">
        <div class="pg3-webBrand">
          <strong>${escapeHtml(state.businessName)}</strong>
          <small>Página 3.0 · Router base</small>
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
          <button type="button" class="btn ghost" data-preview-route="categoria">Ver categoría</button>
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
    return `
      <section class="pg3-panel">
        <h3>Página principal</h3>
        <p>Esta vista simula el home. Aquí después vivirán banners, destacados, categorías y promociones.</p>
      </section>
      <section class="pg3-panel">
        <h3>Categorías base</h3>
        <div class="pg3-cats">
          <span class="pg3-pill">Suplementos</span>
          <span class="pg3-pill">Bebidas</span>
          <span class="pg3-pill">Accesorios</span>
          <span class="pg3-pill">Membresías</span>
        </div>
      </section>`;
  }

  function renderTienda(){
    return `
      <section class="pg3-panel">
        <h3>Tienda</h3>
        <p>Vista preparada para buscador, filtros y catálogo real.</p>
        <div class="pg3-products">
          ${productCard('Creatina Mutant','Suplementos','$450')}
          ${productCard('Gatorade 1 lt','Bebidas','$26')}
          ${productCard('Guantes de gym','Accesorios','$199')}
        </div>
      </section>`;
  }

  function renderCategoria(){
    return `
      <section class="pg3-panel">
        <h3>Categoría: Suplementos</h3>
        <p>Vista lista para mostrar todos los productos filtrados por categoría.</p>
        <div class="pg3-products">
          ${productCard('Proteína 2 lb','Suplementos','$699')}
          ${productCard('Creatina 300 g','Suplementos','$450')}
          ${productCard('Pre entreno','Suplementos','$599')}
        </div>
      </section>`;
  }

  function renderProducto(){
    return `
      <section class="pg3-panel">
        <h3>Producto</h3>
        <p>Vista base para detalle de producto con imagen grande, descripción, carrito y WhatsApp.</p>
        <div class="pg3-products">
          ${productCard('Proteína 2 lb','Detalle producto','$699')}
        </div>
      </section>`;
  }

  function productCard(name, category, price){
    return `
      <article class="pg3-product">
        <small>${escapeHtml(category)}</small>
        <strong>${escapeHtml(name)}</strong>
        <span>${escapeHtml(price)}</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn ghost">Detalle</button>
          <button type="button" class="btn">Agregar</button>
        </div>
      </article>`;
  }

  function renderContacto(){
    return `
      <section class="pg3-panel">
        <h3>Contacto</h3>
        <p>Bloque base para teléfono, WhatsApp, dirección, Maps y redes sociales.</p>
      </section>`;
  }

  function renderFooter(){
    return `<footer class="pg3-footer">Página 3.0 · Base estructural lista para evolucionar a tienda real.</footer>`;
  }

  function routeName(route){
    return ({inicio:'Inicio',tienda:'Tienda',categoria:'Categoría',producto:'Producto'})[route] || 'Inicio';
  }

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
})();
