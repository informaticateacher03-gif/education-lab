const ProgressStore = {
  key: 'aiArCourseProgress',
  defaults: { lesson1Completed: false, bestQuizScore: 0, reflection: {}, practice: ['', '', ''] },
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
  percent() { return this.get().lesson1Completed ? 3 : 0; }
};
