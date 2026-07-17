function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function validateBlocks(blocks) {
  if (!Array.isArray(blocks)) return false;
  return blocks.every(b => b && typeof b.id === 'string' && typeof b.title === 'string');
}

function badRequest(res, msg) {
  return res.status(400).json({ error: msg });
}

module.exports = { validateEmail, validateDate, validateBlocks, badRequest };
