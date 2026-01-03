// /assets/admin.js
const LS_KEY = "kuankuan_site_content_draft_v1";
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

async function loadSiteContent(){
  const res = await fetch("/data/content.json", { cache:"no-store" });
  if (!res.ok) throw new Error("无法加载 /data/content.json");
  return await res.json();
}
function loadLocal(){
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try{ return JSON.parse(raw); }catch{ return null; }
}
function saveLocal(data){ localStorage.setItem(LS_KEY, JSON.stringify(data)); }

function downloadJSON(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type:"application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toPreviewHTML(cfg, data){
  const cards = (data.home?.sections || []).map(sec => `
    <div class="card">
      <h3>${esc(sec.title||"")}</h3>
      <p class="muted">${esc(sec.body||"")}</p>
    </div>
  `).join("");

  const projects = (data.projects||[]).map(p => `
    <article class="card">
      <h2 style="margin:0 0 6px">${esc(p.title||"")}</h2>
      <p class="muted">${esc(p.summary||"")}</p>
      ${p.image ? `<img src="${esc(p.image)}" alt="截图" style="width:100%;border-radius:12px;border:1px solid var(--line);margin-top:10px" />` : ""}
      ${p.link ? `<p style="margin:10px 0 0"><a href="${esc(p.link)}" target="_blank" rel="noopener">项目链接</a></p>` : ""}
      <small class="muted">${Array.isArray(p.tags)&&p.tags.length ? ("标签：" + p.tags.map(esc).join(" / ")) : ""}</small>
    </article>
  `).join("");

  return `<!doctype html>
  <html lang="zh-CN"><head>
    <meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>预览｜${esc(cfg.site?.name||"")}</title>
    <link rel="stylesheet" href="/assets/style.css"/>
  </head><body>
    <main class="container">
      <section class="card">
        <h1>${esc(data.home?.heroTitle || cfg.site?.name || "")}</h1>
        <p class="muted">${esc(data.home?.heroSubtitle || "")}</p>
      </section>
      <div style="height:14px"></div>
      <section class="grid grid3">${cards}</section>
      <div style="height:14px"></div>
      <h2>项目预览</h2>
      <div class="grid grid2">${projects || "<p class='muted'>暂无项目</p>"}</div>
    </main>
  </body></html>`;
}

function setActive(listEl, idx){
  [...listEl.querySelectorAll(".admin-item")].forEach((el,i)=> el.classList.toggle("active", i===idx));
}

(async function(){
  const cfg = await (window.loadSiteConfig ? window.loadSiteConfig() : ({site:{name:"宽宽的网站"}}));
  let data = await loadSiteContent().catch(()=>({home:{heroTitle:"宽宽的网站",heroSubtitle:"",sections:[]},projects:[]}));

  const homeList = document.getElementById("homeList");
  const projList = document.getElementById("projList");
  const editorEmpty = document.getElementById("editorEmpty");
  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");

  const editKind = document.getElementById("editKind");
  const editIndex = document.getElementById("editIndex");
  const editTitle = document.getElementById("editTitle");
  const editBody = document.getElementById("editBody");
  const projExtras = document.getElementById("projExtras");
  const editLink = document.getElementById("editLink");
  const editImage = document.getElementById("editImage");
  const editTags = document.getElementById("editTags");

  function renderLists(){
    homeList.innerHTML = (data.home?.sections||[]).map((sec,i)=>`
      <div class="admin-item" data-kind="home" data-idx="${i}">
        <div><strong>${esc(sec.title||"（无标题）")}</strong><br/><small>${esc((sec.body||"").slice(0,24))}${(sec.body||"").length>24?"…":""}</small></div>
        <span class="badge">卡片</span>
      </div>
    `).join("") || `<p class="muted">暂无首页卡片。</p>`;

    projList.innerHTML = (data.projects||[]).map((p,i)=>`
      <div class="admin-item" data-kind="proj" data-idx="${i}">
        <div><strong>${esc(p.title||"（无标题）")}</strong><br/><small>${esc((p.summary||"").slice(0,24))}${(p.summary||"").length>24?"…":""}</small></div>
        <span class="badge">项目</span>
      </div>
    `).join("") || `<p class="muted">暂无项目。</p>`;
  }

  function refreshPreview(){ preview.srcdoc = toPreviewHTML(cfg, data); }

  function openEditor(kind, idx){
    editKind.value = kind;
    editIndex.value = String(idx);
    editorEmpty.hidden = true;
    editor.hidden = false;

    if (kind === "home"){
      const sec = data.home.sections[idx];
      editTitle.value = sec.title || "";
      editBody.value = sec.body || "";
      projExtras.hidden = true;
      setActive(homeList, idx); setActive(projList, -1);
    }else{
      const p = data.projects[idx];
      editTitle.value = p.title || "";
      editBody.value = p.summary || "";
      editLink.value = p.link || "";
      editImage.value = p.image || "";
      editTags.value = Array.isArray(p.tags) ? p.tags.join(", ") : "";
      projExtras.hidden = false;
      setActive(projList, idx); setActive(homeList, -1);
    }
    refreshPreview();
  }

  function applyEditor(){
    const kind = editKind.value;
    const idx = Number(editIndex.value);
    if (!(idx>=0)) return;

    if (kind === "home"){
      data.home.sections[idx] = { type:"card", title: editTitle.value.trim(), body: editBody.value.trim() };
    }else{
      data.projects[idx] = {
        title: editTitle.value.trim(),
        summary: editBody.value.trim(),
        link: editLink.value.trim(),
        image: editImage.value.trim(),
        tags: editTags.value.split(",").map(s=>s.trim()).filter(Boolean)
      };
    }
    renderLists();
    openEditor(kind, idx);
  }

  function moveItem(dir){
    const kind = editKind.value;
    const idx = Number(editIndex.value);
    const arr = kind==="home" ? data.home.sections : data.projects;
    const j = idx + dir;
    if (!(idx>=0 && j>=0 && j < arr.length)) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    renderLists();
    openEditor(kind, j);
  }

  function deleteItem(){
    const kind = editKind.value;
    const idx = Number(editIndex.value);
    const arr = kind==="home" ? data.home.sections : data.projects;
    if (!(idx>=0 && idx < arr.length)) return;
    arr.splice(idx,1);
    renderLists();
    editor.hidden = true; editorEmpty.hidden = false;
    refreshPreview();
  }

  // list clicks
  homeList.addEventListener("click", (e)=>{
    const item = e.target.closest(".admin-item");
    if (!item) return;
    openEditor("home", Number(item.dataset.idx));
  });
  projList.addEventListener("click", (e)=>{
    const item = e.target.closest(".admin-item");
    if (!item) return;
    openEditor("proj", Number(item.dataset.idx));
  });

  // buttons
  document.getElementById("btnAddHome").onclick = ()=>{
    data.home.sections = data.home.sections || [];
    data.home.sections.push({type:"card", title:"新卡片", body:"写点内容…"});
    renderLists(); openEditor("home", data.home.sections.length-1);
  };
  document.getElementById("btnAddProj").onclick = ()=>{
    data.projects = data.projects || [];
    data.projects.push({title:"新项目", summary:"一句话简介…", link:"", image:"", tags:[]});
    renderLists(); openEditor("proj", data.projects.length-1);
  };
  document.getElementById("btnApply").onclick = applyEditor;
  document.getElementById("btnUp").onclick = ()=>moveItem(-1);
  document.getElementById("btnDown").onclick = ()=>moveItem(1);
  document.getElementById("btnDelete").onclick = deleteItem;

  document.getElementById("btnSaveLocal").onclick = ()=>{
    saveLocal(data); alert("已保存到本地草稿（当前浏览器）。");
  };
  document.getElementById("btnLoadLocal").onclick = ()=>{
    const d = loadLocal();
    if (!d){ alert("没有本地草稿。"); return; }
    data = d; renderLists(); refreshPreview(); alert("已从本地草稿载入。");
  };
  document.getElementById("btnLoadSite").onclick = async ()=>{
    data = await loadSiteContent(); renderLists(); refreshPreview(); alert("已从站点载入。");
  };
  document.getElementById("btnExport").onclick = ()=>{
    data.home = data.home || { heroTitle: cfg.site?.name || "宽宽的网站", heroSubtitle:"", sections:[] };
    downloadJSON("content.json", data);
  };

  // init
  data.home = data.home || { heroTitle: cfg.site?.name || "宽宽的网站", heroSubtitle:"", sections:[] };
  renderLists(); refreshPreview();
})();
