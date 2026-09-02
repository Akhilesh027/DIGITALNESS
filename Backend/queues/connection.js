let Redis = null;
try {
  Redis = require("ioredis");
} catch (e) {
  // ioredis not installed, running in graceful fallback mode
}

let redisConnection = null;
let isRedisConnected = false;

const getRedisConnection = () => {
  if (!Redis) return null;
  if (redisConnection) return redisConnection;

  const redisHost = process.env.REDIS_HOST || "127.0.0.1";
  const redisPort = Number(process.env.REDIS_PORT) || 6379;
  const redisPassword = process.env.REDIS_PASSWORD || undefined;

  try {
    redisConnection = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        if (times > 3) {
          console.log("Redis unavailable. Scheduler running in graceful fallback mode.");
          return null; // Stop retrying to avoid crashing Express
        }
        return Math.min(times * 100, 2000);
      },
    });

    redisConnection.on("connect", () => {
      isRedisConnected = true;
      console.log("Redis connected successfully.");
    });

    redisConnection.on("error", (err) => {
      isRedisConnected = false;
      // Fail silently without crashing Express server
    });
  } catch (error) {
    console.log("Redis initialization error. Fallback active.");
  }

  return redisConnection;
};

const getIsRedisConnected = () => isRedisConnected;

module.exports = { getRedisConnection, getIsRedisConnected };
