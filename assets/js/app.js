try{ dpEnsureSeedData(); }catch(e){ console.warn(e); }
try{ dpApplyTheme(); }catch(e){ console.warn(e); }
try{ dpRenderBranding(); }catch(e){ console.warn(e); }
const DP_APP_VERSION = window.DP_APP_VERSION || '30.5.6-cachefix-20260505';
const dpModuleHtmlCache = new Map();
/* Dinamita POS v0 - App Loader
   Versión: v0.1.1
   Fecha: 2025-12-15
   Cambio: CSS de módulos precargado (evita "brinco").
*/
const content = document.getElementById('content');

const menu = document.getElementById('menu');
const menuToggle = document.getElementById('dp-menuToggle');
const dpAuthTemplate = `
  <div id="dp-authOverlay" class="dp-authOverlay" aria-hidden="false">
    <div class="dp-authCard">
      <div class="dp-authTitle">Acceso a Dinamita POS</div>
      <div class="dp-authSub">Ingresa con tu usuario y contraseña.</div>
      <form id="dp-loginForm" class="dp-authForm">
        <label>Usuario</label>
        <input id="dp-loginUser" class="input" autocomplete="username" placeholder="admin">
        <label>Contraseña</label>
        <input id="dp-loginPass" class="input" type="password" autocomplete="current-password" placeholder="1234">
        <div id="dp-loginMsg" class="dp-authMsg"></div>
        <button class="btn" type="submit">Entrar</button>
      </form>
      <div class="dp-authHint">Usuario inicial: <strong>admin</strong> · Contraseña: <strong>1234</strong></div>
    </div>
  </div>`;

function dpGetAuthOverlay(){
  return document.getElementById('dp-authOverlay');
}


function dpUpdateUserBadge(){
  const el = document.getElementById('dp-currentUser');
  const user = (typeof dpGetCurrentUser==='function') ? dpGetCurrentUser() : null;
  if(el){ el.textContent = user ? (user.name + ' · ' + user.role) : 'Sin sesión'; }
}

function dpApplyUserAccess(){
  const isAdmin = (typeof dpIsAdmin==='function') ? dpIsAdmin() : true;
  document.querySelectorAll('[data-module="configuracion"]').forEach(btn=>{
    btn.style.display = isAdmin ? '' : 'none';
  });
  dpUpdateUserBadge();
}

function dpBindLoginForm(){
  const form = document.getElementById('dp-loginForm');
  if(!form || form.dataset.dpBound==='1') return;
  form.dataset.dpBound='1';
  form.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const user = document.getElementById('dp-loginUser');
    const pass = document.getElementById('dp-loginPass');
    const msg = document.getElementById('dp-loginMsg');
    const res = dpLogin(user?.value || '', pass?.value || '');
    if(!res.ok){ if(msg) msg.textContent = res.message; return; }
    if(user) user.value='';
    if(pass) pass.value='';
    dpHideLogin();
    dpApplyUserAccess();
    loadModule('ventas');
  });
}

function dpShowLogin(){
  let authOverlay = dpGetAuthOverlay();
  if(!authOverlay){
    document.body.insertAdjacentHTML('beforeend', dpAuthTemplate);
    authOverlay = dpGetAuthOverlay();
  }
  document.body.classList.add('dp-auth-open');
  authOverlay.hidden = false;
  authOverlay.setAttribute('aria-hidden', 'false');
  authOverlay.classList.remove('dp-authOverlay--hidden');
  authOverlay.style.removeProperty('display');
  authOverlay.style.display = 'flex';
  authOverlay.style.visibility = 'visible';
  authOverlay.style.pointerEvents = 'auto';
  authOverlay.style.opacity = '1';
  dpBindLoginForm();
  const u = document.getElementById('dp-loginUser');
  const m = document.getElementById('dp-loginMsg');
  if(m) m.textContent = '';
  setTimeout(()=>{ if(u) u.focus(); }, 20);
}

function dpHideLogin(){
  document.body.classList.remove('dp-auth-open');
  const authOverlay = dpGetAuthOverlay();
  if(authOverlay){
    authOverlay.remove();
  }
}

function dpRequireAuth(){
  const user = (typeof dpGetCurrentUser==='function') ? dpGetCurrentUser() : null;
  if(user){ dpHideLogin(); dpApplyUserAccess(); return true; }
  dpShowLogin();
  return false;
}

function dpSetMenuCollapsed(collapsed){
  document.body.classList.toggle('dp-menu-collapsed', !!collapsed);
  try{ localStorage.setItem('dp_menu_collapsed', collapsed ? '1':'0'); }catch(e){}
  if(menuToggle){
    menuToggle.setAttribute('aria-label', collapsed ? 'Desplegar menú' : 'Plegar menú');
  }
}

(function initMenuToggle(){
  let collapsed = false;
  try{ collapsed = localStorage.getItem('dp_menu_collapsed') === '1'; }catch(e){}
  dpSetMenuCollapsed(collapsed);
  if(menuToggle){
    menuToggle.addEventListener('click', ()=> dpSetMenuCollapsed(!document.body.classList.contains('dp-menu-collapsed')));
  }
})();


function dpClearModuleAssets(){
  // Solo removemos JS de módulo (CSS ya viene precargado en index.html)
  document.querySelectorAll('script[data-dp-module-js]').forEach(el => el.remove());
}

async function loadModule(name){
  try{ if(window.dpStoreReady) await window.dpStoreReady; }catch(e){}
  if(!dpRequireAuth()) return;
  if(name==='configuracion' && typeof dpIsAdmin==='function' && !dpIsAdmin()){
    alert('Solo el administrador puede entrar a Configuración.');
    name = 'ventas';
  }
  dpClearModuleAssets();

  let html = dpModuleHtmlCache.get(name);
  if(!html){
    html = await fetch(`modules/${name}/${name}.html?v=${encodeURIComponent(DP_APP_VERSION)}`, { cache:"no-store" }).then(r=>r.text());
    dpModuleHtmlCache.set(name, html);
  }
  content.innerHTML = html;
  document.querySelectorAll('#menu button[data-module]').forEach(x=>x.classList.toggle('active', x.dataset.module===name));

  const script = document.createElement('script');
  script.src = `modules/${name}/${name}.js?v=${encodeURIComponent(DP_APP_VERSION)}`;
  script.setAttribute("data-dp-module-js","1");
  document.body.appendChild(script);
}

document.querySelectorAll('#menu button[data-module]').forEach(b=>{
  b.addEventListener('click', ()=>{
    // Modo Acceso: bloquea navegación (salvo Acceso) con PIN
    try{
      const accessMode = sessionStorage.getItem("dp_access_mode")==="1";
      const target = b.dataset.module;
      if(accessMode && target !== "acceso"){
        const st = (typeof dpGetState === "function") ? dpGetState() : {};
        const pin = String(st?.meta?.securityPin || "1234");
        const input = prompt("Modo Acceso activo. Ingresa PIN para navegar:");
        if(input !== pin) return;
      }
    }catch(e){}
    loadModule(b.dataset.module);
  });
});

(function initAuth(){
  const btn = document.getElementById('dp-logoutBtn');
  if(btn){
    btn.addEventListener('click', ()=>{
      dpLogout();
      dpUpdateUserBadge();
      content.innerHTML = '';
      dpShowLogin();
    });
  }
  const ok = dpRequireAuth();
  if(ok){
    loadModule('ventas');
  }
})();


// PWA: Service Worker con actualización limpia
(function registerServiceWorker(){
  if (!('serviceWorker' in navigator)) return;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    // Solo recarga cuando el service worker nuevo toma control.
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`./sw.js?v=${encodeURIComponent(DP_APP_VERSION)}`).then((registration) => {
      registration.update().catch(()=>{});
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    }).catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
})();
