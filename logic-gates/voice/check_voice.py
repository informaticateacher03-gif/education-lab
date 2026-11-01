#!/usr/bin/env python3
"""Проверка озвучки в готовом MP4 (вызывается из verify.js).

1. Извлекает звук из MP4 и распознаёт речь в окне каждой реплики (Whisper small через sherpa-onnx).
2. Сравнивает распознанное со сценарием.
3. По стемам из build/ считает перевес голоса над музыкой и тишину голосовой дорожки вне реплик.
Печатает JSON.
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
from make_voice import Judge, norm  # noqa: E402

import difflib  # noqa: E402


def load_timing():
    src = open(os.path.join(ROOT, "src", "voice-timing.js"), encoding="utf-8").read()
    return json.loads(src.split("=", 1)[1].strip().rstrip(";"))


def stem(name):
    with wave.open(os.path.join(ROOT, "build", name)) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32768
        return a.reshape(-1, w.getnchannels()).mean(1), w.getframerate()


def main():
    mp4 = sys.argv[1]
    vt = load_timing()
    script = {p["id"]: p for p in json.load(open(os.path.join(HERE, "script.json"), encoding="utf-8"))["phrases"]}
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", mp4, "-vn", "-ac", "1", "-ar", "48000", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, np.float32)
    judge = Judge()
    res = {"phrases": []}
    # распознаём каждое предложение отдельно (окна субтитров): на длинных окнах
    # Whisper иногда «перескакивает» на английский и искажает оценку
    vj = json.load(open(os.path.join(ROOT, "build", "voice", "voice.json"), encoding="utf-8"))
    sentences = [(ph["id"], (s["sub"], s["tts"])) for ph in vj["phrases"] for s in ph["sentences"]]
    for p in vt["phrases"]:
        subs = [s for s in vt["subs"] if p["start"] - 0.01 <= s["start"] <= p["start"] + p["dur"]]
        heard_all, targets = [], []
        for sub in subs:
            tts = next(t for pid, (sb, t) in sentences if pid == p["id"] and sb == sub["text"])
            i0 = int((sub["start"] - 0.1) * 48000)
            i1 = int((min(sub["end"], p["start"] + p["dur"]) + 0.15) * 48000)
            heard = judge.hear(audio[max(0, i0):i1])
            heard_all.append(heard)
            targets.append(tts)
        # сравниваем склеенный текст реплики: у коротких предложений одна буква сильно меняет оценку
        score = difflib.SequenceMatcher(None, norm(" ".join(heard_all)), norm(" ".join(targets))).ratio()
        res["phrases"].append({"id": p["id"], "heard": " / ".join(heard_all), "score": score})

    v, sr = stem("stem_voice.wav")
    m, _ = stem("stem_music.wav")
    mask = np.zeros(len(v), bool)
    for p in vt["phrases"]:
        mask[int(p["start"] * sr): int((p["start"] + p["dur"]) * sr)] = True
    rms = lambda x: np.sqrt(np.mean(x ** 2)) + 1e-12
    res["voice_over_music_db"] = float(20 * np.log10(rms(v[mask]) / rms(m[mask])))
    outside = ~mask
    for p in vt["phrases"]:  # поля по краям реплик
        outside[max(0, int((p["start"] - 0.3) * sr)): int((p["start"] + p["dur"] + 0.4) * sr)] = False
    res["silence_ok"] = bool(20 * np.log10(rms(v[outside])) < -50)
    print(json.dumps(res, ensure_ascii=False))


if __name__ == "__main__":
    main()
