const kanbanService = require('../services/KanbanService');
const { badRequest } = require('../utils/validation');

class KanbanController {
  getCols(req, res) {
    res.json({ cols: kanbanService.getCols(req.user.id) });
  }

  createCol(req, res) {
    const { id, title, color } = req.body;
    if (!title || typeof title !== 'string') return badRequest(res, 'title обязателен');
    const col = kanbanService.createCol(req.user.id, { id, title, color });
    res.json({ ok: true, col });
  }

  updateCol(req, res) {
    const col = kanbanService.updateCol(req.user.id, req.params.id, req.body);
    if (!col) return res.status(404).json({ error: 'Колонка не найдена' });
    res.json({ ok: true, col });
  }

  deleteCol(req, res) {
    const deleted = kanbanService.deleteCol(req.user.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Колонка не найдена' });
    res.json({ ok: true });
  }

  getCards(req, res) {
    const cards = kanbanService.getCards(req.user.id, { date: req.query.date, colId: req.query.colId });
    res.json({ cards });
  }

  createCard(req, res) {
    const { title, colId } = req.body;
    if (!title || typeof title !== 'string') return badRequest(res, 'title обязателен');
    if (!colId || typeof colId !== 'string') return badRequest(res, 'colId обязателен');
    const card = kanbanService.createCard(req.user.id, req.body);
    res.json({ ok: true, card });
  }

  updateCard(req, res) {
    const card = kanbanService.updateCard(req.user.id, req.params.id, req.body);
    if (!card) return res.status(404).json({ error: 'Карточка не найдена' });
    res.json({ ok: true, card });
  }

  deleteCard(req, res) {
    const deleted = kanbanService.deleteCard(req.user.id, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Карточка не найдена' });
    res.json({ ok: true });
  }
}

module.exports = new KanbanController();
