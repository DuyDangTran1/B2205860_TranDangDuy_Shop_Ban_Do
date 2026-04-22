const { ObjectId } = require("mongodb");

class ActivityService {
  constructor(client) {
    this.Activity = client.db().collection("Activities");
  }

  async createLog(type, content) {
    const log = {
      type: type,
      content: content,
      created_at: new Date(),
    };
    return await this.Activity.insertOne(log);
  }

  async getRecent(limit = 5) {
    return await this.Activity.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
  }
}

module.exports = ActivityService;
