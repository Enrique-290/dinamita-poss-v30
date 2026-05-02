(function(){
  const STORAGE_KEY = 'dp_pagina3_state';

  const st = (typeof dpGetState === 'function') ? dpGetState() : { config:{business:{}}, products:[] };
  const cfg = (typeof dpGetConfig === 'function') ? dpGetConfig() : (st?.config || {});
  const business = cfg?.business || st?.config?.business || st?.meta?.business || {};
  const THEME_PRESETS = {
    dinamita: { color: '#d7192a' },
    premium: { color: '#15171c' },
    sport: { color: '#2563eb' },
    health: { color: '#16a34a' }
  };
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
    primaryColor: '#d7192a',
    themePreset: 'dinamita',
    showPrices: true,
    showStock: true,
    showSku: true,
    whatsappLabel: 'Enviar pedido por WhatsApp',
    previewDevice: 'desktop',
    editorTab: 'design',
    productSort: 'manual',
    onlineProductIds: null,
    onlineProductSearch: '',
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
    primaryColor: document.getElementById('pg3-primaryColor'),
    primaryColorText: document.getElementById('pg3-primaryColorText'),
    themePresets: document.getElementById('pg3-themePresets'),
    showPrices: document.getElementById('pg3-showPrices'),
    showStock: document.getElementById('pg3-showStock'),
    showSku: document.getElementById('pg3-showSku'),
    whatsappLabel: document.getElementById('pg3-whatsappLabel'),
    previewDevice: document.getElementById('pg3-previewDevice'),
    editorTabs: document.getElementById('pg3-editorTabs'),
    productSort: document.getElementById('pg3-productSort'),
    onlineProductSearch: document.getElementById('pg3-onlineProductSearch'),
    onlineProductsList: document.getElementById('pg3-onlineProductsList'),
    onlineProductsSummary: document.getElementById('pg3-onlineProductsSummary'),
    selectAllProducts: document.getElementById('pg3-selectAllProducts'),
    clearProducts: document.getElementById('pg3-clearProducts'),
    downloadHtml: document.getElementById('pg3-downloadHtml'),
    downloadZip: document.getElementById('pg3-downloadZip'),
    downloadJson: document.getElementById('pg3-downloadJson'),
    uploadJson: document.getElementById('pg3-uploadJson'),
    exportStatus: document.getElementById('pg3-exportStatus'),
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
      return {
        ...defaults,
        ...parsed,
        primaryColor: sanitizeColor(parsed.primaryColor || defaults.primaryColor),
        themePreset: THEME_PRESETS[parsed.themePreset] ? parsed.themePreset : detectThemePreset(parsed.primaryColor || defaults.primaryColor),
        showPrices: parsed.showPrices !== false,
        showStock: parsed.showStock !== false,
        showSku: parsed.showSku !== false,
        whatsappLabel: parsed.whatsappLabel || defaults.whatsappLabel,
        previewDevice: parsed.previewDevice === 'mobile' ? 'mobile' : 'desktop',
        editorTab: ['design','products','contact','export'].includes(parsed.editorTab) ? parsed.editorTab : 'design',
        productSort: validProductSort(parsed.productSort),
        onlineProductIds: Array.isArray(parsed.onlineProductIds) ? parsed.onlineProductIds : null,
        onlineProductSearch: parsed.onlineProductSearch || '',
        cart: Array.isArray(parsed.cart) ? parsed.cart : []
      };
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
    if(els.primaryColor) els.primaryColor.value = sanitizeColor(state.primaryColor);
    if(els.primaryColorText) els.primaryColorText.value = sanitizeColor(state.primaryColor);
    syncThemePresetButtons();
    if(els.showPrices) els.showPrices.checked = state.showPrices !== false;
    if(els.showStock) els.showStock.checked = state.showStock !== false;
    if(els.showSku) els.showSku.checked = state.showSku !== false;
    if(els.whatsappLabel) els.whatsappLabel.value = state.whatsappLabel || defaults.whatsappLabel;
    syncPreviewDeviceButtons();
    syncEditorTabs();
    if(els.productSort) els.productSort.value = validProductSort(state.productSort);
    if(els.onlineProductSearch) els.onlineProductSearch.value = state.onlineProductSearch || '';
    syncRouteButtons();
    renderOnlineProductsList();
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
    bindColorInputs();
    bindThemePresets();
    bindCheckbox(els.showPrices, 'showPrices');
    bindCheckbox(els.showStock, 'showStock');
    bindCheckbox(els.showSku, 'showSku');
    bindInput(els.whatsappLabel, 'whatsappLabel');
    bindPreviewDevice();
    bindEditorTabs();
    if(els.productSort){
      els.productSort.addEventListener('change', e=>{
        state.productSort = validProductSort(e.target.value);
        renderOnlineProductsList();
        renderPreview();
        saveState();
      });
    }
    els.limitCatalog.addEventListener('input', e=>{
      const n = Number(e.target.value || 8);
      state.limitCatalog = Math.max(4, Math.min(60, n));
      renderPreview();
    });
    bindInput(els.search, 'search');
    if(els.onlineProductSearch){
      els.onlineProductSearch.addEventListener('input', e=>{
        state.onlineProductSearch = e.target.value || '';
        renderOnlineProductsList();
      });
    }
    if(els.selectAllProducts){
      els.selectAllProducts.addEventListener('click', ()=>{
        state.onlineProductIds = rawProducts().map(p => p.id).filter(Boolean);
        renderOnlineProductsList();
        renderPreview();
        saveState();
      });
    }
    if(els.clearProducts){
      els.clearProducts.addEventListener('click', ()=>{
        state.onlineProductIds = [];
        renderOnlineProductsList();
        renderPreview();
        saveState();
      });
    }
    els.saveBtn.addEventListener('click', ()=>{ saveState(); alert('Página 3.0 guardada.'); });
    els.resetBtn.addEventListener('click', ()=>{
      Object.assign(state, JSON.parse(JSON.stringify(defaults)));
      hydrateForm();
      renderPreview();
      saveState();
    });
    if(els.downloadHtml) els.downloadHtml.addEventListener('click', exportSingleHtml);
    if(els.downloadZip) els.downloadZip.addEventListener('click', exportWebZip);
    if(els.downloadJson) els.downloadJson.addEventListener('click', exportJson);
    if(els.uploadJson) els.uploadJson.addEventListener('change', importJson);
    els.nav.querySelectorAll('[data-route]').forEach(btn=>{
      btn.addEventListener('click', ()=> navigate(btn.dataset.route));
    });
  }

  function bindInput(el, key){
    if(!el) return;
    el.addEventListener('input', e=>{ state[key] = e.target.value; renderPreview(); });
  }

  function bindCheckbox(el, key){
    if(!el) return;
    el.addEventListener('change', e=>{
      state[key] = !!e.target.checked;
      renderPreview();
      saveState();
    });
  }

  function bindColorInputs(){
    const apply = value => {
      state.primaryColor = sanitizeColor(value);
      state.themePreset = detectThemePreset(state.primaryColor);
      if(els.primaryColor) els.primaryColor.value = state.primaryColor;
      if(els.primaryColorText) els.primaryColorText.value = state.primaryColor;
      syncThemePresetButtons();
      renderPreview();
      saveState();
    };
    if(els.primaryColor) els.primaryColor.addEventListener('input', e=> apply(e.target.value));
    if(els.primaryColorText) els.primaryColorText.addEventListener('input', e=>{
      const value = String(e.target.value || '').trim();
      if(/^#[0-9a-fA-F]{6}$/.test(value)) apply(value);
    });
  }

  function bindThemePresets(){
    if(!els.themePresets) return;
    els.themePresets.querySelectorAll('[data-theme]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const key = btn.dataset.theme;
        const preset = THEME_PRESETS[key] || THEME_PRESETS.dinamita;
        state.themePreset = key;
        state.primaryColor = sanitizeColor(preset.color);
        if(els.primaryColor) els.primaryColor.value = state.primaryColor;
        if(els.primaryColorText) els.primaryColorText.value = state.primaryColor;
        syncThemePresetButtons();
        renderPreview();
        saveState();
      });
    });
  }

  function bindPreviewDevice(){
    if(!els.previewDevice) return;
    els.previewDevice.querySelectorAll('[data-device]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        state.previewDevice = btn.dataset.device === 'mobile' ? 'mobile' : 'desktop';
        syncPreviewDeviceButtons();
        renderPreview();
        saveState();
      });
    });
  }

  function bindEditorTabs(){
    if(!els.editorTabs) return;
    els.editorTabs.querySelectorAll('[data-tab]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        state.editorTab = btn.dataset.tab || 'design';
        syncEditorTabs();
        saveState();
      });
    });
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

  function syncPreviewDeviceButtons(){
    if(!els.previewDevice) return;
    els.previewDevice.querySelectorAll('[data-device]').forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.device === state.previewDevice);
    });
  }

  function syncThemePresetButtons(){
    if(!els.themePresets) return;
    const current = THEME_PRESETS[state.themePreset] ? state.themePreset : detectThemePreset(state.primaryColor);
    state.themePreset = current;
    els.themePresets.querySelectorAll('[data-theme]').forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.theme === current);
    });
  }

  function syncEditorTabs(){
    const current = ['design','products','contact','export'].includes(state.editorTab) ? state.editorTab : 'design';
    state.editorTab = current;
    if(els.editorTabs){
      els.editorTabs.querySelectorAll('[data-tab]').forEach(btn=>{
        btn.classList.toggle('active', btn.dataset.tab === current);
      });
    }
    document.querySelectorAll('[data-tab-pane]').forEach(pane=>{
      pane.classList.toggle('active', pane.dataset.tabPane === current);
    });
  }

  function rawProducts(){
    return Array.isArray(st.products) ? st.products.slice() : [];
  }

  function publishedIds(){
    if(Array.isArray(state.onlineProductIds)) return state.onlineProductIds.map(String);
    return rawProducts().map(p => String(p.id)).filter(Boolean);
  }

  function isProductPublished(id){
    if(!id) return false;
    if(!Array.isArray(state.onlineProductIds)) return true;
    return state.onlineProductIds.map(String).includes(String(id));
  }

  function allProducts(){
    const ids = publishedIds();
    const allowed = new Set(ids);
    return sortProducts(rawProducts().filter(p => p && p.id && allowed.has(String(p.id))));
  }

  function sortProducts(products, sortKey=state.productSort){
    const mode = validProductSort(sortKey);
    const list = Array.isArray(products) ? products.slice() : [];
    const byText = (a,b,key) => String(a?.[key] || '').localeCompare(String(b?.[key] || ''), 'es', { sensitivity:'base' });
    if(mode === 'nameAsc') return list.sort((a,b)=> byText(a,b,'name'));
    if(mode === 'categoryAsc') return list.sort((a,b)=> byText(a,b,'category') || byText(a,b,'name'));
    if(mode === 'priceAsc') return list.sort((a,b)=> Number(a?.price||0) - Number(b?.price||0) || byText(a,b,'name'));
    if(mode === 'priceDesc') return list.sort((a,b)=> Number(b?.price||0) - Number(a?.price||0) || byText(a,b,'name'));
    if(mode === 'stockDesc') return list.sort((a,b)=> Number(b?.stock||0) - Number(a?.stock||0) || byText(a,b,'name'));
    if(mode === 'recent') return list.sort((a,b)=> String(b?.updatedAt || b?.createdAt || '').localeCompare(String(a?.updatedAt || a?.createdAt || '')) || byText(a,b,'name'));
    return list;
  }

  function validProductSort(value){
    return ['manual','nameAsc','categoryAsc','priceAsc','priceDesc','stockDesc','recent'].includes(value) ? value : 'manual';
  }


  function renderOnlineProductsList(){
    if(!els.onlineProductsList) return;
    const q = String(state.onlineProductSearch || '').trim().toLowerCase();
    const products = rawProducts();
    const visible = sortProducts(products.filter(p => {
      if(!q) return true;
      const hay = [p.name,p.sku,p.barcode,p.category].map(v=>String(v||'').toLowerCase()).join(' ');
      return hay.includes(q);
    }));
    const selectedCount = allProducts().length;
    if(els.onlineProductsSummary){
      els.onlineProductsSummary.textContent = `${selectedCount} de ${products.length} productos visibles en web`;
    }
    if(!products.length){
      els.onlineProductsList.innerHTML = '<div class="pg3-onlineProductEmpty">Aún no hay productos en inventario.</div>';
      return;
    }
    if(!visible.length){
      els.onlineProductsList.innerHTML = '<div class="pg3-onlineProductEmpty">No hay productos con esa búsqueda.</div>';
      return;
    }
    els.onlineProductsList.innerHTML = visible.map(p=>`
      <label class="pg3-onlineProductRow">
        <input type="checkbox" data-online-product="${escapeHtmlAttr(p.id)}" ${isProductPublished(p.id) ? 'checked' : ''}>
        <span class="pg3-onlineProductInfo">
          <strong>${escapeHtml(p.name || 'Producto')}</strong>
          <small>${escapeHtml(normalizeCat(p.category))} · Stock ${Number(p.stock||0)} · SKU ${escapeHtml(p.sku || '—')}</small>
        </span>
        <span class="pg3-onlineProductPrice">${money(p.price)}</span>
      </label>
    `).join('');
    els.onlineProductsList.querySelectorAll('[data-online-product]').forEach(chk=>{
      chk.addEventListener('change', ()=>{
        const id = String(chk.dataset.onlineProduct || '');
        const current = new Set(publishedIds());
        if(chk.checked) current.add(id);
        else current.delete(id);
        state.onlineProductIds = Array.from(current);
        // Si la categoría actual quedó sin productos visibles, limpiamos el filtro para no mostrar una pantalla vacía accidental.
        if(state.selectedCategory && !productsByCategory(state.selectedCategory).length){
          state.selectedCategory = '';
          if(state.route === 'categoria') state.route = 'tienda';
        }
        // Si hay productos ocultos en carrito, los quitamos para que no se pidan online.
        state.cart = cartItems().filter(item => current.has(String(item.id)));
        renderOnlineProductsList();
        renderPreview();
        saveState();
      });
    });
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
    els.previewRoot.classList.toggle('pg3-previewRoot--mobile', state.previewDevice === 'mobile');
    els.previewRoot.style.setProperty('--pg3-primary', sanitizeColor(state.primaryColor));
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
        <p>Catálogo conectado a los productos seleccionados para venta online.</p>
        <div class="pg3-webStatus">Productos publicados: ${allProducts().length} de ${rawProducts().length}</div>
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
    const metaTags = [
      `<span class="pg3-tag">${escapeHtml(normalizeCat(p.category))}</span>`,
      state.showSku !== false ? `<span class="pg3-tag">SKU ${escapeHtml(p.sku || '—')}</span>` : ''
    ].filter(Boolean).join('');
    const rows = [
      state.showPrices !== false ? `<dt>Precio</dt><dd>${money(p.price)}</dd>` : '',
      state.showStock !== false ? `<dt>Stock</dt><dd>${Number(p.stock||0)} pzs</dd>` : '',
      state.showSku !== false ? `<dt>SKU</dt><dd>${escapeHtml(p.sku || '—')}</dd>` : '',
      `<dt>Código</dt><dd>${escapeHtml(p.barcode || '—')}</dd>`,
      `<dt>Categoría</dt><dd>${escapeHtml(normalizeCat(p.category))}</dd>`
    ].filter(Boolean).join('');
    return `
      <section class="pg3-panel pg3-split">
        <div>
          <div class="pg3-productMedia pg3-productMedia--detail">${productMediaHtml(p)}</div>
        </div>
        <div>
          <div class="pg3-productMeta">${metaTags}</div>
          <h3>${escapeHtml(p.name || 'Producto')}</h3>
          <p class="pg3-productDesc">${escapeHtml(desc)}</p>
          <dl class="pg3-kv">${rows}</dl>
          <div class="pg3-detailActions">
            <button type="button" class="btn" data-add-cart="${escapeHtmlAttr(p.id)}">Agregar</button>
            <button type="button" class="btn ghost" data-product-wa="${escapeHtmlAttr(p.id)}">WhatsApp</button>
            <button type="button" class="btn ghost" data-preview-route="categoria" data-category="${escapeHtmlAttr(normalizeCat(p.category))}">Ver categoría</button>
            <button type="button" class="btn ghost" data-preview-route="tienda">Volver a tienda</button>
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
          ${state.showStock !== false ? `<span class="pg3-stock">${Number(p.stock||0)} pzs</span>` : ''}
        </div>
        <strong>${escapeHtml(p.name || 'Producto')}</strong>
        ${state.showPrices !== false ? `<span class="pg3-price">${money(p.price)}</span>` : ''}
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
          <span class="pg3-tag">${state.showPrices !== false ? money(cartTotal()) : `${cartCount()} pzs`}</span>
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
                  ${state.showPrices !== false ? `<strong>${money(item.subtotal)}</strong>` : ''}
                  <button type="button" class="btn ghost" data-cart-remove="${escapeHtmlAttr(item.product.id)}">Quitar</button>
                </div>
              </article>
            `).join('')}
          </div>
          <div class="pg3-cartFooter">
            <button type="button" class="btn ghost" data-cart-clear>Vaciar</button>
            <button type="button" class="btn" data-cart-send>${escapeHtml(state.whatsappLabel || defaults.whatsappLabel)}</button>
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
          <div class="pg3-contactCard"><strong>Cobertura web</strong><span>${allProducts().length} productos publicados · ${categories().length} categorías</span></div>
        </div>
        <div class="pg3-contactActions">
          ${state.maps ? `<a class="btn ghost" href="${escapeHtmlAttr(state.maps)}" target="_blank" rel="noopener">Google Maps</a>` : ''}
          ${state.facebook ? `<a class="btn ghost" href="${escapeHtmlAttr(state.facebook)}" target="_blank" rel="noopener">Facebook</a>` : ''}
          ${state.instagram ? `<a class="btn ghost" href="${escapeHtmlAttr(state.instagram)}" target="_blank" rel="noopener">Instagram</a>` : ''}
        </div>
      </section>`;
  }

  function renderFooter(){
    return `<footer class="pg3-footer">Página 3.0 · Catálogo online con productos seleccionables.</footer>`;
  }


  function pageExportData(){
    return {
      exportedAt: new Date().toISOString(),
      version: 'V30.5.6',
      state: {
        businessName: state.businessName,
        heroTitle: state.heroTitle,
        heroSubtitle: state.heroSubtitle,
        bannerPrimary: state.bannerPrimary,
        bannerSecondary: state.bannerSecondary,
        phone: state.phone,
        address: state.address,
        hours: state.hours,
        maps: state.maps,
        facebook: state.facebook,
        instagram: state.instagram,
        limitCatalog: state.limitCatalog,
        primaryColor: sanitizeColor(state.primaryColor),
        themePreset: state.themePreset || detectThemePreset(state.primaryColor),
        showPrices: state.showPrices !== false,
        showStock: state.showStock !== false,
        showSku: state.showSku !== false,
        whatsappLabel: state.whatsappLabel || defaults.whatsappLabel,
        productSort: validProductSort(state.productSort),
        onlineProductIds: publishedIds()
      },
      business: {
        name: state.businessName || business.name || 'Dinamita Gym',
        logo: business.logoDataUrl || st?.config?.business?.logoDataUrl || st?.meta?.business?.logoDataUrl || '',
        phone: state.phone || business.phone || '',
        address: state.address || business.address || ''
      },
      products: allProducts().map(p => ({
        id: String(p.id || ''),
        name: p.name || 'Producto',
        price: Number(p.price || 0),
        stock: Number(p.stock || 0),
        sku: p.sku || '',
        barcode: p.barcode || '',
        category: normalizeCat(p.category),
        image: p.image || p.imageDataUrl || p.photo || p.img || ''
      }))
    };
  }

  function setExportStatus(msg, type){
    if(!els.exportStatus) return;
    els.exportStatus.textContent = msg;
    els.exportStatus.classList.remove('ok','err');
    if(type) els.exportStatus.classList.add(type);
  }

  function exportJson(){
    try{
      const data = pageExportData();
      downloadBlob('pagina3-respaldo.json', JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
      setExportStatus('JSON descargado correctamente.', 'ok');
    }catch(err){
      console.error(err);
      setExportStatus('No se pudo descargar el JSON.', 'err');
    }
  }

  function importJson(event){
    const file = event.target.files && event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(String(reader.result || '{}'));
        const imported = data.state || data.pageState || data.page || data;
        if(!imported || typeof imported !== 'object') throw new Error('Formato inválido');
        Object.assign(state, {
          businessName: imported.businessName || state.businessName,
          heroTitle: imported.heroTitle || state.heroTitle,
          heroSubtitle: imported.heroSubtitle || state.heroSubtitle,
          bannerPrimary: imported.bannerPrimary || state.bannerPrimary,
          bannerSecondary: imported.bannerSecondary || state.bannerSecondary,
          phone: imported.phone || state.phone,
          address: imported.address || state.address,
          hours: imported.hours || state.hours,
          maps: imported.maps || state.maps,
          facebook: imported.facebook || state.facebook,
          instagram: imported.instagram || state.instagram,
          limitCatalog: imported.limitCatalog || state.limitCatalog,
          primaryColor: sanitizeColor(imported.primaryColor || state.primaryColor),
          themePreset: THEME_PRESETS[imported.themePreset] ? imported.themePreset : detectThemePreset(imported.primaryColor || state.primaryColor),
          showPrices: imported.showPrices !== false,
          showStock: imported.showStock !== false,
          showSku: imported.showSku !== false,
          whatsappLabel: imported.whatsappLabel || state.whatsappLabel,
          productSort: validProductSort(imported.productSort || state.productSort),
          onlineProductIds: Array.isArray(imported.onlineProductIds) ? imported.onlineProductIds.map(String) : state.onlineProductIds
        });
        hydrateForm();
        renderPreview();
        saveState();
        setExportStatus('JSON importado correctamente.', 'ok');
      }catch(err){
        console.error(err);
        setExportStatus('No se pudo importar el JSON. Verifica que sea un respaldo válido.', 'err');
      }finally{
        if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function exportSingleHtml(){
    try{
      const html = buildStandaloneHtml(pageExportData(), 'inicio');
      downloadBlob('pagina3.html', html, 'text/html;charset=utf-8');
      setExportStatus('Página HTML descargada correctamente.', 'ok');
    }catch(err){
      console.error(err);
      setExportStatus('No se pudo generar la página HTML.', 'err');
    }
  }

  async function exportWebZip(){
    try{
      const data = pageExportData();
      const css = buildExportCss();
      const appJs = buildExportAppJs(data);
      const files = {
        'index.html': buildExternalPageHtml(),
        'styles.css': css,
        'app.js': appJs
      };
      const blob = createZipBlob(files);
      downloadBlob('pagina3-web.zip', blob, 'application/zip');
      setExportStatus('ZIP web descargado correctamente: index.html, styles.css y app.js.', 'ok');
    }catch(err){
      console.error(err);
      setExportStatus('No se pudo generar el ZIP web.', 'err');
    }
  }

  function buildExternalPageHtml(){
    const title = escapeHtml(state.businessName || 'Página web');
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="app.js"></script>
</body>
</html>`;
  }

  function buildStandaloneHtml(data, route){
    const safe = JSON.stringify(data).replace(/<\/script/gi,'<\\/script');
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(data.business?.name || 'Página web')}</title>
  <style>${buildExportCss()}</style>
</head>
<body data-route="${route}">
  <div id="app"></div>
  <script>window.PAGE_DATA = ${safe};</script>
  <script>${buildExportAppJs()}</script>
</body>
</html>`;
  }

  function buildExportCss(){
    const red = sanitizeColor(state.primaryColor);
    return `:root{--red:${red};--redDark:#9f1020;--ink:#15171c;--muted:#667085;--line:#e6e8ef;--soft:#f6f7fb;--panel:#fff;--green:#1faa59}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:var(--soft);color:var(--ink)}button,input{font:inherit}button{cursor:pointer}a{text-decoration:none;color:inherit}.wrap{max-width:1180px;margin:0 auto;padding:0 18px}.top{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.94);border-bottom:1px solid var(--line);backdrop-filter:blur(12px)}.topIn{min-height:74px;display:flex;align-items:center;justify-content:space-between;gap:18px}.brand{display:flex;align-items:center;gap:12px;min-width:0}.logo,.logoFallback{width:52px;height:52px;border-radius:10px;border:1px solid var(--line);background:#fff;flex:0 0 auto}.logo{object-fit:contain}.logoFallback{display:grid;place-items:center;background:var(--red);color:#fff;font-weight:900}.brand strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.brand small{color:var(--muted)}.nav{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.nav button,.btn{border:0;border-radius:8px;padding:10px 13px;background:var(--red);color:#fff;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:transform .14s ease,filter .14s ease,background .14s ease}.nav button{background:#fff;color:var(--ink);border:1px solid var(--line)}.nav button.active{background:var(--ink);color:#fff;border-color:var(--ink)}.btn:hover,.nav button:hover{transform:translateY(-1px);filter:brightness(.98)}.btn.ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}.btn.green{background:var(--green)}.hero{background:#111827;background-size:cover;background-position:center;margin:22px auto 0;border-radius:0;overflow:hidden}.heroOverlay{min-height:430px;display:grid;align-content:end;gap:16px;padding:48px 36px;color:#fff;background:linear-gradient(90deg,rgba(10,12,16,.78),rgba(10,12,16,.26)),linear-gradient(0deg,rgba(0,0,0,.38),transparent)}.hero .eyebrow{width:max-content;max-width:100%;padding:8px 10px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(255,255,255,.12);font-weight:800;font-size:.82rem}.hero h1{margin:0;font-size:clamp(2.1rem,5vw,4.8rem);line-height:.98}.hero p{margin:0;max-width:680px;font-size:1.08rem;line-height:1.55}.heroActions,.actions{display:flex;gap:10px;flex-wrap:wrap}.banner2{height:210px;background:#111827;background-size:cover;background-position:center;margin:16px auto 0;display:flex;align-items:flex-end;padding:24px;color:#fff}.section{padding:34px 0}.sectionHead{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:16px}.section h2{margin:0;font-size:1.7rem}.muted{color:var(--muted);line-height:1.5}.tools{display:grid;grid-template-columns:minmax(220px,1fr);gap:12px;margin-bottom:18px}.search{width:100%;padding:14px 15px;border:1px solid var(--line);border-radius:10px;background:#fff;font-size:1rem}.pills{display:flex;gap:8px;overflow:auto;padding-bottom:4px}.pill{white-space:nowrap;border:1px solid var(--line);border-radius:999px;padding:10px 14px;background:#fff;color:var(--ink);font-weight:800}.pill.active{background:var(--red);color:#fff;border-color:var(--red)}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:hidden;box-shadow:0 12px 30px rgba(16,24,40,.06);display:flex;flex-direction:column}.media{height:178px;background:#fff;display:grid;place-items:center;overflow:hidden;color:#98a2b3;font-weight:900;border-bottom:1px solid var(--line)}.media img{width:100%;height:100%;object-fit:contain}.cardBody{padding:14px;display:grid;gap:9px;flex:1}.card small,.tag{color:var(--muted)}.card h3{margin:0;font-size:1rem;line-height:1.25}.price{font-weight:900;color:var(--red);font-size:1.18rem}.detail{display:grid;grid-template-columns:minmax(260px,460px) 1fr;gap:24px;background:#fff;border:1px solid var(--line);border-radius:8px;padding:18px}.detail .media{height:380px;border:1px solid var(--line);border-radius:8px}.detail h1{margin:10px 0;font-size:2rem}.tag{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:7px 10px;background:#fff;font-weight:800}.empty{padding:24px;border:1px dashed #cfd4dc;border-radius:8px;color:var(--muted);background:#fff}.cartToggle{position:fixed;right:18px;bottom:18px;z-index:42;border:0;border-radius:999px;background:var(--ink);color:#fff;padding:13px 16px;font-weight:900;box-shadow:0 16px 40px rgba(16,24,40,.24)}.cart{position:fixed;right:18px;bottom:76px;z-index:40;width:min(410px,calc(100vw - 36px));max-height:min(640px,calc(100vh - 104px));background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 22px 70px rgba(16,24,40,.22);overflow:hidden;display:none}.cart.open{display:block}.cartHead{padding:16px;background:var(--ink);color:#fff;display:flex;justify-content:space-between;align-items:center}.cartBody{padding:14px;max-height:360px;overflow:auto}.cartItem{display:grid;grid-template-columns:1fr auto;gap:10px;padding:12px 0;border-bottom:1px solid var(--line)}.qty{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}.qty button{min-width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:#fff}.cartFoot{padding:14px;border-top:1px solid var(--line);display:grid;gap:10px}.contact{background:#fff;border-top:1px solid var(--line)}.contactGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.info{padding:16px;border:1px solid var(--line);border-radius:8px;background:#fff}.info strong{display:block;margin-bottom:6px}.footer{padding:28px;text-align:center;color:var(--muted)}.floatWa{position:fixed;left:18px;bottom:18px;z-index:41;background:#25d366;color:#fff;border-radius:999px;padding:13px 16px;font-weight:900;box-shadow:0 12px 30px rgba(0,0,0,.2)}@media(max-width:760px){.topIn{padding:12px 0;align-items:flex-start;flex-direction:column}.nav{width:100%}.nav button{flex:1}.heroOverlay{min-height:360px;padding:32px 20px}.detail{grid-template-columns:1fr;padding:12px}.detail .media{height:280px}.sectionHead{display:block}.cart{left:12px;right:12px;width:auto}.cartToggle{right:12px}.floatWa{left:12px;bottom:74px}}`;
  }

  function buildExportAppJs(data){
    const prefix = data ? 'window.PAGE_DATA = ' + JSON.stringify(data).replace(/<\/script/gi,'<\\/script') + ';\n' : '';
    return prefix + String.raw`
(function(){
  const data = window.PAGE_DATA || {};
  const state = data.state || {};
  const products = Array.isArray(data.products) ? data.products : [];
  const business = data.business || {};
  const showPrices = state.showPrices !== false;
  const showStock = state.showStock !== false;
  const showSku = state.showSku !== false;
  const whatsappLabel = state.whatsappLabel || 'Enviar pedido por WhatsApp';
  const productSort = state.productSort || 'manual';
  let route = 'inicio';
  let selectedCategory = '';
  let selectedProductId = products[0]?.id || '';
  let query = '';
  let cart = [];
  let cartOpen = false;
  const $app = document.getElementById('app');
  const routeNames = { inicio:'Inicio', tienda:'Tienda', categoria:'Categorías', producto:'Producto' };
  function money(v){ const n=Number(v||0); try{return n.toLocaleString('es-MX',{style:'currency',currency:'MXN'});}catch(e){return '$'+n.toFixed(2);} }
  function esc(v){ return String(v??'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function attr(v){ return esc(v); }
  function cat(v){ return String(v||'General').trim()||'General'; }
  function cats(){ return Array.from(new Set(products.map(p=>cat(p.category)))); }
  function sortProducts(list){ const arr=Array.isArray(list)?list.slice():[]; const txt=(a,b,k)=>String(a?.[k]||'').localeCompare(String(b?.[k]||''),'es',{sensitivity:'base'}); if(productSort==='nameAsc')return arr.sort((a,b)=>txt(a,b,'name')); if(productSort==='categoryAsc')return arr.sort((a,b)=>txt(a,b,'category')||txt(a,b,'name')); if(productSort==='priceAsc')return arr.sort((a,b)=>Number(a?.price||0)-Number(b?.price||0)||txt(a,b,'name')); if(productSort==='priceDesc')return arr.sort((a,b)=>Number(b?.price||0)-Number(a?.price||0)||txt(a,b,'name')); if(productSort==='stockDesc')return arr.sort((a,b)=>Number(b?.stock||0)-Number(a?.stock||0)||txt(a,b,'name')); if(productSort==='recent')return arr.sort((a,b)=>String(b?.updatedAt||b?.createdAt||'').localeCompare(String(a?.updatedAt||a?.createdAt||''))||txt(a,b,'name')); return arr; }
  function initials(text){ return String(text||'DG').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase() || 'DG'; }
  function img(p){ return p && p.image ? '<img src="'+attr(p.image)+'" alt="'+attr(p.name)+'">' : '<span>'+esc(initials(p?.name||business.name||'DG'))+'</span>'; }
  function normalizePhone(raw){ const d=String(raw||'').replace(/\D+/g,''); if(!d)return ''; if(d.startsWith('521'))return d; if(d.startsWith('52')&&d.length===12)return '521'+d.slice(2); if(d.length===10)return '521'+d; return d; }
  function openWa(msg){ const phone=normalizePhone(state.phone||business.phone||''); if(!phone){ alert('WhatsApp no configurado.'); return; } window.open('https://api.whatsapp.com/send?phone='+phone+'&text='+encodeURIComponent(msg),'_blank','noopener,noreferrer'); }
  function filtered(){ return sortProducts(products.filter(p=>{ const byCat=!selectedCategory||cat(p.category)===selectedCategory; const hay=[p.name,p.sku,p.barcode,p.category].map(x=>String(x||'').toLowerCase()).join(' '); const byQ=!query||hay.includes(query.toLowerCase()); return byCat&&byQ; })); }
  function setRoute(next, opts){ route = next || 'inicio'; opts = opts || {}; if(opts.category !== undefined) selectedCategory = opts.category; if(opts.productId !== undefined) selectedProductId = opts.productId; window.scrollTo({ top:0, behavior:'smooth' }); render(); }
  function card(p){ const meta=esc(cat(p.category))+(showStock?' · Stock '+Number(p.stock||0):''); return '<article class="card"><div class="media">'+img(p)+'</div><div class="cardBody"><small>'+meta+'</small><h3>'+esc(p.name||'Producto')+'</h3>'+(showPrices?'<div class="price">'+money(p.price)+'</div>':'')+'<div class="actions"><button class="btn" data-add="'+attr(p.id)+'">Agregar</button><button class="btn ghost" data-wa="'+attr(p.id)+'">WhatsApp</button><button class="btn ghost" data-prod="'+attr(p.id)+'">Ver</button></div></div></article>'; }
  function header(){ const name=state.businessName||business.name||'Dinamita Gym'; const logo=business.logo ? '<img class="logo" src="'+attr(business.logo)+'" alt="Logo">' : '<div class="logoFallback">'+esc(initials(name))+'</div>'; return '<header class="top"><div class="wrap topIn"><div class="brand">'+logo+'<div><strong>'+esc(name)+'</strong><small>Tienda online</small></div></div><nav class="nav">'+Object.keys(routeNames).map(r=>'<button type="button" class="'+(route===r?'active':'')+'" data-route="'+r+'">'+routeNames[r]+'</button>').join('')+'</nav></div></header>'; }
  function hero(){ return '<div class="wrap"><section class="hero" style="'+(state.bannerPrimary?'background-image:url(\''+attr(state.bannerPrimary)+'\')':'')+'"><div class="heroOverlay"><div class="eyebrow">Catálogo online</div><h1>'+esc(state.heroTitle||'Explota tu potencial')+'</h1><p>'+esc(state.heroSubtitle||'Conoce nuestros productos y promociones.')+'</p><div class="heroActions"><button class="btn" data-route="tienda">Ver tienda</button><button class="btn ghost" data-general-wa>Escríbenos</button></div></div></section>'+(state.bannerSecondary?'<div class="banner2" style="background-image:url(\''+attr(state.bannerSecondary)+'\')"><h2>Promociones y novedades</h2></div>':'')+'</div>'; }
  function inicio(){ const featured=sortProducts(products).slice(0, Math.max(4, Number(state.limitCatalog||8))); return '<main>'+hero()+'<section class="section wrap"><div class="sectionHead"><div><h2>Categorías</h2><p class="muted">Explora el catálogo por tipo de producto.</p></div><button class="btn ghost" data-route="tienda">Ver todo</button></div><div class="pills">'+(cats().map(c=>'<button class="pill" data-cat="'+attr(c)+'">'+esc(c)+'</button>').join('') || '<div class="empty">No hay categorías disponibles.</div>')+'</div></section><section class="section wrap"><div class="sectionHead"><div><h2>Productos destacados</h2><p class="muted">Selección publicada desde Dinamita POS.</p></div></div><div class="grid">'+(featured.map(card).join('')||'<div class="empty">No hay productos publicados.</div>')+'</div></section></main>'; }
  function tienda(){ const list=filtered(); return '<main><section class="section wrap"><div class="sectionHead"><div><h2>Tienda</h2><p class="muted">'+list.length+' producto(s) disponibles.</p></div></div><div class="tools"><input class="search" id="q" placeholder="Buscar producto..." value="'+attr(query)+'"><div class="pills"><button class="pill '+(!selectedCategory?'active':'')+'" data-cat="">Todo</button>'+cats().map(c=>'<button class="pill '+(selectedCategory===c?'active':'')+'" data-cat="'+attr(c)+'">'+esc(c)+'</button>').join('')+'</div></div><div class="grid">'+(list.map(card).join('')||'<div class="empty">No hay productos con ese filtro.</div>')+'</div></section></main>'; }
  function categoria(){ if(!selectedCategory) selectedCategory = cats()[0] || ''; return tienda(); }
  function producto(){ const p=products.find(x=>x.id===selectedProductId)||products[0]; if(!p) return '<main class="wrap section"><div class="empty">No hay producto.</div></main>'; const meta=[showStock?'Stock: '+Number(p.stock||0):'',showSku?'SKU: '+esc(p.sku||'—'):''].filter(Boolean).join(' · '); return '<main class="wrap section"><section class="detail"><div class="media">'+img(p)+'</div><div><span class="tag">'+esc(cat(p.category))+'</span><h1>'+esc(p.name)+'</h1><p class="muted">Producto del catálogo online.</p>'+(showPrices?'<h2 class="price">'+money(p.price)+'</h2>':'')+(meta?'<p>'+meta+'</p>':'')+'<div class="actions"><button class="btn" data-add="'+attr(p.id)+'">Agregar</button><button class="btn ghost" data-wa="'+attr(p.id)+'">WhatsApp</button><button class="btn ghost" data-route="tienda">Volver a tienda</button></div></div></section></main>'; }
  function contact(){ return '<section class="section contact"><div class="wrap"><h2>Contacto</h2><div class="contactGrid"><div class="info"><strong>Teléfono</strong><p>'+esc(state.phone||business.phone||'Sin definir')+'</p></div><div class="info"><strong>Dirección</strong><p>'+esc(state.address||business.address||'Sin definir')+'</p></div><div class="info"><strong>Horario</strong><p>'+esc(state.hours||'Sin definir')+'</p></div></div><div class="actions" style="margin-top:16px">'+(state.maps?'<a class="btn ghost" href="'+attr(state.maps)+'" target="_blank">Google Maps</a>':'')+(state.facebook?'<a class="btn ghost" href="'+attr(state.facebook)+'" target="_blank">Facebook</a>':'')+(state.instagram?'<a class="btn ghost" href="'+attr(state.instagram)+'" target="_blank">Instagram</a>':'')+'</div></div></section>'; }
  function cartDetail(){ return cart.map(i=>{const p=products.find(x=>x.id===i.id); return p?{p,qty:i.qty,sub:Number(p.price||0)*i.qty}:null}).filter(Boolean); }
  function cartTotal(){ return cartDetail().reduce((a,i)=>a+i.sub,0); }
  function cartCount(){ return cart.reduce((a,i)=>a+Number(i.qty||0),0); }
  function cartBox(){ const detail=cartDetail(); return '<button class="cartToggle" data-cart-toggle>Carrito · '+cartCount()+'</button><aside class="cart '+(cartOpen?'open':'')+'"><div class="cartHead"><strong>Carrito</strong><span>'+(showPrices?money(cartTotal()):cartCount()+' pzs')+'</span></div><div class="cartBody">'+(detail.length?detail.map(i=>'<div class="cartItem"><div><strong>'+esc(i.p.name)+'</strong><br><small>'+(showPrices?money(i.sub):'Cantidad '+i.qty)+'</small></div><div class="qty"><button data-delta="-1" data-id="'+attr(i.p.id)+'">-</button><span>'+i.qty+'</span><button data-delta="1" data-id="'+attr(i.p.id)+'">+</button><button data-remove="'+attr(i.p.id)+'">x</button></div></div>').join(''):'<div class="empty">Carrito vacío.</div>')+'</div><div class="cartFoot"><button class="btn ghost" data-clear>Vaciar</button><button class="btn green" data-send>'+esc(whatsappLabel)+'</button></div></aside>'; }
  function footer(){ return '<footer class="footer">'+esc(state.businessName||business.name||'Dinamita Gym')+' · Página generada por Dinamita POS</footer><button class="floatWa" data-general-wa>WhatsApp</button>'; }
  function render(){ let body = route==='tienda'?tienda():route==='categoria'?categoria():route==='producto'?producto():inicio(); $app.innerHTML = header()+body+contact()+footer()+cartBox(); bind(); }
  function bind(){ document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>setRoute(b.dataset.route)); document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const id=b.dataset.add; const it=cart.find(x=>x.id===id); if(it)it.qty++; else cart.push({id,qty:1}); cartOpen=true; render();}); document.querySelectorAll('[data-wa]').forEach(b=>b.onclick=()=>{const p=products.find(x=>x.id===b.dataset.wa); if(p)openWa('Hola, me interesa:\n'+p.name+'\nPrecio: '+money(p.price));}); document.querySelectorAll('[data-prod]').forEach(b=>b.onclick=()=>setRoute('producto',{productId:b.dataset.prod})); document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>setRoute(b.dataset.cat?'categoria':'tienda',{category:b.dataset.cat||''})); const q=document.getElementById('q'); if(q)q.oninput=e=>{query=e.target.value; route='tienda'; tiendaFocusRender();}; document.querySelectorAll('[data-delta]').forEach(b=>b.onclick=()=>{const it=cart.find(x=>x.id===b.dataset.id); if(it){it.qty=Math.max(1,it.qty+Number(b.dataset.delta)); render();}}); document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cart=cart.filter(x=>x.id!==b.dataset.remove); render();}); const toggle=document.querySelector('[data-cart-toggle]'); if(toggle)toggle.onclick=()=>{cartOpen=!cartOpen; render();}; const cl=document.querySelector('[data-clear]'); if(cl)cl.onclick=()=>{cart=[]; render();}; const send=document.querySelector('[data-send]'); if(send)send.onclick=sendCart; document.querySelectorAll('[data-general-wa]').forEach(b=>b.onclick=()=>openWa('Hola, me interesa información de '+(state.businessName||business.name||'tu negocio'))); }
  function tiendaFocusRender(){ const pos = document.documentElement.scrollTop || document.body.scrollTop; render(); const q=document.getElementById('q'); if(q){q.focus(); q.setSelectionRange(query.length, query.length);} window.scrollTo(0,pos); }
  function sendCart(){ if(!cart.length){alert('Agrega productos al carrito.');return;} const lines=cart.map(i=>{const p=products.find(x=>x.id===i.id); return p?'- '+p.name+' x'+i.qty+' '+money(Number(p.price||0)*i.qty):'';}).filter(Boolean); const total=cart.reduce((a,i)=>{const p=products.find(x=>x.id===i.id); return a+(p?Number(p.price||0)*i.qty:0);},0); openWa(['Hola, quiero hacer este pedido:','',...lines,'','Total: '+money(total)].join('\n')); }
  render();
})();`;
  }

  function downloadBlob(filename, content, type){
    const blob = content instanceof Blob ? content : new Blob([content], { type: type || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 1500);
  }

  function createZipBlob(files){
    const encoder = new TextEncoder();
    const fileEntries = [];
    let offset = 0;
    const chunks = [];
    Object.entries(files).forEach(([name, content]) => {
      const data = content instanceof Uint8Array ? content : encoder.encode(String(content));
      const nameBytes = encoder.encode(name);
      const crc = crc32(data);
      const local = new Uint8Array(30 + nameBytes.length);
      const dv = new DataView(local.buffer);
      dv.setUint32(0, 0x04034b50, true);
      dv.setUint16(4, 20, true); // version
      dv.setUint16(6, 0, true); // flags
      dv.setUint16(8, 0, true); // store
      dv.setUint16(10, 0, true); dv.setUint16(12, 0, true);
      dv.setUint32(14, crc, true);
      dv.setUint32(18, data.length, true);
      dv.setUint32(22, data.length, true);
      dv.setUint16(26, nameBytes.length, true);
      dv.setUint16(28, 0, true);
      local.set(nameBytes, 30);
      chunks.push(local, data);
      fileEntries.push({ name, nameBytes, crc, size:data.length, offset });
      offset += local.length + data.length;
    });
    const centralStart = offset;
    fileEntries.forEach(e => {
      const central = new Uint8Array(46 + e.nameBytes.length);
      const dv = new DataView(central.buffer);
      dv.setUint32(0, 0x02014b50, true);
      dv.setUint16(4, 20, true); dv.setUint16(6, 20, true);
      dv.setUint16(8, 0, true); dv.setUint16(10, 0, true);
      dv.setUint16(12, 0, true); dv.setUint16(14, 0, true);
      dv.setUint32(16, e.crc, true);
      dv.setUint32(20, e.size, true); dv.setUint32(24, e.size, true);
      dv.setUint16(28, e.nameBytes.length, true);
      dv.setUint16(30, 0, true); dv.setUint16(32, 0, true);
      dv.setUint16(34, 0, true); dv.setUint16(36, 0, true);
      dv.setUint32(38, 0, true); dv.setUint32(42, e.offset, true);
      central.set(e.nameBytes, 46);
      chunks.push(central);
      offset += central.length;
    });
    const centralSize = offset - centralStart;
    const end = new Uint8Array(22);
    const dv = new DataView(end.buffer);
    dv.setUint32(0, 0x06054b50, true);
    dv.setUint16(8, fileEntries.length, true);
    dv.setUint16(10, fileEntries.length, true);
    dv.setUint32(12, centralSize, true);
    dv.setUint32(16, centralStart, true);
    chunks.push(end);
    return new Blob(chunks, { type:'application/zip' });
  }

  function crc32(data){
    let crc = -1;
    for(let i=0;i<data.length;i++){
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  const CRC_TABLE = (()=>{
    const table = new Uint32Array(256);
    for(let n=0;n<256;n++){
      let c=n;
      for(let k=0;k<8;k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n]=c>>>0;
    }
    return table;
  })();

  function money(v){
    const n = Number(v || 0);
    try{ return n.toLocaleString('es-MX', { style:'currency', currency:'MXN' }); }catch(_){ return '$' + n.toFixed(2); }
  }

  function sanitizeColor(value){
    const raw = String(value || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toLowerCase() : '#d7192a';
  }

  function detectThemePreset(color){
    const value = sanitizeColor(color);
    const found = Object.entries(THEME_PRESETS).find(([, preset]) => sanitizeColor(preset.color) === value);
    return found ? found[0] : 'custom';
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



