import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the TeamAlign AI workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>TeamAlign AI<\/title>/i);
  assert.match(html, /class="app-shell active-view-0"/);
  assert.match(html, /协齐 AI 项目协作助手/);
  assert.match(html, />项目总览</);
  assert.match(html, />智能任务</);
  assert.match(html, />风险洞察</);
  assert.match(html, />汇报中心</);
  assert.match(html, /会议智能解析/);
  assert.match(html, /智能任务/);
  assert.match(html, /汇报中心/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|codex-preview/i);
});

test("ships stable hover states and focused workspace layouts", async () => {
  const [page, css, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  const accountHover = css.match(/\.account:hover\s*\{([^}]*)\}/)?.[1] ?? "";
  const teamHover = css.match(/\.team-summary-button:hover\s*\{([^}]*)\}/)?.[1] ?? "";

  assert.doesNotMatch(accountHover, /\bpadding(?:-left)?\s*:/);
  assert.doesNotMatch(teamHover, /\bpadding(?:-left)?\s*:/);
  assert.match(css, /button:focus-visible/);
  assert.match(css, /\.active-view-2 \.risk-list\s*\{[^}]*repeat\(2,/s);
  assert.match(css, /\.active-view-3 \.docs-card\s*\{[^}]*grid-template-columns:/s);
  assert.match(css, /@media \(max-width: 1180px\)[\s\S]*?\.board-columns\s*\{\s*grid-template-columns:\s*repeat\(2,/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*?\.board-columns\s*\{\s*grid-template-columns:\s*1fr;/);
  assert.doesNotMatch(css, /\.board-columns\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(page, /className=\{`view-header/);
  assert.match(page, /className="doc-sources"/);
  assert.match(layout, /title:\s*"TeamAlign AI"/);
});
