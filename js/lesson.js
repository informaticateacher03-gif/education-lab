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

const saved = ProgressStore.get();
const practiceInputs = [...document.querySelectorAll('.practice-input')];
practiceInputs.forEach((input, index) => { input.value = saved.practice[index] || ''; input.addEventListener('input', () => { ProgressStore.save({ practice: practiceInputs.map(item => item.value) }); const status = document.querySelector('#save-status'); status.textContent = 'Сохранено ✓'; setTimeout(() => status.textContent = 'Ответы сохраняются автоматически', 1200); }); });

document.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => document.querySelector(`#${button.dataset.next}`).scrollIntoView({ behavior: 'smooth' })));
document.querySelectorAll('.section-dot').forEach(button => button.addEventListener('click', () => document.querySelector(`#${button.dataset.target}`).scrollIntoView({ behavior: 'smooth' })));
document.querySelectorAll('#process button').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('#process button').forEach(item => item.classList.remove('active')); button.classList.add('active'); document.querySelector('#process-info').textContent = button.dataset.info; }));
document.querySelectorAll('.timeline button').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.timeline button').forEach(item => item.classList.remove('active')); button.classList.add('active'); document.querySelector('#timeline-detail').textContent = button.dataset.text; }));

let gameIndex = 0;
function renderGame() {
  const game = games[gameIndex];
  document.querySelector('#game-card').innerHTML = `<div class="game-situation">${gameIndex + 1}. ${game.text}</div><div class="game-actions"><button data-answer="true">Используется ИИ</button><button data-answer="false">Не обязательно используется ИИ</button></div><div id="game-feedback"></div>`;
  document.querySelector('#game-dots').innerHTML = games.map((_, index) => `<span class="${index < gameIndex ? 'done' : ''}"></span>`).join('');
  document.querySelectorAll('.game-actions button').forEach(button => button.addEventListener('click', () => {
    const correct = (button.dataset.answer === 'true') === game.ai;
    document.querySelector('.game-actions').remove();
    document.querySelector('#game-feedback').innerHTML = `<div class="game-feedback"><strong>${correct ? 'Верно!' : 'Не совсем.'}</strong> ${game.why}</div><button class="button secondary game-next">${gameIndex === games.length - 1 ? 'Начать заново' : 'Следующая ситуация →'}</button>`;
    document.querySelector('.game-next').addEventListener('click', () => { gameIndex = gameIndex === games.length - 1 ? 0 : gameIndex + 1; renderGame(); });
  }));
}
renderGame();

let quizIndex = 0, quizScore = 0, answered = false;
function renderQuiz() {
  const item = questions[quizIndex]; answered = false;
  document.querySelector('#quiz-card').innerHTML = `<div class="quiz-head"><span>Вопрос ${quizIndex + 1} из ${questions.length}</span><span>Верно: ${quizScore}</span></div><div class="quiz-question">${item.q}</div><div class="quiz-options">${item.a.map((answer, index) => `<button class="quiz-option" data-index="${index}">${answer}</button>`).join('')}</div><div id="quiz-feedback"></div>`;
  document.querySelectorAll('.quiz-option').forEach(button => button.addEventListener('click', () => answerQuiz(Number(button.dataset.index))));
}
function answerQuiz(choice) {
  if (answered) return; answered = true;
  const item = questions[quizIndex]; if (choice === item.correct) quizScore++;
  document.querySelectorAll('.quiz-option').forEach((button, index) => { button.disabled = true; if (index === item.correct) button.classList.add('correct'); else if (index === choice) button.classList.add('wrong'); });
  document.querySelector('#quiz-feedback').innerHTML = `<div class="quiz-explanation"><strong>${choice === item.correct ? 'Правильно!' : 'Разберём ответ.'}</strong> ${item.why}</div><button class="button primary" id="quiz-next">${quizIndex === questions.length - 1 ? 'Узнать результат' : 'Дальше →'}</button>`;
  document.querySelector('#quiz-next').addEventListener('click', () => { if (quizIndex < questions.length - 1) { quizIndex++; renderQuiz(); } else showResults(); });
}
function showResults() {
  const best = Math.max(saved.bestQuizScore || 0, quizScore); ProgressStore.save({ bestQuizScore: best });
  document.querySelector('#quiz-card').innerHTML = `<div class="quiz-results"><p>Ваш результат</p><div class="quiz-score">${quizScore} / ${questions.length}</div><h3>${quizScore >= 7 ? 'Отлично! Тема усвоена.' : quizScore >= 5 ? 'Хороший результат!' : 'Стоит повторить ключевые блоки.'}</h3><p>Лучший результат: ${best} из ${questions.length}</p><button class="button primary" id="retry-quiz">Пройти ещё раз</button></div>`;
  document.querySelector('#retry-quiz').addEventListener('click', () => { quizIndex = 0; quizScore = 0; renderQuiz(); });
}
renderQuiz();

let reflectionValue = saved.reflection?.value || '';
const comment = document.querySelector('#reflection-comment'); comment.value = saved.reflection?.comment || '';
document.querySelectorAll('.reflection-options button').forEach(button => { if (button.dataset.value === reflectionValue) button.classList.add('active'); button.addEventListener('click', () => { document.querySelectorAll('.reflection-options button').forEach(item => item.classList.remove('active')); button.classList.add('active'); reflectionValue = button.dataset.value; saveReflection(); }); });
comment.addEventListener('input', saveReflection);
function saveReflection() { ProgressStore.save({ reflection: { value: reflectionValue, comment: comment.value } }); }

document.querySelector('#complete-lesson').addEventListener('click', () => { ProgressStore.save({ lesson1Completed: true, completedAt: new Date().toISOString() }); document.querySelector('.finish-card').style.display = 'none'; document.querySelector('#celebration').classList.add('show'); updatePageProgress(); confetti(); });
function confetti() { for (let i = 0; i < 30; i++) { const bit = document.createElement('i'); bit.style.cssText = `position:fixed;z-index:50;left:${Math.random()*100}%;top:-20px;width:8px;height:14px;background:hsl(${Math.random()*100+190} 80% 60%);animation:fall ${2+Math.random()*2}s linear forwards`; document.body.append(bit); setTimeout(() => bit.remove(), 4000); } }
const style = document.createElement('style'); style.textContent = '@keyframes fall{to{transform:translateY(105vh) rotate(720deg)}}'; document.head.append(style);
function updatePageProgress() { const sections = [...document.querySelectorAll('.lesson-section')]; const current = sections.filter(section => section.getBoundingClientRect().top < innerHeight * .55).length; const value = ProgressStore.get().lesson1Completed ? 100 : Math.round(current / sections.length * 90); document.querySelector('#lesson-progress-bar').style.width = `${value}%`; document.querySelector('#lesson-progress-text').textContent = `${value}%`; const active = Math.max(0, current - 1); document.querySelectorAll('.section-dot').forEach((button, index) => button.classList.toggle('active', index === active)); }
window.addEventListener('scroll', updatePageProgress, { passive: true }); updatePageProgress();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');
