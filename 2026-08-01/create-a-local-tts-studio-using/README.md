# Kokoro Studio

A private, local text-to-speech studio built with Next.js and Kokoro 82M (ONNX).

## Start

Install the two native audio tools once:

```bash
brew install ffmpeg
brew install python@3.12
```

Then run:

```bash
chmod +x start.sh
./start.sh
```

Kokoro ONNX includes its own matched eSpeak-NG runtime for Turkish phonemes.

Open http://localhost:3000. The Kokoro model is downloaded on the first generation and cached under `backend/models/`. Finished MP3 files are saved in `voices/`.

You can upload one `.txt` file to fill the editor or select several files for sequential batch generation. Turkish input uses eSpeak-NG Turkish phonemes; Kokoro 82M does not include a native Turkish-trained voice, so pronunciation is experimental.

Use **Kendi sesini ekle** to upload a clean 10–30 second reference recording for local Turkish XTTS-v2 cloning. Only upload your own voice or a voice you have explicit permission to use. XTTS-v2 model weights are licensed for non-commercial use.
