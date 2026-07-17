const userDataRepo = require('../repositories/UserDataRepository');

const EMPTY_DD = () => ({ bd: {}, td: {}, bc: {}, tc: {}, ts: {} });

class DayDataService {
  get(userId, date) {
    const data = userDataRepo.get(userId);
    return data.dayData?.[date] || EMPTY_DD();
  }

  set(userId, date, { bd, td, bc, tc, ts }) {
    const data = userDataRepo.get(userId);
    if (!data.dayData) data.dayData = {};
    data.dayData[date] = { bd: bd || {}, td: td || {}, bc: bc || {}, tc: tc || {}, ts: ts || {} };
    userDataRepo.set(userId, data);
  }

  patchBlockDone(userId, date, blockId, done, tasksDone) {
    const data = userDataRepo.get(userId);
    const dd   = this._ensureDay(data, date);
    dd.bd[blockId] = done;
    if (tasksDone && typeof tasksDone === 'object') Object.assign(dd.td, tasksDone);
    userDataRepo.set(userId, data);
  }

  patchTaskDone(userId, date, taskId, done, blockId, blockDone) {
    const data = userDataRepo.get(userId);
    const dd   = this._ensureDay(data, date);
    dd.td[taskId] = done;
    if (blockId !== undefined) dd.bd[blockId] = !!blockDone;
    userDataRepo.set(userId, data);
  }

  patchBlockComment(userId, date, blockId, comment) {
    const data = userDataRepo.get(userId);
    const dd   = this._ensureDay(data, date);
    dd.bc[blockId] = comment;
    userDataRepo.set(userId, data);
  }

  patchTaskComment(userId, date, taskId, comment) {
    const data = userDataRepo.get(userId);
    const dd   = this._ensureDay(data, date);
    dd.tc[taskId] = comment;
    userDataRepo.set(userId, data);
  }

  _ensureDay(data, date) {
    if (!data.dayData) data.dayData = {};
    if (!data.dayData[date]) data.dayData[date] = EMPTY_DD();
    return data.dayData[date];
  }
}

module.exports = new DayDataService();
