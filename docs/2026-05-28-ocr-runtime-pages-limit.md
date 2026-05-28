# OCR Runtime 排障记录

日期：2026-05-28

## 背景

项目是一个部署在 Cloudflare Pages 的浏览器端 OCR 工具，前端使用：

- `@paddleocr/paddleocr-js`
- `onnxruntime-web`
- 自托管的 `PP-OCRv5_mobile_det` / `PP-OCRv5_mobile_rec` 模型 tar

目标是让 OCR 全程在浏览器内运行，图片不进入服务端。

## 触发的问题

本次处理过程中，先后出现了几类报错：

1. CSP 报错：
   `Evaluating a string as JavaScript violates the following Content Security Policy directive...`
2. ORT 初始化失败：
   `no available backend found. ERR: [wasm] Error: previous call to 'initWasm()' failed.`
3. 部署约束问题：
   ORT 运行时文件超过 Cloudflare Pages 单文件限制，无法稳定按原方案部署。

## 排查过程

### 1. 先定位 CSP 问题

检查发现：

- 应用代码本身没有直接调用 `eval`
- 依赖链中 `@techstark/opencv-js` 使用了 `new Function(...)`
- `onnxruntime-web` 的部分浏览器产物也包含动态求值路径

结论：

- 仅允许 `'wasm-unsafe-eval'` 不够
- 必须在 CSP 中额外允许 `'unsafe-eval'`

处理：

- 更新 [`public/_headers`](../public/_headers)
- 在 [`README.md`](../README.md) 中补充原因说明

### 2. 再定位 `initWasm()` 失败

最初应用配置让 ORT 从外部 CDN 加载 wasm 资源。

这会带来几个问题：

- 运行是否成功取决于外部 CDN 可达性
- 页面启用了 COOP/COEP，跨域资源兼容性需要依赖对方响应头
- 一旦第一次初始化失败，ORT 后续会只返回
  `previous call to 'initWasm()' failed`
  这个二次错误，掩盖第一次失败原因

本地复现后确认：

- OCR 主流程本身可以工作
- `initWasm()` 失败更像是外部 ORT 资源加载链路不稳定

因此把 ORT 改成站内自托管，避免运行依赖外部 CDN。

### 3. 自托管后发现 Pages 文件大小限制

最初选择自托管的是 ORT 的 `jsep` 变体：

- `ort-wasm-simd-threaded.jsep.wasm`

该文件本地大小约为 `26M`，超过了 Cloudflare Pages 的单文件限制 `25 MiB`。

这意味着：

- 免费版不行
- 付费版也不能靠升级套餐解决
- 必须换运行时变体或换托管方式

## 最终方案

最终没有继续使用 `jsep` / WebGPU 方向，而是切换到 ORT 的纯 WASM 变体。

### 方案内容

1. `vite` 通过 alias 将 `onnxruntime-web` 解析到 `onnxruntime-web/wasm`
2. 自托管的 ORT 运行时改为：
   - `ort-wasm-simd-threaded.mjs`
   - `ort-wasm-simd-threaded.wasm`
3. `scripts/prepare-assets.mjs` 在准备 OCR 模型时，同时复制这两个 ORT 文件到：
   - `public/vendor/onnxruntime/`
4. 清理旧的 `jsep` 产物，避免继续把 26M 文件带进 `dist/`
5. 页面文案、README、meta 描述同步调整，不再宣传 WebGPU
6. `scripts/smoke-prepare-assets.sh` 增加 ORT 资产检查

### 最终文件体积

最终保留下来的核心 ORT wasm 文件为：

- `public/vendor/onnxruntime/ort-wasm-simd-threaded.wasm`

本地实际大小约为 `13M`，低于 Cloudflare Pages 的 `25 MiB` 单文件限制。

## 修改点

本次主要修改了以下文件：

- [`vite.config.js`](../vite.config.js)
- [`src/main.js`](../src/main.js)
- [`src/i18n.js`](../src/i18n.js)
- [`index.html`](../index.html)
- [`public/_headers`](../public/_headers)
- [`scripts/prepare-assets.mjs`](../scripts/prepare-assets.mjs)
- [`scripts/smoke-prepare-assets.sh`](../scripts/smoke-prepare-assets.sh)
- [`README.md`](../README.md)

新增目录与文件：

- [`public/vendor/onnxruntime/`](../public/vendor/onnxruntime/)

## 验证结果

本地已完成以下验证：

- `npm run prepare:assets`
- `npm run build`
- `npm test`

并确认：

- `dist/vendor/onnxruntime/` 中只剩纯 WASM 变体
- 单个 ORT wasm 文件体积低于 Pages 限制
- 页面初始化不再依赖外部 CDN

## 取舍说明

本次方案的核心 tradeoff：

- 保住 Cloudflare Pages 可部署性
- 保住浏览器端 OCR 能力
- 放弃当前版本中的 WebGPU 路径

如果未来要重新引入 WebGPU，有几个方向：

1. 改用不受 Pages 单文件限制的托管位置存放更大的 ORT 运行时
2. 拆分或重新评估 ORT 变体
3. 改用别的静态托管/CDN 组合承载大文件

## 当前结论

截至 2026-05-28，这个项目在 Cloudflare Pages 上的稳定方案是：

- OCR 模型自托管
- ORT 使用纯 WASM 变体
- ORT 运行时同源自托管
- 不依赖外部 CDN
- 不启用 WebGPU 路径
