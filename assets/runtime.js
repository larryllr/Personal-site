// /assets/runtime.js
async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return await res.json();
}
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

(async function(){
  try{
    const data = await loadJSON("/data/content.json");

    // Home
    const heroTitle = document.getElementById("heroTitle");
    const heroSubtitle = document.getElementById("heroSubtitle");
    const grid = document.getElementById("homeGrid");
    if (heroTitle && data.home?.heroTitle) heroTitle.textContent = data.home.heroTitle;
    if (heroSubtitle && data.home?.heroSubtitle) heroSubtitle.textContent = data.home.heroSubtitle;

    if (grid && Array.isArray(data.home?.sections)){
      grid.innerHTML = data.home.sections.map(sec => `
        <div class="card">
          <h3>${esc(sec.title || "")}</h3>
          <p class="muted">${esc(sec.body || "")}</p>
        </div>
      `).join("");
    }

    // Projects
    const pgrid = document.getElementById("projectsGrid");
    if (pgrid && Array.isArray(data.projects)){
      pgrid.innerHTML = data.projects.map(p => `
        <article class="card">
          <h2 style="margin:0 0 6px">${esc(p.title || "")}</h2>
          <p class="muted">${esc(p.summary || "")}</p>
          ${p.image ? `<img src="${esc(p.image)}" alt="截图" style="width:100%;border-radius:12px;border:1px solid var(--line);margin-top:10px" />` : ""}
          ${p.link ? `<p style="margin:10px 0 0"><a href="${esc(p.link)}" target="_blank" rel="noopener">项目链接</a></p>` : ""}
          <small class="muted">${Array.isArray(p.tags) && p.tags.length ? ("标签：" + p.tags.map(esc).join(" / ")) : ""}</small>
        </article>
      `).join("") || `<p class="muted">暂无项目。</p>`;
    }
  }catch(e){
    console.warn(e);
    const heroSubtitle = document.getElementById("heroSubtitle");
    if (heroSubtitle) heroSubtitle.textContent = "内容加载失败：请确认 /data/content.json 存在且为合法 JSON。";
  }
})();
