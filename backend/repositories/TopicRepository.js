const userDataRepo = require('./UserDataRepository');

class TopicRepository {
  getAll(userId) {
    return userDataRepo.get(userId)?.topics || [];
  }

  set(userId, topics) {
    const data = userDataRepo.get(userId) || {};
    data.topics = topics;
    userDataRepo.set(userId, data);
  }
}

module.exports = new TopicRepository();
