// /assets/config.js
// 把 config.json 读入并注入到页面，供 header/footer 与 SEO/RSS/Sitemap 提示等使用。
// 注意：纯静态站里，sitemap.xml / feed.xml 仍然是静态文件；你改了域名后记得同步更新它们。

async function loadSiteConfig() {
  if (window.__SITE_CONFIG__) return window.__SITE_CONFIG__;
  const res = await fetch("/config.json", { cache: "no-store" });
  const cfg = await res.json();
  window.__SITE_CONFIG__ = cfg;
  return cfg;
}
window.loadSiteConfig = loadSiteConfig;
