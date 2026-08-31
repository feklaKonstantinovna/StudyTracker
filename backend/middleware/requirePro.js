const userRepo = require('../repositories/UserRepository');

function userIsPro(user) {
  if (!user || user.plan !== 'pro') return false;
  if (!user.proUntil) return true;
  return new Date(user.proUntil) > new Date();
}

function requirePro(req, res, next) {
  const fresh = userRepo.findById(req.user?.id) || req.user;
  if (!userIsPro(fresh)) {
    return res.status(403).json({ error: 'pro_required' });
  }
  req.user = { ...req.user, plan: fresh.plan, proUntil: fresh.proUntil };
  next();
}

module.exports = { requirePro, userIsPro };
