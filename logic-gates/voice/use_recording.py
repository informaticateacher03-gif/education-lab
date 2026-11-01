#!/usr/bin/env python3
"""Озвучка из записи голоса автора (вместо синтеза).

  python3 voice/use_recording.py <запись.mov|m4a|wav>   # извлечь звук в build/author/raw.wav и нарезать
  python3 voice/use_recording.py                        # нарезать уже извлечённый build/author/raw.wav

Нарезка — по разметке voice/author_cuts.json. Каждая реплика вырезается целиком
(с естественными паузами между предложениями), чистится от шума и гула,
сохраняется в build/voice/<id>.wav; затем пересчитывается таймлайн (src/voice-timing.js)
и огибающая громкости голоса для анимации аватара (src/voice-env.js).
"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from make_voice import OUT, SR, make_timing  # noqa: E402

FADE = 0.012
PAD = 0.06


def load(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def clean(x):
    """Шумоподавление, срез гула и низа, мягкий де-эссер — через ffmpeg."""
    p = subprocess.run(["ffmpeg", "-loglevel", "error", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-af", "highpass=f=80,afftdn=nr=12:nf=-45,deesser=i=0.3",
                        "-f", "f64le", "-"], input=x.tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float64)


def main():
    raw_path = os.path.join(ROOT, "build", "author", "raw.wav")
    if len(sys.argv) > 1:
        os.makedirs(os.path.dirname(raw_path), exist_ok=True)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", sys.argv[1], "-vn", "-ac", "1", "-ar", str(SR), raw_path],
                       check=True)
    cuts = json.load(open(os.path.join(HERE, "author_cuts.json"), encoding="utf-8"))
    audio = clean(load(raw_path))
    peak = np.max(np.abs(audio)) or 1
    audio = audio / peak * 0.95
    os.makedirs(OUT, exist_ok=True)
    meta = {"engine": "Голос автора (запись)", "sr": SR, "phrases": []}
    for ph in cuts["phrases"]:
        s0 = ph["sentences"][0]["from"] - PAD
        s1 = ph["sentences"][-1]["to"] + PAD
        clip = audio[int(s0 * SR): int(s1 * SR)].copy()
        f = int(FADE * SR)
        clip[:f] *= np.linspace(0, 1, f)
        clip[-f:] *= np.linspace(1, 0, f)
        path = os.path.join(OUT, ph["id"] + ".wav")
        with wave.open(path, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(clip, -1, 1) * 32767).astype("<i2").tobytes())
        sents = [{"sub": s["sub"], "tts": s["say"], "start": round(s["from"] - s0, 3), "end": round(s["to"] - s0, 3)}
                 for s in ph["sentences"]]
        meta["phrases"].append({"id": ph["id"], "segment": ph["segment"], "file": path,
                                "duration": round(len(clip) / SR, 3), "sentences": sents})
        print(f"  {ph['id']:6s} {len(clip) / SR:5.2f} c")
    json.dump(meta, open(os.path.join(OUT, "voice.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("✔ озвучка из записи →", OUT)
    make_timing(meta)


if __name__ == "__main__":
    main()
