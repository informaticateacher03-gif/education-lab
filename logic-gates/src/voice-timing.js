// Сгенерировано voice/make_voice.py — тайминг озвучки и субтитров.
window.VOICE_TIMING = {
 "engine": "Piper VITS · ru_RU-irina-medium.onnx",
 "duration": 64.36,
 "segments": [
  {
   "type": "intro",
   "start": 0,
   "end": 7.58
  },
  {
   "type": "gate",
   "id": "AND",
   "start": 7.58,
   "end": 15.58
  },
  {
   "type": "gate",
   "id": "OR",
   "start": 15.58,
   "end": 21.58
  },
  {
   "type": "gate",
   "id": "NOT",
   "start": 21.58,
   "end": 28.77
  },
  {
   "type": "gate",
   "id": "NAND",
   "start": 28.77,
   "end": 35.2
  },
  {
   "type": "gate",
   "id": "NOR",
   "start": 35.2,
   "end": 42.53
  },
  {
   "type": "gate",
   "id": "XOR",
   "start": 42.53,
   "end": 49.59
  },
  {
   "type": "gate",
   "id": "XNOR",
   "start": 49.59,
   "end": 56.17
  },
  {
   "type": "final",
   "start": 56.17,
   "end": 64.36
  }
 ],
 "phrases": [
  {
   "id": "intro",
   "start": 0.6,
   "dur": 5.305,
   "file": "build/voice/intro.wav"
  },
  {
   "id": "look",
   "start": 6.26,
   "dur": 0.778,
   "file": "build/voice/look.wav"
  },
  {
   "id": "AND",
   "start": 7.88,
   "dur": 6.604,
   "file": "build/voice/AND.wav"
  },
  {
   "id": "OR",
   "start": 15.88,
   "dur": 4.122,
   "file": "build/voice/OR.wav"
  },
  {
   "id": "NOT",
   "start": 21.88,
   "dur": 5.792,
   "file": "build/voice/NOT.wav"
  },
  {
   "id": "NAND",
   "start": 29.07,
   "dur": 5.025,
   "file": "build/voice/NAND.wav"
  },
  {
   "id": "NOR",
   "start": 35.5,
   "dur": 5.925,
   "file": "build/voice/NOR.wav"
  },
  {
   "id": "XOR",
   "start": 42.83,
   "dur": 5.658,
   "file": "build/voice/XOR.wav"
  },
  {
   "id": "XNOR",
   "start": 49.89,
   "dur": 5.177,
   "file": "build/voice/XNOR.wav"
  },
  {
   "id": "final",
   "start": 56.77,
   "dur": 3.638,
   "file": "build/voice/final.wav"
  }
 ],
 "subs": [
  {
   "start": 0.6,
   "end": 6.21,
   "text": "Как компьютер принимает решения, если понимает только ноль и единицу?",
   "seg": "intro"
  },
  {
   "start": 6.26,
   "end": 7.38,
   "text": "Смотрите!",
   "seg": "intro"
  },
  {
   "start": 7.88,
   "end": 9.7,
   "text": "AND — логическое И.",
   "seg": "AND"
  },
  {
   "start": 9.75,
   "end": 14.83,
   "text": "Результат — единица, только когда оба сигнала равны единице.",
   "seg": "AND"
  },
  {
   "start": 15.88,
   "end": 17.76,
   "text": "OR — логическое ИЛИ.",
   "seg": "OR"
  },
  {
   "start": 17.81,
   "end": 20.35,
   "text": "Достаточно хотя бы одной единицы.",
   "seg": "OR"
  },
  {
   "start": 21.88,
   "end": 23.65,
   "text": "NOT — логическое НЕ.",
   "seg": "NOT"
  },
  {
   "start": 23.7,
   "end": 28.02,
   "text": "Меняет ноль на единицу, а единицу на ноль.",
   "seg": "NOT"
  },
  {
   "start": 29.07,
   "end": 30.52,
   "text": "NAND — И-НЕ.",
   "seg": "NAND"
  },
  {
   "start": 30.57,
   "end": 34.45,
   "text": "Работает наоборот по сравнению с AND.",
   "seg": "NAND"
  },
  {
   "start": 35.5,
   "end": 36.88,
   "text": "NOR — ИЛИ-НЕ.",
   "seg": "NOR"
  },
  {
   "start": 36.93,
   "end": 41.78,
   "text": "Единица получается, только когда оба входа — нули.",
   "seg": "NOR"
  },
  {
   "start": 42.83,
   "end": 45.41,
   "text": "XOR — исключающее ИЛИ.",
   "seg": "XOR"
  },
  {
   "start": 45.46,
   "end": 48.84,
   "text": "Единица появляется, если сигналы разные.",
   "seg": "XOR"
  },
  {
   "start": 49.89,
   "end": 52.02,
   "text": "XNOR — равнозначность.",
   "seg": "XNOR"
  },
  {
   "start": 52.07,
   "end": 55.42,
   "text": "Единица появляется, когда сигналы одинаковые.",
   "seg": "XNOR"
  },
  {
   "start": 56.77,
   "end": 60.76,
   "text": "Вот так из нулей и единиц рождается цифровая логика!",
   "seg": "final"
  }
 ],
 "final": {
  "textAt": 4.59,
  "footAt": 5.39
 }
};
