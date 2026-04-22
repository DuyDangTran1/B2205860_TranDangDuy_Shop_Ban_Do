const { ObjectId } = require("mongodb");
class Session {
  constructor(client) {
    this.Session = client.db().collection("Session");
  }

  extractSessionData(payload) {
    const session = {
      email: payload.email,
      chat_mode: payload.chat_mode,
      refreshToken: payload.refreshToken,
      createdAt: new Date(),
    };

    const lastestProduct = payload.lastestProduct;

    Object.keys(session).forEach(
      (key) => session[key] === undefined && delete session[key],
    );

    if (Array.isArray(lastestProduct) && lastestProduct.length !== 0) {
      session.lastestProduct = lastestProduct;
    }

    return session;
  }

  async initIndex() {
    await this.Session.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 2592000 },
    );
  }

  async create(payload) {
    const session = this.extractSessionData(payload);
    return await this.Session.findOneAndUpdate(
      { email: session.email },
      { $set: session },
      { returnDocument: "after", upsert: true },
    );
  }

  async delete(email) {
    return this.Session.findOneAndDelete({ email: email });
  }

  async find(email) {
    return this.Session.findOne({ email: email });
  }

  async updateMode(email, chat_mode) {
    return await this.Session.updateOne(
      { email: email },
      { $set: { chat_mode: chat_mode } },
    );
  }

  async findRefreshToken(refreshToken) {
    return this.Session.findOne({ refreshToken: refreshToken });
  }

  async updateLastestMessage(email, lastestProduct) {
    return this.Session.findOneAndUpdate(
      { email: email },
      { $set: { lastestProduct: lastestProduct } },
    );
  }
}

module.exports = Session;
