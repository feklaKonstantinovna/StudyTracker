const router     = require('express').Router();
const ctrl       = require('../controllers/AuthController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/email',   (req, res) => ctrl.sendMagicLink(req, res));
router.get('/verify',   (req, res) => ctrl.verifyMagicLink(req, res));
router.post('/refresh', (req, res) => ctrl.refreshToken(req, res));
router.get('/me',       requireAuth, (req, res) => ctrl.me(req, res));
router.post('/logout',  requireAuth, (req, res) => ctrl.logout(req, res));
const planCtrl = require('../controllers/PlanController');
router.post('/promo',   requireAuth, (req, res) => planCtrl.activatePromo(req, res));
router.post('/plan',    requireAuth, (req, res) => planCtrl.setPlanManual(req, res));

module.exports = router;
