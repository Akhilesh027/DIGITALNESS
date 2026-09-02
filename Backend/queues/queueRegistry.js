let Queue = null;
try {
  Queue = require("bullmq").Queue;
} catch (e) {
  // bullmq not installed, running in graceful fallback mode
}
const { getRedisConnection, getIsRedisConnected } = require("./connection");

const queues = {};

const getQueue = (queueName = "scheduled-content") => {
  if (queues[queueName]) return queues[queueName];

  try {
    const connection = getRedisConnection();
    if (connection) {
      queues[queueName] = new Queue(queueName, { connection });
    }
  } catch (error) {
    console.log(`Queue initialization error for ${queueName}. Graceful fallback.`);
  }

  return queues[queueName] || null;
};

module.exports = { getQueue };
