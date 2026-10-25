import sys
import torch
from TTS.api import TTS

text, reference, output = sys.argv[1:4]
device = "mps" if torch.backends.mps.is_available() else "cpu"
model = TTS("tts_models/multilingual/multi-dataset/xtts_v2", progress_bar=False).to(device)
model.tts_to_file(text=text, speaker_wav=reference, language="tr", file_path=output)
