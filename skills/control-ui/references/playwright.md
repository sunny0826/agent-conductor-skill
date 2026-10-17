# 已有 Playwright 环境下的截图示例

这些示例适用于项目或隔离工具环境已经安装 `playwright` 且具备匹配的 Chromium 或已安装的 Chrome／Edge 的情况。先从该环境运行 `node -e "console.log(require.resolve('playwright'))"` 核实依赖位置。将脚本放到该环境能解析依赖的位置；仅切换工作目录不会改变位于其他目录的脚本的模块解析。不要将示例原样用于未知应用，也不要为截图自动安装依赖或下载浏览器。

## Web：操作前后截图

将下段保存为临时 `capture-web.mjs`。五个参数依次为：实际测试 URL、证据目录、唯一应用标题、按钮名称、操作后应出现的唯一文本。参数来自项目源码与实际界面；非按钮流程按项目真实操作改写。可选第六个参数是已安装浏览器的 channel，如 `chrome` 或 `msedge`；省略时使用 Playwright 配套 Chromium，缺失时不自动下载。

```javascript
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const [url, output, heading, button, result, channel] = process.argv.slice(2);
if (![url, output, heading, button, result].every(Boolean)) {
  throw new Error("Usage: node capture-web.mjs URL OUTPUT_DIR HEADING BUTTON RESULT [CHANNEL]");
}
await mkdir(output, { recursive: true });
const browser = await chromium.launch(channel ? { channel } : {});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(10000);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: heading, exact: true }).waitFor();
  const before = path.resolve(output, "before.png");
  const after = path.resolve(output, "after.png");
  await page.screenshot({ path: before, fullPage: true });
  await page.getByRole("button", { name: button, exact: true }).click();
  await page.getByText(result, { exact: true }).waitFor();
  await page.screenshot({ path: after, fullPage: true });
  console.log(JSON.stringify({ before, after, capturedAt: new Date().toISOString() }));
} finally {
  await browser.close();
}
```

运行形状：`node capture-web.mjs '<实际URL>' '<证据目录>' '<应用标题>' '<按钮名>' '<结果文本>'`。错误的标题、按钮或结果必须使脚本失败，不能跳过断言仍报告通过。输出路径随后按 [截图读回与交付](../SKILL.md#读回与交付) 核对。

## Electron／Chromium：连接已有调试实例

项目须支持已授权的 `--remote-debugging-port=<实际端口>`，并已启动目标实例。不要为取证改变用户日常浏览器的配置。下段保存为临时 `capture-cdp.mjs`，参数依次为实际 CDP 地址、PNG 路径和稳定的应用根节点选择器。

```javascript
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const [endpoint, output, marker] = process.argv.slice(2);
if (![endpoint, output, marker].every(Boolean)) {
  throw new Error("Usage: node capture-cdp.mjs CDP_ENDPOINT OUTPUT_PNG APP_MARKER");
}
const browser = await chromium.connectOverCDP(endpoint, { timeout: 10000 });
try {
  const matches = [];
  for (const context of browser.contexts()) {
    for (const page of context.pages()) {
      if (await page.locator(marker).count()) matches.push(page);
    }
  }
  if (matches.length !== 1) {
    throw new Error(`Expected one matching app page, found ${matches.length}`);
  }
  const page = matches[0];
  page.setDefaultTimeout(10000);
  await page.locator(marker).waitFor();
  await mkdir(path.dirname(output), { recursive: true });
  await page.screenshot({ path: output, fullPage: true });
  console.log(JSON.stringify({ path: path.resolve(output), capturedAt: new Date().toISOString() }));
} finally {
  await browser.close();
}
```

连接已有实例时只断开本次连接；实例进程由创建它的执行者清理。示例只验证页面选择与捕获，实际功能验收须在截图前插入该项目的真实动作和结果检查，不能将连接成功当作功能通过。

API 依据：[截图](https://playwright.dev/docs/screenshots)、[CDP 连接](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp)、[关闭连接](https://playwright.dev/docs/api/class-browser#browser-close)。其他宿主用其实际可用的等效接口，不要求 Node 或 CDP。
