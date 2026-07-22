const params = new URLSearchParams(window.location.search);
const lessonId = Number(params.get('lesson') || 1);
const embedded = params.get('embedded') === '1';
const lesson = courseData.lessons.find(item => item.id === lessonId) || courseData.lessons[0];
const moduleData = courseData.modules[lesson.module - 1];

const firstLessonSlides = [
  { kicker: 'Урок 01', title: lesson.title, text: 'Как технология прошла путь от научной идеи до помощника в повседневной жизни.' },
  { kicker: 'Основное понятие', title: 'Что такое искусственный интеллект?', text: 'Технологии, которые помогают компьютеру распознавать, прогнозировать, создавать и решать задачи.', points: ['Анализирует', 'Находит связи', 'Предлагает результат'] },
  { kicker: 'Один из способов создать ИИ', title: 'Что такое нейросеть?', text: 'Математическая модель из связанных элементов. Она обучается на множестве примеров.', quote: 'Нейросеть вычисляет, но не думает и не чувствует как человек.' },
  { kicker: 'Четыре этапа', title: 'Как обучается нейросеть', flow: ['Данные', 'Обучение', 'Закономерности', 'Результат'] },
  { kicker: 'Короткая история', title: 'От идеи к генеративному ИИ', timeline: [['1950-е', 'Первые идеи'], ['1956', 'Термин AI'], ['1990–2000-е', 'Машинное обучение'], ['2010-е', 'Глубокое обучение'], ['Сегодня', 'Генеративные модели']] },
  { kicker: 'Применение', title: 'Образование и творчество', text: 'ИИ помогает получать объяснения, создавать материалы и развивать проектные идеи.', points: ['Обучение', 'Тексты', 'Изображения'] },
  { kicker: 'Применение', title: 'Медицина и транспорт', split: [{ icon: '⚕', title: 'Медицина', text: 'Анализ снимков и больших наборов данных.' }, { icon: '↗', title: 'Транспорт', text: 'Маршруты, прогноз пробок и распознавание объектов.' }] },
  { kicker: 'Творчество', title: 'Генеративные нейросети', text: 'Создают новый материал на основе закономерностей, найденных в данных.', points: ['Тексты', 'Изображения', 'Музыка и видео'] },
  { kicker: 'Ответственность', title: 'Возможности и ограничения', split: [{ icon: '✓', title: 'Возможности', text: 'Скорость, анализ, идеи и автоматизация.' }, { icon: '!', title: 'Ограничения', text: 'Ошибки, смещения в данных и неточные ответы.' }], quote: 'Важную информацию всегда проверяйте по надёжным источникам.' },
  { kicker: 'Итог', title: 'Вопросы для обсуждения', questions: ['Где вы встретили нейросеть сегодня?', 'Какую задачу она решала?', 'Почему её ответ нужно проверять?'] }
];

const secondLessonSlides = [
  { kicker: 'Урок 02', title: 'Как устроен искусственный интеллект', text: 'Разбираем ИИ-систему на понятные компоненты — от данных до проверки результата.' },
  { kicker: 'Главная идея', title: 'ИИ — это система', text: 'За видимой пользователю кнопкой работают данные, алгоритмы, обученная модель, вычисления и интерфейс.', points: ['Данные', 'Модель', 'Человек'] },
  { kicker: 'Компонент 1', title: 'Данные', text: 'Тексты, изображения, звуки или числа служат примерами для обучения и входом для работы модели.', quote: 'Качество и разнообразие данных влияют на качество результата.' },
  { kicker: 'Компонент 2', title: 'Алгоритм обучения', text: 'Алгоритм сравнивает ответы модели с примерами и помогает постепенно настроить её параметры.' },
  { kicker: 'Компонент 3', title: 'Обученная модель', text: 'Модель использует найденные закономерности, чтобы обработать новый запрос.', flow: ['Новый вход', 'Признаки', 'Вычисление', 'Прогноз'] },
  { kicker: 'Компонент 4', title: 'Интерфейс', text: 'Интерфейс принимает запрос человека и показывает результат в понятной форме.', points: ['Запрос', 'Управление', 'Ответ'] },
  { kicker: 'Пример', title: 'Распознавание изображения', flow: ['Фотография', 'Модель', 'Класс объекта', 'Проверка'] },
  { kicker: 'Сравнение', title: 'Правила или обучение?', split: [{ icon: '01', title: 'Обычная программа', text: 'Человек заранее описывает точные правила.' }, { icon: '02', title: 'Машинное обучение', text: 'Модель настраивается на множестве примеров.' }] },
  { kicker: 'Ответственность', title: 'Человек остаётся главным', text: 'Человек формулирует задачу, выбирает данные, проверяет качество и решает, можно ли использовать результат.', quote: 'ИИ предлагает результат — ответственность за решение несёт человек.' },
  { kicker: 'Итог', title: 'Проверьте себя', questions: ['Какие части образуют ИИ-систему?', 'Чем модель отличается от интерфейса?', 'Где и зачем нужен контроль человека?'] }
];

const generatedSlides = [
  { kicker: `Модуль ${lesson.module} · Урок ${lesson.id}`, title: lesson.title, text: `Практический результат: ${lesson.product}.` },
  { kicker: 'Цель урока', title: 'Что предстоит узнать?', text: `${lesson.goal}.`, points: ['Понять', 'Применить', 'Проверить'] },
  { kicker: 'Ключевая идея', title: lesson.terms[0].term, text: lesson.terms[0].definition, quote: 'Сформулируйте собственное объяснение понятия.' },
  { kicker: 'Новые слова', title: 'Язык темы', split: lesson.terms.slice(1).map((term, index) => ({ icon: `0${index + 2}`, title: term.term, text: term.definition })) },
  { kicker: 'Проектный маршрут', title: 'От задачи к результату', flow: ['Замысел', 'Исследование', 'Создание', 'Проверка'] },
  { kicker: 'Практика', title: `Создайте: ${lesson.product}`, text: 'Зафиксируйте цель, ход работы и результаты проверки. Сохраняйте промежуточные версии.' },
  { kicker: 'Ответственная работа', title: 'Проверяйте и объясняйте', split: [{ icon: '✓', title: 'Проверка', text: 'Сравните результат с целью и критериями.' }, { icon: '!', title: 'Безопасность', text: 'Не раскрывайте персональные данные и проверяйте факты.' }] },
  { kicker: 'Итог', title: 'Вопросы для рефлексии', questions: ['Что нового вы поняли?', 'Как результат поможет проекту?', 'Что следует улучшить?'] }
];

const slides = lesson.id === 1 ? firstLessonSlides : lesson.id === 2 ? secondLessonSlides : generatedSlides;
document.title = `Презентация к уроку ${lesson.id} — AI & AR Lab`;
document.querySelector('.deck-brand').innerHTML = `AI & AR LAB <span>· ${moduleData.title.toUpperCase()}</span>`;
if (embedded) document.body.classList.add('embedded');
document.querySelector('.deck-controls a').href = `lesson.html?lesson=${lesson.id}#presentation`;

const container = document.querySelector('#slides');
function slideMarkup(slide, index) {
  return `<section class="slide" aria-hidden="true"><div class="slide-copy"><p class="kicker">${slide.kicker}</p><h1>${slide.title}</h1>${slide.text ? `<p class="lead">${slide.text}</p>` : ''}${slide.points ? `<div class="slide-points">${slide.points.map((point, pointIndex) => `<div><b>0${pointIndex + 1}</b>${point}</div>`).join('')}</div>` : ''}${slide.flow ? `<div class="slide-flow">${slide.flow.map(point => `<span>${point}</span>`).join('<i aria-hidden="true">→</i>')}</div>` : ''}${slide.timeline ? `<div class="slide-timeline">${slide.timeline.map(point => `<div><b>${point[0]}</b><span>${point[1]}</span></div>`).join('')}</div>` : ''}${slide.split ? `<div class="slide-split">${slide.split.map(point => `<div><b>${point.icon}</b><h2>${point.title}</h2><p>${point.text}</p></div>`).join('')}</div>` : ''}${slide.questions ? `<div class="slide-questions">${slide.questions.map(question => `<p>${question}</p>`).join('')}</div>` : ''}${slide.quote ? `<blockquote>${slide.quote}</blockquote>` : ''}</div><span class="slide-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span></section>`;
}
container.innerHTML = slides.map(slideMarkup).join('');

let current = 0;
const previousButton = document.querySelector('#prev');
const nextButton = document.querySelector('#next');
function show(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  document.querySelectorAll('.slide').forEach((slide, slideIndex) => { const active = slideIndex === current; slide.classList.toggle('active', active); slide.setAttribute('aria-hidden', String(!active)); });
  document.querySelector('#counter').textContent = `${current + 1} / ${slides.length}`;
  document.querySelector('#deck-progress-fill').style.width = `${((current + 1) / slides.length) * 100}%`;
  previousButton.disabled = current === 0; nextButton.disabled = current === slides.length - 1;
}
previousButton.addEventListener('click', () => show(current - 1));
nextButton.addEventListener('click', () => show(current + 1));
document.addEventListener('keydown', event => { if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); show(current + 1); } if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); show(current - 1); } });
const fullscreenButton = document.querySelector('#fullscreen');
if (!document.fullscreenEnabled || embedded) fullscreenButton.hidden = true;
else fullscreenButton.addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { fullscreenButton.title = 'Полноэкранный режим недоступен'; } });
let touchStart = 0;
container.addEventListener('touchstart', event => { touchStart = event.touches[0].clientX; }, { passive: true });
container.addEventListener('touchend', event => { const distance = event.changedTouches[0].clientX - touchStart; if (Math.abs(distance) > 50) show(current + (distance < 0 ? 1 : -1)); }, { passive: true });
show(0);
