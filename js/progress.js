const ProgressStore = {
  key: 'aiArCourseProgressV2',
  legacyKey: 'aiArCourseProgress',
  defaults: { lessons: {}, portfolio: [], activeLesson: 1 },

  get() {
    try {
      const stored = JSON.parse(localStorage.getItem(this.key) || '{}');
      const data = {
        ...this.defaults,
        ...stored,
        lessons: stored.lessons && typeof stored.lessons === 'object' ? stored.lessons : {},
        portfolio: Array.isArray(stored.portfolio) ? stored.portfolio : []
      };
      return this.migrateLegacy(data);
    } catch {
      return { ...this.defaults, lessons: {}, portfolio: [] };
    }
  },

  migrateLegacy(data) {
    if (data.lessons['1']) return data;
    try {
      const legacy = JSON.parse(localStorage.getItem(this.legacyKey) || '{}');
      if (Object.keys(legacy).length) {
        data.lessons['1'] = {
          completed: Boolean(legacy.lesson1Completed),
          bestQuizScore: Number(legacy.bestQuizScore) || 0,
          practice: Array.isArray(legacy.practice) ? legacy.practice : ['', '', ''],
          reflection: legacy.reflection || {}
        };
      }
    } catch {
      // Ignore invalid data from the previous version.
    }
    return data;
  },

  save(data) {
    const normalized = { ...data, persisted: true };
    try {
      localStorage.setItem(this.key, JSON.stringify(normalized));
    } catch {
      normalized.persisted = false;
    }
    window.dispatchEvent(new CustomEvent('course-progress', { detail: normalized }));
    return normalized;
  },

  lesson(id) {
    return this.get().lessons[String(id)] || {
      completed: false,
      bestQuizScore: 0,
      practice: ['', '', ''],
      reflection: {},
      notes: ''
    };
  },

  saveLesson(id, changes) {
    const data = this.get();
    data.lessons[String(id)] = { ...this.lesson(id), ...changes };
    data.activeLesson = Number(id);
    return this.save(data);
  },

  addPortfolio(entry) {
    const data = this.get();
    const position = data.portfolio.findIndex(item => item.lessonId === entry.lessonId);
    const nextEntry = { ...entry, updatedAt: new Date().toISOString() };
    if (position >= 0) data.portfolio[position] = nextEntry;
    else data.portfolio.push(nextEntry);
    return this.save(data);
  },

  percent(total = 34) {
    const completed = Object.values(this.get().lessons).filter(lesson => lesson.completed).length;
    return Math.round((completed / total) * 100);
  }
};
