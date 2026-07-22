const ProgressStore = {
  key: 'aiArCourseProgress',
  defaults: { lesson1Completed: false, bestQuizScore: 0, reflection: {}, practice: ['', '', ''] },

  get() {
    try {
      const stored = JSON.parse(localStorage.getItem(this.key) || '{}');
      return {
        ...this.defaults,
        ...stored,
        practice: Array.isArray(stored.practice) ? stored.practice.slice(0, 3) : [...this.defaults.practice],
        reflection: stored.reflection && typeof stored.reflection === 'object' ? stored.reflection : {}
      };
    } catch {
      return { ...this.defaults, practice: [...this.defaults.practice] };
    }
  },

  save(changes) {
    const data = { ...this.get(), ...changes, persisted: true };
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch {
      data.persisted = false;
    }
    window.dispatchEvent(new CustomEvent('course-progress', { detail: data }));
    return data;
  },

  percent() {
    return this.get().lesson1Completed ? 3 : 0;
  }
};
