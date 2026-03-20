const { MongoClient } = require("mongodb");
const SessionService = require("../services/session.service");
class MongoDB {
  static connect = async (uri) => {
    if (this.client) return this.client;
    this.client = await MongoClient.connect(uri);

    const Session = new SessionService(this.client);
    await Session.initIndex();
    return this.client;
  };
}

module.exports = MongoDB;
