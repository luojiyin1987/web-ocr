#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

node scripts/prepare-assets.mjs
test -f public/vendor/paddleocr/PP-OCRv5_mobile_det_onnx.tar
test -f public/vendor/paddleocr/PP-OCRv5_mobile_rec_onnx.tar
test -f public/vendor/onnxruntime/ort-wasm-simd-threaded.mjs
test -f public/vendor/onnxruntime/ort-wasm-simd-threaded.wasm

echo "prepare-assets smoke OK"
