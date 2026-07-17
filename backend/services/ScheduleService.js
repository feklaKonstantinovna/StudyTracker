const userDataRepo = require('../repositories/UserDataRepository');

class ScheduleService {
  getBlocks(userId, date) {
    const data = userDataRepo.get(userId);
    return data.schedules?.[date] || null;
  }

  setBlocks(userId, date, blocks) {
    const data = userDataRepo.get(userId);
    if (!data.schedules) data.schedules = {};
    data.schedules[date] = blocks;
    userDataRepo.set(userId, data);
  }

  deleteBlocks(userId, date) {
    const data = userDataRepo.get(userId);
    if (data.schedules) delete data.schedules[date];
    userDataRepo.set(userId, data);
  }

  getTemplates(userId) {
    return userDataRepo.get(userId).templates || [];
  }

  createTemplate(userId, name, blocks) {
    const data = userDataRepo.get(userId);
    if (!data.templates) data.templates = [];
    const tpl = { id: 'tpl' + Date.now(), name: name.trim(), blocks, createdAt: new Date().toISOString() };
    data.templates.push(tpl);
    userDataRepo.set(userId, data);
    return tpl;
  }

  deleteTemplate(userId, templateId) {
    const data   = userDataRepo.get(userId);
    const before = data.templates?.length || 0;
    data.templates = (data.templates || []).filter(t => t.id !== templateId);
    if (data.templates.length === before) return false;
    userDataRepo.set(userId, data);
    return true;
  }
}

module.exports = new ScheduleService();
