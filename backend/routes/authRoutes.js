const router     = require('express').Router();
const ctrl       = require('../controllers/AuthController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/email',   (req, res) => ctrl.sendMagicLink(req, res));
router.get('/verify',   (req, res) => ctrl.verifyMagicLink(req, res));
router.post('/refresh', (req, res) => ctrl.refreshToken(req, res));
router.get('/me',       requireAuth, (req, res) => ctrl.me(req, res));
router.post('/logout',  requireAuth, (req, res) => ctrl.logout(req, res));

module.exports = router;
