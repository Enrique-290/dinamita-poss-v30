/* Reportes - Dinamita POS v0
   - Usa dpGetSalesRows para consistencia (desglosado por producto/concepto)
   - General / Productos / Categoría / Membresías
   - Export CSV (Excel) y PDF (impresión)
*/
(function(){
  const $ = (id)=>document.getElementById(id);

  const rType = $("r-type");
  const rFrom = $("r-from");
  const rTo = $("r-to");
  const rCategory = $("r-category");
  const rApply = $("r-apply");
  const rReset = $("r-reset");
  const rExportCsv = $("r-exportCsv");
  const rExportPdf = $("r-exportPdf");

  const rStats = $("r-stats");
  const rTitle = $("r-title");
  const rSubtitle = $("r-subtitle");
  const rThead = $("r-thead");
  const rTbody = $("r-tbody");
  const rEmpty = $("r-empty");
  const rSide = $("r-side");

  let currentRows = [];

  function state(){ return dpGetState(); }
  function fmtMoney(n){ return dpFmtMoney ? dpFmtMoney(n) : ("$"+Number(n||0).toFixed(2)); }

  function getClientName(clientId){
    const st = state();
    const c = (st.clients||[]).find(x=>x.id===clientId);
    if(c) return c.name;
    if(clientId==="GEN") return "Cliente General";
    return clientId || "Cliente";
  }

  function uniq(arr){ return Array.from(new Set(arr)); }

  const PAYMENT_KEYS = ["efectivo", "tarjeta", "transferencia", "otro"];

  function blankPayments(){
    return { efectivo:0, tarjeta:0, transferencia:0, otro:0 };
  }

  function normalizePayment(payment){
    const key = String(payment || "otro").trim().toLowerCase();
    return PAYMENT_KEYS.includes(key) ? key : "otro";
  }

  function addPayment(payments, payment, amount){
    const key = normalizePayment(payment);
    payments[key] = Number(payments[key] || 0) + Number(amount || 0);
  }

  function mergePayments(target, source){
    PAYMENT_KEYS.forEach(key => {
      target[key] = Number(target[key] || 0) + Number(source?.[key] || 0);
    });
    return target;
  }

  function paymentCells(payments){
    const p = payments || blankPayments();
    return `
      <td class="right">${fmtMoney(p.efectivo || 0)}</td>
      <td class="right">${fmtMoney(p.tarjeta || 0)}</td>
      <td class="right">${fmtMoney(p.transferencia || 0)}</td>
      <td class="right">${fmtMoney(p.otro || 0)}</td>
    `;
  }

  function dateInRange(date, from="", to=""){
    const d = String(date || "").slice(0,10);
    if(!d) return false;
    if(from && d < from) return false;
    if(to && d > to) return false;
    return true;
  }

  function sanitizeLabel(s){
    return String(s||"")
      .replaceAll("dias","días")
      .replaceAll("pina","piña")
      .replaceAll("higenico","higiénico")
      .trim();
  }

  function productFamily(name, category=""){
    const n = sanitizeLabel(name).toLowerCase();
    const c = sanitizeLabel(category).toLowerCase();
    const map = [
      ["bonafont","Bonafont"],
      ["gatorade","Gatorade"],
      ["volt","Volt"],
      ["electrolit","Electrolit"],
      ["monster","Monster"],
      ["psychotic","Psychotic"],
      ["deli barras","Deli barras"],
      ["delai barras","Deli barras"],
      ["barras muscle sandwich","Barras Muscle Sandwich"],
      ["toma de","Tomas"],
      ["cafe","Café"],
      ["toalla","Toallas"],
      ["toallas","Toallas"]
    ];
    for(const [k,v] of map){ if(n.startsWith(k)) return v; }
    if(c && c !== 'sin categoría' && c !== 'membresías' && c !== 'servicios') return sanitizeLabel(category);
    const firstTwo = sanitizeLabel(name).split(/\s+/).slice(0,2).join(' ').trim();
    const first = sanitizeLabel(name).split(/\s+/)[0] || 'Productos';
    return firstTwo.length <= 18 ? firstTwo : first;
  }

  function buildOperationalData(rows, from="", to=""){
    const memberships = new Map();
    const families = new Map();
    const services = new Map();
    const expenses = new Map();
    let membershipTotal = 0, productsTotal = 0, serviceTotal = 0, expenseTotal = 0;
    const membershipPayments = blankPayments();
    const productsPayments = blankPayments();
    const servicePayments = blankPayments();
    const expensePayments = blankPayments();
    for(const r of rows){
      if(r.kind === 'membresia'){
        const key = sanitizeLabel(r.product);
        if(!memberships.has(key)) memberships.set(key, {name:key, qty:0, total:0, payments:blankPayments()});
        const item = memberships.get(key);
        item.qty += Number(r.qty||0);
        item.total += Number(r.total||0);
        addPayment(item.payments, r.paymentMethod, r.total);
        addPayment(membershipPayments, r.paymentMethod, r.total);
        membershipTotal += Number(r.total||0);
      }else if(r.kind === 'venta'){
        const fam = productFamily(r.product, r.category);
        if(!families.has(fam)) families.set(fam, new Map());
        const byProduct = families.get(fam);
        const key = sanitizeLabel(r.product);
        if(!byProduct.has(key)) byProduct.set(key, {name:key, qty:0, total:0, payments:blankPayments()});
        const item = byProduct.get(key);
        item.qty += Number(r.qty||0);
        item.total += Number(r.total||0);
        addPayment(item.payments, r.paymentMethod, r.total);
        addPayment(productsPayments, r.paymentMethod, r.total);
        productsTotal += Number(r.total||0);
      }else if(r.kind === 'servicio'){
        const key = sanitizeLabel(r.product || "Servicio");
        if(!services.has(key)) services.set(key, {name:key, qty:0, total:0, payments:blankPayments()});
        const item = services.get(key);
        item.qty += Number(r.qty||0);
        item.total += Number(r.total||0);
        addPayment(item.payments, r.paymentMethod, r.total);
        addPayment(servicePayments, r.paymentMethod, r.total);
        serviceTotal += Number(r.total||0);
      }
    }

    const st = state();
    (Array.isArray(st.expenses) ? st.expenses : [])
      .filter(e => dateInRange(e.date || e.createdAt, from, to))
      .forEach(e => {
        const key = sanitizeLabel(e.description || e.category || "Gasto");
        if(!expenses.has(key)) expenses.set(key, {name:key, qty:0, total:0, payments:blankPayments()});
        const item = expenses.get(key);
        item.qty += 1;
        item.total += Number(e.amount || 0);
        addPayment(item.payments, e.payment, e.amount);
        addPayment(expensePayments, e.payment, e.amount);
        expenseTotal += Number(e.amount || 0);
      });

    const membershipList = Array.from(memberships.values()).sort((a,b)=>a.name.localeCompare(b.name));
    const serviceList = Array.from(services.values()).sort((a,b)=>a.name.localeCompare(b.name));
    const expenseList = Array.from(expenses.values()).sort((a,b)=>b.total-a.total || a.name.localeCompare(b.name));
    const familyList = Array.from(families.entries()).map(([family, map])=>{
      const items = Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name));
      const subtotal = items.reduce((a,b)=>a+Number(b.total||0),0);
      const payments = items.reduce((acc, item)=>mergePayments(acc, item.payments), blankPayments());
      return { family, items, subtotal, payments };
    }).sort((a,b)=>b.subtotal-a.subtotal || a.family.localeCompare(b.family));

    const cutList = ((typeof dpGetCashSessions === "function") ? dpGetCashSessions() : [])
      .filter(c => dateInRange(c.closedAt || c.openedAt, from, to))
      .map(c => {
        const payments = blankPayments();
        mergePayments(payments, c?.totals?.byPayment || {});
        return {
          name: `${String(c.closedAt || c.openedAt || "").slice(0,10)} - ${c.userName || "Usuario"} - ${c.status === "open" ? "Abierta" : "Cerrada"}`,
          qty: 1,
          total: Number(c?.totals?.total || 0),
          payments,
          expectedCash: Number(c?.expectedCash || 0),
          closingAmount: c?.closingAmount == null ? null : Number(c.closingAmount || 0),
          difference: Number(c?.difference || 0)
        };
      });
    const cutPayments = cutList.reduce((acc, item)=>mergePayments(acc, item.payments), blankPayments());
    const cutTotal = cutList.reduce((acc, item)=>acc + Number(item.total || 0), 0);
    const cutExpectedCash = cutList.reduce((acc, item)=>acc + Number(item.expectedCash || 0), 0);
    const cutClosingAmount = cutList.reduce((acc, item)=>acc + Number(item.closingAmount || 0), 0);
    const cutDifference = cutList.reduce((acc, item)=>acc + Number(item.difference || 0), 0);

    const incomePayments = blankPayments();
    mergePayments(incomePayments, membershipPayments);
    mergePayments(incomePayments, productsPayments);
    mergePayments(incomePayments, servicePayments);
    const incomeTotal = membershipTotal + productsTotal + serviceTotal;

    return {
      membershipList,
      familyList,
      serviceList,
      expenseList,
      cutList,
      membershipTotal,
      productsTotal,
      serviceTotal,
      expenseTotal,
      incomeTotal,
      netTotal: incomeTotal - expenseTotal,
      grandTotal: incomeTotal,
      cutTotal,
      cutExpectedCash,
      cutClosingAmount,
      cutDifference,
      membershipPayments,
      productsPayments,
      servicePayments,
      expensePayments,
      incomePayments,
      cutPayments
    };
  }

  function loadCategories(){
    const st = state();
    const cats = uniq((st.products||[]).map(p=>p.category).filter(Boolean)).sort((a,b)=>a.localeCompare(b));
    rCategory.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "Todas las categorías";
    rCategory.appendChild(opt0);
    cats.forEach(c=>{
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      rCategory.appendChild(o);
    });
  }

  function setStats(rows){
    const total = rows.reduce((a,b)=>a+Number(b.total||0),0);
    const ventas = rows.filter(r=>r.kind==="venta").reduce((a,b)=>a+Number(b.total||0),0);
    const memb = rows.filter(r=>r.kind==="membresia").reduce((a,b)=>a+Number(b.total||0),0);
    const serv = rows.filter(r=>r.kind==="servicio").reduce((a,b)=>a+Number(b.total||0),0);
    const tickets = new Set(rows.map(r=>r.ticket).filter(Boolean));
    const avg = tickets.size ? total / tickets.size : 0;

    rStats.innerHTML = `
      <div class="rstat"><div class="k">Ventas (productos)</div><div class="v">${fmtMoney(ventas)}</div></div>
      <div class="rstat"><div class="k">Membresías</div><div class="v">${fmtMoney(memb)}</div></div>
      <div class="rstat"><div class="k">Servicios</div><div class="v">${fmtMoney(serv)}</div></div>
      <div class="rstat"><div class="k">Ticket promedio</div><div class="v">${fmtMoney(avg)}</div></div>
      <div class="rstat"><div class="k">Total</div><div class="v">${fmtMoney(total)}</div></div>
    `;

    rSide.innerHTML = `
      <div class="sbox">
        <div class="t">Totales por tipo</div>
        <div class="m">
          <span class="pill">Ventas: ${fmtMoney(ventas)}</span>
          <span class="pill">Membresías: ${fmtMoney(memb)}</span>
          <span class="pill">Servicios: ${fmtMoney(serv)}</span>
          <span class="pill">TOTAL: ${fmtMoney(total)}</span>
        </div>
      </div>
      <div class="sbox">
        <div class="t">Rango</div>
        <div class="m">
          <span class="pill">Desde: ${rFrom.value || "—"}</span>
          <span class="pill">Hasta: ${rTo.value || "—"}</span>
        </div>
      </div>
    `;
  }

  function setTable(headers, rows, rowFn){
    rThead.innerHTML = `<tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr>`;
    rTbody.innerHTML = rows.map(rowFn).join("");
    rEmpty.style.display = rows.length ? "none" : "block";
  }

  function renderOperationalReport(from, to){
    rTitle.textContent = "Super reporte operativo";
    rSubtitle.textContent = "Resumen tipo Excel: ingresos por concepto, pagos, gastos y cortes de caja.";
    const op = buildOperationalData(currentRows, from, to);
    rStats.innerHTML = `
      <div class="rstat"><div class="k">Bloques producto</div><div class="v">${op.familyList.length}</div></div>
      <div class="rstat"><div class="k">Ingresos</div><div class="v">${fmtMoney(op.incomeTotal)}</div></div>
      <div class="rstat"><div class="k">Gastos</div><div class="v">${fmtMoney(op.expenseTotal)}</div></div>
      <div class="rstat"><div class="k">Neto</div><div class="v">${fmtMoney(op.netTotal)}</div></div>
      <div class="rstat"><div class="k">Cortes</div><div class="v">${op.cutList.length}</div></div>
    `;

    const rowsHtml = [];
    const cols = 7;
    const renderOpRow = (it) => `
      <tr>
        <td>${it.name}</td>
        <td class="right">${it.qty}</td>
        ${paymentCells(it.payments)}
        <td class="right"><strong>${fmtMoney(it.total)}</strong></td>
      </tr>`;
    const renderSubtotal = (label, total, payments) => `
      <tr class="repSubtotal">
        <td><strong>${label}</strong></td>
        <td></td>
        ${paymentCells(payments)}
        <td class="right"><strong>${fmtMoney(total)}</strong></td>
      </tr>`;

    if(op.membershipList.length){
      rowsHtml.push(`<tr class="repSection"><td colspan="${cols}">MembresÃ­as</td></tr>`);
      op.membershipList.forEach(it=>rowsHtml.push(renderOpRow(it)));
      rowsHtml.push(renderSubtotal("Total membresÃ­as", op.membershipTotal, op.membershipPayments));
    }
    op.familyList.forEach(f=>{
      rowsHtml.push(`<tr class="repSection"><td colspan="${cols}">${f.family}</td></tr>`);
      f.items.forEach(it=>rowsHtml.push(renderOpRow(it)));
      rowsHtml.push(renderSubtotal(`Total ${f.family}`, f.subtotal, f.payments));
    });
    if(op.serviceList.length){
      rowsHtml.push(`<tr class="repSection"><td colspan="${cols}">Servicios</td></tr>`);
      op.serviceList.forEach(it=>rowsHtml.push(renderOpRow(it)));
      rowsHtml.push(renderSubtotal("Total servicios", op.serviceTotal, op.servicePayments));
    }
    rowsHtml.push(`<tr class="repGrand"><td><strong>Total ingresos</strong></td><td></td>${paymentCells(op.incomePayments)}<td class="right"><strong>${fmtMoney(op.incomeTotal)}</strong></td></tr>`);
    if(op.expenseList.length){
      rowsHtml.push(`<tr class="repSection"><td colspan="${cols}">Gastos</td></tr>`);
      op.expenseList.forEach(it=>rowsHtml.push(renderOpRow(it)));
      rowsHtml.push(renderSubtotal("Total gastos", op.expenseTotal, op.expensePayments));
      rowsHtml.push(`<tr class="repGrand"><td><strong>Neto operativo</strong></td><td></td><td colspan="4"></td><td class="right"><strong>${fmtMoney(op.netTotal)}</strong></td></tr>`);
    }
    if(op.cutList.length){
      rowsHtml.push(`<tr class="repSection"><td colspan="${cols}">Cortes de caja</td></tr>`);
      op.cutList.forEach(it=>rowsHtml.push(renderOpRow(it)));
      rowsHtml.push(renderSubtotal("Total cortes", op.cutTotal, op.cutPayments));
    }

    rThead.innerHTML = `<tr><th>Concepto</th><th class="right">Pzs / Reg.</th><th class="right">Efectivo</th><th class="right">Tarjeta</th><th class="right">Transferencia</th><th class="right">Otro</th><th class="right">Total</th></tr>`;
    rTbody.innerHTML = rowsHtml.join('');
    rEmpty.style.display = rowsHtml.length ? 'none' : 'block';
    rSide.innerHTML = `
      <div class="sbox"><div class="t">Resumen operativo</div><div class="m">
        <span class="pill">MembresÃ­as: ${fmtMoney(op.membershipTotal)}</span>
        <span class="pill">Productos: ${fmtMoney(op.productsTotal)}</span>
        <span class="pill">Servicios: ${fmtMoney(op.serviceTotal)}</span>
        <span class="pill">Ingresos: ${fmtMoney(op.incomeTotal)}</span>
        <span class="pill">Gastos: ${fmtMoney(op.expenseTotal)}</span>
        <span class="pill">Neto: ${fmtMoney(op.netTotal)}</span>
        <span class="pill">Bloques: ${op.familyList.length}</span>
      </div></div>
      <div class="sbox"><div class="t">Cobros por pago</div><div class="m">
        <span class="pill">Efectivo: ${fmtMoney(op.incomePayments.efectivo)}</span>
        <span class="pill">Tarjeta: ${fmtMoney(op.incomePayments.tarjeta)}</span>
        <span class="pill">Transferencia: ${fmtMoney(op.incomePayments.transferencia)}</span>
        <span class="pill">Otro: ${fmtMoney(op.incomePayments.otro)}</span>
      </div></div>
      <div class="sbox"><div class="t">Gastos por pago</div><div class="m">
        <span class="pill">Efectivo: ${fmtMoney(op.expensePayments.efectivo)}</span>
        <span class="pill">Tarjeta: ${fmtMoney(op.expensePayments.tarjeta)}</span>
        <span class="pill">Transferencia: ${fmtMoney(op.expensePayments.transferencia)}</span>
        <span class="pill">Otro: ${fmtMoney(op.expensePayments.otro)}</span>
      </div></div>
      <div class="sbox"><div class="t">Cortes</div><div class="m">
        <span class="pill">Cortes: ${op.cutList.length}</span>
        <span class="pill">Venta cortes: ${fmtMoney(op.cutTotal)}</span>
        <span class="pill">Esperado: ${fmtMoney(op.cutExpectedCash)}</span>
        <span class="pill">Contado: ${fmtMoney(op.cutClosingAmount)}</span>
        <span class="pill">Diferencia: ${fmtMoney(op.cutDifference)}</span>
      </div></div>
      <div class="sbox"><div class="t">Rango</div><div class="m">
        <span class="pill">Desde: ${rFrom.value || "â€”"}</span>
        <span class="pill">Hasta: ${rTo.value || "â€”"}</span>
      </div></div>`;
  }

  function operationalCsvData(op){
    const data = [];
    const row = (it) => [
      it.name,
      it.qty,
      it.payments?.efectivo || 0,
      it.payments?.tarjeta || 0,
      it.payments?.transferencia || 0,
      it.payments?.otro || 0,
      it.total || 0
    ];
    const subtotal = (label, total, payments) => [
      label,
      "",
      payments?.efectivo || 0,
      payments?.tarjeta || 0,
      payments?.transferencia || 0,
      payments?.otro || 0,
      total || 0
    ];

    if(op.membershipList.length){
      data.push(["Membresias","","","","","",""]);
      op.membershipList.forEach(it=>data.push(row(it)));
      data.push(subtotal("Total membresias", op.membershipTotal, op.membershipPayments));
    }
    op.familyList.forEach(f=>{
      data.push([f.family,"","","","","",""]);
      f.items.forEach(it=>data.push(row(it)));
      data.push(subtotal(`Total ${f.family}`, f.subtotal, f.payments));
    });
    if(op.serviceList.length){
      data.push(["Servicios","","","","","",""]);
      op.serviceList.forEach(it=>data.push(row(it)));
      data.push(subtotal("Total servicios", op.serviceTotal, op.servicePayments));
    }
    data.push(subtotal("Total ingresos", op.incomeTotal, op.incomePayments));
    if(op.expenseList.length){
      data.push(["Gastos","","","","","",""]);
      op.expenseList.forEach(it=>data.push(row(it)));
      data.push(subtotal("Total gastos", op.expenseTotal, op.expensePayments));
      data.push(["Neto operativo","","","","","",op.netTotal]);
    }
    if(op.cutList.length){
      data.push(["Cortes de caja","","","","","",""]);
      op.cutList.forEach(it=>data.push(row(it)));
      data.push(subtotal("Total cortes", op.cutTotal, op.cutPayments));
      data.push(["Esperado en caja","","","","","",op.cutExpectedCash]);
      data.push(["Dinero contado","","","","","",op.cutClosingAmount]);
      data.push(["Diferencia cortes","","","","","",op.cutDifference]);
    }
    return data;
  }

  function render(){
    const type = rType.value;
    const from = rFrom.value || "";
    const to = rTo.value || "";
    const cat = rCategory.value || "";

    const all = dpGetSalesRows({from, to});
    currentRows = all.slice();

    // Apply category filter only to relevant views
    if(cat){
      currentRows = currentRows.filter(r => (r.category||"") === cat);
    }

    if(type === "operativo"){
      renderOperationalReport(from, to);
      return;
      rTitle.textContent = "Super reporte operativo";
      rSubtitle.textContent = "Resumen tipo Excel: membresías, productos por bloques y total general.";
      const op = buildOperationalData(currentRows);
      rStats.innerHTML = `
        <div class="rstat"><div class="k">Bloques producto</div><div class="v">${op.familyList.length}</div></div>
        <div class="rstat"><div class="k">Membresías</div><div class="v">${fmtMoney(op.membershipTotal)}</div></div>
        <div class="rstat"><div class="k">Productos</div><div class="v">${fmtMoney(op.productsTotal)}</div></div>
        <div class="rstat"><div class="k">Total general</div><div class="v">${fmtMoney(op.grandTotal)}</div></div>
      `;
      const rowsHtml = [];
      if(op.membershipList.length){
        rowsHtml.push(`<tr class="repSection"><td colspan="3">Membresías</td></tr>`);
        op.membershipList.forEach(it=>{
          rowsHtml.push(`
            <tr>
              <td>${it.name}</td>
              <td class="right">${it.qty}</td>
              <td class="right"><strong>${fmtMoney(it.total)}</strong></td>
            </tr>`);
        });
        rowsHtml.push(`<tr class="repSubtotal"><td><strong>Total membresías</strong></td><td></td><td class="right"><strong>${fmtMoney(op.membershipTotal)}</strong></td></tr>`);
      }
      op.familyList.forEach(f=>{
        rowsHtml.push(`<tr class="repSection"><td colspan="3">${f.family}</td></tr>`);
        f.items.forEach(it=>{
          rowsHtml.push(`
            <tr>
              <td>${it.name}</td>
              <td class="right">${it.qty}</td>
              <td class="right"><strong>${fmtMoney(it.total)}</strong></td>
            </tr>`);
        });
        rowsHtml.push(`<tr class="repSubtotal"><td><strong>Total ${f.family}</strong></td><td></td><td class="right"><strong>${fmtMoney(f.subtotal)}</strong></td></tr>`);
      });
      rowsHtml.push(`<tr class="repGrand"><td><strong>Total general</strong></td><td></td><td class="right"><strong>${fmtMoney(op.grandTotal)}</strong></td></tr>`);
      rThead.innerHTML = `<tr><th>Concepto</th><th class="right">Piezas</th><th class="right">Total</th></tr>`;
      rTbody.innerHTML = rowsHtml.join('');
      rEmpty.style.display = rowsHtml.length ? 'none' : 'block';
      rSide.innerHTML = `
        <div class="sbox"><div class="t">Resumen operativo</div><div class="m">
          <span class="pill">Membresías: ${fmtMoney(op.membershipTotal)}</span>
          <span class="pill">Productos: ${fmtMoney(op.productsTotal)}</span>
          <span class="pill">Bloques: ${op.familyList.length}</span>
          <span class="pill">TOTAL: ${fmtMoney(op.grandTotal)}</span>
        </div></div>
        <div class="sbox"><div class="t">Rango</div><div class="m">
          <span class="pill">Desde: ${rFrom.value || "—"}</span>
          <span class="pill">Hasta: ${rTo.value || "—"}</span>
        </div></div>`;
      return;
    }

    if(type === "cortes"){
      rTitle.textContent = "Cortes de caja";
      rSubtitle.textContent = "Aperturas y cierres de caja por usuario.";
      const cuts = ((typeof dpGetCashSessions === "function") ? dpGetCashSessions() : []).filter(c=>{
        const date = String(c.openedAt||"").slice(0,10);
        if(from && date < from) return false;
        if(to && date > to) return false;
        return true;
      });
      const cutsOpen = cuts.filter(c=>c.status==='open').length;
      const cutsClosed = cuts.filter(c=>c.status==='closed').length;
      const cutsTotal = cuts.reduce((a,b)=>a+Number(b?.totals?.total||0),0);
      const cutsCashExpected = cuts.reduce((a,b)=>a+Number(b?.expectedCash||0),0);
      const cutsDiff = cuts.reduce((a,b)=>a+Number(b?.difference||0),0);
      const cutsCash = cuts.reduce((a,b)=>a+Number(b?.totals?.byPayment?.efectivo||0),0);
      const cutsCard = cuts.reduce((a,b)=>a+Number(b?.totals?.byPayment?.tarjeta||0),0);
      const cutsTransfer = cuts.reduce((a,b)=>a+Number(b?.totals?.byPayment?.transferencia||0),0);
      rStats.innerHTML = `
        <div class="rstat"><div class="k">Cortes</div><div class="v">${cuts.length}</div></div>
        <div class="rstat"><div class="k">Abiertas</div><div class="v">${cutsOpen}</div></div>
        <div class="rstat"><div class="k">Cerradas</div><div class="v">${cutsClosed}</div></div>
        <div class="rstat"><div class="k">Venta total</div><div class="v">${fmtMoney(cutsTotal)}</div></div>
        <div class="rstat"><div class="k">Diferencia acumulada</div><div class="v">${fmtMoney(cutsDiff)}</div></div>
      `;
      setTable(
        ["Usuario","Apertura","Cierre","Fondo","Efectivo","Tarjeta","Transferencia","Ventas","Esperado","Contado","Diferencia","Estado"],
        cuts,
        c => `
          <tr>
            <td>${c.userName||""}</td>
            <td>${c.openedAt||""}</td>
            <td>${c.closedAt||""}</td>
            <td class="right">${fmtMoney(c.openingAmount||0)}</td>
            <td class="right">${fmtMoney(c?.totals?.byPayment?.efectivo||0)}</td>
            <td class="right">${fmtMoney(c?.totals?.byPayment?.tarjeta||0)}</td>
            <td class="right">${fmtMoney(c?.totals?.byPayment?.transferencia||0)}</td>
            <td class="right">${fmtMoney(c?.totals?.total||0)}</td>
            <td class="right">${fmtMoney(c.expectedCash||0)}</td>
            <td class="right">${c.closingAmount==null?"—":fmtMoney(c.closingAmount)}</td>
            <td class="right"><strong>${c.closingAmount==null?"—":fmtMoney(c.difference||0)}</strong></td>
            <td>${c.status==="open"?"Abierta":"Cerrada"}</td>
          </tr>
        `
      );
      rSide.innerHTML = `
        <div class="sbox"><div class="t">Resumen de cortes</div><div class="m">
          <span class="pill">Abiertas: ${cutsOpen}</span>
          <span class="pill">Cerradas: ${cutsClosed}</span>
          <span class="pill">Ventas: ${fmtMoney(cutsTotal)}</span>
          <span class="pill">Efectivo: ${fmtMoney(cutsCash)}</span>
          <span class="pill">Tarjeta: ${fmtMoney(cutsCard)}</span>
          <span class="pill">Transferencia: ${fmtMoney(cutsTransfer)}</span>
          <span class="pill">Esperado: ${fmtMoney(cutsCashExpected)}</span>
          <span class="pill">Diferencia: ${fmtMoney(cutsDiff)}</span>
        </div></div>
        <div class="sbox"><div class="t">Rango</div><div class="m">
          <span class="pill">Desde: ${rFrom.value || "—"}</span>
          <span class="pill">Hasta: ${rTo.value || "—"}</span>
        </div></div>`;
      return;
    }

    setStats(currentRows);

    if(type === "general"){
      rTitle.textContent = "Resumen general";
      rSubtitle.textContent = "Totales por ticket (sin inconsistencias).";
      const byTicket = {};
      for(const r of currentRows){
        const key = r.ticket;
        if(!byTicket[key]){
          byTicket[key] = { ticket:r.ticket, date:r.date, kind:r.kind, client:getClientName(r.clientId), pay:(r.paymentMethod||""), total:0 };
        }
        byTicket[key].total += Number(r.total||0);
        if(r.kind!=="venta" && byTicket[key].kind==="venta") byTicket[key].kind = r.kind;
      }
      const list = Object.values(byTicket).sort((a,b)=> (b.date||"").localeCompare(a.date||"") || (b.ticket||"").localeCompare(a.ticket||""));
      setTable(
        ["Fecha","Ticket","Tipo","Cliente","Pago","Total"],
        list,
        x => `
          <tr>
            <td>${x.date||""}</td>
            <td><strong>${x.ticket}</strong></td>
            <td>${x.kind==="venta"?"Venta":(x.kind==="membresia"?"Membresía":"Servicio")}</td>
            <td>${x.client}</td>
            <td>${x.pay || ""}</td>
            <td class="right"><strong>${fmtMoney(x.total)}</strong></td>
          </tr>
        `
      );
      return;
    }

    if(type === "productos"){
      rTitle.textContent = "Desglose por producto";
      rSubtitle.textContent = "Fecha, ticket, producto, precio unitario, piezas, total.";
      const rows = currentRows.filter(r=>r.kind==="venta");
      setTable(
        ["Fecha","Ticket","Cliente","Pago","Producto","Categoría","Precio U.","Pzs","Total"],
        rows,
        r => `
          <tr>
            <td>${r.date}</td>
            <td>${r.ticket}</td>
            <td>${getClientName(r.clientId)}</td>
            <td>${r.paymentMethod||""}</td>
            <td>${r.product}</td>
            <td>${r.category||""}</td>
            <td class="right">${fmtMoney(r.unitPrice)}</td>
            <td class="right">${Number(r.qty||0)}</td>
            <td class="right"><strong>${fmtMoney(r.total)}</strong></td>
          </tr>
        `
      );
      return;
    }

    if(type === "categoria"){
      rTitle.textContent = "Por categoría";
      rSubtitle.textContent = "Totales agrupados por categoría.";
      const map = {};
      for(const r of currentRows.filter(r=>r.kind==="venta")){
        const c = r.category || "Sin categoría";
        if(!map[c]) map[c] = { category:c, qty:0, total:0 };
        map[c].qty += Number(r.qty||0);
        map[c].total += Number(r.total||0);
      }
      const list = Object.values(map).sort((a,b)=>b.total-a.total);
      setTable(
        ["Categoría","Pzs","Total"],
        list,
        x => `
          <tr>
            <td><strong>${x.category}</strong></td>
            <td class="right">${x.qty}</td>
            <td class="right"><strong>${fmtMoney(x.total)}</strong></td>
          </tr>
        `
      );
      return;
    }

    if(type === "membresias"){
      rTitle.textContent = "Membresías";
      rSubtitle.textContent = "Desglose de cobros de membresía (con inicio/fin si aplica).";
      const rows = currentRows.filter(r=>r.kind==="membresia");
      setTable(
        ["Fecha","Ticket","Cliente","Pago","Membresía","Inicio","Fin","Total"],
        rows,
        r => `
          <tr>
            <td>${r.date}</td>
            <td>${r.ticket}</td>
            <td>${getClientName(r.clientId)}</td>
            <td>${r.paymentMethod||""}</td>
            <td>${r.product}</td>
            <td>${r.meta?.startDate || ""}</td>
            <td>${r.meta?.endDate || ""}</td>
            <td class="right"><strong>${fmtMoney(r.total)}</strong></td>
          </tr>
        `
      );
      return;
    }
  }

  function exportCsv(){
    const type = rType.value;
    const rows = currentRows.slice();

    let headers = [];
    let data = [];

    if(type==="operativo"){
      headers = ["concepto","piezas_registros","efectivo","tarjeta","transferencia","otro","total"];
      data = operationalCsvData(buildOperationalData(rows, rFrom.value || "", rTo.value || ""));
    }else if(type==="operativo_old"){
      headers = ["concepto","piezas","total"];
      const op = buildOperationalData(rows);
      data = [];
      if(op.membershipList.length){
        data.push(["Membresías","",""]);
        op.membershipList.forEach(it=>data.push([it.name,it.qty,it.total]));
        data.push(["Total membresías","",op.membershipTotal]);
      }
      op.familyList.forEach(f=>{
        data.push([f.family,"",""]);
        f.items.forEach(it=>data.push([it.name,it.qty,it.total]));
        data.push([`Total ${f.family}`,"",f.subtotal]);
      });
      data.push(["Total general","",op.grandTotal]);
    }else if(type==="cortes"){
      headers = ["usuario","apertura","cierre","fondo","efectivo","tarjeta","transferencia","ventas","esperado","contado","diferencia","estado"];
      const cuts = ((typeof dpGetCashSessions === "function") ? dpGetCashSessions() : []).filter(c=>{
        const date = String(c.openedAt||"").slice(0,10);
        if((rFrom.value||"") && date < rFrom.value) return false;
        if((rTo.value||"") && date > rTo.value) return false;
        return true;
      });
      data = cuts.map(c=>[c.userName||"",c.openedAt||"",c.closedAt||"",c.openingAmount||0,c?.totals?.byPayment?.efectivo||0,c?.totals?.byPayment?.tarjeta||0,c?.totals?.byPayment?.transferencia||0,c?.totals?.total||0,c.expectedCash||0,c.closingAmount==null?"":c.closingAmount,c.difference||0,c.status||""]);
    }else if(type==="general"){
      headers = ["fecha","ticket","tipo","cliente","pago","total"];
      const byTicket = {};
      for(const r of rows){
        const key = r.ticket;
        if(!byTicket[key]) byTicket[key] = {date:r.date,ticket:r.ticket,kind:r.kind,client:getClientName(r.clientId),total:0};
        byTicket[key].total += Number(r.total||0);
      }
      data = Object.values(byTicket).map(x=>[x.date,x.ticket,x.kind,getClientName(x.client),x.total]);
    }else if(type==="productos"){
      headers = ["fecha","ticket","cliente","pago","producto","categoria","precio_unitario","piezas","total"];
      data = rows.filter(r=>r.kind==="venta").map(r=>[r.date,r.ticket,getClientName(r.clientId),(r.paymentMethod||""),r.product,r.category,r.unitPrice,r.qty,r.total]);
    }else if(type==="categoria"){
      headers = ["categoria","piezas","total"];
      const map = {};
      for(const r of rows.filter(r=>r.kind==="venta")){
        const c = r.category || "Sin categoría";
        if(!map[c]) map[c] = {qty:0,total:0};
        map[c].qty += Number(r.qty||0);
        map[c].total += Number(r.total||0);
      }
      data = Object.entries(map).map(([c,v])=>[c,v.qty,v.total]);
    }else if(type==="membresias"){
      headers = ["fecha","ticket","cliente","pago","membresia","inicio","fin","total"];
      data = rows.filter(r=>r.kind==="membresia").map(r=>[r.date,r.ticket,getClientName(r.clientId),(r.paymentMethod||""),r.product,r.meta?.startDate||"",r.meta?.endDate||"",r.total]);
    }

    const csv = [headers.join(",")]
      .concat(data.map(row => row.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(",")))
      .join("\n");

    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reporte_${type}_${(window.dpYMDLocal ? window.dpYMDLocal(new Date()) : new Date().toISOString().slice(0,10))}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportPdf(){
    // Print the current table
    const title = rTitle.textContent || "Reporte";
    const sub = rSubtitle.textContent || "";
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<style>
  body{ font-family: Arial, sans-serif; padding:16px; }
  h1{ margin:0; }
  .muted{ color:#666; font-size:12px; margin-top:6px; }
  table{ width:100%; border-collapse:collapse; margin-top:12px; }
  th,td{ border:1px solid #ddd; padding:8px; font-size:12px; text-align:left; }
  th{ background:#f7f7f7; }
  .right{ text-align:right; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="muted">${sub}</div>
  <div class="muted">Rango: ${rFrom.value||"—"} a ${rTo.value||"—"} ${rCategory.value?(" | Categoría: "+rCategory.value):""}</div>
  ${$("r-table").outerHTML}
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

  function syncUI(){
    const type = rType.value;
    const showCat = (type==="categoria" || type==="productos");
    rCategory.style.display = showCat ? "block" : "none";
  }

  // Events
  rType.addEventListener("change", ()=>{ syncUI(); render(); });
  rApply.addEventListener("click", render);
  rReset.addEventListener("click", ()=>{
    rType.value="general";
    rFrom.value="";
    rTo.value="";
    rCategory.value="";
    syncUI();
    render();
  });
  rExportCsv.addEventListener("click", exportCsv);
  rExportPdf.addEventListener("click", exportPdf);

  // Init
  if(typeof dpEnsureSeedData === "function"){ try{ dpEnsureSeedData(); }catch(e){} }
  loadCategories();
  syncUI();
  render();
})();
