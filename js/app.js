const moduleGrid = document.querySelector('#module-grid');
const lessonList = document.querySelector('#lesson-list');

moduleGrid.innerHTML = courseData.modules.map((module, index) => `
  <article class="module-card reveal">
    <div class="module-top"><span class="module-icon">${module.icon}</span><span class="module-number">0${index + 1}</span></div>
    <p class="eyebrow">Модуль ${index + 1}</p><h3>${module.title}</h3><p>${module.description}</p>
    <div class="module-meta"><span>${module.hours} ${module.hours === 4 ? 'часа' : 'часов'}</span><span>${index === 0 ? 'Доступен' : 'Скоро'}</span></div>
  </article>`).join('');

lessonList.innerHTML = courseData.lessons.map((lesson, index) => index === 0 ? `
  <a class="lesson-row active" href="lesson.html"><span class="lesson-index">01</span><span><strong>${lesson}</strong><small>45 минут · интерактивный урок</small></span><span class="status available">Начать →</span></a>` : `
  <div class="lesson-row"><span class="lesson-index">${String(index + 1).padStart(2, '0')}</span><span><strong>${lesson}</strong><small>Урок ${index + 1}</small></span><span class="status">Скоро</span></div>`).join('');

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
