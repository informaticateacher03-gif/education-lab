// Сгенерировано voice/make_voice.py — тайминг озвучки и субтитров.
window.VOICE_TIMING = {
 "engine": "Голос автора (запись)",
 "duration": 68.63,
 "segments": [
  {
   "type": "intro",
   "start": 0,
   "end": 7.74
  },
  {
   "type": "gate",
   "id": "AND",
   "start": 7.74,
   "end": 17.03
  },
  {
   "type": "gate",
   "id": "OR",
   "start": 17.03,
   "end": 23.38
  },
  {
   "type": "gate",
   "id": "NOT",
   "start": 23.38,
   "end": 30.46
  },
  {
   "type": "gate",
   "id": "NAND",
   "start": 30.46,
   "end": 36.84
  },
  {
   "type": "gate",
   "id": "NOR",
   "start": 36.84,
   "end": 44.74
  },
  {
   "type": "gate",
   "id": "XOR",
   "start": 44.74,
   "end": 53.02
  },
  {
   "type": "gate",
   "id": "XNOR",
   "start": 53.02,
   "end": 60.62
  },
  {
   "type": "final",
   "start": 60.62,
   "end": 68.63
  }
 ],
 "phrases": [
  {
   "id": "intro",
   "start": 0.6,
   "dur": 5.45,
   "file": "build/voice/intro.wav"
  },
  {
   "id": "look",
   "start": 6.4,
   "dur": 0.94,
   "file": "build/voice/look.wav"
  },
  {
   "id": "AND",
   "start": 8.04,
   "dur": 8.24,
   "file": "build/voice/AND.wav"
  },
  {
   "id": "OR",
   "start": 17.33,
   "dur": 5.3,
   "file": "build/voice/OR.wav"
  },
  {
   "id": "NOT",
   "start": 23.68,
   "dur": 6.03,
   "file": "build/voice/NOT.wav"
  },
  {
   "id": "NAND",
   "start": 30.76,
   "dur": 5.33,
   "file": "build/voice/NAND.wav"
  },
  {
   "id": "NOR",
   "start": 37.14,
   "dur": 6.85,
   "file": "build/voice/NOR.wav"
  },
  {
   "id": "XOR",
   "start": 45.04,
   "dur": 7.23,
   "file": "build/voice/XOR.wav"
  },
  {
   "id": "XNOR",
   "start": 53.32,
   "dur": 6.55,
   "file": "build/voice/XNOR.wav"
  },
  {
   "id": "final",
   "start": 61.22,
   "dur": 3.86,
   "file": "build/voice/final.wav"
  }
 ],
 "subs": [
  {
   "start": 0.66,
   "end": 6.34,
   "text": "Как компьютер принимает решения, если понимает только единицу и ноль?",
   "seg": "intro"
  },
  {
   "start": 6.46,
   "end": 7.63,
   "text": "Смотрите!",
   "seg": "intro"
  },
  {
   "start": 8.1,
   "end": 10.32,
   "text": "AND — логическое И.",
   "seg": "AND"
  },
  {
   "start": 10.37,
   "end": 16.57,
   "text": "Результат — единица, только тогда, когда оба сигнала равны единице.",
   "seg": "AND"
  },
  {
   "start": 17.39,
   "end": 19.73,
   "text": "OR — логическое ИЛИ.",
   "seg": "OR"
  },
  {
   "start": 19.94,
   "end": 22.92,
   "text": "Достаточно хотя бы одной единицы.",
   "seg": "OR"
  },
  {
   "start": 23.74,
   "end": 26.21,
   "text": "NOT — логическое НЕ.",
   "seg": "NOT"
  },
  {
   "start": 26.26,
   "end": 30.0,
   "text": "Меняет ноль на единицу, а единицу на ноль.",
   "seg": "NOT"
  },
  {
   "start": 30.82,
   "end": 33.18,
   "text": "NAND — И-НЕ.",
   "seg": "NAND"
  },
  {
   "start": 33.23,
   "end": 36.38,
   "text": "Работает наоборот по сравнению с AND.",
   "seg": "NAND"
  },
  {
   "start": 37.2,
   "end": 39.46,
   "text": "NOR — ИЛИ-НЕ.",
   "seg": "NOR"
  },
  {
   "start": 39.78,
   "end": 44.28,
   "text": "Единица получается, только тогда, когда оба входа — нули.",
   "seg": "NOR"
  },
  {
   "start": 45.1,
   "end": 48.87,
   "text": "XOR — исключающее ИЛИ.",
   "seg": "XOR"
  },
  {
   "start": 49.09,
   "end": 52.56,
   "text": "Единица появляется, если сигналы разные.",
   "seg": "XOR"
  },
  {
   "start": 53.38,
   "end": 56.63,
   "text": "XNOR — равнозначность.",
   "seg": "XNOR"
  },
  {
   "start": 56.68,
   "end": 60.16,
   "text": "Единица появляется, когда сигналы одинаковые.",
   "seg": "XNOR"
  },
  {
   "start": 61.28,
   "end": 65.37,
   "text": "Вот так из нулей и единиц рождается цифровая логика!",
   "seg": "final"
  }
 ],
 "final": {
  "textAt": 4.81,
  "footAt": 5.61
 }
};
