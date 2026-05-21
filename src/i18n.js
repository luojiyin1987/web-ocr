const DICT = {
  zh: {
    heroTitle: '图片进来，文字出去。\n图像不离开浏览器。',
    heroDesc:
      '现在改用 PP-OCRv5 mobile ONNX，在浏览器内完成检测和识别。Cloudflare 只负责静态托管、全球缓存和分发模型资产，不接触用户上传的图片。',
    heroPill1: '隐私优先',
    heroPill3: 'Cloudflare 全球分发',
    runtimeLabel: 'Runtime',
    engineLabel: '当前引擎',
    backendLabel: '后端偏好',
    providerLabel: '实际 Provider',
    modelSourceLabel: '模型来源',
    uninitialized: '未初始化',
    selfHostedOnnx: '同源 ONNX tar',
    step1Label: 'Step 1',
    uploadImage: '上传图片',
    clear: '清空',
    dropzoneTitle: '拖拽图片到这里',
    dropzoneSubtitle: '或点击选择 PNG / JPG / WEBP / GIF',
    backendSelectLabel: '推理后端',
    showBoxesLabel: '显示检测框',
    startOcr: '开始 OCR',
    copyText: '复制文本',
    downloadTxt: '下载 TXT',
    progressLabelWaitImage: '等待图片',
    privacyNote:
      '图片仅在当前浏览器会话内处理。Cloudflare Pages 负责托管页面、ONNX Runtime 资产和 PP-OCRv5 模型，不接收你上传的图片内容。',
    step2Label: 'Step 2',
    imagePreview: '图像预览',
    noImageSelected: '尚未选择图片',
    previewPlaceholder: '上传后会在这里展示识别区域',
    step3Label: 'Step 3',
    extractResult: '提取结果',
    resultDuration: '耗时',
    resultScore: '平均分',
    resultLines: '文本行',
    placeholderResult: 'OCR 结果会出现在这里',
    noscriptTitle: 'Glass OCR',
    noscriptStrong: '隐私优先的浏览器端 OCR 工具。',
    noscriptBody:
      '图片不上传服务器，文字提取直接在用户浏览器里完成。支持 PP-OCRv5 mobile ONNX 模型，兼容 WebGPU 与 WASM 后端。',
    noscriptWarning: '⚠️ 本工具需要启用 JavaScript 才能运行 OCR 推理。请开启浏览器的 JavaScript 支持后刷新页面。',
    langSwitch: '语言',
    // main.js runtime texts
    waitingForImage: '等待图片',
    imageReady: '图片已就绪',
    creatingPaddleOcr: '创建 PaddleOCR.js 实例',
    initializingOnnx: '初始化 ONNX Runtime',
    runningOcr: '执行文字检测与识别',
    noTextDetected: '未识别到文字',
    completedPattern: '完成 · 全图 · {0} / {1}',
    ocrFailed: 'OCR 失败，请重试',
    ocrFailedWithReason: 'OCR 失败：{0}',
    fileProtocolWarning:
      '当前页面是通过 file:// 直接打开的。PaddleOCR.js、ONNX Runtime 和模型 tar 需要通过 HTTP 服务加载，请改用 npm run dev 或 Cloudflare Pages 访问。',
    openViaHttp: '请通过 HTTP 打开页面',
    copied: '已复制到剪贴板',
    copyFailed: '复制失败，请手动复制',
    imageLoadFailed: '图片加载失败，请尝试其他图片',
    backendSwitched: '后端已切换，下一次识别会重新初始化',
    webgpuReady: 'WebGPU ready',
    wasmFallback: 'WASM fallback',
  },
  en: {
    heroTitle: 'Image in, text out.\nImages never leave your browser.',
    heroDesc:
      'Now powered by PP-OCRv5 mobile ONNX, detection and recognition run entirely in your browser. Cloudflare only handles static hosting, global caching and model asset delivery — it never sees the images you upload.',
    heroPill1: 'Privacy-first',
    heroPill3: 'Cloudflare Global CDN',
    runtimeLabel: 'Runtime',
    engineLabel: 'Engine',
    backendLabel: 'Backend',
    providerLabel: 'Provider',
    modelSourceLabel: 'Model Source',
    uninitialized: 'Uninitialized',
    selfHostedOnnx: 'Self-hosted ONNX tar',
    step1Label: 'Step 1',
    uploadImage: 'Upload Image',
    clear: 'Clear',
    dropzoneTitle: 'Drop image here',
    dropzoneSubtitle: 'or click to choose PNG / JPG / WEBP / GIF',
    backendSelectLabel: 'Inference Backend',
    showBoxesLabel: 'Show Detection Boxes',
    startOcr: 'Start OCR',
    copyText: 'Copy Text',
    downloadTxt: 'Download TXT',
    progressLabelWaitImage: 'Waiting for image',
    privacyNote:
      'Images are processed only within the current browser session. Cloudflare Pages hosts the page, ONNX Runtime assets and PP-OCRv5 models, but never receives the images you upload.',
    step2Label: 'Step 2',
    imagePreview: 'Image Preview',
    noImageSelected: 'No image selected',
    previewPlaceholder: 'Recognition regions will appear here after upload',
    step3Label: 'Step 3',
    extractResult: 'Extracted Result',
    resultDuration: 'Duration',
    resultScore: 'Avg Score',
    resultLines: 'Lines',
    placeholderResult: 'OCR results will appear here',
    noscriptTitle: 'Glass OCR',
    noscriptStrong: 'Privacy-first browser-based OCR tool.',
    noscriptBody:
      'Images never leave your browser. Text extraction runs locally using PP-OCRv5 mobile ONNX with WebGPU and WASM backends.',
    noscriptWarning:
      '⚠️ This tool requires JavaScript to run OCR inference. Please enable JavaScript in your browser and refresh the page.',
    langSwitch: 'Language',
    // main.js runtime texts
    waitingForImage: 'Waiting for image',
    imageReady: 'Image ready',
    creatingPaddleOcr: 'Creating PaddleOCR.js instance',
    initializingOnnx: 'Initializing ONNX Runtime',
    runningOcr: 'Running text detection & recognition',
    noTextDetected: 'No text detected',
    completedPattern: 'Done · Full image · {0} / {1}',
    ocrFailed: 'OCR failed, please retry',
    ocrFailedWithReason: 'OCR failed: {0}',
    fileProtocolWarning:
      'This page was opened via file://. PaddleOCR.js, ONNX Runtime and model tar need to be served over HTTP. Please use npm run dev or Cloudflare Pages instead.',
    openViaHttp: 'Please open via HTTP',
    copied: 'Copied to clipboard',
    copyFailed: 'Copy failed, please copy manually',
    imageLoadFailed: 'Image load failed, try another image',
    backendSwitched: 'Backend switched, will reinitialize on next recognition',
    webgpuReady: 'WebGPU ready',
    wasmFallback: 'WASM fallback',
  },
};

function detectLang() {
  const saved = localStorage.getItem('glass-ocr-lang');
  if (saved && DICT[saved]) return saved;
  const nav = navigator.language || navigator.userLanguage;
  if (nav && nav.toLowerCase().startsWith('zh')) return 'zh';
  return 'en';
}

let currentLang = detectLang();
const listeners = new Set();

export function t(key, ...args) {
  let text = DICT[currentLang]?.[key] ?? DICT.en?.[key] ?? key;
  if (args.length) {
    text = text.replace(/{(\d+)}/g, (_, i) => args[i] ?? `{${i}}`);
  }
  return text;
}

export function getLocale() {
  return currentLang;
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function updateI18nElements() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;
    const translated = t(key);
    if (el.tagName === 'TEXTAREA' && el.hasAttribute('data-i18n-placeholder')) {
      el.placeholder = translated;
    } else if (el.hasAttribute('data-i18n-html')) {
      el.innerHTML = translated.replace(/\n/g, '<br>');
    } else {
      el.textContent = translated;
    }
  });
}

export function setLocale(lang) {
  if (!DICT[lang] || currentLang === lang) return;
  currentLang = lang;
  localStorage.setItem('glass-ocr-lang', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  updateI18nElements();
  emit();
}

export function initI18n() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  updateI18nElements();
}
