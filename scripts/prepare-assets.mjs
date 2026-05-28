#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const checkOnly = process.argv.includes('--check');

const jobs = [
  {
    type: 'download',
    url: 'https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_det_onnx.tar',
    to: 'public/vendor/paddleocr/PP-OCRv5_mobile_det_onnx.tar',
  },
  {
    type: 'download',
    url: 'https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv5_mobile_rec_onnx.tar',
    to: 'public/vendor/paddleocr/PP-OCRv5_mobile_rec_onnx.tar',
  },
  {
    type: 'copy',
    from: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs',
    to: 'public/vendor/onnxruntime/ort-wasm-simd-threaded.mjs',
  },
  {
    type: 'copy',
    from: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',
    to: 'public/vendor/onnxruntime/ort-wasm-simd-threaded.wasm',
  },
];

const stalePaths = [
  'public/vendor/onnxruntime/ort-wasm-simd-threaded.jsep.mjs',
  'public/vendor/onnxruntime/ort-wasm-simd-threaded.jsep.wasm',
];

function absolute(path) {
  return resolve(rootDir, path);
}

async function downloadIfNeeded(url, targetPath) {
  if (existsSync(targetPath) && statSync(targetPath).size > 0) {
    console.log(`[skip] ${targetPath}`);
    return;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  writeFileSync(targetPath, bytes);
  console.log(`[download] ${url} -> ${targetPath}`);
}

function copyIfNeeded(sourcePath, targetPath) {
  if (!existsSync(sourcePath)) {
    throw new Error(`Missing source asset: ${sourcePath}`);
  }

  if (existsSync(targetPath) && statSync(targetPath).size === statSync(sourcePath).size) {
    console.log(`[skip] ${targetPath}`);
    return;
  }

  copyFileSync(sourcePath, targetPath);
  console.log(`[copy] ${sourcePath} -> ${targetPath}`);
}

for (const job of jobs) {
  const toPath = absolute(job.to);
  mkdirSync(dirname(toPath), { recursive: true });

  if (job.type === 'download') {
    if (checkOnly) {
      console.log(`[check] remote ${job.url} -> ${job.to}`);
      continue;
    }

    await downloadIfNeeded(job.url, toPath);
    continue;
  }

  if (job.type === 'copy') {
    const fromPath = absolute(job.from);

    if (checkOnly) {
      console.log(`[check] local ${job.from} -> ${job.to}`);
      continue;
    }

    copyIfNeeded(fromPath, toPath);
    continue;
  }

  throw new Error(`Unsupported job type: ${job.type}`);
}

for (const stalePath of stalePaths) {
  const absolutePath = absolute(stalePath);
  if (existsSync(absolutePath)) {
    rmSync(absolutePath);
    console.log(`[remove] ${absolutePath}`);
  }
}
