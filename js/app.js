const moduleGrid = document.querySelector('#module-grid');
const lessonList = document.querySelector('#lesson-list');

moduleGrid.innerHTML = courseData.modules.map((module, index) => `
  <article class="module-card reveal">
    <div class="module-top"><span class="module-icon">${module.icon}</span><span class="module-number">0${index + 1}</span></div>
    <p class="eyebrow">Модуль ${index + 1}</p><h3>${module.title}</h3><p>${module.description}</p>
    <div class="module-meta"><span>${module.hours} ${module.hours === 4 ? 'часа' : 'часов'}</span><span>${index === 0 ? 'Доступен' : 'Скоро'}</span></div>
  </article>`).join('');

const firstLessonResourceLinks = ['lesson.html#intro', 'presentation.html', 'lesson.html#practice', 'lesson.html#history', 'lesson.html#practice', 'lesson.html#finish'];
lessonList.innerHTML = courseData.lessons.map((lesson, index) => {
  const number = String(index + 1).padStart(2, '0');
  const href = index === 0 ? 'lesson.html' : `course/lesson${number}/`;
  const resourceButtons = courseData.resources.map((resource, resourceIndex) => `
    <a class="lesson-resource-button ${index === 0 ? '' : 'is-upcoming'}" href="${index === 0 ? firstLessonResourceLinks[resourceIndex] : href}" aria-label="${resource.label}, урок ${index + 1}${index === 0 ? '' : ', скоро'}">
      <span aria-hidden="true">${resource.icon}</span>${resource.label}
    </a>`).join('');
  return `<article class="lesson-row ${index === 0 ? 'active' : ''}">
    <span class="lesson-index">${number}</span>
    <div class="lesson-info"><a class="lesson-title" href="${href}"><strong>${lesson}</strong><small>${index === 0 ? '45 минут · интерактивный урок' : `Урок ${index + 1} · 1 час`}</small></a><div class="lesson-resources">${resourceButtons}</div></div>
    <a class="status ${index === 0 ? 'available' : ''}" href="${href}">${index === 0 ? 'Начать →' : 'Скоро'}</a>
  </article>`;
}).join('');

function updateProgress() {
  const value = ProgressStore.percent();
  document.querySelector('#progress-value').textContent = `${value}%`;
  document.querySelector('#progress-fill').style.width = `${value}%`;
  document.querySelector('#progress-note').textContent = ProgressStore.get().lesson1Completed ? 'Первый урок завершён — отличный старт!' : 'Завершите первый урок, чтобы начать путь.';
}
updateProgress();
window.addEventListener('storage', updateProgress);

const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.main-nav');
menuButton.addEventListener('click', () => { nav.classList.toggle('open'); menuButton.setAttribute('aria-expanded', nav.classList.contains('open')); });
nav.addEventListener('click', () => nav.classList.remove('open'));

const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('visible')), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(item => observer.observe(item));

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
