const params = new URLSearchParams(window.location.search);
const requestedLesson = Number(params.get('lesson') || 1);
const lesson = courseData.lessons.find(item => item.id === requestedLesson) || courseData.lessons[0];
const moduleData = courseData.modules[lesson.module - 1];
const state = ProgressStore.lesson(lesson.id);

document.title = `Урок ${lesson.id}. ${lesson.title} — AI & AR Lab`;
document.querySelector('#header-lesson-number').textContent = `Урок ${String(lesson.id).padStart(2, '0')} / ${courseData.lessons.length}`;

function buildTheory() {
  if (lesson.id === 2) {
    return `
      <div class="definition-grid ai-definition-grid">
        <article><span>01</span><h3>Алгоритм</h3><p>Пошаговая инструкция. Обычная программа выполняет правила, которые заранее записал человек.</p></article>
        <article><span>02</span><h3>Модель</h3><p>Обученная математическая система. Она получает входные данные и формирует прогноз или решение.</p></article>
        <article><span>03</span><h3>Машинное обучение</h3><p>Способ создавать модели не перечислением всех правил, а обучением на большом количестве примеров.</p></article>
        <article><span>04</span><h3>Интерфейс</h3><p>Часть системы, через которую человек передаёт запрос и получает понятный результат.</p></article>
      </div>
      <div class="brain-compare"><div class="brain-icon">⚙</div><div><h3>ИИ — это не одна «умная кнопка»</h3><p>Рабочая система объединяет данные, алгоритм обучения, модель, вычислительное устройство и интерфейс. Человек формулирует задачу, проверяет качество и отвечает за применение результата.</p></div></div>
      <div class="ai-layers" aria-label="Устройство системы искусственного интеллекта">
        <div><b>1</b><span>Входные данные</span><small>Текст, изображение, звук или числа</small></div>
        <i>→</i><div><b>2</b><span>Обученная модель</span><small>Ищет признаки и закономерности</small></div>
        <i>→</i><div><b>3</b><span>Результат</span><small>Класс, прогноз, рекомендация или контент</small></div>
        <i>→</i><div><b>4</b><span>Проверка человеком</span><small>Оценка точности и безопасности</small></div>
      </div>`;
  }

  if (lesson.id === 1) {
    return `
      <div class="definition-grid">
        <article><span>AI</span><h3>Искусственный интеллект</h3><p>Технологии, которые помогают компьютеру распознавать, прогнозировать, создавать и решать задачи.</p></article>
        <article><span>NN</span><h3>Нейросеть</h3><p>Математическая модель из связанных элементов. Она обучается на примерах и ищет закономерности в новых данных.</p></article>
      </div>
      <div class="brain-compare"><div class="brain-icon">◉</div><div><h3>Похожа ли нейросеть на мозг?</h3><p>Связи между искусственными «нейронами» вдохновлены мозгом, но модель не думает и не чувствует: она выполняет вычисления и выбирает вероятный результат.</p></div></div>`;
  }
  return `
    <div class="definition-grid">
      <article><span>01</span><h3>Зачем изучаем</h3><p>На уроке вы разберёте тему «${lesson.title.toLowerCase()}» и свяжете её с собственным проектом.</p></article>
      <article><span>02</span><h3>Как работаем</h3><p>Сначала изучаем идею, затем анализируем пример, выполняем практику и оцениваем результат по критериям.</p></article>
    </div>
    <div class="brain-compare"><div class="brain-icon">✦</div><div><h3>Проектный фокус</h3><p>Результат урока — ${lesson.product}. Сохраняйте промежуточные решения в портфолио: они станут частью итогового проекта.</p></div></div>`;
}

function buildTimeline() {
  if (lesson.id !== 1) return '';
  const points = [
    ['1950-е', 'Первые идеи ИИ', 'Учёные начали обсуждать, может ли машина имитировать отдельные способности человека.'],
    ['1956', 'Термин AI', 'На научной встрече закрепился термин «искусственный интеллект».'],
    ['1990–2000-е', 'Машинное обучение', 'Рост вычислительной мощности и данных сделал обучение моделей практичнее.'],
    ['2010-е', 'Глубокое обучение', 'Многослойные нейросети улучшили распознавание изображений, речи и текста.'],
    ['Сегодня', 'Генеративный ИИ', 'Модели создают тексты, изображения, музыку и видео по запросу.']
  ];
  return `<h3 class="subheading">Короткая история</h3><div class="timeline">${points.map((point, index) => `<button type="button" class="${index === 0 ? 'active' : ''}" data-detail="${point[2]}" aria-pressed="${index === 0}"><b>${point[0]}</b><span>${point[1]}</span></button>`).join('')}</div><div class="timeline-detail" id="timeline-detail" aria-live="polite">${points[0][2]}</div>`;
}

function buildApplicationCards() {
  const labels = lesson.id === 1
    ? [['🎓', 'Образование'], ['⚕', 'Медицина'], ['🚙', 'Транспорт'], ['文', 'Перевод'], ['◈', 'Изображения'], ['♫', 'Музыка и видео'], ['◉', 'Помощники'], ['▥', 'Анализ данных']]
    : lesson.id === 2
      ? [['⌨', 'Текст', 'Запрос пользователя превращается в числа, которые может обработать модель.'], ['◉', 'Изображение', 'Модель ищет признаки: формы, контуры, цвета и их сочетания.'], ['♫', 'Звук', 'Аудиосигнал делится на фрагменты и сравнивается с изученными примерами.'], ['▥', 'Числа', 'Система анализирует показатели и строит прогноз.']]
      : [['◈', 'Наблюдаем', 'Изучаем пример и выделяем важные признаки.'], ['✦', 'Проектируем', `Планируем результат: ${lesson.product}.`], ['↻', 'Улучшаем', 'Сравниваем версии и дорабатываем решение.'], ['✓', 'Проверяем', 'Оцениваем качество, достоверность и безопасность.']];
  return `<div class="use-grid">${labels.map(item => `<article><span>${item[0]}</span><h3>${item[1]}</h3><p>${item[2] || 'Пример применения технологии в повседневной и профессиональной деятельности.'}</p></article>`).join('')}</div>`;
}

function buildLessonActivity() {
  if (lesson.id !== 2) return '';
  const scenarios = [
    ['photo', 'Распознать животное на фото', 'Фотография', 'Модель классификации изображений', 'Название животного и вероятность'],
    ['translate', 'Перевести короткую фразу', 'Текст на русском языке', 'Языковая модель перевода', 'Текст на выбранном языке'],
    ['music', 'Предложить новую музыку', 'История прослушиваний', 'Рекомендательная модель', 'Список подходящих треков']
  ];
  return `<div class="system-lab"><p class="eyebrow">Интерактивная лаборатория</p><h3>Разберите ИИ-систему на части</h3><p>Выберите задачу и проследите путь информации от входа до результата.</p><div class="system-scenarios">${scenarios.map((item, index) => `<button type="button" class="${index === 0 ? 'active' : ''}" data-input="${item[2]}" data-model="${item[3]}" data-output="${item[4]}" aria-pressed="${index === 0}">${item[1]}</button>`).join('')}</div><div class="system-pipeline" id="system-pipeline"><div><small>Вход</small><strong>${scenarios[0][2]}</strong></div><i>→</i><div><small>Модель</small><strong>${scenarios[0][3]}</strong></div><i>→</i><div><small>Выход</small><strong>${scenarios[0][4]}</strong></div></div><p class="system-question"><strong>Вопрос:</strong> где в этой цепочке необходим человек? До запуска он задаёт цель и подбирает данные, а после — проверяет результат.</p></div>`;
}

function buildPracticeFields() {
  if (lesson.id === 2) {
    return `<label>1. Задача системы<textarea class="practice-input" rows="4" spellcheck="true" placeholder="Какую задачу должна решать ваша ИИ-система и для кого?"></textarea></label><label>2. Вход → модель → результат<textarea class="practice-input" rows="4" spellcheck="true" placeholder="Какие данные поступают на вход, что делает модель и что получается на выходе?"></textarea></label><label>3. Контроль человека<textarea class="practice-input" rows="4" spellcheck="true" placeholder="Как проверить точность, безопасность и полезность результата?"></textarea></label>`;
  }
  return `<label>1. Замысел и цель<textarea class="practice-input" rows="4" spellcheck="true" placeholder="Что вы хотите создать и для кого?"></textarea></label><label>2. Ход работы<textarea class="practice-input" rows="4" spellcheck="true" placeholder="Опишите инструменты, запросы и принятые решения."></textarea></label><label>3. Проверка результата<textarea class="practice-input" rows="4" spellcheck="true" placeholder="Что получилось? Что нужно улучшить?"></textarea></label>`;
}

function buildQuiz() {
  if (lesson.id === 2) {
    const questions = [
      ['Что поступает в ИИ-систему на вход?', ['Данные', 'Только готовый ответ', 'Оценка учителя', 'Электрическая схема'], 'Данные', 'На вход поступают данные: текст, изображение, звук или числа.'],
      ['Что такое модель?', ['Обученная система, которая преобразует вход в результат', 'Любой файл на компьютере', 'Только человекоподобный робот', 'Экран приложения'], 'Обученная система, которая преобразует вход в результат', 'Модель находит в данных изученные закономерности и формирует прогноз или ответ.'],
      ['Чем машинное обучение отличается от обычного набора правил?', ['Модель настраивается на примерах', 'Компьютер работает без данных', 'Правила всегда пишет ученик', 'Результат невозможно проверить'], 'Модель настраивается на примерах', 'При машинном обучении параметры модели подбираются на множестве примеров.'],
      ['Какую роль выполняет интерфейс?', ['Помогает человеку передать запрос и увидеть результат', 'Самостоятельно обучает любую модель', 'Заменяет данные', 'Гарантирует абсолютную точность'], 'Помогает человеку передать запрос и увидеть результат', 'Интерфейс связывает пользователя с внутренними компонентами системы.'],
      ['Где находится человек в работе ИИ-системы?', ['Формулирует задачу и проверяет результат', 'Не участвует совсем', 'Только включает компьютер', 'Всегда заменяется моделью'], 'Формулирует задачу и проверяет результат', 'Человек отвечает за цель, качество данных, проверку и решение о применении.'],
      ['Что может быть результатом модели классификации?', ['Название класса и вероятность', 'Только новый компьютер', 'Электрический ток', 'Пароль пользователя'], 'Название класса и вероятность', 'Классификатор определяет наиболее вероятную категорию объекта.'],
      ['Почему результат ИИ может быть неверным?', ['Данные могут быть недостаточными или содержать ошибки', 'Модель всегда знает контекст', 'Интерфейс слишком красивый', 'Потому что алгоритмов не существует'], 'Данные могут быть недостаточными или содержать ошибки', 'Качество модели зависит от данных, постановки задачи и условий применения.'],
      ['Какой порядок описывает работу системы?', ['Входные данные → модель → результат → проверка', 'Результат → данные → случайный ответ', 'Интерфейс → выключение → модель', 'Проверка → отсутствие данных → ответ'], 'Входные данные → модель → результат → проверка', 'Так можно описать базовый цикл работы интеллектуальной системы.']
    ];
    return questions.map(([q, answers, correctText, why]) => ({ q, answers, correctText, why, correct: answers.indexOf(correctText) }));
  }

  const distractorLessons = courseData.lessons.filter(item => item.id !== lesson.id).slice((lesson.id * 3) % 20, (lesson.id * 3) % 20 + 3);
  return [
    { q: 'Какова главная цель этого урока?', answers: shuffle([lesson.goal, ...distractorLessons.map(item => item.goal)]), correctText: lesson.goal, why: `Цель урока — ${lesson.goal}.` },
    { q: 'Какой результат следует добавить в портфолио?', answers: shuffle([lesson.product, ...distractorLessons.map(item => item.product)]), correctText: lesson.product, why: `Практический продукт урока — ${lesson.product}.` },
    { q: `Какое понятие относится к теме «${lesson.title}»?`, answers: shuffle([lesson.terms[0].term, 'случайная величина', 'архивирование файлов', 'табличный процессор']), correctText: lesson.terms[0].term, why: `${lesson.terms[0].term}: ${lesson.terms[0].definition}` },
    { q: 'Что нужно сделать перед использованием важного результата ИИ?', answers: shuffle(['Проверить результат и источники', 'Сразу опубликовать', 'Удалить исходные данные', 'Выбрать самый длинный ответ']), correctText: 'Проверить результат и источники', why: 'Критическая проверка помогает заметить ошибки и недостоверные сведения.' },
    { q: 'Какой подход соответствует проектной работе?', answers: shuffle(['Создать, проверить, получить обратную связь и улучшить', 'Остановиться на первой версии', 'Работать без цели', 'Не сохранять промежуточные результаты']), correctText: 'Создать, проверить, получить обратную связь и улучшить', why: 'Проект развивается через последовательные итерации и обратную связь.' }
  ].map(item => ({ ...item, correct: item.answers.indexOf(item.correctText) }));
}

function shuffle(items) {
  return [...items].sort((a, b) => a.localeCompare(b, 'ru'));
}

const quiz = buildQuiz();

document.querySelector('#lesson-content').innerHTML = `
  <section class="lesson-hero lesson-section" id="intro">
    <div><p class="eyebrow">Модуль ${lesson.module} · Урок ${lesson.id}</p><h1>${lesson.title}</h1><p class="goal"><strong>Цель:</strong> ${lesson.goal}.</p><div class="lesson-meta"><span>◷ ${lesson.duration} минут</span><span>◉ Интерактивный формат</span><span>◆ Портфолио</span></div><button type="button" class="button primary" data-next="theory">Начать урок ↓</button></div>
    <div class="lesson-hero-card"><span class="big-number">${String(lesson.id).padStart(2, '0')}</span><p>Практический результат</p><h2>${lesson.product}</h2></div>
  </section>
  <section class="lesson-section content-section" id="theory">
    <p class="eyebrow">Теория · ${moduleData.title}</p><h2>${lesson.title}</h2><p class="section-lead">Изучите ключевую идею, откройте пояснения и свяжите материал с проектной задачей.</p>
    ${buildTheory()}
    <h3 class="subheading">Маршрут работы</h3>
    <div class="process" id="process">
      <button type="button" data-info="Определите задачу и ожидаемый результат урока."><b>01</b><span>Задача</span></button><i>→</i>
      <button type="button" data-info="Изучите понятия и рассмотрите примеры."><b>02</b><span>Исследование</span></button><i>→</i>
      <button type="button" data-info="Создайте собственный учебный продукт."><b>03</b><span>Практика</span></button><i>→</i>
      <button type="button" data-info="Проверьте результат и сохраните его в портфолио."><b>04</b><span>Результат</span></button>
    </div>
    <div class="process-info" id="process-info" aria-live="polite">Нажмите на этап, чтобы увидеть пояснение.</div>
    ${buildTimeline()}
    <h3 class="subheading">Связь с практикой</h3>${buildApplicationCards()}
    ${buildLessonActivity()}
    <div class="remember"><span>!</span><div><h3>Важно помнить</h3><p>Проверяйте факты, защищайте персональные данные, отмечайте использование ИИ и оценивайте, действительно ли технология помогает решить задачу.</p></div></div>
  </section>
  <section class="lesson-section content-section soft" id="presentation">
    <p class="eyebrow">Встроенная презентация</p><h2>Повторите главное по слайдам</h2><div class="embedded-presentation"><iframe src="presentation.html?lesson=${lesson.id}&embedded=1" title="Презентация к уроку ${lesson.id}" loading="lazy"></iframe></div><a class="button secondary presentation-open" href="presentation.html?lesson=${lesson.id}" target="_blank" rel="noopener">Открыть на весь экран ↗</a>
  </section>
  <section class="lesson-section content-section" id="practice">
    <p class="eyebrow">Практическая работа</p><h2>Создайте: ${lesson.product}</h2><div class="task-card"><p>Выполняйте работу по этапам. Ответы сохраняются автоматически на этом устройстве.</p>
      ${buildPracticeFields()}<small id="save-status" role="status">Ответы сохраняются автоматически</small>
    </div>
    <div class="portfolio-card"><div><p class="eyebrow">Портфолио ученика</p><h3>Сохраните результат урока</h3><p>Добавьте название, описание и при необходимости ссылку на созданную работу.</p></div><label>Название работы<input id="portfolio-title" type="text" maxlength="100" value="${lesson.product}"></label><label>Описание<textarea id="portfolio-description" rows="3" placeholder="Кратко опишите результат и свой вклад."></textarea></label><label>Ссылка на работу<input id="portfolio-link" type="url" inputmode="url" placeholder="https://…"></label><button type="button" class="button primary" id="save-portfolio">Добавить в портфолио</button><p id="portfolio-status" role="status"></p></div>
  </section>
  <section class="lesson-section content-section soft" id="glossary">
    <p class="eyebrow">Словарь новых слов</p><h2>Ключевые понятия урока</h2><div class="glossary-grid">${lesson.terms.map((item, index) => `<details ${index === 0 ? 'open' : ''}><summary>${item.term}</summary><p>${item.definition}</p><label>Моё объяснение<input class="term-note" data-term="${item.term}" type="text" placeholder="Объясните своими словами"></label></details>`).join('')}</div>
  </section>
  <section class="lesson-section content-section" id="quiz">
    <p class="eyebrow">Проверка знаний</p><h2>Тест по уроку</h2><p class="section-lead">${quiz.length} вопросов, один ответ в каждом. Ошибки можно разобрать, а тест — пройти повторно.</p><div class="quiz-card" id="quiz-card" aria-live="polite"></div>
  </section>
  <section class="lesson-section content-section soft" id="finish">
    <p class="eyebrow">Рефлексия «Асык»</p><h2>Выберите состояние после урока</h2><p class="section-lead">Цветной асык поможет быстро зафиксировать, насколько уверенно вы освоили материал.</p>
    <div class="asyk-options"><button type="button" data-value="green"><span>◆</span><b>Зелёный</b><small>Я понял и могу объяснить</small></button><button type="button" data-value="blue"><span>◆</span><b>Синий</b><small>Есть один вопрос</small></button><button type="button" data-value="yellow"><span>◆</span><b>Жёлтый</b><small>Нужна ещё практика</small></button><button type="button" data-value="red"><span>◆</span><b>Красный</b><small>Нужна помощь</small></button></div>
    <label class="reflection-comment">Комментарий<textarea id="reflection-comment" rows="4" spellcheck="true" placeholder="Что получилось и что хотите повторить?"></textarea></label>
    <div class="finish-card"><div class="badge">${lesson.id === 34 ? '★' : '✦'}<span>${lesson.id === 34 ? 'Автор цифрового проекта' : `Шаг ${lesson.id} из 34`}</span></div><div><p class="eyebrow">Завершение</p><h2>Сохранить результат урока?</h2><p>Перед завершением убедитесь, что практика, рефлексия и работа для портфолио сохранены.</p><button type="button" class="button primary" id="complete-lesson">Завершить урок</button></div></div>
    <div class="celebration" id="celebration" tabindex="-1" aria-live="polite"><div>🎉</div><h2>Урок ${lesson.id} завершён!</h2><p>Прогресс сохранён. Можно перейти к следующему этапу программы.</p><div class="lesson-actions">${lesson.id > 1 ? `<a class="button secondary" href="lesson.html?lesson=${lesson.id - 1}">← Предыдущий</a>` : ''}${lesson.id < 34 ? `<a class="button primary" href="lesson.html?lesson=${lesson.id + 1}">Следующий урок →</a>` : `<a class="button primary" href="index.html#progress">Итоги курса</a>`}</div></div>
  </section>`;

const practiceInputs = [...document.querySelectorAll('.practice-input')];
practiceInputs.forEach((input, index) => {
  input.value = state.practice?.[index] || '';
  input.addEventListener('input', savePractice);
});
let saveTimer;
function savePractice() {
  const result = ProgressStore.saveLesson(lesson.id, { practice: practiceInputs.map(input => input.value) });
  const status = document.querySelector('#save-status');
  status.textContent = result.persisted === false ? 'Не удалось сохранить' : 'Сохранено ✓';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { status.textContent = 'Ответы сохраняются автоматически'; }, 1500);
}

document.querySelectorAll('[data-next], .section-dot').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.next || button.dataset.target)?.scrollIntoView({ behavior: 'smooth' })));

document.querySelectorAll('#process button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('#process button').forEach(item => item.setAttribute('aria-pressed', 'false'));
  button.setAttribute('aria-pressed', 'true');
  document.querySelector('#process-info').textContent = button.dataset.info;
}));

document.querySelectorAll('.system-scenarios button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.system-scenarios button').forEach(item => { item.classList.remove('active'); item.setAttribute('aria-pressed', 'false'); });
  button.classList.add('active');
  button.setAttribute('aria-pressed', 'true');
  document.querySelector('#system-pipeline').innerHTML = `<div><small>Вход</small><strong>${button.dataset.input}</strong></div><i>→</i><div><small>Модель</small><strong>${button.dataset.model}</strong></div><i>→</i><div><small>Выход</small><strong>${button.dataset.output}</strong></div>`;
}));

document.querySelectorAll('.timeline button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.timeline button').forEach(item => { item.classList.remove('active'); item.setAttribute('aria-pressed', 'false'); });
  button.classList.add('active'); button.setAttribute('aria-pressed', 'true');
  document.querySelector('#timeline-detail').textContent = button.dataset.detail;
}));

const portfolioEntry = ProgressStore.get().portfolio.find(item => item.lessonId === lesson.id);
if (portfolioEntry) {
  document.querySelector('#portfolio-title').value = portfolioEntry.title || lesson.product;
  document.querySelector('#portfolio-description').value = portfolioEntry.description || '';
  document.querySelector('#portfolio-link').value = portfolioEntry.link || '';
}
document.querySelector('#save-portfolio').addEventListener('click', () => {
  ProgressStore.addPortfolio({ lessonId: lesson.id, lessonTitle: lesson.title, title: document.querySelector('#portfolio-title').value.trim() || lesson.product, description: document.querySelector('#portfolio-description').value.trim(), link: document.querySelector('#portfolio-link').value.trim() });
  document.querySelector('#portfolio-status').textContent = 'Работа добавлена в портфолио ✓';
});

document.querySelectorAll('.term-note').forEach(input => {
  input.value = state.termNotes?.[input.dataset.term] || '';
  input.addEventListener('input', () => {
    const termNotes = Object.fromEntries([...document.querySelectorAll('.term-note')].map(item => [item.dataset.term, item.value]));
    ProgressStore.saveLesson(lesson.id, { termNotes });
  });
});

let quizIndex = 0;
let quizScore = 0;
function renderQuiz() {
  const item = quiz[quizIndex];
  document.querySelector('#quiz-card').innerHTML = `<div class="quiz-head"><span>Вопрос ${quizIndex + 1} из ${quiz.length}</span><span>Верно: ${quizScore}</span></div><div class="quiz-question">${item.q}</div><div class="quiz-options">${item.answers.map((answer, index) => `<button type="button" class="quiz-option" data-index="${index}">${answer}</button>`).join('')}</div><div id="quiz-feedback"></div>`;
  document.querySelectorAll('.quiz-option').forEach(button => button.addEventListener('click', () => answerQuiz(Number(button.dataset.index))));
}
function answerQuiz(choice) {
  const item = quiz[quizIndex];
  if (choice === item.correct) quizScore += 1;
  document.querySelectorAll('.quiz-option').forEach((button, index) => { button.disabled = true; if (index === item.correct) button.classList.add('correct'); else if (index === choice) button.classList.add('wrong'); });
  document.querySelector('#quiz-feedback').innerHTML = `<div class="quiz-explanation"><strong>${choice === item.correct ? 'Верно!' : 'Разберём ответ.'}</strong> ${item.why}</div><button type="button" class="button primary" id="quiz-next">${quizIndex === quiz.length - 1 ? 'Результат' : 'Следующий вопрос →'}</button>`;
  document.querySelector('#quiz-next').addEventListener('click', () => { if (quizIndex < quiz.length - 1) { quizIndex += 1; renderQuiz(); } else showQuizResult(); });
}
function showQuizResult() {
  const best = Math.max(ProgressStore.lesson(lesson.id).bestQuizScore || 0, quizScore);
  ProgressStore.saveLesson(lesson.id, { bestQuizScore: best });
  document.querySelector('#quiz-card').innerHTML = `<div class="quiz-results"><p>Результат</p><div class="quiz-score">${quizScore} / ${quiz.length}</div><p>Лучший результат: ${best} из ${quiz.length}</p><button type="button" class="button primary" id="retry-quiz">Пройти ещё раз</button></div>`;
  document.querySelector('#retry-quiz').addEventListener('click', () => { quizIndex = 0; quizScore = 0; renderQuiz(); });
}
renderQuiz();

const reflectionComment = document.querySelector('#reflection-comment');
reflectionComment.value = state.reflection?.comment || '';
let reflectionValue = state.reflection?.value || '';
document.querySelectorAll('.asyk-options button').forEach(button => {
  button.classList.toggle('active', button.dataset.value === reflectionValue);
  button.setAttribute('aria-pressed', String(button.dataset.value === reflectionValue));
  button.addEventListener('click', () => {
    reflectionValue = button.dataset.value;
    document.querySelectorAll('.asyk-options button').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
    saveReflection();
  });
});
reflectionComment.addEventListener('input', saveReflection);
function saveReflection() { ProgressStore.saveLesson(lesson.id, { reflection: { value: reflectionValue, comment: reflectionComment.value } }); }

const finishCard = document.querySelector('.finish-card');
const celebration = document.querySelector('#celebration');
function showCompleted() { finishCard.hidden = true; celebration.classList.add('show'); }
if (state.completed) showCompleted();
document.querySelector('#complete-lesson').addEventListener('click', () => { ProgressStore.saveLesson(lesson.id, { completed: true, completedAt: new Date().toISOString() }); showCompleted(); celebration.focus(); updateProgress(); });

function updateProgress() {
  const sections = [...document.querySelectorAll('.lesson-section')];
  const current = sections.filter(section => section.getBoundingClientRect().top < innerHeight * 0.55).length;
  const value = ProgressStore.lesson(lesson.id).completed ? 100 : Math.round((current / sections.length) * 90);
  document.querySelector('#lesson-progress-bar').style.width = `${value}%`;
  document.querySelector('#lesson-progress-text').textContent = `${value}%`;
  const active = Math.min(sections.length - 1, Math.max(0, current - 1));
  document.querySelectorAll('.section-dot').forEach((button, index) => { button.classList.toggle('active', index === active); button.setAttribute('aria-current', index === active ? 'step' : 'false'); });
}
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
