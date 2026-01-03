// /functions/api/contact.js
// Cloudflare Pages Functions: POST /api/contact
// 需要你在 Pages -> Settings -> Functions / Variables 里绑定：
// 1) TURNSTILE_SECRET（Turnstile 私钥）
// 2) CONTACT_KV（KV 命名空间绑定）

export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  const email = String(form.get("email") || "");
  const message = String(form.get("message") || "");
  const token = String(form.get("cf-turnstile-response") || "");

  if (!email || !message) {
    return new Response("缺少字段：email 或 message", { status: 400 });
  }

  // 如果你暂时不启用 Turnstile，可以注释掉这段校验，并允许空 token（不建议）
  const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: token
    })
  });
  const verify = await verifyRes.json();
  if (!verify.success) {
    return new Response("验证失败（疑似机器人或 sitekey/secret 配置错误）", { status: 403 });
  }

  const id = crypto.randomUUID();
  await env.CONTACT_KV.put(`msg:${id}`, JSON.stringify({
    id, email, message, at: new Date().toISOString()
  }));

  return new Response("提交成功！我会尽快回复。", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}
