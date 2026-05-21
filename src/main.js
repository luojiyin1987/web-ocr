import './style.css';

const PADDLE_MODEL_ASSETS = {
  det: {
    name: 'PP-OCRv5_mobile_det',
    url: '/vendor/paddleocr/PP-OCRv5_mobile_det_onnx.tar',
  },
  rec: {
    name: 'PP-OCRv5_mobile_rec',
    url: '/vendor/paddleocr/PP-OCRv5_mobile_rec_onnx.tar',
  },
};

const elements = {
  engineStatus: document.querySelector('#engine-status'),
  backendStatus: document.querySelector('#backend-status'),
  providerStatus: document.querySelector('#provider-status'),
  dropzone: document.querySelector('#dropzone'),
  imageInput: document.querySelector('#image-input'),
  backendSelect: document.querySelector('#backend-select'),
  showBoxesToggle: document.querySelector('#show-boxes-toggle'),
  runOcrButton: document.querySelector('#run-ocr-button'),
  clearImageButton: document.querySelector('#clear-image-button'),
  copyTextButton: document.querySelector('#copy-text-button'),
  downloadTextButton: document.querySelector('#download-text-button'),
  progressLabel: document.querySelector('#progress-label'),
  progressPercent: document.querySelector('#progress-percent'),
  progressBar: document.querySelector('#progress-bar'),
  progressTrack: document.querySelector('#progress-track'),
  imageMeta: document.querySelector('#image-meta'),
  previewFrame: document.querySelector('#preview-frame'),
  previewImage: document.querySelector('#preview-image'),
  previewPlaceholder: document.querySelector('#preview-placeholder'),
  boxesLayer: document.querySelector('#boxes-layer'),
  resultStats: document.querySelector('#result-stats'),
  resultText: document.querySelector('#result-text'),
};

const state = {
  ocr: null,
  ocrBackend: null,
  imageFile: null,
  imageUrl: null,
  lines: [],
  isRunning: false,
  lastText: '',
  lastAverageScore: null,
  lastDurationMs: null,
  runtimeBlockReason: null,
  initializationSummary: null,
  webgpuAvailable: null,
};

let paddleOcrModulePromise = null;

const resizeObserver =
  typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => {
        renderPolygons();
      })
    : null;

function setProgress(progress, label) {
  const clamped = Math.max(0, Math.min(progress, 1));
  const percent = Math.round(clamped * 100);
  elements.progressBar.style.width = `${percent}%`;
  elements.progressPercent.textContent = `${percent}%`;
  elements.progressLabel.textContent = label;
  if (elements.progressTrack) {
    elements.progressTrack.setAttribute('aria-valuenow', percent);
  }
}

async function probeWebGpu() {
  if (!('gpu' in navigator)) {
    state.webgpuAvailable = false;
    return;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    state.webgpuAvailable = !!adapter;
  } catch {
    state.webgpuAvailable = false;
  }
}

function hasWebGpu() {
  return state.webgpuAvailable ?? ('gpu' in navigator);
}

function formatBackendLabel(backend, webgpuAvailable = hasWebGpu()) {
  const capability = webgpuAvailable ? 'WebGPU ready' : 'WASM fallback';
  return `${backend} · ${capability}`;
}

function updateRuntimeCards(runtime = null) {
  elements.engineStatus.textContent = 'PP-OCRv5 mobile / ONNX';
  elements.backendStatus.textContent = formatBackendLabel(
    elements.backendSelect.value,
    state.initializationSummary?.webgpuAvailable ?? hasWebGpu(),
  );

  if (runtime) {
    elements.providerStatus.textContent = `${runtime.detProvider} / ${runtime.recProvider}`;
    return;
  }

  if (state.initializationSummary) {
    elements.providerStatus.textContent = `${state.initializationSummary.detProvider} / ${state.initializationSummary.recProvider}`;
    return;
  }

  elements.providerStatus.textContent = '未初始化';
}

function updateButtons() {
  const hasImage = Boolean(state.imageFile);
  const hasText = Boolean(state.lastText.trim());
  const blocked = Boolean(state.runtimeBlockReason);

  elements.runOcrButton.disabled = !hasImage || state.isRunning || blocked;
  elements.clearImageButton.disabled = !hasImage || state.isRunning;
  elements.copyTextButton.disabled = !hasText || state.isRunning;
  elements.downloadTextButton.disabled = !hasText || state.isRunning;
}

function updateStats() {
  const duration =
    typeof state.lastDurationMs === 'number' ? `${(state.lastDurationMs / 1000).toFixed(2)}s` : '--';
  const averageScore =
    typeof state.lastAverageScore === 'number' ? `${(state.lastAverageScore * 100).toFixed(1)}%` : '--';
  const lineCount = state.lines.length > 0 ? String(state.lines.length) : '--';

  elements.resultStats.innerHTML = `
    <span>耗时: ${duration}</span>
    <span>平均分: ${averageScore}</span>
    <span>文本行: ${lineCount}</span>
  `;
}

function revokeImageUrl() {
  if (state.imageUrl) {
    URL.revokeObjectURL(state.imageUrl);
    state.imageUrl = null;
  }
}

function clearResultState() {
  state.lines = [];
  state.lastText = '';
  state.lastAverageScore = null;
  state.lastDurationMs = null;
  elements.resultText.value = '';
  renderPolygons();
  updateStats();
  updateButtons();
}

async function disposeOcr() {
  if (!state.ocr) {
    return;
  }

  await state.ocr.dispose();
  state.ocr = null;
  state.ocrBackend = null;
  state.initializationSummary = null;
  updateRuntimeCards();
}

function clearImage() {
  revokeImageUrl();
  state.imageFile = null;
  elements.imageInput.value = '';
  elements.previewImage.removeAttribute('src');
  elements.previewFrame.classList.add('empty');
  elements.previewPlaceholder.hidden = false;
  elements.imageMeta.textContent = '尚未选择图片';
  clearResultState();
  setProgress(0, state.runtimeBlockReason ? '请通过 HTTP 打开页面' : '等待图片');
}

function getPolygonColor(score) {
  if (score >= 0.92) return 'var(--box-strong)';
  if (score >= 0.75) return 'var(--box-mid)';
  return 'var(--box-soft)';
}

function getImageViewportMetrics() {
  const img = elements.previewImage;
  if (!img.complete || img.naturalWidth === 0 || img.clientWidth === 0) {
    return null;
  }

  const frameRect = elements.previewFrame.getBoundingClientRect();
  const imgRect = img.getBoundingClientRect();

  return {
    frameRect,
    imgRect,
    scaleX: imgRect.width / img.naturalWidth,
    scaleY: imgRect.height / img.naturalHeight,
    offsetX: imgRect.left - frameRect.left,
    offsetY: imgRect.top - frameRect.top,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
  };
}

function renderPolygons() {
  elements.boxesLayer.replaceChildren();
  const metrics = getImageViewportMetrics();
  if (!metrics) {
    return;
  }
  elements.boxesLayer.setAttribute('viewBox', `0 0 ${elements.previewFrame.clientWidth} ${elements.previewFrame.clientHeight}`);

  const ns = 'http://www.w3.org/2000/svg';
  const fragment = document.createDocumentFragment();

  if (elements.showBoxesToggle.checked && state.lines.length > 0) {
    state.lines.forEach((item) => {
      if (!Array.isArray(item.poly) || item.poly.length === 0) {
        return;
      }

      const polygon = document.createElementNS(ns, 'polygon');
      const points = item.poly
        .map((point) => `${metrics.offsetX + point.x * metrics.scaleX},${metrics.offsetY + point.y * metrics.scaleY}`)
        .join(' ');
      const color = getPolygonColor(item.score);

      polygon.setAttribute('points', points);
      polygon.setAttribute('class', 'line-polygon');
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('fill', color);
      polygon.setAttribute('fill-opacity', '0.14');

      const title = document.createElementNS(ns, 'title');
      title.textContent = `${item.text} (${(item.score * 100).toFixed(1)}%)`;
      polygon.appendChild(title);
      fragment.appendChild(polygon);
    });
  }

  elements.boxesLayer.appendChild(fragment);
}

function setImage(file) {
  revokeImageUrl();
  state.imageFile = file;
  state.imageUrl = URL.createObjectURL(file);
  elements.previewImage.src = state.imageUrl;
  elements.previewFrame.classList.remove('empty');
  elements.previewPlaceholder.hidden = true;
  elements.imageMeta.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  clearResultState();
  setProgress(0, '图片已就绪');
  updateButtons();
}

function buildOrtOptions() {
  return {
    backend: elements.backendSelect.value,
    numThreads: Math.max(1, Math.min(4, navigator.hardwareConcurrency || 2)),
    simd: true,
    wasmPaths: 'https://unpkg.com/onnxruntime-web@1.26.0/dist/',
  };
}

async function getPaddleOCRClass() {
  if (!paddleOcrModulePromise) {
    paddleOcrModulePromise = import('@paddleocr/paddleocr-js');
  }

  const module = await paddleOcrModulePromise;
  return module.PaddleOCR;
}

async function ensureOcr() {
  const backend = elements.backendSelect.value;

  if (state.ocr && state.ocrBackend === backend) {
    return state.ocr;
  }

  await disposeOcr();

  setProgress(0.08, '创建 PaddleOCR.js 实例');
  const PaddleOCR = await getPaddleOCRClass();
  const instance = await PaddleOCR.create({
    initialize: false,
    textDetectionModelName: PADDLE_MODEL_ASSETS.det.name,
    textDetectionModelAsset: { url: PADDLE_MODEL_ASSETS.det.url },
    textRecognitionModelName: PADDLE_MODEL_ASSETS.rec.name,
    textRecognitionModelAsset: { url: PADDLE_MODEL_ASSETS.rec.url },
    ortOptions: buildOrtOptions(),
  });

  setProgress(0.24, '初始化 ONNX Runtime');
  const summary = await instance.initialize();

  state.ocr = instance;
  state.ocrBackend = backend;
  state.initializationSummary = summary;
  updateRuntimeCards(summary);

  return instance;
}

function extractPlainText(lines) {
  return lines
    .map((item) => item.text.trim())
    .filter(Boolean)
    .join('\n');
}

function averageScore(lines) {
  if (lines.length === 0) {
    return null;
  }

  const sum = lines.reduce((total, item) => total + (item.score || 0), 0);
  return sum / lines.length;
}

async function runOcr() {
  if (!state.imageFile || state.isRunning || state.runtimeBlockReason) {
    if (state.runtimeBlockReason) {
      setProgress(0, state.runtimeBlockReason);
      elements.resultText.value = state.runtimeBlockReason;
    }
    return;
  }

  state.isRunning = true;
  updateButtons();

  try {
    const ocr = await ensureOcr();
    setProgress(0.62, '执行文字检测与识别');

    const [result] = await ocr.predict(state.imageFile, {
      textDetLimitType: 'min',
      textDetLimitSideLen: 1280,
    });

    state.lines = result?.items ?? [];
    state.lastText = extractPlainText(state.lines);
    state.lastAverageScore = averageScore(state.lines);
    state.lastDurationMs = result?.metrics?.totalMs ?? null;

    elements.resultText.value = state.lastText;
    updateRuntimeCards(result?.runtime ?? null);
    renderPolygons();
    updateStats();
    if (!state.lastText.trim()) {
      setProgress(1, '未识别到文字');
      return;
    }
    setProgress(
      1,
      `完成 · 全图 · ${result?.runtime?.detProvider ?? 'unknown'} / ${result?.runtime?.recProvider ?? 'unknown'}`,
    );
  } catch (error) {
    console.error(error);
    setProgress(0, 'OCR 失败，请重试');
    elements.resultText.value = `OCR 失败：${error instanceof Error ? error.message : String(error)}`;
    state.lastText = '';
    state.lines = [];
    state.lastAverageScore = null;
    state.lastDurationMs = null;
    updateStats();
    updateRuntimeCards();
  } finally {
    state.isRunning = false;
    updateButtons();
  }
}

function detectRuntimeBlockers() {
  if (window.location.protocol === 'file:') {
    state.runtimeBlockReason =
      '当前页面是通过 file:// 直接打开的。PaddleOCR.js、ONNX Runtime 和模型 tar 需要通过 HTTP 服务加载，请改用 npm run dev 或 Cloudflare Pages 访问。';
    elements.resultText.value = state.runtimeBlockReason;
    setProgress(0, '请通过 HTTP 打开页面');
  }
}

async function copyResult() {
  if (!state.lastText.trim()) return;
  try {
    await navigator.clipboard.writeText(state.lastText);
    setProgress(1, '已复制到剪贴板');
  } catch {
    setProgress(1, '复制失败，请手动复制');
  }
}

function downloadResult() {
  if (!state.lastText.trim()) return;

  const blob = new Blob([state.lastText], { type: 'text/plain;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const baseName = state.imageFile?.name?.replace(/\.[^.]+$/, '') ?? 'ocr-result';
  anchor.href = href;
  anchor.download = `${baseName}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function handleFiles(fileList) {
  const [file] = [...fileList].filter((item) => item.type.startsWith('image/'));
  if (!file) {
    return;
  }

  setImage(file);
}

function setupDragAndDrop() {
  ['dragenter', 'dragover'].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropzone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropzone.classList.remove('drag-active');
    });
  });

  elements.dropzone.addEventListener('drop', (event) => {
    if (event.dataTransfer?.files?.length) {
      handleFiles(event.dataTransfer.files);
    }
  });
}

function setupEvents() {
  elements.imageInput.addEventListener('change', (event) => {
    handleFiles(event.target.files ?? []);
  });

  elements.runOcrButton.addEventListener('click', runOcr);
  elements.clearImageButton.addEventListener('click', clearImage);
  elements.copyTextButton.addEventListener('click', copyResult);
  elements.downloadTextButton.addEventListener('click', downloadResult);
  elements.showBoxesToggle.addEventListener('change', renderPolygons);
  elements.previewImage.addEventListener('load', renderPolygons);
  elements.previewImage.addEventListener('error', () => {
    clearImage();
    setProgress(0, '图片加载失败，请尝试其他图片');
  });
  elements.backendSelect.addEventListener('change', async () => {
    await disposeOcr();
    clearResultState();
    setProgress(0, '后端已切换，下一次识别会重新初始化');
    updateRuntimeCards();
  });

  window.addEventListener('beforeunload', () => {
    if (state.ocr) {
      state.ocr.dispose().catch(() => {});
    }
  });

  if (resizeObserver) {
    resizeObserver.observe(elements.previewFrame);
  } else {
    window.addEventListener('resize', renderPolygons);
  }

  setupDragAndDrop();
}

detectRuntimeBlockers();
setupEvents();
updateRuntimeCards();
updateStats();
updateButtons();
if (!state.runtimeBlockReason) {
  setProgress(0, '等待图片');
}

probeWebGpu().then(() => {
  updateRuntimeCards();
});
