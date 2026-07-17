const userDataRepo = require('../repositories/UserDataRepository');
const { daysAgo, toDateKey } = require('../utils/dateUtils');

class AnalyticsService {
  compute(userId, days) {
    const data     = userDataRepo.get(userId);
    const topicTime = { QA: 0, SQL: 0, English: 0, Anki: 0 };
    const daily    = [];
    let tBlocks = 0, dBlocks = 0, tTasks = 0, dTasks = 0;
    let studyDays = 0, curStr = 0, maxStr = 0;

    for (let i = days - 1; i >= 0; i--) {
      const key   = toDateKey(daysAgo(i));
      const sched = data.schedules?.[key];
      const dd    = data.dayData?.[key];

      if (!sched) { daily.push({ date: key, pct: 0, done: 0, total: 0 }); curStr = 0; continue; }

      const main   = sched.filter(b => !b.isBreak);
      const done   = main.filter(b => dd?.bd?.[b.id]).length;
      const tasks  = sched.flatMap(b => b.tasks || []);
      const dtasks = tasks.filter(t => dd?.td?.[t.id]).length;
      const pct    = main.length ? Math.round(done / main.length * 100) : 0;

      tBlocks += main.length; dBlocks += done;
      tTasks  += tasks.length; dTasks  += dtasks;

      if (pct > 0) { studyDays++; curStr++; } else curStr = 0;
      maxStr = Math.max(maxStr, curStr);

      daily.push({ date: key, pct, done, total: main.length });

      main.forEach(b => {
        if (!dd?.bd?.[b.id]) return;
        const t = b.title.toLowerCase();
        if (t.includes('qa') || t.includes('bible'))           topicTime.QA      += b.dur;
        else if (t.includes('sql'))                            topicTime.SQL     += b.dur;
        else if (t.includes('english') || t.includes('англ')) topicTime.English += b.dur;
        else if (t.includes('anki'))                           topicTime.Anki    += b.dur;
      });
    }

    return {
      days,
      totalBlocks: tBlocks, doneBlocks: dBlocks,
      totalTasks:  tTasks,  doneTasks:  dTasks,
      studyDays,
      currentStreak:  curStr,
      maxStreak:      maxStr,
      pct:            tBlocks ? Math.round(dBlocks / tBlocks * 100) : 0,
      avgBlocksPerDay: studyDays ? Math.round(dBlocks / studyDays * 10) / 10 : 0,
      topicTime,
      daily,
    };
  }
}

module.exports = new AnalyticsService();
