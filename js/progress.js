const ProgressStore = {
  key: 'aiArCourseProgress',
  defaults: { lesson1Completed: false, completedLessons: [], bestQuizScore: 0, reflection: {}, practice: ['', '', ''] },
  get() {
    try { return { ...this.defaults, ...JSON.parse(localStorage.getItem(this.key) || '{}') }; }
    catch { return { ...this.defaults }; }
  },
  save(changes) {
    const data = { ...this.get(), ...changes };
    localStorage.setItem(this.key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('course-progress', { detail: data }));
    return data;
  },
  completedCount() {
    const data = this.get();
    return new Set([...(data.completedLessons || []), ...(data.lesson1Completed ? [1] : [])]).size;
  },
  percent() { return Math.round(this.completedCount() / 34 * 100); }
};
