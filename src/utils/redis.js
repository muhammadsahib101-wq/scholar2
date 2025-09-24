const redis = require("redis");

const redisClient = redis.createClient({
  url: "redis://default:96QgJYqPPXlNrH83yogN8WmAAryeAjjV@redis-19935.c93.us-east-1-3.ec2.redns.redis-cloud.com:19935",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.connect();

module.exports = redisClient;
