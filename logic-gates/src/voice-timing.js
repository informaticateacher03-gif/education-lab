// Сгенерировано voice/make_voice.py — тайминг озвучки и субтитров.
window.VOICE_TIMING = {
 "engine": "Piper VITS · ru_RU-irina-medium.onnx",
 "duration": 63.06,
 "segments": [
  {
   "type": "intro",
   "start": 0,
   "end": 7.25
  },
  {
   "type": "gate",
   "id": "AND",
   "start": 7.25,
   "end": 15.4
  },
  {
   "type": "gate",
   "id": "OR",
   "start": 15.4,
   "end": 21.4
  },
  {
   "type": "gate",
   "id": "NOT",
   "start": 21.4,
   "end": 27.78
  },
  {
   "type": "gate",
   "id": "NAND",
   "start": 27.78,
   "end": 33.78
  },
  {
   "type": "gate",
   "id": "NOR",
   "start": 33.78,
   "end": 41.28
  },
  {
   "type": "gate",
   "id": "XOR",
   "start": 41.28,
   "end": 48.37
  },
  {
   "type": "gate",
   "id": "XNOR",
   "start": 48.37,
   "end": 54.92
  },
  {
   "type": "final",
   "start": 54.92,
   "end": 63.06
  }
 ],
 "phrases": [
  {
   "id": "intro",
   "start": 0.6,
   "dur": 5.016,
   "file": "build/voice/intro.wav"
  },
  {
   "id": "look",
   "start": 5.97,
   "dur": 0.731,
   "file": "build/voice/look.wav"
  },
  {
   "id": "AND",
   "start": 7.55,
   "dur": 6.754,
   "file": "build/voice/AND.wav"
  },
  {
   "id": "OR",
   "start": 15.7,
   "dur": 4.164,
   "file": "build/voice/OR.wav"
  },
  {
   "id": "NOT",
   "start": 21.7,
   "dur": 4.975,
   "file": "build/voice/NOT.wav"
  },
  {
   "id": "NAND",
   "start": 28.08,
   "dur": 3.617,
   "file": "build/voice/NAND.wav"
  },
  {
   "id": "NOR",
   "start": 34.08,
   "dur": 6.104,
   "file": "build/voice/NOR.wav"
  },
  {
   "id": "XOR",
   "start": 41.58,
   "dur": 5.686,
   "file": "build/voice/XOR.wav"
  },
  {
   "id": "XNOR",
   "start": 48.67,
   "dur": 5.147,
   "file": "build/voice/XNOR.wav"
  },
  {
   "id": "final",
   "start": 55.52,
   "dur": 3.588,
   "file": "build/voice/final.wav"
  }
 ],
 "subs": [
  {
   "start": 0.6,
   "end": 5.92,
   "text": "Как компьютер принимает решения, если понимает только ноль и единицу?",
   "seg": "intro"
  },
  {
   "start": 5.97,
   "end": 7.05,
   "text": "Смотрите!",
   "seg": "intro"
  },
  {
   "start": 7.55,
   "end": 9.38,
   "text": "AND — логическое И.",
   "seg": "AND"
  },
  {
   "start": 9.43,
   "end": 14.65,
   "text": "Результат — единица, только когда оба сигнала равны единице.",
   "seg": "AND"
  },
  {
   "start": 15.7,
   "end": 17.69,
   "text": "OR — логическое ИЛИ.",
   "seg": "OR"
  },
  {
   "start": 17.74,
   "end": 20.21,
   "text": "Достаточно хотя бы одной единицы.",
   "seg": "OR"
  },
  {
   "start": 21.7,
   "end": 23.65,
   "text": "NOT — логическое НЕ.",
   "seg": "NOT"
  },
  {
   "start": 23.7,
   "end": 27.03,
   "text": "Меняет ноль на единицу, а единицу на ноль.",
   "seg": "NOT"
  },
  {
   "start": 28.08,
   "end": 29.43,
   "text": "NAND — И-НЕ.",
   "seg": "NAND"
  },
  {
   "start": 29.48,
   "end": 32.05,
   "text": "Работает наоборот по сравнению с AND.",
   "seg": "NAND"
  },
  {
   "start": 34.08,
   "end": 35.51,
   "text": "NOR — ИЛИ-НЕ.",
   "seg": "NOR"
  },
  {
   "start": 35.56,
   "end": 40.53,
   "text": "Единица получается, только когда оба входа — нули.",
   "seg": "NOR"
  },
  {
   "start": 41.58,
   "end": 44.1,
   "text": "XOR — исключающее ИЛИ.",
   "seg": "XOR"
  },
  {
   "start": 44.15,
   "end": 47.62,
   "text": "Единица появляется, если сигналы разные.",
   "seg": "XOR"
  },
  {
   "start": 48.67,
   "end": 50.76,
   "text": "XNOR — равнозначность.",
   "seg": "XNOR"
  },
  {
   "start": 50.81,
   "end": 54.17,
   "text": "Единица появляется, когда сигналы одинаковые.",
   "seg": "XNOR"
  },
  {
   "start": 55.52,
   "end": 59.46,
   "text": "Вот так из нулей и единиц рождается цифровая логика!",
   "seg": "final"
  }
 ],
 "final": {
  "textAt": 4.54,
  "footAt": 5.34
 }
};
