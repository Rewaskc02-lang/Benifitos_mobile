const rateLimitStore = new Map();

// Periodic cleanup of expired rate limit buckets to prevent memory leak
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

cleanupInterval.unref?.();

const createLimiter = ({ windowMs, max, message }) => {
  return (req, res, next) => {
    // If running in a test environment, skip rate limiting to prevent test interference
    if (process.env.NODE_ENV === "test") {
      return next();
    }

    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    const record = rateLimitStore.get(key);
    if (record.resetTime < now) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count++;
    if (record.count > max) {
      return res.status(429).json({ error: message });
    }

    next();
  };
};

module.exports = {
  authLimiter: createLimiter({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 20,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  }),
  assistantLimiter: createLimiter({
    windowMs: 1 * 60 * 1000, // 1 min
    max: 10,
    message: "Too many AI assistant queries. Please try again after a minute.",
  }),
  graphLimiter: createLimiter({
    windowMs: 1 * 60 * 1000, // 1 min
    max: 30,
    message: "Too many graph requests. Please try again after a minute.",
  }),
  profileLimiter: createLimiter({
    windowMs: 1 * 60 * 1000, // 1 min
    max: 15,
    message: "Too many profile updates. Please try again after a minute.",
  }),
};
