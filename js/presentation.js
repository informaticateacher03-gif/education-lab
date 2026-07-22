const slides = [
  { kicker: 'Урок 01', title: 'История развития нейросетей', text: 'Как технология прошла путь от научной идеи до помощника в повседневной жизни.', visual: '<div class="neural" aria-hidden="true"><i></i><i></i><i></i><i></i><b>AI</b></div>', className: 'cover' },
  { kicker: 'Основное понятие', title: 'Что такое искусственный интеллект?', text: 'Технологии, которые помогают компьютеру распознавать, прогнозировать, создавать и решать задачи.', points: ['Анализирует', 'Находит связи', 'Предлагает результат'] },
  { kicker: 'Один из способов создать ИИ', title: 'Что такое нейросеть?', text: 'Математическая модель из связанных элементов. Она обучается на множестве примеров.', quote: 'Нейросеть вычисляет — но не думает и не чувствует как человек.' },
  { kicker: 'Четыре этапа', title: 'Как обучается нейросеть', flow: ['Данные', 'Обучение', 'Закономерности', 'Результат'], text: 'Качество результата зависит от примеров, задачи и проверки человеком.' },
  { kicker: 'Короткая история', title: 'От идеи к генеративному ИИ', timeline: [['1950-е', 'Первые идеи'], ['1956', 'Термин AI'], ['1990–2000-е', 'Машинное обучение'], ['2010-е', 'Глубокое обучение'], ['Сегодня', 'Генеративные модели']] },
  { kicker: 'Применение', title: 'ИИ в образовании', text: 'Технология помогает подобрать объяснение, создать тренировочные задания и получить обратную связь.', points: ['Персональный темп', 'Новые форматы', 'Помощь учителю'], quote: 'ИИ — помощник в обучении, а не замена самостоятельному мышлению.' },
  { kicker: 'Применение', title: 'Медицина и транспорт', split: [{ icon: '⚕', title: 'Медицина', text: 'Анализ снимков и больших наборов данных.' }, { icon: '↗', title: 'Транспорт', text: 'Маршруты, прогноз пробок и распознавание объектов.' }] },
  { kicker: 'Творчество', title: 'Генеративные нейросети', text: 'Создают новый материал на основе закономерностей, найденных в данных.', points: ['Тексты', 'Изображения', 'Музыка и видео'] },
  { kicker: 'Ответственное использование', title: 'Возможности и ограничения', split: [{ icon: '✓', title: 'Возможности', text: 'Скорость, анализ, идеи и автоматизация.' }, { icon: '!', title: 'Ограничения', text: 'Ошибки, смещения в данных и неточные ответы.' }], quote: 'Важную информацию всегда проверяйте по надёжным источникам.' },
  { kicker: 'Подведём итог', title: 'Вопросы для обсуждения', questions: ['Где вы встретили нейросеть сегодня?', 'Какую задачу она решала?', 'Почему её ответ нужно проверять?'], text: 'ИИ усиливает идеи человека, когда мы используем его осознанно.' }
];

const container = document.querySelector('#slides');
const previousButton = document.querySelector('#prev');
const nextButton = document.querySelector('#next');
const fullscreenButton = document.querySelector('#fullscreen');

function slideMarkup(slide, index) {
  return `
    <section class="slide ${slide.className || ''}" data-slide="${index}" aria-hidden="true">
      <div class="slide-copy">
        <p class="kicker">${slide.kicker}</p>
        <h1>${slide.title}</h1>
        ${slide.text ? `<p class="lead">${slide.text}</p>` : ''}
        ${slide.points ? `<div class="slide-points">${slide.points.map((point, pointIndex) => `<div><b>0${pointIndex + 1}</b>${point}</div>`).join('')}</div>` : ''}
        ${slide.flow ? `<div class="slide-flow">${slide.flow.map(point => `<span>${point}</span>`).join('<i aria-hidden="true">→</i>')}</div>` : ''}
        ${slide.timeline ? `<div class="slide-timeline">${slide.timeline.map(point => `<div><b>${point[0]}</b><span>${point[1]}</span></div>`).join('')}</div>` : ''}
        ${slide.split ? `<div class="slide-split">${slide.split.map(point => `<div><b>${point.icon}</b><h2>${point.title}</h2><p>${point.text}</p></div>`).join('')}</div>` : ''}
        ${slide.questions ? `<div class="slide-questions">${slide.questions.map(question => `<p>${question}</p>`).join('')}</div>` : ''}
        ${slide.quote ? `<blockquote>${slide.quote}</blockquote>` : ''}
      </div>
      ${slide.visual || ''}
      <span class="slide-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    </section>`;
}

container.innerHTML = slides.map(slideMarkup).join('');
let current = 0;

function show(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  document.querySelectorAll('.slide').forEach((slide, slideIndex) => {
    const isActive = slideIndex === current;
    slide.classList.toggle('active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
    if (isActive) slide.scrollTop = 0;
  });
  document.querySelector('#counter').textContent = `${current + 1} / ${slides.length}`;
  document.querySelector('#deck-progress-fill').style.width = `${((current + 1) / slides.length) * 100}%`;
  previousButton.disabled = current === 0;
  nextButton.disabled = current === slides.length - 1;
}

previousButton.addEventListener('click', () => show(current - 1));
nextButton.addEventListener('click', () => show(current + 1));

document.addEventListener('keydown', event => {
  if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
    event.preventDefault();
    show(current + 1);
  }
  if (['ArrowLeft', 'PageUp'].includes(event.key)) {
    event.preventDefault();
    show(current - 1);
  }
});

if (!document.fullscreenEnabled) {
  fullscreenButton.hidden = true;
} else {
  fullscreenButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      fullscreenButton.title = 'Полноэкранный режим недоступен';
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreenButton.setAttribute('aria-label', document.fullscreenElement ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим');
  });
}

let touchStart = 0;
container.addEventListener('touchstart', event => {
  touchStart = event.touches[0].clientX;
}, { passive: true });
container.addEventListener('touchend', event => {
  const distance = event.changedTouches[0].clientX - touchStart;
  if (Math.abs(distance) > 50) show(current + (distance < 0 ? 1 : -1));
}, { passive: true });

show(0);
