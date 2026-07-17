const calendarService = require('../services/CalendarService');
const { badRequest }  = require('../utils/validation');

class CalendarController {
  getMonth(req, res) {
    const year  = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    if (isNaN(year) || isNaN(month) || month < 0 || month > 11)
      return badRequest(res, 'Неверный год или месяц');
    res.json(calendarService.getMonth(req.user.id, year, month));
  }
}

module.exports = new CalendarController();
