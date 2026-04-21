const LEVELS = {
  error: 0,
  info: 1,
  debug: 2,
};

function resolveLevel(value) {
  const normalized = String(value || "info").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(LEVELS, normalized)
    ? normalized
    : "info";
}

const activeLevelName = resolveLevel(process.env.LOG_LEVEL);
const activeLevelValue = LEVELS[activeLevelName];

function shouldLog(level) {
  return LEVELS[level] <= activeLevelValue;
}

function info(message, ...meta) {
  if (!shouldLog("info")) return;
  console.log(message, ...meta);
}

function debug(message, ...meta) {
  if (!shouldLog("debug")) return;
  console.log(message, ...meta);
}

function error(message, ...meta) {
  if (!shouldLog("error")) return;
  console.error(message, ...meta);
}

module.exports = {
  info,
  debug,
  error,
  level: activeLevelName,
};
