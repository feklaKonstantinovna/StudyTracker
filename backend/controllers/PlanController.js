const userRepo = require('../repositories/UserRepository');
const funnel = require('../repositories/FunnelRepository');

const PROMO = 'STUDYFLOW-PRO';

class PlanController {
  track(req, res) {
    funnel.bump(req.body?.event);
    res.json({ ok: true });
  }

  activatePromo(req, res) {
    const code = String(req.body?.code || '').trim().toUpperCase();
    if (code !== PROMO) {
      funnel.bump('promo_activate_fail');
      return res.status(400).json({ error: 'invalid_promo' });
    }
    const user = userRepo.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'not_found' });
    if ((user.promoUsed || []).includes(code)) {
      funnel.bump('promo_activate_fail');
      return res.status(400).json({ error: 'promo_used' });
    }
    const until = new Date();
    until.setDate(until.getDate() + 30);
    const updated = userRepo.setPlan(user.id, {
      plan: 'pro',
      proUntil: until.toISOString(),
      source: 'promo',
      promoCode: code,
    });
    funnel.bump('promo_activate_ok');
    res.json({ ok: true, plan: updated.plan, proUntil: updated.proUntil });
  }

  setPlanManual(req, res) {
    const { plan, proUntil } = req.body || {};
    const updated = userRepo.setPlan(req.user.id, {
      plan: plan === 'pro' ? 'pro' : 'free',
      proUntil: proUntil || null,
      source: 'manual',
    });
    if (!updated) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true, plan: updated.plan, proUntil: updated.proUntil });
  }
}

module.exports = new PlanController();
