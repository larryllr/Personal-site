// /assets/admin.js
// 纯静态站“管理页”：在浏览器里编辑 -> 导出 JSON -> 覆盖上传到 GitHub
const LS_KEY = "kuankuan_site_content_draft_v2"; // 升级版本号避免与旧草稿冲突

function esc(s){ return String(s).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c] || c)); }

async function loadJSON(path){
  const res = await fetch(path, { cache:"no-store" });
  if (!res.ok) throw new Error(`无法加载 ${path}`);
  return await res.json();
}

function loadLocal(){
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try{ return JSON.parse(raw); }catch{ return null; }
}
function saveLocal(state){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }

function downloadFile(filename, text, mime="application/json;charset=utf-8"){
  const blob = new Blob([text], { type:mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function downloadJSON(filename, obj){
  downloadFile(filename, JSON.stringify(obj, null, 2), "application/json;charset=utf-8");
}

function toPreviewHTML(cfg, state){
  const data = state.content;
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

  const posts = (state.posts||[]).slice().sort((a,b)=> (a.date<b.date?1:-1)).map(p=>`
    <article class="card">
      <h3 style="margin:0 0 6px">${esc(p.title||"")}</h3>
      <small class="muted">${esc(p.date||"")} · ${(p.tags||[]).map(esc).join(" / ")}</small>
      <p class="muted" style="margin:10px 0 0">${esc(p.summary||"")}</p>
      <small class="muted">${esc(p.url||"")}</small>
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
      <div style="height:14px"></div>
      <h2>博客索引预览</h2>
      <div class="grid">${posts || "<p class='muted'>暂无文章索引</p>"}</div>
    </main>
  </body></html>`;
}

function setActive(listEl, idx){
  [...listEl.querySelectorAll(".admin-item")].forEach((el,i)=> el.classList.toggle("active", i===idx));
}


function xmlEsc(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}
function genSitemap(siteUrl, posts){
  const base = siteUrl.replace(/\/$/,"");
  const core = ["/","/projects.html","/blog.html","/admin.html"];
  const urls = core.concat((posts||[]).map(p=>p.url).filter(Boolean));
  const today = todayISO();
  const items = urls.map(u=>`  <url><loc>${xmlEsc(base + u)}</loc><lastmod>${today}</lastmod></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}
function rfc822Date(){
  // RFC822-ish for RSS
  return new Date().toUTCString();
}
function genFeed(siteUrl, siteName, posts){
  const base = siteUrl.replace(/\/$/,"");
  const items = (posts||[]).slice().sort((a,b)=> (a.date<b.date?1:-1)).slice(0,20).map(p=>{
    const link = base + (p.url||"");
    return `    <item>\n      <title>${xmlEsc(p.title||"")}</title>\n      <link>${xmlEsc(link)}</link>\n      <guid>${xmlEsc(link)}</guid>\n      <pubDate>${rfc822Date()}</pubDate>\n      <description><![CDATA[${(p.summary||"") }]]></description>\n    </item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${xmlEsc(siteName||"")}</title>\n    <link>${xmlEsc(base + "/")}</link>\n    <description>${xmlEsc(siteName||"")}</description>\n    <language>zh-CN</language>\n    <lastBuildDate>${rfc822Date()}</lastBuildDate>\n${items ? items+"\n" : ""}  </channel>\n</rss>\n`;
}

function todayISO(){
  const d = new Date();
  const pad = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

(function(){
  const homeList = document.getElementById("homeList");
  const projList = document.getElementById("projList");
  const postList = document.getElementById("postList");

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

  const postExtras = document.getElementById("postExtras");
  const editDate = document.getElementById("editDate");
  const editUrl = document.getElementById("editUrl");
  const editPostTags = document.getElementById("editPostTags");
  const editSummary = document.getElementById("editSummary");

  let cfg = { site:{ name:"宽宽的网站" } };
  let state = {
    content: { home:{ heroTitle:"宽宽的网站", heroSubtitle:"", sections:[] }, projects:[] },
    posts: []
  };

  function refreshPreview(){ preview.srcdoc = toPreviewHTML(cfg, state); }

  function renderLists(){
    const secs = state.content.home?.sections || [];
    homeList.innerHTML = secs.map((sec,i)=>`
      <div class="admin-item" data-kind="home" data-idx="${i}">
        <div><strong>${esc(sec.title||"（无标题）")}</strong><br/><small>${esc((sec.body||"").slice(0,24))}${(sec.body||"").length>24?"…":""}</small></div>
        <span class="badge">卡片</span>
      </div>
    `).join("") || `<p class="muted">暂无首页卡片。</p>`;

    const projs = state.content.projects || [];
    projList.innerHTML = projs.map((p,i)=>`
      <div class="admin-item" data-kind="proj" data-idx="${i}">
        <div><strong>${esc(p.title||"（无标题）")}</strong><br/><small>${esc((p.summary||"").slice(0,24))}${(p.summary||"").length>24?"…":""}</small></div>
        <span class="badge">项目</span>
      </div>
    `).join("") || `<p class="muted">暂无项目。</p>`;

    const posts = state.posts || [];
    postList.innerHTML = posts.map((p,i)=>`
      <div class="admin-item" data-kind="post" data-idx="${i}">
        <div>
          <strong>${esc(p.title||"（无标题）")}</strong><br/>
          <small>${esc(p.date||"")} · ${esc(p.url||"")}</small>
        </div>
        <span class="badge">文章</span>
      </div>
    `).join("") || `<p class="muted">暂无文章索引。</p>`;
  }

  function openEditor(kind, idx){
    editKind.value = kind;
    editIndex.value = String(idx);
    editorEmpty.hidden = true;
    editor.hidden = false;

    projExtras.hidden = true;
    postExtras.hidden = true;

    if (kind === "home"){
      const sec = state.content.home.sections[idx];
      editTitle.value = sec.title || "";
      editBody.value = sec.body || "";
      setActive(homeList, idx); setActive(projList, -1); setActive(postList, -1);
    }
    if (kind === "proj"){
      const p = state.content.projects[idx];
      editTitle.value = p.title || "";
      editBody.value = p.summary || "";
      editLink.value = p.link || "";
      editImage.value = p.image || "";
      editTags.value = Array.isArray(p.tags) ? p.tags.join(", ") : "";
      projExtras.hidden = false;
      setActive(projList, idx); setActive(homeList, -1); setActive(postList, -1);
    }
    if (kind === "post"){
      const p = state.posts[idx];
      editTitle.value = p.title || "";
      editDate.value = p.date || todayISO();
      editUrl.value = p.url || "/posts/my-post.html";
      editPostTags.value = Array.isArray(p.tags) ? p.tags.join(", ") : "";
      editSummary.value = p.summary || "";
      postExtras.hidden = false;
      editBody.value = "（文章正文在 /posts/*.html，这里只管列表索引）";
      setActive(postList, idx); setActive(homeList, -1); setActive(projList, -1);
    }
    refreshPreview();
  }

  function applyEditor(){
    const kind = editKind.value;
    const idx = Number(editIndex.value);
    if (!(idx>=0)) return;

    if (kind === "home"){
      state.content.home.sections[idx] = { type:"card", title: editTitle.value.trim(), body: editBody.value.trim() };
    }
    if (kind === "proj"){
      state.content.projects[idx] = {
        title: editTitle.value.trim(),
        summary: editBody.value.trim(),
        link: editLink.value.trim(),
        image: editImage.value.trim(),
        tags: editTags.value.split(",").map(s=>s.trim()).filter(Boolean)
      };
    }
    if (kind === "post"){
      const date = editDate.value.trim() || todayISO();
      const url = editUrl.value.trim();
      state.posts[idx] = {
        title: editTitle.value.trim(),
        date,
        summary: editSummary.value.trim(),
        tags: editPostTags.value.split(",").map(s=>s.trim()).filter(Boolean),
        url
      };
    }

    renderLists();
    openEditor(kind, idx);
  }

  function moveItem(dir){
    const kind = editKind.value;
    const idx = Number(editIndex.value);
    const arr = kind==="home" ? state.content.home.sections
              : kind==="proj" ? state.content.projects
              : kind==="post" ? state.posts
              : null;
    if (!arr) return;
    const j = idx + dir;
    if (!(idx>=0 && j>=0 && j < arr.length)) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    renderLists();
    openEditor(kind, j);
  }

  function deleteItem(){
    const kind = editKind.value;
    const idx = Number(editIndex.value);
    const arr = kind==="home" ? state.content.home.sections
              : kind==="proj" ? state.content.projects
              : kind==="post" ? state.posts
              : null;
    if (!arr) return;
    if (!(idx>=0 && idx < arr.length)) return;
    arr.splice(idx,1);
    renderLists();
    editor.hidden = true; editorEmpty.hidden = false;
    refreshPreview();
  }

  function attachListClick(listEl, kind){
    listEl.addEventListener("click", (e)=>{
      const item = e.target.closest(".admin-item");
      if (!item) return;
      openEditor(kind, Number(item.dataset.idx));
    });
  }

  document.getElementById("btnAddHome").onclick = ()=>{
    state.content.home.sections.push({type:"card", title:"新卡片", body:"写点内容…"});
    renderLists(); openEditor("home", state.content.home.sections.length-1);
  };
  document.getElementById("btnAddProj").onclick = ()=>{
    state.content.projects.push({title:"新项目", summary:"一句话简介…", link:"", image:"", tags:[]});
    renderLists(); openEditor("proj", state.content.projects.length-1);
  };
  document.getElementById("btnAddPost").onclick = ()=>{
    state.posts.push({title:"新文章", date: todayISO(), summary:"一句话摘要…", tags:[], url:"/posts/my-post.html"});
    renderLists(); openEditor("post", state.posts.length-1);
  };

  document.getElementById("btnApply").onclick = applyEditor;
  document.getElementById("btnUp").onclick = ()=>moveItem(-1);
  document.getElementById("btnDown").onclick = ()=>moveItem(1);
  document.getElementById("btnDelete").onclick = deleteItem;

  document.getElementById("btnSaveLocal").onclick = ()=>{
    saveLocal(state);
    alert("已保存到本地草稿（当前浏览器）。");
  };
  document.getElementById("btnLoadLocal").onclick = ()=>{
    const s = loadLocal();
    if (!s){ alert("没有本地草稿。"); return; }
    state = s;
    state.content = state.content || { home:{ heroTitle: cfg.site?.name || "宽宽的网站", heroSubtitle:"", sections:[] }, projects:[] };
    state.content.home = state.content.home || { heroTitle: cfg.site?.name || "宽宽的网站", heroSubtitle:"", sections:[] };
    state.content.home.sections = state.content.home.sections || [];
    state.content.projects = state.content.projects || [];
    state.posts = state.posts || [];
    renderLists(); refreshPreview();
    alert("已从本地草稿载入。");
  };
  document.getElementById("btnLoadSite").onclick = async ()=>{
    const content = await loadJSON("/data/content.json");
    const posts = await loadJSON("/data/posts.json");
    state = { content, posts };
    state.content.home = state.content.home || { heroTitle: cfg.site?.name || "宽宽的网站", heroSubtitle:"", sections:[] };
    state.content.home.sections = state.content.home.sections || [];
    state.content.projects = state.content.projects || [];
    state.posts = state.posts || [];
    renderLists(); refreshPreview();
    alert("已从站点载入（content.json + posts.json）。");
  };

  document.getElementById("btnExport").onclick = ()=>{
    state.content = state.content || { home:{ heroTitle: cfg.site?.name || "宽宽的网站", heroSubtitle:"", sections:[] }, projects:[] };
    state.content.home = state.content.home || { heroTitle: cfg.site?.name || "宽宽的网站", heroSubtitle:"", sections:[] };
    state.content.home.heroTitle = state.content.home.heroTitle || (cfg.site?.name || "宽宽的网站");
    state.content.home.sections = state.content.home.sections || [];
    state.content.projects = state.content.projects || [];
    state.posts = state.posts || [];

    downloadJSON("content.json", state.content);
    downloadJSON("posts.json", state.posts);
    
    const siteUrl = cfg.site?.url || "https://example.com";
    const siteName = cfg.site?.name || "网站";
    downloadFile("sitemap.xml", genSitemap(siteUrl, state.posts), "application/xml;charset=utf-8");
    downloadFile("feed.xml", genFeed(siteUrl, siteName, state.posts), "application/xml;charset=utf-8");
    alert("已导出：content.json + posts.json + sitemap.xml + feed.xml（请覆盖上传到 /data/ 与根目录）。");
  };

  document.getElementById("btnDownloadPostTpl").onclick = ()=>{
    const tpl = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>文章标题｜${cfg.site?.name || "宽宽的网站"}</title>
  <meta name="description" content="一句话摘要（用于 SEO 与分享）" />
  <meta property="og:title" content="文章标题｜${cfg.site?.name || "宽宽的网站"}" />
  <meta property="og:description" content="一句话摘要（用于 SEO 与分享）" />
  <meta property="og:type" content="article" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/assets/style.css" />
</head>
<body>
  <div data-include="header"></div>
  <main class="container">
    <article class="card">
      <h1 style="margin-top:0">文章标题</h1>
      <p class="muted">${todayISO()} · 标签：学习 / 随笔</p>
      <hr/>
      <p>从这里开始写正文…</p>
      <pre><code>console.log("Hello");</code></pre>
    </article>
    <div style="height:14px"></div>
    <section class="card"><h2>评论</h2><p class="muted">评论由 Giscus 提供（可在 config.json 开关）。</p><div data-giscus-mount></div></section>
  </main
  <div data-include="footer"></div>
  <script src="/assets/config.js"></script>
  <script src="/assets/main.js"></script>
</body>
</html>`;
    downloadFile("post-template.html", tpl, "text/html;charset=utf-8");
  };

  (async function init(){
    cfg = await (window.loadSiteConfig ? window.loadSiteConfig() : cfg);

    const content = await loadJSON("/data/content.json").catch(()=>state.content);
    const posts = await loadJSON("/data/posts.json").catch(()=>state.posts);
    state = { content, posts };

    state.content = state.content || { home:{ heroTitle: cfg.site?.name || "宽宽的网站", heroSubtitle:"", sections:[] }, projects:[] };
    state.content.home = state.content.home || { heroTitle: cfg.site?.name || "宽宽的网站", heroSubtitle:"", sections:[] };
    state.content.home.sections = state.content.home.sections || [];
    state.content.projects = state.content.projects || [];
    state.posts = state.posts || [];

    attachListClick(homeList, "home");
    attachListClick(projList, "proj");
    attachListClick(postList, "post");

    renderLists();
    refreshPreview();
  })();
})();
