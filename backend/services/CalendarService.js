const userDataRepo = require('../repositories/UserDataRepository');

class CalendarService {
  getMonth(userId, year, month) {
    const data      = userDataRepo.get(userId);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days      = [];

    for (let d = 1; d <= totalDays; d++) {
      const key   = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const sched = data.schedules?.[key];
      const dd    = data.dayData?.[key];

      let pct = 0, done = 0, total = 0;

      if (sched) {
        const main = sched.filter(b => !b.isBreak);
        total = main.length;
        done  = main.filter(b => dd?.bd?.[b.id]).length;
        pct   = total ? Math.round(done / total * 100) : 0;
      }

      days.push({ date: key, day: d, pct, done, total, hasData: !!sched });
    }

    return { year, month, days };
  }
}

module.exports = new CalendarService();
