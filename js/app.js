const moduleGrid = document.querySelector('#module-grid');
const lessonList = document.querySelector('#lesson-list');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'\"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;' })[character]);
}

function safePortfolioLink(value = '') {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

moduleGrid.innerHTML = courseData.modules.map((module, index) => {
  const lessons = courseData.lessons.filter(lesson => lesson.module === index + 1);
  return `<article class="module-card reveal"><div class="module-top"><span class="module-icon">${module.icon}</span><span class="module-number">0${index + 1}</span></div><p class="eyebrow">Модуль ${index + 1}</p><h3>${module.title}</h3><p>${module.description}</p><div class="module-meta"><span>${module.hours} ${module.hours === 4 ? 'часа' : 'часов'}</span><span>${lessons.length} уроков</span></div></article>`;
}).join('');

function renderLessons() {
  const progress = ProgressStore.get();
  lessonList.innerHTML = courseData.lessons.map(lesson => {
    const saved = progress.lessons[String(lesson.id)] || {};
    return `<a class="lesson-row active" href="lesson.html?lesson=${lesson.id}"><span class="lesson-index">${String(lesson.id).padStart(2, '0')}</span><span><strong>${lesson.title}</strong><small>Модуль ${lesson.module} · ${lesson.duration} минут</small></span><span class="status ${saved.completed ? 'completed' : 'available'}">${saved.completed ? 'Завершён ✓' : 'Открыть →'}</span></a>`;
  }).join('');
}

function updateProgress() {
  const progress = ProgressStore.get();
  const value = ProgressStore.percent(courseData.lessons.length);
  const completed = Object.values(progress.lessons).filter(lesson => lesson.completed).length;
  document.querySelector('#progress-value').textContent = `${value}%`;
  document.querySelector('#progress-fill').style.width = `${value}%`;
  document.querySelector('#progress-note').textContent = completed ? `Завершено уроков: ${completed} из ${courseData.lessons.length}. В портфолио: ${progress.portfolio.length}.` : 'Все 34 урока открыты. Начните с первого и сохраняйте работы в портфолио.';
  const continueLink = document.querySelector('#progress .button');
  continueLink.href = `lesson.html?lesson=${Math.min(progress.activeLesson || 1, 34)}`;
  const portfolioPreview = document.querySelector('#portfolio-preview');
  portfolioPreview.innerHTML = progress.portfolio.length
    ? progress.portfolio.map(item => { const link = safePortfolioLink(item.link); return `<article><span>Урок ${Number(item.lessonId)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description || item.lessonTitle)}</p>${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Открыть работу ↗</a>` : `<a href="lesson.html?lesson=${Number(item.lessonId)}#practice">Дополнить запись →</a>`}</article>`; }).join('')
    : '<div class="portfolio-empty"><strong>Портфолио пока пусто</strong><p>Выполните практику урока и нажмите «Добавить в портфолио».</p></div>';
  renderLessons();
}

updateProgress();
window.addEventListener('storage', updateProgress);
window.addEventListener('course-progress', updateProgress);

const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.main-nav');
menuButton.addEventListener('click', () => {
  nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', nav.classList.contains('open'));
});
nav.addEventListener('click', () => nav.classList.remove('open'));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) entry.target.classList.add('visible');
}), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(item => observer.observe(item));

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
