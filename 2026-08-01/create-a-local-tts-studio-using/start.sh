#!/bin/zsh
set -e
cd "${0:A:h}"
if ! command -v ffmpeg >/dev/null; then
  echo "ffmpeg is required. Install it with: brew install ffmpeg"
  exit 1
fi
# kokoro-onnx includes a matched eSpeak-NG runtime and language data.
# A system eSpeak library may be an incompatible version.
unset KOKORO_ESPEAK_LIBRARY
if command -v python3.12 >/dev/null; then
  KOKORO_PYTHON="$(command -v python3.12)"
elif command -v python3.11 >/dev/null; then
  KOKORO_PYTHON="$(command -v python3.11)"
else
  echo "Python 3.11 or 3.12 is required. Install it with: brew install python@3.12"
  exit 1
fi
"$KOKORO_PYTHON" -m venv .venv-kokoro
source .venv-kokoro/bin/activate
python -m pip -q install --upgrade pip setuptools wheel
python -m pip -q install --no-compile -r backend/requirements.txt
if command -v ollama >/dev/null; then
  if ! curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    OLLAMA_FLASH_ATTENTION=1 OLLAMA_KV_CACHE_TYPE=q8_0 ollama serve >/dev/null 2>&1 &
    sleep 2
  fi
  ollama list | grep -q "qwen3:1.7b" || ollama pull qwen3:1.7b
else
  echo "Karakter promptları için Ollama gerekli: brew install ollama"
fi
trap 'kill 0' EXIT
uvicorn backend.server:app --host 127.0.0.1 --port 8787 &
npm run dev
