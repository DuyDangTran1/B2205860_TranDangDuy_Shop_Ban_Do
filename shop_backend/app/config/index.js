const config = {
  app: {
    port: process.env.PORT || 3000,
  },
  db: {
    uri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Shop",
  },
  key: {
    secretKey: process.env.secretKey || "h9pX213459903762!45New234",
    geminiKey: process.env.GEMINI_API_KEY,
  },
};

module.exports = config;
