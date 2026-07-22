const lessonNumber = Number(document.body.dataset.lesson);
const lessonTitle = courseData.lessons[lessonNumber - 1];
const twoDigits = number => String(number).padStart(2, '0');
const lessonHref = number => number === 1 ? '../../lesson.html' : `../lesson${twoDigits(number)}/`;

document.title = `Урок ${lessonNumber} — ${lessonTitle}`;
document.querySelector('#upcoming-number').textContent = twoDigits(lessonNumber);
document.querySelector('#upcoming-module').textContent = `Модуль ${courseData.modules.findIndex((module, index) => lessonNumber <= courseData.modules.slice(0, index + 1).reduce((sum, item) => sum + item.hours, 0)) + 1}`;
document.querySelector('#upcoming-title').textContent = lessonTitle;
document.querySelector('#resource-kit').innerHTML = courseData.resources.map(resource => `<div class="resource-item"><b>${resource.icon}</b><span>${resource.label}<br><small>Скоро</small></span></div>`).join('');

const previous = document.querySelector('#previous-lesson');
if (lessonNumber > 1) {
  previous.href = lessonHref(lessonNumber - 1);
  previous.innerHTML = `← <span>Урок ${twoDigits(lessonNumber - 1)}</span>`;
} else previous.classList.add('disabled');
const next = document.querySelector('#next-lesson');
if (lessonNumber < courseData.lessons.length) {
  next.href = lessonHref(lessonNumber + 1);
  next.innerHTML = `<span>Урок ${twoDigits(lessonNumber + 1)}</span> →`;
} else next.classList.add('disabled');

if ('serviceWorker' in navigator) navigator.serviceWorker.register('../../service-worker.js');
