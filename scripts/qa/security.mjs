// QA: black-box security checks against a running production build.
// Usage: node scripts/qa/security.mjs [baseUrl]  (default: the e2e server, http://localhost:3999, signed in as the e2e owner)
const base = process.argv[2] ?? "http://localhost:3999";
const results = [];
const check = (name, ok, detail = "") =>
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
const get = (path, init = {}) => fetch(base + path, { redirect: "manual", ...init });

// 1. Security headers
const home = await get("/en");
const h = home.headers;
check("CSP present", !!h.get("content-security-policy")?.includes("frame-ancestors 'none'"));
check("HSTS", !!h.get("strict-transport-security"));
check("X-Frame-Options DENY", h.get("x-frame-options") === "DENY");
check("nosniff", h.get("x-content-type-options") === "nosniff");
check("No X-Powered-By", !h.get("x-powered-by"));
check("Admin noindex", (await get("/admin/login")).headers.get("x-robots-tag")?.includes("noindex"));

// 2. Unauthenticated access
for (const path of ["/api/messages/export", "/api/upload", "/api/draft?type=page"]) {
  const r = await get(path);
  check(`401 without session: GET ${path}`, r.status === 401, `status ${r.status}`);
}
const up = await get("/api/upload", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    type: "blob.generate-client-token",
    payload: { pathname: "media/x.png", clientPayload: '{"kind":"image"}', multipart: false },
  }),
});
check("Upload token refused without session", up.status === 401, `status ${up.status}`);
const badJson = await get("/api/upload", { method: "POST", body: "{not json" });
check("Malformed upload body → 400 (not 500)", badJson.status === 400, `status ${badJson.status}`);
const localUp = await get("/api/upload/local", { method: "POST", body: new FormData() });
check("Local upload refused without session", localUp.status === 401, `status ${localUp.status}`);
const adminPage = await get("/admin/projects");
check(
  "Dashboard redirects to login",
  adminPage.status >= 300 && adminPage.status < 400 && adminPage.headers.get("location")?.includes("/admin/login"),
);

// 3. Path traversal on local media
for (const p of [
  "/api/media/local/..%2F..%2Fpackage.json",
  "/api/media/local/%2e%2e/%2e%2e/.env.local",
  "/api/media/local/../../package.json",
]) {
  const r = await get(p);
  check(`Traversal blocked: ${p}`, r.status === 404, `status ${r.status}`);
}

// 4. Open redirect
for (const to of [
  "//evil.example",
  "/\\evil.example",
  "https://evil.example",
  "/%5Cevil.example",
  "/\t/evil.example",
]) {
  const r = await get(`/api/draft/disable?to=${encodeURIComponent(to)}`);
  const loc = r.headers.get("location") ?? "";
  const dest = new URL(loc, base);
  check(`No open redirect: ${JSON.stringify(to)}`, dest.origin === base, `→ ${loc}`);
}

// 5. Auth API hardening
const signUp = await get("/api/auth/sign-up/email", {
  method: "POST",
  headers: { "content-type": "application/json", origin: base },
  body: JSON.stringify({ email: "x@example.com", password: "password-12345", name: "x" }),
});
check("Public sign-up disabled", signUp.status >= 400, `status ${signUp.status}`);
const cross = await get("/api/auth/sign-in/email", {
  method: "POST",
  headers: { "content-type": "application/json", origin: "https://evil.example" },
  body: JSON.stringify({ email: "e2e-owner@example.com", password: "x" }),
});
check("Cross-origin sign-in rejected (CSRF)", cross.status === 403, `status ${cross.status}`);

// Sign in to test the admin plugin endpoints are closed even for a super admin.
const signIn = await get("/api/auth/sign-in/email", {
  method: "POST",
  headers: { "content-type": "application/json", origin: base },
  body: JSON.stringify({ email: "e2e-owner@example.com", password: "e2e-owner-password" }),
});
const cookie = (signIn.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
check("Super admin sign-in works", signIn.status === 200 && cookie.includes("radix"), `status ${signIn.status}`);
for (const ep of [
  "update-user",
  "create-user",
  "set-role",
  "remove-user",
  "ban-user",
  "unban-user",
  "list-users",
  "set-user-password",
  "impersonate-user",
]) {
  const r = await get(`/api/auth/admin/${ep}`, {
    method: ep === "list-users" ? "GET" : "POST",
    headers: { "content-type": "application/json", origin: base, cookie },
    body: ep === "list-users" ? undefined : JSON.stringify({ userId: "x", role: "editor", data: { role: "editor" } }),
  });
  check(`Admin plugin endpoint closed: ${ep}`, r.status === 403, `status ${r.status}`);
}
const exp = await get("/api/messages/export", { headers: { cookie } });
check("CSV export works for super admin", exp.status === 200 && exp.headers.get("cache-control") === "no-store");

// 6. Session cookie flags
const setCookie = (signIn.headers.getSetCookie?.() ?? []).join("\n");
check("Session cookie HttpOnly", /HttpOnly/i.test(setCookie));
check("Session cookie SameSite=Lax", /SameSite=Lax/i.test(setCookie));

// 7. Brute force: sign-in rate limit
let limited = false;
for (let i = 0; i < 8; i++) {
  const r = await get("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: base, "x-forwarded-for": "203.0.113.9" },
    body: JSON.stringify({ email: "nobody@example.com", password: "wrong-password" }),
  });
  if (r.status === 429) limited = true;
}
check("Sign-in rate limited", limited);

// 8. Reset-password enumeration: same response for unknown email
const reset = (email) =>
  get("/api/auth/request-password-reset", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: base,
      "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200)}`,
    },
    body: JSON.stringify({ email, redirectTo: "/admin/reset-password" }),
  }).then(async (r) => `${r.status} ${await r.text()}`);
const [known, unknown] = [await reset("e2e-owner@example.com"), await reset("nobody@example.com")];
check("Password reset doesn't reveal accounts", known === unknown, `${known} | ${unknown}`);

// 9. Server Action without session
const actionProbe = await get("/admin/projects", {
  method: "POST",
  headers: { "next-action": "0".repeat(42), "content-type": "text/plain" },
  body: "[]",
});
check("Unknown Server Action id rejected", actionProbe.status >= 300, `status ${actionProbe.status}`);

// 10. Sensitive files not served
for (const p of [
  "/.env",
  "/.env.local",
  "/.data/e2e-emails.log",
  "/package.json",
  "/.git/config",
  "/drizzle/meta/_journal.json",
]) {
  const r = await get(p);
  check(
    `Not served: ${p}`,
    r.status === 404 || (r.status >= 300 && r.status < 400 && !(await r.text()).includes("DATABASE")),
    `status ${r.status}`,
  );
}

// 11. XSS reflection in query strings
const xss = "<script>alert(1)</script>";
const w = await (await get(`/en/services?category=${encodeURIComponent(xss)}`)).text();
check("Query string not reflected unescaped", !w.includes(xss));

console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
