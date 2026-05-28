# Glass OCR

隐私优先的在线 OCR MVP。页面部署在 Cloudflare Pages，OCR 在用户浏览器中完成，上传图片不会进入服务端。

## 技术方案

- 前端：Vite + 原生 JavaScript
- OCR：官方 `@paddleocr/paddleocr-js`
- 模型：`PP-OCRv5_mobile_det` + `PP-OCRv5_mobile_rec`
- 推理：ONNX Runtime Web `wasm` 变体
- ONNX Runtime WASM：同源自托管
- 模型资产：自托管官方 ONNX tar
- 托管：Cloudflare Pages

## 本地开发

```bash
npm install
npm run dev
```

默认会先执行资源准备脚本，下载官方 PP-OCRv5 mobile ONNX tar 到 `public/`，并把 `onnxruntime-web` 的纯 WASM 运行时 `ort-wasm-simd-threaded.{mjs,wasm}` 复制到 `public/vendor/onnxruntime/`。运行时直接从当前站点加载这些 ORT 资产，不再依赖外部 CDN。

不要直接双击打开 `index.html` 或 `dist/index.html`。PaddleOCR.js、ONNX Runtime 和模型 tar 必须通过 HTTP 提供，否则浏览器会直接拦截或把资源当下载处理。

## 常用命令

```bash
npm run check:assets   # 检查本地/远端 OCR 资产配置
npm run test           # 资源准备 smoke test
npm run build          # 生成 dist/
npm run preview        # 本地预览生产构建
```

## 部署到 Cloudflare Pages

### 方式一：Git 集成

- Build command: `npm run build`
- Build output directory: `dist`

### 方式二：CLI 直传

```bash
npx wrangler pages deploy dist
```

仓库内的 `wrangler.jsonc` 已声明 `pages_build_output_dir` 为 `./dist`。

## 隐私与缓存

- OCR 在浏览器中运行，图片不上传到你的应用服务端。
- `public/_headers` 为模型 tar 和 ORT 运行时资产设置了长缓存，适合 Cloudflare 全球边缘缓存。
- 头部里启用了 `Cross-Origin-Opener-Policy` 和 `Cross-Origin-Embedder-Policy`，为浏览器内 WASM 推理提供稳定运行环境。
- `public/_headers` 的 CSP 里同时放行了 `'unsafe-eval'` 和 `'wasm-unsafe-eval'`。这是当前 `@techstark/opencv-js` 与 `onnxruntime-web` 浏览器产物的运行要求；如果移除 `'unsafe-eval'`，OCR 初始化会被浏览器 CSP 直接拦截。

## ORT 资产说明

`onnxruntime-web` 当前使用自托管的 `ort-wasm-simd-threaded.{mjs,wasm}` 资产，来源于本地 `node_modules/onnxruntime-web/dist/`。选择这个纯 WASM 变体，是为了把单文件体积控制在 Cloudflare Pages 的 25 MiB 限制以内。升级 `@paddleocr/paddleocr-js` 或 `onnxruntime-web` 后，应重新执行 `npm install` 和 `npm run prepare:assets`，确保 `public/vendor/onnxruntime/` 中的运行时文件与依赖版本保持一致。

## 当前 MVP 功能

- 单图上传与拖拽
- PP-OCRv5 mobile 检测 + 识别
- `auto` / `wasm` 后端切换
- OCR 进度展示
- 检测框覆盖层
- 复制文本与下载 TXT

## 后续迭代建议

1. 加入官方多语言 `PP-OCRv5` 识别模型切换。
2. 加入图像预处理链路，比如灰度化、二值化、自动拉直和对比度增强。
3. 对移动端做分级策略：大图先降采样，再按块识别，避免内存峰值过高。
4. 为模型文件加版本化路径，进一步强化 Cloudflare 边缘缓存命中。
