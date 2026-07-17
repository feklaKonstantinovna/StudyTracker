const userDataRepo = require('../repositories/UserDataRepository');

class GoalsService {
  get(userId) {
    return userDataRepo.get(userId).goals || {};
  }

  set(userId, goals) {
    const data = userDataRepo.get(userId);
    data.goals = goals;
    userDataRepo.set(userId, data);
  }
}

module.exports = new GoalsService();
