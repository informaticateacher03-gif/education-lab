#!/usr/bin/env python3
"""Синтез дикторской озвучки по voice/script.json.

Движки:
  piper       — локальный нейросетевой голос Piper/VITS ru_RU-irina-medium (женский), по умолчанию;
  elevenlabs  — облачный, если задан ELEVENLABS_API_KEY (и доступен api.elevenlabs.io).

Каждое предложение синтезируется отдельно и склеивается с короткой паузой.
Результат: build/voice/<id>.wav (48 кГц, моно) + build/voice/voice.json
с длительностями фраз и границами предложений (для таймлайна и субтитров).

  python3 voice/make_voice.py [--engine piper|elevenlabs] [--model путь.onnx] [--speed 0.92]
"""
import argparse
import json
import os
import subprocess
import sys
import urllib.request
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "build", "voice")
SR = 48000
PAUSE = 0.24  # пауза между предложениями, с
DEFAULT_MODEL = os.environ.get(
    "PIPER_MODEL", "/opt/tts/vits-piper-ru_RU-irina-medium/ru_RU-irina-medium.onnx")


def to48k(raw_bytes, fmt_args):
    """Любой звук → float32 48 кГц моно через ffmpeg."""
    p = subprocess.run(["ffmpeg", "-loglevel", "error", *fmt_args, "-i", "-", "-ac", "1", "-ar", str(SR),
                        "-f", "f32le", "-"], input=raw_bytes, capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).copy()


def trim(a, thr=0.012):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx):
        return a
    pad = int(0.03 * SR)
    return a[max(0, idx[0] - pad): idx[-1] + pad]


class Piper:
    def __init__(self, model, speed):
        from piper import PiperVoice, SynthesisConfig
        self.v = PiperVoice.load(model)
        # length_scale < 1 — чуть быстрее; noise — живость интонации
        self.cfg = SynthesisConfig(length_scale=speed, noise_scale=0.7, noise_w_scale=0.85)
        self.name = "Piper VITS · " + os.path.basename(model)

    def say(self, text):
        import io
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            self.v.synthesize_wav(text, w, syn_config=self.cfg)
        return to48k(buf.getvalue(), ["-f", "wav"])


class ElevenLabs:
    """Не проверялся в этой среде: ключа и доступа к api.elevenlabs.io не было."""

    def __init__(self, voice_id, speed):
        self.key = os.environ["ELEVENLABS_API_KEY"]
        self.voice = voice_id
        self.speed = speed
        self.name = f"ElevenLabs · {voice_id}"

    def say(self, text):
        body = json.dumps({
            "text": text, "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True},
        }).encode()
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice}?output_format=mp3_44100_128",
            data=body, headers={"xi-api-key": self.key, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=60) as r:
            return to48k(r.read(), ["-f", "mp3"])


ASR_DIR = os.environ.get("ASR_MODEL_DIR", "/opt/tts/sherpa-onnx-whisper-small")
LATIN = {"and": "энд", "or": "ор", "not": "нот", "nand": "нэнд", "nor": "нор", "xor": "эксор", "xnor": "экснор"}


def norm(t):
    import re
    t = t.lower().replace("ё", "е").replace("-", " ")
    t = re.sub(r"[^a-zа-я0-9 ]+", " ", t)
    # Whisper иногда пишет «ноль/единицу» цифрами
    t = re.sub(r"\b0\b", "ноль", t)
    t = re.sub(r"\b1\b", "единицу", t)
    words = [LATIN.get(w, w) for w in t.split()]
    return " ".join(words).replace("экс ор", "эксор").replace("экс нор", "экснор")


class Judge:
    """Оценка дубля: распознаём его Whisper (sherpa-onnx) и сравниваем с текстом."""

    def __init__(self):
        import sherpa_onnx
        d = ASR_DIR.rstrip("/") + "/"
        self.rec = sherpa_onnx.OfflineRecognizer.from_whisper(
            encoder=d + "small-encoder.int8.onnx", decoder=d + "small-decoder.int8.onnx",
            tokens=d + "small-tokens.txt", language="ru", task="transcribe", num_threads=4)

    def hear(self, a48):
        a16 = a48[::3].astype(np.float32)  # 48 → 16 кГц (речь уже ограничена по полосе)
        s = self.rec.create_stream()
        s.accept_waveform(16000, a16)
        self.rec.decode_stream(s)
        return s.result.text.strip()

    def score(self, a48, target):
        import difflib
        heard = self.hear(a48)
        return difflib.SequenceMatcher(None, norm(heard), norm(target)).ratio(), heard


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", default="elevenlabs" if os.environ.get("ELEVENLABS_API_KEY") else "piper")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--voice-id", default=os.environ.get("ELEVENLABS_VOICE_ID", ""))
    ap.add_argument("--speed", type=float, default=0.9)
    ap.add_argument("--takes", type=int, default=8, help="дублей на предложение (Piper); лучший выбирается по ASR")
    ap.add_argument("--timing-only", action="store_true", help="только пересчитать таймлайн по готовому voice.json")
    a = ap.parse_args()
    if a.timing_only:
        make_timing(json.load(open(os.path.join(OUT, "voice.json"), encoding="utf-8")))
        return

    if a.engine == "elevenlabs":
        if not a.voice_id:
            sys.exit("Укажите --voice-id или ELEVENLABS_VOICE_ID (русскоязычный женский голос из библиотеки ElevenLabs).")
        eng = ElevenLabs(a.voice_id, a.speed)
        tts_key = "sub"  # ElevenLabs читает латиницу сам
    else:
        if not os.path.exists(a.model):
            sys.exit(f"Нет модели {a.model}. См. README: раздел «Озвучка».")
        eng = Piper(a.model, a.speed)
        tts_key = "tts"

    judge = None
    if a.engine == "piper" and a.takes > 1 and os.path.isdir(ASR_DIR):
        judge = Judge()

    script = json.load(open(os.path.join(ROOT, "voice", "script.json"), encoding="utf-8"))
    os.makedirs(OUT, exist_ok=True)
    meta = {"engine": eng.name, "sr": SR, "phrases": []}
    for ph in script["phrases"]:
        parts, sents, t = [], [], 0.0
        for i, s in enumerate(ph[tts_key]):
            best = None
            for k in range(a.takes if judge else 1):
                cand = trim(eng.say(s))
                if not judge:
                    best = (1.0, "", cand)
                    break
                sc, heard = judge.score(cand, s)
                if best is None or sc > best[0]:
                    best = (sc, heard, cand)
            audio = best[2]
            if judge:
                print(f"    {best[0]:.2f}  «{best[1]}»")
            if i:
                parts.append(np.zeros(int(PAUSE * SR), np.float32))
                t += PAUSE
            d = len(audio) / SR
            sents.append({"sub": ph["sub"][i], "tts": s, "asr": best[1], "asr_score": round(best[0], 3), "start": round(t, 3), "end": round(t + d, 3)})
            parts.append(audio)
            t += d
        a_all = np.concatenate(parts)
        path = os.path.join(OUT, ph["id"] + ".wav")
        with wave.open(path, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(a_all, -1, 1) * 32767).astype("<i2").tobytes())
        meta["phrases"].append({"id": ph["id"], "segment": ph["segment"], "file": path,
                                "duration": round(len(a_all) / SR, 3), "sentences": sents})
        print(f"  {ph['id']:6s} {len(a_all) / SR:5.2f} c")
    json.dump(meta, open(os.path.join(OUT, "voice.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("✔ озвучка:", eng.name, "→", OUT)
    make_timing(meta)


def make_timing(meta):
    """Таймлайн ролика под длительности фраз → src/voice-timing.js (читается video.js)."""
    ph = {p["id"]: p for p in meta["phrases"]}
    r = lambda x: round(x + 1e-9, 2)
    place, segs, subs = [], [], []

    def put(pid, t):
        p = ph[pid]
        place.append({"id": pid, "start": r(t), "dur": p["duration"], "file": os.path.relpath(p["file"], ROOT)})
        for s in p["sentences"]:
            subs.append({"start": r(t + s["start"]), "end": r(t + s["end"]), "text": s["sub"], "seg": p["segment"]})
        return t + p["duration"]

    t = put("intro", 0.6)
    t = put("look", t + 0.35)
    end = max(4.0, r(t + 0.4))
    segs.append({"type": "intro", "start": 0, "end": end})
    for gid in ["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR"]:
        start = end
        v_end = put(gid, start + 0.3)
        min_d = 5.5 if gid == "NOT" else 6.0
        end = r(start + max(min_d, (v_end - start) + 0.75))
        segs.append({"type": "gate", "id": gid, "start": start, "end": end})
    start = end
    v_end = put("final", start + 0.6)
    text_at = r(v_end - start + 0.35)
    end = r(start + text_at + 3.2)
    segs.append({"type": "final", "start": start, "end": end})
    # субтитр держится чуть дольше реплики, но не залезает на следующий
    for i, s in enumerate(subs):
        nxt = subs[i + 1]["start"] if i + 1 < len(subs) else end
        s["end"] = r(min(s["end"] + 0.35, nxt - 0.05))
    timing = {"engine": meta["engine"], "duration": end, "segments": segs, "phrases": place, "subs": subs,
              "final": {"textAt": text_at, "footAt": r(text_at + 0.8)}}
    path = os.path.join(ROOT, "src", "voice-timing.js")
    with open(path, "w", encoding="utf-8") as f:
        f.write("// Сгенерировано voice/make_voice.py — тайминг озвучки и субтитров.\n")
        f.write("window.VOICE_TIMING = " + json.dumps(timing, ensure_ascii=False, indent=1) + ";\n")
    print(f"✔ таймлайн: {end:.2f} c → {path}")
    make_envelope(place, end)


def make_envelope(place, duration, fps=30):
    """Огибающая громкости голоса по кадрам (0..100) → src/voice-env.js — для анимации аватара."""
    n = int(np.ceil(duration * fps)) + 1
    env = np.zeros(n)
    for p in place:
        with wave.open(os.path.join(ROOT, p["file"])) as w:
            a = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32768
            sr = w.getframerate()
        hop = sr // fps
        for k in range(len(a) // hop):
            i = int(round(p["start"] * fps)) + k
            if i < n:
                env[i] = max(env[i], np.sqrt(np.mean(a[k * hop:(k + 1) * hop] ** 2)))
    db = 20 * np.log10(env + 1e-6)
    v = np.clip((db + 42) / 36, 0, 1)  # −42 дБ → 0, −6 дБ → 1
    # сглаживание: быстрая атака, плавный спад
    out = np.zeros(n)
    for i in range(n):
        prev = out[i - 1] if i else 0
        out[i] = v[i] if v[i] > prev else prev * 0.78 + v[i] * 0.22
    path = os.path.join(ROOT, "src", "voice-env.js")
    with open(path, "w", encoding="utf-8") as f:
        f.write("// Сгенерировано voice/make_voice.py — громкость голоса по кадрам (0..100), 30 FPS.\n")
        f.write("window.VOICE_ENV = { fps: %d, data: [%s] };\n" % (fps, ",".join(str(int(round(x * 100))) for x in out)))
    print(f"✔ огибающая голоса: {n} кадров → {path}")


if __name__ == "__main__":
    main()
