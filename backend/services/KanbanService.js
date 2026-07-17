const userDataRepo = require('../repositories/UserDataRepository');

class KanbanService {
  getCols(userId) {
    return userDataRepo.get(userId).kanbanCols || [];
  }

  createCol(userId, { id, title, color }) {
    const data = userDataRepo.get(userId);
    if (!data.kanbanCols) data.kanbanCols = [];
    const col = { id: id || 'kc' + Date.now(), title: title.trim(), color: color || '#7c6ff7' };
    data.kanbanCols.push(col);
    userDataRepo.set(userId, data);
    return col;
  }

  updateCol(userId, colId, { title, color }) {
    const data = userDataRepo.get(userId);
    const col  = (data.kanbanCols || []).find(c => c.id === colId);
    if (!col) return null;
    if (title !== undefined) col.title = String(title).trim();
    if (color !== undefined) col.color = String(color);
    userDataRepo.set(userId, data);
    return col;
  }

  deleteCol(userId, colId) {
    const data   = userDataRepo.get(userId);
    const before = data.kanbanCols?.length || 0;
    data.kanbanCols  = (data.kanbanCols  || []).filter(c => c.id !== colId);
    data.kanbanCards = (data.kanbanCards || []).filter(c => c.colId !== colId);
    if (data.kanbanCols.length === before) return false;
    userDataRepo.set(userId, data);
    return true;
  }

  getCards(userId, { date, colId } = {}) {
    let cards = userDataRepo.get(userId).kanbanCards || [];
    if (date)  cards = cards.filter(c => c.dateKey === date || !c.dateKey);
    if (colId) cards = cards.filter(c => c.colId === colId);
    return cards;
  }

  createCard(userId, { id, title, tag, colId, comment, sourceTaskId, dateKey, overdue }) {
    const data = userDataRepo.get(userId);
    if (!data.kanbanCards) data.kanbanCards = [];
    const card = {
      id:           id || 'kc' + Date.now(),
      title:        title.trim(),
      tag:          tag || '',
      colId,
      comment:      comment || '',
      sourceTaskId,
      dateKey,
      overdue:      overdue || false,
    };
    data.kanbanCards.push(card);
    userDataRepo.set(userId, data);
    return card;
  }

  updateCard(userId, cardId, fields) {
    const data = userDataRepo.get(userId);
    const card = (data.kanbanCards || []).find(c => c.id === cardId);
    if (!card) return null;
    const allowed = ['title', 'tag', 'colId', 'comment', 'dateKey', 'overdue', 'prevDate'];
    allowed.forEach(f => { if (fields[f] !== undefined) card[f] = fields[f]; });
    userDataRepo.set(userId, data);
    return card;
  }

  deleteCard(userId, cardId) {
    const data   = userDataRepo.get(userId);
    const before = data.kanbanCards?.length || 0;
    data.kanbanCards = (data.kanbanCards || []).filter(c => c.id !== cardId);
    if (data.kanbanCards.length === before) return false;
    userDataRepo.set(userId, data);
    return true;
  }
}

module.exports = new KanbanService();
