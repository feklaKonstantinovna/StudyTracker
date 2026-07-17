const router = require('express').Router();
const ctrl   = require('../controllers/TelegramController');

router.post('/code',   (req, res) => ctrl.generateCode(req, res));
router.get('/status',  (req, res) => ctrl.getStatus(req, res));
router.post('/unlink', (req, res) => ctrl.unlink(req, res));

module.exports = router;
