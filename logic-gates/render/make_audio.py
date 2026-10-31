#!/usr/bin/env python3
"""Сведение звука ролика: голос + фоновая электронная музыка + звуки переключателей.

Музыка синтезируется здесь же (без внешних сэмплов и лицензий): мягкий пэд,
арпеджио, бас, тихие бочка и хэт; 112 BPM, ля минор (Am–F–C–G).
Под голосом музыка автоматически приглушается (sidechain ducking),
голос обрабатывается: срез низа, «присутствие», мягкая компрессия.

  make_audio.py events.json out_mix.wav [stems_dir]
"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_sfx import SR, sfx  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(11)

# уровни (линейно, до финальной нормализации громкости)
VOICE_GAIN = 1.0
MUSIC_GAIN = 0.16       # без голоса
MUSIC_DUCK = 0.075      # под голосом (≈ −6.5 дБ)
SFX_GAIN = 0.30


def db(x):
    return 20 * np.log10(max(x, 1e-9))


# ---------------------------------------------------------------- музыка
def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def adsr(n, a, d, s, r):
    e = np.ones(n) * s
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    A = min(A, n); e[:A] = np.linspace(0, 1, A, endpoint=False)
    D = min(D, n - A); e[A:A + D] = np.linspace(1, s, D, endpoint=False)
    if R and n > R:
        e[-R:] *= np.linspace(1, 0, R)
    return e


def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for d in (-detune, 0, detune):
        ph = (t * freq * (1 + d)) % 1.0
        out += 2 * ph - 1
    return out / 3


def music(duration):
    bpm = 112
    beat = 60 / bpm
    bar = 4 * beat
    n_total = int(duration * SR) + SR
    out = np.zeros(n_total)
    prog = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [48, 52, 55]), (55, [55, 59, 62])]  # Am F C G
    n_bars = int(np.ceil(duration / bar)) + 1
    for b in range(n_bars):
        root, chord = prog[b % 4]
        t0 = b * bar
        i0 = int(t0 * SR)
        nb = int(bar * SR)
        if i0 >= n_total:
            break
        seg = slice(i0, min(n_total, i0 + nb))
        m = seg.stop - seg.start
        # пэд
        pad = sum(saw(midi(c + 12), m, 0.004) for c in chord) / 3
        pad *= adsr(m, 0.35, 0.3, 0.8, 0.4) * 0.35
        out[seg] += pad
        # бас: восьмые
        for k in range(8):
            j0 = i0 + int(k * beat / 2 * SR)
            ln = int(beat / 2 * SR * 0.9)
            if j0 + ln > n_total:
                continue
            tt = np.arange(ln) / SR
            f = midi(root - 12)
            bass = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)
            out[j0:j0 + ln] += 0.42 * bass * adsr(ln, 0.005, 0.08, 0.6, 0.05)
        # арпеджио: шестнадцатые
        arp = [chord[0] + 24, chord[1] + 24, chord[2] + 24, chord[1] + 24]
        for k in range(16):
            j0 = i0 + int(k * beat / 4 * SR)
            ln = int(beat / 4 * SR)
            if j0 + ln > n_total:
                continue
            tt = np.arange(ln) / SR
            f = midi(arp[k % 4])
            pl = np.sign(np.sin(2 * np.pi * f * tt)) * 0.3 + np.sin(2 * np.pi * f * tt) * 0.7
            out[j0:j0 + ln] += 0.16 * pl * np.exp(-tt / 0.06)
        # ударные
        for k in range(4):
            j0 = i0 + int(k * beat * SR)
            ln = int(0.25 * SR)
            if j0 + ln > n_total:
                continue
            tt = np.arange(ln) / SR
            kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-tt / 0.03)) * tt) * np.exp(-tt / 0.12)
            out[j0:j0 + ln] += 0.55 * kick
            h0 = j0 + int(beat / 2 * SR)
            hl = int(0.05 * SR)
            if h0 + hl < n_total:
                hat = rng.standard_normal(hl)
                hat = hat - np.convolve(hat, np.ones(4) / 4, mode="same")  # грубый ВЧ-фильтр
                out[h0:h0 + hl] += 0.12 * hat * np.exp(-np.arange(hl) / SR / 0.012)
    # мягкий ФНЧ для «тёплого» звука (через ffmpeg — быстро)
    out = out[: int(duration * SR)]
    out = ffmpeg_filter(out, "lowpass=f=5200,highpass=f=35")
    # плавное появление и затухание
    fi, fo = int(1.5 * SR), int(2.0 * SR)
    out[:fi] *= np.linspace(0, 1, fi)
    out[-fo:] *= np.linspace(1, 0, fo)
    return out / (np.max(np.abs(out)) or 1)


def ffmpeg_filter(x, af):
    p = subprocess.run(["ffmpeg", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-af", af, "-f", "f32le", "-"], input=x.astype(np.float32).tobytes(),
                       capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).astype(np.float64)


def read_wav(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR and w.getsampwidth() == 2
        a = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32768
        if w.getnchannels() == 2:
            a = a.reshape(-1, 2).mean(1)
    return a


def write_wav(path, st):
    data = (np.clip(st, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2 if st.ndim == 2 else 1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    out_path = sys.argv[2]
    stems = sys.argv[3] if len(sys.argv) > 3 else None
    total = int(spec["duration"] * SR)

    voice = np.zeros(total)
    fx = np.zeros(total)
    voice_mask = np.zeros(total)
    for ev in spec["events"]:
        i = int(round(ev["t"] * SR))
        if ev["type"] == "voice":
            a = read_wav(os.path.join(ROOT, ev["file"]))
            a = a[: max(0, total - i)]
            voice[i:i + len(a)] += a
            voice_mask[max(0, i - int(0.15 * SR)): i + len(a) + int(0.25 * SR)] = 1
        else:
            s = sfx(ev["type"])[: max(0, total - i)]
            fx[i:i + len(s)] += s

    has_voice = voice.any()
    if has_voice:
        # обработка голоса: срез низа, присутствие 3 кГц, лёгкая компрессия, нормализация пика
        voice = ffmpeg_filter(voice, "highpass=f=90,equalizer=f=3200:t=q:w=1.2:g=3,"
                                     "acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2")
        voice = voice / (np.max(np.abs(voice)) or 1) * 0.9

    # огибающая ducking со сглаживанием ~120 мс
    k = int(0.12 * SR)
    duck_env = np.convolve(voice_mask, np.ones(k) / k, mode="same")
    music_gain = MUSIC_GAIN - (MUSIC_GAIN - MUSIC_DUCK) * duck_env
    mus = music(spec["duration"]) * music_gain
    fx = fx / (np.max(np.abs(fx)) or 1) * SFX_GAIN * (1 - 0.35 * duck_env)

    mix = voice * VOICE_GAIN + mus + fx
    # стерео: голос по центру, музыка и эффекты слегка расширены
    d = 24
    left = voice + mus + fx
    right = voice + np.concatenate([np.zeros(d), (mus + fx)[:-d]])
    st = np.stack([left, right], 1)
    st = st / (np.max(np.abs(st)) or 1) * 0.95
    write_wav(out_path, st)

    if stems:
        os.makedirs(stems, exist_ok=True)
        scale = 0.95 / (np.max(np.abs(mix)) or 1)
        write_wav(os.path.join(stems, "stem_voice.wav"), voice * VOICE_GAIN * scale)
        write_wav(os.path.join(stems, "stem_music.wav"), mus * scale)
        write_wav(os.path.join(stems, "stem_sfx.wav"), fx * scale)
        m = voice_mask > 0.5
        if has_voice and m.any():
            rv = np.sqrt(np.mean(voice[m] ** 2))
            rm = np.sqrt(np.mean(mus[m] ** 2))
            print(f"  голос / музыка под голосом: {db(rv) - db(rm):+.1f} дБ")
    print(f"✔ звук: {out_path} (голос: {'да' if has_voice else 'нет'}, событий: {len(spec['events'])})")


if __name__ == "__main__":
    main()
