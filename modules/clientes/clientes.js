/* Clientes - Dinamita POS v0 */
(function(){
  const $ = (id)=>document.getElementById(id);

  const form = $("c-form");
  const mode = $("c-mode");
  const status = $("c-status");

  const id = $("c-id");
  const idView = $("c-idView");
  const name = $("c-name");
  const phone = $("c-phone");
  const address = $("c-address");
  const notes = $("c-notes");

  const photo = $("c-photo");
  const photoPrev = $("c-photoPrev");
  const photoFallback = $("c-photoFallback");
  const photoClear = $("c-photoClear");
  const photoFrame = photoPrev ? photoPrev.closest(".photoFrame") : null;
  const cameraPreview = $("c-cameraPreview");
  const cameraCanvas = $("c-cameraCanvas");
  const cameraOpen = $("c-cameraOpen");
  const cameraShot = $("c-cameraShot");
  const cameraCancel = $("c-cameraCancel");
  let photoData = "";
  let cameraStream = null;

  const clearBtn = $("c-clear");
  const search = $("c-search");
  const list = $("c-list");
  const empty = $("c-empty");

  const exportCsvBtn = $("c-exportCsv");
  const exportPdfBtn = $("c-exportPdf");
  const statTotal = $("c-statTotal");
  const statPhoto = $("c-statPhoto");
  const statPhone = $("c-statPhone");
  const statMissing = $("c-statMissing");

  function st(){ return dpGetState(); }
  function escapeHtml(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;");
  }

  function initials(client){
    const parts = String(client?.name || "Cliente").trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "C";
    const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (a + b).toUpperCase();
  }

  function renderStats(){
    const clients = st().clients || [];
    const realClients = clients.filter(c=>c.id !== "C000" && c.id !== "GEN");
    const withPhoto = realClients.filter(c=>!!c.photo).length;
    const withPhone = realClients.filter(c=>String(c.phone||"").trim()).length;
    const missing = realClients.filter(c=>!String(c.name||"").trim() || !String(c.phone||"").trim()).length;
    if(statTotal) statTotal.textContent = String(realClients.length);
    if(statPhoto) statPhoto.textContent = String(withPhoto);
    if(statPhone) statPhone.textContent = String(withPhone);
    if(statMissing) statMissing.textContent = String(missing);
  }

  function setModeEdit(client){
    id.value = client.id;
    idView.value = client.id;
    name.value = client.name || "";
    phone.value = client.phone || "";
    address.value = client.address || "";
    notes.value = client.notes || "";
    photoData = client.photo || "";
    syncPhotoPreview();
    mode.textContent = "Modo: Editar";
    status.textContent = "";
    window.scrollTo({top:0, behavior:"smooth"});
  }

  function reset(){
    id.value = "";
    idView.value = "";
    name.value = "";
    phone.value = "";
    address.value = "";
    notes.value = "";
    photo.value = "";
    photoData = "";
    stopCamera();
    syncPhotoPreview();
    mode.textContent = "Modo: Nuevo";
    status.textContent = "";
  }

  function syncPhotoPreview(){
    if(!photoFrame) return;
    photoFrame.classList.toggle("has-photo", !!photoData);
    photoFrame.classList.toggle("is-camera", !!cameraStream);
    if(photoData){
      photoPrev.src = photoData;
      photoClear.style.display = "inline-flex";
    }else{
      photoPrev.src = "";
      photoClear.style.display = "none";
    }
    if(photoFallback) photoFallback.style.display = (!photoData && !cameraStream) ? "" : "none";
  }

  function imageToDataUrl(source, maxSize=640){
    const canvas = document.createElement("canvas");
    const w = source.videoWidth || source.naturalWidth || source.width || maxSize;
    const h = source.videoHeight || source.naturalHeight || source.height || maxSize;
    const scale = Math.min(1, maxSize / Math.max(w, h));
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", .82);
  }

  function readFileAsImage(file){
    return new Promise((resolve, reject)=>{
      const r = new FileReader();
      r.onload = ()=>{
        const img = new Image();
        img.onload = ()=>resolve(img);
        img.onerror = reject;
        img.src = String(r.result || "");
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function onPhotoChange(){
    const f = photo.files && photo.files[0];
    if(!f) return;
    try{
      const img = await readFileAsImage(f);
      photoData = imageToDataUrl(img);
      stopCamera();
      syncPhotoPreview();
    }catch(err){
      alert("No se pudo leer la imagen.");
    }
  }

  async function openCamera(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      alert("Este navegador no permite abrir la cámara desde aquí. Puedes subir una imagen.");
      return;
    }
    try{
      stopCamera();
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 900 }, height: { ideal: 700 } },
        audio: false
      });
      cameraPreview.srcObject = cameraStream;
      await cameraPreview.play();
      cameraShot.hidden = false;
      cameraCancel.hidden = false;
      cameraOpen.hidden = true;
      syncPhotoPreview();
    }catch(err){
      alert("No se pudo abrir la cámara. Revisa permisos del navegador.");
      stopCamera();
    }
  }

  function captureCamera(){
    if(!cameraStream || !cameraPreview) return;
    photoData = imageToDataUrl(cameraPreview);
    if(cameraCanvas){
      cameraCanvas.width = cameraPreview.videoWidth || 640;
      cameraCanvas.height = cameraPreview.videoHeight || 480;
      cameraCanvas.getContext("2d").drawImage(cameraPreview,0,0,cameraCanvas.width,cameraCanvas.height);
    }
    stopCamera();
    syncPhotoPreview();
  }

  function stopCamera(){
    if(cameraStream){
      cameraStream.getTracks().forEach(t=>t.stop());
      cameraStream = null;
    }
    if(cameraPreview) cameraPreview.srcObject = null;
    if(cameraShot) cameraShot.hidden = true;
    if(cameraCancel) cameraCancel.hidden = true;
    if(cameraOpen) cameraOpen.hidden = false;
    if(photoFrame) photoFrame.classList.remove("is-camera");
  }

  function getFiltered(){
    const q = (search.value||"").trim().toLowerCase();
    let clients = (st().clients||[]);
    if(!q) return clients;
    return clients.filter(c=>{
      const hay = `${(c.id||"").toLowerCase()} ${(c.name||"").toLowerCase()} ${(c.phone||"").toLowerCase()}`;
      return hay.includes(q);
    });
  }

  function render(){
    const clients = getFiltered();
    list.innerHTML = "";
    if(!clients.length){
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    clients.slice(0, 600).forEach(c=>{
      const row = document.createElement("div");
      row.className = "crow";
      let avatar;
      if(c.photo){
        avatar = document.createElement("img");
        avatar.className = "cavatar";
        avatar.alt = "Foto";
        avatar.src = c.photo;
      }else{
        avatar = document.createElement("div");
        avatar.className = "cavatarFallback";
        avatar.textContent = initials(c);
      }

      const main = document.createElement("div");
      main.className = "cmain";
      main.innerHTML = `
        <div class="ctitle">${escapeHtml(c.name || "(Sin nombre)")}</div>
        <div class="cmeta">
          <span class="pill">ID: ${escapeHtml(c.id||"")}</span>
          ${c.phone ? `<span class="pill">Tel: ${escapeHtml(c.phone)}</span>` : ""}
          ${c.address ? `<span class="pill">${escapeHtml(c.address)}</span>` : ""}
        </div>
        ${c.notes ? `<div class="cnotes"><strong>Nota:</strong> ${escapeHtml(c.notes)}</div>` : ""}
      `;

      const actions = document.createElement("div");
      actions.className = "cactions";

      const edit = document.createElement("button");
      edit.className = "btn btn--ghost";
      edit.type = "button";
      edit.textContent = "Editar";
      edit.onclick = ()=> setModeEdit(c);

      const del = document.createElement("button");
      del.className = "btn";
      del.type = "button";
      del.textContent = "Borrar";
      del.onclick = ()=>{
        const check = dpCanDeleteClient(c.id);
        if(!check.ok){
          alert(check.reason);
          return;
        }
        if(!confirm(`¿Borrar cliente "${c.name}" (${c.id})?`)) return;
        const res = dpDeleteClient(c.id);
        if(!res.ok){
          alert(res.reason);
        }else{
          renderStats();
          render();
          reset();
        }
      };

      actions.appendChild(edit);
      actions.appendChild(del);

      row.appendChild(avatar);
      row.appendChild(main);
      row.appendChild(actions);

      list.appendChild(row);
    });
  }

  function save(e){
    e.preventDefault();
    const n = (name.value||"").trim();
    if(!n){
      status.textContent = "Nombre requerido.";
      return;
    }
    if(id.value){
      dpUpdateClient(id.value, {
        name: n,
        phone: (phone.value||"").trim(),
        address: (address.value||"").trim(),
        notes: (notes.value||"").trim(),
        photo: photoData
      });
      status.textContent = "Cliente actualizado.";
    }else{
      dpAddClient({
        name: n,
        phone: (phone.value||"").trim(),
        address: (address.value||"").trim(),
        notes: (notes.value||"").trim(),
        photo: photoData
      });
      status.textContent = "Cliente agregado.";
    }
    const doneMsg = status.textContent;
    renderStats();
    render();
    reset();
    status.textContent = doneMsg;
  }

  function exportCsv(){
    const clients = getFiltered();
    const rows = [["id","name","phone","address","notes"]];
    clients.forEach(c=>{
      rows.push([c.id, c.name, c.phone||"", c.address||"", (c.notes||"").replaceAll("\n"," ")]);
    });
    const csv = rows.map(r=>r.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `clientes_${(window.dpYMDLocal ? window.dpYMDLocal(new Date()) : new Date().toISOString().slice(0,10))}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportPdf(){
    const clients = getFiltered();
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Clientes</title>
<style>
  body{ font-family: Arial, sans-serif; padding:16px; }
  h1{ margin:0 0 10px 0; }
  .item{ border:1px solid #ddd; border-radius:10px; padding:10px; margin-bottom:10px; }
  .meta{ font-size:12px; color:#444; margin-top:4px; display:flex; gap:8px; flex-wrap:wrap; }
  .pill{ border:1px solid #ddd; border-radius:999px; padding:2px 8px; }
</style>
</head>
<body>
<h1>Clientes</h1>
${clients.map(c=>`
  <div class="item">
    <strong>${escapeHtml(c.name||"")}</strong>
    <div class="meta">
      <span class="pill">ID: ${escapeHtml(c.id||"")}</span>
      ${c.phone?`<span class="pill">Tel: ${escapeHtml(c.phone)}</span>`:""}
      ${c.address?`<span class="pill">${escapeHtml(c.address)}</span>`:""}
    </div>
    ${c.notes?`<div class="meta"><span class="pill">Nota: ${escapeHtml(c.notes)}</span></div>`:""}
  </div>
`).join("")}
<script>window.focus();</script>
</body>
</html>`;
    const w = window.open("", "_blank");
    if(!w){ alert("Tu navegador bloqueó la ventana emergente."); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  // events
  form.addEventListener("submit", save);
  photo.addEventListener("change", onPhotoChange);
  photoClear.addEventListener("click", ()=>{ photoData=""; stopCamera(); syncPhotoPreview(); });
  if(cameraOpen) cameraOpen.addEventListener("click", openCamera);
  if(cameraShot) cameraShot.addEventListener("click", captureCamera);
  if(cameraCancel) cameraCancel.addEventListener("click", ()=>{ stopCamera(); syncPhotoPreview(); });
  clearBtn.addEventListener("click", ()=>{ reset(); render(); });
  search.addEventListener("input", render);
  exportCsvBtn.addEventListener("click", exportCsv);
  exportPdfBtn.addEventListener("click", exportPdf);

  // init
  try{ dpEnsureSeedData(); }catch(e){}
  syncPhotoPreview();
  renderStats();
  render();
  reset();
})();
