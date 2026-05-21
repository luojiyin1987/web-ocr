#!/usr/bin/env node

import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
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

  throw new Error(`Unsupported job type: ${job.type}`);
}
