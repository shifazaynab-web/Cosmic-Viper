// app.js
const PAGES = ['dashboard','generator','customizer','scanner','templates','library','bulk','tools','settings'];
let currentPage = 'dashboard';
let currentType = 'url';
let currentData = {};
let qrInstance = null;
let customState = { width:300,height:300,margin:10,dotsOptions:{type:'square',color:'#1e6fd9'},backgroundOptions:{color:'#ffffff'},cornersSquareOptions:{type:'square',color:'#1e6fd9'},cornersDotOptions:{type:'square',color:'#1e6fd9'},errorCorrectionLevel:'Q' };

function toast(msg, type='info'){ const c=document.getElementById('toast-container'); const t=document.createElement('div'); t.className='toast '+type; t.textContent=msg; c.appendChild(t); setTimeout(()=>t.remove(),3000); }

function navigate(page){ currentPage=page; render(); }

function sidebarHtml(){
  const items = [
    {id:'dashboard',label:'Dashboard',icon:'🏠'},
    {id:'generator',label:'Generator',icon:'🔲'},
    {id:'customizer',label:'Customizer',icon:'🎨'},
    {id:'scanner',label:'Scanner',icon:'📷'},
    {id:'templates',label:'Templates',icon:'🧩'},
    {id:'library',label:'My Library',icon:'📁'},
    {id:'bulk',label:'Bulk Generate',icon:'📊'},
    {id:'tools',label:'Tools',icon:'🛠️'},
    {id:'settings',label:'Settings',icon:'⚙️'},
  ];
  return `<div class="sidebar-brand">QR Studio</div>
  <nav class="sidebar-nav">${items.map(i=>`<a class="nav-item ${i.id===currentPage?'active':''}" data-page="${i.id}" href="#${i.id}">${i.icon} ${i.label}</a>`).join('')}</nav>`;
}

function topbarHtml(){ return `<span class="topbar-title">${currentPage.charAt(0).toUpperCase()+currentPage.slice(1)}</span>
  <div class="topbar-actions">
    <button class="btn btn-ghost btn-sm" id="theme-toggle">Theme</button>
  </div>`; }

function render(){
  document.getElementById('sidebar').innerHTML = sidebarHtml();
  document.getElementById('topbar').innerHTML = topbarHtml();
  const content = document.getElementById('content');
  const fn = window['render_'+currentPage];
  if (typeof fn === 'function') fn(content); else content.innerHTML = '<p>Page not found.</p>';
  document.querySelectorAll('.nav-item').forEach(el=>el.addEventListener('click',e=>{e.preventDefault(); navigate(el.dataset.page);}));
  const tt = document.getElementById('theme-toggle');
  if (tt) tt.addEventListener('click', toggleTheme);
}

function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// Init theme
(function(){ const t = localStorage.getItem('theme') || 'light'; if (t==='dark') document.documentElement.setAttribute('data-theme','dark'); })();

// Dashboard
window.render_dashboard = function(c){
  QRStorage.dbGetAll('qrs').then(list=>{
    c.innerHTML = `<h2>Welcome to QR Studio</h2>
    <p style="color:var(--text-muted);margin-bottom:16px">Generate, customize, scan and manage QR codes.</p>
    <div class="grid grid-4" style="margin-bottom:20px">
      <div class="card stat-card"><div class="num">${list.length}</div><div class="lbl">Saved QR codes</div></div>
      <div class="card stat-card"><div class="num">${list.filter(x=>x.favorite).length}</div><div class="lbl">Favorites</div></div>
      <div class="card"><button class="btn btn-primary" onclick="navigate('generator')">+ New QR Code</button></div>
      <div class="card"><button class="btn btn-secondary" onclick="navigate('scanner')">Scan QR Code</button></div>
    </div>
    <div class="card">
      <div class="card-title">Quick access</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm" onclick="navigate('templates')">Templates</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('bulk')">Bulk Generate</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('tools')">Tools</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('library')">Library</button>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-title">Recently generated</div>
      ${list.length? `<div class="card-grid">${list.slice(-6).reverse().map(q=>`<div class="card"><img src="${q.preview||''}" style="width:100%;aspect-ratio:1;object-fit:contain;background:var(--surface-2);border-radius:4px"><div style="margin-top:8px;font-size:13px;font-weight:500">${QRValidation.sanitize(q.name||q.type)}</div></div>`).join('')}</div>` : '<div class="empty-state"><h3>No QR codes yet</h3><p>Generate your first QR code to see it here.</p></div>'}
    </div>`;
  });
};

// Generator
window.render_generator = function(c){
  c.innerHTML = `<div class="grid grid-2">
    <div class="card">
      <div class="field"><label>Type</label><select class="select" id="g-type">${QRTypes.map(t=>`<option value="${t}">${TYPE_LABELS[t]}</option>`).join('')}</select></div>
      <div id="g-form"></div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-secondary btn-sm" id="g-clear">Clear</button>
        <button class="btn btn-primary btn-sm" id="g-save">Save to Library</button>
      </div>
    </div>
    <div class="card">
      <div class="qr-preview" id="g-preview"></div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" id="g-copy">Copy payload</button>
        <button class="btn btn-primary btn-sm" id="g-download">Download PNG</button>
      </div>
      <div class="field" style="margin-top:12px"><label>Payload</label><textarea class="textarea" id="g-payload" readonly></textarea></div>
    </div>
  </div>`;
  const typeSel = document.getElementById('g-type');
  typeSel.value = currentType;
  typeSel.addEventListener('change', ()=>{ currentType=typeSel.value; currentData={}; renderForm(); updatePreview(); });
  renderForm();
  updatePreview();
  document.getElementById('g-clear').addEventListener('click', ()=>{ currentData={}; renderForm(); updatePreview(); });
  document.getElementById('g-copy').addEventListener('click', ()=>{ navigator.clipboard.writeText(document.getElementById('g-payload').value); toast('Copied','success'); });
  document.getElementById('g-download').addEventListener('click', downloadCurrentPng);
  document.getElementById('g-save').addEventListener('click', saveCurrent);
};

function renderForm(){
  const el = document.getElementById('g-form'); if(!el) return;
  const d = currentData;
  const f = (name,label,input)=>`<div class="field"><label>${label}</label>${input}<div class="error" id="err-${name}"></div></div>`;
  let html='';
  switch(currentType){
    case 'url': html=f('url','Website URL',`<input class="input" id="f-url" value="${d.url||''}" placeholder="https://example.com">`); break;
    case 'text': html=f('text','Text',`<textarea class="textarea" id="f-text">${d.text||''}</textarea><div class="hint" id="charcount"></div>`); break;
    case 'wifi': html=f('ssid','Network name',`<input class="input" id="f-ssid" value="${d.ssid||''}">`)+f('password','Password',`<input class="input" id="f-password" value="${d.password||''}">`)+`<div class="field"><label>Encryption</label><select class="select" id="f-enc"><option>WPA</option><option>WEP</option><option>nopass</option></select></div>`+`<div class="field"><label><input type="checkbox" id="f-hidden" ${d.hidden?'checked':''}> Hidden network</label></div>`; break;
    case 'email': html=f('email','Email',`<input class="input" id="f-email" value="${d.email||''}">`)+f('subject','Subject',`<input class="input" id="f-subject" value="${d.subject||''}">`)+f('body','Message',`<textarea class="textarea" id="f-body">${d.body||''}</textarea>`); break;
    case 'phone': html=f('phone','Phone',`<input class="input" id="f-phone" value="${d.phone||''}">`); break;
    case 'sms': html=f('phone','Phone',`<input class="input" id="f-phone" value="${d.phone||''}">`)+f('message','Message',`<textarea class="textarea" id="f-message">${d.message||''}</textarea>`); break;
    case 'vcard': html=f('name','Full name',`<input class="input" id="f-name" value="${d.name||''}">`)+f('org','Organization',`<input class="input" id="f-org" value="${d.org||''}">`)+f('phone','Phone',`<input class="input" id="f-phone" value="${d.phone||''}">`)+f('email','Email',`<input class="input" id="f-email" value="${d.email||''}">`)+f('url','Website',`<input class="input" id="f-url" value="${d.url||''}">`)+f('address','Address',`<input class="input" id="f-address" value="${d.address||''}">`); break;
    case 'location': html=f('lat','Latitude',`<input class="input" id="f-lat" value="${d.lat||''}">`)+f('lng','Longitude',`<input class="input" id="f-lng" value="${d.lng||''}">`); break;
    case 'event': html=f('title','Title',`<input class="input" id="f-title" value="${d.title||''}">`)+f('location','Location',`<input class="input" id="f-location" value="${d.location||''}">`)+f('description','Description',`<textarea class="textarea" id="f-description">${d.description||''}</textarea>`)+f('start','Start',`<input type="datetime-local" class="input" id="f-start" value="${d.start||''}">`)+f('end','End',`<input type="datetime-local" class="input" id="f-end" value="${d.end||''}">`); break;
    case 'social': html=f('platform','Platform',`<select class="select" id="f-platform"><option>Instagram</option><option>Twitter/X</option><option>Facebook</option><option>LinkedIn</option><option>TikTok</option><option>YouTube</option></select>`)+f('url','Profile URL',`<input class="input" id="f-url" value="${d.url||''}">`); break;
    case 'payment': html=f('uri','Payment URI',`<input class="input" id="f-uri" value="${d.uri||''}" placeholder="bitcoin:... or upi://...">`)+`<div class="hint">Enter a valid payment URI. Unsupported protocols are not validated.</div>`; break;
  }
  el.innerHTML = html;
  // bind inputs
  el.querySelectorAll('input,textarea,select').forEach(inp=>{
    const handler=()=>{ collectData(); updatePreview(); };
    inp.addEventListener('input', handler);
    inp.addEventListener('change', handler);
  });
  if (currentType==='text'){ const ta=document.getElementById('f-text'); const cc=document.getElementById('charcount'); const upd=()=>cc.textContent=(ta.value.length)+' chars'; ta.addEventListener('input',upd); upd(); }
}

function collectData(){
  const el=document.getElementById('g-form'); if(!el) return;
  const get=id=>{const e=document.getElementById(id); return e? (e.type==='checkbox'?e.checked:e.value):'';};
  switch(currentType){
    case 'url': currentData={url:get('f-url')}; break;
    case 'text': currentData={text:get('f-text')}; break;
    case 'wifi': currentData={ssid:get('f-ssid'),password:get('f-password'),encryption:get('f-enc'),hidden:get('f-hidden')}; break;
    case 'email': currentData={email:get('f-email'),subject:get('f-subject'),body:get('f-body')}; break;
    case 'phone': currentData={phone:get('f-phone')}; break;
    case 'sms': currentData={phone:get('f-phone'),message:get('f-message')}; break;
    case 'vcard': currentData={name:get('f-name'),org:get('f-org'),phone:get('f-phone'),email:get('f-email'),url:get('f-url'),address:get('f-address')}; break;
    case 'location': currentData={lat:get('f-lat'),lng:get('f-lng')}; break;
    case 'event': currentData={title:get('f-title'),location:get('f-location'),description:get('f-description'),start:get('f-start'),end:get('f-end')}; break;
    case 'social': currentData={platform:get('f-platform'),url:get('f-url')}; break;
    case 'payment': currentData={uri:get('f-uri')}; break;
  }
}

function updatePreview(){
  collectData();
  const payload = buildPayload(currentType, currentData);
  const ta = document.getElementById('g-payload'); if(ta) ta.value = payload;
  const container = document.getElementById('g-preview'); if(!container) return;
  const opts = QRCustomizer.buildOptions(customState, payload);
  QRCustomizer.init(customState);
  const qr = QRCustomizer.render(container, opts);
  qrInstance = qr;
}

function downloadCurrentPng(){
  if(!qrInstance){ toast('Nothing to download','error'); return; }
  qrInstance.download({name:'qr-studio',extension:'png'});
  toast('Downloaded','success');
}

async function saveCurrent(){
  collectData();
  const payload = buildPayload(currentType, currentData);
  const container = document.createElement('div'); container.style.display='none'; document.body.appendChild(container);
  const qr = new QRCodeStyling(QRCustomizer.buildOptions(customState, payload));
  qr.append(container);
  await new Promise(r=>setTimeout(r,300));
  const blob = await qr.getRawData('png');
  const url = URL.createObjectURL(blob);
  const rec = { id:genId(), type:currentType, name: (currentData.url||currentData.text||currentData.ssid||currentType), payload, settings: JSON.parse(JSON.stringify(customState)), preview:url, createdAt: Date.now(), favorite:false, category:'General' };
  await QRStorage.dbPut('qrs', rec);
  toast('Saved to library','success');
  URL.revokeObjectURL(url);
}

// Customizer page
window.render_customizer = function(c){
  c.innerHTML = `<div class="grid grid-2">
    <div class="card">
      <h3>Customization</h3>
      <div class="field"><label>Width</label><input type="number" class="input" id="c-w" value="${customState.width}"></div>
      <div class="field"><label>Height</label><input type="number" class="input" id="c-h" value="${customState.height}"></div>
      <div class="field"><label>Margin</label><input type="number" class="input" id="c-m" value="${customState.margin}"></div>
      <div class="field"><label>Foreground</label><input type="color" class="input" id="c-fg" value="${customState.dotsOptions.color}"></div>
      <div class="field"><label>Background</label><input type="color" class="input" id="c-bg" value="${customState.backgroundOptions.color}"></div>
      <div class="field"><label>Dots style</label><select class="select" id="c-dots"><option>square</option><option>dots</option><option>rounded</option><option>extra-rounded</option><option>classy</option><option>classy-rounded</option></select></div>
      <div class="field"><label>Error correction</label><select class="select" id="c-ec"><option>L</option><option>M</option><option>Q</option><option>H</option></select></div>
      <button class="btn btn-secondary btn-sm" id="c-reset">Reset</button>
    </div>
    <div class="card"><div class="qr-preview" id="c-preview"></div></div>
  </div>`;
  const bind=(id,fn)=>{const e=document.getElementById(id); if(e){e.value= (customState.dotsOptions&&customState.dotsOptions.type)||'square'; e.addEventListener('input',fn); e.addEventListener('change',fn);}};
  document.getElementById('c-w').addEventListener('input',e=>{customState.width=+e.target.value; refreshCustom();});
  document.getElementById('c-h').addEventListener('input',e=>{customState.height=+e.target.value; refreshCustom();});
  document.getElementById('c-m').addEventListener('input',e=>{customState.margin=+e.target.value; refreshCustom();});
  document.getElementById('c-fg').addEventListener('input',e=>{customState.dotsOptions.color=e.target.value; customState.cornersSquareOptions.color=e.target.value; customState.cornersDotOptions.color=e.target.value; refreshCustom();});
  document.getElementById('c-bg').addEventListener('input',e=>{customState.backgroundOptions.color=e.target.value; refreshCustom();});
  document.getElementById('c-dots').value = customState.dotsOptions.type;
  document.getElementById('c-dots').addEventListener('change',e=>{customState.dotsOptions.type=e.target.value; refreshCustom();});
  document.getElementById('c-ec').value = customState.errorCorrectionLevel;
  document.getElementById('c-ec').addEventListener('change',e=>{customState.errorCorrectionLevel=e.target.value; refreshCustom();});
  document.getElementById('c-reset').addEventListener('click',()=>{ customState={width:300,height:300,margin:10,dotsOptions:{type:'square',color:'#1e6fd9'},backgroundOptions:{color:'#ffffff'},cornersSquareOptions:{type:'square',color:'#1e6fd9'},cornersDotOptions:{type:'square',color:'#1e6fd9'},errorCorrectionLevel:'Q'}; window.render_customizer(c); });
  refreshCustom();
};
function refreshCustom(){
  const container=document.getElementById('c-preview'); if(!container) return;
  const payload = buildPayload(currentType, currentData);
  const opts = QRCustomizer.buildOptions(customState, payload||'https://example.com');
  QRCustomizer.init(customState);
  QRCustomizer.render(container, opts);
}

// Scanner
window.render_scanner = function(c){
  c.innerHTML = `<div class="card">
    <h3>QR Scanner</h3>
    <div id="reader" style="width:100%;max-width:500px;margin:auto"></div>
    <div style="display:flex;gap:8px;margin-top:12px;justify-content:center">
      <button class="btn btn-primary btn-sm" id="start-scan">Start Camera</button>
      <button class="btn btn-secondary btn-sm" id="stop-scan">Stop</button>
    </div>
    <div class="field" style="margin-top:16px"><label>Or upload image</label><input type="file" id="scan-file" accept="image/*"></div>
    <div id="scan-result" style="margin-top:16px"></div>
  </div>`;
  let html5Qr = null;
  document.getElementById('start-scan').addEventListener('click', async ()=>{
    const reader = document.getElementById('reader');
    html5Qr = new Html5Qrcode('reader');
    try { await html5Qr.start({facingMode:'environment'}, {fps:10, qrbox:250}, (txt)=>{ showScanResult(txt); }, (err)=>{}); }
    catch(e){ toast('Camera error: '+e.message,'error'); }
  });
  document.getElementById('stop-scan').addEventListener('click', async ()=>{ if(html5Qr){ try{await html5Qr.stop();}catch{} html5Qr=null; }});
  document.getElementById('scan-file').addEventListener('change', async (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new Html5Qrcode('reader');
    try { const txt = await reader.scanFile(file,true); showScanResult(txt); }
    catch(err){ toast('No QR found in image','error'); }
  });
  function showScanResult(txt){
    document.getElementById('scan-result').innerHTML = `<div class="card"><div class="kv"><span class="k">Decoded</span><span>${QRValidation.sanitize(txt)}</span></div><button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(${JSON.stringify(txt)})">Copy</button></div>`;
  }
};

// Templates
window.render_templates = function(c){
  const templates = [
    {name:'Restaurant Menu', desc:'Menu link QR', type:'url', data:{url:'https://example.com/menu'}},
    {name:'Business Card', desc:'vCard contact', type:'vcard', data:{name:'John Doe',org:'Acme',phone:'+123',email:'john@acme.com'}},
    {name:'Wi-Fi Sharing', desc:'Wi-Fi credentials', type:'wifi', data:{ssid:'GuestWiFi',password:'password',encryption:'WPA'}},
    {name:'Social Media', desc:'Profile link', type:'social', data:{url:'https://instagram.com/example'}},
    {name:'Event Invitation', desc:'Calendar event', type:'event', data:{title:'Party',location:'HQ',description:'Join us'}},
    {name:'Product Packaging', desc:'Product page', type:'url', data:{url:'https://example.com/product'}},
    {name:'Payment', desc:'Payment URI', type:'payment', data:{uri:'bitcoin:bc1...'}},
    {name:'Contact', desc:'Contact info', type:'vcard', data:{name:'Contact'}},
    {name:'Website Promo', desc:'Website link', type:'url', data:{url:'https://example.com'}},
    {name:'Marketing Poster', desc:'Campaign link', type:'url', data:{url:'https://example.com/campaign'}},
  ];
  c.innerHTML = `<h2>Templates</h2><div class="card-grid">${templates.map((t,i)=>`<div class="card template-card" data-i="${i}"><h4>${t.name}</h4><p style="color:var(--text-muted);font-size:13px">${t.desc}</p><button class="btn btn-primary btn-sm" style="margin-top:8px">Use template</button></div>`).join('')}</div>`;
  c.querySelectorAll('.template-card').forEach(el=>{
    el.querySelector('button').addEventListener('click',()=>{
      const t=templates[+el.dataset.i];
      currentType=t.type; currentData=t.data;
      navigate('generator');
      toast('Template applied','success');
    });
  });
};

// Library
window.render_library = function(c){
  QRStorage.dbGetAll('qrs').then(list=>{
    c.innerHTML = `<h2>My Library</h2>
    <div style="display:flex;gap:8px;margin-bottom:12px"><input class="input" id="lib-search" placeholder="Search..." style="max-width:260px"><select class="select" id="lib-filter" style="max-width:160px"><option value="">All types</option>${QRTypes.map(t=>`<option value="${t}">${TYPE_LABELS[t]}</option>`).join('')}</select></div>
    <div id="lib-list"></div>`;
    function draw(filter=''){
      const q=document.getElementById('lib-search').value.toLowerCase();
      const type=document.getElementById('lib-filter').value;
      const filtered=list.filter(x=>(!type||x.type===type)&&(!q|| (x.name||'').toLowerCase().includes(q)));
      const el=document.getElementById('lib-list');
      if(!filtered.length){ el.innerHTML='<div class="empty-state"><h3>No saved QR codes</h3></div>'; return; }
      el.innerHTML = filtered.map(x=>`<div class="lib-item">
        <img src="${x.preview||''}">
        <div style="flex:1">
          <div style="font-weight:500">${QRValidation.sanitize(x.name||x.type)}</div>
          <div style="font-size:12px;color:var(--text-muted)">${TYPE_LABELS[x.type]} · ${new Date(x.createdAt).toLocaleString()}</div>
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn btn-ghost btn-sm" data-act="fav" data-id="${x.id}">${x.favorite?'★':'☆'}</button>
          <button class="btn btn-ghost btn-sm" data-act="dup" data-id="${x.id}">Duplicate</button>
          <button class="btn btn-ghost btn-sm" data-act="del" data-id="${x.id}">Delete</button>
        </div>
      </div>`).join('');
      el.querySelectorAll('button').forEach(b=>{
        b.addEventListener('click', async ()=>{
          const id=b.dataset.id; const rec=list.find(x=>x.id===id);
          if(b.dataset.act==='fav'){ rec.favorite=!rec.favorite; await QRStorage.dbPut('qrs',rec); window.render_library(c); }
          if(b.dataset.act==='dup'){ const copy=Object.assign({},rec,{id:genId(),name:rec.name+' (copy)',createdAt:Date.now()}); await QRStorage.dbPut('qrs',copy); window.render_library(c); }
          if(b.dataset.act==='del'){ if(confirm('Delete?')){ await QRStorage.dbDelete('qrs',id); window.render_library(c); } }
        });
      });
    }
    draw();
    document.getElementById('lib-search').addEventListener('input',draw);
    document.getElementById('lib-filter').addEventListener('change',draw);
  });
};

// Bulk
window.render_bulk = function(c){
  c.innerHTML = `<div class="card">
    <h3>Bulk QR Generator</h3>
    <div class="dropzone" id="bulk-drop">Drop CSV here or click to upload</div>
    <input type="file" id="bulk-file" accept=".csv" style="display:none">
    <div id="bulk-preview" style="margin-top:12px"></div>
    <div id="bulk-progress" style="margin-top:12px"></div>
    <button class="btn btn-primary btn-sm" id="bulk-gen" style="margin-top:12px" disabled>Generate ZIP</button>
  </div>`;
  const drop=document.getElementById('bulk-drop'); const fileInput=document.getElementById('bulk-file');
  drop.addEventListener('click',()=>fileInput.click());
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag');});
  drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag'); handleFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',e=>handleFile(e.target.files[0]));
  let rows=[];
  function handleFile(f){ if(!f) return; Papa.parse(f,{header:true,skipEmptyLines:true,complete:(res)=>{ rows=res.data; document.getElementById('bulk-preview').innerHTML = `<p>Parsed ${rows.length} rows. Columns: ${Object.keys(rows[0]||{}).join(', ')}</p><pre style="max-height:200px;overflow:auto">${JSON.stringify(rows.slice(0,5),null,2)}</pre>`; document.getElementById('bulk-gen').disabled=false; }}); }
  document.getElementById('bulk-gen').addEventListener('click', async ()=>{
    const zip = new JSZip();
    const progress=document.getElementById('bulk-progress');
    for(let i=0;i<rows.length;i++){
      const r=rows[i];
      const text = r.url || r.text || r.data || JSON.stringify(r);
      const qr = new QRCodeStyling(QRCustomizer.buildOptions(customState, text));
      const container=document.createElement('div'); container.style.display='none'; document.body.appendChild(container);
      qr.append(container);
      await new Promise(res=>setTimeout(res,50));
      const blob = await qr.getRawData('png');
      zip.file(`qr-${i+1}.png`, blob);
      progress.innerHTML = `<div class="progress"><div class="progress-bar" style="width:${((i+1)/rows.length*100)}%"></div></div><p>${i+1}/${rows.length}</p>`;
    }
    const content = await zip.generateAsync({type:'blob'});
    const url = URL.createObjectURL(content);
    const a=document.createElement('a'); a.href=url; a.download='qr-bulk.zip'; a.click();
    URL.revokeObjectURL(url);
    toast('ZIP downloaded','success');
  });
};

// Tools
window.render_tools = function(c){
  c.innerHTML = `<h2>Tools</h2>
  <div class="grid grid-2">
    <div class="card"><h4>Contrast Checker</h4><div class="field"><label>Foreground</label><input type="color" id="cc-fg" value="#000000" class="input"></div><div class="field"><label>Background</label><input type="color" id="cc-bg" value="#ffffff" class="input"></div><button class="btn btn-primary btn-sm" id="cc-check">Check</button><div id="cc-res" style="margin-top:8px"></div></div>
    <div class="card"><h4>Data Inspector</h4><textarea class="textarea" id="di-text" placeholder="Paste encoded payload"></textarea><button class="btn btn-primary btn-sm" id="di-inspect" style="margin-top:8px">Inspect</button><div id="di-res" style="margin-top:8px"></div></div>
    <div class="card"><h4>Wi-Fi Quick Generator</h4><div class="field"><label>SSID</label><input class="input" id="wq-ssid"></div><div class="field"><label>Password</label><input class="input" id="wq-pw"></div><button class="btn btn-primary btn-sm" id="wq-gen">Generate</button><div class="qr-preview" id="wq-preview" style="min-height:180px;margin-top:8px"></div></div>
    <div class="card"><h4>QR Decoder</h4><input type="file" id="dec-file" accept="image/*"><div id="dec-res" style="margin-top:8px"></div></div>
  </div>`;
  document.getElementById('cc-check').addEventListener('click',()=>{
    const fg=document.getElementById('cc-fg').value, bg=document.getElementById('cc-bg').value;
    function lum(hex){ const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255; const f=x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4); return .2126*f(r)+.7152*f(g)+.0722*f(b); }
    const l1=lum(fg), l2=lum(bg); const ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
    document.getElementById('cc-res').innerHTML = `<p>Contrast ratio: ${ratio.toFixed(2)}:1 ${ratio>=4.5?'✅ OK':'⚠️ Low'}</p>`;
  });
  document.getElementById('di-inspect').addEventListener('click',()=>{
    const t=document.getElementById('di-text').value;
    document.getElementById('di-res').innerHTML = `<div class="kv"><span class="k">Length</span><span>${t.length}</span></div><div class="kv"><span class="k">Bytes</span><span>${new TextEncoder().encode(t).length}</span></div>`;
  });
  document.getElementById('wq-gen').addEventListener('click',()=>{
    const ssid=document.getElementById('wq-ssid').value, pw=document.getElementById('wq-pw').value;
    const payload=buildPayload('wifi',{ssid,password:pw,encryption:'WPA',hidden:false});
    const container=document.getElementById('wq-preview');
    new QRCodeStyling(QRCustomizer.buildOptions(customState,payload)).append(container);
  });
  document.getElementById('dec-file').addEventListener('change', async (e)=>{
    const f=e.target.files[0]; if(!f) return;
    const reader=new Html5Qrcode('dec-x'); 
    try { const txt=await new Html5Qrcode('dec-temp').scanFile(f,true); document.getElementById('dec-res').textContent=txt; }
    catch(err){ document.getElementById('dec-res').textContent='No QR found'; }
  });
};

// Settings
window.render_settings = function(c){
  c.innerHTML = `<div class="card">
    <h3>Settings</h3>
    <div class="field"><label>Theme</label><select class="select" id="s-theme"><option value="light">Light</option><option value="dark">Dark</option></select></div>
    <div class="field"><label>Default width</label><input type="number" class="input" id="s-w" value="${localStorage.getItem('setw')||300}"></div>
    <button class="btn btn-danger btn-sm" id="s-clear">Clear all local data</button>
  </div>
  <div class="card" style="margin-top:16px"><h3>About</h3><p>QR Studio — browser-based QR platform. Data stored locally in this browser.</p></div>`;
  document.getElementById('s-theme').value = localStorage.getItem('theme')||'light';
  document.getElementById('s-theme').addEventListener('change',e=>{ localStorage.setItem('theme',e.target.value); document.documentElement.setAttribute('data-theme',e.target.value); });
  document.getElementById('s-clear').addEventListener('click', async ()=>{ if(confirm('Delete all saved QR codes?')){ await QRStorage.dbClear('qrs'); toast('Cleared','success'); }});
};

// Router init
document.addEventListener('DOMContentLoaded', ()=>{ render(); });
window.addEventListener('hashchange', ()=>{ const p=location.hash.replace('#',''); if(PAGES.includes(p)) navigate(p); });
// initial
if(location.hash){ const p=location.hash.replace('#',''); if(PAGES.includes(p)) currentPage=p; }
