const games = [
  { text: 'Навигатор предлагает самый быстрый маршрут с учётом пробок.', ai: true, why: 'ИИ анализирует множество маршрутов, текущую дорожную ситуацию и прогнозирует время.' },
  { text: 'Калькулятор складывает два введённых числа.', ai: false, why: 'Для сложения достаточно точной заранее заданной формулы.' },
  { text: 'Телефон распознаёт лицо владельца на фотографии.', ai: true, why: 'Распознавание образов обычно выполняет обученная нейросеть.' },
  { text: 'Таймер подаёт сигнал ровно через десять минут.', ai: false, why: 'Это простое правило: отсчитать заданный промежуток времени.' },
  { text: 'Музыкальный сервис рекомендует треки по истории прослушиваний.', ai: true, why: 'Система ищет закономерности во вкусах пользователя и похожих слушателей.' },
  { text: 'Свет включается строго в 18:00 по расписанию.', ai: false, why: 'Фиксированное расписание работает без обучения и прогнозирования.' }
];

const questions = [
  { q: 'Что точнее всего описывает искусственный интеллект?', a: ['Любой компьютер', 'Технологии для решения задач, требующих элементов человеческого мышления', 'Только человекоподобный робот', 'Программа для рисования'], correct: 1, why: 'ИИ — широкая область технологий для распознавания, прогнозирования, создания и других интеллектуальных задач.' },
  { q: 'На чём учится нейросеть?', a: ['На примерах и данных', 'Только на электричестве', 'На случайных ответах', 'Только на командах одного человека'], correct: 0, why: 'Модель получает множество примеров, сравнивает результаты и корректирует свои настройки.' },
  { q: 'Какой этап идёт после обучения в нашей схеме?', a: ['Удаление данных', 'Поиск закономерностей', 'Печать учебника', 'Выключение компьютера'], correct: 1, why: 'Обученная модель использует найденные в данных закономерности для формирования результата.' },
  { q: 'Когда закрепился термин «искусственный интеллект»?', a: ['В 1956 году', 'В 2010 году', 'В 1999 году', 'Вчера'], correct: 0, why: 'Термин AI закрепился на научной встрече в 1956 году.' },
  { q: 'Что стало особенно заметно в 2010-е годы?', a: ['Исчезновение компьютеров', 'Рост глубокого обучения', 'Изобретение калькулятора', 'Отказ от данных'], correct: 1, why: 'Многослойные нейросети и доступные вычисления ускорили развитие глубокого обучения.' },
  { q: 'Где может применяться нейросеть?', a: ['Только в играх', 'Только в школе', 'В образовании, медицине, транспорте и творчестве', 'Нигде в повседневной жизни'], correct: 2, why: 'Нейросети применяются во множестве отраслей для анализа и создания контента.' },
  { q: 'Какое утверждение об ответах нейросети верно?', a: ['Они всегда точны', 'Их нельзя проверять', 'Они могут содержать ошибки', 'Нейросеть знает абсолютно всё'], correct: 2, why: 'Модель может создать правдоподобную, но неверную информацию.' },
  { q: 'Как правильно работать с важным ответом ИИ?', a: ['Сразу публиковать', 'Проверить по надёжным источникам', 'Верить самому длинному ответу', 'Не читать ответ'], correct: 1, why: 'Критическая проверка по авторитетным источникам — обязательное правило ответственной работы.' }
];

const practiceInputs = [...document.querySelectorAll('.practice-input')];
const saveStatus = document.querySelector('#save-status');
let saveStatusTimer;

function showSaveStatus(message, isError = false) {
  saveStatus.textContent = message;
  saveStatus.classList.toggle('save-error', isError);
  clearTimeout(saveStatusTimer);
  if (!isError) {
    saveStatusTimer = setTimeout(() => {
      saveStatus.textContent = 'Ответы сохраняются автоматически';
    }, 1600);
  }
}

function savePractice() {
  const result = ProgressStore.save({ practice: practiceInputs.map(input => input.value) });
  showSaveStatus(result.persisted === false ? 'Не удалось сохранить на этом устройстве' : 'Сохранено ✓', result.persisted === false);
}

const initialProgress = ProgressStore.get();
practiceInputs.forEach((input, index) => {
  input.value = initialProgress.practice[index] || '';
  input.addEventListener('input', savePractice);
});

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('[data-next], .section-dot').forEach(button => {
  button.addEventListener('click', () => scrollToSection(button.dataset.next || button.dataset.target));
});

function createPressedGroup(selector, detailSelector, dataKey) {
  const buttons = [...document.querySelectorAll(selector)];
  buttons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    button.addEventListener('click', () => {
      buttons.forEach(item => {
        item.classList.remove('active');
        item.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      document.querySelector(detailSelector).textContent = button.dataset[dataKey];
    });
    if (index === 0 && !buttons.some(item => item.classList.contains('active'))) {
      button.setAttribute('aria-pressed', 'true');
    }
  });
}

createPressedGroup('#process button', '#process-info', 'info');
createPressedGroup('.timeline button', '#timeline-detail', 'text');

let gameIndex = 0;

function renderGame() {
  const game = games[gameIndex];
  document.querySelector('#game-card').innerHTML = `
    <div class="game-situation" tabindex="-1">${gameIndex + 1}. ${game.text}</div>
    <div class="game-actions">
      <button type="button" data-answer="true">Используется ИИ</button>
      <button type="button" data-answer="false">Не обязательно используется ИИ</button>
    </div>
    <div id="game-feedback"></div>`;
  document.querySelector('#game-dots').innerHTML = games.map((_, index) => `<span class="${index < gameIndex ? 'done' : ''}" aria-hidden="true"></span>`).join('');

  document.querySelectorAll('.game-actions button').forEach(button => {
    button.addEventListener('click', () => {
      const correct = (button.dataset.answer === 'true') === game.ai;
      document.querySelector('.game-actions').remove();
      document.querySelector('#game-feedback').innerHTML = `
        <div class="game-feedback" role="status"><strong>${correct ? 'Верно!' : 'Не совсем.'}</strong> ${game.why}</div>
        <button type="button" class="button secondary game-next">${gameIndex === games.length - 1 ? 'Начать заново' : 'Следующая ситуация →'}</button>`;
      const nextButton = document.querySelector('.game-next');
      nextButton.focus();
      nextButton.addEventListener('click', () => {
        gameIndex = gameIndex === games.length - 1 ? 0 : gameIndex + 1;
        renderGame();
        document.querySelector('.game-situation').focus();
      });
    });
  });
}

renderGame();

let quizIndex = 0;
let quizScore = 0;
let answered = false;

function renderQuiz() {
  const item = questions[quizIndex];
  answered = false;
  document.querySelector('#quiz-card').innerHTML = `
    <div class="quiz-head"><span>Вопрос ${quizIndex + 1} из ${questions.length}</span><span>Верно: ${quizScore}</span></div>
    <div class="quiz-question" id="quiz-question" tabindex="-1">${item.q}</div>
    <div class="quiz-options" aria-labelledby="quiz-question">
      ${item.a.map((answer, index) => `<button type="button" class="quiz-option" data-index="${index}">${answer}</button>`).join('')}
    </div>
    <div id="quiz-feedback"></div>`;
  document.querySelectorAll('.quiz-option').forEach(button => {
    button.addEventListener('click', () => answerQuiz(Number(button.dataset.index)));
  });
}

function answerQuiz(choice) {
  if (answered) return;
  answered = true;
  const item = questions[quizIndex];
  if (choice === item.correct) quizScore += 1;

  document.querySelectorAll('.quiz-option').forEach((button, index) => {
    button.disabled = true;
    if (index === item.correct) button.classList.add('correct');
    else if (index === choice) button.classList.add('wrong');
  });

  document.querySelector('#quiz-feedback').innerHTML = `
    <div class="quiz-explanation" role="status"><strong>${choice === item.correct ? 'Правильно!' : 'Разберём ответ.'}</strong> ${item.why}</div>
    <button type="button" class="button primary" id="quiz-next">${quizIndex === questions.length - 1 ? 'Узнать результат' : 'Дальше →'}</button>`;
  const nextButton = document.querySelector('#quiz-next');
  nextButton.focus();
  nextButton.addEventListener('click', () => {
    if (quizIndex < questions.length - 1) {
      quizIndex += 1;
      renderQuiz();
      document.querySelector('#quiz-question').focus();
    } else {
      showResults();
    }
  });
}

function showResults() {
  const currentBest = ProgressStore.get().bestQuizScore || 0;
  const best = Math.max(currentBest, quizScore);
  ProgressStore.save({ bestQuizScore: best });
  document.querySelector('#quiz-card').innerHTML = `
    <div class="quiz-results" tabindex="-1">
      <p>Ваш результат</p>
      <div class="quiz-score">${quizScore} / ${questions.length}</div>
      <h3>${quizScore >= 7 ? 'Отлично! Тема усвоена.' : quizScore >= 5 ? 'Хороший результат!' : 'Стоит повторить ключевые блоки.'}</h3>
      <p>Лучший результат: ${best} из ${questions.length}</p>
      <button type="button" class="button primary" id="retry-quiz">Пройти ещё раз</button>
    </div>`;
  document.querySelector('.quiz-results').focus();
  document.querySelector('#retry-quiz').addEventListener('click', () => {
    quizIndex = 0;
    quizScore = 0;
    renderQuiz();
    document.querySelector('#quiz-question').focus();
  });
}

renderQuiz();

let reflectionValue = initialProgress.reflection?.value || '';
const comment = document.querySelector('#reflection-comment');
comment.value = initialProgress.reflection?.comment || '';

document.querySelectorAll('.reflection-options button').forEach(button => {
  const selected = button.dataset.value === reflectionValue;
  button.classList.toggle('active', selected);
  button.setAttribute('aria-pressed', String(selected));
  button.addEventListener('click', () => {
    document.querySelectorAll('.reflection-options button').forEach(item => {
      item.classList.remove('active');
      item.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    reflectionValue = button.dataset.value;
    saveReflection();
  });
});

comment.addEventListener('input', saveReflection);

function saveReflection() {
  ProgressStore.save({ reflection: { value: reflectionValue, comment: comment.value } });
}

const finishCard = document.querySelector('.finish-card');
const celebration = document.querySelector('#celebration');

function showCompletedState(animate = false) {
  finishCard.hidden = true;
  celebration.classList.add('show');
  if (animate) {
    celebration.focus();
    launchConfetti();
  }
}

if (initialProgress.lesson1Completed) showCompletedState(false);

document.querySelector('#complete-lesson').addEventListener('click', () => {
  ProgressStore.save({ lesson1Completed: true, completedAt: new Date().toISOString() });
  showCompletedState(true);
  updatePageProgress();
});

function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let index = 0; index < 30; index += 1) {
    const bit = document.createElement('i');
    bit.className = 'confetti-bit';
    bit.style.setProperty('--left', `${Math.random() * 100}%`);
    bit.style.setProperty('--hue', `${Math.random() * 100 + 190}`);
    bit.style.setProperty('--duration', `${2 + Math.random() * 2}s`);
    document.body.append(bit);
    setTimeout(() => bit.remove(), 4200);
  }
}

function updatePageProgress() {
  const sections = [...document.querySelectorAll('.lesson-section')];
  const current = sections.filter(section => section.getBoundingClientRect().top < window.innerHeight * 0.55).length;
  const value = ProgressStore.get().lesson1Completed ? 100 : Math.round((current / sections.length) * 90);
  document.querySelector('#lesson-progress-bar').style.width = `${value}%`;
  document.querySelector('#lesson-progress-text').textContent = `${value}%`;

  const active = Math.min(sections.length - 1, Math.max(0, current - 1));
  document.querySelectorAll('.section-dot').forEach((button, index) => {
    const isActive = index === active;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-current', isActive ? 'step' : 'false');
    if (isActive && window.innerWidth <= 900) button.scrollIntoView({ block: 'nearest', inline: 'center' });
  });
}

let scrollFrame;
window.addEventListener('scroll', () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    updatePageProgress();
    scrollFrame = null;
  });
}, { passive: true });

updatePageProgress();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}
