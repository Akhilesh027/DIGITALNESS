/**
 * redis.js
 * Central Redis & ioredis Connection Factory for Digitalness CRM
 */

let Redis = null;
try {
  Redis = require("ioredis");
} catch (e) {
  console.warn("ioredis not found, fallback active");
}

let redisClient = null;
let isHealthy = false;

/**
 * Derives connection options from REDIS_URL or granular environment variables
 */
function getRedisOptions() {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Mandatory for BullMQ
    enableReadyCheck: false,
    retryStrategy(times) {
      const isProduction = process.env.NODE_ENV === "production";
      if (times > 5 && !isProduction) {
        return null; // Graceful stop in dev without crashing
      }
      return Math.min(times * 150, 3000);
    },
  };
}

/**
 * Returns a shared Redis connection instance for BullMQ queues
 */
function getRedisConnection() {
  if (!Redis) return null;
  if (redisClient) return redisClient;

  const options = getRedisOptions();

  try {
    redisClient = typeof options === "string" ? new Redis(options) : new Redis(options);

    redisClient.on("connect", () => {
      isHealthy = true;
      console.log("✓ Redis connected successfully [BullMQ Ready]");
    });

    redisClient.on("ready", () => {
      isHealthy = true;
    });

    redisClient.on("error", (err) => {
      isHealthy = false;
      // In dev, avoid unhandled spam; in production, surface error
      if (process.env.NODE_ENV === "production") {
        console.error("❌ Redis Connection Error:", err.message);
      }
    });

    redisClient.on("close", () => {
      isHealthy = false;
    });
  } catch (error) {
    isHealthy = false;
    console.warn("⚠️ Redis initialization warning:", error.message);
  }

  return redisClient;
}

/**
 * Creates a new dedicated Redis connection (useful for isolated worker subscriptions)
 */
function createClient() {
  if (!Redis) return null;
  const options = getRedisOptions();
  return typeof options === "string" ? new Redis(options) : new Redis(options);
}

/**
 * Returns true if Redis connection is currently active and healthy
 */
function isRedisHealthy() {
  return isHealthy && redisClient !== null && (redisClient.status === "ready" || redisClient.status === "connect");
}

/**
 * Executes a PING command to verify real connectivity
 */
async function pingRedis() {
  if (!redisClient) {
    getRedisConnection();
  }
  if (!redisClient) return { ok: false, status: "DISCONNECTED", latencyMs: null };

  const start = Date.now();
  try {
    const res = await redisClient.ping();
    const latencyMs = Date.now() - start;
    return { ok: res === "PONG", status: "CONNECTED", latencyMs };
  } catch (err) {
    return { ok: false, status: "ERROR", error: err.message, latencyMs: null };
  }
}

/**
 * Closes the shared Redis connection during server shutdown
 */
async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log("✓ Redis connection closed gracefully.");
    } catch (e) {
      redisClient.disconnect();
    }
    redisClient = null;
    isHealthy = false;
  }
}

module.exports = {
  getRedisConnection,
  createClient,
  isRedisHealthy,
  pingRedis,
  closeRedis,
};
