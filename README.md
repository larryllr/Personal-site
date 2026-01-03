# 宽宽的网站（纯静态 + Cloudflare Pages）

这是一套“路线 1：纯静态 HTML/CSS/JS”的个人站模板，已经包含：
- 响应式布局
- 暗色模式（右上角切换并记忆）
- 首页 / 关于 / 项目 / 博客 / 文章页 / 404
- 博客：标签筛选 + 站内搜索（读取 `/data/posts.json`）
- RSS（`/feed.xml`）、Sitemap（`/sitemap.xml`）、robots（`/robots.txt`）
- 评论（可选：Giscus，见下）
- 统计（可选：Cloudflare Web Analytics，见下）
- 联系表单（可选：Pages Functions + Turnstile + KV）

---

## 1. 你要改哪些地方？

### A) 站点名字（全站）
- 已设置为：**宽宽的网站**
- 如果要改：
  - `partials/header.html` 里的站名
  - 各页面 `<title>`（index/about/projects/blog/posts）
  - `assets/site.webmanifest` 的 name/short_name

### B) 首页内容
- `index.html`：修改介绍文字、卡片内容、联系表单说明

### C) 关于页
- `about.html`：把示例内容换成你的简介

### D) 项目页
- `projects.html`：复制卡片 `<article class="card"> ... </article>`，改名字/简介/链接
- 想加截图：把图片放到 `/assets/`，用：
  ```html
  <img src="/assets/your-image.png" alt="截图" style="width:100%;border-radius:12px;border:1px solid var(--line)" />
  ```

---

## 2. 博客怎么加文章？

### A) 新增文章文件
- 复制 `/posts/hello-world.html`
- 改文件名，例如：`/posts/my-note.html`
- 改文章标题、内容、日期、标签

### B) 更新文章索引
打开 `/data/posts.json`，新增一条：
```json
{
  "title": "我的新文章",
  "date": "2026-01-03",
  "summary": "一句话摘要",
  "tags": ["学习", "随笔"],
  "url": "/posts/my-note.html"
}
```

> `blog.html` 的搜索/标签就是读这个 JSON 自动生成的。

### C) 可选：同步更新 sitemap 与 RSS
- `sitemap.xml`：加一行
  ```xml
  <url><loc>https://你的域名/posts/my-note.html</loc><lastmod>2026-01-03</lastmod></url>
  ```
- `feed.xml`：复制 `<item>` 块，改 title/link/pubDate/description

---

## 3. 上线到 Cloudflare Pages（最简单）

1) 把整个目录推到 GitHub（或直接拖拽上传到 Pages 也可以）  
2) Cloudflare -> Workers & Pages -> Pages -> Connect to Git  
3) 这是纯静态站：**Build command 留空，Output directory 留空**  
4) 部署完成后访问站点

---

## 4. 统计（可选：Cloudflare Web Analytics）
- Cloudflare 后台创建 Web Analytics
- 拿到脚本后，把它粘贴到每个页面 `<head>` 里的注释位置（我已经留好）
  你也可以只在 `page()` 模板里统一加，但这是静态站，没有构建器，所以需要手动贴到每个页面（本项目已把注释放在所有页面模板里）。

---

## 5. 评论（可选：Giscus）
在文章页里我已经放了 Giscus 的脚本（见 `/posts/hello-world.html`），你需要：
1) 在 GitHub 仓库开启 Discussions
2) 在 giscus.app 生成配置参数
3) 把以下字段替换成你的：
- `data-repo`
- `data-repo-id`
- `data-category-id`

---

## 6. 联系表单（可选：Functions + Turnstile + KV）

### A) Turnstile
1) Cloudflare 后台创建 Turnstile  
2) 得到：
- SITE KEY：填到 `index.html` 的 `data-sitekey="..."`  
- SECRET KEY：保存到 Pages 环境变量 `TURNSTILE_SECRET`

### B) KV
1) 创建一个 KV Namespace  
2) 在 Pages 项目里把 KV 绑定为：`CONTACT_KV`

### C) Functions
本项目已包含：`/functions/api/contact.js`  
部署后表单会 POST 到 `/api/contact`，成功后会把消息写进 KV。

---

## 7. 常改样式的位置
- `assets/style.css`：颜色、圆角、卡片、字体都在这里
- 主题色：`--accent`

---

## 8. 绑定域名后必须做的事
把下面这个占位域名替换为你的真实域名：
- `sitemap.xml` 里的 `https://example.com`
- `feed.xml` 里的 `https://example.com`

---

祝你搭站顺利！你只要把内容换掉，就能很“像一个完整的网站”。
---

# 新增：统一配置（config.json）

你现在只需要优先改 **根目录的 `config.json`**：

- `site.name`：站名（导航栏/页脚/首页标题会自动同步）
- `site.url`：你的真实域名（用于 sitemap / RSS；改完后记得同步更新 `sitemap.xml` 和 `feed.xml`）
- `site.description`：站点描述（用于 SEO）
- `nav`：顶部导航（文字与链接）
- `social`：页脚社交链接（GitHub/B站/邮箱等）
- `features.enableAnalytics` + `cloudflareAnalyticsToken`：是否启用 Cloudflare Web Analytics（启用后会自动插入脚本）
- `features.enableTurnstile` + `turnstileSiteKey`：联系表单 Turnstile sitekey（自动同步到首页表单）
- `features.enableGiscus`：是否启用评论（文章页脚本仍需你填参数；后续你也可以让我帮你改成“自动注入”）

技术实现：
- `/assets/config.js` 负责读取 `/config.json`
- `/assets/main.js` 在注入 header/footer 后，用 config 替换站名、导航与社交链接，并按需插入统计脚本


---

# 新工作流：像做 PPT 一样改内容

你现在主要改两类文件：

1) `config.json`（站名/导航/社交/功能开关）
2) `data/content.json`（首页卡片与项目列表）

推荐编辑方式：
- 打开 `/admin.html` 管理页
- 编辑 -> 预览
- 点“导出 content.json”
- 把导出的文件覆盖上传到仓库：`/data/content.json`
- 推送到 GitHub 后 Cloudflare Pages 会自动重新部署

> 纯静态站无法在服务器端“直接保存到 GitHub”，所以用“导出 JSON + 覆盖上传”是最稳、最简单的方式。
