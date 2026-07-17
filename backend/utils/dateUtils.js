function toDateKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function isExpired(isoString) {
  return new Date(isoString) < new Date();
}

function addMinutes(ms) {
  return new Date(Date.now() + ms * 60 * 1000).toISOString();
}

function addDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

module.exports = { toDateKey, daysAgo, isExpired, addMinutes, addDays };
