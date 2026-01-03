// /assets/search.js
(async function () {
  const posts = await (await fetch("/data/posts.json")).json();

  const qEl = document.getElementById("q");
  const tagsEl = document.getElementById("tags");
  const listEl = document.getElementById("list");

  const allTags = [...new Set(posts.flatMap(p => p.tags || []))].sort((a,b)=>a.localeCompare(b,'zh-CN'));
  let activeTag = "";

  function renderTags() {
    tagsEl.innerHTML = "";
    const makeBtn = (text, tag) => {
      const b = document.createElement("button");
      b.className = "btn";
      b.type = "button";
      b.textContent = text;
      b.onclick = () => { activeTag = tag; render(); renderTags(); };
      if (activeTag === tag) b.style.outline = "2px solid var(--accent)";
      return b;
    };
    tagsEl.appendChild(makeBtn("全部", ""));
    allTags.forEach(t => tagsEl.appendChild(makeBtn(t, t)));
  }

  function render() {
    const q = (qEl.value || "").trim().toLowerCase();
    const filtered = posts.filter(p => {
      const hay = (p.title + " " + (p.summary || "") + " " + (p.tags || []).join(" ")).toLowerCase();
      const hitQ = !q || hay.includes(q);
      const hitT = !activeTag || (p.tags || []).includes(activeTag);
      return hitQ && hitT;
    }).sort((a,b) => (a.date < b.date ? 1 : -1));

    listEl.innerHTML = filtered.map(p => `
      <article class="card">
        <h2 style="margin:0 0 6px"><a href="${p.url}">${p.title}</a></h2>
        <small>${p.date} · ${(p.tags||[]).join(" / ")}</small>
        <p style="margin:10px 0 0" class="muted">${p.summary || ""}</p>
      </article>
    `).join("") || `<p class="muted">没有匹配的文章。</p>`;
  }

  qEl?.addEventListener("input", render);
  renderTags();
  render();
})();
