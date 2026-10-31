#!/usr/bin/env python3
"""Синтез звуковых эффектов (без внешних сэмплов) по списку событий таймлайна.

click  — щелчок переключателя входов
hi/lo  — сигнал выхода: высокий тон для 1, низкий для 0
whoosh — мягкий переход между схемами
power  — «включение» в начале, chime — аккорд на заголовках
Использование: make_sfx.py events.json out.wav
"""
import json
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


def tone(freq, dur, decay, attack=0.003, harm=(1.0, 0.35, 0.12)):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * freq * (k + 1) * t) for k, a in enumerate(harm))
    return s * env(n, attack, decay)


def click():
    n = int(0.05 * SR)
    noise = rng.standard_normal(n)
    noise = np.convolve(noise, np.ones(6) / 6, mode="same")  # чуть мягче
    body = np.sin(2 * np.pi * 1900 * np.arange(n) / SR)
    return (0.55 * noise + 0.6 * body) * env(n, 0.0005, 0.008) * 0.55


def sfx(kind):
    if kind == "click":
        return click()
    if kind == "hi":
        return 0.32 * (tone(1046.5, 0.35, 0.09) + 0.6 * tone(1568, 0.35, 0.06))
    if kind == "lo":
        return 0.32 * tone(261.6, 0.35, 0.10, harm=(1.0, 0.5, 0.25))
    if kind == "whoosh":
        n = int(0.45 * SR)
        noise = rng.standard_normal(n)
        k = 60
        noise = np.convolve(noise, np.ones(k) / k, mode="same")
        e = np.sin(np.pi * np.arange(n) / n) ** 2
        return 0.9 * noise * e
    if kind == "power":
        dur = 0.9
        n = int(dur * SR)
        t = np.arange(n) / SR
        f = 80 + 500 * (t / dur) ** 2
        ph = 2 * np.pi * np.cumsum(f) / SR
        return 0.22 * np.sin(ph) * np.sin(np.pi * t / dur)
    if kind == "chime":
        return 0.18 * sum(tone(f, 1.4, 0.45, attack=0.01) for f in (523.25, 659.25, 783.99, 1046.5))
    raise ValueError(kind)


def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    total = int(spec["duration"] * SR)
    mix = np.zeros(total + SR)
    for ev in spec["events"]:
        s = sfx(ev["type"])
        i = int(round(ev["t"] * SR))
        mix[i:i + len(s)] += s[: max(0, len(mix) - i)]
    mix = mix[:total]
    peak = np.max(np.abs(mix)) or 1
    mix = mix / peak * 0.85
    # стерео с лёгким расширением
    left = mix
    right = np.concatenate([np.zeros(24), mix[:-24]])
    data = (np.stack([left, right], axis=1) * 32767).astype("<i2")
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"✔ звук: {sys.argv[2]} ({len(spec['events'])} событий)")


if __name__ == "__main__":
    main()
