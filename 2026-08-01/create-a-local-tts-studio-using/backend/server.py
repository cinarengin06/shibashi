from __future__ import annotations
import json, os, re, shutil, subprocess, threading, time, urllib.request, uuid
from pathlib import Path
from fastapi import FastAPI, HTTPException, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT / "backend" / "models"
VOICE_DIR = ROOT / "voices"
REFERENCE_DIR = ROOT / "voice-references"
MODEL = MODEL_DIR / "kokoro-v1.0.int8.onnx"
VOICES = MODEL_DIR / "voices-v1.0.bin"
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx"
VOICES_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"
MODEL_DIR.mkdir(parents=True, exist_ok=True); VOICE_DIR.mkdir(exist_ok=True); REFERENCE_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Kokoro Studio Local API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], allow_methods=["*"], allow_headers=["*"])
app.mount("/voices-files", StaticFiles(directory=VOICE_DIR), name="voices")
engine = None
xtts_engine = None
clone_lock = threading.Lock()

class GenerateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    voice: str = "af_heart"
    voice_label: str = "Heart"
    speed: float = Field(default=1.0, ge=.5, le=2.0)
    language: str = "tr"

class DesignRequest(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    prompt: str = Field(min_length=3, max_length=5000)

def download(url: str, path: Path):
    if not path.exists():
        tmp = path.with_suffix(path.suffix + ".part")
        urllib.request.urlretrieve(url, tmp)
        tmp.replace(path)

def get_engine():
    global engine
    if engine is None:
        from kokoro_onnx import Kokoro
        download(MODEL_URL, MODEL); download(VOICES_URL, VOICES)
        engine = Kokoro(str(MODEL), str(VOICES))
    return engine

def get_xtts_engine():
    global xtts_engine
    if xtts_engine is None:
        import torch
        from TTS.api import TTS
        device = "mps" if torch.backends.mps.is_available() else "cpu"
        xtts_engine = TTS("tts_models/multilingual/multi-dataset/xtts_v2", progress_bar=False).to(device)
    return xtts_engine

def warm_xtts():
    if any(REFERENCE_DIR.glob("*.wav")):
        try:
            with clone_lock: get_xtts_engine()
        except Exception as exc:
            print(f"XTTS warmup failed: {exc}", flush=True)

@app.on_event("startup")
def startup_warmup():
    threading.Thread(target=warm_xtts, daemon=True).start()

def safe_name(text: str):
    value = re.sub(r"[^\wçğıöşüÇĞİÖŞÜ-]+", "-", text[:48], flags=re.UNICODE).strip("-").lower()
    return value or "voice"

def character_profile(slug: str):
    path = REFERENCE_DIR / f"{slug}.json"
    if not path.exists(): return {}
    try: return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError): return {}

def rewrite_for_character(text: str, prompt: str):
    instruction = f"""Aşağıdaki KARAKTER SİSTEM PROMPTUNU eksiksiz uygula.
Kullanıcının metninin anlamını ve gerekli bilgisini koru.
Uzatılmış kelimeleri (örnek: bekleee, hayııır) ASLA düzeltme veya kısaltma.
Üç nokta ve diğer dramatik duraklamaları ASLA kaldırma.
Çıktı yalnızca seslendirilecek doğal Türkçe metin olsun.
Açıklama, analiz, başlık, tırnak veya markdown ekleme.

KARAKTER SİSTEM PROMPTU:
{prompt}

KULLANICI METNİ:
{text}

SESLENDİRİLECEK METİN:"""
    payload = json.dumps({"model": "qwen3:1.7b", "prompt": instruction, "stream": False, "think": False, "options": {"temperature": .35, "num_predict": 700}}).encode()
    request = urllib.request.Request("http://127.0.0.1:11434/api/generate", data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            rewritten = json.loads(response.read())["response"].strip()
        return rewritten or text
    except Exception as exc:
        raise RuntimeError(f"Karakter modeli hazır değil: {exc}. Ollama ve qwen3:1.7b modelini başlatın.")

def expressive_delivery(text: str):
    # Most local engines treat a Unicode ellipsis followed by a sentence break
    # as a noticeably longer pause while retaining repeated vowels for emphasis.
    return re.sub(r"\s*\.{3,}\s*", "…  ", text.strip())

@app.get("/custom-voices")
def custom_voices():
    result = []
    for path in sorted(REFERENCE_DIR.glob("*.wav")):
        profile = character_profile(path.stem)
        result.append({"id": f"clone:{path.stem}", "name": profile.get("name", path.stem.replace("-", " ").title()), "note": profile.get("note", "Klonlanmış Türkçe ses"), "accent": "Türkçe · Karakter" if profile.get("prompt") else "Türkçe · Özel"})
    return result

@app.post("/custom-voices")
async def add_custom_voice(name: str = Form(...), authorized: bool = Form(...), audio: UploadFile = File(...)):
    if not authorized: raise HTTPException(400, "Bu sesi kullanma izninizi onaylamalısınız.")
    if not audio.content_type or not audio.content_type.startswith("audio/"): raise HTTPException(400, "WAV, MP3 veya M4A ses dosyası yükleyin.")
    slug = safe_name(name)[:40]
    source = REFERENCE_DIR / f".{slug}-{uuid.uuid4().hex[:6]}"
    target = REFERENCE_DIR / f"{slug}.wav"
    source.write_bytes(await audio.read())
    try:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(source), "-ac", "1", "-ar", "24000", str(target)], check=True)
    finally: source.unlink(missing_ok=True)
    return {"id": f"clone:{slug}", "name": name.strip(), "note": "Klonlanmış Türkçe ses", "accent": "Türkçe · Özel"}

@app.post("/design-voice")
def design_voice(body: DesignRequest):
    prompt = body.prompt.casefold()
    female = not any(word in prompt for word in ["erkek", "male", "maskülen", "maskulen", "lü dongbin", "lu dongbin", "tai chi master", "usta"])
    if female:
        choices = [("af_heart", .5), ("af_bella", .3), ("af_sky", .2)]
        if any(word in prompt for word in ["derin", "ciddi", "güçlü", "guclu"]): choices = [("af_bella", .55), ("af_nicole", .3), ("af_heart", .15)]
    else:
        choices = [("am_michael", .5), ("am_liam", .3), ("am_adam", .2)]
        if any(word in prompt for word in ["enerjik", "neşeli", "neseli", "olumlu"]): choices = [("am_liam", .5), ("am_puck", .3), ("am_michael", .2)]
    if any(word in prompt for word in ["yumuşak", "yumusak", "sakin", "nazik", "soft", "peaceful", "slowly"]):
        choices = [(choices[0][0], .65), (choices[-1][0], .35)]
    kokoro = get_engine()
    style = sum((kokoro.get_voice_style(name) * weight for name, weight in choices))
    sample = "Hello. I am a warm, positive and natural voice, created especially for thoughtful storytelling."
    samples, sample_rate = kokoro.create(sample, voice=style, speed=.93, lang="en-us")
    slug = safe_name(body.name)[:40]
    target = REFERENCE_DIR / f"{slug}.wav"
    import soundfile as sf
    sf.write(target, samples, sample_rate)
    (REFERENCE_DIR / f"{slug}.json").write_text(json.dumps({"name": body.name.strip(), "note": body.prompt.strip()[:100], "prompt": body.prompt.strip()}, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"id": f"clone:{slug}", "name": body.name.strip(), "note": body.prompt.strip()[:70], "accent": "Türkçe · Tasarlanmış"}

@app.get("/health")
def health(): return {"ok": True, "model": MODEL.exists(), "clone_ready": xtts_engine is not None, "output": str(VOICE_DIR)}

@app.get("/voices")
def list_voices():
    result = []
    for path in sorted(VOICE_DIR.glob("*.mp3"), key=lambda p: p.stat().st_mtime, reverse=True):
        stat = path.stat()
        result.append({"id": path.stem, "title": path.stem.rsplit("-", 1)[0].replace("-", " ").title(), "voice": "Kokoro", "duration": "MP3", "size": f"{stat.st_size/1024:.0f} KB", "created": time.strftime("%d %b", time.localtime(stat.st_mtime)), "url": f"/voices-files/{path.name}?v={int(stat.st_mtime)}", "status": "ready"})
    return result

@app.post("/generate")
def generate(body: GenerateRequest):
    if not shutil.which("ffmpeg"): raise HTTPException(503, "ffmpeg is required. Install it with: brew install ffmpeg")
    try:
        spoken_text = body.text
        stem = f"{safe_name(body.text)}-{uuid.uuid4().hex[:6]}"
        wav = VOICE_DIR / f".{stem}.wav"; mp3 = VOICE_DIR / f"{stem}.mp3"
        if body.voice.startswith("clone:"):
            slug = body.voice.split(':', 1)[1]
            reference = REFERENCE_DIR / f"{slug}.wav"
            if not reference.exists(): raise ValueError("Referans ses bulunamadı")
            profile = character_profile(slug)
            if profile.get("prompt"): spoken_text = rewrite_for_character(body.text, profile["prompt"])
            delivery_text = expressive_delivery(spoken_text)
            with clone_lock:
                os.environ["COQUI_TOS_AGREED"] = "1"
                get_xtts_engine().tts_to_file(text=delivery_text, speaker_wav=str(reference), language="tr", file_path=str(wav))
            import soundfile as sf
            samples, sample_rate = sf.read(wav)
        elif body.voice.startswith("tr_"):
            delivery_text = expressive_delivery(spoken_text)
            piper = Path(os.sys.executable).parent / "piper"
            if not (MODEL_DIR / f"{body.voice}.onnx").exists():
                subprocess.run([
                    os.sys.executable, "-m", "piper.download_voices", body.voice,
                    "--download-dir", str(MODEL_DIR)
                ], check=True)
            subprocess.run([
                str(piper), "--model", body.voice, "--data-dir", str(MODEL_DIR),
                "--output_file", str(wav),
                "--length-scale", str(1 / body.speed)
            ], input=delivery_text, text=True, check=True)
            import soundfile as sf
            samples, sample_rate = sf.read(wav)
        else:
            delivery_text = expressive_delivery(spoken_text)
            samples, sample_rate = get_engine().create(delivery_text, voice=body.voice, speed=body.speed, lang="en-us")
            import soundfile as sf
            sf.write(wav, samples, sample_rate)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-q:a", "2", str(mp3)], check=True)
        wav.unlink(missing_ok=True)
        seconds = len(samples) / sample_rate
        return {"id": stem, "title": body.text.strip()[:42], "spoken_text": spoken_text, "voice": body.voice_label, "duration": f"{int(seconds)//60}:{int(seconds)%60:02d}", "size": f"{mp3.stat().st_size/1024:.0f} KB", "created": "Now", "url": f"/voices-files/{mp3.name}"}
    except Exception as exc: raise HTTPException(500, str(exc))
