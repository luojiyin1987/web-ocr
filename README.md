# Glass OCR

隐私优先的在线 OCR MVP。页面部署在 Cloudflare Pages，OCR 在用户浏览器中完成，上传图片不会进入服务端。

## 技术方案

- 前端：Vite + 原生 JavaScript
- OCR：官方 `@paddleocr/paddleocr-js`
- 模型：`PP-OCRv5_mobile_det` + `PP-OCRv5_mobile_rec`
- 推理：ONNX Runtime Web，优先 `WebGPU`，回退 `WASM`
- ONNX Runtime WASM：通过 unpkg CDN 加载（版本锁定）
- 模型资产：自托管官方 ONNX tar
- 托管：Cloudflare Pages

## 本地开发

```bash
npm install
npm run dev
```

默认会先执行资源准备脚本，下载官方 PP-OCRv5 mobile ONNX tar 到 `public/`。ONNX Runtime 的 wasm 资源在运行时通过 unpkg CDN 加载，版本已锁定，不再由 Vite 打包到 `dist/assets/`。

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
- `public/_headers` 为模型 tar 设置了长缓存，适合 Cloudflare 全球边缘缓存。
- 头部里启用了 `Cross-Origin-Opener-Policy` 和 `Cross-Origin-Embedder-Policy`，为线程化 WASM 与 WebGPU 运行条件做准备。

## 外部 CDN 风险与注意事项

ONNX Runtime Web 的 `.wasm` 文件在运行时通过 `unpkg.com` 加载，需关注以下风险：

1. **CDN 可用性依赖**：如果用户网络无法访问 `unpkg.com`（或被墙），WASM 会加载失败，导致 OCR 无法初始化。如需更高可用性，建议再配置一条 jsDelivr 的 fallback URL。
2. **版本锁定**：当前锁定版本为 `onnxruntime-web@1.26.0`，不会自动跟随最新版。后续升级 `@paddleocr/paddleocr-js` 时，应检查其依赖的 `onnxruntime-web` 版本，并同步更新 `wasmPaths` 中的版本号。
3. **CORP 兼容性**：`public/_headers` 设置了 `Cross-Origin-Embedder-Policy: require-corp`。经验证，`unpkg.com` 的响应头已携带 `Cross-Origin-Resource-Policy: cross-origin`，浏览器不会拦截跨域 WASM 加载。

## 当前 MVP 功能

- 单图上传与拖拽
- PP-OCRv5 mobile 检测 + 识别
- `auto` / `webgpu` / `wasm` 后端切换
- OCR 进度展示
- 检测框覆盖层
- 复制文本与下载 TXT

## 后续迭代建议

1. 加入官方多语言 `PP-OCRv5` 识别模型切换。
2. 加入图像预处理链路，比如灰度化、二值化、自动拉直和对比度增强。
3. 对移动端做分级策略：大图先降采样，再按块识别，避免内存峰值过高。
4. 为模型文件加版本化路径，进一步强化 Cloudflare 边缘缓存命中。
