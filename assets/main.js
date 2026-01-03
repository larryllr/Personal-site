// /assets/main.js

// 0) 加载配置
async function getCfg() {
  if (window.loadSiteConfig) return await window.loadSiteConfig();
  // 兜底：如果没加载 config.js
  const res = await fetch("/config.json", { cache: "no-store" });
  return await res.json();
}

// 1) 头尾注入（避免每页重复导航/页脚）
async function injectPartials() {
  const headerEl = document.querySelector("[data-include='header']");
  const footerEl = document.querySelector("[data-include='footer']");
  if (headerEl) headerEl.innerHTML = await (await fetch("/partials/header.html")).text();
  if (footerEl) footerEl.innerHTML = await (await fetch("/partials/footer.html")).text();

  // 注入完成后，用 config 替换站名/导航/社交
  try {
    const cfg = await getCfg();
    // 站名
    document.querySelectorAll("[data-site-name]").forEach(el => el.textContent = cfg.site?.name || el.textContent);

    // 导航
    const nav = cfg.nav || [];
    const navEl = document.querySelector("[data-nav-links]");
    if (navEl && nav.length) {
      navEl.innerHTML = nav.map(i => `<a href="${i.href}">${i.text}</a>`).join("");
      // 追加主题按钮（保持原功能）
      navEl.insertAdjacentHTML("beforeend", ` <button class="btn" type="button" data-theme-toggle>切换主题</button>`);
    }

    // 社交链接（页脚）
    const social = cfg.social || [];
    const socialEl = document.querySelector("[data-social-links]");
    if (socialEl) {
      socialEl.innerHTML = social.map(s => `<a href="${s.href}" target="_blank" rel="noopener">${s.text}</a>`).join(" · ");
    }

    // meta theme-color
    const themeColor = cfg.site?.themeColor;
    if (themeColor) {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", themeColor);
    }

    // Turnstile sitekey（如果启用）
    const ts = cfg.features?.turnstileSiteKey;
    const enableTS = cfg.features?.enableTurnstile;
    const tsDiv = document.querySelector(".cf-turnstile");
    if (tsDiv && enableTS && ts && ts !== "YOUR_TURNSTILE_SITE_KEY") {
      tsDiv.setAttribute("data-sitekey", ts);
    }


    // Giscus（如果启用：自动注入到含有 data-giscus-mount 的页面）
    const enableG = cfg.features?.enableGiscus;
    const g = cfg.features?.giscus || {};
    const mount = document.querySelector("[data-giscus-mount]");
    if (enableG && mount && g.repo && g.repoId && g.categoryId &&
        !String(g.repo).includes("YOUR_") && !String(g.repoId).includes("YOUR_") && !String(g.categoryId).includes("YOUR_")) {
      if (!document.getElementById("giscus-script")) {
        const s = document.createElement("script");
        s.id = "giscus-script";
        s.src = "https://giscus.app/client.js";
        s.async = true;
        s.crossOrigin = "anonymous";
        s.setAttribute("data-repo", g.repo);
        s.setAttribute("data-repo-id", g.repoId);
        s.setAttribute("data-category", g.category || "General");
        s.setAttribute("data-category-id", g.categoryId);
        s.setAttribute("data-mapping", g.mapping || "pathname");
        s.setAttribute("data-strict", "0");
        s.setAttribute("data-reactions-enabled", "1");
        s.setAttribute("data-emit-metadata", "0");
        s.setAttribute("data-input-position", "top");
        s.setAttribute("data-theme", "preferred_color_scheme");
        s.setAttribute("data-lang", g.lang || "zh-CN");
        mount.appendChild(s);
      }
    }

    // Analytics（如果启用）
    const enableA = cfg.features?.enableAnalytics;
    const token = cfg.features?.cloudflareAnalyticsToken;
    if (enableA && token && token !== "YOUR_TOKEN") {
      // 避免重复插入
      if (!document.querySelector("script[data-cf-beacon]")) {
        const s = document.createElement("script");
        s.defer = true;
        s.src = "https://static.cloudflareinsights.com/beacon.min.js";
        s.setAttribute("data-cf-beacon", JSON.stringify({ token }));
        document.head.appendChild(s);
      }
    }
  } catch (e) {
    // 配置读取失败不影响页面加载
    console.warn("config load failed:", e);
  }
}

// 2) 暗色模式（记忆用户选择）
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  applyTheme(saved ?? (prefersDark ? "dark" : "light"));

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
  });
}

injectPartials();
initTheme();
